// api/src/app/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../../api/src/auth/auth.module';
import { BlogModule } from '../../api/src/blog/blog.module';
import { HealthModule } from '../health/health.module';
// ... otros imports

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    BlogModule,
    HealthModule,
    // otros módulos...
  ],
})
export class AppModule {}
