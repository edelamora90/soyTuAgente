// ============================================================================
// 📋 EventsAdminListComponent
// ============================================================================

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  EventsApiService,
  EventDto,
} from '../../../core/services/events-api.service';

import {
  withEventStatus,
  EventStatus,
} from '../../../core/utils/event-status.util';

@Component({
  selector: 'sta-events-admin-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './events-admin-list.component.html',
  styleUrls: ['./events-admin-list.component.scss'],
})
export class EventsAdminListComponent implements OnInit {
  private eventsApi = inject(EventsApiService);

  events: (EventDto & { status: EventStatus })[] = [];

  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadEvents();
  }

  // ---------------------------------------------------------------------------
  getTypeLabel(type: string): string {
    switch (type) {
      case 'EVENT': return 'EVENTO';
      case 'CAPACITACION': return 'CAPACITACIÓN';
      case 'WEBINAR': return 'WEBINAR';
      case 'CURSO': return 'CURSO';
      default: return type;
    }
  }

  // ---------------------------------------------------------------------------
  loadEvents(): void {
    this.loading = true;
    this.error = null;

    this.eventsApi.getAdminEvents().subscribe({
      next: (data) => {
        this.events = data.map((e) => withEventStatus(e));
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la lista de eventos.';
        this.loading = false;
      },
    });
  }

  // ============================================================================
  // ⭐ DESTACADO
  // ============================================================================
  toggleFeatured(ev: EventDto): void {
    this.eventsApi.toggleFeatured(ev.id).subscribe({
      next: () => this.loadEvents(),
      error: () => alert('No se pudo actualizar el destacado.'),
    });
  }

  // ============================================================================
  // 📝 PUBLICAR / BORRADOR
  // ============================================================================
  // ============================================================================
// 📋 EventsAdminListComponent
// ============================================================================

// =========================================================================
// Publicar / despublicar evento
// =========================================================================
  onChangePublishStatus(ev: EventDto, event: Event): void {
    const input = event.target as HTMLInputElement;
    const isPublished = input.checked;

    this.eventsApi
      .togglePublishStatus(ev.id, isPublished)
      .subscribe({
        next: () => this.loadEvents(),
        error: () => alert('No se pudo actualizar el estado del evento.'),
      });
  }




  // ============================================================================
  deleteEvent(ev: EventDto & { status: EventStatus }): void {
    const ok = confirm(
      `¿Eliminar el evento "${ev.title}"?\n\nEsta acción no se puede deshacer.`
    );
    if (!ok) return;

    this.eventsApi.deleteEvent(ev.id).subscribe({
      next: () => this.loadEvents(),
      error: () => alert('No fue posible eliminar el evento.'),
    });
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
