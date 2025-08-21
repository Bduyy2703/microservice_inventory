/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { AuthModule } from '../apps/auth-service/src/auth-service.module';
import { Role } from '../apps/auth-service/entity/role.entity';
import { User } from '../apps/auth-service/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AuthModule);

  const roleRepo = app.get('RoleRepository') as Repository<Role>;
  const userRepo = app.get('UserRepository') as Repository<User>;

  // Seed roles
  let adminRole = await roleRepo.findOne({ where: { name: 'admin' } });
  let userRole = await roleRepo.findOne({ where: { name: 'user' } });

  if (!adminRole) {
    adminRole = await roleRepo.save({ name: 'admin' });
    console.log('✅ Role admin created');
  }
  if (!userRole) {
    userRole = await roleRepo.save({ name: 'user' });
    console.log('✅ Role user created');
  }

  // Seed admin account
  const adminExists = await userRepo.findOne({ where: { email: 'admin@example.com' } });
  if (!adminExists) {
    const hash = await bcrypt.hash('admin123', 10);
    await userRepo.save({
      email: 'admin@example.com',
      password: hash,
      role: adminRole,
    });
    console.log('✅ Admin account created');
  }

  await app.close();
}

bootstrap().catch((e) => {
  console.error(e);
  process.exit(1);
});
