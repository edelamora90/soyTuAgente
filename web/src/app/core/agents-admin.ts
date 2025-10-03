import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export type AgentDTO = {
  id?: string;
  slug: string;
  nombre: string;
  cedula?: string;
  verificado?: boolean;
  avatar?: string;
  ubicacion?: string;
  especialidades: string[];        // ['vehiculos', 'hogar-negocio', ...]
  mediaHero?: string;
  mediaThumbs?: string[];
  experiencia?: string[];
  servicios?: string[];
  certificaciones?: string[];
  aseguradoras?: string[];
  whatsapp?: string;
  redes?: { icon: string; url: string }[];
  createdAt?: string;
  updatedAt?: string;
};

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number; };

@Injectable({ providedIn: 'root' })
export class AgentsAdminService {
  private http = inject(HttpClient);
  private API = 'http://localhost:3000'; // ajusta si tu API corre en otro host/puerto

  list(opts: { q?: string; tipo?: string; page?: number; pageSize?: number } = {}) {
    let params = new HttpParams();
    if (opts.q) params = params.set('q', opts.q);
    if (opts.tipo) params = params.set('tipo', opts.tipo);
    if (opts.page) params = params.set('page', String(opts.page));
    if (opts.pageSize) params = params.set('pageSize', String(opts.pageSize));
    return this.http.get<Page<AgentDTO>>(`${this.API}/agents`, { params });
  }

  get(id: string) {
    return this.http.get<AgentDTO>(`${this.API}/agents/${id}`);
  }

  create(body: AgentDTO) {
    return this.http.post<AgentDTO>(`${this.API}/agents`, body);
  }

  update(id: string, body: Partial<AgentDTO>) {
    return this.http.patch<AgentDTO>(`${this.API}/agents/${id}`, body);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.API}/agents/${id}`);
  }
}
