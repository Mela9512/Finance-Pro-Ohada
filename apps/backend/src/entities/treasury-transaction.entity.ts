import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type TreasuryTransactionType = 'ENCAISSEMENT' | 'DECAISSEMENT' | 'VIREMENT_INTERNE';
export type TreasuryTransactionStatus = 'RAPPROCHE' | 'EN_ATTENTE';

@Entity('treasury_transactions')
export class TreasuryTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  treasuryAccountId: string;

  @Column()
  treasuryAccountName: string;

  @Column()
  date: string;

  @Column({ type: 'simple-enum', enum: ['ENCAISSEMENT', 'DECAISSEMENT', 'VIREMENT_INTERNE'] })
  type: TreasuryTransactionType;

  @Column()
  category: string;

  @Column('numeric', { precision: 15, scale: 2 })
  amount: number;

  @Column()
  reference: string;

  @Column({ nullable: true })
  tierName?: string;

  @Column({ type: 'simple-enum', enum: ['RAPPROCHE', 'EN_ATTENTE'], default: 'EN_ATTENTE' })
  status: TreasuryTransactionStatus;

  @Column()
  description: string;

  @Column()
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;
}
