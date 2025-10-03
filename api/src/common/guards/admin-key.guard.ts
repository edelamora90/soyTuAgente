import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminKeyGuard implements CanActivate {
  constructor(private cfg: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { headers: any; query: any }>();
    const provided =
      req.headers['x-admin-key'] ??
      req.headers['X-Admin-Key'] ??
      req.query?.adminKey;

    const expected = this.cfg.get<string>('ADMIN_API_KEY');

    if (!expected) {
      // Sin clave configurada, nunca permitir
      throw new UnauthorizedException('ADMIN_API_KEY no configurada.');
    }

    if (provided !== expected) {
      throw new UnauthorizedException('Admin key inválida.');
    }
    return true;
  }
}
