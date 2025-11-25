//api/src/blog/blog.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { slugify } from '../../src/blog/utils/slugify.util';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePostDto) {
    const data = {
      ...dto,
      slug: dto.slug || slugify(dto.title),
    };

    return this.prisma.post.create({ data });
  }

  async update(id: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post no encontrado');

    return this.prisma.post.update({
      where: { id },
      data: {
        ...dto,
        slug: dto.slug ?? (dto.title ? slugify(dto.title) : undefined),

      },
    });
  }

  async remove(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }

  async list(opts?: {
    q?: string;
    published?: boolean;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.post.findMany({
      where: {
        ...(opts?.published !== undefined
          ? { published: opts.published }
          : {}),
        ...(opts?.q
          ? {
              OR: [
                { title: { contains: opts.q, mode: 'insensitive' } },
                { topic: { contains: opts.q, mode: 'insensitive' } },
                { tag: { contains: opts.q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { publishedAt: 'desc' },
      skip: opts?.skip,
      take: opts?.take,
    });
  }

  async getLatest(limit = 3) {
    return this.prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
  }

  async getBySlug(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        slug,
        published: true,
      },
    });

    if (!post) throw new NotFoundException('Post no encontrado');
    return post;
  }
}
