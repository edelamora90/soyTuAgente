// api/src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

/** Payload estándar dentro del JWT */
type JwtPayload = {
  sub: string;                 // id del AdminUser
  username: string;            // username o email
  roles: string[];             // roles del admin
  type?: 'access' | 'refresh'; // marca para distinguir tokens
};

@Injectable()
export class AuthService {
  constructor(
    private readonly cfg: ConfigService,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  // ===== VALIDACIÓN DE CREDENCIALES =====
  /** Permite login con email o username; valida password y estado. */
  async validateUser(identifier: string, password: string) {
    const user = await this.users.findByEmailOrUsername(identifier);
    if (!user) throw new UnauthorizedException('NO_USER');
    if (!user.isActive) throw new UnauthorizedException('INACTIVE');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('BAD_PASSWORD');

    await this.users.updateLoginMeta(user.id);
    return user;
  }

  // ===== GENERACIÓN DE TOKENS (compat v11 de @nestjs/jwt) =====
  private signToken(
    kind: 'access' | 'refresh',
    payload: Omit<JwtPayload, 'type'>
  ): string {
    const opts: any = {
      secret:
        kind === 'access'
          ? this.cfg.get<string>('JWT_ACCESS_SECRET')
          : this.cfg.get<string>('JWT_REFRESH_SECRET'),
      expiresIn:
        (kind === 'access'
          ? this.cfg.get<string>('JWT_ACCESS_TTL')
          : this.cfg.get<string>('JWT_REFRESH_TTL')) || (kind === 'access' ? '15m' : '7d'),
      audience: this.cfg.get<string>('JWT_AUDIENCE') || 'admin',
      issuer: this.cfg.get<string>('JWT_ISSUER') || 'soy-tu-agente',
    };

    // Cast a any para evitar el choque de tipos con SignOptions basadas en `jose` de v11
    return this.jwt.sign({ ...payload, type: kind } as any, opts);
  }

  private signAccessToken(payload: Omit<JwtPayload, 'type'>): string {
    return this.signToken('access', payload);
  }

  private signRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
    return this.signToken('refresh', payload);
  }

  // ===== FLUJO: LOGIN / REFRESH =====
  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);

    const base: Omit<JwtPayload, 'type'> = {
      sub: user.id,
      username: user.username ?? user.email, // fallback si username es null
      roles: user.roles ?? [],
    };

    const accessToken = this.signAccessToken(base);
    const refreshToken = this.signRefreshToken(base);

    return {
      user: { username: base.username, roles: base.roles },
      accessToken,
      refreshToken,
    };
  }

  async refresh(userFromToken: JwtPayload) {
    const base: Omit<JwtPayload, 'type'> = {
      sub: userFromToken.sub,
      username: userFromToken.username,
      roles: userFromToken.roles ?? [],
    };
    return {
      accessToken: this.signAccessToken(base),
      refreshToken: this.signRefreshToken(base),
    };
  }

  // ===== CAMBIO DE CONTRASEÑA =====
  async changePassword(userId: string, oldPlain: string, nextPlain: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const ok = await bcrypt.compare(oldPlain, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Contraseña actual incorrecta');

    // Evita reutilizar la misma contraseña
    const same = await bcrypt.compare(nextPlain, user.passwordHash);
    if (same) throw new BadRequestException('La nueva contraseña debe ser distinta');

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(nextPlain, salt);

    await this.users.updatePassword(userId, hash);
  }
}

