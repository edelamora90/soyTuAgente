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

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ====== Crear solicitud (público) ======
  async create(dto: CreateSubmissionDto) {
    // Unicidad por slug
    const exists = await this.prisma.agentSubmission.findUnique({
      where: { slug: dto.slug },
    });
    if (exists) {
      throw new BadRequestException('El slug ya existe en solicitudes.');
    }

    // Normaliza tipos a lo que espera el modelo AgentSubmission
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
      // Log útil de diagnóstico
      console.error('[create submission] prisma error:', e?.code, e?.message, e?.meta);
      if (e?.code === 'P2002') {
        throw new BadRequestException('El slug ya existe en solicitudes.');
      }
      if (e?.code === 'P2021') {
        throw new InternalServerErrorException(
          'Tabla AgentSubmission no existe. Ejecuta prisma db push.',
        );
      }
      throw new InternalServerErrorException('No se pudo crear la solicitud.');
    }
  }

  // ====== Listar/Detalle (admin) ======
  async findAll(status?: SubmissionStatus) {
    const where = status ? { status } : undefined;
    return this.prisma.agentSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const sub = await this.prisma.agentSubmission.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('Solicitud no encontrada');
    return sub;
  }

  // ====== Aprobar (promueve a Agent) ======
  async approve(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const sub = await tx.agentSubmission.findUnique({ where: { id } });
      if (!sub) throw new NotFoundException('Solicitud no encontrada');

      if (sub.status !== SubmissionStatus.PENDING) {
        throw new BadRequestException('La solicitud no está en estado PENDING.');
      }

      // Requisitos mínimos para Agent
      if (!sub.cedula) throw new BadRequestException('Falta "cedula".');
      if (!sub.ubicacion) throw new BadRequestException('Falta "ubicacion".');
      if (!sub.fotoHero) throw new BadRequestException('Falta "fotoHero".');

      // Evitar duplicados
      const dup = await tx.agent.findUnique({ where: { slug: sub.slug } });
      if (dup) throw new BadRequestException('Ya existe un Agent con ese slug.');

      // Transformaciones para Agent (arrays)
      const experienciaArray =
        typeof sub.experiencia === 'string' && sub.experiencia.trim()
          ? sub.experiencia
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

      const aseguradorasArray =
        typeof sub.aseguradoras === 'string' && sub.aseguradoras.trim()
          ? sub.aseguradoras
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
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
          mediaHero: sub.fotoHero!, // requerido en Agent
          // redes: ... (si tu modelo lo tiene, adáptalo aquí)
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
