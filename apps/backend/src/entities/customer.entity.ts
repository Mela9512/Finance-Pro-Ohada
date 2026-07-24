import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('customers')
export class CustomerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  nif?: string;

  @Column()
  phone: string;

  @Column()
  email: string;

  @Column()
  address: string;

  @Column('numeric', { precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column('numeric', { precision: 15, scale: 2, default: 0 })
  creditLimit: number;

  @Column()
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;
}
