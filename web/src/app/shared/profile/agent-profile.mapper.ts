// web/src/app/shared/profile/agent-profile.mapper.ts
import type { Agent } from '../../core/agents/agents.data';
import type { AgentSubmission } from '../../core/submissions/submissions.types';
import { AgentProfileVM, AVATAR_FALLBACK } from '../../pages/agentes/profile/agent-profile.vm';
import { toPublicUrl } from '../../shared/url.util';





/* ============================
   Helpers generales
   ============================ */

const pickStr = (v: unknown, fb = ''): string =>
  typeof v === 'string' && v.trim().length ? v : fb;

const pickArr = (v: unknown): unknown[] =>
  Array.isArray(v) ? v : [];

const get = (obj: unknown, key: string): unknown =>
  obj && typeof obj === 'object' ? (obj as any)[key] : undefined;

// Convierte string o array-like en un array de strings limpios
function splitToArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((s) => pickStr(s)).filter(Boolean);
  if (typeof v === 'string') {
    return v
      .split(/\r?\n|,|;/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/* ============================
   Redes sociales
   ============================ */

const SOCIAL_DICT: Record<string, { icon: string; base: string; domains: string[] }> = {
  facebook:  { icon: 'assets/icons/facebook.svg',  base: 'https://facebook.com',     domains: ['facebook.com', 'fb.com'] },
  instagram: { icon: 'assets/icons/instagram.svg', base: 'https://instagram.com',   domains: ['instagram.com', 'instagr.am'] },
  linkedin:  { icon: 'assets/icons/linkedin.svg',  base: 'https://linkedin.com/in', domains: ['linkedin.com'] },
  tiktok:    { icon: 'assets/icons/tiktok.svg',    base: 'https://tiktok.com/@',    domains: ['tiktok.com'] },
};

function parseMaybeJson(v: unknown): any {
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return null; }
}

function ensureUrl(platform: keyof typeof SOCIAL_DICT, value: string): string {
  const s = (value || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const base = SOCIAL_DICT[platform].base.replace(/\/+$/, '');
  const username = s.replace(/^@/, '').replace(/^\/+/, '');
  return `${base}/${username}`;
}

function looksLikeDomain(str: string, domains: string[]): boolean {
  const s = str.toLowerCase();
  return domains.some((d) => s.includes(d));
}

function collectAllStrings(obj: any, max = 2000): string[] {
  const out: string[] = [];
  const seen = new Set<any>();
  function walk(x: any) {
    if (out.length >= max) return;
    if (x && typeof x === 'object') {
      if (seen.has(x)) return;
      seen.add(x);
      if (Array.isArray(x)) for (const it of x) walk(it);
      else for (const k of Object.keys(x)) walk((x as any)[k]);
    } else if (typeof x === 'string') {
      const t = x.trim();
      if (t) out.push(t);
    }
  }
  walk(obj);
  return out;
}

function normalizeRedes(src: any): Array<{ icon: string; url: string }> {
  const out: Array<{ icon: string; url: string }> = [];

  // 1) arrays típicos en distintas claves (o JSON string)
  const ARR_KEYS = ['redes', 'socials', 'socialLinks', 'links', 'redesSociales', 'social_media'];
  for (const k of ARR_KEYS) {
    let val = get(src, k);
    if (typeof val === 'string') val = parseMaybeJson(val);
    if (Array.isArray(val)) {
      for (const r of val) {
        const rawUrl =
          (r && (r.url || r.href || r.link || r.enlace)) as string | undefined;
        const platform =
          (r && (r.platform || r.name || r.type)) as string | undefined;
        const icon =
          (r && (r.icon || r.icono || r.logo)) as string | undefined;

        if (!rawUrl) continue;

        if (icon) {
          out.push({ icon, url: String(rawUrl).trim() });
        } else if (platform) {
          const key = platform.toString().toLowerCase();
          const match = SOCIAL_DICT[key as keyof typeof SOCIAL_DICT];
          if (match) out.push({ icon: match.icon, url: String(rawUrl).trim() });
          else out.push({ icon: 'assets/icons/link.svg', url: String(rawUrl).trim() });
        } else {
          const urlStr = String(rawUrl);
          const hit = Object.entries(SOCIAL_DICT).find(([, v]) => looksLikeDomain(urlStr, v.domains));
          if (hit) out.push({ icon: hit[1].icon, url: urlStr });
          else out.push({ icon: 'assets/icons/link.svg', url: urlStr });
        }
      }
    }
  }

  // 2) campos sueltos (username o URL)
  const platformAliases: Record<string, (keyof typeof SOCIAL_DICT)[]> = {
    facebook:  ['facebook'], fb: ['facebook'],
    instagram: ['instagram'], ig: ['instagram'],
    linkedin:  ['linkedin', 'li'], li: ['linkedin'],
    tiktok:    ['tiktok', 'tt'],    tt: ['tiktok'],
  };

  for (const k of Object.keys(platformAliases)) {
    const raw = get(src, k);
    if (!raw || typeof raw !== 'string') continue;
    const p = platformAliases[k][0];
    const url = ensureUrl(p, raw);
    out.push({ icon: SOCIAL_DICT[p].icon, url });
  }

  // 3) buscar strings con dominios de redes en TODO el objeto
  const allStrings = collectAllStrings(src);
  for (const s of allStrings) {
    if (!/^https?:\/\//i.test(s)) continue;
    for (const [, meta] of Object.entries(SOCIAL_DICT)) {
      if (looksLikeDomain(s, meta.domains)) {
        out.push({ icon: meta.icon, url: s });
        break;
      }
    }
  }

  // 4) deduplicar por URL
  const seen = new Set<string>();
  return out.filter((r) => {
    const key = r.url.trim().toLowerCase();
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ============================
   Mapper (overloads y cuerpo)
   ============================ */

export function mapToAgentProfileVM(src: AgentSubmission): AgentProfileVM;
export function mapToAgentProfileVM(src: Agent): AgentProfileVM;
export function mapToAgentProfileVM(src: Record<string, unknown>): AgentProfileVM;

export function mapToAgentProfileVM(src: any): AgentProfileVM {
  // Avatar (cae a fallback si no hay)
  const avatarRaw = pickStr(get(src, 'avatar')) || pickStr(get(src, 'foto'));
  const avatar = avatarRaw ? toPublicUrl(avatarRaw) : AVATAR_FALLBACK;

  // Ubicación
  const ubicacion =
    pickStr(get(src, 'ubicacion')) ||
    [pickStr(get(src, 'municipio')), pickStr(get(src, 'estado'))]
      .filter(Boolean)
      .join(', ');

  // Media: thumbs + héroe (lo incluimos al inicio si existe)
  const mediaThumbsAny = pickArr(get(src, 'mediaThumbs'));
  let mediaThumbs = mediaThumbsAny
    .map((x) => toPublicUrl(pickStr(x as any)))
    .filter(Boolean);

  const heroRaw = pickStr(get(src, 'mediaHero')) || pickStr(get(src, 'fotoHero'));
  const mediaHero = heroRaw ? toPublicUrl(heroRaw) : '';
  if (mediaHero && !mediaThumbs.includes(mediaHero)) {
    mediaThumbs = [mediaHero, ...mediaThumbs];
  }

  // Aseguradoras: array o texto con comas/ln
  let aseguradoras = (pickArr(get(src, 'aseguradoras')) as any[])
  .map((s) => pickStr(s))
  .filter(Boolean);


  if (!aseguradoras.length) {
    const raw = pickStr(get(src, 'aseguradorasText')) || pickStr(get(src, 'aseguradoras'));
    if (raw) {
      aseguradoras = raw
  .split(/\r?\n|,|;/)
  .map((s) => s.trim())
  .filter(Boolean);

    }
  }

  // Campos que podrían venir como string o array
  const especialidades  = splitToArray(get(src, 'especialidades'));
  const servicios       = splitToArray(get(src, 'servicios'));
  const experiencia     = splitToArray(get(src, 'experiencia'));
  const certificaciones = splitToArray(get(src, 'certificaciones'));

  return {
    nombre: pickStr(get(src, 'nombre'), 'Agente'),
    avatar,
    ubicacion,

    especialidades,
    servicios,
    experiencia,
    certificaciones,
    aseguradoras,
    mediaThumbs,

    verificado: Boolean(get(src, 'verificado')),
    cedula: pickStr(get(src, 'cedula')) || undefined,

    redes: normalizeRedes(src),

    telefono: pickStr(get(src, 'telefono')) || undefined,
    whatsapp: pickStr(get(src, 'whatsapp')) || undefined,
  };
}

// Aliases convenientes
export const mapAgentToVM      = mapToAgentProfileVM;
export const mapSubmissionToVM = mapToAgentProfileVM;
