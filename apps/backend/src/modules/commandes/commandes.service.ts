import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommandeEntity } from '../../entities/commande.entity';
import { CommandeItemEntity } from '../../entities/commande-item.entity';
import { BonLivraisonEntity } from '../../entities/bon-livraison.entity';
import { BonLivraisonItemEntity } from '../../entities/bon-livraison-item.entity';
import { InvoiceEntity } from '../../entities/invoice.entity';
import { SequenceService } from '../../common/services/sequence.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { InvoicingService } from '../invoicing/invoicing.service';
import { CreateCommandeDto } from './dto/create-commande.dto';

const COMMANDE_PREFIX: Record<string, string> = { VENTE: 'CMD-V', ACHAT: 'CMD-A' };
const BL_PREFIX: Record<string, string> = { VENTE: 'BL-V', ACHAT: 'BL-A' };

@Injectable()
export class CommandesService {
  constructor(
    @InjectRepository(CommandeEntity) private readonly commandeRepo: Repository<CommandeEntity>,
    @InjectRepository(CommandeItemEntity) private readonly commandeItemRepo: Repository<CommandeItemEntity>,
    @InjectRepository(BonLivraisonEntity) private readonly blRepo: Repository<BonLivraisonEntity>,
    @InjectRepository(BonLivraisonItemEntity) private readonly blItemRepo: Repository<BonLivraisonItemEntity>,
    private readonly sequenceService: SequenceService,
    private readonly auditLogService: AuditLogService,
    private readonly invoicingService: InvoicingService,
  ) {}

  getCommandes(companyId: string): Promise<CommandeEntity[]> {
    return this.commandeRepo.find({ where: { companyId }, relations: ['items'], order: { createdAt: 'DESC' } });
  }

  async getBonsLivraison(companyId: string): Promise<BonLivraisonEntity[]> {
    return this.blRepo.find({ where: { companyId }, relations: ['items'], order: { createdAt: 'DESC' } });
  }

  async createCommande(companyId: string, userId: string, dto: CreateCommandeDto): Promise<CommandeEntity> {
    const year = new Date(dto.date).getFullYear();
    const seqNumber = await this.sequenceService.next(companyId, `COMMANDE-${dto.type}-${year}`);
    const numero = `${COMMANDE_PREFIX[dto.type]}-${year}-${String(seqNumber).padStart(4, '0')}`;

    const commande = this.commandeRepo.create({
      companyId,
      numero,
      type: dto.type,
      tierId: dto.tierId,
      tierName: dto.tierName,
      date: dto.date,
      subtotalHT: dto.subtotalHT,
      totalTVA: dto.totalTVA,
      totalTTC: dto.totalTTC,
      status: 'BROUILLON',
      notes: dto.notes,
      createdBy: userId,
      items: dto.items.map((i) => this.commandeItemRepo.create(i)),
    });
    const saved = await this.commandeRepo.save(commande);

    await this.auditLogService.log({
      companyId,
      userId,
      action: 'COMMANDE_CREATED',
      entityType: 'Commande',
      entityId: saved.id,
      metadata: { numero: saved.numero },
    });

    return saved;
  }

  private async findCommandeOrThrow(companyId: string, id: string): Promise<CommandeEntity> {
    const commande = await this.commandeRepo.findOne({ where: { id, companyId }, relations: ['items'] });
    if (!commande) throw new NotFoundException('Commande introuvable');
    return commande;
  }

  async confirmerCommande(companyId: string, userId: string, id: string): Promise<CommandeEntity> {
    const commande = await this.findCommandeOrThrow(companyId, id);
    if (commande.status !== 'BROUILLON') {
      throw new BadRequestException('Seule une commande en brouillon peut être confirmée.');
    }
    commande.status = 'CONFIRMEE';
    const saved = await this.commandeRepo.save(commande);

    await this.auditLogService.log({
      companyId,
      userId,
      action: 'COMMANDE_CONFIRMEE',
      entityType: 'Commande',
      entityId: saved.id,
      metadata: { numero: saved.numero },
    });

    return saved;
  }

  async annulerCommande(companyId: string, userId: string, id: string): Promise<CommandeEntity> {
    const commande = await this.findCommandeOrThrow(companyId, id);
    if (commande.status === 'FACTUREE') {
      throw new BadRequestException('Une commande déjà facturée ne peut plus être annulée.');
    }
    commande.status = 'ANNULEE';
    return this.commandeRepo.save(commande);
  }

  /**
   * Crée un bon de livraison reprenant l'intégralité des lignes de la commande (pas de
   * livraison partielle en v1 : une commande donne lieu à au plus un bon de livraison).
   */
  async livrerCommande(companyId: string, userId: string, id: string): Promise<BonLivraisonEntity> {
    const commande = await this.findCommandeOrThrow(companyId, id);
    if (commande.status !== 'CONFIRMEE') {
      throw new BadRequestException('Seule une commande confirmée peut être livrée.');
    }

    const year = new Date().getFullYear();
    const seqNumber = await this.sequenceService.next(companyId, `BL-${commande.type}-${year}`);
    const numero = `${BL_PREFIX[commande.type]}-${year}-${String(seqNumber).padStart(4, '0')}`;

    const bl = this.blRepo.create({
      companyId,
      commandeId: commande.id,
      numero,
      type: commande.type,
      tierId: commande.tierId,
      tierName: commande.tierName,
      date: new Date().toISOString().slice(0, 10),
      status: 'CONFIRME',
      createdBy: userId,
      items: commande.items.map((i) =>
        this.blItemRepo.create({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          tvaRate: i.tvaRate,
          totalHT: i.totalHT,
          totalTVA: i.totalTVA,
          totalTTC: i.totalTTC,
          accountCode: i.accountCode,
        }),
      ),
    });
    const savedBl = await this.blRepo.save(bl);

    commande.status = 'LIVREE';
    await this.commandeRepo.save(commande);

    await this.auditLogService.log({
      companyId,
      userId,
      action: 'BON_LIVRAISON_CREE',
      entityType: 'BonLivraison',
      entityId: savedBl.id,
      metadata: { numero: savedBl.numero, commandeNumero: commande.numero },
    });

    return savedBl;
  }

  /**
   * Génère la facture à partir du bon de livraison en réutilisant exactement la même
   * logique que la facturation directe existante (InvoicingService.createInvoice), pour
   * ne dupliquer aucune règle de calcul TVA/AIR.
   */
  async facturerBonLivraison(companyId: string, userId: string, id: string, dueDate: string): Promise<InvoiceEntity> {
    const bl = await this.blRepo.findOne({ where: { id, companyId }, relations: ['items'] });
    if (!bl) throw new NotFoundException('Bon de livraison introuvable');
    if (bl.status === 'FACTURE') {
      throw new BadRequestException('Ce bon de livraison a déjà été facturé.');
    }

    const subtotalHT = bl.items.reduce((s, i) => s + Number(i.totalHT), 0);
    const totalTVA = bl.items.reduce((s, i) => s + Number(i.totalTVA), 0);
    const totalTTC = bl.items.reduce((s, i) => s + Number(i.totalTTC), 0);

    const invoice = await this.invoicingService.createInvoice(companyId, {
      type: bl.type,
      tierId: bl.tierId,
      tierName: bl.tierName,
      date: bl.date,
      dueDate,
      items: bl.items.map((i) => ({
        description: i.description,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        tvaRate: Number(i.tvaRate),
        totalHT: Number(i.totalHT),
        totalTVA: Number(i.totalTVA),
        totalTTC: Number(i.totalTTC),
        accountCode: i.accountCode,
      })),
      subtotalHT,
      totalTVA,
      airRate: 0,
      totalAIR: 0,
      totalTTC,
      notes: `Généré depuis le bon de livraison ${bl.numero}`,
    });

    bl.status = 'FACTURE';
    bl.invoiceId = invoice.id;
    await this.blRepo.save(bl);

    const commande = await this.commandeRepo.findOne({ where: { id: bl.commandeId, companyId } });
    if (commande) {
      commande.status = 'FACTUREE';
      await this.commandeRepo.save(commande);
    }

    await this.auditLogService.log({
      companyId,
      userId,
      action: 'BON_LIVRAISON_FACTURE',
      entityType: 'Invoice',
      entityId: invoice.id,
      metadata: { blNumero: bl.numero, invoiceNumber: invoice.invoiceNumber },
    });

    return invoice;
  }
}
