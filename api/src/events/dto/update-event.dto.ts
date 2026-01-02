// ============================================================================
// UpdateEventDto
// ----------------------------------------------------------------------------
// DTO de actualización de eventos.
//
// Implementa PartialType(CreateEventDto) para que todos los campos sean
// opcionales, pero manteniendo las mismas reglas de validación.
//
// Alineado con EventsApiService.updateEvent(id, payload).
// ============================================================================

import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';

export class UpdateEventDto extends PartialType(CreateEventDto) {}
