import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

export type BulletinPaieStatus = 'BROUILLON' | 'VALIDE';

@Entity('bulletins_paie')
@Unique(['companyId', 'employeeId', 'periodYear', 'periodMonth'])
export class BulletinPaieEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  employeeId: string;

  @Column()
  employeeName: string;

  @Column('int')
  periodYear: number;

  @Column('int')
  periodMonth: number;

  @Column('numeric', { precision: 15, scale: 2 })
  salaireBase: number;

  @Column('numeric', { precision: 15, scale: 2, default: 0 })
  primesImposables: number;

  @Column('numeric', { precision: 15, scale: 2, default: 0 })
  primesNonImposables: number;

  @Column('numeric', { precision: 15, scale: 2 })
  brut: number;

  @Column({ type: 'simple-json' })
  detailCotisationsSalariales: { label: string; montant: number }[];

  @Column('numeric', { precision: 15, scale: 2 })
  totalCotisationsSalariales: number;

  @Column({ type: 'simple-json' })
  detailCotisationsPatronales: { label: string; montant: number }[];

  @Column('numeric', { precision: 15, scale: 2 })
  totalCotisationsPatronales: number;

  @Column('numeric', { precision: 15, scale: 2 })
  salaireImposable: number;

  @Column('numeric', { precision: 15, scale: 2 })
  irpp: number;

  @Column('numeric', { precision: 15, scale: 2 })
  net: number;

  @Column({ type: 'simple-enum', enum: ['BROUILLON', 'VALIDE'], default: 'BROUILLON' })
  status: BulletinPaieStatus;

  @Column({ nullable: true })
  journalEntryId?: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
