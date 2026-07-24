import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('companies')
export class CompanyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  rccm: string; // Registre du Commerce et du Crédit Mobilier

  @Column({ unique: true })
  nif: string;  // Numéro d'Identification Fiscale

  @Column()
  address: string;

  @Column()
  city: string;

  @Column()
  country: string;

  @Column({ default: 'XAF' })
  currency: string; // XAF, XOF, EUR, USD

  @Column()
  fiscalYearStart: string;

  @Column()
  fiscalYearEnd: string;

  @Column({ default: false })
  isExerciceClosed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
