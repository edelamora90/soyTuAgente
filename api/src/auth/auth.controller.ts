//api/src/auth/auth.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.username, dto.password);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(@Req() req: Request & { user?: any }) {
    return this.auth.refresh(req.user!);
  }

  @Post('logout')
  logout() {
    // El cliente borra tokens; aquí sólo confirmamos.
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Put('password')
  async changePassword(
    @Req() req: Request & { user?: any },
    @Body() dto: ChangePasswordDto,
  ) {
    const userId = req.user?.sub ?? req.user?.id ?? req.user?.userId;
    if (!userId) throw new BadRequestException('JWT inválido');

    await this.auth.changePassword(String(userId), dto.old, dto.next);
    return { ok: true };
  }
}
