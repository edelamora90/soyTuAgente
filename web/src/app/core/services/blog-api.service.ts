// web/src/app/core/services/blog-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PostDto {
  id: string;
  title: string;
  slug: string;
  img?: string | null;
  tag?: string | null;
  topic?: string | null;
  readMinutes?: number | null;

  // Campos de contenido
  contentMd?: string | null;     // campo real en la API / BD
  content?: string | null;       // alias cómodo para la UI

  // URL externa
  external_url?: string | null;  // snake_case desde API
  externalUrl?: string | null;   // camelCase para la UI

  published?: boolean;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePostDto {
  title: string;
  slug?: string | null;

  // ahora el DTO habla en contentMd igual que el backend
  contentMd: string;

  tag?: string | null;
  topic?: string | null;
  readMinutes?: number | null;
  externalUrl?: string | null;   // lo mapeamos a external_url al enviar
  published?: boolean;
}

export interface ListParams {
  q?: string;
  published?: boolean;
  skip?: number;
  take?: number;
}

@Injectable({ providedIn: 'root' })
export class BlogApiService {
  // environment.apiUrl ya incluye /api donde toca
  private readonly base = `${environment.apiUrl}/posts`;

  constructor(private http: HttpClient) {}

  /** Normaliza a camel para la UI */
  private adapt = (p: PostDto): PostDto => ({
    ...p,
    // asegurar que siempre tengamos ambas variantes
    externalUrl: p.externalUrl ?? p.external_url ?? null,
    external_url: p.external_url ?? p.externalUrl ?? null,
    content: p.content ?? p.contentMd ?? null,
    contentMd: p.contentMd ?? p.content ?? null,
  });

  // ---------- CREATE ----------
  create(dto: CreatePostDto): Observable<PostDto> {
    const payload: any = {
      ...dto,
      external_url: dto.externalUrl ?? null,
    };
    delete payload.externalUrl;

    return this.http
      .post<PostDto>(this.base, payload)
      .pipe(map((row) => this.adapt(row)));
  }

  // ---------- UPDATE (PATCH /posts/:id) ----------
  update(id: string, patch: Partial<CreatePostDto>): Observable<PostDto> {
    const payload: any = {
      ...patch,
      ...(patch.externalUrl !== undefined
        ? { external_url: patch.externalUrl }
        : {}),
    };
    delete payload.externalUrl;

    return this.http
      .patch<PostDto>(`${this.base}/${id}`, payload)
      .pipe(map((row) => this.adapt(row)));
  }

  // ---------- GET BY SLUG ----------
  /** GET /posts/slug/:slug */
  getBySlug(slug: string): Observable<PostDto> {
    return this.http
      .get<PostDto>(`${this.base}/slug/${slug}`)
      .pipe(map((row) => this.adapt(row)));
  }

  // ---------- GET BY ID ----------
  /** GET /posts/id/:id */
  getById(id: string): Observable<PostDto> {
    return this.http
      .get<PostDto>(`${this.base}/id/${id}`)
      .pipe(map((row) => this.adapt(row)));
  }

  // ---------- LISTADO ----------
  list(params: ListParams = {}): Observable<PostDto[]> {
    let p = new HttpParams();
    if (params.q) p = p.set('q', params.q);
    if (params.published !== undefined) {
      p = p.set('published', String(params.published));
    }
    if (params.skip !== undefined) p = p.set('skip', String(params.skip));
    if (params.take !== undefined) p = p.set('take', String(params.take));

    return this.http
      .get<PostDto[]>(this.base, { params: p })
      .pipe(map((rows) => rows.map(this.adapt)));
  }

  // ---------- ÚLTIMOS POSTS ----------
  /** GET /posts/latest?limit=N */
  latest(limit = 3): Observable<PostDto[]> {
    return this.http
      .get<PostDto[]>(`${this.base}/latest`, {
        params: { limit } as any,
      })
      .pipe(map((rows) => rows.map(this.adapt)));
  }

  // ---------- UPLOADS ----------
  /** POST /posts/:id/upload/cover */
  uploadCover(postId: string, file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`${this.base}/${postId}/upload/cover`, fd);
  }

  /** POST /posts/:id/upload/assets */
  uploadAssets(postId: string, files: File[]): Observable<any> {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    return this.http.post(`${this.base}/${postId}/upload/assets`, fd);
  }
}
