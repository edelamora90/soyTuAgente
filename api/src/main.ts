// api/src/main.ts
import 'reflect-metadata';
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { PrismaService } from './prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';

function parseAllowedOrigins(): (string | RegExp)[] | true {
  const raw = process.env.ALLOWED_ORIGINS?.trim();
  if (!raw) {
    // Fallbacks de dev
    return [
      'http://localhost:4200',
      'http://localhost:4300',
      'http://127.0.0.1:4200',
      'http://127.0.0.1:4300',
    ];
  }
  if (raw === '*') return true;
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  console.log('[bootstrap] starting…');
  console.log('[bootstrap] env PUBLIC_BASE_URL =', process.env.PUBLIC_BASE_URL);
  console.log('[bootstrap] env JWT_ACCESS_SECRET set =', Boolean(process.env.JWT_ACCESS_SECRET));
  console.log('[bootstrap] env ALLOWED_ORIGINS =', process.env.ALLOWED_ORIGINS || '(default localhost)');
  console.log('[bootstrap] env UPLOADS_DIR =', process.env.UPLOADS_DIR || '(default api/uploads)');

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Si vas a estar detrás de proxy (NGINX, Render, etc.)
  app.enableCors({
    origin: parseAllowedOrigins(),
    credentials: true,
  });

  // Prefijo global para la API
  app.setGlobalPrefix('api');

  // ✅ Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: {
        enableImplicitConversion: true, // permite convertir "true"/"1"→boolean, "123"→number, etc.
      },
    }),
  );

  // Servir archivos subidos (estáticos)
  const uploadsRoot =
    process.env.UPLOADS_DIR || join(process.cwd(), 'api', 'uploads');
  app.use('/public', express.static(uploadsRoot, { index: false }));

  // Health-check simple (útil para probes de despliegue)
  const adapter = app.getHttpAdapter();
  adapter.get('/api/health', (_req: any, res: any) =>
    res.json({ ok: true, ts: new Date().toISOString() })
  );

  // Prisma shutdown hook
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const PORT = Number(process.env.PORT ?? 3000);
  await app.listen(PORT, '0.0.0.0');

  console.log(`[bootstrap] Static uploads at /public -> ${uploadsRoot}`);
  console.log(`[bootstrap] API up on http://localhost:${PORT}/api`);
}

bootstrap().catch((err) => {
  console.error('[bootstrap] fatal error:', err);
  process.exit(1);
});
