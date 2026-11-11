import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient, AchievementCode, Difficulty, PuzzleStatus, Role } from '@prisma/client';

const prisma = new PrismaClient();

const INITIAL_ACHIEVEMENTS = [
  {
    code: AchievementCode.FIRST_WIN,
    title: 'Prva zmaga',
    description: 'Uspešno dešifriraj svoj prvi cenzurirani članek.',
    badgeIcon: 'Trophy',
    requiredThreshold: 1
  },
  {
    code: AchievementCode.STREAK_7,
    title: 'Teden brez predaha',
    description: 'Dosezi niz 7 zaporednih dni z zmago.',
    badgeIcon: 'Flame',
    requiredThreshold: 7
  },
  {
    code: AchievementCode.STREAK_30,
    title: 'Mesec zvestobe',
    description: 'Dosezi niz 30 zaporednih dni z zmago.',
    badgeIcon: 'Crown',
    requiredThreshold: 30
  },
  {
    code: AchievementCode.NO_HINTS,
    title: 'Brez pomoči',
    description: 'Reši dnevno uganko brez uporabe kateregakoli namiga.',
    badgeIcon: 'ShieldCheck',
    requiredThreshold: 1
  },
  {
    code: AchievementCode.FAST_SOLVER,
    title: 'Hiter reševalec',
    description: 'Ugani naslov članka v manj kot 3 minutah (180 sekundah).',
    badgeIcon: 'Zap',
    requiredThreshold: 180
  },
  {
    code: AchievementCode.HIGH_ACCURACY,
    title: 'Oster strelec',
    description: 'Zaključi igro z natančnostjo ugibanj nad 80 %.',
    badgeIcon: 'Target',
    requiredThreshold: 80
  }
];

async function main() {
  console.log('Začenjam polnjenje podatkovne baze (Prisma Seed)...');

  // 1. Demo Uporabniki za vse 3 vloge (PLAYER, EDITOR, ADMIN)
  const demoUsers = [
    {
      id: '10000000-0000-4000-8000-000000000001',
      username: 'agent_admin',
      email: 'admin@redacted.si',
      role: Role.ADMIN,
      currentStreak: 12,
      maxStreak: 15,
      gamesPlayed: 18,
      gamesWon: 17,
      totalGuesses: 420,
      hitGuesses: 310,
      accuracyPercentage: 73.81
    },
    {
      id: '10000000-0000-4000-8000-000000000002',
      username: 'urednik_vsebin',
      email: 'urednik@redacted.si',
      role: Role.EDITOR,
      currentStreak: 7,
      maxStreak: 10,
      gamesPlayed: 12,
      gamesWon: 11,
      totalGuesses: 310,
      hitGuesses: 215,
      accuracyPercentage: 69.35
    },
    {
      id: '10000000-0000-4000-8000-000000000003',
      username: 'kripto_igralec',
      email: 'igralec@redacted.si',
      role: Role.PLAYER,
      currentStreak: 5,
      maxStreak: 8,
      gamesPlayed: 9,
      gamesWon: 8,
      totalGuesses: 260,
      hitGuesses: 175,
      accuracyPercentage: 67.31
    }
  ];

  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        username: u.username,
        email: u.email,
        role: u.role
      },
      create: {
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        stats: {
          create: {
            currentStreak: u.currentStreak,
            maxStreak: u.maxStreak,
            gamesPlayed: u.gamesPlayed,
            gamesWon: u.gamesWon,
            totalGuesses: u.totalGuesses,
            hitGuesses: u.hitGuesses,
            accuracyPercentage: u.accuracyPercentage
          }
        }
      }
    });
  }

  // 2. Dosežki
  for (const ach of INITIAL_ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: {
        title: ach.title,
        description: ach.description,
        badgeIcon: ach.badgeIcon,
        requiredThreshold: ach.requiredThreshold
      },
      create: ach
    });
  }

  const puzzlesDir = path.resolve(process.cwd(), 'public/puzzles');
  const difficulties: Record<number, Difficulty> = {
    1: Difficulty.MEDIUM,
    2: Difficulty.EASY,
    3: Difficulty.HARD,
    4: Difficulty.EASY,
    5: Difficulty.MEDIUM
  };

  for (let num = 1; num <= 5; num++) {
    const filePath = path.join(puzzlesDir, `puzzle-${num}.json`);
    if (!fs.existsSync(filePath)) continue;

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const status = num === 2 ? PuzzleStatus.PUBLISHED : PuzzleStatus.ARCHIVED;

    const firstParagraph = raw.sections?.[0]?.paragraphs?.[0]?.tokens
      ?.map((t: { text: string }) => t.text)
      .join('') || raw.wikipediaTitle;

    const puzzleId = `20000000-0000-4000-8000-00000000000${num}`;
    const createdPuzzle = await prisma.puzzle.upsert({
      where: { puzzleNumber: num },
      update: {
        id: puzzleId,
        title: raw.wikipediaTitle,
        wikipediaUrl: raw.wikipediaUrl,
        difficulty: difficulties[num] ?? Difficulty.MEDIUM,
        status,
        createdBy: '10000000-0000-4000-8000-000000000002'
      },
      create: {
        id: puzzleId,
        puzzleNumber: num,
        title: raw.wikipediaTitle,
        wikipediaUrl: raw.wikipediaUrl,
        difficulty: difficulties[num] ?? Difficulty.MEDIUM,
        status,
        releaseDate: new Date(`${raw.releaseDateUtc}T00:00:00.000Z`),
        createdBy: '10000000-0000-4000-8000-000000000002'
      }
    });

    await prisma.puzzleContent.upsert({
      where: { puzzleId: createdPuzzle.id },
      update: {
        summaryLead: firstParagraph,
        tokenData: {
          titleTokens: raw.titleTokens,
          titleTargetWords: raw.titleTargetWords,
          sections: raw.sections,
          stats: raw.stats
        },
        totalTokensCount: raw.stats?.totalWords ?? 0,
        stopWordsCount: raw.stats?.stopWordsCount ?? 0
      },
      create: {
        puzzleId: createdPuzzle.id,
        summaryLead: firstParagraph,
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
  }

  console.log('Polnjenje podatkovne baze uspešno zaključeno.');
}

main()
  .catch(err => {
    console.error('Napaka pri izvajanju seed skripte:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
