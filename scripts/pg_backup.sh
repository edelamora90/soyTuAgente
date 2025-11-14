#!/usr/bin/env bash
set -euo pipefail

DB=soyagente
USER=sta_app
HOST=localhost
PASS='Soytuagente123'
OUTDIR='/opt/soyTuAgente/backups/db'
mkdir -p "$OUTDIR"

export PGPASSWORD="$PASS"
STAMP=$(date +%F_%H%M)
pg_dump -h "$HOST" -U "$USER" -d "$DB" -Fc -f "$OUTDIR/${DB}_${STAMP}.dump"

# Mantén solo los últimos 14 respaldos
ls -1t "$OUTDIR"/${DB}_*.dump | tail -n +15 | xargs -r rm -f
