import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('companies')
export class CompanyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true, nullable: true })
  rccm?: string; // Registre du Commerce et du Crédit Mobilier — renseigné pendant l'onboarding

  @Column({ unique: true, nullable: true })
  nif?: string;  // Numéro d'Identification Fiscale — renseigné pendant l'onboarding

  @Column({ default: '' })
  address: string;

  @Column({ default: '' })
  city: string;

  @Column({ default: '' })
  country: string;

  @Column({ default: 'XAF' })
  currency: string; // XAF, XOF, EUR, USD

  @Column({ default: () => "to_char(now(), 'YYYY') || '-01-01'" })
  fiscalYearStart: string;

  @Column({ default: () => "to_char(now(), 'YYYY') || '-12-31'" })
  fiscalYearEnd: string;

  @Column({ default: false })
  isExerciceClosed: boolean;

  @Column({ default: false })
  isOnboarded: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
