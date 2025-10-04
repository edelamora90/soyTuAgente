// api/src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(cfg: ConfigService) {
    const secret = cfg.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET no está definido');
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

  // Ajusta el tipo del payload si lo tipaste
  validate(payload: any) {
    return payload;
  }
}
