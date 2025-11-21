// web/src/app/pages/blog-list/blog-list.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

// 👇 Usamos directamente el DTO del API real
import {
  BlogApiService,
  PostDto,
} from '../../core/services/blog-api.service';

@Component({
  standalone: true,
  selector: 'app-blog-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.scss'],
})
export class BlogListComponent implements OnInit {
  private api = inject(BlogApiService);

  /** Entradas publicadas para el grid */
  posts$!: Observable<PostDto[]>;

  /** TrackBy para *ngFor */
  trackById = (_: number, p: PostDto) => p.id;

  ngOnInit(): void {
    // Lista pública de posts desde el backend
    this.posts$ = this.api.list({ published: true, take: 24 });
  }

  /** Fallback de imagen cuando falla la portada */
  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.src = 'assets/blog/fallback.webp'; // o .jpg si no tienes webp
  }
}
