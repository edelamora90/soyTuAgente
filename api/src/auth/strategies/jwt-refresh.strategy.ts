// api/src/auth/strategies/jwt-refresh.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(cfg: ConfigService) {
    const secret = cfg.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET no está definido');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
      audience: cfg.get<string>('JWT_AUDIENCE') ?? 'stagent',
      issuer: cfg.get<string>('JWT_ISSUER') ?? 'stagent-api',
      passReqToCallback: false,
    });
  }

  validate(payload: any) {
    return payload;
  }
}
