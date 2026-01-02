import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ============================================================================
// DTOs
// ============================================================================

export type PostDto = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  contentHtml: string;
  coverImg?: string | null;
  readMinutes?: number | null;

  isDraft: boolean;
  isFeatured: boolean;
  publishedAt?: string | null;

  author: string;
  createdAt: string;
  updatedAt: string;

  // ✅ Galería
  galleryImgs?: string[];
};

export type CreatePostPayload = {
  title: string;
  slug?: string;

  contentHtml: string;
  excerpt?: string;
  readMinutes?: number;

  coverImg?: string | null;
  galleryImgs?: string[];

  author: string;

  isDraft?: boolean;
  isFeatured?: boolean;

  // ✅ IMPORTANTE: permitir null (despublicar)
  publishedAt?: string | null;
};

export type UpdatePostPayload = Partial<CreatePostPayload>;

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({ providedIn: 'root' })
export class BlogApiService {
  private http = inject(HttpClient);


    

   private apiUrl = `${environment.apiUrl}/blog`;

  // =========================
  // PUBLIC
  // =========================
  getPublicPosts(): Observable<PostDto[]> {
    return this.http.get<PostDto[]>(this.apiUrl);
  }

  getPublicPostBySlug(slug: string): Observable<PostDto> {
    return this.http.get<PostDto>(
      `${this.apiUrl}/${encodeURIComponent(slug)}`
    );
  }

  // =========================
  // ADMIN
  // =========================
  getAdminPosts(): Observable<PostDto[]> {
    return this.http.get<PostDto[]>(`${this.apiUrl}/admin`);
  }

  getPostById(id: string): Observable<PostDto> {
    return this.http.get<PostDto>(
      `${this.apiUrl}/admin/${encodeURIComponent(id)}`
    );
  }

  createPost(payload: CreatePostPayload): Observable<PostDto> {
    return this.http.post<PostDto>(this.apiUrl, payload);
  }

  updatePost(
    id: string,
    payload: UpdatePostPayload
  ): Observable<PostDto> {
    return this.http.put<PostDto>(
      `${this.apiUrl}/${encodeURIComponent(id)}`,
      payload
    );
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${encodeURIComponent(id)}`
    );
  }

  toggleFeatured(id: string, isFeatured: boolean) {
  return this.http.patch(
    `${this.apiUrl}/${encodeURIComponent(id)}/featured`,
    { isFeatured }
  );
}

setFeatured(id: string) {
  return this.http.patch(
    `${this.apiUrl}/${encodeURIComponent(id)}/featured`,
    {}
  );
}


}
