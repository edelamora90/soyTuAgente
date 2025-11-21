#!/usr/bin/env bash
set -euo pipefail

# Deploy / build "tipo producción" pero en local (Mac)
# - Build web + api
# - Copia el web a un docroot local: .local-docroot
# - No toca PM2, ni nginx, ni permisos de sistema

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_DOCROOT="$ROOT_DIR/.local-docroot"

echo "[LOCAL] Build web + api (Nx, production)…"
cd "$ROOT_DIR"
pnpm nx build web -c production
pnpm nx build api -c production

echo "[LOCAL] Limpiando docroot local: $LOCAL_DOCROOT"
rm -rf "$LOCAL_DOCROOT"
mkdir -p "$LOCAL_DOCROOT"

echo "[LOCAL] Copiando web dist → docroot local…"
if [ -d "$ROOT_DIR/dist/web/browser" ]; then
  cp -R "$ROOT_DIR/dist/web/browser/"* "$LOCAL_DOCROOT/"
else
  cp -R "$ROOT_DIR/dist/web/"* "$LOCAL_DOCROOT/"
fi

cat <<EOF

[LOCAL] Listo ✅

- Frontend estático generado en:
    $LOCAL_DOCROOT

- Para previsualizar el WEB "como en prod":
    npx serve "$LOCAL_DOCROOT" -l 4173

- Para levantar la API compilada (en otra terminal):
    cd "$ROOT_DIR"
    node dist/api/main.js

  La API escuchará normalmente en http://localhost:3000
EOF
