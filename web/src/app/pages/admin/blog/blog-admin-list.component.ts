import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { BlogApiService, PostDto } from '../../../core/services/blog-api.service';

@Component({
  selector: 'sta-blog-admin-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-admin-list.component.html',
  styleUrls: ['./blog-admin-list.component.scss'],
})
export class BlogAdminListComponent implements OnInit {
  private blogApi = inject(BlogApiService);

  posts: PostDto[] = [];

  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadPosts();
  }

  // ===========================================================================
  // DATA
  // ===========================================================================
  loadPosts(): void {
    this.loading = true;
    this.error = null;

    this.blogApi.getAdminPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los artículos.';
        this.loading = false;
      },
    });
  }

  // ===========================================================================
  // ⭐ DESTACADO
  // ===========================================================================
  toggleFeatured(post: PostDto): void {
  // Optimista: apaga todos y prende el clicado
  this.posts = this.posts.map(p => ({ ...p, isFeatured: p.id === post.id }));

  this.blogApi.setFeatured(post.id).subscribe({
    next: () => this.loadPosts(),
    error: () => {
      alert('No se pudo actualizar el destacado.');
      this.loadPosts(); // revierte a verdad del servidor
    },
  });
}

  get featuredPostId(): string | null {
  return this.posts.find(p => p.isFeatured)?.id ?? null;
}

  // ===========================================================================
  // 📝 PUBLICAR / BORRADOR
  // ===========================================================================
  onChangePublishStatus(post: PostDto, event: Event): void {
    const input = event.target as HTMLInputElement;
    const isPublished = input.checked;

    this.blogApi
      .updatePost(post.id, {
        isDraft: !isPublished,
        publishedAt: isPublished ? new Date().toISOString() : null,
      })
      .subscribe({
        next: () => this.loadPosts(),
        error: () => alert('No se pudo actualizar el estado del artículo.'),
      });
  }

  // ===========================================================================
  // 🗑 ELIMINAR
  // ===========================================================================
  deletePost(post: PostDto): void {
    const ok = confirm(
      `¿Eliminar el artículo "${post.title}"?\n\nEsta acción no se puede deshacer.`
    );
    if (!ok) return;

    this.blogApi.deletePost(post.id).subscribe({
      next: () => this.loadPosts(),
      error: () => alert('No fue posible eliminar el artículo.'),
    });
  }
}
