// api/src/app/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AgentsModule } from '../agents/agents.module';
import { SubmissionsModule } from '../submissions/submissions.module';
import { UploadsModule } from '../uploads/uploads.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env'),
        join(process.cwd(), 'api', '.env'),
        join(process.cwd(), 'apps', 'api', '.env'), // por si acaso
      ],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    AgentsModule,
    SubmissionsModule,
    UploadsModule,
  ],
})
export class AppModule {}
