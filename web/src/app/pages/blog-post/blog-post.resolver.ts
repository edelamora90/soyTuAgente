// web/src/app/pages/blog-post/blog-post.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import {
  BlogApiService,
  PostDto,
} from '../../core/services/blog-api.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const blogPostResolver: ResolveFn<PostDto | null> = (
  route: ActivatedRouteSnapshot
) => {
  const api = inject(BlogApiService);
  const router = inject(Router);
  const slug = route.paramMap.get('slug')!;

  return api.getBySlug(slug).pipe(
    catchError((err) => {
      console.error('Error cargando post', err);
      router.navigate(['/blog']);
      return of(null);
    })
  );
};
