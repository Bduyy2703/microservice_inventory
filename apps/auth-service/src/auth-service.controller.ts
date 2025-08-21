/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth-service.service';
import { JwtAuthGuard } from '../jwt/jwt.guard';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshDto } from '../dto/refresh_token.dto';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req) {
    console.log('User logging out:', req.user);
    const user = req.user as any; // req.user được set từ JwtAuthGuard
    await this.authService.logout(user.userId);
    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req) {
    console.log('User profile:', req.user);
    return req.user;
  }
}
