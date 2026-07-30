import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BonLivraisonEntity } from './bon-livraison.entity';

@Entity('bon_livraison_items')
export class BonLivraisonItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column('numeric', { precision: 15, scale: 2 })
  quantity: number;

  @Column('numeric', { precision: 15, scale: 2 })
  unitPrice: number;

  @Column('numeric', { precision: 5, scale: 2 })
  tvaRate: number;

  @Column('numeric', { precision: 15, scale: 2 })
  totalHT: number;

  @Column('numeric', { precision: 15, scale: 2 })
  totalTVA: number;

  @Column('numeric', { precision: 15, scale: 2 })
  totalTTC: number;

  @Column()
  accountCode: string;

  @ManyToOne(() => BonLivraisonEntity, (bl) => bl.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bonLivraisonId' })
  bonLivraison: BonLivraisonEntity;
}
