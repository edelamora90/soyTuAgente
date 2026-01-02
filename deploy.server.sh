#!/usr/bin/env bash
set -euo pipefail

# ========= Config =========
SERVER_HOST="104.128.65.191"          # IP o dominio del servidor (usar siempre esta variable)
REMOTE_USER="root"                    # usuario SSH
DOCROOT="/var/www/consultoriacareve"  # docroot que sirve Nginx

# Carpeta local de build (Nx/Angular)
LOCAL_BUILD_DIR="dist/web/browser"

echo "[INFO] Build Angular (web, production)…"
pnpm nx build web -c production

echo "[INFO] Subiendo build al servidor…"
rsync -avz --delete "${LOCAL_BUILD_DIR}/" \
  "${REMOTE_USER}@${SERVER_HOST}:${DOCROOT}/"

# ==== Permisos opcionales (nginx) ====
WEB_USER="www-data"
WEB_GROUP="www-data"

echo "[INFO] Aplicando permisos (propietario ${WEB_USER}:${WEB_GROUP}, 755/644)…"
ssh "${REMOTE_USER}@${SERVER_HOST}" "
  if id ${WEB_USER} >/dev/null 2>&1; then
    chown -R ${WEB_USER}:${WEB_GROUP} '${DOCROOT}' || true
    find '${DOCROOT}' -type d -exec chmod 755 {} \; || true
    find '${DOCROOT}' -type f -exec chmod 644 {} \; || true
  else
    echo '[WARN] Usuario/grupo ${WEB_USER}:${WEB_GROUP} no existen, omitiendo chown'
  fi
"

echo '[OK] Deploy web completado.'
