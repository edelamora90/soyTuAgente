import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject(ConfigService) cfg: ConfigService) {
    const secret = cfg.get<string>('JWT_ACCESS_SECRET');
    if (!secret) throw new Error('JWT_ACCESS_SECRET no está definido en .env');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
      audience: cfg.get<string>('JWT_AUDIENCE') || 'admin',
      issuer:   cfg.get<string>('JWT_ISSUER')   || 'soy-tu-agente',
      passReqToCallback: false,
    });
  }

  validate(payload: any) {
    return payload; // anexa payload en req.user
  }
}
