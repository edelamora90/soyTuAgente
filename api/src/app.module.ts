// api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AgentsModule } from './agents/agents.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';

import { EventsModule } from './events/events.module';
import { BlogModule } from './blog/blog.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    HealthModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    AgentsModule,
    SubmissionsModule,
    UploadsModule,
    EventsModule,
    BlogModule,
  ],
})
export class AppModule {}
