import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type EventTipo =
  | 'Capacitación'
  | 'Certificación'
  | 'Curso'
  | 'Webinar';

export interface HomeEvent {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string;
  type: 'EVENT' | 'CURSO' | 'TALLER' | 'WEBINAR';
  startDate: string;
  coverImg: string;
}


@Injectable({ providedIn: 'root' })
export class EventsApi {
  private http = inject(HttpClient);

  getPublicEvents(): Observable<HomeEvent[]> {
    return this.http.get<HomeEvent[]>('/api/events/public');
  }
}
