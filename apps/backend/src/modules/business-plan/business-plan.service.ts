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

export interface SuggestedHypotheses {
  investmentAmount: number;
  projectionYears: number;
  year1Revenue: number;
  revenueGrowthRatePercent: number;
  variableCostPercent: number;
  fixedCostsAnnual: number;
  discountRatePercent: number;
  rationale: string;
}

const HYPOTHESES_SCHEMA = {
  type: 'OBJECT',
  properties: {
    investmentAmount: { type: 'NUMBER', description: 'Investissement initial typique en XAF pour ce type de projet' },
    projectionYears: { type: 'INTEGER', description: 'Durée de projection raisonnable, entre 3 et 5' },
    year1Revenue: { type: 'NUMBER', description: "Chiffre d'affaires prévisionnel année 1 en XAF" },
    revenueGrowthRatePercent: { type: 'NUMBER', description: 'Taux de croissance annuel typique, en %' },
    variableCostPercent: { type: 'NUMBER', description: 'Charges variables en % du CA, typique pour ce secteur' },
    fixedCostsAnnual: { type: 'NUMBER', description: 'Charges fixes annuelles typiques en XAF' },
    discountRatePercent: { type: 'NUMBER', description: "Taux d'actualisation raisonnable pour ce contexte, en %" },
    rationale: { type: 'STRING', description: 'Justification en 2-3 phrases de ces ordres de grandeur' },
  },
  required: [
    'investmentAmount', 'projectionYears', 'year1Revenue', 'revenueGrowthRatePercent',
    'variableCostPercent', 'fixedCostsAnnual', 'discountRatePercent', 'rationale',
  ],
};

@Injectable()
export class BusinessPlanService {
  constructor(
    @InjectRepository(BusinessPlanEntity) private readonly repo: Repository<BusinessPlanEntity>,
    @InjectRepository(CompanyEntity) private readonly companyRepo: Repository<CompanyEntity>,
    private readonly reportsService: ReportsService,
    private readonly aiService: AiService,
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProvider,
  ) {}

  /**
   * Propose des ordres de grandeur TYPIQUES pour ce type de projet à partir du titre/description
   * fournis par l'utilisateur. Ce sont des estimations indicatives à ajuster, jamais des données
   * réelles de l'entreprise — l'IA le précise explicitement dans sa justification.
   */
  async suggestHypotheses(title: string, description: string): Promise<SuggestedHypotheses> {
    const prompt =
      `Pour un projet intitulé "${title}", décrit ainsi : "${description}", propose des hypothèses ` +
      "financières RAISONNABLES et TYPIQUES pour ce type d'activité dans un contexte d'Afrique " +
      "francophone (zone OHADA), en francs CFA (XAF). Ce sont des ordres de grandeur indicatifs " +
      "à ajuster par le porteur de projet, PAS des données réelles d'une entreprise existante. " +
      'Réponds uniquement avec les champs demandés par le schéma.';

    return this.aiProvider.generateJson<SuggestedHypotheses>(prompt, HYPOTHESES_SCHEMA);
  }

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
      `Rédige un business plan structuré et professionnel en français pour "${companyName}", pour le projet suivant : "${dto.projectDescription}".\n\n` +
      `Hypothèses fournies par le porteur de projet (prospectives, PAS des faits comptables) :\n` +
      `- Investissement recherché : ${dto.investmentAmount.toLocaleString('fr-FR')} XAF\n` +
      `- Chiffre d'affaires prévisionnel année 1 : ${dto.year1Revenue.toLocaleString('fr-FR')} XAF\n` +
      `- Croissance annuelle prévue : ${dto.revenueGrowthRatePercent}%\n` +
      `- Charges variables : ${dto.variableCostPercent}% du CA\n` +
      `- Charges fixes annuelles : ${dto.fixedCostsAnnual.toLocaleString('fr-FR')} XAF\n` +
      `- Durée du projet : ${dto.projectionYears} an(s)\n\n` +
      `Indicateurs financiers déjà calculés (valeurs réelles, ne les recalcule pas, utilise-les telles quelles) :\n` +
      `- VAN (taux d'actualisation ${dto.discountRatePercent}%) : ${van.toLocaleString('fr-FR')} XAF\n` +
      `- TRI : ${tri !== null ? tri.toFixed(1) + '%' : 'non calculable avec ces hypothèses'}\n` +
      `- Seuil de rentabilité : ${Number.isFinite(seuilRentabilite) ? seuilRentabilite.toLocaleString('fr-FR') + ' XAF de CA annuel' : 'non atteignable avec ces hypothèses (charges variables trop élevées)'}\n` +
      `- Score de crédibilité indicatif : ${creditScore}/100\n\n` +
      'Structure la réponse EXACTEMENT avec ces 6 sections, chacune précédée d\'un titre commençant par "## " ' +
      '(deux dièses puis un espace, sur sa propre ligne) suivi de 1 à 3 paragraphes de contenu concret et spécifique ' +
      "au projet décrit (pas de généralités interchangeables d'un projet à l'autre) :\n" +
      '## Résumé Exécutif\n' +
      '## Le Projet et son Marché\n' +
      '## Stratégie et Utilisation des Fonds\n' +
      '## Analyse des Risques (Forces, Faiblesses, Opportunités, Menaces)\n' +
      '## Analyse Financière\n' +
      '## Conclusion et Recommandation\n\n' +
      "N'invente AUCUN chiffre financier qui ne figure pas ci-dessus. Précise explicitement dans la conclusion que " +
      'le score de crédibilité est un indicateur interne, pas une notation bancaire officielle. Sois concret : appuie-toi ' +
      "sur les détails réels de la description du projet plutôt que sur des formulations génériques.";

    try {
      return await this.aiProvider.generateText(prompt);
    } catch {
      return "Narratif indisponible (service IA inaccessible). Les indicateurs financiers calculés ci-dessus restent valides.";
    }
  }
}
