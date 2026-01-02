// ============================================================================
// EventsApiService (VERSIÓN FINAL DEFINITIVA)
// ============================================================================

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ============================================================================
// ENUMS DEL FRONTEND (ALINEADOS CON BACKEND)
// ============================================================================
export type EventType =
  | 'EVENT'
  | 'CAPACITACION'
  | 'WEBINAR'
  | 'CURSO';

export type EventMode = 'ONLINE' | 'PRESENCIAL' | 'HIBRIDO';

// ============================================================================
// PAYLOAD CREATE / UPDATE (100% alineado a NestJS + Prisma)
// ============================================================================
export interface CreateUpdateEventPayload {
  title: string;
  subtitle: string | null;

  description: string;
  type: EventType;
  mode: EventMode;

  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;

  address: string | null;

  // Ponente
  speakerName: string | null;
  speakerBio: string | null;
  speakerRole: string | null;
  speakerAvatar: string | null;

  // RESPONSABLE (solo EVENT) → OPCIONAL
  responsable?: string | null;

  // Imagen principal
  coverImg: string | null;

  // URL de registro
  registrationUrl: string | null;

  // Costos / Contacto
  price: number;
  isFree: boolean;
  capacity: number | null;
  whatsapp: string | null;

  // Publicación
  isFeatured: boolean;
  isPublished: boolean;
}

// ============================================================================
// DTO COMPLETO desde el backend
// ============================================================================
export interface EventDto extends CreateUpdateEventPayload {
  id: string;
  slug: string | null;

  // Campos extra del backend
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// SERVICIO API
// ============================================================================
@Injectable({ providedIn: 'root' })
export class EventsApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/api/events`;

  // GETTERS ---------------------------------------------------------
  listEvents(): Observable<EventDto[]> {
    return this.http.get<EventDto[]>(this.baseUrl);
  }

  getPublicEvents(): Observable<EventDto[]> {
    return this.http.get<EventDto[]>(`${this.baseUrl}/public`);
  }

  getAdminEvents(): Observable<EventDto[]> {
    return this.http.get<EventDto[]>(`${this.baseUrl}/admin`);
  }

  getEventById(id: string): Observable<EventDto> {
    return this.http.get<EventDto>(`${this.baseUrl}/${id}`);
  }

  getEventBySlug(slug: string): Observable<EventDto> {
    return this.http.get<EventDto>(`${this.baseUrl}/slug/${slug}`);
  }

  // MUTATIONS -------------------------------------------------------
  createEvent(payload: CreateUpdateEventPayload): Observable<EventDto> {
    return this.http.post<EventDto>(this.baseUrl, payload);
  }

  updateEvent(id: string, payload: CreateUpdateEventPayload): Observable<EventDto> {
    return this.http.patch<EventDto>(`${this.baseUrl}/${id}`, payload);
  }
  setFeatured(id: string): Observable<EventDto> {
    return this.http.patch<EventDto>(`${this.baseUrl}/${id}/featured`, {});
  }

  toggleFeatured(id: string) { return this.http.patch<EventDto>(
    `${this.baseUrl}/${id}/featured-toggle`,
    {}
  );
}

  deleteEvent(id: string): Observable<{ ok: boolean; message: string }> {
    return this.http.delete<{ ok: boolean; message: string }>(
      `${this.baseUrl}/${id}`
    );
  }

  // =========================================================================
// Publicar / despublicar evento (ADMIN)
// =========================================================================
  togglePublishStatus(
    id: string,
    isPublished: boolean
  ) {
    return this.http.patch<{ ok: boolean }>(
      `/api/events/${id}/publish`,
      { isPublished }
    );
  }


}
