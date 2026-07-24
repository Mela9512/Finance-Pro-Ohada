import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('sequences')
@Unique(['companyId', 'key'])
export class SequenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  key: string; // ex: "VENTES-2026", "INVOICE-2026"

  @Column({ type: 'int', default: 0 })
  lastNumber: number;
}
