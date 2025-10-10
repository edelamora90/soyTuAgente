// web/src/app/shared/url.util.ts
import { environment } from '../../enviroments/enviroment';

type MutableAgentFields = {
  avatar?: string | null;
  mediaHero?: string | null;
  mediaThumbs?: Array<string | null>;
  aseguradoras?: string[];
};

function apiOriginFrom(envApiUrl: string): string {
  try {
    const u = new URL(envApiUrl, window.location.origin);
    return u.origin;
  } catch {
    return window.location.origin;
  }
}

export function toPublicUrl(path?: string | null): string | null {
  const raw = String(path ?? '').trim();
  if (!raw) return null;

  if (/^(https?:|data:)/i.test(raw) || raw.startsWith('assets/')) return raw;

  const origin = apiOriginFrom(environment.apiUrl);
  const clean = raw.replace(/^\/+/, '');

  if (clean.startsWith('public/')) return `${origin}/${clean}`;
  if (clean.startsWith('agents/')) return `${origin}/public/${clean}`;
  return `${origin}/public/${clean}`;
}

export function mapAgentUrls<T extends object>(a: T): T {
  if (!a) return a;
  const out = { ...(a as any) } as T & MutableAgentFields;

  out.avatar = toPublicUrl(out.avatar ?? undefined);
  out.mediaHero = toPublicUrl(out.mediaHero ?? undefined);

  if (Array.isArray(out.mediaThumbs)) {
    out.mediaThumbs = out.mediaThumbs.map(p => toPublicUrl(p) as string);
  }

  if (Array.isArray(out.aseguradoras)) {
    out.aseguradoras = out.aseguradoras.map(p => {
      const s = String(p ?? '');
      return /^(https?:|data:)/i.test(s) || s.startsWith('assets/')
        ? s
        : (toPublicUrl(s) as string);
    });
  }

  return out as T;
}
