import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';
import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase';
import { prisma } from '../lib/prisma';
import { store, verifyLocalJwt } from '../lib/store';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Izlušči in preveri JWT žeton iz glave `Authorization: Bearer <token>`.
 * Če je žeton veljaven, nastavi `req.user`, sicer nadaljuje kot gost (Guest).
 */
export async function authenticateOptional(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return next();
    }

    // 1. Preveri lokalno podpisani JWT žeton
    const localVerified = verifyLocalJwt(token);
    if (localVerified) {
      const memUser = store.users.get(localVerified.sub);
      req.user = {
        id: localVerified.sub,
        email: memUser?.email ?? localVerified.email,
        username: memUser?.username ?? localVerified.username,
        role: memUser?.role ?? localVerified.role
      };
      return next();
    }

    // 2. Če je nastavljen Supabase Auth, preveri žeton prek Supabase
    if (isSupabaseConfigured() && supabaseAdmin) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data.user) {
        const supaUser = data.user;
        if (store.isUsingDatabase() && prisma) {
          const dbUser = await prisma.user.findUnique({ where: { id: supaUser.id } });
          if (dbUser) {
            req.user = {
              id: dbUser.id,
              email: dbUser.email,
              username: dbUser.username,
              role: dbUser.role
            };
            return next();
          }
        }
        const fallbackUsername =
          (supaUser.user_metadata?.username as string) ||
          supaUser.email?.split('@')[0] ||
          'igralec';
        req.user = {
          id: supaUser.id,
          email: supaUser.email || '',
          username: fallbackUsername,
          role: 'PLAYER'
        };
      }
    }

    return next();
  } catch {
    return next();
  }
}

/**
 * Zahteva prijavljenega uporabnika (vrne 401, če ni prijavljen).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Za dostop do te funkcionalnosti se morate prijaviti.'
    });
    return;
  }
  next();
}

/**
 * Zahteva, da ima prijavljeni uporabnik eno izmed dovoljenih vlog (`PLAYER`, `EDITOR`, `ADMIN`).
 */
export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Za dostop do te funkcionalnosti se morate prijaviti.'
      });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Nimate ustreznih pravic za izvedbo tega dejanja.'
      });
      return;
    }
    next();
  };
}
