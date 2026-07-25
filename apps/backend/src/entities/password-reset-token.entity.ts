import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('password_reset_tokens')
export class PasswordResetTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ unique: true })
  tokenHash: string;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  usedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;
}
