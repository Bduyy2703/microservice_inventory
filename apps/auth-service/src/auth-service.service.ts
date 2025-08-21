import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Role } from './entity/role.entity';
import { randomBytes } from 'crypto';
import { RedisClientType, createClient } from 'redis';

@Injectable()
export class AuthService {
  private redisClient: RedisClientType;

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    private jwtService: JwtService,
  ) {
    this.redisClient = createClient({ url: 'redis://localhost:6379' });
    this.redisClient.connect();
  }

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
    await this.redisClient.set(`refresh:${user.id}`, JSON.stringify({ hash, jti: refreshJti }), { EX: 7 * 24 * 3600 });

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

    const stored = await this.redisClient.get(`refresh:${userId}`);
    if (!stored) throw new UnauthorizedException('No refresh token found');

    const { hash, jti } = JSON.parse(stored);

    if (tokenJti !== jti) throw new UnauthorizedException('Refresh token already used');

    const isValid = await bcrypt.compare(refreshToken, hash);
    if (!isValid) throw new UnauthorizedException('Refresh token revoked');

    // Rotate token
    const payload = { sub: userId, role: decoded.role };
    const newAccessJti = this.genJti();
    const newRefreshJti = this.genJti();

    const newAccessToken = this.jwtService.sign({ ...payload, jti: newAccessJti }, { expiresIn: '15m' });
    const newRefreshToken = this.jwtService.sign({ ...payload, jti: newRefreshJti, typ: 'refresh' }, { expiresIn: '7d' });

    const newHash = await bcrypt.hash(newRefreshToken, 10);
    await this.redisClient.set(`refresh:${userId}`, JSON.stringify({ hash: newHash, jti: newRefreshJti }), { EX: 7 * 24 * 3600 });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: number) {
    await this.redisClient.del(`refresh:${userId}`);
  }
}
