import { Observable } from 'rxjs';
import { PostDto } from '../models/post.model';

export interface BlogPort {
  list(params?: {
    q?: string;
    take?: number;
    published?: boolean;
  }): Observable<PostDto[]>;

  getLatest(limit?: number): Observable<PostDto[]>;

  getBySlug(slug: string): Observable<PostDto | null>;

  getById(id: string): Observable<PostDto | null>;

  create(data: Partial<PostDto>): Observable<PostDto>;

  update(id: string, patch: Partial<PostDto>): Observable<PostDto | null>;
}
