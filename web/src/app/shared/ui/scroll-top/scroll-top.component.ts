import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scroll-top',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scroll-top.component.html',
  styleUrls: ['./scroll-top.component.scss'],
})
export class ScrollTopComponent {
  // visible cuando el scroll supera el umbral
  visible = signal(false);

  // px a partir de los cuales se muestra el botón
  private readonly threshold = 500;

  @HostListener('window:scroll')
  onScroll() {
    // window.scrollY disponible en navegadores modernos
    this.visible.set((window.scrollY || document.documentElement.scrollTop) > this.threshold);
  }

  toTop() {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }
}
