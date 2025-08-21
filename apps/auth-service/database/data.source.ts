/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { DataSource } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';
import { Role } from '../entity/role.entity';
import { User } from '../entity/user.entity';
import { RoleSeeder } from '../../../migrations/role.seed';
import { AdminSeeder } from '../../../migrations/admin.seed';

// 👇 config chuẩn cho typeorm
const options = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: 3307,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'root',
  database: process.env.DB_NAME || 'auth',
  entities: [User, Role],
  migrations: ['../../../migrations/*.ts'],
};

// ép kiểu DataSource + SeederOptions
export const dataSource = new DataSource(options) as DataSource & SeederOptions;

// 👇 add seeds ở đây
dataSource.setOptions({
  seeds: [RoleSeeder, AdminSeeder],
});
