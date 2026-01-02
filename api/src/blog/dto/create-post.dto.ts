// api/src/blog/dto/create-post.dto.ts

import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @Length(3, 200)
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  contentHtml!: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  excerpt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  readMinutes?: number;

  // 🔥 AQUÍ ESTÁ LA CLAVE
  @IsOptional()
  @IsString()
  coverImg?: string;

  @IsString()
  author!: string;

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  // ✅ NUEVO — galería
  @IsOptional()
  galleryImgs?: string[];
}
