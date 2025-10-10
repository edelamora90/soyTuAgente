// web/src/app/core/agents/agents.api.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const API = `${environment.apiUrl}/agents`; // 👈 usamos SOLO /agents

export type AdminAgent = {
  id?: string;
  slug: string;
  nombre: string;
  ubicacion?: string;
  whatsapp?: string | null;
  especialidades?: string[];
  cedula?: string;
  verificado?: boolean;
  avatar?: string;
  mediaHero?: string;
  mediaThumbs?: string[];
  foto?: string;
  fotosMini?: string[];
  servicios?: string[];
  certificaciones?: string[];
  aseguradoras?: string[];
  experiencia?: string[];
  redes?: { icon: string; url: string }[] | null;
};

@Injectable({ providedIn: 'root' })
export class AgentsApi {
  private http = inject(HttpClient);

  // Lecturas
  list(): Observable<AdminAgent[]> {
    return this.http.get<AdminAgent[]>(API);
  }

  get(slug: string): Observable<AdminAgent> {
    return this.http.get<AdminAgent>(`${API}/${encodeURIComponent(slug)}`);
  }

  // Escrituras
  create(body: Partial<AdminAgent>): Observable<AdminAgent> {
    return this.http.post<AdminAgent>(API, body);
  }

  update(slug: string, body: Partial<AdminAgent>): Observable<AdminAgent> {
    return this.http.put<AdminAgent>(`${API}/${encodeURIComponent(slug)}`, body);
  }

  delete(slug: string): Observable<void> {
    return this.http.delete<void>(`${API}/${encodeURIComponent(slug)}`);
  }
}
