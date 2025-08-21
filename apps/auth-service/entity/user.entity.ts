// apps/auth-service/src/entity/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'refresh_token_hash', type: 'varchar', nullable: true })
  refreshTokenHash: string | null;

  @Column({ name: 'refresh_jti', type: 'varchar', nullable: true })
  refreshJti: string | null;

  @Column({ name: 'refresh_expires_at', type: 'datetime', nullable: true })
  refreshExpiresAt: Date | null;
}
