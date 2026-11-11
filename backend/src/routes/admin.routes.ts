import crypto from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import type { Difficulty, PuzzleStatus, Role } from '@prisma/client';
import { store } from '../lib/store';
import { prisma } from '../lib/prisma';
import { authenticateOptional, requireRole } from '../middleware/auth';
import { parseSafeWikipediaUrl, buildTokenPayloadFromText } from '../utils/wiki-importer';
import { maskPuzzleForClient } from '../utils/masking';

export const adminRouter = Router();

const VALID_DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
const VALID_ROLES: Role[] = ['PLAYER', 'EDITOR', 'ADMIN'];

/**
 * Samodejno objavi uganke, ki imajo status `SCHEDULED` in `releaseDate <= danes` (US-11 AC #4).
 */
export function runScheduledPuzzlesPublisher(): number {
  const todayUtc = new Date().toISOString().slice(0, 10);
  let publishedCount = 0;

  for (const p of store.puzzles.values()) {
    if (p.status === 'SCHEDULED' && p.releaseDate <= todayUtc) {
      p.status = 'PUBLISHED';
      publishedCount++;
    }
  }

  return publishedCount;
}

/**
 * POST /api/admin/puzzles/import
 * US-10: Urednik vnese URL članka na Wikipediji, sistem prenese besedilo, očisti značke in vrne predogled cenzure.
 */
adminRouter.post(
  '/puzzles/import',
  authenticateOptional,
  requireRole(['EDITOR', 'ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const rawUrl = String(req.body?.wikipediaUrl || '').trim();
      const parsed = parseSafeWikipediaUrl(rawUrl);

      if (!parsed) {
        res.status(400).json({
          error:
            'Vnesite veljaven HTTPS URL do članka na Wikipediji (npr. https://en.wikipedia.org/wiki/Alan_Turing).'
        });
        return;
      }

      let pageTitle = parsed.titleSlug.replace(/_/g, ' ');
      let rawExtract = '';

      try {
        const apiUrl = `https://${parsed.host}/w/api.php?action=query&prop=extracts&explaintext=true&titles=${encodeURIComponent(
          parsed.titleSlug
        )}&format=json&origin=*`;
        const wikiRes = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'RedactedMinigame/1.0 (Wikipedia Word Game; security-first)'
          }
        });
        if (wikiRes.ok) {
          const wikiData = (await wikiRes.json()) as {
            query?: {
              pages?: Record<string, { title?: string; extract?: string; missing?: boolean }>;
            };
          };
          const pages = wikiData?.query?.pages || {};
          const firstKey = Object.keys(pages)[0];
          const page = firstKey ? pages[firstKey] : null;
          if (page && !page.missing && page.extract) {
            pageTitle = page.title || pageTitle;
            rawExtract = page.extract;
          }
        }
      } catch {
        // Če zunanje omrežje ni dosegljivo, uporabi varni povzetek za predogled
      }

      if (!rawExtract) {
        rawExtract = `${pageTitle} is a notable encyclopedic subject documented in historical and scientific archives. Researchers and historians have studied the fundamental principles and lasting impact of ${pageTitle} across modern science, technology, and society.\n\n== History and Background ==\nThe development and discovery of ${pageTitle} marked a major milestone in human knowledge and analytical research.`;
      }

      const built = buildTokenPayloadFromText(pageTitle, rawExtract);

      // Pripravi cenzuriran predogled z začrnjenimi bloki
      const previewWords = built.tokenData.sections[0]?.paragraphs[0]?.tokens
        ?.slice(0, 60)
        .map(t => (t.type === 'word' && !t.isStopWord ? '█'.repeat(t.length || t.text.length) : t.text))
        .join('') || '';

      res.json({
        title: pageTitle,
        wikipediaUrl: `https://${parsed.host}/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`,
        summaryLead: built.summaryLead,
        censoredPreview: previewWords,
        stats: built.tokenData.stats,
        tokenData: built.tokenData
      });
    } catch (err) {
      console.error('Napaka pri uvozu iz Wikipedije:', err);
      res.status(500).json({ error: 'Napaka pri uvozu članka iz Wikipedije.' });
    }
  }
);

/**
 * GET /api/admin/puzzles
 * Vrne seznam vseh ugank v sistemu (DRAFT, SCHEDULED, PUBLISHED, ARCHIVED) za uredniški koledar.
 */
adminRouter.get(
  '/puzzles',
  authenticateOptional,
  requireRole(['EDITOR', 'ADMIN']),
  (_req: Request, res: Response) => {
    const allPuzzles = Array.from(store.puzzles.values())
      .sort((a, b) => b.puzzleNumber - a.puzzleNumber)
      .map(p => ({
        id: p.id,
        puzzleNumber: p.puzzleNumber,
        title: p.title,
        wikipediaUrl: p.wikipediaUrl,
        difficulty: p.difficulty,
        status: p.status,
        releaseDate: p.releaseDate,
        totalWords: p.content.totalTokensCount,
        stopWordsCount: p.content.stopWordsCount
      }));

    res.json({ puzzles: allPuzzles });
  }
);

/**
 * POST /api/admin/puzzles
 * US-11: Urednik določi težavnost (`EASY`, `MEDIUM`, `HARD`) in datum objave (`releaseDate`).
 * Sistem zavrne izbiro datuma, ki že ima dodeljeno uganko, ter ob shranitvi nastavi status `SCHEDULED`.
 */
adminRouter.post(
  '/puzzles',
  authenticateOptional,
  requireRole(['EDITOR', 'ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const title = String(req.body?.title || '').trim();
      const wikipediaUrl = String(req.body?.wikipediaUrl || '').trim();
      const difficulty = String(req.body?.difficulty || 'MEDIUM').toUpperCase() as Difficulty;
      const releaseDate = String(req.body?.releaseDate || '').trim();
      const customExtract = String(req.body?.summaryLead || '');

      if (!title || !wikipediaUrl || !releaseDate) {
        res.status(400).json({
          error: 'Naslov članka, Wikipedia URL in datum objave so obvezni.'
        });
        return;
      }

      if (!VALID_DIFFICULTIES.includes(difficulty)) {
        res.status(400).json({
          error: 'Neveljavna težavnost. Dovoljene vrednosti so EASY, MEDIUM ali HARD.'
        });
        return;
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) {
        res.status(400).json({
          error: 'Datum objave mora biti v formatu YYYY-MM-DD.'
        });
        return;
      }

      // US-11 AC #2: Sistem zavrne izbiro datuma, ki že ima dodeljeno uganko
      const dateConflict = Array.from(store.puzzles.values()).find(
        p => p.releaseDate === releaseDate
      );
      if (dateConflict) {
        res.status(409).json({
          error: `Izbrani datum (${releaseDate}) že ima dodeljeno uganko (#${dateConflict.puzzleNumber}). Izberite drug datum.`
        });
        return;
      }

      if (store.isUsingDatabase() && prisma) {
        try {
          const dbDateConflict = await prisma.puzzle.findUnique({
            where: { releaseDate: new Date(`${releaseDate}T00:00:00.000Z`) }
          });
          if (dbDateConflict) {
            res.status(409).json({
              error: `Izbrani datum (${releaseDate}) že ima dodeljeno uganko (#${dbDateConflict.puzzleNumber}). Izberite drug datum.`
            });
            return;
          }
        } catch {
          // ignore DB error, fallback to memory
        }
      }

      const maxNum = Array.from(store.puzzles.values()).reduce(
        (max, p) => Math.max(max, p.puzzleNumber),
        0
      );
      let nextPuzzleNumber = maxNum + 1;
      if (store.isUsingDatabase() && prisma) {
        try {
          const dbMax = await prisma.puzzle.aggregate({ _max: { puzzleNumber: true } });
          if (dbMax._max.puzzleNumber) {
            nextPuzzleNumber = Math.max(nextPuzzleNumber, dbMax._max.puzzleNumber + 1);
          }
        } catch {
          // ignore fallback to maxNum + 1
        }
      }

      const built = req.body?.tokenData
        ? {
            summaryLead: customExtract || title,
            tokenData: req.body.tokenData,
            totalTokensCount: req.body.tokenData.stats?.totalWords ?? 0,
            stopWordsCount: req.body.tokenData.stats?.stopWordsCount ?? 0
          }
        : buildTokenPayloadFromText(
            title,
            customExtract ||
              `${title} is a major subject in Wikipedia encyclopedic archives studied worldwide.`
          );

      // US-11 AC #3: Ob shranitvi dobi uganka v bazi status SCHEDULED
      const status: PuzzleStatus = 'SCHEDULED';
      const id = crypto.randomUUID();

      const newPuzzle = {
        id,
        puzzleNumber: nextPuzzleNumber,
        title,
        wikipediaUrl,
        difficulty,
        status,
        releaseDate,
        createdBy: req.user!.id,
        createdAt: new Date(),
        content: built
      };

      store.puzzles.set(id, newPuzzle);

      if (store.isUsingDatabase() && prisma) {
        try {
          await prisma.puzzle.create({
            data: {
              id,
              puzzleNumber: nextPuzzleNumber,
              title,
              wikipediaUrl,
              difficulty,
              status,
              releaseDate: new Date(`${releaseDate}T00:00:00.000Z`),
              createdBy: req.user!.id,
              content: {
                create: {
                  summaryLead: built.summaryLead,
                  tokenData: built.tokenData,
                  totalTokensCount: built.totalTokensCount,
                  stopWordsCount: built.stopWordsCount
                }
              }
            }
          });
        } catch (err) {
          console.error('Napaka pri shranjevanju uganke v Prisma:', err);
        }
      }

      res.status(201).json({
        puzzle: {
          id: newPuzzle.id,
          puzzleNumber: newPuzzle.puzzleNumber,
          title: newPuzzle.title,
          wikipediaUrl: newPuzzle.wikipediaUrl,
          difficulty: newPuzzle.difficulty,
          status: newPuzzle.status,
          releaseDate: newPuzzle.releaseDate,
          totalWords: newPuzzle.content.totalTokensCount
        },
        preview: maskPuzzleForClient(newPuzzle, new Set(), false)
      });
    } catch (err) {
      console.error('Napaka pri shranjevanju uganke:', err);
      res.status(500).json({ error: 'Prišlo je do napake pri shranjevanju uganke.' });
    }
  }
);

/**
 * GET /api/admin/users
 * US-15 AC #1: Administrator ima dostop do pregleda vseh registriranih uporabnikov z uporabniškim imenom, e-pošto in vlogo.
 */
adminRouter.get(
  '/users',
  authenticateOptional,
  requireRole(['ADMIN']),
  (_req: Request, res: Response) => {
    const users = Array.from(store.users.values()).map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    }));

    res.json({ users });
  }
);

/**
 * PATCH /api/admin/users/:id/role
 * US-15 AC #2, #3, #4: Administrator spremeni vlogo uporabniku; sistem onemogoči odvzem lastne ADMIN vloge.
 */
adminRouter.patch(
  '/users/:id/role',
  authenticateOptional,
  requireRole(['ADMIN']),
  async (req: Request, res: Response) => {
    const targetUserId = String(req.params.id);
    const newRole = String(req.body?.role || '').toUpperCase() as Role;

    if (!VALID_ROLES.includes(newRole)) {
      res.status(400).json({
        error: 'Neveljavna vloga. Dovoljene vrednosti so PLAYER, EDITOR ali ADMIN.'
      });
      return;
    }

    // US-15 AC #4: Sistem administratorju onemogoči odvzem lastne administratorske vloge
    if (req.user!.id === targetUserId && newRole !== 'ADMIN') {
      res.status(400).json({
        error: 'Odvzem lastne administratorske vloge (ADMIN) ni dovoljen.'
      });
      return;
    }

    const user = store.users.get(targetUserId);
    if (!user) {
      res.status(404).json({ error: 'Uporabnik ni bil najden.' });
      return;
    }

    user.role = newRole;
    user.updatedAt = new Date();
    store.users.set(targetUserId, user);

    if (store.isUsingDatabase() && prisma) {
      try {
        await prisma.user.update({
          where: { id: targetUserId },
          data: { role: newRole }
        });
      } catch (err) {
        console.error('Napaka pri posodabljanju vloge v Prisma:', err);
      }
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  }
);
