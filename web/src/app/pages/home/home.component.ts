// web/src/app/pages/home/home.component.ts
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, Params } from '@angular/router';
import { Observable } from 'rxjs';

import { ScrollTopComponent } from '../../shared/ui/scroll-top/scroll-top.component';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';
import { PostDto } from '../../core/models/post.model';
import { ESPECIALIDADES } from '../../shared/constants/especialidades';
import { EventsApi, HomeEvent } from '../../core/events/events.api';


type Slide = { img: string; pos?: string; h1Html: string; h2: string };
type Categoria = {
  titulo: string; sub: string; pos?: string; img: string;
  tipo: 'vehiculos' | 'hogar-negocio' | 'salud-asistencia'; slug?: string;
};
type HomeEventView = {
  titulo: string;
  subtitle?: string | null;
  fecha: string;
  tipo: string;
  cover: string;
  slug: string;
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

  ESPECIALIDADES = ESPECIALIDADES;

  private tipoLabel(t: HomeEvent['type']): string {
  switch (t) {
    case 'EVENT': return 'Evento';
    case 'CURSO': return 'Curso';
    case 'TALLER': return 'Taller';
    case 'WEBINAR': return 'Webinar';
    default: return 'Evento';
  }
}


  // ====== Hero / Categorías ======
  categorias: Categoria[] = [
    { titulo: 'Vehículos', sub: 'Seguros para', img: 'assets/home/cat-vehiculos.jpg', tipo: 'vehiculos', pos: 'center top' },
    { titulo: 'Hogar y Negocio', sub: 'Seguros para', img: 'assets/home/cat-hogar.jpg', tipo: 'hogar-negocio', pos: 'center top' },
    { titulo: 'Salud y Asistencia', sub: 'Seguros para', img: 'assets/home/cat-salud.jpg', tipo: 'salud-asistencia', pos: 'center top' },
  ];
  trackByTitulo = (_: number, c: Categoria) => c.titulo;

  goToSearch(tipo: string) {
  if (!tipo) return;

  this.router.navigate(['/agentes'], {
    queryParams: { tipo }
  });
}



  slides: Slide[] = [
    { img: 'assets/home/hero-1-hombre.webp', pos: 'center top', h1Html: `Encuentra al <span class="highlight"><br>agente de seguros</span>`, h2: 'perfecto para ti' },
    { img: 'assets/home/hero-2-familia.webp', pos: 'center top', h1Html: `Agentes de seguros<br> <span class="highlight">capacitados y certificados</span>`, h2: 'que se preocupan por ti y tu familia' },
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

  // ====== S6: Eventos y capacitaciones ======
private eventsApi = inject(EventsApi);

  eventos: HomeEventView[] = [];

loadEvents() {
  this.eventsApi.getPublicEvents().subscribe({
    next: (events) => {
      const mapped: HomeEventView[] = (events ?? [])
        .filter(e => !!e?.slug && !!e?.title && !!e?.startDate && !!e?.coverImg)
        .map(e => ({
          titulo: e.title,
          subtitle: e.subtitle ?? null,
          fecha: e.startDate,
          tipo: this.tipoLabel(e.type),
          cover: e.coverImg,
          slug: e.slug,
        }));

      this.eventos = mapped;
      this.eventIdx = 0;
    },
    error: (err) => {
      console.error('Error cargando eventos', err);
      this.eventos = [];
      this.eventIdx = 0;
    }
  });
}


private mapTipo(tipo: string): string {
  switch (tipo) {
    case 'EVENT':
      return 'Evento';
    case 'CURSO':
      return 'Curso';
    case 'TALLER':
      return 'Taller';
    case 'WEBINAR':
      return 'Webinar';
    default:
      return 'Evento';
  }
}


get eventosOrdenados(): HomeEventView[] {
  const now = new Date();

  const futuros = this.eventos
    .filter(e => new Date(e.fecha) >= now)
    .sort((a, b) => +new Date(a.fecha) - +new Date(b.fecha));

  if (futuros.length) return futuros;

  // fallback: último pasado
  return [...this.eventos]
    .sort((a, b) => +new Date(b.fecha) - +new Date(a.fecha))
    .slice(0, 1);
}

eventIdx = 0;

nextEvent() {
  if (!this.eventosOrdenados.length) return;
  this.eventIdx = (this.eventIdx + 1) % this.eventosOrdenados.length;
}

prevEvent() {
  if (!this.eventosOrdenados.length) return;
  this.eventIdx =
    (this.eventIdx - 1 + this.eventosOrdenados.length) %
    this.eventosOrdenados.length;
}

get eventoActivo() {
  return this.eventosOrdenados[this.eventIdx];
}


  // ====== Ciclo ======
  ngOnInit() {
  this.play();
  this.bindVisibilityAutoPause();
  this.loadEvents();
}

  ngOnDestroy() {
    this.pause();
    document.removeEventListener('visibilitychange', this.onVis);
  }
}
