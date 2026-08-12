import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentEntity, DocumentCategory } from '../../entities/document.entity';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || 'https://lacapogzijbmabzwxexl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';
const BUCKET = 'documents';

@Injectable()
export class DocumentsService {
  private supabase = createClient(supabaseUrl, supabaseServiceKey);

  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentRepo: Repository<DocumentEntity>,
  ) {}

  // List documents for a company, optionally filtered by category
  async listDocuments(companyId: string, category?: string): Promise<DocumentEntity[]> {
    const query = this.documentRepo.createQueryBuilder('doc')
      .where('doc.companyId = :companyId', { companyId })
      .andWhere('doc.isDeleted = false');

    if (category && category !== 'ALL') {
      query.andWhere('doc.category = :category', { category });
    }

    return query.orderBy('doc.createdAt', 'DESC').getMany();
  }

  // Upload a file to Supabase Storage and save metadata
  async uploadDocument(
    companyId: string,
    uploadedBy: string,
    file: Express.Multer.File,
    options: {
      name?: string;
      category?: DocumentCategory;
      tags?: string[];
      linkedPieceNumber?: string;
      linkedEntryId?: string;
    },
  ): Promise<DocumentEntity> {
    const year = new Date().getFullYear();
    const category = options.category || 'DIVERS';
    const uniqueId = crypto.randomUUID();
    const ext = file.originalname.split('.').pop();
    const storagePath = `${companyId}/${year}/${category}/${uniqueId}.${ext}`;

    // Compute SHA-256 fingerprint
    const sha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Upload to Supabase Storage
    const { error } = await this.supabase.storage
      .from(BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    let storageUrl = '';
    if (!error) {
      // Try to get a signed URL valid for 24h
      const { data: urlData } = await this.supabase.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, 86400);
      storageUrl = urlData?.signedUrl || '';
    }

    // Save metadata to DB regardless of Supabase result (graceful fallback)
    const doc = this.documentRepo.create({
      companyId,
      name: options.name || file.originalname,
      originalName: file.originalname,
      category,
      tags: options.tags || [],
      storagePath,
      storageUrl,
      size: file.size,
      mimeType: file.mimetype,
      uploadedBy,
      linkedPieceNumber: options.linkedPieceNumber,
      linkedEntryId: options.linkedEntryId,
      sha256,
    });

    return this.documentRepo.save(doc);
  }

  // Generate a fresh signed download URL (24h)
  async getDownloadUrl(companyId: string, id: string): Promise<{ url: string }> {
    const doc = await this.documentRepo.findOne({
      where: { id, companyId, isDeleted: false },
    });
    if (!doc) throw new NotFoundException('Document introuvable');

    // Try Supabase signed URL
    const { data } = await this.supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.storagePath, 86400);

    if (data?.signedUrl) {
      return { url: data.signedUrl };
    }

    // Fallback: return stored URL if any
    if (doc.storageUrl) return { url: doc.storageUrl };

    throw new NotFoundException('URL de téléchargement non disponible');
  }

  // Soft delete
  async deleteDocument(companyId: string, id: string): Promise<void> {
    const doc = await this.documentRepo.findOne({
      where: { id, companyId, isDeleted: false },
    });
    if (!doc) throw new NotFoundException('Document introuvable');

    // Remove from Supabase Storage
    await this.supabase.storage.from(BUCKET).remove([doc.storagePath]);

    doc.isDeleted = true;
    await this.documentRepo.save(doc);
  }

  // Get storage stats for the company
  async getStats(companyId: string): Promise<{ count: number; totalSize: number }> {
    const docs = await this.documentRepo.find({
      where: { companyId, isDeleted: false },
      select: ['size'],
    });
    const totalSize = docs.reduce((sum, d) => sum + Number(d.size || 0), 0);
    return { count: docs.length, totalSize };
  }
}
