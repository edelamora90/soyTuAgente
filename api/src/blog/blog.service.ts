import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import slugify from 'slugify';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // CREATE
  // ===========================================================================
  async create(dto: CreatePostDto) {
    const slug = dto.slug
      ? dto.slug
      : slugify(dto.title, { lower: true, strict: true });

    const excerpt =
      dto.excerpt && dto.excerpt.trim().length > 0
        ? dto.excerpt
        : this.generateExcerpt(dto.contentHtml);

    const readMinutes =
      dto.readMinutes ?? this.estimateReadTime(dto.contentHtml);

    const isDraft = dto.isDraft ?? true;

    const publishedAt = isDraft
      ? null
      : dto.publishedAt
      ? new Date(dto.publishedAt)
      : new Date();

    const post = await this.prisma.post.create({
      data: {
        title: dto.title,
        slug,
        contentHtml: dto.contentHtml,
        excerpt,
        coverImg: dto.coverImg,
        readMinutes,
        author: dto.author,
        isDraft,
        isFeatured: dto.isFeatured ?? false,
        publishedAt,

        // 🔥 GALERÍA (PostAsset)
        assets: dto.galleryImgs?.length
          ? {
              createMany: {
                data: dto.galleryImgs.map((url) => ({ url })),
              },
            }
          : undefined,
      },
      include: {
        assets: true,
      },
    });

    return this.mapPost(post);
  }

  // ===========================================================================
  // ADMIN
  // ===========================================================================

  async findByIdAdmin(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { assets: true },
    });

    if (!post) throw new NotFoundException('Post no encontrado');

    return this.mapPost(post);
  }

  findAllAdmin() {
    return this.prisma.post
      .findMany({
        orderBy: { createdAt: 'desc' },
        include: { assets: true },
      })
      .then((posts) => posts.map(this.mapPost));
  }

  // ===========================================================================
  // UPDATE
  // ===========================================================================
  async update(id: string, dto: UpdatePostDto) {
    const slug =
      dto.slug
        ? dto.slug
        : dto.title
        ? slugify(dto.title, { lower: true, strict: true })
        : undefined;

    const contentHtml = dto.contentHtml;

    const excerpt =
      dto.excerpt !== undefined
        ? dto.excerpt?.trim().length
          ? dto.excerpt
          : contentHtml
          ? this.generateExcerpt(contentHtml)
          : undefined
        : undefined;

    const readMinutes =
      dto.readMinutes !== undefined
        ? dto.readMinutes
        : contentHtml
        ? this.estimateReadTime(contentHtml)
        : undefined;

    const post = await this.prisma.post.update({
      where: { id },
      data: {
        title: dto.title,
        contentHtml,
        coverImg: dto.coverImg,
        author: dto.author,
        isDraft: dto.isDraft,
        isFeatured: dto.isFeatured,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,

        ...(slug ? { slug } : {}),
        ...(excerpt !== undefined ? { excerpt } : {}),
        ...(readMinutes !== undefined ? { readMinutes } : {}),

        // 🔥 GALERÍA (reemplazo completo)
        assets: dto.galleryImgs
          ? {
              deleteMany: {},
              createMany: {
                data: dto.galleryImgs.map((url) => ({ url })),
              },
            }
          : undefined,
      },
      include: {
        assets: true,
      },
    });

    return this.mapPost(post);
  }

  // ===========================================================================
  // PUBLIC
  // ===========================================================================

  findPublic() {
    return this.prisma.post
      .findMany({
        where: {
          isDraft: false,
          OR: [
            { publishedAt: null },
            { publishedAt: { lte: new Date() } },
          ],
        },
        orderBy: [
          { isFeatured: 'desc' },
          { publishedAt: 'desc' },
        ],
        include: { assets: true },
      })
      .then((posts) => posts.map(this.mapPost));
  }

  async findPublicBySlug(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: {
        slug,
        isDraft: false,
        OR: [
          { publishedAt: null },
          { publishedAt: { lte: new Date() } },
        ],
      },
      include: { assets: true },
    });

    if (!post) {
      throw new NotFoundException('Post no encontrado');
    }

    return this.mapPost(post);
  }



async setFeaturedExclusive(postId: string) {
    const exists = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!exists) throw new NotFoundException('Post no encontrado');

    await this.prisma.$transaction([
      this.prisma.post.updateMany({
        data: { isFeatured: false },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { isFeatured: true },
      }),
    ]);

    return { ok: true };
  }

  async setFeatured(id: string) {
  return this.prisma.$transaction(async (tx) => {
    // 1️⃣ Quitar destacado a TODOS
    await tx.post.updateMany({
      where: { isFeatured: true },
      data: { isFeatured: false },
    });

    // 2️⃣ Marcar el nuevo
    return tx.post.update({
      where: { id },
      data: { isFeatured: true },
    });
  });
}


  async remove(id: string) {
    const exists = await this.prisma.post.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Post no encontrado');
    await this.prisma.post.delete({ where: { id } });
    return { ok: true };
  }




  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private mapPost(post: any) {
    return {
      ...post,
      galleryImgs: post.assets?.map((a: any) => a.url) ?? [],
      assets: undefined, // no exponemos la relación cruda
    };
  }

  private generateExcerpt(html: string): string {
    const text = html.replace(/<[^>]+>/g, '');
    return text.substring(0, 200) + (text.length > 200 ? '…' : '');
  }

  private estimateReadTime(html: string): number {
    const words = html.replace(/<[^>]+>/g, '').split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }
}
