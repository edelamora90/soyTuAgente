// ============================================================================
// 📦 EventsService 
// ============================================================================

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, Event } from '@prisma/client';
import slugify from 'slugify';

import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventTypeDto } from './dto/event-types.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // 🔧 GENERADOR DE SLUG ÚNICO
  // ==========================================================================
  private async generateUniqueSlug(title: string, currentId?: string): Promise<string> {
    const safeSlugify = slugify as unknown as (t: string, opt?: any) => string;

    let base = safeSlugify(title, { lower: true, strict: true, trim: true });
    if (!base) base = 'evento';

    let slug = base;
    let suffix = 2;

    for (let i = 0; i < 50; i++) {
      const exists = await this.prisma.event.findUnique({ where: { slug } });

      if (!exists || (currentId && exists.id === currentId)) return slug;

      slug = `${base}-${suffix++}`;
    }

    throw new Error('No se pudo generar un slug único.');
  }

  // ==========================================================================
  // 🔥 REGLAS DE NEGOCIO
  // ==========================================================================
  private validateBusinessRules(dto: CreateEventDto | UpdateEventDto) {
    const requiresSpeaker = [
      EventTypeDto.WEBINAR,
      EventTypeDto.CAPACITACION,
      EventTypeDto.CURSO,
    ];

    if (dto.type && requiresSpeaker.includes(dto.type)) {
      if (!dto.speakerName || dto.speakerName.trim() === '') {
        throw new BadRequestException(
          'El ponente es obligatorio para este tipo de evento.',
        );
      }
    }
  }

  // ==========================================================================
  // ⭐ LÓGICA CENTRAL: ASEGURAR QUE EXISTA EXACTAMENTE 1 DESTACADO
  // ==========================================================================
  private async ensureOneFeatured() {
    const count = await this.prisma.event.count({
      where: { isFeatured: true },
    });

    // Si ya existe un destacado, no hacemos nada
    if (count > 0) return;

    // Buscar evento futuro más próximo
    const nextEvent = await this.prisma.event.findFirst({
      where: { startDate: { gte: new Date() } },
      orderBy: { startDate: 'asc' },
    });

    if (nextEvent) {
      await this.prisma.event.update({
        where: { id: nextEvent.id },
        data: { isFeatured: true },
      });
      return;
    }

    // Si no hay futuros → tomar el más reciente
    const lastEvent = await this.prisma.event.findFirst({
      orderBy: { startDate: 'desc' },
    });

    if (lastEvent) {
      await this.prisma.event.update({
        where: { id: lastEvent.id },
        data: { isFeatured: true },
      });
    }
  }

  // ==========================================================================
  // 📋 LISTADOS
  // ==========================================================================
  async findAll(): Promise<Event[]> {
    return this.prisma.event.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string): Promise<Event | null> {
    return this.prisma.event.findUnique({ where: { id } });
  }

  async getPublicEvents(): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: { isPublished: true },
      orderBy: { startDate: 'asc' },
    });
  }

  async getAdminEvents(): Promise<Event[]> {
    return this.prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string): Promise<Event | null> {
    return this.prisma.event.findUnique({ where: { slug } });
  }

  // ==========================================================================
  // 🆕 CREAR EVENTO — CON LÓGICA DE DESTACADO ÚNICO
  // ==========================================================================
  async create(dto: CreateEventDto): Promise<Event> {
    this.validateBusinessRules(dto);

    const slug = await this.generateUniqueSlug(dto.title);

    // Si viene como destacado → limpiar los demás
    if (dto.isFeatured === true) {
      await this.prisma.event.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      });
    }

    const event = await this.prisma.event.create({
      data: {
        slug,
        title: dto.title,
        subtitle: dto.subtitle ?? null,
        description: dto.description,
        type: dto.type,
        mode: dto.mode,

        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        startTime: dto.startTime ?? null,
        endTime: dto.endTime ?? null,
        address: dto.address ?? null,

        speakerName: dto.speakerName ?? null,
        speakerBio: dto.speakerBio ?? null,
        speakerRole: dto.speakerRole ?? null,
        speakerAvatar: dto.speakerAvatar ?? null,

        responsable: dto.responsable ?? null,
        coverImg: dto.coverImg ?? null,
        registrationUrl: dto.registrationUrl ?? null,

        price: dto.price ?? 0,
        isFree: dto.isFree ?? false,
        capacity: dto.capacity ?? null,
        whatsapp: dto.whatsapp ?? null,

        isFeatured: dto.isFeatured ?? false,
        isPublished: dto.isPublished,
        publishedAt: dto.isPublished ? new Date() : null,
      },
    });

    // Corregir destacado automáticamente si queda ninguno
    await this.ensureOneFeatured();

    return event;
  }

  // ==========================================================================
  // ✏️ ACTUALIZAR EVENTO — CON DESTACADO ÚNICO
  // ==========================================================================
  async update(id: string, dto: UpdateEventDto): Promise<Event | null> {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) return null;

    this.validateBusinessRules(dto);

    // Si marcamos este como destacado → apagar todos los demás
    if (dto.isFeatured === true) {
      await this.prisma.event.updateMany({
        where: { isFeatured: true, NOT: { id } },
        data: { isFeatured: false },
      });
    }

    const event = await this.prisma.event.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,

        price: dto.price ?? undefined,
        capacity: dto.capacity ?? undefined,
        isFree: dto.isFree ?? undefined,

        isPublished: dto.isPublished ?? undefined,
        publishedAt:
          dto.isPublished && !existing.isPublished
            ? new Date()
            : dto.isPublished === false
            ? null
            : undefined,
      },
    });

    // Asegurar destacado único
    await this.ensureOneFeatured();

    return event;
  }

  // ==========================================================================
  // ❌ ELIMINAR EVENTO — Y REEQUILIBRAR DESTACADO
  // ==========================================================================
  async remove(id: string) {
    const deleted = await this.prisma.event.delete({ where: { id } });

    await this.ensureOneFeatured();

    return deleted;
  }

  // ==========================================================================
  // ⭐ TOGGLE DESTACADO INDIVIDUAL (para AdminList)
  // ==========================================================================
  async toggleFeatured(id: string): Promise<Event | null> {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) return null;

    // Si ya estaba destacado → quitarlo (pero luego se reasignará otro)
    if (event.isFeatured) {
      const updated = await this.prisma.event.update({
        where: { id },
        data: { isFeatured: false },
      });

      await this.ensureOneFeatured();
      return updated;
    }

    // Si NO estaba destacado → apagar todos y destacar este
    await this.prisma.event.updateMany({ data: { isFeatured: false } });

    const updated = await this.prisma.event.update({
      where: { id },
      data: { isFeatured: true },
    });

    return updated;
  }

  // ==========================================================================
  // ⭐ TOGGLE Publicado o Borrador (Admin)
  // ==========================================================================

  async updatePublishStatus(id: string, isPublished: boolean) {
  return this.prisma.event.update({
    where: { id },
    data: {
      isPublished,
      isFeatured: isPublished ? undefined : false, // 🔒 regla UX
    },
  });
}


}
