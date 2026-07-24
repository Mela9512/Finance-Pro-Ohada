import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('budgets')
@Unique(['companyId', 'accountCode', 'exercice', 'period'])
export class BudgetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  accountCode: string;

  @Column({ type: 'int' })
  exercice: number;

  @Column({ type: 'int', nullable: true })
  period: number | null; // 1-12, ou null pour un budget annuel

  @Column('numeric', { precision: 15, scale: 2 })
  amountBudgeted: number;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
