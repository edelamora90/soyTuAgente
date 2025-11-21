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
import { BlogModule } from '../blog/blog.module';
import { HealthModule } from '../../health/health.module';


@Module({
  imports: [
    HealthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env'),
      ],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    AgentsModule,
    SubmissionsModule,
    UploadsModule,
    BlogModule, 
  ],
})
export class AppModule {}
