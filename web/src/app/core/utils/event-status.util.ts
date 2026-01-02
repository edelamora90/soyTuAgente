// ============================================================================
// event-status.util.ts (FINAL PROFESIONAL)
// ----------------------------------------------------------------------------
// Utilidades para calcular el estado actual de un evento según sus fechas.
//
// Estados posibles:
//
//   • UPCOMING   -> El evento aún no comienza
//   • LIVE       -> El evento está ocurriendo en este momento
//   • FINISHED   -> El evento ya finalizó
//
// NOTAS IMPORTANTES:
//   - Este estado NO proviene del backend.
//   - Se deriva exclusivamente en el frontend a partir de startDate / endDate.
//   - Se utiliza en componentes y listados para:
//        • Estilos condicionales
//        • Badges
//        • Filtros de UI
//
// Alineado 100% con EventDto de EventsApiService.
// ============================================================================
import { EventDto } from '../services/events-api.service';

// ---------------------------------------------------------------------------
// Tipo de estado derivado
// ---------------------------------------------------------------------------
export type EventStatus = 'UPCOMING' | 'LIVE' | 'FINISHED';

// ---------------------------------------------------------------------------
// 🔍 Helper interno: convertir a Date de forma segura
// ---------------------------------------------------------------------------
function toDate(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

// ---------------------------------------------------------------------------
// 📌 Calcular estado a partir de startDate y endDate
// ---------------------------------------------------------------------------
export function getEventStatus(event: EventDto): EventStatus {
  const now = new Date();

  const start = toDate(event.startDate);
  const end = toDate(event.endDate) ?? start;

  if (!start) return 'UPCOMING';

  if (now < start) return 'UPCOMING';
  if (now > (end ?? start)) return 'FINISHED';

  return 'LIVE';
}

// ---------------------------------------------------------------------------
// 📌 Devuelve una copia del evento agregando el campo status
//
// Uso típico:
//
//   events.map(e => withEventStatus(e));
//
//   this.eventsApi.getPublicEvents().pipe(
//     map(list => list.map(withEventStatus))
//   );
//
// ---------------------------------------------------------------------------
export function withEventStatus<T extends EventDto>(
  event: T,
): T & { status: EventStatus } {
  return {
    ...event,
    status: getEventStatus(event),
  };
}
