import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from '../redis/redis.service';

export interface JwtPayload {
  sub: number;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private redisService: RedisService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecret',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload) {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      throw new UnauthorizedException('No token provided');
    }

    const blacklisted = await this.redisService.get(`blacklist:access:${accessToken}`);
    if (blacklisted) {
      throw new UnauthorizedException('Token has been blacklisted');
    }

    return { userId: payload.sub, role: payload.role };
  }
}