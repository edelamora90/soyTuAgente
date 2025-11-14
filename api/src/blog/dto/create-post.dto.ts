// api/src/blog/dto/create-post.dto.ts
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class CreatePostDto {
  @IsString()
  title!: string;

  // lo generas en el backend si no viene
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional() @IsString() excerpt?: string;
  @IsOptional() @IsString() contentMd?: string;

  @IsOptional() @IsUrl() img?: string;

  @IsString()
  topic!: string;

  @IsOptional() @IsString() tag?: string;

  @IsOptional() @IsInt() @Min(1) readMinutes?: number;

  @IsOptional() @IsUrl() externalUrl?: string;

  @IsOptional() @IsBoolean() published?: boolean;
  // publishedAt lo fija el servicio cuando published=true
}
