// web/src/app/pages/blog-list/blog-list.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, map, shareReplay } from 'rxjs';

import {
  BlogApiService,
  PostDto,
} from '../../core/services/blog-api.service';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-blog-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.scss'],
})
export class BlogListComponent implements OnInit {
  private api = inject(BlogApiService);

  posts$!: Observable<PostDto[]>;
  featuredPost$!: Observable<PostDto | null>;
  otherPosts$!: Observable<PostDto[]>;

  readonly defaultCover = 'assets/blog/fallback.webp';

  trackById = (_: number, p: PostDto) => p.id;

  ngOnInit(): void {
    const source$ = this.api
      .list({ published: true, take: 24 })
      .pipe(shareReplay(1));

    this.posts$ = source$;

    this.featuredPost$ = source$.pipe(
      map((posts) => {
        const featured = posts.find((p: any) => p.isFeatured);
        return featured ?? posts[0] ?? null;
      }),
    );

    this.otherPosts$ = source$.pipe(
      map((posts) => {
        const featured = posts.find((p: any) => p.isFeatured);
        const featuredId = featured?.id ?? posts[0]?.id;
        return posts.filter((p) => p.id !== featuredId);
      }),
    );
  }

  getCoverUrl(p: PostDto): string {
    const img = p.img?.trim();
    if (!img) return this.defaultCover;

    if (img.startsWith('http')) return img;

    if (img.startsWith('/public/')) {
      return `${environment.apiBaseUrl}${img}`;
    }

    if (img.startsWith('assets/')) return img;

    return this.defaultCover;
  }

  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    if (!img.src.includes(this.defaultCover)) {
      img.src = this.defaultCover;
    }
  }

  /** Texto para el hero: usa excerpt si existe, si no genera uno del contenido */
  getHeroSubtitle(p: PostDto): string {
  // 1) Si hay excerpt manual, usamos ese
  if (p.excerpt && p.excerpt.trim().length > 0) {
    return p.excerpt.trim();
  }

  // 2) Si no, generamos a partir del contenido
  let src = (p.contentMd || p.content || '').trim();

  if (!src) {
    return 'Descubre estrategias prácticas, ejemplos reales y consejos para hacer crecer tu cartera de clientes sin perder la cercanía.';
  }

  // Limpiar markdown básico
  src = src
    .replace(/[#>*_`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const LIMIT = 150; // 🔥 150 caracteres

  if (src.length <= LIMIT) return src;

  const cut = src.slice(0, LIMIT);
  const lastSpace = cut.lastIndexOf(' ');
  const safe = lastSpace > 60 ? cut.slice(0, lastSpace) : cut;

  return safe + '…';
}
}
