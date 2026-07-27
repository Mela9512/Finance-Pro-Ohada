import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { YearProjection } from '../modules/business-plan/financial-calculations';

@Entity('business_plans')
export class BusinessPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  createdBy: string;

  @Column()
  title: string;

  @Column('text')
  projectDescription: string;

  // Hypothèses saisies par l'utilisateur (nature prospective, assumées et non des faits comptables).
  @Column('numeric', { precision: 15, scale: 2 })
  investmentAmount: number;

  @Column('int')
  projectionYears: number;

  @Column('numeric', { precision: 15, scale: 2 })
  year1Revenue: number;

  @Column('numeric', { precision: 5, scale: 2 })
  revenueGrowthRatePercent: number;

  @Column('numeric', { precision: 5, scale: 2 })
  variableCostPercent: number;

  @Column('numeric', { precision: 15, scale: 2 })
  fixedCostsAnnual: number;

  @Column('numeric', { precision: 5, scale: 2 })
  discountRatePercent: number;

  // Résultats calculés déterministes, persistés pour ne pas re-solliciter l'IA à chaque consultation.
  @Column('simple-json')
  projections: YearProjection[];

  @Column('numeric', { precision: 15, scale: 2 })
  van: number;

  @Column('numeric', { precision: 8, scale: 2, nullable: true })
  tri: number | null;

  @Column('numeric', { precision: 15, scale: 2 })
  seuilRentabilite: number;

  @Column('int')
  creditScore: number;

  @Column('text')
  narrative: string;

  @CreateDateColumn()
  createdAt: Date;
}
