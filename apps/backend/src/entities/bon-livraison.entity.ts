import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Unique } from 'typeorm';
import { BonLivraisonItemEntity } from './bon-livraison-item.entity';
import { CommandeType } from './commande.entity';

export type BonLivraisonStatus = 'CONFIRME' | 'FACTURE';

@Entity('bons_livraison')
@Unique(['companyId', 'numero'])
export class BonLivraisonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  commandeId: string;

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

  @OneToMany(() => BonLivraisonItemEntity, (item) => item.bonLivraison, { cascade: true })
  items: BonLivraisonItemEntity[];

  @Column({ type: 'simple-enum', enum: ['CONFIRME', 'FACTURE'], default: 'CONFIRME' })
  status: BonLivraisonStatus;

  @Column({ nullable: true })
  invoiceId?: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
