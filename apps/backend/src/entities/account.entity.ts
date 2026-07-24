import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('accounts')
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // Ex: 411001, 701000

  @Column()
  label: string;

  @Column()
  category: string; // capitaux, immobilisations, stocks, tiers, tresorerie, charges, produits, hao

  @Column()
  type: string; // debit, credit, both

  @Column({ type: 'int' })
  classNum: number; // 1 à 8

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
