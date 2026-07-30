import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Unique } from 'typeorm';
import { CommandeItemEntity } from './commande-item.entity';

export type CommandeType = 'VENTE' | 'ACHAT';
export type CommandeStatus = 'BROUILLON' | 'CONFIRMEE' | 'LIVREE' | 'FACTUREE' | 'ANNULEE';

@Entity('commandes')
@Unique(['companyId', 'numero'])
export class CommandeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  numero: string;

  @Column({ type: 'simple-enum', enum: ['VENTE', 'ACHAT'] })
  type: CommandeType;

  @Column()
  tierId: string;

  @Column()
  tierName: string;

  @Column()
  date: string;

  @OneToMany(() => CommandeItemEntity, (item) => item.commande, { cascade: true })
  items: CommandeItemEntity[];

  @Column('numeric', { precision: 15, scale: 2 })
  subtotalHT: number;

  @Column('numeric', { precision: 15, scale: 2 })
  totalTVA: number;

  @Column('numeric', { precision: 15, scale: 2 })
  totalTTC: number;

  @Column({ type: 'simple-enum', enum: ['BROUILLON', 'CONFIRMEE', 'LIVREE', 'FACTUREE', 'ANNULEE'], default: 'BROUILLON' })
  status: CommandeStatus;

  @Column({ nullable: true })
  notes?: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
