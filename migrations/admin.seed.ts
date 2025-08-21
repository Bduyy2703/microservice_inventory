import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { User } from '../apps/auth-service/src/entity/user.entity'; // sửa path cho đúng
import { Role } from '../apps/auth-service/src/entity/role.entity';
import * as bcrypt from 'bcrypt';

export class AdminSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);
    const roleRepository = dataSource.getRepository(Role);

    const adminRole = await roleRepository.findOne({
      where: { name: 'admin' },
    });
    if (!adminRole) {
      console.error('Admin role not found. Run RoleSeeder first.');
      return;
    }

    const count = await userRepository.count();
    if (count > 0) {
      console.log('Users already exist. Skipping admin seed...');
      return;
    }

    const admins = [
      {
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        role: adminRole,
      },
      {
        email: 'superadmin@example.com',
        password: await bcrypt.hash('superadmin123', 10),
        role: adminRole,
      },
    ];

    await userRepository.save(admins);
    console.log('✅ Admin users seeded successfully!');
  }
}
