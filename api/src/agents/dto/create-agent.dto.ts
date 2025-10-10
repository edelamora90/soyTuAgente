// api/src/agents/dto/create-agent.dto.ts
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsUrlOrAssetPath } from '../../validators/url-or-asset.validator';
import { Transform } from 'class-transformer';

export class CreateAgentDto {
  @IsString()
  @Length(1, 100)
  slug!: string;

  @IsString()
  @Length(1, 200)
  nombre!: string;

  @IsString()
  @Length(1, 200)
  cedula!: string;

  @IsBoolean()
  verificado!: boolean;

  @IsOptional()
  @IsString()
  @IsUrlOrAssetPath({ message: 'avatar must be an http(s) URL or assets/* path' })
  avatar?: string | null;

  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.filter(Boolean).join(', ')
      : (value ?? '').toString()
  )
  @IsString()
  ubicacion!: string;

  @IsOptional()
  @IsString()
  whatsapp?: string | null;

  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  especialidades!: string[];

  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  experiencia!: string[];

  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  servicios!: string[];

  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  certificaciones!: string[];

  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  aseguradoras!: string[];

  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  mediaThumbs!: string[];

  @IsString()
  @IsUrlOrAssetPath({ message: 'mediaHero must be an http(s) URL or assets/* path' })
  mediaHero!: string;

  @IsOptional()
  @Type(() => Object)
  redes?: { icon: string; url: string }[] | null;
}
