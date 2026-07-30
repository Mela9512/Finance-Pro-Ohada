import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type ImmobilisationStatus = 'EN_SERVICE' | 'CEDE' | 'REFORME';

@Entity('immobilisations')
export class ImmobilisationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  code: string;

  @Column()
  label: string;

  @Column()
  accountCode: string;

  @Column({ type: 'date' })
  dateAcquisition: string;

  @Column({ type: 'date' })
  dateMiseEnService: string;

  @Column('numeric', { precision: 15, scale: 2 })
  valeurAcquisitionHT: number;

  @Column('numeric', { precision: 15, scale: 2, default: 0 })
  valeurResiduelle: number;

  @Column('int')
  dureeAmortissementAns: number;

  @Column({ type: 'simple-enum', enum: ['EN_SERVICE', 'CEDE', 'REFORME'], default: 'EN_SERVICE' })
  status: ImmobilisationStatus;

  @Column({ type: 'date', nullable: true })
  dateCession?: string;

  @Column('numeric', { precision: 15, scale: 2, nullable: true })
  valeurCession?: number;

  @Column({ type: 'simple-json', nullable: true })
  exercicesDotationGeneres?: number[];

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
