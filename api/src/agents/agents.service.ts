// api/src/agents/agents.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.agent.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(slug: string) {
    const agent = await this.prisma.agent.findUnique({ where: { slug } });
    if (!agent) {
      throw new NotFoundException(`Agente con slug "${slug}" no encontrado`);
    }
    return agent;
  }

  async create(dto: CreateAgentDto) {
    try {
      return await this.prisma.agent.create({ data: dto as any });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async update(slug: string, dto: UpdateAgentDto) {
    await this.findOne(slug);
    try {
      return await this.prisma.agent.update({
        where: { slug },
        data: dto as any, // 👈 si dto incluye slug NUEVO, Prisma lo actualizará
      });
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
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ''); // sin espacios/guiones
  }

  private static ESPECIALIDAD_ALIASES: Record<string, 'vehiculos'|'hogar-negocio'|'salud-asistencia'> = {
    // vehículos
    'vehiculos': 'vehiculos', 'vehiculo': 'vehiculos',
    'auto': 'vehiculos', 'autos': 'vehiculos', 'carro': 'vehiculos', 'carros': 'vehiculos',

    // hogar-negocio
    'hogarnegocio': 'hogar-negocio', 'hogarynegocio': 'hogar-negocio',
    'hogar': 'hogar-negocio', 'negocio': 'hogar-negocio',
    'hogar-negocio': 'hogar-negocio', // por si ya viene en slug

    // salud-asistencia
    'saludasistencia': 'salud-asistencia', 'salud': 'salud-asistencia',
    'asistencia': 'salud-asistencia', 'salud-asistencia': 'salud-asistencia',
  };

  private static toEspecialidadSlug(
    v: string,
  ): 'vehiculos'|'hogar-negocio'|'salud-asistencia'|null {
    const k = AgentsService.normalizeKey(v);
    return AgentsService.ESPECIALIDAD_ALIASES[k] ?? null;
  }

  // ====== Aseguradoras (nombres → logos) ======
  private static CARRIER_LOGOS: Record<string, string> = {
    AFIRME: 'assets/aseguradoras/Afirme.png',
    Alianz: 'assets/aseguradoras/Alianz.png',
    AXA: 'assets/aseguradoras/Axa.png',
    BBVA: 'assets/aseguradoras/Bbva.png',
    'Citi Banamex': 'assets/aseguradoras/Citibanamex.png',
    GNP: 'assets/aseguradoras/Gnp.png',
    HDI: 'assets/aseguradoras/Hdi.png',
    INBURSA: 'assets/aseguradoras/Inbursa.png',
    MAPFRE: 'assets/aseguradoras/Mapfre.png',
    MetLife: 'assets/aseguradoras/Metlife.png',
    Primero: 'assets/aseguradoras/Primeroseguros.png',
    Qualitas: 'assets/aseguradoras/Qualitas.png',
    Santander: 'assets/aseguradoras/Santander.png',
    'Seguros Atlas': 'assets/aseguradoras/Segurosatlas.png',
    'Seguros Monterrey': 'assets/aseguradoras/Segurosmonterrey.png',
    Sura: 'assets/aseguradoras/Sura.png',
    Zurich: 'assets/aseguradoras/Zurich.png',
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

  // ==================== Bulk desde JSON ====================

  /**
   * Crea/actualiza (upsert) muchos agentes a partir de un arreglo JSON.
   * Cada objeto debe traer al menos { nombre } o { slug }.
   */
  async bulkCreate(items: any[]) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Debes enviar un arreglo de agentes.');
    }

    const created: string[] = [];
    const updated: string[] = [];
    const failed: Array<{ slug?: string; error: string }> = [];

    const toArray = (v: any): string[] => {
      if (Array.isArray(v)) return v.filter(Boolean);
      if (typeof v === 'string') {
        return v
          .split(/[|,]/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [];
    };

    for (const raw of items) {
      try {
        // slug/nombre mínimos
        const nombre = String(raw?.nombre ?? '').trim();
        let slug = String(raw?.slug ?? '').trim();
        if (!slug && nombre) slug = this.slugify(nombre);
        if (!slug || !nombre) {
          throw new BadRequestException('Faltan "nombre" o "slug".');
        }

        // Normalización coherente con CSV
        const espBulk = toArray(raw?.especialidades)
          .map(AgentsService.toEspecialidadSlug)
          .filter(
            (x): x is 'vehiculos'|'hogar-negocio'|'salud-asistencia' => !!x,
          );
        const especialidades = Array.from(new Set(espBulk));

        const data: any = {
          slug,
          nombre,
          cedula: String(raw?.cedula ?? '').trim(),
          verificado: !!raw?.verificado,
          avatar: raw?.avatar ?? null,
          ubicacion: String(raw?.ubicacion ?? '').trim(),
          whatsapp: raw?.whatsapp ?? null,

          especialidades,
          experiencia: Array.isArray(raw?.experiencia)
            ? raw.experiencia
            : toArray(raw?.experiencia),
          servicios: toArray(raw?.servicios),
          certificaciones: toArray(raw?.certificaciones),

          // mapeo nombre → logo
          aseguradoras: toArray(raw?.aseguradoras).map(
            AgentsService.carrierToLogo,
          ),

          mediaThumbs: toArray(raw?.mediaThumbs),
          mediaHero: String(raw?.mediaHero ?? '').trim(),

          // espera [{icon,url}] o null
          redes: Array.isArray(raw?.redes) ? raw.redes : null,
        };

        // Fallback: si no hay mediaHero, usa el primero de mediaThumbs
        if (!data.mediaHero && data.mediaThumbs.length > 0) {
          data.mediaHero = data.mediaThumbs[0];
        }

        // saber si existía (para métricas created/updated)
        const existed = await this.prisma.agent.findUnique({
          where: { slug },
          select: { slug: true },
        });

        await this.prisma.agent.upsert({
          where: { slug },
          create: data,
          update: data,
        });

        if (existed) {
          updated.push(slug);
        } else {
          created.push(slug);
        }
      } catch (e: any) {
        failed.push({
          slug: raw?.slug,
          error: e?.message ?? 'Error desconocido',
        });
      }
    }

    return {
      total: items.length,
      created: created.length,
      updated: updated.length,
      failed,
      createdSlugs: created,
      updatedSlugs: updated,
    };
  }

  // ============ Importación CSV (upsert por slug) ============

  async importCsvAndUpsert(file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo CSV vacío o no enviado.');
    }

    const text = file.buffer.toString('utf8');
    const rows = this.parseCsv(text);

    if (!rows.length) {
      throw new BadRequestException('El CSV no contiene filas.');
    }

    const created: string[] = [];
    const updated: string[] = [];
    const failed: Array<{ slug?: string; error: string }> = [];

    for (const raw of rows) {
      try {
        const data = this.normalizeCsvRow(raw);

        // comprobar existencia real en BD antes del upsert
        const existed = await this.prisma.agent.findUnique({
          where: { slug: data.slug },
          select: { slug: true },
        });

        const saved = await this.prisma.agent.upsert({
          where: { slug: data.slug },
          create: data as any,
          update: data as any,
        });

        if (existed) {
          updated.push(saved.slug);
        } else {
          created.push(saved.slug);
        }
      } catch (e: any) {
        if (e?.code === 'P2002') {
          failed.push({ slug: raw?.slug, error: 'Duplicado de clave única' });
          continue;
        }
        failed.push({ slug: raw?.slug, error: e?.message ?? 'Error desconocido' });
      }
    }

    return {
      total: rows.length,
      created: created.length,
      updated: updated.length,
      failed,
      createdSlugs: created,
      updatedSlugs: updated,
    };
  }

  // ========================= Helpers =========================

  private handlePrismaError(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        throw new BadRequestException(
          'Ya existe un registro con un valor único duplicado (por ejemplo, "slug").',
        );
      }
    }
    throw e;
  }

  /** Parser CSV simple (comillas dobles soportadas) */
  private parseCsv(text: string): any[] {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (!lines.length) return [];

    const headers = this.splitCsvLine(lines[0]).map((h) => h.trim());
    const data: any[] = [];

    // marca interna opcional por slug duplicado dentro del propio archivo
    const seen = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const cols = this.splitCsvLine(lines[i]);
      const row: any = {};
      headers.forEach((h, idx) => (row[h] = (cols[idx] ?? '').trim()));
      if (row.slug) {
        if (seen.has(row.slug)) row._existed = true;
        seen.add(row.slug);
      }
      data.push(row);
    }

    return data;
  }

  private splitCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (ch === ',' && !inQuotes) {
        out.push(cur);
        cur = '';
        continue;
      }

      cur += ch;
    }

    out.push(cur);
    return out;
  }

  /** Normaliza una fila CSV a la forma esperada por Prisma */
  private normalizeCsvRow(r: any): CreateAgentDto & { slug: string } {
    const toBool = (v: any) =>
      String(v ?? '')
        .trim()
        .toLowerCase() === 'true';

    const toList = (v: any) =>
      String(v ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    // Redes sociales (desde columnas sueltas + JSON opcional)
    const redes: Array<{ icon: string; url: string }> = [];
    const pushRed = (icon: string, usernameOrUrl: string, base?: string) => {
      if (!usernameOrUrl) return;
      const isUrl = /^https?:\/\//i.test(usernameOrUrl);
      const url = isUrl
        ? usernameOrUrl
        : base
        ? `${base.replace(/\/+$/, '')}/${usernameOrUrl.replace(/^\/+/, '')}`
        : usernameOrUrl;
      redes.push({ icon, url });
    };

    pushRed('assets/icons/facebook.svg', r.facebook, 'https://facebook.com');
    pushRed('assets/icons/instagram.svg', r.instagram, 'https://instagram.com');
    pushRed('assets/icons/linkedin.svg', r.linkedin, 'https://linkedin.com/in');
    pushRed('assets/icons/tiktok.svg', r.tiktok, 'https://tiktok.com/@');

    if (r.redes) {
      const lines = String(r.redes).split('\n');
      for (const ln of lines) {
        try {
          const o = JSON.parse(ln);
          if (o && typeof o.icon === 'string' && typeof o.url === 'string') {
            redes.push({ icon: o.icon, url: o.url });
          }
        } catch {
          // ignorar líneas no JSON
        }
      }
    }

    const mediaThumbs = toList(r.mediaThumbs);
    const mediaHero = (r.mediaHero ?? '').trim();

    // ⚠️ Aseguradoras: mapeo nombre → logo
    const aseguradoras = toList(r.aseguradoras).map(
      AgentsService.carrierToLogo,
    );

    // ✅ Especialidades normalizadas a slugs canónicos
    const espCsv = toList(r.especialidades)
      .map(AgentsService.toEspecialidadSlug)
      .filter(
        (x): x is 'vehiculos'|'hogar-negocio'|'salud-asistencia' => !!x,
      );
    const especialidades = Array.from(new Set(espCsv));

    const dto: any = {
      slug: (r.slug ?? '').trim() || this.slugify(r.nombre ?? ''),
      nombre: (r.nombre ?? '').trim(),
      cedula: (r.cedula ?? '').trim(),
      verificado: toBool(r.verificado),
      avatar: (r.avatar ?? '').trim() || null,
      ubicacion: (r.ubicacion ?? '').trim(),
      whatsapp: (r.whatsapp ?? '').trim() || null,
      especialidades,
      experiencia: toList((r.experiencia ?? '').replace(/\\n/g, '\n')),
      servicios: toList((r.servicios ?? '').replace(/\\n/g, '\n')),
      certificaciones: toList((r.certificaciones ?? '').replace(/\\n/g, '\n')),
      aseguradoras, // ya son URLs de logo
      mediaThumbs,
      mediaHero,
      redes: redes.length ? redes : null,
    };

    if (!dto.nombre) {
      throw new BadRequestException('El campo "nombre" es requerido en CSV.');
    }
    if (!dto.slug) {
      throw new BadRequestException(
        'No se pudo generar "slug" (falta nombre o slug).',
      );
    }

    return dto;
  }

  private slugify(input: string) {
    return String(input || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 80);
  }
}
