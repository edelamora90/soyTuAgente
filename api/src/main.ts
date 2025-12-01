// api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();

  // Todas las rutas API → /api/**
  app.setGlobalPrefix('api');

  // Monorepo Nx → process.cwd() es la raíz del repo
  const PUBLIC_ROOT  = join(process.cwd(), 'api', 'public');   // p.ej. api/public/blog/...
  const UPLOADS_ROOT = join(process.cwd(), 'api', 'uploads');  // p.ej. api/uploads/agents/...

  // Servimos AMBAS carpetas bajo el MISMO prefijo /public/
  app.useStaticAssets(PUBLIC_ROOT,  { prefix: '/public/' });
  app.useStaticAssets(UPLOADS_ROOT, { prefix: '/public/' });

  await app.listen(3000);

  console.log('[BOOT] PUBLIC_ROOT =', PUBLIC_ROOT);
  console.log('[BOOT] UPLOADS_ROOT =', UPLOADS_ROOT);
  console.log('[BOOT] API http://localhost:3000/api/health');
}
bootstrap();
