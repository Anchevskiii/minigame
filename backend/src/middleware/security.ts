import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { Express } from 'express';

/**
 * Konfigurira varnostne HTTP glave, CORS in omejevanje zahtevkov (Rate Limiting).
 */
export function applySecurityMiddleware(app: Express): void {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  );

  const allowedOrigin = process.env.CORS_ORIGIN || true;
  app.use(
    cors({
      origin: allowedOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );
}

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuta
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Preveč zahtevkov. Prosimo, poskusite znova čez nekaj trenutkov.' }
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Preveč poskusov prijave. Prosimo, počakajte nekaj minut.' }
});
