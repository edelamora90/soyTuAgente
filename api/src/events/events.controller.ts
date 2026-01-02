// ============================================================================
// EventsController — VERSIÓN FINAL Y ALINEADA
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';

import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // ===========================================================================
  // RUTAS ESPECÍFICAS (PRIMERO SIEMPRE)
  // ===========================================================================

  @Get('public')
  async getPublicEvents() {
    return this.eventsService.getPublicEvents();
  }

  @Get('admin')
  async getAdminEvents() {
    return this.eventsService.getAdminEvents();
  }

  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    const event = await this.eventsService.findBySlug(slug);
    if (!event) throw new NotFoundException(`Evento con slug "${slug}" no encontrado`);
    return event;
  }

  // ===========================================================================
  // LISTADO PRINCIPAL
  // ===========================================================================

  @Get()
  async findAll() {
    return this.eventsService.findAll();
  }

  // ===========================================================================
  // OBTENER POR ID
  // ===========================================================================

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const event = await this.eventsService.findOne(id);
    if (!event) throw new NotFoundException(`Evento con ID ${id} no encontrado`);
    return event;
  }

  // ===========================================================================
  // CREAR EVENTO
  // ===========================================================================

  @Post()
  async create(@Body() dto: CreateEventDto) {
    // Limpieza suave: si speakerName viene vacío → null
    if (dto.speakerName === '') dto.speakerName = null;
    return this.eventsService.create(dto);
  }

  // ===========================================================================
  // ACTUALIZAR EVENTO
  // ===========================================================================

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    if (dto.speakerName === '') dto.speakerName = null;

    const updated = await this.eventsService.update(id, dto);

    if (!updated) throw new NotFoundException(`Evento con ID ${id} no encontrado`);

    return updated;
  }

  

  @Patch(':id/featured-toggle')
async toggleFeatured(@Param('id') id: string) {
  const result = await this.eventsService.toggleFeatured(id);

  if (!result) {
    throw new NotFoundException(`Evento con ID ${id} no encontrado`);
  }

  return result;
}

@Patch(':id/publish')
updatePublishStatus(
  @Param('id') id: string,
  @Body('isPublished') isPublished: boolean,
) {
  return this.eventsService.updatePublishStatus(id, isPublished);
}


  // ===========================================================================
  // ELIMINAR EVENTO
  // ===========================================================================

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const deleted = await this.eventsService.remove(id);

    if (!deleted) {
      throw new NotFoundException(`Evento con ID ${id} no encontrado`);
    }

    return { ok: true, message: 'Evento eliminado correctamente.' };
  }
}
