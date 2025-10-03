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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { diskStorage } from 'multer';
import { join, extname, relative } from 'path';
import { existsSync, mkdirSync } from 'fs';

import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

// ====== util upload ======
const ROOT = join(process.cwd(), 'api', 'uploads');
const AGENTS_DIR = join(ROOT, 'agents');
function ensureDir(dir: string) { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); }
ensureDir(AGENTS_DIR);

function sanitizeBase(name: string) {
  const base = (name || '').replace(/\.[^.]+$/, '');
  return base.trim().toLowerCase()
    .replace(/[^a-z0-9\-_.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64) || 'file';
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

@Controller('agents')
export class AgentsController {
  constructor(private readonly service: AgentsService) {}

  // ---------- CRUD básicos ----------
  @Get()
  list() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateAgentDto) {
    return this.service.create(dto);
  }

  // ---------- Utilitarias ----------
  @Post('bulk')
  bulk(@Body() items: any[]) {
    return this.service.bulkCreate(items);
  }

  @Post('import-csv')
  @UseInterceptors(FileInterceptor('file'))
  importCsv(@UploadedFile() file: Express.Multer.File) {
    return this.service.importCsvAndUpsert(file);
  }

  @Get('sample-csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="agents-sample.csv"')
  sampleCsv() {
    const headers = [
      'slug','nombre','cedula','verificado','avatar','ubicacion','whatsapp',
      'especialidades','experiencia','servicios','certificaciones',
      'aseguradoras','mediaThumbs','mediaHero','facebook','instagram','linkedin','tiktok',
    ].join(',');

    const rows = [
      [
        'paulo-ochoa','Paulo Ochoa Ibarra','Cédula: 3246754 19873640','true',
        'assets/agents/paulo.jpg','Colima, Colima','5213121234567',
        '"vehiculos, salud-asistencia, hogar-negocio"',
        '"+8 años de experiencia"',
        '"Contratación de pólizas, Renovación de pólizas"',
        'Diamantes Qualitas',
        '"assets/qualitas.png;assets/metlife.png"',
        '"assets/profile/mini1.jpg,assets/profile/mini2.jpg,assets/profile/mini3.jpg"',
        'assets/agents/profile-hero.jpg','pauloochoa','paulo.ig','paulo-ln','paulo_tt',
      ].join(','),
    ];

    return [headers, ...rows].join('\n') + '\n';
  }

  // ---------- Upload de imágenes (Opción A) ----------
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, cb) => { ensureDir(AGENTS_DIR); cb(null, AGENTS_DIR); },
      filename: (_req, file, cb) => {
        const base = sanitizeBase(file.originalname || 'file');
        const ext  = pickExt(file);
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
  }))
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const base = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const sub  = relative(ROOT, file.destination).replace(/\\/g, '/'); // 'agents'
    const url  = `${base}/public/${sub}/${file.filename}`;

    return {
      url,                   // ← úsalo en el front
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    };
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
