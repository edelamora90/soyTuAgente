// api/src/submissions/submissions.controller.ts
import {
  Body, Controller, Get, Param, Patch, Post, Query, UseGuards,
  DefaultValuePipe, ParseEnumPipe,
} from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SubmissionStatus } from '@prisma/client';  // <<< usa el enum de Prisma

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly service: SubmissionsService) {}

  // Público: crear solicitud
  @Post()
  create(@Body() dto: CreateSubmissionDto) {
    return this.service.create(dto);
  }

  // Admin: listar (con filtro de estado validado)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll(
    @Query(
      'status',
      new DefaultValuePipe(undefined),
      new ParseEnumPipe(SubmissionStatus, { optional: true }),
    )
    status?: SubmissionStatus,
  ) {
    return this.service.findAll(status);
  }

  // Admin: ver detalle
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // Admin: aprobar
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  // Admin: rechazar
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body('notes') notes?: string) {
    return this.service.reject(id, notes);
  }
}
