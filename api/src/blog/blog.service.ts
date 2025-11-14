// api/src/blog/blog.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import slugify from '@sindresorhus/slugify';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePostDto) {
  const slug = dto.slug?.trim() || slugify(dto.title);
  const publishedAt = dto.published ? new Date() : null;

  return this.prisma.post.create({
    data: { ...dto, slug, publishedAt },
  });
}

async update(id: string, dto: UpdatePostDto) {
  const exists = await this.prisma.post.findUnique({ where: { id } });
  if (!exists) throw new NotFoundException('Post not found');

  const slug = dto.slug ? slugify(dto.slug) : undefined;
  const publishedAt =
    dto.published === true && !exists.publishedAt ? new Date()
    : dto.published === false ? null
    : undefined;

  return this.prisma.post.update({
    where: { id },
    data: { ...dto, ...(slug && { slug }), ...(publishedAt !== undefined && { publishedAt }) },
  });
}


  async remove(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }

  async getLatest(limit = 3) {
    return this.prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: { id: true, title: true, slug: true, img: true, topic: true, tag: true, readMinutes: true, externalUrl: true, publishedAt: true },
    });
  }

  async list(params: { q?: string; skip?: number; take?: number; published?: boolean }) {
    const { q, skip = 0, take = 20, published } = params;
    return this.prisma.post.findMany({
      where: {
        ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
        ...(published !== undefined ? { published } : {}),
      },
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
      skip, take,
    });
  }

  async getBySlug(slug: string) {
    return this.prisma.post.findUnique({ where: { slug } });
  }
}
