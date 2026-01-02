// web/src/app/pages/blog/blog-public-list.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogApiService, PostDto } from '../../core/services/blog-api.service';

@Component({
  selector: 'sta-blog-public-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-public-list.component.html',
  styleUrls: ['./blog-public-list.component.scss'],
})
export class BlogPublicListComponent implements OnInit {
  private blogApi = inject(BlogApiService);

  loading = false;
  error: string | null = null;

  featured: PostDto | null = null;
  otherPosts: PostDto[] = [];

  ngOnInit(): void {
    this.loadPosts();
  }

  private loadPosts(): void {
    this.loading = true;
    this.error = null;

    this.blogApi.getPublicPosts().subscribe({
      next: (posts) => {
        this.computeFeatured(posts);
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las entradas del blog.';
        this.loading = false;
      },
    });
  }

  private computeFeatured(posts: PostDto[]): void {
    if (!posts.length) {
      this.featured = null;
      this.otherPosts = [];
      return;
    }

    const sorted = [...posts].sort(
      (a, b) =>
        new Date(b.publishedAt ?? b.createdAt).getTime() -
        new Date(a.publishedAt ?? a.createdAt).getTime()
    );

    const featured = sorted.find(p => p.isFeatured) ?? sorted[0];

    this.featured = featured;
    this.otherPosts = sorted.filter(p => p.id !== featured.id);
  }
}
