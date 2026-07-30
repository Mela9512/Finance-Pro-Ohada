import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type StockMouvementType = 'ENTREE' | 'SORTIE';

@Entity('stock_mouvements')
export class StockMouvementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  articleId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'simple-enum', enum: ['ENTREE', 'SORTIE'] })
  type: StockMouvementType;

  @Column('numeric', { precision: 15, scale: 3 })
  quantite: number;

  @Column('numeric', { precision: 15, scale: 2 })
  coutUnitaire: number;

  @Column('numeric', { precision: 15, scale: 2 })
  valeurTotale: number;

  @Column({ nullable: true })
  reference?: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
