import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  Role,
  Difficulty,
  PuzzleStatus,
  SessionStatus,
  AchievementCode
} from '@prisma/client';
import { prisma, isDatabaseConfigured } from './prisma';

export interface TokenRecord {
  id: number;
  type: 'word' | 'punct' | 'space';
  text: string;
  canonical?: string;
  stem?: string;
  length?: number;
  isStopWord?: boolean;
  isTitle?: boolean;
  isRevealed: boolean;
}

export interface SectionRecord {
  heading: {
    text: string;
    tokens: TokenRecord[];
  } | null;
  paragraphs: {
    tokens: TokenRecord[];
  }[];
}

export interface PuzzleTokenPayload {
  titleTokens: TokenRecord[];
  titleTargetWords: string[];
  sections: SectionRecord[];
  stats: {
    totalWords: number;
    hiddenWords: number;
    stopWordsCount: number;
    paragraphCount: number;
  };
}

export interface StoredUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredUserStats {
  userId: string;
  currentStreak: number;
  maxStreak: number;
  gamesPlayed: number;
  gamesWon: number;
  totalGuesses: number;
  hitGuesses: number;
  accuracyPercentage: number;
  lastPlayedDate: string | null;
}

export interface StoredPuzzle {
  id: string;
  puzzleNumber: number;
  title: string;
  wikipediaUrl: string;
  difficulty: Difficulty;
  status: PuzzleStatus;
  releaseDate: string; // YYYY-MM-DD
  createdBy: string | null;
  createdAt: Date;
  content: {
    summaryLead: string;
    tokenData: PuzzleTokenPayload;
    totalTokensCount: number;
    stopWordsCount: number;
  };
}

export interface StoredGuessLog {
  id: string;
  sessionId: string;
  wordRaw: string;
  normalizedStem: string;
  matchCount: number;
  guessOrder: number;
  createdAt: Date;
}

export interface StoredGameSession {
  id: string;
  userId: string | null;
  puzzleId: string;
  status: SessionStatus;
  guessesCount: number;
  hitsCount: number;
  hintsUsed: number;
  basicHintsUsed: number;
  titleHintUsed: boolean;
  revealedTokenIds: number[];
  durationSeconds: number;
  startedAt: Date;
  completedAt: Date | null;
  guessLogs: StoredGuessLog[];
}

export interface StoredAchievement {
  id: string;
  code: AchievementCode;
  title: string;
  description: string;
  badgeIcon: string;
  requiredThreshold: number;
}

export interface StoredUserAchievement {
  userId: string;
  achievementId: string;
  code: AchievementCode;
  unlockedAt: Date;
}

// Ephemeral per-process HMAC secret for local fallback JWT signing (never hardcoded secret in repo)
const LOCAL_JWT_SECRET =
  process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('vas-')
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : crypto.randomBytes(32).toString('hex');

export function hashPassword(password: string): string {
  const salt = 'redacted-pbkdf2-v1';
  return crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex');
}

export function signLocalJwt(payload: { sub: string; email: string; username: string; role: Role }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', LOCAL_JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyLocalJwt(
  token: string
): { sub: string; email: string; username: string; role: Role } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expectedSig = crypto
      .createHmac('sha256', LOCAL_JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (sig !== expectedSig) return null;
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

class HybridDataStore {
  public users = new Map<string, StoredUser>();
  public userStats = new Map<string, StoredUserStats>();
  public puzzles = new Map<string, StoredPuzzle>();
  public sessions = new Map<string, StoredGameSession>();
  public achievements: StoredAchievement[] = [];
  public userAchievements = new Map<string, StoredUserAchievement[]>();

  constructor() {
    this.seedMemoryStore();
  }

  private seedMemoryStore() {
    // 1. Seed Achievements (matching docs/03-podatkovni-model.md)
    const defaultAchievements: Omit<StoredAchievement, 'id'>[] = [
      {
        code: 'FIRST_WIN',
        title: 'Prva zmaga',
        description: 'Uspešno rešena prva dnevna uganka.',
        badgeIcon: 'Trophy',
        requiredThreshold: 1
      },
      {
        code: 'STREAK_7',
        title: 'Teden brez predaha',
        description: '7 dni zaporednih zmag.',
        badgeIcon: 'Flame',
        requiredThreshold: 7
      },
      {
        code: 'STREAK_30',
        title: 'Mesec zvestobe',
        description: '30 dni zaporednih zmag.',
        badgeIcon: 'Crown',
        requiredThreshold: 30
      },
      {
        code: 'NO_HINTS',
        title: 'Brez pomoči',
        description: 'Zmaga brez uporabe namigov.',
        badgeIcon: 'ShieldCheck',
        requiredThreshold: 1
      },
      {
        code: 'FAST_SOLVER',
        title: 'Hiter reševalec',
        description: 'Zmaga v manj kot 3 minutah (180 s).',
        badgeIcon: 'Zap',
        requiredThreshold: 180
      },
      {
        code: 'HIGH_ACCURACY',
        title: 'Oster strelec',
        description: 'Zmaga z natančnostjo nad 80 %.',
        badgeIcon: 'Target',
        requiredThreshold: 80
      }
    ];

    this.achievements = defaultAchievements.map((a, idx) => ({
      ...a,
      id: `00000000-0000-4000-8000-00000000000${idx + 1}`
    }));

    // 2. Seed Demo Users for all 3 Roles (PLAYER, EDITOR, ADMIN)
    const demoUsers: Array<{
      id: string;
      username: string;
      email: string;
      role: Role;
      streak: number;
      maxStreak: number;
      played: number;
      won: number;
      guesses: number;
      hits: number;
    }> = [
      {
        id: '10000000-0000-4000-8000-000000000001',
        username: 'agent_admin',
        email: 'admin@redacted.si',
        role: 'ADMIN',
        streak: 12,
        maxStreak: 15,
        played: 18,
        won: 17,
        guesses: 420,
        hits: 310
      },
      {
        id: '10000000-0000-4000-8000-000000000002',
        username: 'urednik_vsebin',
        email: 'urednik@redacted.si',
        role: 'EDITOR',
        streak: 7,
        maxStreak: 10,
        played: 12,
        won: 11,
        guesses: 310,
        hits: 215
      },
      {
        id: '10000000-0000-4000-8000-000000000003',
        username: 'kripto_igralec',
        email: 'igralec@redacted.si',
        role: 'PLAYER',
        streak: 5,
        maxStreak: 8,
        played: 9,
        won: 8,
        guesses: 260,
        hits: 175
      }
    ];

    for (const u of demoUsers) {
      this.users.set(u.id, {
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        passwordHash: hashPassword('geslo123'),
        createdAt: new Date('2026-10-01T08:00:00Z'),
        updatedAt: new Date('2026-10-01T08:00:00Z')
      });
      const acc = u.guesses > 0 ? Number(((u.hits / u.guesses) * 100).toFixed(2)) : 0;
      this.userStats.set(u.id, {
        userId: u.id,
        currentStreak: u.streak,
        maxStreak: u.maxStreak,
        gamesPlayed: u.played,
        gamesWon: u.won,
        totalGuesses: u.guesses,
        hitGuesses: u.hits,
        accuracyPercentage: acc,
        lastPlayedDate: '2026-10-02'
      });
    }

    // 3. Load the 5 Wikipedia puzzles from public/puzzles/
    const puzzlesDir = path.resolve(process.cwd(), 'public/puzzles');
    const difficulties: Record<number, Difficulty> = {
      1: 'MEDIUM',
      2: 'EASY',
      3: 'HARD',
      4: 'EASY',
      5: 'MEDIUM'
    };

    for (let num = 1; num <= 5; num++) {
      const filePath = path.join(puzzlesDir, `puzzle-${num}.json`);
      if (!fs.existsSync(filePath)) continue;
      try {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const id = `20000000-0000-4000-8000-00000000000${num}`;
        const status: PuzzleStatus = num === 2 ? 'PUBLISHED' : 'ARCHIVED';
        const firstPara =
          raw.sections?.[0]?.paragraphs?.[0]?.tokens?.map((t: TokenRecord) => t.text).join('') ||
          raw.wikipediaTitle;

        this.puzzles.set(id, {
          id,
          puzzleNumber: num,
          title: raw.wikipediaTitle,
          wikipediaUrl: raw.wikipediaUrl,
          difficulty: difficulties[num] || 'MEDIUM',
          status,
          releaseDate: raw.releaseDateUtc,
          createdBy: '10000000-0000-4000-8000-000000000002',
          createdAt: new Date(`${raw.releaseDateUtc}T00:00:00Z`),
          content: {
            summaryLead: firstPara,
            tokenData: {
              titleTokens: raw.titleTokens,
              titleTargetWords: raw.titleTargetWords,
              sections: raw.sections,
              stats: raw.stats
            },
            totalTokensCount: raw.stats?.totalWords ?? 0,
            stopWordsCount: raw.stats?.stopWordsCount ?? 0
          }
        });
      } catch (err) {
        console.error(`Napaka pri branju uganke puzzle-${num}.json:`, err);
      }
    }

    // 4. Seed sample completed sessions on today's puzzle (#2) for Leaderboard demonstration
    const todayPuzzleId = '20000000-0000-4000-8000-000000000002';
    const sampleLeaderboardSessions: Array<{
      id: string;
      userId: string;
      guessesCount: number;
      hitsCount: number;
      hintsUsed: number;
      durationSeconds: number;
    }> = [
      {
        id: '30000000-0000-4000-8000-000000000001',
        userId: '10000000-0000-4000-8000-000000000001',
        guessesCount: 19,
        hitsCount: 16,
        hintsUsed: 0,
        durationSeconds: 142
      },
      {
        id: '30000000-0000-4000-8000-000000000002',
        userId: '10000000-0000-4000-8000-000000000002',
        guessesCount: 27,
        hitsCount: 20,
        hintsUsed: 1,
        durationSeconds: 215
      },
      {
        id: '30000000-0000-4000-8000-000000000003',
        userId: '10000000-0000-4000-8000-000000000003',
        guessesCount: 34,
        hitsCount: 22,
        hintsUsed: 1,
        durationSeconds: 298
      }
    ];

    for (const s of sampleLeaderboardSessions) {
      this.sessions.set(s.id, {
        id: s.id,
        userId: s.userId,
        puzzleId: todayPuzzleId,
        status: 'WON',
        guessesCount: s.guessesCount,
        hitsCount: s.hitsCount,
        hintsUsed: s.hintsUsed,
        basicHintsUsed: s.hintsUsed,
        titleHintUsed: false,
        revealedTokenIds: [],
        durationSeconds: s.durationSeconds,
        startedAt: new Date(Date.now() - s.durationSeconds * 1000),
        completedAt: new Date(),
        guessLogs: []
      });
    }
  }

  public isUsingDatabase(): boolean {
    return isDatabaseConfigured() && Boolean(prisma);
  }
}

export const store = new HybridDataStore();
