import { Injectable, UnauthorizedException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Role } from './entity/role.entity';
import { randomBytes } from 'crypto';
import { RedisService } from '../redis/redis.service';
import { UpdateProfileDto } from './dto/updateProfile.dto';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    private jwtService: JwtService,
    private redisService: RedisService, 
  ) {}

  private genJti() {
    return randomBytes(16).toString('hex');
  }

  async register(email: string, password: string) {
    const hash = await bcrypt.hash(password, 10);
    const role = await this.roleRepo.findOne({ where: { name: 'user' } });
    if (!role) throw new Error('Default role "user" not found');

    const user = this.userRepo.create({ email, password: hash, role });
    return this.userRepo.save(user);
  }

  async validateUser(email: string, pass: string) {
    const user = await this.userRepo.findOne({ where: { email }, relations: ['role'] });
    if (user && (await bcrypt.compare(pass, user.password))) return user;
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(user: User) {
    const payload = { sub: user.id, role: user.role.name };

    const accessJti = this.genJti();
    const refreshJti = this.genJti();

    const accessToken = this.jwtService.sign({ ...payload, jti: accessJti }, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign({ ...payload, jti: refreshJti, typ: 'refresh' }, { expiresIn: '7d' });

    const hash = await bcrypt.hash(refreshToken, 10);
    await this.redisService.set(`refresh:${user.id}`, JSON.stringify({ hash, jti: refreshJti }), { EX: 7 * 24 * 3600 });

    const decoded = this.jwtService.decode(accessToken) as any;
    const expireTime = decoded.exp - Math.floor(Date.now() / 1000);
    await this.redisService.set(`access:${user.id}`, accessToken, { EX: expireTime });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    let decoded: any;
    try {
      decoded = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (decoded.typ !== 'refresh') throw new UnauthorizedException('Invalid token type');

    const userId = decoded.sub;
    const tokenJti = decoded.jti;

    const stored = await this.redisService.get(`refresh:${userId}`);
    if (!stored) throw new UnauthorizedException('No refresh token found');

    const { hash, jti } = JSON.parse(stored);

    if (tokenJti !== jti) throw new UnauthorizedException('Refresh token already used');

    const isValid = await bcrypt.compare(refreshToken, hash);
    if (!isValid) throw new UnauthorizedException('Refresh token revoked');

    const oldAccessToken = await this.redisService.get(`access:${userId}`);
    if (oldAccessToken) {
      const oldDecoded = this.jwtService.decode(oldAccessToken) as any;
      const expireTime = oldDecoded.exp - Math.floor(Date.now() / 1000);
      if (expireTime > 0) {
        await this.redisService.set(`blacklist:access:${oldAccessToken}`, 'blacklisted', { EX: expireTime });
      }
    }

    const payload = { sub: userId, role: decoded.role };
    const newAccessJti = this.genJti();
    const newRefreshJti = this.genJti();

    const newAccessToken = this.jwtService.sign({ ...payload, jti: newAccessJti }, { expiresIn: '15m' });
    const newRefreshToken = this.jwtService.sign({ ...payload, jti: newRefreshJti, typ: 'refresh' }, { expiresIn: '7d' });

    const newHash = await bcrypt.hash(newRefreshToken, 10);
    await this.redisService.set(`refresh:${userId}`, JSON.stringify({ hash: newHash, jti: newRefreshJti }), { EX: 7 * 24 * 3600 });

    const newDecoded = this.jwtService.decode(newAccessToken) as any;
    const newExpireTime = newDecoded.exp - Math.floor(Date.now() / 1000);
    await this.redisService.set(`access:${userId}`, newAccessToken, { EX: newExpireTime });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: number, accessToken: string) {
    try {
      if (accessToken) {
        const decoded = this.jwtService.decode(accessToken) as any;
        const expireTime = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;
        if (expireTime > 0) {
          await this.redisService.set(`blacklist:access:${accessToken}`, 'blacklisted', { EX: expireTime });
        }
      }
      await this.redisService.del(`refresh:${userId}`);
      await this.redisService.del(`access:${userId}`);
      return { message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      throw new InternalServerErrorException('Failed to logout');
    }
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['role'] });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email) {
      user.email = dto.email;
    }
    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }

    return this.userRepo.save(user);
  }
}