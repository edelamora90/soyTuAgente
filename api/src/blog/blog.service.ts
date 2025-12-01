// api/src/blog/blog.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { BlogPost } from '@prisma/client';
import { slugify } from '../../src/blog/utils/slugify.util'; // crea este helper, lo pongo abajo

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  private buildSlug(title: string, slug?: string | null): string {
    const base = slug && slug.trim().length > 0 ? slug : slugify(title);
    return base.toLowerCase();
  }

  private buildExcerpt(excerpt: string | undefined, contentMd: string | undefined): string | null {
    if (excerpt && excerpt.trim().length > 0) return excerpt.trim();
    if (!contentMd) return null;
    const text = contentMd.replace(/[#*_`>]/g, ' ').replace(/\s+/g, ' ').trim();
    return text.slice(0, 200);
  }

  private resolvePublishedState(
    dto: { published?: boolean; publishedAt?: string },
    current?: BlogPost | null,
  ) {
    const published = dto.published ?? current?.published ?? false;

    let publishedAt: Date | null = current?.publishedAt ?? null;

    if (dto.publishedAt) {
      publishedAt = new Date(dto.publishedAt);
    } else if (published && !publishedAt) {
      // si se marca como publicado y no trae fecha, usamos ahora
      publishedAt = new Date();
    } else if (!published) {
      // si se marca como borrador, limpiamos fecha
      publishedAt = null;
    }

    return { published, publishedAt };
  }

  async create(dto: CreatePostDto): Promise<BlogPost> {
    const slug = this.buildSlug(dto.title, dto.slug);
    const excerpt = this.buildExcerpt(dto.excerpt, dto.contentMd);
    const { published, publishedAt } = this.resolvePublishedState(dto);

    return this.prisma.blogPost.create({
      data: {
        title: dto.title,
        slug,
        excerpt,
        contentMd: dto.contentMd ?? null,
        img: dto.img ?? null,
        assets: dto.assets ?? [],
        topic: dto.topic,
        tag: dto.tag ?? null,
        author: dto.author,
        readMinutes: dto.readMinutes ?? null,
        externalUrl: dto.externalUrl ?? null,
        isFeatured: dto.isFeatured ?? false,
        published,
        publishedAt,
      },
    });
  }

  async findAll(): Promise<BlogPost[]> {
    return this.prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<BlogPost> {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post no encontrado');
    return post;
  }

  async update(id: string, dto: UpdatePostDto): Promise<BlogPost> {
    const current = await this.findOne(id);

    const slug = dto.title || dto.slug ? this.buildSlug(dto.title ?? current.title, dto.slug) : current.slug;
    const excerpt = this.buildExcerpt(dto.excerpt ?? current.excerpt ?? undefined, dto.contentMd ?? current.contentMd ?? undefined);
    const { published, publishedAt } = this.resolvePublishedState(dto, current);

    return this.prisma.blogPost.update({
      where: { id },
      data: {
        title: dto.title ?? current.title,
        slug,
        excerpt,
        contentMd: dto.contentMd ?? current.contentMd,
        img: dto.img ?? current.img,
        assets: dto.assets ?? current.assets,
        topic: dto.topic ?? current.topic,
        tag: dto.tag ?? current.tag,
        author: dto.author ?? current.author,
        readMinutes: dto.readMinutes ?? current.readMinutes,
        externalUrl: dto.externalUrl ?? current.externalUrl,
        isFeatured: dto.isFeatured ?? current.isFeatured,
        published,
        publishedAt,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.blogPost.delete({ where: { id } });
  }
}
