// web/src/app/shared/url.util.ts
import { environment } from '../../environments/environment';

type MutableAgentFields = {
  avatar?: string | null;
  mediaHero?: string | null;
  mediaThumbs?: Array<string | null | undefined>;
  aseguradoras?: Array<string | null | undefined>;
};

/** Devuelve el origin base para construir URLs absolutas cuando sea necesario */
function apiOriginFrom(envApiUrl: string): string {
  // Si apiUrl ya es absoluto, úsalo tal cual (http://... o https://...)
  if (/^https?:\/\//i.test(envApiUrl)) {
    try { return new URL(envApiUrl).origin; } catch { /* fall-through */ }
  }
  // Si no, parte del origin del navegador (proxys de Angular se encargan)
  return window.location.origin;
}

/**
 * Normaliza rutas para que funcionen en dev y prod:
 * - http(s)://..., data:..., assets/...  -> se respetan
 * - public/...                            -> se antepone base (environment.publicUrl o origin)
 * - agents/... | blog/... | cualquier relativa -> /public/<ruta>
 *
 * Siempre retorna string (vacío si no hay input).
 */
export function toPublicUrl(input?: string | null): string {
  const raw = String(input ?? '').trim();
  if (!raw) return '';

  // Absolutas o assets/data URIs: se respetan
  if (/^(https?:|data:)/i.test(raw) || raw.startsWith('assets/')) return raw;

  // Base preferida para /public (puede ser '/public' o 'https://api.dom/public')
  const base = String(environment.publicUrl ?? '/public').replace(/\/+$/, '');

  // Si environment.publicUrl no es absoluto, usamos origin (proxy del front hará el resto)
  const needsOrigin = !/^https?:\/\//i.test(base);
  const origin = apiOriginFrom(environment.apiUrl);

  const clean = raw.replace(/^\/+/, ''); // sin leading slash

  // Ya viene con 'public/...'
  if (clean.startsWith('public/')) {
    // Evita /public/public
    const tail = clean.replace(/^public\//, '');
    return needsOrigin ? `${origin}/public/${tail}` : `${base}/${tail}`;
  }

  // Cualquier relativa → /public/<ruta>
  return needsOrigin ? `${origin}/public/${clean}` : `${base}/${clean}`;
}

/** Aplica normalización de URLs a las propiedades conocidas del agente */
export function mapAgentUrls<T extends object>(a: T): T {
  if (!a) return a;
  const out = { ...(a as any) } as T & MutableAgentFields;

  out.avatar = toPublicUrl(out.avatar ?? undefined);
  out.mediaHero = toPublicUrl(out.mediaHero ?? undefined);

  if (Array.isArray(out.mediaThumbs)) {
    out.mediaThumbs = out.mediaThumbs.map((p) => toPublicUrl(p ?? '')) as any;
  }

  if (Array.isArray(out.aseguradoras)) {
    out.aseguradoras = out.aseguradoras.map((p) => {
      const s = String(p ?? '');
      return /^(https?:|data:)/i.test(s) || s.startsWith('assets/')
        ? s
        : toPublicUrl(s);
    }) as any;
  }

  return out as T;
}
