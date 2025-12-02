// web/src/app/pages/home/home.component.ts
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, Params } from '@angular/router';
import { Observable } from 'rxjs';

import { ScrollTopComponent } from '../../shared/ui/scroll-top/scroll-top.component';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';
import { PostDto } from '../../core/models/post.model';
import { BlogApiService } from '../../core/services/blog-api.service';
import { buildCoverUrl } from '../../core/utils/cover-url.util';

type Slide = { img: string; pos?: string; h1Html: string; h2: string };
type Categoria = {
  titulo: string; sub: string; pos?: string; img: string;
  tipo: 'vehiculos' | 'hogar-negocio' | 'salud-asistencia'; slug?: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ScrollTopComponent, TruncatePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private blog = inject(BlogApiService);

  // ====== Hero / Categorías ======
  categorias: Categoria[] = [
    { titulo: 'Vehículos', sub: 'Seguros para', img: 'assets/home/cat-vehiculos.jpg', tipo: 'vehiculos', pos: 'center top' },
    { titulo: 'Hogar y Negocio', sub: 'Seguros para', img: 'assets/home/cat-hogar.jpg', tipo: 'hogar-negocio', pos: 'center top' },
    { titulo: 'Salud y Asistencia', sub: 'Seguros para', img: 'assets/home/cat-salud.jpg', tipo: 'salud-asistencia', pos: 'center top' },
  ];
  trackByTitulo = (_: number, c: Categoria) => c.titulo;

  goToSearch(tipo: string) {
    const t = (tipo ?? '').trim();
    const queryParams: Params = { page: 1 };
    if (t) queryParams['tipo'] = t;
    this.router.navigate(['/agentes'], { queryParams });
  }

  slides: Slide[] = [
    { img: 'assets/home/hero-1-hombre.webp', pos: 'center top', h1Html: `Encuentra al <span class="highlight"><br>agente de seguros</span>`, h2: 'perfecto para ti' },
    { img: 'assets/home/hero-2-familia.webp', pos: 'center top', h1Html: `Los mejores<br> <span class="highlight">agente de seguros</span>`, h2: 'para cada tipo de seguro' },
  ];
  idx = 0;
  private timer: any = null;
  private readonly intervalMs = 3000;
  get current() { return this.slides[this.idx] ?? this.slides[0]; }
  next() { this.idx = (this.idx + 1) % this.slides.length; }
  prev() { this.idx = (this.idx - 1 + this.slides.length) % this.slides.length; }
  go(i: number) { if (i >= 0 && i < this.slides.length) { this.idx = i; this.restart(); } }
  play() { this.pause(); this.timer = setInterval(() => this.next(), this.intervalMs); }
  pause() { if (this.timer) { clearInterval(this.timer); this.timer = null; } }
  restart() { this.play(); }
  private onVis = () => (document.hidden ? this.pause() : this.play());
  private bindVisibilityAutoPause() { document.addEventListener('visibilitychange', this.onVis); }

  // ====== S6: Blog / Recursos ======
  

  // ====== Ciclo ======
  ngOnInit() {
    this.play();
    this.bindVisibilityAutoPause();
  }

  ngOnDestroy() {
    this.pause();
    document.removeEventListener('visibilitychange', this.onVis);
  }
}
