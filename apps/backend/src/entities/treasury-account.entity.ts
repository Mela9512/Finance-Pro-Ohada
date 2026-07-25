import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

export type TreasuryAccountType = 'BANQUE' | 'CAISSE' | 'MOBILE_MONEY';

@Entity('treasury_accounts')
@Unique(['companyId', 'code'])
export class TreasuryAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column({ type: 'simple-enum', enum: ['BANQUE', 'CAISSE', 'MOBILE_MONEY'] })
  type: TreasuryAccountType;

  @Column({ nullable: true })
  accountNumber?: string;

  @Column({ nullable: true })
  rib?: string;

  @Column({ default: 'XAF' })
  currency: string;

  @Column('numeric', { precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column()
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;
}
