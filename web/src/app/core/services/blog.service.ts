// web/src/app/core/services/blog.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Post } from '../models/post.model';

export interface UploadCoverResponse {
  ok: boolean;
  url: string;
  bytes: number;
  post: { id: string; slug: string; img?: string };
}

export interface UploadAssetsResponse {
  ok: boolean;
  post: { id: string; slug: string };
  assets: Array<{ name: string; url: string; bytes: number }>;
}

export type NewPost = Partial<Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>>;

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly baseUrl = `${environment.apiUrl}/posts`;

  constructor(private http: HttpClient) {}

  /** Últimos N posts publicados (home) */
  getLatest(limit = 3): Observable<Post[]> {
    let params = new HttpParams().set('limit', limit);
    return this.http.get<Post[]>(`${this.baseUrl}/latest`, { params });
  }

  /** Listado con filtros opcionales (buscador y published) */
  list(options?: { q?: string; take?: number; published?: boolean }): Observable<Post[]> {
    let params = new HttpParams();

    if (options?.q) {
      params = params.set('q', options.q);
    }
    if (options?.take !== undefined) {
      params = params.set('take', options.take);
    }
    if (options?.published !== undefined) {
      params = params.set('published', String(options.published));
    }

    return this.http.get<Post[]>(this.baseUrl, { params });
  }

  /** Detalle por slug */
  getBySlug(slug: string): Observable<Post> {
    return this.http.get<Post>(`${this.baseUrl}/${slug}`);
  }

  /** Crear post (desde dashboard) */
  create(payload: NewPost): Observable<Post> {
    return this.http.post<Post>(this.baseUrl, payload);
  }

  /** Actualizar post por id */
  update(id: string, patch: Partial<Post>): Observable<Post> {
    return this.http.put<Post>(`${this.baseUrl}/${id}`, patch);
  }

  /** Eliminar post */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // ========= Subida de imágenes =========

  /** Subir portada (campo "file") → actualiza post.img en el backend */
  uploadCover(id: string, file: File): Observable<UploadCoverResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadCoverResponse>(
      `${this.baseUrl}/${id}/upload/cover`,
      formData,
    );
  }

  /** Subir assets de contenido (campo "files") → devuelve URLs para usar en el markdown */
  uploadAssets(id: string, files: File[]): Observable<UploadAssetsResponse> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return this.http.post<UploadAssetsResponse>(
      `${this.baseUrl}/${id}/upload/assets`,
      formData,
    );
  }
}
