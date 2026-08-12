import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { JournalEntryEntity } from './journal-entry.entity';

@Entity('journal_lines')
export class JournalLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accountCode: string;

  @Column()
  accountLabel: string;

  @Column('numeric', { precision: 15, scale: 2, default: 0 })
  debit: number;

  @Column('numeric', { precision: 15, scale: 2, default: 0 })
  credit: number;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  costCenter?: string;

  @Column({ nullable: true })
  project?: string;

  @Column({ nullable: true })
  currency?: string;

  @Column('numeric', { precision: 10, scale: 4, default: 1, nullable: true })
  exchangeRate?: number;

  @Column({ nullable: true })
  reference?: string;

  @Column({ nullable: true })
  dueDate?: string;

  @ManyToOne(() => JournalEntryEntity, (entry) => entry.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entryId' })
  entry: JournalEntryEntity;
}
