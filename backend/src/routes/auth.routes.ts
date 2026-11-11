import crypto from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase';
import { prisma } from '../lib/prisma';
import { store, hashPassword, signLocalJwt } from '../lib/store';
import { authenticateOptional, requireAuth } from '../middleware/auth';
import { authRateLimiter } from '../middleware/security';

export const authRouter = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 * US-06: Obrazec za registracijo zahteva veljaven e-poštni naslov, unikatno uporabniško ime in geslo z najmanj 6 znaki.
 */
authRouter.post('/register', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');

    if (!email || !EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: 'Vnesite veljaven elektronski naslov.' });
      return;
    }

    if (!username || username.length < 3 || username.length > 50) {
      res.status(400).json({
        error: 'Uporabniško ime mora vsebovati med 3 in 50 znakov.'
      });
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({
        error: 'Geslo mora vsebovati najmanj 6 znakov.'
      });
      return;
    }

    // Preveri unikatnost uporabniškega imena in e-pošte v spominu in bazi
    for (const existing of store.users.values()) {
      if (existing.username.toLowerCase() === username.toLowerCase()) {
        res.status(409).json({
          error: 'Izbrano uporabniško ime je že zasedeno. Izberite drugega.'
        });
        return;
      }
      if (existing.email.toLowerCase() === email) {
        res.status(409).json({
          error: 'Uporabnik s tem elektronskim naslovom že obstaja.'
        });
        return;
      }
    }

    if (store.isUsingDatabase() && prisma) {
      const existingDb = await prisma.user.findFirst({
        where: {
          OR: [{ username }, { email }]
        }
      });
      if (existingDb) {
        const msg =
          existingDb.username.toLowerCase() === username.toLowerCase()
            ? 'Izbrano uporabniško ime je že zasedeno. Izberite drugega.'
            : 'Uporabnik s tem elektronskim naslovom že obstaja.';
        res.status(409).json({ error: msg });
        return;
      }
    }

    let userId: string = crypto.randomUUID();

    // Če je nastavljen Supabase Auth, ustvari uporabnika tudi v auth.users
    if (isSupabaseConfigured() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username }
      });
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }
      if (data.user) {
        userId = data.user.id;
      }
    }

    // Zapiši v PostgreSQL bazo prek Prisma ORM, če je baza povezana
    if (store.isUsingDatabase() && prisma) {
      await prisma.user.create({
        data: {
          id: userId,
          username,
          email,
          role: 'PLAYER',
          stats: {
            create: {
              currentStreak: 0,
              maxStreak: 0,
              gamesPlayed: 0,
              gamesWon: 0,
              totalGuesses: 0,
              hitGuesses: 0,
              accuracyPercentage: 0
            }
          }
        }
      });
    }

    const now = new Date();
    const newUser = {
      id: userId,
      username,
      email,
      role: 'PLAYER' as const,
      passwordHash: hashPassword(password),
      createdAt: now,
      updatedAt: now
    };
    store.users.set(userId, newUser);
    store.userStats.set(userId, {
      userId,
      currentStreak: 0,
      maxStreak: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      totalGuesses: 0,
      hitGuesses: 0,
      accuracyPercentage: 0,
      lastPlayedDate: null
    });

    const token = signLocalJwt({
      sub: userId,
      email,
      username,
      role: 'PLAYER'
    });

    res.status(201).json({
      token,
      user: {
        id: userId,
        username,
        email,
        role: 'PLAYER'
      }
    });
  } catch (err) {
    console.error('Napaka pri registraciji:', err);
    res.status(500).json({ error: 'Prišlo je do napake pri registraciji uporabnika.' });
  }
});

/**
 * POST /api/auth/login
 * US-06: Prijava z elektronskim naslovom (ali uporabniškim imenom) in geslom, ki nastavi varno JWT sejo.
 */
authRouter.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const identifier = String(req.body?.email || req.body?.identifier || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!identifier || !password) {
      res.status(400).json({ error: 'Vnesite elektronski naslov in geslo.' });
      return;
    }

    // Poišči uporabnika po e-pošti ali uporabniškem imenu
    let matchedUser = Array.from(store.users.values()).find(
      u => u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier
    );

    if (!matchedUser && store.isUsingDatabase() && prisma) {
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { username: identifier }]
        }
      });
      if (dbUser) {
        matchedUser = {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          role: dbUser.role,
          createdAt: dbUser.createdAt,
          updatedAt: dbUser.updatedAt
        };
      }
    }

    if (!matchedUser) {
      res.status(401).json({ error: 'Napačen elektronski naslov ali geslo.' });
      return;
    }

    if (isSupabaseConfigured() && supabaseAdmin && !matchedUser.passwordHash) {
      const { error } = await supabaseAdmin.auth.signInWithPassword({
        email: matchedUser.email,
        password
      });
      if (error) {
        res.status(401).json({ error: 'Napačen elektronski naslov ali geslo.' });
        return;
      }
    } else if (matchedUser.passwordHash) {
      const incomingHash = hashPassword(password);
      if (incomingHash !== matchedUser.passwordHash) {
        res.status(401).json({ error: 'Napačen elektronski naslov ali geslo.' });
        return;
      }
    }

    const token = signLocalJwt({
      sub: matchedUser.id,
      email: matchedUser.email,
      username: matchedUser.username,
      role: matchedUser.role
    });

    res.json({
      token,
      user: {
        id: matchedUser.id,
        username: matchedUser.username,
        email: matchedUser.email,
        role: matchedUser.role
      }
    });
  } catch (err) {
    console.error('Napaka pri prijavi:', err);
    res.status(500).json({ error: 'Prišlo je do napake pri prijavi.' });
  }
});

/**
 * GET /api/auth/me
 * Vrne podatke o trenutno prijavljenem uporabniku.
 */
authRouter.get('/me', authenticateOptional, requireAuth, async (req: Request, res: Response) => {
  res.json({ user: req.user });
});
