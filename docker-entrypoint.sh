#!/bin/sh
set -e

echo "========================================================="
echo " [REDACTED Minigame] Zaganjam kontejnersko okolje"
echo "========================================================="

# 1. Preverjanje pripravljenosti PostgreSQL baze
echo "==> Čakam na pripravljenost PostgreSQL podatkovne baze..."
MAX_TRIES=30
COUNT=0

until pg_isready -h postgres -p 5432 -U postgres > /dev/null 2>&1; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $MAX_TRIES ]; then
    echo "==> [OPOZORILO] Čas čakanja na PostgreSQL je potekel. Nadaljujem..."
    break
  fi
  echo "    PostgreSQL še ni pripravljen ($COUNT/$MAX_TRIES) - poskus čez 1s..."
  sleep 1
done

if pg_isready -h postgres -p 5432 -U postgres > /dev/null 2>&1; then
  echo "==> PostgreSQL baza je dosegljiva!"

  echo "==> [Prisma] Sinhronizacija sheme podatkovne baze (prisma db push)..."
  npx prisma db push --skip-generate || true

  echo "==> [Prisma] Polnjenje začetnih podatkov (idempotentni seed)..."
  npx prisma db seed || true
fi

echo "========================================================="
echo " [REDACTED Minigame] Strežnik teče na vratih ${PORT:-3001}"
echo " Odprite: http://localhost:${PORT:-3001}"
echo "========================================================="

exec npm run start
