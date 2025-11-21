// web/src/app/core/services/blog.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Post } from '../models/post.model';

export interface UploadCoverResponse {
  ok: boolean;
  url: string;
  bytes: number;
  post: { id: string; slug: string; img?: string | null };
}

export interface UploadAssetsResponse {
  ok: boolean;
  post: { id: string; slug: string };
  assets: Array<{ name: string; url: string; bytes: number }>;
}

/**
 * Shape que devuelve la API. Incluye variantes posibles:
 * - externalUrl / external_url
 * - contentMd / content
 */
type PostApi = Post & {
  external_url?: string | null;
  content?: string | null;
};

export type NewPost = Partial<
  Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'>
>;

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly baseUrl = `${environment.apiUrl}/posts`;

  constructor(private http: HttpClient) {}

  /** Normaliza el objeto que viene de la API a nuestro modelo Post del front */
  private adapt(row: PostApi): Post {
    return {
      ...row,
      // asegurar que siempre haya contentMd y externalUrl en el modelo de UI
      contentMd: row.contentMd ?? row.content ?? null,
      externalUrl: row.externalUrl ?? row.external_url ?? null,
    };
  }

  /** Últimos N posts publicados (home) */
  getLatest(limit = 3): Observable<Post[]> {
    let params = new HttpParams().set('limit', limit);

    return this.http
      .get<PostApi[]>(`${this.baseUrl}/latest`, { params })
      .pipe(map((rows) => rows.map((r) => this.adapt(r))));
  }

  /** Listado con filtros opcionales (buscador y published) */
  list(options?: {
    q?: string;
    take?: number;
    published?: boolean;
  }): Observable<Post[]> {
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

    return this.http
      .get<PostApi[]>(this.baseUrl, { params })
      .pipe(map((rows) => rows.map((r) => this.adapt(r))));
  }

  /** Detalle por slug (usa la ruta correcta /posts/slug/:slug) */
  getBySlug(slug: string): Observable<Post> {
    return this.http
      .get<PostApi>(`${this.baseUrl}/slug/${slug}`)
      .pipe(map((row) => this.adapt(row)));
  }

  /** Crear post (dashboard) */
  create(payload: NewPost): Observable<Post> {
    const body: any = {
      ...payload,
      contentMd: payload.contentMd ?? null,
      externalUrl: payload.externalUrl ?? null,
    };

    return this.http
      .post<PostApi>(this.baseUrl, body)
      .pipe(map((row) => this.adapt(row)));
  }

  /** Actualizar post por id (dashboard) */
  update(id: string, patch: Partial<Post>): Observable<Post> {
    const body: any = {
      ...patch,
      contentMd: patch.contentMd ?? null,
      externalUrl: patch.externalUrl ?? null,
    };

    return this.http
      .patch<PostApi>(`${this.baseUrl}/${id}`, body)
      .pipe(map((row) => this.adapt(row)));
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
    files.forEach((f) => formData.append('files', f));

    return this.http.post<UploadAssetsResponse>(
      `${this.baseUrl}/${id}/upload/assets`,
      formData,
    );
  }
}

