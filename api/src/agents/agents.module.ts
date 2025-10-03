import { Module } from '@nestjs/common';
import { AgentsController } from '../agents/agents.controller';
import { AgentsService } from '../agents/agents.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService], 
})
export class AgentsModule {}
