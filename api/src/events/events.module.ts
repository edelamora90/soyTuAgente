// api/src/events/events.module.ts
import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';

import { PrismaModule } from '../prisma/prisma.module'; // Usamos el módulo, no el service directo

/**
 * EventsModule
 * 
 * Encapsula toda la funcionalidad relacionada con eventos y capacitaciones:
 * - CRUD de administración
 * - Listado y detalle público
 * - Cálculo de estatus (UPCOMING / LIVE / FINISHED)
 * 
 * NOTA:
 * Si más adelante agregamos carga de imágenes (coverImg),
 * aquí se importará UploadsModule.
 */
@Module({
  imports: [
    PrismaModule, // provee PrismaService automáticamente
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService], // útil si algún módulo futuro necesita consultar eventos
})
export class EventsModule {}
