// ============================================================================
// 📄 CreateEventDto — VERSIÓN LIMPIA
// ============================================================================

import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { EventTypeDto, EventModeDto } from './event-types.dto';

// ============================================================================
// DTO PRINCIPAL PARA CREAR EVENTO
// ============================================================================
export class CreateEventDto {
  // 🏷️ INFORMACIÓN PRINCIPAL
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsString()
  description!: string;

  @IsEnum(EventTypeDto)
  type!: EventTypeDto;

  @IsEnum(EventModeDto)
  mode!: EventModeDto;

  /** Responsable del evento */
  @IsOptional()
  @IsString()
  responsable?: string;

  // ❌ SE ELIMINA "ponente" DEL DTO
  // Esto evita campos duplicados y conflictos.
  // El nombre oficial del ponente es "speakerName".

  // 🗓️ FECHAS Y HORARIOS
  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsString()
  startTime?: string | null;

  @IsOptional()
  @IsString()
  endTime?: string | null;

  // 📍 UBICACIÓN
  @IsOptional()
  @IsString()
  address?: string | null;

  // 👤 PONENTE (Campo oficial)
  @IsOptional()
  @IsString()
  speakerName?: string | null;

  @IsOptional()
  @IsString()
  speakerBio?: string | null;

  @IsOptional()
  @IsString()
  speakerRole?: string | null;

  @IsOptional()
  @IsString()
  speakerAvatar?: string | null;

  // 🖼️ PORTADA
  @IsOptional()
  @IsString()
  coverImg?: string | null;

  // 🔗 URL CTA
  @IsOptional()
  @IsString()
  registrationUrl?: string | null;

  // 👥 CAPACIDAD Y CONTACTO
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number | null;

  @IsOptional()
  @IsString()
  whatsapp?: string | null;

  // 💰 PRECIO Y FREE
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number | null;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean | null;

  // ⭐ PUBLICACIÓN
  @IsBoolean()
  isFeatured!: boolean;

  @IsBoolean()
  isPublished!: boolean;

  // 🔤 SLUG
  @IsOptional()
  @IsString()
  slug?: string | null;
}

// ============================================================================
// DTO PARA ACTUALIZAR EVENTO
// ============================================================================
import { PartialType } from '@nestjs/mapped-types';

export class UpdateEventDto extends PartialType(CreateEventDto) {}
