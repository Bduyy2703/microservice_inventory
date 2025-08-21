import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Role } from '../apps/auth-service/src/entity/role.entity';

export class RoleSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const roleRepository = dataSource.getRepository(Role);

    const count = await roleRepository.count();
    if (count > 0) {
      console.log('⚠️ Roles already exist. Skipping seed...');
      return;
    }

    const roles = [
      { name: 'admin' },
      { name: 'user' },
    ];

    await roleRepository.insert(roles);
    console.log('✅ Roles seeded successfully!');
  }
}
