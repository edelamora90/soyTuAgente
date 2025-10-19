#!/usr/bin/env bash
set -euo pipefail

# ===== Config =====
REPO_DIR="/opt/soyTuAgente"
APP_NAME="web"                              # nombre del target Nx
DIST_BASE="$REPO_DIR/dist/$APP_NAME"
DOCROOT="/var/www/consultoriacareve"
BACKUP_DIR="/var/backups/consultoriacareve"
URL_HEALTH="https://consultoriacareve.com"

# Flags por CLI
DRY_RUN=false
NO_BUILD=false
SKIP_BACKUP=false
SKIP_PERMS=false

usage() {
  cat <<EOF
Uso: sudo ./deploy.sh [opciones]

Opciones:
  --dry-run         Modo simulación (no escribe en docroot)
  --no-build        No ejecuta build; usa la carpeta dist existente
  --skip-backup     No genera backup antes de publicar
  --skip-perms      No cambia owner/permissions después de publicar
  -h, --help        Ver esta ayuda
EOF
}

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --no-build) NO_BUILD=true ;;
    --skip-backup) SKIP_BACKUP=true ;;
    --skip-perms) SKIP_PERMS=true ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opción desconocida: $arg"; usage; exit 1 ;;
  esac
done

log()  { echo -e "\033[1;34m[INFO]\033[0m $*"; }
warn() { echo -e "\033[1;33m[WARN]\033[0m $*"; }
err()  { echo -e "\033[1;31m[ERR ]\033[0m $*" >&2; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || { err "Falta comando: $1"; exit 1; }
}

need_cmd rsync
need_cmd curl

# pnpm/nx son necesarios si NO usamos --no-build
if [ "$NO_BUILD" = false ]; then
  need_cmd pnpm
fi

# ===== 1) Build (opcional) =====
if [ "$NO_BUILD" = false ]; then
  log "Ejecutando build de Angular/Nx (production)…"
  pushd "$REPO_DIR" >/dev/null

  # Tip: agrega --skip-nx-cache si te gusta
  pnpm nx build "$APP_NAME" -c production

  popd >/dev/null
else
  warn "Saltando build (usando dist existente) --no-build"
fi

# ===== 2) Detectar carpeta de salida =====
SRC="$DIST_BASE"
if [ -d "$DIST_BASE/browser" ]; then
  SRC="$DIST_BASE/browser"
elif [ -d "$DIST_BASE" ] && [ -f "$DIST_BASE/index.html" ]; then
  SRC="$DIST_BASE"
fi

if [ ! -f "$SRC/index.html" ]; then
  err "No se encontró index.html en $SRC (¿build fallido?)."
  err "Revisa: $DIST_BASE/ y $DIST_BASE/browser/"
  exit 1
fi

log "Carpeta de publicación detectada: $SRC"

# ===== 3) Backup (opcional) =====
timestamp="$(date +%Y%m%d-%H%M%S)"
if [ "$SKIP_BACKUP" = false ]; then
  mkdir -p "$BACKUP_DIR"
  BKP="$BACKUP_DIR/site-$timestamp.tar.gz"
  log "Creando backup del docroot actual → $BKP"
  if [ "$DRY_RUN" = true ]; then
    warn "[dry-run] omitiendo backup real"
  else
    # Si el docroot está vacío no falles
    if [ -d "$DOCROOT" ]; then
      tar -C "$DOCROOT" -czf "$BKP" . 2>/dev/null || true
    fi
  fi
else
  warn "Saltando backup --skip-backup"
fi

# ===== 4) Publicación =====
log "Publicando con rsync → $DOCROOT"
RSYNC_FLAGS=(-av --delete)
[ "$DRY_RUN" = true ] && RSYNC_FLAGS+=(-n)

mkdir -p "$DOCROOT"
rsync "${RSYNC_FLAGS[@]}" "$SRC/" "$DOCROOT/"

# ===== 5) Permisos (opcional) =====
if [ "$SKIP_PERMS" = false ]; then
  log "Aplicando permisos (propietario www-data, 755/644)…"
  if [ "$DRY_RUN" = true ]; then
    warn "[dry-run] omitiendo cambio de permisos real"
  else
    chown -R www-data:www-data "$DOCROOT"
    find "$DOCROOT" -type d -exec chmod 755 {} \;
    find "$DOCROOT" -type f -exec chmod 644 {} \;
  fi
else
  warn "Saltando cambio de permisos --skip-perms"
fi

# ===== 6) Health Check rápido =====
log "Verificando disponibilidad (HEAD) $URL_HEALTH"
set +e
HTTP_CODE="$(curl -s -o /dev/null -w "%{http_code}" "$URL_HEALTH")"
set -e
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
  log "Sitio OK (HTTP $HTTP_CODE)."
else
  warn "Respuesta HTTP $HTTP_CODE. Revisa /var/log/nginx/error.log si no ves el sitio."
fi

log "Deploy finalizado."
