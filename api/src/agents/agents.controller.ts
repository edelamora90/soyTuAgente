// api/src/agents/agents.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { diskStorage } from 'multer';
import { join, extname, relative } from 'path';
import { existsSync, mkdirSync } from 'fs';

import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

// ====== util upload (RUTA CORRECTA) ======
const UPLOADS_ROOT = join(process.cwd(), 'api', 'uploads'); // ✅ raíz real del monorepo
const AGENTS_DIR   = join(UPLOADS_ROOT, 'agents');

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}
ensureDir(AGENTS_DIR);

function sanitizeBase(name: string) {
  const base = (name || '').replace(/\.[^.]+$/, '');
  return (
    base
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\-_.]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 64) || 'file'
  );
}
function pickExt(file: Express.Multer.File) {
  const e = (extname(file.originalname || '') || '').toLowerCase();
  if (e) return e;
  if (/png$/i.test(file.mimetype)) return '.png';
  if (/jpe?g$/i.test(file.mimetype)) return '.jpg';
  if (/webp$/i.test(file.mimetype)) return '.webp';
  if (/gif$/i.test(file.mimetype)) return '.gif';
  return '.jpg';
}

/** Construye la URL pública para un archivo subido a /api/uploads/... */
function publicUrlFor(file: Express.Multer.File) {
  const sub = relative(UPLOADS_ROOT, file.destination).replace(/\\/g, '/'); // 'agents', 'blog/cover', etc.
  return `/public/${sub}/${file.filename}`;
}

/** JSON.parse seguro (no lanza), útil para body.redes */
function parseJsonSafe<T>(v: any): T | undefined {
  if (typeof v !== 'string') return undefined;
  try { return JSON.parse(v) as T; } catch { return undefined; }
}

@Controller('agents')
export class AgentsController {
  constructor(private readonly service: AgentsService) {}

  // ---------- CRUD básicos ----------
  @Patch('reorder') 
  @Post('reorder')
reorder(@Body() items: { slug: string; order: number }[]) {
  return this.service.updateOrder(items);
}

@Get('search')
search(@Query() query: any) {
  return this.service.search(query);
}
  
  
  @Get()
  list() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateAgentDto) {
    return this.service.create(dto);
  }




  

  // ---------- Upload de imagen individual ----------
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureDir(AGENTS_DIR);
          cb(null, AGENTS_DIR);
        },
        filename: (_req, file, cb) => {
          const base = sanitizeBase(file.originalname || 'file');
          const ext = pickExt(file);
          cb(null, `${Date.now()}-${base}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) {
          return cb(new BadRequestException('Tipo de archivo no permitido'), false);
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return {
      url: publicUrlFor(file),
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  // ---------- Crear agente + subir múltiples archivos ----------
  @Post('with-files')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatar', maxCount: 1 },
        { name: 'mediaHero', maxCount: 1 },
        { name: 'mediaThumbs', maxCount: 24 },
      ],
      {
        storage: diskStorage({
          destination: (_req, _file, cb) => {
            ensureDir(AGENTS_DIR);
            cb(null, AGENTS_DIR);
          },
          filename: (_req, file, cb) => {
            const base = sanitizeBase(file.originalname || 'file');
            const ext  = pickExt(file);
            cb(null, `${Date.now()}-${base}${ext}`);
          },
        }),
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB c/u
        fileFilter: (_req, file, cb) => {
          if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) {
            return cb(new BadRequestException('Tipo de archivo no permitido'), false);
          }
          cb(null, true);
        },
      },
    ),
  )
  async createWithFiles(
    @Body() body: any,
    @UploadedFiles() files: {
      avatar?: Express.Multer.File[];
      mediaHero?: Express.Multer.File[];
      mediaThumbs?: Express.Multer.File[];
    },
  ) {
    const toList = (v: any) =>
      typeof v === 'string'
        ? v.split(',').map((s) => s.trim()).filter(Boolean)
        : Array.isArray(v)
          ? v
          : [];

    const dto: CreateAgentDto = {
      slug:       String(body.slug || '').trim(),
      nombre:     String(body.nombre || '').trim(),
      cedula:     String(body.cedula || '').trim(),
      verificado: String(body.verificado || '').toLowerCase() === 'true',
      ubicacion:  String(body.ubicacion || '').trim(),
      whatsapp:   body.whatsapp ? String(body.whatsapp) : null,

      especialidades:  toList(body.especialidades),
      experiencia:     toList(body.experiencia),
      certificaciones: toList(body.certificaciones),
      aseguradoras:    toList(body.aseguradoras),

      avatar:    files?.avatar?.[0]    ? publicUrlFor(files.avatar[0])    : (body.avatar || null),
      mediaHero: files?.mediaHero?.[0] ? publicUrlFor(files.mediaHero[0]) : String(body.mediaHero || '').trim(),
      mediaThumbs: files?.mediaThumbs?.length
        ? files.mediaThumbs.map(publicUrlFor)
        : toList(body.mediaThumbs),

      redes: parseJsonSafe<{ icon: string; url: string }[]>(body.redes) ?? null,
    };

    if ((!dto.mediaHero || !dto.mediaHero.trim()) && dto.mediaThumbs?.length) {
      dto.mediaHero = dto.mediaThumbs[0];
    }

    return this.service.create(dto);
  }

  // ---------- Editar agente + subir archivos ----------
  @Patch(':slug/with-files')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatar', maxCount: 1 },
        { name: 'mediaHero', maxCount: 1 },
        { name: 'mediaThumbs', maxCount: 24 },
      ],
      {
        storage: diskStorage({
          destination: (_req, _file, cb) => {
            ensureDir(AGENTS_DIR);
            cb(null, AGENTS_DIR);
          },
          filename: (_req, file, cb) => {
            const base = sanitizeBase(file.originalname || 'file');
            const ext  = pickExt(file);
            cb(null, `${Date.now()}-${base}${ext}`);
          },
        }),
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
          if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) {
            return cb(new BadRequestException('Tipo de archivo no permitido'), false);
          }
          cb(null, true);
        },
      },
    ),
  )
  async updateWithFiles(
    @Param('slug') slug: string,
    @Body() body: any,
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
      mediaHero?: Express.Multer.File[];
      mediaThumbs?: Express.Multer.File[];
    },
  ) {
    const toList = (v: any) =>
      typeof v === 'string'
        ? v.split(',').map((s) => s.trim()).filter(Boolean)
        : Array.isArray(v)
          ? v
          : undefined; // para PATCH usamos undefined

    const patch: Partial<CreateAgentDto> = {
      nombre:      body.nombre?.trim(),
      cedula:      body.cedula?.trim(),
      verificado:  typeof body.verificado === 'string' ? body.verificado.toLowerCase() === 'true' : undefined,
      ubicacion:   body.ubicacion?.trim(),
      whatsapp:    body.whatsapp ?? undefined,

      especialidades:  toList(body.especialidades),
      experiencia:     toList(body.experiencia),
      certificaciones: toList(body.certificaciones),
      aseguradoras:    toList(body.aseguradoras),

      avatar:     files?.avatar?.[0]    ? publicUrlFor(files.avatar[0])    : body.avatar,
      mediaHero:  files?.mediaHero?.[0] ? publicUrlFor(files.mediaHero[0]) : body.mediaHero,
      mediaThumbs: files?.mediaThumbs?.length
        ? files.mediaThumbs.map(publicUrlFor)
        : toList(body.mediaThumbs),

      redes: parseJsonSafe<{ icon: string; url: string }[]>(body.redes),
    };

    Object.keys(patch).forEach((k) => (patch as any)[k] === undefined && delete (patch as any)[k]);

    if ((!patch.mediaHero || !String(patch.mediaHero).trim())
      && Array.isArray(patch.mediaThumbs) && patch.mediaThumbs.length) {
      patch.mediaHero = patch.mediaThumbs[0]!;
    }

    return this.service.update(slug, patch as any);
  }

  // ---------- Por slug ----------
  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.service.findOne(slug);
  }

  @Put(':slug')
  replace(@Param('slug') slug: string, @Body() dto: UpdateAgentDto) {
    return this.service.update(slug, dto);
  }

  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() dto: UpdateAgentDto) {
    return this.service.update(slug, dto);
  }

  @Delete(':slug')
  remove(@Param('slug') slug: string) {
    return this.service.remove(slug);
  }
}
