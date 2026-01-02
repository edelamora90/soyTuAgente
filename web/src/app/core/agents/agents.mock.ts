// web/src/app/core/agents/agents.mock.ts
import { Injectable } from '@angular/core';
import { Agent, AgentsData } from './agents.data';

let DB: Agent[] = [
  { id: '1', slug: 'alondra-cardenas', nombre: 'Alondra', cedula: 'Cédula X', verificado: true,
    ubicacion: 'Colima', especialidades: ['vehiculos'], experiencia: [], servicios: [],
    certificaciones: [], aseguradoras: [], mediaThumbs: [], mediaHero: 'assets/agents/profile-hero.jpg' }
];

@Injectable({ providedIn: 'root' })
export class AgentsMockService implements AgentsData {
  async list() { return structuredClone(DB); }
  async get(slug: string) {
    const a = DB.find(x => x.slug === slug);
    if (!a) throw new Error('Not found');
    return structuredClone(a);
  }
  async create(dto: Partial<Agent>) {
    const a: Agent = {
      id: crypto.randomUUID(),
      slug: dto.slug!,
      nombre: dto.nombre!,
      cedula: dto.cedula ?? '',
      verificado: !!dto.verificado,
      avatar: dto.avatar ?? null,
      ubicacion: dto.ubicacion ?? '',
      whatsapp: dto.whatsapp ?? null,
      especialidades: dto.especialidades ?? [],
      experiencia: dto.experiencia ?? [],
      servicios: dto.servicios ?? [],
      certificaciones: dto.certificaciones ?? [],
      aseguradoras: dto.aseguradoras ?? [],
      mediaThumbs: dto.mediaThumbs ?? [],
      mediaHero: dto.mediaHero ?? '',
      redes: dto.redes ?? null,
    };
    DB.unshift(a);
    return structuredClone(a);
  }
  async update(slug: string, dto: Partial<Agent>) {
    const i = DB.findIndex(x => x.slug === slug);
    if (i < 0) throw new Error('Not found');
    DB[i] = { ...DB[i], ...dto, slug: DB[i].slug };
    return structuredClone(DB[i]);
  }
  async remove(slug: string) {
    DB = DB.filter(x => x.slug !== slug);
  }
}
