import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entity/user.entity';
import { Role } from '../entity/role.entity';

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


  login(user: User) {
    const payload = { sub: user.id, role: user.role.name };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }
}
