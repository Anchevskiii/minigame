import { PrismaClient } from '@prisma/client';

/**
 * Preveri, ali je nastavljen veljaven PostgreSQL DATABASE_URL (in ne vzorčni zapis iz .env.example).
 */
export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL || '';
  return (
    Boolean(url) &&
    url.startsWith('postgresql://') &&
    !url.includes('[GESLO]') &&
    !url.includes('[PROJEKT]')
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient | null = isDatabaseConfigured()
  ? (globalForPrisma.prisma ?? new PrismaClient())
  : null;

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}
