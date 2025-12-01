// api/src/blog/dto/create-post.dto.ts
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MaxLength,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  excerpt?: string;

  @IsOptional()
  @IsString()
  contentMd?: string;

  @IsOptional()
  @IsUrl()
  img?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assets?: string[];

  @IsString()
  topic!: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsString()
  author!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  readMinutes?: number;

  @IsOptional()
  @IsUrl()
  externalUrl?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsDateString()
  publishedAt?: string; // lo convertimos a Date en el servicio
}
