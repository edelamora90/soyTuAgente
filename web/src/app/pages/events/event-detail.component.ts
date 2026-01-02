// web/src/app/pages/events/event-detail/event-detail.component.ts
// ============================================================================
// EventDetailComponent (FINAL PROFESIONAL)
// ----------------------------------------------------------------------------
// Vista pública que muestra el detalle de un evento.
//
// Características:
//   • Obtiene el slug desde la URL
//   • Solicita el evento vía EventsApiService.getEventBySlug()
//   • Aplica withEventStatus() para derivar el estado (LIVE | UPCOMING | FINISHED)
//   • Muestra datos del ponente, ubicación, horarios y CTA
//
// NOTAS IMPORTANTES:
//   - El backend NO envía el campo "status"
//   - El estado se calcula en frontend usando event-status.util.ts
// ============================================================================
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import {
  EventsApiService,
  EventDto,
} from '../../core/services/events-api.service';

import {
  withEventStatus,
  EventStatus,
} from '../../core/utils/event-status.util';

@Component({
  selector: 'sta-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss'],
})
export class EventDetailComponent implements OnInit {
  // ---------------------------------------------------------------------------
  // Inyección de dependencias
  // ---------------------------------------------------------------------------
  private eventsApi = inject(EventsApiService);
  private route = inject(ActivatedRoute);

  // ---------------------------------------------------------------------------
  // Estado del componente
  // ---------------------------------------------------------------------------
  loading = false;
  error: string | null = null;

  /**
   * Evento cargado desde el backend, extendido con `status`.
   */
  event: (EventDto & { status: EventStatus }) | null = null;

  slug!: string;

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------
  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug')!;
    this.loadEvent();
  }

  // ---------------------------------------------------------------------------
  // Cargar evento vía slug
  // ---------------------------------------------------------------------------
  loadEvent(): void {
    this.loading = true;
    this.error = null;

    this.eventsApi.getEventBySlug(this.slug).subscribe({
      next: (data) => {
        console.log('EVENT LOADED:', data);
        console.log('EVENTO RECIBIDO', data);
        console.log('coverImg:', data.coverImg);
        console.log('speakerAvatar:', data.speakerAvatar);

        this.event = withEventStatus(data);
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el evento.';
        this.loading = false;
      },
      
    });
  }

  // ---------------------------------------------------------------------------
  // Etiqueta amigable para el badge de estado
  // ---------------------------------------------------------------------------
  getStatusLabel(status: EventStatus): string {
    switch (status) {
      case 'LIVE':
        return 'En curso';
      case 'UPCOMING':
        return 'Próximo';
      case 'FINISHED':
        return 'Finalizado';
      default:
        return status;
    }
  }

  copyLink() {
  navigator.clipboard.writeText(window.location.href);
  alert('Enlace copiado');
}

shareWhatsApp() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://wa.me/?text=${url}`, '_blank');
}

shareFacebook() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

shareLinkedIn() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
}

}


