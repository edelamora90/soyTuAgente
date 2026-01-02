// api/src/agents/agents.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Express } from 'express';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

import * as fs from 'fs';
import * as path from 'path';
const sharp = require('sharp');



// ===== Helpers para URLs públicas (solo backend) =====
function toPublicUrl(p?: string | null): string {
  if (!p) return '';

  if (/^https?:\/\//i.test(p) || p.startsWith('assets/')) return p;

  const clean = p.replace(/^\/+/, '');

  return clean.startsWith('public/')
    ? `/${clean}`
    : `/public/${clean}`;
}

// Campos que vamos a tocar al normalizar URLs
type AgentLike = {
  avatar?: string | null;
  mediaHero?: string | null;
  mediaThumbs?: Array<string | null | undefined>;
  aseguradoras?: Array<string | null | undefined>;
} & Record<string, unknown>;

function mapAgentUrls<T extends AgentLike>(a: T): T {
  if (!a) return a;

  const out: T = { ...a };

  out.avatar = toPublicUrl(out.avatar ?? '');
  out.mediaHero = toPublicUrl(out.mediaHero ?? '');

  if (Array.isArray(out.mediaThumbs)) {
    out.mediaThumbs = out.mediaThumbs.map(v => toPublicUrl(v ?? '')) as T['mediaThumbs'];
  }

  if (Array.isArray(out.aseguradoras)) {
    out.aseguradoras = out.aseguradoras.map(v => {
      const s = String(v ?? '');
      return /^https?:\/\//i.test(s) || s.startsWith('assets/')
        ? s
        : toPublicUrl(s);
    }) as T['aseguradoras'];
  }

  return out;
}


@Injectable()
export class AgentsService {
  // ✅ carpeta física correcta para escribir archivos auxiliares
  private readonly uploadDir = path.join(process.cwd(), 'api', 'uploads', 'agents');

  constructor(private prisma: PrismaService) {
    fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  async findAll() {
  const list = await this.prisma.agent.findMany({
    orderBy: [
      { order: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  return list.map(mapAgentUrls);
}

async search(params: {
  tipo?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, Number(params.page || 1));
  const pageSize = Math.min(50, Number(params.pageSize || 10));
  const skip = (page - 1) * pageSize;

  const where: Prisma.AgentWhereInput = {};

  // 🔹 Filtro por especialidad
  if (params.tipo) {
    where.especialidades = {
      has: params.tipo,
    };
  }

  // 🔹 Búsqueda textual
  if (params.q) {
    where.OR = [
      { nombre: { contains: params.q, mode: 'insensitive' } },
      { ubicacion: { contains: params.q, mode: 'insensitive' } },
      { slug: { contains: params.q, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await this.prisma.$transaction([
    this.prisma.agent.findMany({
      where,

      // ✅ ORDEN GLOBAL DEFINITIVO
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],

      skip,
      take: pageSize,
    }),

    this.prisma.agent.count({ where }),
  ]);

  return {
    items: items.map(mapAgentUrls),
    total,
    page,
    pageSize,
  };
}




  async findOne(slug: string) {
    const agent = await this.prisma.agent.findUnique({ where: { slug } });
    if (!agent) throw new NotFoundException(`Agente con slug "${slug}" no encontrado`);
    return mapAgentUrls(agent);
  }

  async create(dto: CreateAgentDto) {
    try {
      const saved = await this.prisma.agent.create({ data: dto as any });
      return mapAgentUrls(saved);
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async update(slug: string, dto: UpdateAgentDto) {
    await this.findOne(slug);
    try {
      const saved = await this.prisma.agent.update({
        where: { slug },
        data: dto as any,
      });
      return mapAgentUrls(saved);
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async remove(slug: string) {
    await this.findOne(slug);
    return this.prisma.agent.delete({ where: { slug } });
  }

  // ==== Normalización de especialidades a slugs ====
  private static normalizeKey(s: string) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '');
  }

  // ====== Aseguradoras (nombres → logos) ======
  private static CARRIER_LOGOS: Record<string, string> = {
    Qualitas: 'assets/aseguradoras/Qualitas.png',
    'Qualitas Salud': 'assets/aseguradoras/Qualitassalud.png',
    AFIRME: 'assets/aseguradoras/Afirme.png',
    Alianz: 'assets/aseguradoras/Alianz.png',
    AXA: 'assets/aseguradoras/Axa.png',
    GNP: 'assets/aseguradoras/Gnp.png',
    HDI: 'assets/aseguradoras/Hdi.png',
    INBURSA: 'assets/aseguradoras/Inbursa.png',
    MAPFRE: 'assets/aseguradoras/Mapfre.png',
    MetLife: 'assets/aseguradoras/Metlife.png',
    'Seguros Atlas': 'assets/aseguradoras/Segurosatlas.png',
Otros: 'assets/aseguradoras/Otros.png',
    
  };

  private static norm(s: string) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
  }

  private static CARRIER_LOOKUP: Record<string, string> = Object.fromEntries(
    Object.entries(AgentsService.CARRIER_LOGOS).map(([name, url]) => [
      AgentsService.norm(name),
      url,
    ]),
  );

  private static carrierToLogo(v: string): string {
    if (!v) return v;
    if (/^https?:\/\//i.test(v) || v.startsWith('assets/')) return v;
    return AgentsService.CARRIER_LOOKUP[AgentsService.norm(v)] ?? v;
  }

  
  
  // ================== Upload de avatar (utilitario opcional) ==================
  async saveAvatar(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió archivo de imagen.');
    }

    // Validación básica de tipo / tamaño
    const okType = /^image\/(png|jpe?g|webp|gif|avif)$/i.test(file.mimetype);
    if (!okType) throw new BadRequestException('Formato de imagen no permitido.');
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('La imagen excede 10MB.');
    }

    try {
      const id = Date.now();
      const fileName = `${id}-perfil-de-usuario.jpg`;
      const destPath = path.join(this.uploadDir, fileName);

      await sharp(file.buffer)
        .resize(800, 800, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 80 })
        .toFile(destPath);

      const storagePath = `agents/${fileName}`;
      const url = toPublicUrl(storagePath);

      return { ok: true, path: storagePath, url };
    } catch (err) {
      console.error('Error guardando avatar:', err);
      throw new InternalServerErrorException('No se pudo guardar la imagen del agente.');
    }
  }
  // ================== Reordenar agentes ==================

  async updateOrder(items: { slug: string; order: number }[]) {
  await this.prisma.$transaction(
    items.map(item =>
      this.prisma.agent.update({
        where: { slug: item.slug },
        data: { order: item.order },
      }),
    ),
  );

  return { ok: true };
}





  // ========================= Helpers =========================
  private handlePrismaError(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        throw new BadRequestException('Valor único duplicado (por ejemplo, "slug").');
      }
    }
    throw e;
  }

  
}
