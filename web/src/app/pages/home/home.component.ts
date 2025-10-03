// web/src/app/pages/home/home.component.ts
import { Component, inject, OnDestroy, OnInit  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, Params } from '@angular/router';
import { ScrollTopComponent } from '../../shared/ui/scroll-top/scroll-top.component';

type Slide = {
  img: string;
  pos?: string;         // background-position opcional
  h1Html: string;       // h1 con <span class="highlight">…</span> si deseas
  h2: string;           // subtítulo (se mostrará en <em>)
};

type Categoria = {
  titulo: string;
  sub: string;
  img: string; // ruta en assets
  tipo: 'vehiculos' | 'hogar-negocio' | 'salud-asistencia';
  slug?: string; // si viene, el card te lleva a /agente/:slug
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ScrollTopComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private router = inject(Router);

  categorias: Categoria[] = [
    {
      titulo: 'Vehículos',
      sub: 'Seguros para',
      img: 'assets/home/cat-vehiculos.jpg',
      tipo: 'vehiculos',
      slug: 'paulo-ochoa',
    },
    {
      titulo: 'Hogar y Negocio',
      sub: 'Seguros para',
      img: 'assets/home/cat-hogar.jpg',
      tipo: 'hogar-negocio',
    },
    {
      titulo: 'Salud y Asistencia',
      sub: 'Seguros para',
      img: 'assets/home/cat-salud.jpg',
      tipo: 'salud-asistencia',
    },
  ];

  trackByTitulo = (_: number, c: Categoria) => c.titulo;

  // usado por el <form> del hero: (submit)="goToSearch(sel.value); $event.preventDefault()"
  goToSearch(tipo: string) {
    const t = (tipo ?? '').trim();

    // Tipamos como Params (tiene firma de índice) y asignamos con ['clave']
    const queryParams: Params = { page: 1 };
    if (t) queryParams['tipo'] = t;

    this.router.navigate(['/agentes'], { queryParams });
  }

   slides: Slide[] = [
    {
      img: 'assets/home/hero.jpg',
      pos: 'center right',
      h1Html: `Encuentra al <span class="highlight">agente de seguros</span>`,
      h2: 'perfecto para ti',
    },
    {
      img: 'assets/home/hero-2-hombre.webp',
      pos: 'center right',
      h1Html: `Los mejores <span class="highlight">agente de seguros</span>`,
      h2: 'para cada tipo de seguro',
    },
  ];


  idx = 0;
  private timer: any = null;
  private readonly intervalMs = 3000;

  get current(){ return this.slides[this.idx] ?? this.slides[0]; }

  ngOnInit(){ this.play(); this.bindVisibilityAutoPause(); }
  ngOnDestroy(){ this.pause(); document.removeEventListener('visibilitychange', this.onVis); }

  next(){ this.idx = (this.idx + 1) % this.slides.length; }
  prev(){ this.idx = (this.idx - 1 + this.slides.length) % this.slides.length; }

  go(i: number){
    if (i >= 0 && i < this.slides.length) {
      this.idx = i;
      this.restart(); // <- mantiene el loop aun tras clic
    }
  }

  play(){ this.pause(); this.timer = setInterval(() => this.next(), this.intervalMs); }
  pause(){ if (this.timer){ clearInterval(this.timer); this.timer = null; } }
  restart(){ this.play(); }

  // Pausa si la pestaña no está visible y reanuda al volver (evita saltos)
  private onVis = () => (document.hidden ? this.pause() : this.play());
  private bindVisibilityAutoPause(){ document.addEventListener('visibilitychange', this.onVis); }
}
