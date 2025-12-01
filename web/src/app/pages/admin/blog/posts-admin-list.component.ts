// web/src/app/pages/admin/blog/posts-admin-list.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogApiService } from '../../../core/services/blog-api.service';
import { PostDto } from '../../../core/models/post.model';

@Component({
  selector: 'app-posts-admin-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './posts-admin-list.component.html',
  styleUrls: ['./posts-admin-list.component.scss'],
})
export class PostsAdminListComponent implements OnInit {
  private api = inject(BlogApiService);

  posts: PostDto[] = [];
  loading = true;

  ngOnInit(): void {
    this.api.list().subscribe((rows) => {
      this.posts = rows;
      this.loading = false;
    });
  }

  delete(id: string) {
    if (!confirm('¿Eliminar esta entrada?')) return;

    this.api.delete(id).subscribe(() => {
      this.posts = this.posts.filter((p) => p.id !== id);
    });
  }
}
