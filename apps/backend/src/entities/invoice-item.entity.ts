import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { InvoiceEntity } from './invoice.entity';

@Entity('invoice_items')
export class InvoiceItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column('numeric', { precision: 15, scale: 2 })
  quantity: number;

  @Column('numeric', { precision: 15, scale: 2 })
  unitPrice: number;

  @Column('numeric', { precision: 5, scale: 2 })
  tvaRate: number;

  @Column('numeric', { precision: 15, scale: 2 })
  totalHT: number;

  @Column('numeric', { precision: 15, scale: 2 })
  totalTVA: number;

  @Column('numeric', { precision: 15, scale: 2 })
  totalTTC: number;

  @Column()
  accountCode: string;

  @ManyToOne(() => InvoiceEntity, (invoice) => invoice.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoiceId' })
  invoice: InvoiceEntity;
}
