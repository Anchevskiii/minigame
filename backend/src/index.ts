import 'dotenv/config';
import express from 'express';
import { applySecurityMiddleware, apiRateLimiter } from './middleware/security';
import { authRouter } from './routes/auth.routes';
import { gameRouter } from './routes/game.routes';
import { statsRouter } from './routes/stats.routes';
import { leaderboardRouter } from './routes/leaderboard.routes';
import { adminRouter, runScheduledPuzzlesPublisher } from './routes/admin.routes';
import { store } from './lib/store';

export function createApp() {
  const app = express();

  applySecurityMiddleware(app);
  app.use(express.json({ limit: '2mb' }));
  app.use('/api', apiRateLimiter);

  // Zdravstveni pregled strežnika
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'redacted-backend-api',
      antiCheatMasking: true,
      databaseMode: store.isUsingDatabase() ? 'postgresql-prisma' : 'safe-local-hybrid'
    });
  });

  // Končne točke po arhitekturi (docs/04-arhitektura-in-tehnoloski-sklad.md)
  app.use('/api/auth', authRouter);
  app.use('/api/game', gameRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api', leaderboardRouter);
  app.use('/api/admin', adminRouter);

  return app;
}

const PORT = Number(process.env.PORT) || 3001;

// Če datoteka ni uvožena samo za avtomatske teste, zaženi strežnik in 00:00 UTC razporejevalnik
if (process.env.NODE_ENV !== 'test') {
  const app = createApp();

  // US-11 AC #4: Samodejna objava načrtovanih ugank ob polnoči (00:00 UTC)
  setInterval(() => {
    runScheduledPuzzlesPublisher();
  }, 60 * 1000);

  app.listen(PORT, () => {
    console.log(`[REDACTED Backend API] Strežnik posluša na http://localhost:${PORT}`);
  });
}
