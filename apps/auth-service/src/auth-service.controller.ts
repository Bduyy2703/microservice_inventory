
import { Controller, Post, Body, Get, UseGuards, Req, Put, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth-service.service';
import { JwtAuthGuard } from '../jwt/jwt.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh_token.dto';
import { RateLimitGuard } from '../jwt/ratelimit.guard';
import { UpdateProfileDto } from './dto/updateProfile.dto';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @UseGuards(RateLimitGuard)
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password);
  }

  @UseGuards(RateLimitGuard)
  @Post('login')
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }

  @UseGuards(RateLimitGuard)
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req) {
    const accessToken = req.headers.authorization?.split(' ')[1]; // Lấy access token từ header
    await this.authService.logout(req.user.userId, accessToken);
    return { message: 'Logged out successfully' };
  }

  @ApiBearerAuth()
  @UseGuards(RateLimitGuard, JwtAuthGuard)

  @Get('profile')
  async getProfile(@Req() req) {
    const user = req.user;
    console.log('User profile:', user);
    return { id: user.userId, role: user.role };
  }

  @ApiBearerAuth()
  @UseGuards(RateLimitGuard,JwtAuthGuard )
  @Put('profile')
  async updateProfile(@Req() req, @Body() body: UpdateProfileDto) {
    const user = req.user;
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can edit profiles');
    }

    const updatedUser = await this.authService.updateProfile(user.userId, body);
    return { id: updatedUser.id, role: updatedUser.role.name, email: updatedUser.email };
  }
}