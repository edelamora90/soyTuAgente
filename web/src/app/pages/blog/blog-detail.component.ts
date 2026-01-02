import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { BlogApiService, PostDto } from '../../core/services/blog-api.service';

@Component({
  selector: 'sta-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-detail.component.html',
  styleUrls: ['./blog-detail.component.scss'],
})
export class BlogDetailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private blogApi = inject(BlogApiService);

  loading = true;
  error: string | null = null;

  post!: PostDto;

  // =========================
  // GALERÍA
  // =========================
  currentIndex = 0;
  lightboxOpen = false;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (!slug) {
      this.error = 'Artículo no encontrado';
      this.loading = false;
      return;
    }

    this.blogApi.getPublicPostBySlug(slug).subscribe({
      next: (post) => {
        this.post = post;
        this.loading = false;
      },
      error: () => {
        this.error = 'Artículo no encontrado';
        this.loading = false;
      },
    });
  }

  // =========================
  // HELPERS
  // =========================
  get gallery(): string[] {
    return this.post?.galleryImgs ?? [];
  }

  get galleryLength(): number {
    return this.gallery.length;
  }

  get currentImage(): string | null {
    return this.gallery[this.currentIndex] ?? null;
  }

  // =========================
  // CARRUSEL
  // =========================
  next(): void {
    if (!this.galleryLength) return;
    this.currentIndex = (this.currentIndex + 1) % this.galleryLength;
  }

  prev(): void {
    if (!this.galleryLength) return;
    this.currentIndex =
      (this.currentIndex - 1 + this.galleryLength) % this.galleryLength;
  }

  goTo(index: number): void {
    if (index < 0 || index >= this.galleryLength) return;
    this.currentIndex = index;
  }

  // =========================
  // LIGHTBOX
  // =========================
  openLightbox(index: number): void {
    this.currentIndex = index;
    this.lightboxOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
    document.body.style.overflow = '';
  }
}
