import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname, relative } from 'path';
import { existsSync, mkdirSync } from 'fs';

const ROOT = join(process.cwd(), 'api', 'uploads');
const AGENTS_DIR = join(ROOT, 'agents');

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}
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

@Controller('uploads')
export class UploadsController {
  /** POST /api/uploads/agents  (campo: file) */
  @Post('agents')
  @UseInterceptors(FileInterceptor('file', {
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
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
      if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) {
        return cb(new BadRequestException('Tipo de archivo no permitido'), false);
      }
      cb(null, true);
    },
  }))
  uploadAgent(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const base = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const sub  = relative(ROOT, file.destination).replace(/\\/g, '/');
    const url  = `${base}/public/${sub}/${file.filename}`;

    return {
      url,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
