import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  userId: string;

  @Column()
  action: string; // ex: "LOGIN", "JOURNAL_ENTRY_VALIDATED", "COMPANY_UPDATED"

  @Column({ nullable: true })
  entityType?: string;

  @Column({ nullable: true })
  entityId?: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
