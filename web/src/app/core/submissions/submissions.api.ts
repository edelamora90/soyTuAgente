import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AgentSubmission,
  CreateSubmissionDto,
  SubmissionStatus,
} from './submissions.types';

@Injectable({ providedIn: 'root' })
export class SubmissionsApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/submissions`;

  private normalize(dto: CreateSubmissionDto): CreateSubmissionDto {
    return {
      ...dto,
      especialidades: dto.especialidades ?? [],
      servicios: dto.servicios ?? [],
      // por compat si en el form los nombras así:
      logosAseg: (dto as any).logosAseg ?? [],
      fotosMini: (dto as any).fotosMini ?? [],
    };
  }

  create(dto: CreateSubmissionDto): Observable<AgentSubmission> {
    return this.http.post<AgentSubmission>(this.base, this.normalize(dto));
  }

  list(status?: SubmissionStatus): Observable<AgentSubmission[]> {
    const params = status ? { status } : undefined;
    return this.http
      .get<AgentSubmission[]>(this.base, { params })
      .pipe(map((rows) => rows ?? []));
  }

  get(id: string): Observable<AgentSubmission> {
    return this.http.get<AgentSubmission>(`${this.base}/${id}`);
  }

  approve(id: string): Observable<AgentSubmission> {
    return this.http.patch<AgentSubmission>(`${this.base}/${id}/approve`, {});
  }

  reject(id: string, notes?: string): Observable<AgentSubmission> {
    return this.http.patch<AgentSubmission>(`${this.base}/${id}/reject`, { notes });
  }
}
