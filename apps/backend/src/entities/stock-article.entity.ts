import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('stock_articles')
export class StockArticleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  code: string;

  @Column()
  label: string;

  @Column()
  unite: string;

  @Column()
  accountCodeStock: string;

  @Column('numeric', { precision: 15, scale: 3, nullable: true })
  seuilAlerte?: number;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
