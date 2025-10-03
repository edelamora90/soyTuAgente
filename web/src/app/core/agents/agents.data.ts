// web/src/app/core/agents/agents.data.ts
import { InjectionToken } from '@angular/core';

export interface Agent {
  id: string;
  slug: string;
  nombre: string;
  cedula: string;
  verificado: boolean;
  avatar?: string | null;
  ubicacion: string;
  whatsapp?: string | null;
  especialidades: string[];
  experiencia: string[];
  servicios: string[];
  certificaciones: string[];
  aseguradoras: string[];
  mediaThumbs: string[];
  mediaHero: string;
  redes?: { icon: string; url: string }[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgentsData {
  list(): Promise<Agent[]>;
  get(slug: string): Promise<Agent>;
  create(dto: Partial<Agent>): Promise<Agent>;
  update(slug: string, dto: Partial<Agent>): Promise<Agent>;
  remove(slug: string): Promise<void>;
}

export const AGENTS_DATA = new InjectionToken<AgentsData>('AGENTS_DATA');
