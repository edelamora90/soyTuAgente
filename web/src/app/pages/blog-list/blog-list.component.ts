//web/src/app/pages/blog-list/blog-list.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, map, startWith, switchMap } from 'rxjs';
import { Post } from '../../core/models/post.model';
import { BlogService } from '../../core/blog.service';

@Component({
  standalone: true,
  selector: 'app-blog-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.scss'],
})
export class BlogListComponent implements OnInit {
  private blog = inject(BlogService);

  /** Entradas publicadas para el grid */
  posts$!: Observable<Post[]>;

  /** TrackBy para *ngFor */
  trackById = (_: number, p: Post) => p.id;

  ngOnInit(): void {
    // Lista pública de posts (ajusta `take` según tu paginación)
    this.posts$ = this.blog.list({ published: true, take: 24 });
  }

  /** Fallback de imagen cuando falla la portada */
  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.src = 'assets/blog/fallback.webp'; // o .jpg si no tienes webp
  }
}
