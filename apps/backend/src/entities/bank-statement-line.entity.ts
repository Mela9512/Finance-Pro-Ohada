import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('bank_statement_lines')
export class BankStatementLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  treasuryAccountId: string;

  @Column()
  date: string;

  @Column()
  description: string;

  // Signé : positif = crédit bancaire (encaissement), négatif = débit bancaire (décaissement).
  @Column('numeric', { precision: 15, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  reference?: string;

  @Column({ nullable: true })
  matchedTransactionId?: string;

  @Column()
  companyId: string;

  @CreateDateColumn()
  importedAt: Date;
}
