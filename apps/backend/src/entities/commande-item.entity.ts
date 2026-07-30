import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CommandeEntity } from './commande.entity';

@Entity('commande_items')
export class CommandeItemEntity {
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

  @ManyToOne(() => CommandeEntity, (commande) => commande.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commandeId' })
  commande: CommandeEntity;
}
