import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { JournalLineEntity } from './journal-line.entity';

@Entity('journal_entries')
export class JournalEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  entryNumber: string; // Ex: VT-2026-0001

  @Column()
  date: string;

  @Column()
  journalType: 'ACHATS' | 'VENTES' | 'BANQUE' | 'CAISSE' | 'OD';

  @Column()
  wording: string; // Libellé de l'écriture

  @Column()
  pieceNumber: string; // Numéro de pièce justificative

  @Column({ default: true })
  isValidated: boolean;

  @Column()
  createdBy: string;

  @Column()
  companyId: string;

  @OneToMany(() => JournalLineEntity, (line) => line.entry, { cascade: true })
  lines: JournalLineEntity[];

  @CreateDateColumn()
  createdAt: Date;
}
