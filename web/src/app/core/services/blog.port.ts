// web/src/app/core/services/blog.port.ts
import { Observable } from 'rxjs';
import { Post } from '../models/post.model';

export interface BlogPort {
  list(params?: { q?: string; take?: number; published?: boolean }): Observable<Post[]>;
  getLatest(limit?: number): Observable<Post[]>;
  getBySlug(slug: string): Observable<Post | undefined>;
  create?(data: Partial<Post>): Observable<Post>;
  update?(id: string, patch: Partial<Post>): Observable<Post | undefined>;
}
