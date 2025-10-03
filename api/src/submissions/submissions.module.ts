// api/src/submissions/submissions.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AgentsModule } from '../agents/agents.module';
import { AdminKeyGuard } from '../common/guards/admin-key.guard';

@Module({
  imports: [ PrismaModule, forwardRef(() => AgentsModule),],
  controllers: [SubmissionsController],
  providers: [SubmissionsService, AdminKeyGuard],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
