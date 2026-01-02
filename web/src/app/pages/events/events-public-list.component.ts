import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventsApiService, EventDto } from '../../core/services/events-api.service';
import { withEventStatus, EventStatus } from '../../core/utils/event-status.util';

type EventWithStatus = EventDto & { status: EventStatus };

@Component({
  selector: 'sta-events-public-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './events-public-list.component.html',
  styleUrls: ['./events-public-list.component.scss'],
})
export class EventsPublicListComponent implements OnInit {

  private eventsApi = inject(EventsApiService);

  getTypeLabel(type: string): string {
  switch (type) {
    case 'EVENT':
      return 'EVENTO';
    case 'CAPACITACION':
      return 'CAPACITACIÓN';
    case 'WEBINAR':
      return 'WEBINAR';
    case 'CURSO':
      return 'CURSO';
    default:
      return type;
  }
}
  getModeLabel(mode: string): string {
  switch (mode) {
    case 'ONLINE': return 'ONLINE';
    case 'PRESENCIAL': return 'PRESENCIAL';
    case 'HIBRIDO': return 'HÍBRIDO';
    default: return mode;
  }
}

  loading = false;
  error: string | null = null;

  /** Evento destacado (hero) */
  featured: EventWithStatus | null = null;

  /** Eventos filtrados visibles */
  otherEvents: EventWithStatus[] = [];

  /** Copia base para filtros */
  private allEvents: EventWithStatus[] = [];

  // ------------------------------
  // Filtros
  // ------------------------------
  searchQuery = '';
  filterType = '';
  filterMode = '';

  ngOnInit(): void {
    this.loadEvents();
  }

  // ============================================================================
  // Cargar eventos
  // ============================================================================
  private loadEvents(): void {
    this.loading = true;
    this.error = null;

    this.eventsApi.getPublicEvents().subscribe({
      next: (data) => {
        const events = data.map((e) => withEventStatus(e));

        // Elegir destacado
        this.computeFeatured(events);

        // Lista base para filtros (solo eventos no destacados)
        this.allEvents = [...this.otherEvents];

        // Aplicar filtros iniciales
        this.applyFilters();

        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los eventos.';
        this.loading = false;
      },
    });
  }

  // ============================================================================
  // FILTROS
  // ============================================================================
  applyFilters(): void {
    let result = [...this.allEvents];

    // ---------------------------------------------
    // 🔍 BÚSQUEDA ESTRICTA
    // Coincide solo si una palabra del título empieza con el query
    // Ignora acentos
    // ---------------------------------------------
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const qRaw = this.searchQuery.trim();
    const q = normalize(qRaw);

    if (q) {
      result = result.filter((ev) => {
        const title = normalize(ev.title);
        const words = title.split(/\s+/);
        return words.some((w) => w.startsWith(q));
      });
    }

    // 🎯 Filtro por tipo
    if (this.filterType) {
      result = result.filter((ev) => ev.type === this.filterType);
    }

    // 🛰️ Filtro por modalidad
    if (this.filterMode) {
      result = result.filter((ev) => ev.mode === this.filterMode);
    }

    this.otherEvents = result;
  }

  // ============================================================================
  // Elegir evento destacado
  // ============================================================================
  private computeFeatured(events: EventWithStatus[]): void {
    if (!events.length) {
      this.featured = null;
      this.otherEvents = [];
      return;
    }

    const sorted = [...events].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    let featured =
      sorted.find((e) => e.isFeatured) ??
      sorted.find((e) => e.status === 'UPCOMING') ??
      sorted.find((e) => e.status === 'LIVE') ??
      sorted[0];

    this.featured = featured;
    this.otherEvents = sorted.filter((e) => e.id !== featured.id);
  }

  getStatusLabel(status: EventStatus): string {
    switch (status) {
      case 'LIVE': return 'En curso';
      case 'UPCOMING': return 'Próximo';
      case 'FINISHED': return 'Finalizado';
      default: return status;
    }
  }

  
  

}
