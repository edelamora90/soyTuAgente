//web/src/app/pages/blog-post/blog-post.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { Post } from '../../core/models/post.model';

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
  post: Post | null = this.route.snapshot.data['post'] ?? null;

  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.src = 'assets/blog/fallback.webp'; // ajusta a tu asset
  }
}
