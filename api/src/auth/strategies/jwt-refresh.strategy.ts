// api/src/auth/strategies/jwt-refresh.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(cfg: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: cfg.get('JWT_REFRESH_SECRET'),
      ignoreExpiration: false,
      audience: 'admin',
      issuer: 'soy-tu-agente',
      passReqToCallback: false,
    });
  }

  // payload esperado: { sub, username, roles, type: 'refresh' }
  async validate(payload: any) {
    if (payload?.type !== 'refresh') {
      return null; // inválido para refresh
    }
    return payload;
  }
}
