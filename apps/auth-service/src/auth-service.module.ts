import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { AuthService } from './auth-service.service';
import { JwtStrategy } from '../jwt/jwt.strategy';
import { AuthController } from './auth-service.controller';
import { typeormConfig } from '../database/typeorm.config';
import { Role } from './entity/role.entity';
import { RateLimitGuard } from '../jwt/ratelimit.guard';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => typeormConfig(config),
    }),
    TypeOrmModule.forFeature([User,Role]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecret',
      signOptions: { expiresIn: '15m' },
    }),
      RedisModule,
  ],

  providers: [AuthService, JwtStrategy, RateLimitGuard],
  controllers: [AuthController],
})
export class AuthModule {}
