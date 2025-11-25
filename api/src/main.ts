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

  // prefijo /api -> todas las rutas quedan /api/...
  app.setGlobalPrefix('api');

  // Monorepo Nx:
  // process.cwd() -> raíz del repo (soytuagente/)
  // PUBLIC_ROOT   -> soytuagente/api/public
  const PUBLIC_ROOT = join(process.cwd(), 'api', 'public');

  app.useStaticAssets(PUBLIC_ROOT, {
    prefix: '/public/',
  });

  await app.listen(3000);

  console.log('PUBLIC_ROOT =', PUBLIC_ROOT);
  console.log('API disponible en http://localhost:3000/api/health');
}
bootstrap();
