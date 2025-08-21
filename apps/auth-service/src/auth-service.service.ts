import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entity/user.entity';
import { Role } from '../entity/role.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    private jwtService: JwtService,
  ) { }

  async register(email: string, password: string) {
    const hash = await bcrypt.hash(password, 10);
    const role = await this.roleRepo.findOne({ where: { name: 'user' } });
    if (!role) {
      throw new Error('Default role "user" not found. Please seed roles first.');
    }

    const user = this.userRepo.create({
      email,
      password: hash,
      role,
    });

    return this.userRepo.save(user);
  }

  async validateUser(email: string, pass: string) {
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['role'], // 👈 load role
    });

    if (user && (await bcrypt.compare(pass, user.password))) {
      return user;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  private genJti() {
    return randomBytes(16).toString('hex');
  }

  async login(user: User) {
    const payload = { sub: user.id, role: user.role.name };

    const accessJti = this.genJti();
    const refreshJti = this.genJti();

    const accessToken = this.jwtService.sign(
      { ...payload, jti: accessJti },
      { expiresIn: '15m' },
    );

    const refreshToken = this.jwtService.sign(
      { ...payload, jti: refreshJti, typ: 'refresh' },
      { expiresIn: '7d' },
    );

    // lưu hash + metadata
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.update(user.id, {
      refreshTokenHash: hash,
      refreshJti,
      refreshExpiresAt,
    });
    return { accessToken, refreshToken };
  }
  async refresh(refreshToken: string) {
    let decoded: any;
    try {
      decoded = this.jwtService.verify(refreshToken);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (decoded.typ !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const userId = decoded.sub;
    const tokenJti = decoded.jti;

    // Load user và check hash
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['role'] });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('No refresh token found for user');
    }

    // Check JTI: token cũ đã dùng rồi
    if (tokenJti !== user.refreshJti) {
      throw new UnauthorizedException('Refresh token already used');
    }

    // Check hash token
    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    // Rotate token: cấp cặp mới
    const payload = { sub: user.id, role: user.role.name };
    const newAccessJti = this.genJti();
    const newRefreshJti = this.genJti();

    const newAccessToken = this.jwtService.sign({ ...payload, jti: newAccessJti }, { expiresIn: '15m' });
    const newRefreshToken = this.jwtService.sign({ ...payload, jti: newRefreshJti, typ: 'refresh' }, { expiresIn: '7d' });

    const newHash = await bcrypt.hash(newRefreshToken, 10);
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Update DB với token mới
    await this.userRepo.update(user.id, {
      refreshTokenHash: newHash,
      refreshJti: newRefreshJti,
      refreshExpiresAt,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
  async logout(userId: number) {
    await this.userRepo.update(userId, {
      refreshTokenHash: null,
      refreshJti: null,
      refreshExpiresAt: null,
    });
  }
}
