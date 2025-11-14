// web/src/app/core/blog.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Post } from './models/post.model';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private base = '/api/posts';

  constructor(private http: HttpClient) {}

  getLatest(n = 3): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.base}/latest`, { params: { limit: n } as any })
      .pipe(map(list => list.map(p => ({ ...p, date: p.publishedAt })))); // compat con tu plantilla
  }

  getBySlug(slug: string) {
  return this.http.get<Post>(`/api/posts/${slug}`);
}

  list(params?: { q?: string; published?: boolean; skip?: number; take?: number }): Observable<Post[]> {
    let httpParams = new HttpParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null) httpParams = httpParams.set(k, String(v));
    });
    return this.http.get<Post[]>(this.base, { params: httpParams });
  }

  create(data: Partial<Post>) { return this.http.post<Post>(this.base, data); }
  update(id: string, data: Partial<Post>) { return this.http.put<Post>(`${this.base}/${id}`, data); }
  remove(id: string) { return this.http.delete(`${this.base}/${id}`); }
}