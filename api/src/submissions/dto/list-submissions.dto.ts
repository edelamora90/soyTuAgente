// api/src/submissions/dto/list-submissions.dto.ts
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

// Enum “mirror” para validar con class-validator (igual a Prisma)
export enum SubmissionStatusDTO {
  PENDING  = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class ListSubmissionsDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value
  )
  @IsEnum(SubmissionStatusDTO, {
    message: 'status debe ser PENDING | APPROVED | REJECTED',
  })
  status?: SubmissionStatusDTO;
}
