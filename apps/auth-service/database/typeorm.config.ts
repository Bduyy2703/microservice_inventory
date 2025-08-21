/* eslint-disable prettier/prettier */
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../src/entity/user.entity';
import { ConfigService } from '@nestjs/config';
import { Role } from '../src/entity/role.entity';
import { RoleSeeder } from 'migrations/role.seed';
import { AdminSeeder } from 'migrations/admin.seed';

export const typeormConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: config.get<string>('DB_HOST') || 'localhost',
  port: config.get<number>('DB_PORT') || 3307,
  username: config.get<string>('DB_USER') || 'root',
  password: config.get<string>('DB_PASS') || 'root',
  database: config.get<string>('DB_NAME') || 'auth',
  entities: [User,Role],
  migrations: ['../../../migrations/*.ts'],
  synchronize: true,
});
