//web/src/app/pages/blog-post/blog-post.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BlogService } from '../../core/blog.service';
import { Post } from '../../core/models/post.model';

/**
 * Resolver: obtiene el post por slug antes de cargar el componente.
 * - Si no existe o hay error → redirige a /blog y devuelve null.
 */
export const blogPostResolver: ResolveFn<Post | null> = (route: ActivatedRouteSnapshot) => {
  const blog = inject(BlogService);
  const router = inject(Router);
  const slug = route.paramMap.get('slug') || '';

  return blog.getBySlug(slug).pipe(
    tap(p => { if (!p) router.navigate(['/blog']); }),
    catchError(() => {
      router.navigate(['/blog']);
      return of(null);
    })
  );
};
