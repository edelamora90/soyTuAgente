// web/src/app/core/services/blog-api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PostDto,
  CreatePostPayload,
  UpdatePostPayload,
} from '../models/post.model';

@Injectable({ providedIn: 'root' })
export class BlogApiService {
  private http = inject(HttpClient);
  private BASE = '/api/blog';

  // LISTA (adm/public)
  list(params?: { published?: boolean }): Observable<PostDto[]> {
    let httpParams = new HttpParams();
    if (params?.published) {
      httpParams = httpParams.set('published', 'true');
    }
    return this.http.get<PostDto[]>(this.BASE, { params: httpParams });
  }

  // GET BY ID (admin)
  getById(id: string): Observable<PostDto> {
    return this.http.get<PostDto>(`${this.BASE}/${id}`);
  }

  // GET BY SLUG (public)
  getBySlug(slug: string): Observable<PostDto> {
    return this.http.get<PostDto>(`${this.BASE}/slug/${slug}`);
  }

  // CREATE
  create(payload: CreatePostPayload): Observable<PostDto> {
    return this.http.post<PostDto>(this.BASE, payload);
  }

  // UPDATE
  update(id: string, payload: UpdatePostPayload): Observable<PostDto> {
    return this.http.patch<PostDto>(`${this.BASE}/${id}`, payload);
  }

  // DELETE
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }
}
