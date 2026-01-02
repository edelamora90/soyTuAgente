// web/src/app/core/agent.service.ts
import { inject, Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { AGENTS_DATA, AgentsData as BackendPort } from './agents/agents.data';

// ===== Modelo de UI (NO cambiar: lo usan tus componentes) =====
export interface Agent {
  id: string;
  slug: string;
  whatsapp?: string;  // E.164 sin signos, ej: '5213121234567'
  telefono?: string | null;

  nombre: string;
  cedula: string;
  verificado: boolean;

  avatar: string;            // foto circular
  ubicacion: string;

  especialidades: string[];  // etiquetas visibles
  redes?: { icon: string; url: string }[];

  media: { hero: string; thumbs: string[] };
  experiencia: string[];
  servicios: string[];
  certificaciones: string[];
  aseguradoras: string[];
}

export type SearchParams = {
  tipo?: string;      // p.ej. 'vehiculos' | 'hogar-negocio' | 'salud-asistencia'
  q?: string;         // búsqueda libre
  page?: number;      // 1-based
  pageSize?: number;  // default 10
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

// ===== Fachada =====
@Injectable({ providedIn: 'root' })
export class AgentService {
  private port = inject<BackendPort>(AGENTS_DATA);

  // ---- helpers de mapeo (backend -> UI) ----
  private mapToUi(b: import('./agents/agents.data').Agent): Agent {
    return {
      id: b.id,
      slug: b.slug,
      nombre: b.nombre,
      cedula: b.cedula,
      verificado: b.verificado,
      avatar: b.avatar ?? '',           // UI espera string
      ubicacion: b.ubicacion,
      whatsapp: b.whatsapp ?? undefined,
        telefono: b.telefono ?? b.whatsapp ?? null,
      especialidades: b.especialidades ?? [],
      redes: (b.redes ?? undefined) as { icon: string; url: string }[] | undefined,

      media: {
        hero: b.mediaHero ?? '',
        thumbs: b.mediaThumbs ?? [],
      },

      experiencia: b.experiencia ?? [],
      servicios: b.servicios ?? [],
      certificaciones: b.certificaciones ?? [],
      aseguradoras: b.aseguradoras ?? [],
    };
  }

  // ---------- detalle ----------
  getBySlug(slug: string): Observable<Agent | null> {
    return from(this.port.get(slug)).pipe(
      map((a) => this.mapToUi(a)),
      // en caso de que backend responda 404 y arroje, dejamos que el
      // componente maneje error => notFound
    );
  }

  // ---------- búsqueda/paginado en frontend ----------
  // (si luego tienes endpoint /agents/search, lo sustituimos fácil)
  search(params: SearchParams): Observable<Page<Agent>> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 10));
    const tipo = (params.tipo || '').toLowerCase().trim();
    const q = (params.q || '').toLowerCase().trim();

    return from(this.port.list()).pipe(
      map(list => list.map(b => this.mapToUi(b))),
      map(list => {
        let filtered = list;

        if (tipo) {
          filtered = filtered.filter(a =>
            a.especialidades.some(s => s.toLowerCase() === tipo));
        }

        if (q) {
          filtered = filtered.filter(a =>
            a.nombre.toLowerCase().includes(q) ||
            a.ubicacion.toLowerCase().includes(q) ||
            a.especialidades.some(s => s.toLowerCase().includes(q))
          );
        }

        const total = filtered.length;
        const start = (page - 1) * pageSize;
        const items = filtered.slice(start, start + pageSize);

        return { items, total, page, pageSize };
      })
    );
  }
}
