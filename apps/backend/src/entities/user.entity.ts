import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

export type UserRole = 'ADMIN' | 'COMPTABLE' | 'GESTIONNAIRE' | 'LECTEUR';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ['ADMIN', 'COMPTABLE', 'GESTIONNAIRE', 'LECTEUR'], default: 'COMPTABLE' })
  role: UserRole;

  @Column({ nullable: true })
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
