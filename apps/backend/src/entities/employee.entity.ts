import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

export type EmployeeStatus = 'ACTIF' | 'INACTIF';

@Entity('employees')
@Unique(['companyId', 'matricule'])
export class EmployeeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  matricule: string;

  @Column()
  nom: string;

  @Column()
  poste: string;

  @Column({ type: 'date' })
  dateEmbauche: string;

  @Column('numeric', { precision: 15, scale: 2 })
  salaireBase: number;

  @Column({ nullable: true })
  numeroCNSS?: string;

  @Column({ type: 'simple-enum', enum: ['ACTIF', 'INACTIF'], default: 'ACTIF' })
  statut: EmployeeStatus;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
