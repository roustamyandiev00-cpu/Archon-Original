#!/usr/bin/env bash
# Handmatige PostgreSQL-back-up voor Archon Supabase-project.
# Vereist: pg_dump (PostgreSQL client tools) en DATABASE_URL in de omgeving.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/supabase/backups}"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="$BACKUP_DIR/archon_${STAMP}.sql.gz"

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f "$ROOT_DIR/.env.local" ]]; then
  # shellcheck disable=SC1090
    set -a
    source "$ROOT_DIR/.env.local"
    set +a
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Fout: DATABASE_URL ontbreekt. Zet die in .env.local of exporteer hem." >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "Fout: pg_dump niet gevonden. Installeer PostgreSQL client tools." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
echo "Back-up starten → $OUT_FILE"
pg_dump "$DATABASE_URL" --no-owner --no-privileges --format=plain | gzip -9 > "$OUT_FILE"
echo "Klaar: $OUT_FILE ($(du -h "$OUT_FILE" | awk '{print $1}'))"
