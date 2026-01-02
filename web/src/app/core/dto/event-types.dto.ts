// ============================================================================
// event-types.dto.ts
// ----------------------------------------------------------------------------
// Define enums usados por CreateEventDto y UpdateEventDto.
// Son equivalentes a los EventType y EventMode que el frontend utiliza,
// garantizando consistencia entre Angular ↔ NestJS.
// ============================================================================

export enum EventTypeDto {
  EVENT = 'EVENT',
  CAPACITACION = 'CAPACITACION',
  WEBINAR = 'WEBINAR',
  CURSO = 'CURSO'
}

export enum EventModeDto {
  ONLINE = 'ONLINE',
  PRESENCIAL = 'PRESENCIAL',
  HIBRIDO = 'HIBRIDO',
}
