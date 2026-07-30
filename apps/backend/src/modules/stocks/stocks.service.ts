import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockArticleEntity } from '../../entities/stock-article.entity';
import { StockMouvementEntity } from '../../entities/stock-mouvement.entity';
import { SequenceService } from '../../common/services/sequence.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { CreateMouvementDto } from './dto/create-mouvement.dto';
import { replayStockMovements, StockState } from './cump-calculations';

export interface ArticleWithState extends StockArticleEntity {
  etat: StockState;
}

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(StockArticleEntity) private readonly articleRepo: Repository<StockArticleEntity>,
    @InjectRepository(StockMouvementEntity) private readonly mouvementRepo: Repository<StockMouvementEntity>,
    private readonly sequenceService: SequenceService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private async getMovementsForArticle(companyId: string, articleId: string): Promise<StockMouvementEntity[]> {
    return this.mouvementRepo.find({
      where: { companyId, articleId },
      order: { createdAt: 'ASC' },
    });
  }

  private computeState(movements: StockMouvementEntity[]): StockState {
    return replayStockMovements(
      movements.map((m) => ({
        type: m.type,
        quantite: Number(m.quantite),
        coutUnitaire: m.coutUnitaire !== null ? Number(m.coutUnitaire) : undefined,
      })),
    );
  }

  async createArticle(companyId: string, userId: string, dto: CreateArticleDto): Promise<StockArticleEntity> {
    const year = new Date().getFullYear();
    const seqNumber = await this.sequenceService.next(companyId, `ARTICLE-${year}`);
    const code = `ART-${year}-${String(seqNumber).padStart(4, '0')}`;

    const article = this.articleRepo.create({
      companyId,
      code,
      label: dto.label,
      unite: dto.unite,
      accountCodeStock: dto.accountCodeStock,
      seuilAlerte: dto.seuilAlerte,
      createdBy: userId,
    });
    const saved = await this.articleRepo.save(article);

    await this.auditLogService.log({
      companyId,
      userId,
      action: 'STOCK_ARTICLE_CREATED',
      entityType: 'StockArticle',
      entityId: saved.id,
      metadata: { code: saved.code, label: saved.label },
    });

    return saved;
  }

  async findAllArticles(companyId: string): Promise<ArticleWithState[]> {
    const articles = await this.articleRepo.find({ where: { companyId }, order: { label: 'ASC' } });
    const allMovements = await this.mouvementRepo.find({ where: { companyId }, order: { createdAt: 'ASC' } });
    const byArticle = new Map<string, StockMouvementEntity[]>();
    for (const m of allMovements) {
      const list = byArticle.get(m.articleId) ?? [];
      list.push(m);
      byArticle.set(m.articleId, list);
    }
    return articles.map((a) => ({ ...a, etat: this.computeState(byArticle.get(a.id) ?? []) }));
  }

  async findArticleDetail(companyId: string, id: string) {
    const article = await this.articleRepo.findOne({ where: { id, companyId } });
    if (!article) throw new NotFoundException('Article introuvable');
    const movements = await this.getMovementsForArticle(companyId, id);
    return { ...article, etat: this.computeState(movements), mouvements: movements.slice().reverse() };
  }

  async createMouvement(companyId: string, userId: string, dto: CreateMouvementDto): Promise<StockMouvementEntity> {
    const article = await this.articleRepo.findOne({ where: { id: dto.articleId, companyId } });
    if (!article) throw new NotFoundException('Article introuvable');

    const existing = await this.getMovementsForArticle(companyId, dto.articleId);
    const stateBefore = this.computeState(existing);

    let coutUnitaire: number;
    if (dto.type === 'ENTREE') {
      if (dto.coutUnitaire === undefined) {
        throw new BadRequestException("Le coût unitaire est requis pour une entrée en stock.");
      }
      coutUnitaire = dto.coutUnitaire;
    } else {
      if (dto.quantite > stateBefore.quantite) {
        throw new BadRequestException(
          `Stock insuffisant : quantité disponible ${stateBefore.quantite} ${article.unite}, sortie demandée ${dto.quantite}.`,
        );
      }
      coutUnitaire = stateBefore.cump;
    }

    const valeurTotale = Math.round(dto.quantite * coutUnitaire * 100) / 100;

    const mouvement = this.mouvementRepo.create({
      companyId,
      articleId: dto.articleId,
      date: dto.date,
      type: dto.type,
      quantite: dto.quantite,
      coutUnitaire,
      valeurTotale,
      reference: dto.reference,
      createdBy: userId,
    });
    const saved = await this.mouvementRepo.save(mouvement);

    await this.auditLogService.log({
      companyId,
      userId,
      action: dto.type === 'ENTREE' ? 'STOCK_ENTREE' : 'STOCK_SORTIE',
      entityType: 'StockMouvement',
      entityId: saved.id,
      metadata: { articleCode: article.code, quantite: dto.quantite, valeurTotale },
    });

    return saved;
  }

  async getSynthese(companyId: string) {
    const articles = await this.findAllArticles(companyId);
    const parCompte = new Map<string, number>();
    let valeurTotale = 0;
    for (const a of articles) {
      valeurTotale += a.etat.valeur;
      parCompte.set(a.accountCodeStock, (parCompte.get(a.accountCodeStock) ?? 0) + a.etat.valeur);
    }
    return {
      valeurTotale: Math.round(valeurTotale * 100) / 100,
      nbArticles: articles.length,
      parCompte: Array.from(parCompte.entries()).map(([accountCode, valeur]) => ({ accountCode, valeur })),
    };
  }
}
