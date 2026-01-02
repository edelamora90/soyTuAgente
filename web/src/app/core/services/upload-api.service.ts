// ============================================================================
// UploadApiService
// ----------------------------------------------------------------------------
// Servicio universal para subir imágenes al backend NestJS.
//
// Endpoint base:
//   POST /api/uploads/image     (genérico)
//   POST /api/uploads/blog/body (si lo estás usando para TipTap)
//
// Este servicio:
// - Mantiene compatibilidad con Eventos (uploadEventImage / uploadEventCover...)
// - Mantiene compatibilidad con Blog/TipTap (uploadBlogImage / uploadBlogBodyImage...)
// - Conserva un método universal uploadImage(file, folder)
// ============================================================================

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadResponse {
  ok: boolean;
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class UploadApiService {
  private http = inject(HttpClient);


  private uploadsBaseUrl = '/api/uploads';

  // ===========================================================================
  // 1) MÉTODO UNIVERSAL (recomendado para todo)
  // ===========================================================================
  uploadImage(file: File, folder: string): Observable<UploadResponse> {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder); // si tu backend todavía NO lo usa, no pasa nada

    return this.http
      .post<UploadResponse>(`${this.uploadsBaseUrl}/image`, form)
      .pipe(
        map((res) => ({
          ok: res.ok ?? true,
          url: res.url,
          filename: res.filename,
          mimetype: res.mimetype,
          size: res.size,
        })),
      );
  }

  // ===========================================================================
  // 2) EVENTOS — ✅ para que NO se rompa event-editor.component.ts
  // ===========================================================================
  uploadEventImage(file: File, subfolder: 'covers' | 'speakers' = 'covers') {
    // Ajusta aquí si tu backend realmente guarda en /events o /images/events
    // Con tu controller actual, /uploads/image guarda en /api/uploads/images
    // pero igual regresará la URL correcta.
    return this.uploadImage(file, `events/${subfolder}`);
  }

  // Aliases (por si en algún lado del proyecto los usas)
  uploadEventCover(file: File) {
    return this.uploadEventImage(file, 'covers');
  }

  uploadEventSpeaker(file: File) {
    return this.uploadEventImage(file, 'speakers');
  }

  // ===========================================================================
  // 3) BLOG — TipTap / cover / body
  // ===========================================================================
  uploadBlogImage(file: File, subfolder: 'cover' | 'body' = 'cover') {
    return this.uploadImage(file, `blog/${subfolder}`);
  }

  // Aliases (compatibilidad)
  uploadBlogCover(file: File) {
    return this.uploadBlogImage(file, 'cover');
  }

  uploadBlogBodyImage(file: File) {
    return this.uploadBlogImage(file, 'body');
  }

  // ===========================================================================
  // 4) AGENTES — opcional
  // ===========================================================================
  uploadAgentPhoto(file: File) {
    return this.uploadImage(file, 'agents');
  }
}
