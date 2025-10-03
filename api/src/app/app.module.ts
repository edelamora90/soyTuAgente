import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { PrismaModule } from '../prisma/prisma.module';
import { AgentsModule } from '../agents/agents.module';
import { Module } from '@nestjs/common';
import { SubmissionsModule } from '../submissions/submissions.module';
import { AuthModule } from '../auth/auth.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    // Carga variables de entorno (.env) y las expone globalmente
     ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env'),
        join(process.cwd(), 'apps', 'api', '.env'),
      ],
    }),
    UploadsModule,
    PrismaModule,
    AuthModule,
    AgentsModule,
    SubmissionsModule,
  ],
})
export class AppModule {}
