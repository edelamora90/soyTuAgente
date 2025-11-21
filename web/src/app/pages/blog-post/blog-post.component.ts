// web/src/app/pages/blog-post/blog-post.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';

// 👇 Traemos el tipo real del API
import {
  PostDto,
} from '../../core/services/blog-api.service';

@Component({
  standalone: true,
  selector: 'app-blog-post',
  imports: [CommonModule, RouterModule, MarkdownModule],
  templateUrl: './blog-post.component.html',
  styleUrls: ['./blog-post.component.scss'],
})
export class BlogPostComponent {
  private route = inject(ActivatedRoute);

  /** El resolver inyecta el post en route.data['post'] */
  post: PostDto | null = this.route.snapshot.data['post'] ?? null;

  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.src = 'assets/blog/fallback.webp'; // ajusta a tu asset
  }
}
