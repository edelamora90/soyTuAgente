// web/src/app/core/agents/agents.api-data.ts
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AgentsData, Agent } from './agents.data';
import { AgentsApi, AdminAgent } from './agents.api';

type SocialKey = 'facebook' | 'instagram' | 'linkedin' | 'tiktok';

const SOCIALS: Record<SocialKey, { icon: string; base: string }> = {
  facebook:  { icon: 'assets/icons/facebook.svg',  base: 'https://facebook.com' },
  instagram: { icon: 'assets/icons/instagram.svg', base: 'https://instagram.com' },
  linkedin:  { icon: 'assets/icons/linkedin.svg',  base: 'https://linkedin.com/in' },
  tiktok:    { icon: 'assets/icons/tiktok.svg',    base: 'https://tiktok.com/@' },
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/** Convierte distintos formatos del backend a [{icon, url}] */
function normalizeRedes(a: any): Array<{ icon: string; url: string }> {
  // 1) Si ya viene como arreglo correcto
  if (Array.isArray(a?.redes) && a.redes.every((x: any) => isNonEmptyString(x?.icon) && isNonEmptyString(x?.url))) {
    return a.redes as Array<{ icon: string; url: string }>;
  }

  // 2) Si viene como objeto { facebook: "...", instagram: "..." }
  const obj = a?.redes ?? a?.social ?? a?.socials ?? a?.socialLinks;
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const out: Array<{ icon: string; url: string }> = [];
    (Object.keys(SOCIALS) as SocialKey[]).forEach((k) => {
      const val = obj[k];
      if (isNonEmptyString(val)) {
        const { icon, base } = SOCIALS[k];
        const url = /^https?:\/\//i.test(val) ? val : `${base.replace(/\/+$/, '')}/${String(val).replace(/^\/+/, '')}`;
        out.push({ icon, url });
      }
    });
    if (out.length) return out;
  }

  // 3) Si viene como array de { type, url }
  if (Array.isArray(a?.socials)) {
    const out: Array<{ icon: string; url: string }> = [];
    for (const s of a.socials) {
      const type = String(s?.type || '').toLowerCase() as SocialKey;
      const urlRaw = s?.url ?? s?.handle ?? '';
      if (SOCIALS[type] && isNonEmptyString(urlRaw)) {
        const { icon, base } = SOCIALS[type];
        const url = /^https?:\/\//i.test(urlRaw) ? urlRaw : `${base.replace(/\/+$/, '')}/${String(urlRaw).replace(/^\/+/, '')}`;
        out.push({ icon, url });
      }
    }
    if (out.length) return out;
  }

  // 4) Campos sueltos: a.facebook, a.instagram, ...
  const out2: Array<{ icon: string; url: string }> = [];
  (Object.keys(SOCIALS) as SocialKey[]).forEach((k) => {
    const v = a?.[k];
    if (isNonEmptyString(v)) {
      const { icon, base } = SOCIALS[k];
      const url = /^https?:\/\//i.test(v) ? v : `${base.replace(/\/+$/, '')}/${String(v).replace(/^\/+/, '')}`;
      out2.push({ icon, url });
    }
  });
  if (out2.length) return out2;

  // 5) Nada reconocible
  return [];
}

@Injectable({ providedIn: 'root' })
export class AgentsApiDataService implements AgentsData {
  private api = inject(AgentsApi);

  async list(): Promise<Agent[]> {
    const rows = await firstValueFrom(this.api.list());
    return rows.map(this.mapToAgent);
  }

  async get(slug: string): Promise<Agent> {
    const row = await firstValueFrom(this.api.get(slug));
    return this.mapToAgent(row);
  }

  async create(dto: Partial<Agent>): Promise<Agent> {
    const created = await firstValueFrom(this.api.create(this.mapFromAgent(dto)));
    return this.mapToAgent(created);
  }

  async update(slug: string, dto: Partial<Agent>): Promise<Agent> {
    const updated = await firstValueFrom(this.api.update(slug, this.mapFromAgent(dto)));
    return this.mapToAgent(updated);
  }

  async remove(slug: string): Promise<void> {
    await firstValueFrom(this.api.delete(slug));
  }

  // ---- mapeos ----
  private mapToAgent = (a: AdminAgent): Agent => {
    const redes = normalizeRedes(a);

    return {
      id: a.id ?? '',
      slug: a.slug,
      nombre: a.nombre,
      cedula: a.cedula ?? '',
      verificado: !!a.verificado,
      avatar: a.avatar ?? (a as any).foto ?? null,
      ubicacion: a.ubicacion ?? '',
      whatsapp: a.whatsapp ?? null,
      especialidades: a.especialidades ?? [],
      experiencia: a.experiencia ?? [],
      servicios: a.servicios ?? [],
      certificaciones: a.certificaciones ?? [],
      aseguradoras: a.aseguradoras ?? [],
      mediaThumbs: a.mediaThumbs ?? (a as any).fotosMini ?? [],
      mediaHero: a.mediaHero ?? '',
      redes, // <-- siempre arreglo (aunque vacío)
    };
  };

  private mapFromAgent(a: Partial<Agent>): Partial<AdminAgent> {
    return {
      id: a.id,
      slug: a.slug!,
      nombre: a.nombre!,
      ubicacion: a.ubicacion,
      whatsapp: a.whatsapp,
      especialidades: a.especialidades,
      cedula: a.cedula,
      verificado: a.verificado,
      avatar: a.avatar ?? undefined,
      mediaHero: a.mediaHero,
      mediaThumbs: a.mediaThumbs,
      foto: a.avatar ?? undefined,
      fotosMini: a.mediaThumbs,
      servicios: a.servicios,
      certificaciones: a.certificaciones,
      aseguradoras: a.aseguradoras,
      experiencia: a.experiencia,
      redes: Array.isArray(a.redes) ? a.redes : null,
    };
  }
}
