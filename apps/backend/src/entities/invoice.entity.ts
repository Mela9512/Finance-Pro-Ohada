import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { InvoiceItemEntity } from './invoice-item.entity';

export type InvoiceType = 'VENTE' | 'ACHAT' | 'AVOIR';
export type InvoiceStatus = 'BROUILLON' | 'VALIDE' | 'PAYE' | 'ANNULE' | 'PARTIEL';

@Entity('invoices')
export class InvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @Column({ type: 'simple-enum', enum: ['VENTE', 'ACHAT', 'AVOIR'] })
  type: InvoiceType;

  @Column()
  tierId: string;

  @Column()
  tierName: string;

  @Column()
  date: string;

  @Column()
  dueDate: string;

  @OneToMany(() => InvoiceItemEntity, (item) => item.invoice, { cascade: true })
  items: InvoiceItemEntity[];

  @Column('numeric', { precision: 15, scale: 2 })
  subtotalHT: number;

  @Column('numeric', { precision: 15, scale: 2 })
  totalTVA: number;

  @Column('numeric', { precision: 5, scale: 2, default: 0 })
  airRate: number;

  @Column('numeric', { precision: 15, scale: 2, default: 0 })
  totalAIR: number;

  @Column('numeric', { precision: 15, scale: 2 })
  totalTTC: number;

  @Column('numeric', { precision: 15, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ type: 'simple-enum', enum: ['BROUILLON', 'VALIDE', 'PAYE', 'ANNULE', 'PARTIEL'], default: 'BROUILLON' })
  status: InvoiceStatus;

  @Column({ nullable: true })
  notes?: string;

  @Column()
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;
}
