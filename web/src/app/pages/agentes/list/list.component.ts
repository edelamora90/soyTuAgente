// web/src/app/pages/agentes/list/list.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AgentService, Page, Agent } from '../../../core/agents.service';

@Component({
  selector: 'app-agentes-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(AgentService);

  // estado UI
  loading = signal(true);
  items   = signal<Agent[]>([]);
  total   = signal(0);
  page    = signal(1);
  pageSize = signal(10);

  // filtros ligados al query param
  tipo = signal<string | null>(null);
  q    = signal<string>('');

  constructor() {
    // reacciona a cambios en query params
    this.route.queryParamMap.subscribe(pm => {
      this.tipo.set(pm.get('tipo'));
      this.q.set(pm.get('q') || '');
      const pg = Number(pm.get('page') || 1);
      this.page.set(isNaN(pg) ? 1 : pg);

      this.fetch();
    });
  }

  fetch() {
    this.loading.set(true);

    const params = {
      tipo: this.tipo() ?? undefined,
      q: this.q().trim() || undefined,
      page: this.page(),
      pageSize: this.pageSize(),
    };

    this.api.search(params).subscribe((res: Page<Agent>) => {
      this.items.set(res.items);
      this.total.set(res.total);
      this.page.set(res.page);
      this.pageSize.set(res.pageSize);
      this.loading.set(false);
    });
  }

  applyFilters() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        tipo: this.tipo() ?? undefined,
        q: this.q().trim() || undefined,
        page: 1,
      },
      queryParamsHandling: 'merge',
    });
  }

  goPage(p: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: p },
      queryParamsHandling: 'merge',
    });
  }

  totalPages() {
    const ps = this.pageSize();
    const t  = this.total();
    return ps > 0 ? Math.max(1, Math.ceil(t / ps)) : 1;
  }

  trackBySlug = (_: number, a: Agent) => a.slug;

  /** Devuelve el icono correcto para una especialidad. */
  iconFor(raw: string): string | null {
    const e = (raw || '').toLowerCase().trim();
    if (e.includes('vehículo') || e.includes('vehiculo')) return 'assets/icons/rep-auto.svg';
    if (e.includes('salud') || e.includes('bienestar'))   return 'assets/icons/corazon.svg';
    if (e.includes('hogar'))                              return 'assets/icons/seguro-hogar.svg';
    if (e.includes('inversion'))                          return 'assets/icons/obtener-dinero.svg';
    return null;
  }
}
