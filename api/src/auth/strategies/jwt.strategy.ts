// api/src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(cfg: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: cfg.get('JWT_ACCESS_SECRET'),
      ignoreExpiration: false,
      audience: 'admin',
      issuer: 'soy-tu-agente',
    });
  }
  async validate(payload: any) {
    return payload; // {sub, username, roles, type:'access'}
  }
}
