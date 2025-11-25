// api/src/blog/blog.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { join } from 'path';

import { BlogService } from './blog.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import {
  BLOG_ROOT,
  ensureDir,
  saveOptimizedWebp,
  PUBLIC_ROOT,
  toPublicRelative,
} from './uploads.util';
import { PrismaService } from '../prisma/prisma.service';

const storage = memoryStorage();
const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

@Controller('posts')
export class BlogController {
  constructor(
    private readonly svc: BlogService,
    private readonly prisma: PrismaService,
  ) {}

  // ===== CRUD =====

  @Get('latest')
  latest(@Query('limit') limit?: string) {
    return this.svc.getLatest(limit ? Number(limit) : 3);
  }

  @Get()
  list(
    @Query('q') q?: string,
    @Query('published') published?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.svc.list({
      q,
      published: published !== undefined ? published === 'true' : undefined,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Get('id/:id')
  byId(@Param('id') id: string) {
    return this.prisma.post.findUnique({ where: { id } });
  }

  @Get('slug/:slug')
  bySlugRest(@Param('slug') slug: string) {
    return this.svc.getBySlug(slug);
  }

  @Get(':slug')
  bySlugPublic(@Param('slug') slug: string) {
    return this.svc.getBySlug(slug);
  }

  @Post()
  create(@Body() dto: CreatePostDto) {
    return this.svc.create(dto);
  }

  @Put(':id')
  replace(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.svc.update(id, dto);
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }

  // ===== SUBIDAS =====

  private async resolvePostDirs(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) throw new BadRequestException('Post no encontrado');

    const folder = (post.slug || post.id).trim();

    const base = join(BLOG_ROOT, folder);
    const coverD = join(base, 'cover');
    const assetsD = join(base, 'assets');

    await ensureDir(coverD);
    await ensureDir(assetsD);

    return { post, base, coverD, assetsD };
  }

  @Post(':id/upload/cover')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadCover(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Archivo faltante');
    if (!IMAGE_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Formato no soportado');
    }

    const { coverD, post } = await this.resolvePostDirs(id);
    const outPath = join(coverD, 'cover.webp');

    const { bytes, path: savedPath } = await saveOptimizedWebp(
      file.buffer,
      outPath,
      { maxWidth: 1600, targetKB: 300 },
    );

    const relativePath = toPublicRelative(savedPath); // /blog/slug/cover/cover.webp
    const imgUrl = `/public${relativePath}`;          // /public/blog/slug/cover/cover.webp

    const updated = await this.prisma.post.update({
      where: { id: post.id },
      data: { img: imgUrl },
      select: { id: true, slug: true, img: true, title: true },
    });

    return {
      ok: true,
      bytes,
      url: imgUrl,
      post: updated,
      debug: {
        PUBLIC_ROOT,
        savedPath,
        relativePath,
        imgUrl,
      },
    };
  }

  @Post(':id/upload/assets')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'files', maxCount: 20 }],
      { storage, limits: { fileSize: 10 * 1024 * 1024 } },
    ),
  )
  async uploadAssets(
    @Param('id') id: string,
    @UploadedFiles()
    files?: { files?: Express.Multer.File[] },
  ) {
    const list = files?.files || [];
    if (!list.length) throw new BadRequestException('Sin archivos');

    const { assetsD, post } = await this.resolvePostDirs(id);

    const results: Array<{ name: string; url: string; bytes: number }> = [];

    for (const f of list) {
      if (!IMAGE_MIME.includes(f.mimetype)) continue;

      const baseName = (f.originalname || 'asset')
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9._-]/g, '')
        .replace(/\.[^.]+$/, '');

      const outPath = join(assetsD, `${baseName}.webp`);
      const { bytes, path: savedPath } = await saveOptimizedWebp(
        f.buffer,
        outPath,
        { maxWidth: 1200, targetKB: 300 },
      );

      const relativePath = toPublicRelative(savedPath);
      const url = `/public${relativePath}`;

      results.push({
        name: `${baseName}.webp`,
        url,
        bytes,
      });
    }

    return {
      ok: true,
      post: { id: post.id, slug: post.slug },
      assets: results,
    };
  }
}
