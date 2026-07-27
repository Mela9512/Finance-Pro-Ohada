import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessPlanEntity } from '../../entities/business-plan.entity';
import { CompanyEntity } from '../../entities/company.entity';
import { ReportsService } from '../reports/reports.service';
import { AiService } from '../ai/ai.service';
import { AI_PROVIDER, AiProvider } from '../ai/ai-provider.interface';
import { CreateBusinessPlanDto } from './dto/create-business-plan.dto';
import {
  computeProjections,
  computeVAN,
  computeTRI,
  computeSeuilRentabilite,
  computeCreditScore,
} from './financial-calculations';

@Injectable()
export class BusinessPlanService {
  constructor(
    @InjectRepository(BusinessPlanEntity) private readonly repo: Repository<BusinessPlanEntity>,
    @InjectRepository(CompanyEntity) private readonly companyRepo: Repository<CompanyEntity>,
    private readonly reportsService: ReportsService,
    private readonly aiService: AiService,
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProvider,
  ) {}

  getBusinessPlans(companyId: string): Promise<BusinessPlanEntity[]> {
    return this.repo.find({ where: { companyId }, order: { createdAt: 'DESC' } });
  }

  async getBusinessPlan(companyId: string, id: string): Promise<BusinessPlanEntity> {
    const plan = await this.repo.findOne({ where: { id, companyId } });
    if (!plan) {
      throw new NotFoundException('Business plan introuvable');
    }
    return plan;
  }

  async deleteBusinessPlan(companyId: string, id: string): Promise<void> {
    const result = await this.repo.delete({ id, companyId });
    if (!result.affected) {
      throw new NotFoundException('Business plan introuvable');
    }
  }

  async createBusinessPlan(companyId: string, userId: string, dto: CreateBusinessPlanDto): Promise<BusinessPlanEntity> {
    const projections = computeProjections(dto);
    const netCashFlows = projections.map((p) => p.netCashFlow);
    const van = computeVAN(dto.investmentAmount, netCashFlows, dto.discountRatePercent);
    const tri = computeTRI(dto.investmentAmount, netCashFlows);
    const seuilRentabilite = computeSeuilRentabilite(dto.fixedCostsAnnual, dto.variableCostPercent);

    const [company, historicalResultatNet, overdueRatio] = await Promise.all([
      this.companyRepo.findOne({ where: { id: companyId } }),
      this.getHistoricalResultatNet(companyId),
      this.getOverdueRatio(companyId),
    ]);

    const creditScore = computeCreditScore({
      historicalResultatNet,
      overdueRatio,
      revenueGrowthRatePercent: dto.revenueGrowthRatePercent,
      year1NetCashFlow: projections[0]?.netCashFlow ?? 0,
    });

    const narrative = await this.generateNarrative(company?.name || 'Entreprise', dto, projections, van, tri, seuilRentabilite, creditScore);

    const plan = this.repo.create({
      companyId,
      createdBy: userId,
      title: dto.title,
      projectDescription: dto.projectDescription,
      investmentAmount: dto.investmentAmount,
      projectionYears: dto.projectionYears,
      year1Revenue: dto.year1Revenue,
      revenueGrowthRatePercent: dto.revenueGrowthRatePercent,
      variableCostPercent: dto.variableCostPercent,
      fixedCostsAnnual: dto.fixedCostsAnnual,
      discountRatePercent: dto.discountRatePercent,
      projections,
      van,
      tri,
      seuilRentabilite,
      creditScore,
      narrative,
    });

    return this.repo.save(plan);
  }

  /** Résultat net réel de l'exercice précédent, ou null si l'entreprise n'a aucune activité comptable enregistrée (neutre, pas une pénalité). */
  private async getHistoricalResultatNet(companyId: string): Promise<number | null> {
    const previousYear = new Date().getFullYear() - 1;
    const cr = await this.reportsService.getCompteDeResultatForYear(companyId, previousYear);
    if (cr.chiffreAffaires === 0 && cr.resultatNet === 0) {
      return null;
    }
    return cr.resultatNet;
  }

  private async getOverdueRatio(companyId: string): Promise<number> {
    const { clients } = await this.aiService.getClientsRiskAnalysis(companyId);
    const totalOutstanding = clients.reduce((s, c) => s + c.outstandingTotal, 0);
    const totalOverdue = clients.reduce((s, c) => s + c.overdueTotal, 0);
    return totalOutstanding > 0 ? totalOverdue / totalOutstanding : 0;
  }

  private async generateNarrative(
    companyName: string,
    dto: CreateBusinessPlanDto,
    projections: ReturnType<typeof computeProjections>,
    van: number,
    tri: number | null,
    seuilRentabilite: number,
    creditScore: number,
  ): Promise<string> {
    const prompt =
      `Rédige un résumé exécutif de business plan en français pour "${companyName}", pour le projet suivant : "${dto.projectDescription}".\n\n` +
      `Hypothèses fournies par le porteur de projet (prospectives, PAS des faits comptables) :\n` +
      `- Investissement recherché : ${dto.investmentAmount.toLocaleString('fr-FR')} XAF\n` +
      `- Chiffre d'affaires prévisionnel année 1 : ${dto.year1Revenue.toLocaleString('fr-FR')} XAF\n` +
      `- Croissance annuelle prévue : ${dto.revenueGrowthRatePercent}%\n` +
      `- Charges variables : ${dto.variableCostPercent}% du CA\n` +
      `- Charges fixes annuelles : ${dto.fixedCostsAnnual.toLocaleString('fr-FR')} XAF\n\n` +
      `Indicateurs financiers déjà calculés (valeurs réelles, ne les recalcule pas, utilise-les telles quelles) :\n` +
      `- VAN (taux d'actualisation ${dto.discountRatePercent}%) : ${van.toLocaleString('fr-FR')} XAF\n` +
      `- TRI : ${tri !== null ? tri.toFixed(1) + '%' : 'non calculable avec ces hypothèses'}\n` +
      `- Seuil de rentabilité : ${Number.isFinite(seuilRentabilite) ? seuilRentabilite.toLocaleString('fr-FR') + ' XAF de CA annuel' : 'non atteignable avec ces hypothèses (charges variables trop élevées)'}\n` +
      `- Score de crédibilité indicatif : ${creditScore}/100\n\n` +
      "Rédige 4-5 paragraphes : contexte du projet, stratégie financière, analyse des indicateurs ci-dessus (explique ce qu'ils signifient concrètement pour un banquier ou investisseur), et conclusion. " +
      "N'invente AUCUN chiffre qui ne figure pas ci-dessus. Précise explicitement que le score de crédibilité est un indicateur interne, pas une notation bancaire officielle.";

    try {
      return await this.aiProvider.generateText(prompt);
    } catch {
      return "Narratif indisponible (service IA inaccessible). Les indicateurs financiers calculés ci-dessus restent valides.";
    }
  }
}
