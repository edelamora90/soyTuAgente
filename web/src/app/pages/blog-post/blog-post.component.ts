import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';

import { PostDto } from '../../core/services/blog-api.service';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-blog-post',
  imports: [CommonModule, RouterModule, MarkdownModule],
  templateUrl: './blog-post.component.html',
  styleUrls: ['./blog-post.component.scss'],
})
export class BlogPostComponent {
  private route = inject(ActivatedRoute);

  post: PostDto | null = this.route.snapshot.data['post'] ?? null;
  readonly defaultCover = 'assets/blog/fallback.webp';

  getCoverUrl(): string {
    const p = this.post;
    const img = p?.img?.trim();

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
    img.src = this.defaultCover;
  }
}
