// api/src/submissions/dto/create-submission.dto.ts
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

// Helpers de transformación
const toStr = (v: any) =>
  typeof v === 'string' ? v.trim() : v ?? '';

const toStrOrUndef = (v: any) => {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};

const toStrArray = (v: any) => {
  if (Array.isArray(v)) {
    return v.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof v === 'string') {
    // admite comas, puntos y coma o saltos de línea
    return v
      .split(/[,\n;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

export class CreateSubmissionDto {
  // ===== Requeridos mínimos para poder aprobar luego =====
  @Transform(({ value }) => toStr(value))
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug!: string;

  @Transform(({ value }) => toStr(value))
  @IsString()
  nombre!: string;

  @Transform(({ value }) => toStr(value))
  @IsString()
  cedula!: string;

  // Ej.: "Municipio, Estado"
  @Transform(({ value }) => toStr(value))
  @IsString()
  ubicacion!: string;

  @Transform(({ value }) => toStr(value))
  @IsString()
  fotoHero!: string;

  // ===== Opcionales del formulario =====
  @IsOptional()
  @IsBoolean()
  verificado?: boolean;

  @Transform(({ value }) => toStrOrUndef(value))
  @IsOptional()
  @IsString()
  foto?: string; // (a veces lo llamas avatar en el front)

  @Transform(({ value }) => toStrOrUndef(value))
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @Transform(({ value }) => toStrArray(value))
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  especialidades?: string[];

  // Puede llegar string[] o string; la normalizamos a array
  @Transform(({ value }) => {
    if (Array.isArray(value)) return toStrArray(value);
    if (typeof value === 'string') return toStrArray(value);
    return undefined; // la dejamos undefined si no llega
  })
  @IsOptional()
  experiencia?: string[]; // ya normalizada

  @Transform(({ value }) => toStrArray(value))
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  servicios?: string[];

  @Transform(({ value }) => {
    if (Array.isArray(value) || typeof value === 'string') return toStrArray(value);
    return undefined;
  })
  @IsOptional()
  aseguradoras?: string[];

  @Transform(({ value }) => toStrOrUndef(value))
  @IsOptional()
  @IsString()
  logroDestacado?: string;

  @Transform(({ value }) => toStrArray(value))
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  logosAseg?: string[];

  @Transform(({ value }) => toStrArray(value))
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fotosMini?: string[];

  // Redes sociales
  @Transform(({ value }) => toStrOrUndef(value))
  @IsOptional()
  @IsString()
  facebook?: string;

  @Transform(({ value }) => toStrOrUndef(value))
  @IsOptional()
  @IsString()
  instagram?: string;

  @Transform(({ value }) => toStrOrUndef(value))
  @IsOptional()
  @IsString()
  linkedin?: string;

  @Transform(({ value }) => toStrOrUndef(value))
  @IsOptional()
  @IsString()
  tiktok?: string;
}
