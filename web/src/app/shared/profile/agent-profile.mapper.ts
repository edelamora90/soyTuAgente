import type { Agent } from '../../core/agents/agents.data';
import type { AgentSubmission } from '../../core/submissions/submissions.types';
import { AgentProfileVM, AVATAR_FALLBACK } from '../../pages/agentes/profile/agent-profile.vm';

// helpers
const pickStr = (v: unknown, fb = ''): string =>
  typeof v === 'string' && v.trim().length ? v : fb;

const pickArr = (v: unknown): unknown[] =>
  Array.isArray(v) ? v : [];

const get = (obj: unknown, key: string): unknown =>
  obj && typeof obj === 'object' ? (obj as any)[key] : undefined;

function asUrl(base: string, value?: string | null): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${base.replace(/\/+$/,'')}/${raw.replace(/^\/+/, '')}`;
}

function asUsernameOrUrl(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v.trim();
}

// Mapea nombre de plataforma a icono y base URL
const SOCIAL_DICT: Record<string, { icon: string; base: string; domains: string[] }> = {
  facebook:  { icon: 'assets/icons/facebook.svg',  base: 'https://facebook.com',   domains: ['facebook.com', 'fb.com'] },
  instagram: { icon: 'assets/icons/instagram.svg', base: 'https://instagram.com', domains: ['instagram.com', 'instagr.am'] },
  linkedin:  { icon: 'assets/icons/linkedin.svg',  base: 'https://linkedin.com/in', domains: ['linkedin.com'] },
  tiktok:    { icon: 'assets/icons/tiktok.svg',    base: 'https://tiktok.com/@',  domains: ['tiktok.com'] },
};

// intentar parsear JSON string
function parseMaybeJson(v: unknown): any {
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return null; }
}

function ensureUrl(platform: keyof typeof SOCIAL_DICT, value: string): string {
  const s = (value || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const base = SOCIAL_DICT[platform].base.replace(/\/+$/,'');
  const username = s.replace(/^@/,'').replace(/^\/+/, '');
  return `${base}/${username}`;
}

function looksLikeDomain(str: string, domains: string[]): boolean {
  const s = str.toLowerCase();
  return domains.some(d => s.includes(d));
}

// Recolecta TODAS las strings del objeto (recursivo, protegiendo ciclos)
function collectAllStrings(obj: any, max = 2000): string[] {
  const out: string[] = [];
  const seen = new Set<any>();
  function walk(x: any) {
    if (out.length >= max) return;  // por si acaso
    if (x && typeof x === 'object') {
      if (seen.has(x)) return;
      seen.add(x);
      if (Array.isArray(x)) {
        for (const it of x) walk(it);
      } else {
        for (const k of Object.keys(x)) walk((x as any)[k]);
      }
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

        if (rawUrl) {
          if (icon) {
            out.push({ icon, url: String(rawUrl).trim() });
          } else if (platform) {
            const key = platform.toString().toLowerCase();
            const match = SOCIAL_DICT[key as keyof typeof SOCIAL_DICT];
            if (match) {
              out.push({ icon: match.icon, url: String(rawUrl).trim() });
            } else {
              // plataforma desconocida → usa tal cual
              out.push({ icon: 'assets/icons/link.svg', url: String(rawUrl).trim() });
            }
          } else {
            // sin plataforma ni icon → intenta deducir por dominio
            const urlStr = String(rawUrl);
            const hit = Object.entries(SOCIAL_DICT).find(([, v]) => looksLikeDomain(urlStr, v.domains));
            if (hit) out.push({ icon: hit[1].icon, url: urlStr });
            else out.push({ icon: 'assets/icons/link.svg', url: urlStr });
          }
        }
      }
      // no break: dejamos combinar con campos sueltos
    }
  }

  // 2) campos sueltos (username o URL)
  const platformAliases: Record<string, (keyof typeof SOCIAL_DICT)[]> = {
    facebook:  ['facebook'],
    fb:        ['facebook'],
    instagram: ['instagram'],
    ig:        ['instagram'],
    linkedin:  ['linkedin', 'li'],
    tiktok:    ['tiktok', 'tt'],
    li:        ['linkedin'],
    tt:        ['tiktok'],
  };

  for (const k of Object.keys(platformAliases)) {
    const raw = get(src, k);
    if (!raw || typeof raw !== 'string') continue;
    const platforms = platformAliases[k];
    const p = platforms[0]; // preferencia
    const url = ensureUrl(p, raw);
    out.push({ icon: SOCIAL_DICT[p].icon, url });
  }

  // 3) buscar strings con dominios de redes en TODO el objeto
  const allStrings = collectAllStrings(src);
  for (const s of allStrings) {
    if (!/^https?:\/\//i.test(s)) continue;
    for (const [plat, meta] of Object.entries(SOCIAL_DICT)) {
      if (looksLikeDomain(s, meta.domains)) {
        out.push({ icon: meta.icon, url: s });
        break;
      }
    }
  }

  // 4) deduplicar por URL (case-insensitive)
  const seen = new Set<string>();
  const cleaned = out.filter(r => {
    const key = r.url.trim().toLowerCase();
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return cleaned;
}


// OVERLOADS
export function mapToAgentProfileVM(src: AgentSubmission): AgentProfileVM;
export function mapToAgentProfileVM(src: Agent): AgentProfileVM;
export function mapToAgentProfileVM(src: Record<string, unknown>): AgentProfileVM;

// implementación
export function mapToAgentProfileVM(src: any): AgentProfileVM {
  const avatar =
    pickStr(get(src, 'avatar')) ||
    pickStr(get(src, 'foto')) ||
    AVATAR_FALLBACK;

  const ubicacion =
    pickStr(get(src, 'ubicacion')) ||
    [pickStr(get(src, 'municipio')), pickStr(get(src, 'estado'))]
      .filter(Boolean)
      .join(', ');

  const mediaThumbsAny = pickArr(get(src, 'mediaThumbs'));
  const mediaThumbs = mediaThumbsAny
    .map(x => pickStr(x as any))
    .filter(Boolean);

  // aseguradoras: arreglo o texto con comas
  let aseguradoras = (pickArr(get(src, 'aseguradoras')) as any[])
    .map(s => pickStr(s))
    .filter(Boolean);
  if (!aseguradoras.length) {
    const raw = pickStr(get(src, 'aseguradorasText'));
    if (raw) {
      aseguradoras = raw.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  return {
    nombre: pickStr(get(src, 'nombre'), 'Agente'),
    avatar,
    ubicacion,

    especialidades:  (pickArr(get(src, 'especialidades')) as any[]).map(s => pickStr(s)).filter(Boolean),
    servicios:       (pickArr(get(src, 'servicios')) as any[]).map(s => pickStr(s)).filter(Boolean),
    experiencia:     (pickArr(get(src, 'experiencia')) as any[]).map(s => pickStr(s)).filter(Boolean),
    certificaciones: (pickArr(get(src, 'certificaciones')) as any[]).map(s => pickStr(s)).filter(Boolean),
    aseguradoras,
    mediaThumbs,

    verificado: Boolean(get(src, 'verificado')),
    cedula: pickStr(get(src, 'cedula')) || undefined,

    // 🔥 redes robustas
    redes: normalizeRedes(src),

    // opcional: si en tu data hay whatsapp/telefono
    telefono: pickStr(get(src, 'telefono')) || undefined,
    whatsapp: pickStr(get(src, 'whatsapp')) || undefined,
  };
}

// Aliases
export const mapAgentToVM      = mapToAgentProfileVM;
export const mapSubmissionToVM = mapToAgentProfileVM;
