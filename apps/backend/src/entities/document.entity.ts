import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type DocumentCategory =
  | 'FACTURE_ACHAT'
  | 'FACTURE_VENTE'
  | 'RELEVE_BANCAIRE'
  | 'CONTRAT'
  | 'BULLETIN_PAIE'
  | 'FISCAL_DSF'
  | 'IMMOBILISATION'
  | 'DIVERS';

@Entity('documents')
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  name: string; // Nom d'affichage (peut être renommé)

  @Column()
  originalName: string; // Nom original du fichier

  @Column({ type: 'varchar', default: 'DIVERS' })
  category: DocumentCategory;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column()
  storagePath: string; // Chemin dans Supabase Storage

  @Column({ nullable: true })
  storageUrl: string; // URL publique ou signée

  @Column({ type: 'bigint', default: 0 })
  size: number; // Taille en octets

  @Column({ default: 'application/octet-stream' })
  mimeType: string;

  @Column()
  uploadedBy: string; // userId

  @Column({ nullable: true })
  linkedPieceNumber: string; // Numéro de pièce comptable lié (ex: AC-2026-014)

  @Column({ nullable: true })
  linkedEntryId: string; // ID d'écriture comptable lié

  @Column({ nullable: true })
  sha256: string; // Empreinte numérique SHA-256 pour l'inaltérabilité légale

  @Column({ default: false })
  isDeleted: boolean; // Soft delete

  @CreateDateColumn()
  createdAt: Date;
}
