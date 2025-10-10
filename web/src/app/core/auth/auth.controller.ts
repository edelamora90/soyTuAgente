// api/src/auth/auth.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../../api/src/auth/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req) {
    return req.user; // debería mostrar { username, roles, ... } del token
  }
}
