import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { TooManyRequestsException } from '../exception/reason-exception';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    let role = 'guest';
    let identifier = `guest:${req.ip}`;


    const authHeader = req.headers.authorization;
    const refreshToken = req.body?.refreshToken; 
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]; // Access token
    } else if (refreshToken && req.path === '/api/auth/refresh') {
      token = refreshToken; // Refresh token
    }

    if (token) {
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded && decoded.sub && decoded.role) {
          role = decoded.role.toLowerCase();
          identifier = `user:${decoded.sub}`;
        }
      } catch (e) {
        console.log('Debug - Invalid token, fallback to guest');
      }
    }

    const path = req.path;
    console.log('Debug - Path:', path);
    console.log('Debug - Role:', role);
    console.log('Debug - Identifier:', identifier);
    const key = `ratelimit:${role}:${identifier}:${path}`;
    console.log('Debug - Rate limit key:', key);

    // Rate limit tùy theo endpoint và role
    const limits = {
      '/api/auth/register': { guest: { points: 5, duration: 60 } },
      '/api/auth/login': { guest: { points: 5, duration: 60 } },
      '/api/auth/refresh': {
        user: { points: 20, duration: 60 },
        admin: { points: 50, duration: 60 },
      },
      '/api/auth/logout': {
        user: { points: 10, duration: 60 },
        admin: { points: 20, duration: 60 },
      },
      '/api/auth/profile': {
        user: { points: 100, duration: 60 },
        admin: { points: 200, duration: 60 }, // GET
      },
      '/api/auth/profile:PUT': { admin: { points: 10, duration: 60 } }, // PUT
    };

    const limit = limits[path + (req.method === 'PUT' ? ':PUT' : '')] || limits[path] || {
      guest: { points: 10, duration: 60 },
      user: { points: 100, duration: 60 },
      admin: { points: 200, duration: 60 },
    };

    const { points, duration } = limit[role] || { points: 10, duration: 60 };

    const count = await this.redisService.incrWithExpire(key, duration);
    console.log('Debug - Count:', count);
    if (count > points) {
      throw new TooManyRequestsException(`Rate limit exceeded for role ${role} on ${path}`);
    }

    return true;
  }
}