import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../../entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  companyId: string;
}

function cookieExtractor(req: Request): string | null {
  return req?.cookies?.access_token || null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'financepro_jwt_secret_key_2026',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    return { userId: user.id, email: user.email, role: user.role, companyId: user.companyId };
  }
}
