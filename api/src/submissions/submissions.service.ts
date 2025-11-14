// api/src/submissions/submissions.service.ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';

type AdminSubmissionView = {
  id: string;
  createdAt: Date;
  status: SubmissionStatus;

  slug: string;
  nombre: string;
  cedula: string | null;
  verificado: boolean;

  ubicacion: string | null;
  whatsapp: string | null;

  experiencia: string[];          // ← normalizado
  aseguradoras: string[];         // ← normalizado
  especialidades: string[];
  servicios: string[];

  media: {
    hero: string | null;
    avatar: string | null;
    thumbs: string[];             // fotosMini
    logosAseg: string[];          // logosAseg
  };

  social: {
    facebook?: string | null;
    instagram?: string | null;
    linkedin?: string | null;
    tiktok?: string | null;
  };
};

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Util para URLs absolutas (si en DB guardas solo nombres)
  private abs(url?: string | null): string | null {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    const base = process.env['PUBLIC_BASE_URL']?.replace(/\/+$/, '') ?? '';
    // ajusta el prefijo a como sirves estáticos (aquí /public/)
    return `${base}/public/${url.replace(/^\/+/, '')}`;
  }

  private toView(sub: any): AdminSubmissionView {
    const experiencia =
      typeof sub.experiencia === 'string' && sub.experiencia.trim()
        ? sub.experiencia.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : [];

    const aseguradoras =
      typeof sub.aseguradoras === 'string' && sub.aseguradoras.trim()
        ? sub.aseguradoras.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

    return {
      id: sub.id,
      createdAt: sub.createdAt,
      status: sub.status,

      slug: sub.slug,
      nombre: sub.nombre,
      cedula: sub.cedula ?? null,
      verificado: Boolean(sub.verificado),

      ubicacion: sub.ubicacion ?? null,
      whatsapp: sub.whatsapp ?? null,

      experiencia,
      aseguradoras,
      especialidades: Array.isArray(sub.especialidades) ? sub.especialidades : [],
      servicios: Array.isArray(sub.servicios) ? sub.servicios : [],

      media: {
        hero: this.abs(sub.fotoHero),
        avatar: this.abs(sub.foto),
        thumbs: Array.isArray(sub.fotosMini) ? sub.fotosMini.map((x: string) => this.abs(x)!) : [],
        logosAseg: Array.isArray(sub.logosAseg) ? sub.logosAseg.map((x: string) => this.abs(x)!) : [],
      },

      social: {
        facebook: sub.facebook ?? null,
        instagram: sub.instagram ?? null,
        linkedin: sub.linkedin ?? null,
        tiktok: sub.tiktok ?? null,
      },
    };
  }

  // ====== Crear solicitud (público) ======
  async create(dto: CreateSubmissionDto) {
    const exists = await this.prisma.agentSubmission.findUnique({
      where: { slug: dto.slug },
    });
    if (exists) throw new BadRequestException('El slug ya existe en solicitudes.');

    const experienciaTexto =
      dto.experiencia == null
        ? null
        : Array.isArray(dto.experiencia)
        ? dto.experiencia.join('\n')
        : dto.experiencia;

    const aseguradorasTexto =
      dto.aseguradoras == null
        ? null
        : Array.isArray(dto.aseguradoras)
        ? dto.aseguradoras.join(',')
        : dto.aseguradoras;

    const data: Prisma.AgentSubmissionCreateInput = {
      status: SubmissionStatus.PENDING,
      slug: dto.slug,
      nombre: dto.nombre,
      cedula: dto.cedula ?? null,
      verificado: dto.verificado ?? false,

      foto: dto.foto ?? null,
      ubicacion: dto.ubicacion ?? null,
      whatsapp: dto.whatsapp ?? null,

      especialidades: dto.especialidades ?? [],
      experiencia: experienciaTexto,
      servicios: dto.servicios ?? [],

      aseguradoras: aseguradorasTexto,
      logroDestacado: dto.logroDestacado ?? null,

      logosAseg: dto.logosAseg ?? [],
      fotosMini: dto.fotosMini ?? [],
      fotoHero: dto.fotoHero ?? null,

      facebook: dto.facebook ?? null,
      instagram: dto.instagram ?? null,
      linkedin: dto.linkedin ?? null,
      tiktok: dto.tiktok ?? null,
    };

    try {
      return await this.prisma.agentSubmission.create({ data });
    } catch (e: any) {
      console.error('[create submission] prisma error:', e?.code, e?.message, e?.meta);
      if (e?.code === 'P2002') throw new BadRequestException('El slug ya existe en solicitudes.');
      if (e?.code === 'P2021') {
        throw new InternalServerErrorException('Tabla AgentSubmission no existe. Ejecuta prisma db push.');
      }
      throw new InternalServerErrorException('No se pudo crear la solicitud.');
    }
  }

  // ====== Listar/Detalle (admin) ======
  async findAll(status?: SubmissionStatus) {
    const where = status ? { status } : undefined;
    const rows = await this.prisma.agentSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toView(r));
  }

  async findOne(id: string) {
    const sub = await this.prisma.agentSubmission.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Solicitud no encontrada');
    return this.toView(sub);
  }

  // ====== Aprobar (promueve a Agent) ======
  async approve(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const sub = await tx.agentSubmission.findUnique({ where: { id } });
      if (!sub) throw new NotFoundException('Solicitud no encontrada');

      if (sub.status !== SubmissionStatus.PENDING) {
        throw new BadRequestException('La solicitud no está en estado PENDING.');
      }

      if (!sub.cedula) throw new BadRequestException('Falta "cedula".');
      if (!sub.ubicacion) throw new BadRequestException('Falta "ubicacion".');
      if (!sub.fotoHero) throw new BadRequestException('Falta "fotoHero".');

      const experienciaArray =
        typeof sub.experiencia === 'string' && sub.experiencia.trim()
          ? sub.experiencia.split('\n').map((s) => s.trim()).filter(Boolean)
          : [];

      const aseguradorasArray =
        typeof sub.aseguradoras === 'string' && sub.aseguradoras.trim()
          ? sub.aseguradoras.split(',').map((s) => s.trim()).filter(Boolean)
          : [];

      await tx.agent.create({
        data: {
          slug: sub.slug,
          nombre: sub.nombre,
          cedula: sub.cedula,
          verificado: sub.verificado ?? false,
          avatar: sub.foto ?? null,
          ubicacion: sub.ubicacion,
          whatsapp: sub.whatsapp ?? null,
          especialidades: sub.especialidades ?? [],
          experiencia: experienciaArray,
          servicios: sub.servicios ?? [],
          certificaciones: [],
          aseguradoras: aseguradorasArray,
          mediaThumbs: sub.fotosMini ?? [],
          mediaHero: sub.fotoHero!,
        },
      });

      return tx.agentSubmission.update({
        where: { id },
        data: { status: SubmissionStatus.APPROVED, reviewedAt: new Date() },
      });
    });
  }

  async reject(id: string, notes?: string) {
    const sub = await this.prisma.agentSubmission.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Solicitud no encontrada');
    if (sub.status !== SubmissionStatus.PENDING) {
      throw new BadRequestException('La solicitud no está en PENDING.');
    }
    return this.prisma.agentSubmission.update({
      where: { id },
      data: {
        status: SubmissionStatus.REJECTED,
        reviewedAt: new Date(),
        reviewNotes: notes ?? null,
      },
    });
  }
}
