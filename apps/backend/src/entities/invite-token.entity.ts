import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { UserRole } from './user.entity';

@Entity('invite_tokens')
export class InviteTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  email: string;

  @Column({ type: 'enum', enum: ['ADMIN', 'COMPTABLE', 'GESTIONNAIRE', 'LECTEUR'] })
  role: UserRole;

  @Column({ unique: true })
  tokenHash: string;

  @Column()
  invitedBy: string;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  acceptedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;
}
