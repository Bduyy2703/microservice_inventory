// guards/rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { TooManyRequestsException } from '../exception/reason-exception';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user || { role: 'guest', id: req.ip }; // Nếu chưa auth thì dùng IP
    const role = user.role || 'guest';

    // Rate limit theo role
    const limits = {
      user: { points: 100, duration: 60 },  // 100 req/min
      admin: { points: 1000, duration: 60 }, // 1000 req/min
      guest: { points: 10, duration: 60 },  // 10 req/min cho IP chưa auth
    };

    const { points, duration } = limits[role] || limits['guest'];
    const key = `ratelimit:${role}:${user.id || req.ip}`;

    // Lấy count hiện tại
    const countStr = await this.redisService.get(key);
    const count = countStr ? parseInt(countStr) : 0;

    if (count >= points) {
      throw new TooManyRequestsException(`Rate limit exceeded for role ${role}`);
    }

    // Tăng count
    if (!count) {
      await this.redisService.set(key, '1', duration);
    } else {
      await this.redisService.set(key, String(count + 1), duration);
    }

    return true;
  }
}
