import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceEntity } from '../../entities/invoice.entity';
import { InvoiceItemEntity } from '../../entities/invoice-item.entity';
import { JournalEntryEntity } from '../../entities/journal-entry.entity';
import { SequenceService } from '../../common/services/sequence.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicingService {
  constructor(
    @InjectRepository(InvoiceEntity) private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(InvoiceItemEntity) private readonly itemRepo: Repository<InvoiceItemEntity>,
    @InjectRepository(JournalEntryEntity) private readonly entryRepo: Repository<JournalEntryEntity>,
    private readonly sequenceService: SequenceService,
    private readonly auditLogService: AuditLogService,
  ) {}

  getInvoices(companyId: string): Promise<InvoiceEntity[]> {
    return this.invoiceRepo.find({ where: { companyId }, relations: ['items'], order: { createdAt: 'DESC' } });
  }

  async createInvoice(companyId: string, dto: CreateInvoiceDto): Promise<InvoiceEntity> {
    const year = new Date(dto.date).getFullYear();
    const seqNumber = await this.sequenceService.next(companyId, `INVOICE-${year}`);
    const invoiceNumber = `FAC-${year}-${String(seqNumber).padStart(3, '0')}`;

    const invoice = this.invoiceRepo.create({
      ...dto,
      invoiceNumber,
      status: 'BROUILLON',
      amountPaid: 0,
      companyId,
      items: dto.items.map((i) => this.itemRepo.create(i)),
    });

    return this.invoiceRepo.save(invoice);
  }

  async validateInvoice(companyId: string, userId: string, id: string): Promise<InvoiceEntity> {
    const invoice = await this.invoiceRepo.findOne({ where: { id, companyId }, relations: ['items'] });
    if (!invoice) {
      throw new NotFoundException('Facture introuvable');
    }

    invoice.status = 'VALIDE';
    await this.invoiceRepo.save(invoice);

    const debitAccount = invoice.type === 'VENTE' ? '411' : '401';
    const creditAccount = invoice.type === 'VENTE' ? '701' : '601';
    const journalType = invoice.type === 'VENTE' ? 'VENTES' : 'ACHATS';
    const year = new Date(invoice.date).getFullYear();
    const seqNumber = await this.sequenceService.next(companyId, `${journalType}-${year}`);
    const entryNumber = `${journalType === 'VENTES' ? 'VT' : 'AC'}-${year}-${String(seqNumber).padStart(4, '0')}`;

    const entry = this.entryRepo.create({
      entryNumber,
      date: invoice.date,
      journalType,
      wording: `Facture ${invoice.invoiceNumber} - ${invoice.tierName}`,
      pieceNumber: invoice.invoiceNumber,
      isValidated: true,
      createdBy: userId,
      companyId,
      lines: [
        { accountCode: debitAccount, accountLabel: invoice.tierName, debit: invoice.totalTTC, credit: 0 } as any,
        { accountCode: creditAccount, accountLabel: "Chiffre d'affaires / Charges", debit: 0, credit: invoice.subtotalHT } as any,
        {
          accountCode: invoice.type === 'VENTE' ? '443' : '445',
          accountLabel: 'TVA Facturée/Récupérable',
          debit: 0,
          credit: invoice.totalTVA,
        } as any,
      ],
    });
    await this.entryRepo.save(entry);

    await this.auditLogService.log({
      companyId,
      userId,
      action: 'INVOICE_VALIDATED',
      entityType: 'Invoice',
      entityId: invoice.id,
      metadata: { invoiceNumber: invoice.invoiceNumber },
    });

    return invoice;
  }
}
