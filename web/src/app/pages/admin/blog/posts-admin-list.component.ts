//web/src/app/pages/admin/blog/posts-admin-list.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogService } from '../../../core/services/blog.service';
import { Observable, map } from 'rxjs';
import { Post } from '../../../core/models/post.model';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-posts-admin-list',
  imports: [CommonModule, RouterLink],
  template: `
  <section class="admin-block">
    <header class="head">
      <h2>Artículos</h2>
      <a class="btn" routerLink="/admin/blog/new">✍️ Nuevo</a>
    </header>

    <table class="grid" *ngIf="posts$ | async as posts">
      <thead>
        <tr>
          <th>Título</th>
          <th>Slug</th>
          <th>Publicado</th>
          <th>Fecha</th>
          <th style="width:140px">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let p of posts">
          <td>{{ p.title }}</td>
          <td>{{ p.slug }}</td>
          <td>{{ p.published ? 'Sí' : 'No' }}</td>
          <td>{{ p.publishedAt || p.date || '—' }}</td>
          <td class="actions">
            <a [routerLink]="['/admin/blog', p.id || p.slug, 'edit']">Editar</a>
            <button (click)="remove(p)" class="link danger">Borrar</button>
            <a *ngIf="p.slug" [routerLink]="['/blog', p.slug]" target="_blank" rel="noopener">Ver</a>
          </td>
        </tr>
      </tbody>
    </table>

    <p class="empty" *ngIf="(posts$ | async)?.length === 0">No hay artículos todavía.</p>
  </section>
  `,
  styles: [`
    .admin-block{ display:block; }
    .head{ display:flex; justify-content:space-between; align-items:center; margin:0 0 12px; }
    .btn{ text-decoration:none; font-weight:800; background:#00b871; color:#fff; padding:8px 12px; border-radius:10px; }
    .grid{ width:100%; border-collapse:collapse; }
    th, td{ padding:10px 8px; border-bottom:1px solid #e6ece9; text-align:left; }
    .actions{ display:flex; gap:8px; align-items:center; }
    .link{ background:none; border:0; padding:0; color:#0b2f34; cursor:pointer; font-weight:700; }
    .danger{ color:#c0392b; }
    .empty{ color:#7b8a85; }
  `]
})
export class PostsAdminListComponent {
  private blog = inject(BlogService);
  posts$: Observable<Post[]> = this.blog.list({ take: 100 }).pipe(
    map(list => list ?? [])
  );

  remove(p: Post) {
    // TODO: cambiar a llamada real a tu API
    if (confirm(`Borrar "${p.title}"?`)) {
      // con mock: no persistirá, pero deja el hook listo
      alert('Borrado (mock). Integra aquí BlogApi.delete(id).');
    }
  }
}
