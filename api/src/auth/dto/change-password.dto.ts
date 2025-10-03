// api/src/auth/dto/change-password.dto.ts
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  old!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  next!: string;
}
