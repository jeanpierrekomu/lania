#!/usr/bin/env bash
# Copia de seguridad cifrada de la base de LANIA (la usa .github/workflows/backup.yml cada día).
#
#   DATABASE_URL=postgresql://…  BACKUP_PASSPHRASE=…  scripts/backup_db.sh [carpeta_destino]
#
# Guarda: esquema y datos de `public` (todo lo de la app), el registro de migraciones y las cuentas
# de `auth.users` (necesarias para restaurar porque `public` las referencia). El archivo sale cifrado
# con AES-256 (gpg simétrico): sin la frase BACKUP_PASSPHRASE no se puede leer.
# Restaurar: ver docs/operations/deploy-piloto.md → «Si algo se cae».
set -euo pipefail

: "${DATABASE_URL:?Falta DATABASE_URL}"
: "${BACKUP_PASSPHRASE:?Falta BACKUP_PASSPHRASE}"
OUT_DIR="${1:-backups}"
STAMP="$(date -u +%Y-%m-%d_%H%M)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
URL="${DATABASE_URL/postgresql+psycopg:\/\//postgresql://}"

{
  echo "-- LANIA backup $STAMP UTC · restaurar en un proyecto Supabase NUEVO y vacío (ver deploy-piloto.md)"
  echo "-- 1) Cuentas primero: las tablas de public las referencian."
  pg_dump "$URL" --no-owner --no-privileges --data-only --table=auth.users
  echo "-- 2) Tablas, datos y funciones de la app. El audio sintetizado (tts_cache) se regenera solo."
  pg_dump "$URL" --no-owner --no-privileges --schema=public --schema=supabase_migrations \
    --exclude-table-data=public.tts_cache |
    # En Supabase el esquema public siempre existe: no se vuelve a crear.
    sed -e '/^CREATE SCHEMA public;$/d' -e '/^COMMENT ON SCHEMA public /d' \
      -e 's/^CREATE SCHEMA supabase_migrations;$/CREATE SCHEMA IF NOT EXISTS supabase_migrations;/'
} > "$WORK/lania.sql"

# Comprobación mínima: que la copia traiga tablas y datos de verdad (si no, falla el job y te avisa GitHub).
grep -q "CREATE TABLE public.profiles" "$WORK/lania.sql"
grep -q "COPY public.exercise_items" "$WORK/lania.sql"

mkdir -p "$OUT_DIR"
gzip -9 "$WORK/lania.sql"
gpg --batch --yes --quiet --pinentry-mode loopback --symmetric --cipher-algo AES256 \
  --passphrase "$BACKUP_PASSPHRASE" -o "$OUT_DIR/lania-$STAMP.sql.gz.gpg" "$WORK/lania.sql.gz"
echo "Copia lista: $OUT_DIR/lania-$STAMP.sql.gz.gpg ($(du -h "$OUT_DIR/lania-$STAMP.sql.gz.gpg" | cut -f1))"
