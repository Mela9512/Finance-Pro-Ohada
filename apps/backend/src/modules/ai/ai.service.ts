import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CompteDeResultat } from '@financepro/shared';
import { AccountEntity } from '../../entities/account.entity';
import { JournalLineEntity } from '../../entities/journal-line.entity';
import { InvoiceEntity } from '../../entities/invoice.entity';
import { CustomerEntity } from '../../entities/customer.entity';
import { SupplierEntity } from '../../entities/supplier.entity';
import { TreasuryAccountEntity } from '../../entities/treasury-account.entity';
import { AccountingService } from '../accounting/accounting.service';
import { ReportsService } from '../reports/reports.service';
import { BudgetService } from '../budget/budget.service';
import { AI_PROVIDER, AiProvider } from './ai-provider.interface';

export interface ExtractedInvoiceDraft {
  supplierName: string;
  invoiceDate: string;
  dueDate: string;
  subtotalHT: number;
  totalTVA: number;
  totalTTC: number;
  lineItems: { description: string; quantity: number; unitPrice: number }[];
}

export interface AccountSuggestion {
  accountCode: string;
  label: string;
  confidence: number;
}

export interface Anomaly {
  type: 'DUPLICATE_INVOICE' | 'CREDIT_LIMIT_EXCEEDED' | 'BUDGET_VARIANCE';
  severity: 'HIGH' | 'MEDIUM';
  message: string;
}

export type RiskLevel = 'AUCUN' | 'FAIBLE' | 'MOYEN' | 'ELEVE';

export interface ClientRisk {
  customerId: string;
  customerName: string;
  outstandingTotal: number;
  overdueTotal: number;
  overdueInvoiceCount: number;
  creditLimit: number;
  riskLevel: RiskLevel;
}

export interface SupplierAlert {
  supplierId: string;
  supplierName: string;
  outstandingTotal: number;
  overdueTotal: number;
  overdueInvoiceCount: number;
  riskLevel: RiskLevel;
}

const INVOICE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    supplierName: { type: 'STRING' },
    invoiceDate: { type: 'STRING', description: 'Date de la facture au format AAAA-MM-JJ' },
    dueDate: { type: 'STRING', description: "Date d'échéance au format AAAA-MM-JJ, chaîne vide si absente" },
    subtotalHT: { type: 'NUMBER', description: 'Montant hors taxes' },
    totalTVA: { type: 'NUMBER' },
    totalTTC: { type: 'NUMBER' },
    lineItems: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          description: { type: 'STRING' },
          quantity: { type: 'NUMBER' },
          unitPrice: { type: 'NUMBER' },
        },
      },
    },
  },
  required: ['supplierName', 'invoiceDate', 'subtotalHT', 'totalTVA', 'totalTTC'],
};

const ACCOUNT_SUGGESTION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    accountCode: { type: 'STRING' },
    label: { type: 'STRING' },
    confidence: { type: 'NUMBER', description: 'Entre 0 et 1' },
  },
  required: ['accountCode', 'confidence'],
};

const BUDGET_VARIANCE_THRESHOLD_PERCENT = 20;

@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProvider,
    @InjectRepository(AccountEntity) private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(JournalLineEntity) private readonly lineRepo: Repository<JournalLineEntity>,
    @InjectRepository(InvoiceEntity) private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(CustomerEntity) private readonly customerRepo: Repository<CustomerEntity>,
    @InjectRepository(SupplierEntity) private readonly supplierRepo: Repository<SupplierEntity>,
    @InjectRepository(TreasuryAccountEntity) private readonly treasuryAccountRepo: Repository<TreasuryAccountEntity>,
    private readonly accountingService: AccountingService,
    private readonly reportsService: ReportsService,
    private readonly budgetService: BudgetService,
  ) {}

  /** Extrait un brouillon de facture depuis une image/PDF — jamais auto-validé, relecture humaine obligatoire. */
  async extractInvoiceFromFile(fileBase64: string, mimeType: string): Promise<ExtractedInvoiceDraft> {
    const prompt =
      "Extrais les informations de cette facture fournisseur (image ou PDF). Les montants sont en francs CFA (XAF). " +
      "Ne devine JAMAIS un montant que tu ne peux pas lire clairement sur le document — dans ce cas laisse la valeur à 0. " +
      'Réponds uniquement avec les champs demandés par le schéma.';

    return this.aiProvider.generateJsonFromFile<ExtractedInvoiceDraft>(prompt, fileBase64, mimeType, INVOICE_SCHEMA);
  }

  /** Suggère un compte SYSCOHADA pour un libellé d'écriture, à partir du plan comptable et de l'historique réel de l'entreprise. */
  async suggestAccountCode(companyId: string, wording: string): Promise<AccountSuggestion> {
    const accounts = await this.accountRepo.find({ order: { code: 'ASC' } });

    const recentExamples = await this.lineRepo
      .createQueryBuilder('line')
      .innerJoin('line.entry', 'entry')
      .select(['entry.wording AS wording', 'line.accountCode AS "accountCode"'])
      .where('entry.companyId = :companyId', { companyId })
      .orderBy('entry.createdAt', 'DESC')
      .limit(20)
      .getRawMany<{ wording: string; accountCode: string }>();

    const planText = accounts.map((a) => `${a.code} - ${a.label}`).join('\n');
    const examplesText = recentExamples.length
      ? recentExamples.map((e) => `"${e.wording}" -> ${e.accountCode}`).join('\n')
      : '(aucun historique disponible)';

    const prompt =
      `Plan comptable SYSCOHADA de l'entreprise :\n${planText}\n\n` +
      `Exemples réels de comptabilisation déjà saisis par cette entreprise :\n${examplesText}\n\n` +
      `Pour le libellé d'écriture suivant : "${wording}", quel est le compte SYSCOHADA le plus approprié parmi le plan comptable ci-dessus ? ` +
      'Réponds uniquement avec un code de compte qui existe dans ce plan comptable.';

    return this.aiProvider.generateJson<AccountSuggestion>(prompt, ACCOUNT_SUGGESTION_SCHEMA);
  }

  /** Détection d'anomalies déterministe (doublons, dépassements, écarts budgétaires) + synthèse IA optionnelle. */
  async detectAnomalies(companyId: string): Promise<{ anomalies: Anomaly[]; analyseIA: string | null }> {
    const anomalies: Anomaly[] = [];

    const duplicateGroups = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .select('invoice.tierId', 'tierId')
      .addSelect('invoice.tierName', 'tierName')
      .addSelect('invoice.totalTTC', 'totalTTC')
      .addSelect('invoice.date', 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('STRING_AGG(invoice.invoiceNumber, \', \')', 'invoiceNumbers')
      .where('invoice.companyId = :companyId', { companyId })
      .andWhere("invoice.status != 'ANNULE'")
      .groupBy('invoice.tierId, invoice.tierName, invoice.totalTTC, invoice.date')
      .having('COUNT(*) > 1')
      .getRawMany<{ tierName: string; totalTTC: string; date: string; invoiceNumbers: string }>();

    for (const d of duplicateGroups) {
      anomalies.push({
        type: 'DUPLICATE_INVOICE',
        severity: 'HIGH',
        message: `Factures potentiellement en double pour ${d.tierName} : ${d.invoiceNumbers} (${Number(d.totalTTC).toLocaleString('fr-FR')} XAF le ${d.date})`,
      });
    }

    const customers = await this.customerRepo.find({ where: { companyId } });
    for (const customer of customers) {
      const creditLimit = Number(customer.creditLimit);
      if (creditLimit <= 0) continue;

      const { total } = await this.invoiceRepo
        .createQueryBuilder('invoice')
        .select('COALESCE(SUM(invoice.totalTTC - invoice.amountPaid), 0)', 'total')
        .where('invoice.companyId = :companyId', { companyId })
        .andWhere('invoice.tierId = :tierId', { tierId: customer.id })
        .andWhere("invoice.status IN ('VALIDE', 'PARTIEL')")
        .getRawOne<{ total: string }>();

      const outstanding = Number(total);
      if (outstanding > creditLimit) {
        anomalies.push({
          type: 'CREDIT_LIMIT_EXCEEDED',
          severity: 'MEDIUM',
          message: `${customer.name} : encours client de ${outstanding.toLocaleString('fr-FR')} XAF dépasse la limite de crédit de ${creditLimit.toLocaleString('fr-FR')} XAF`,
        });
      }
    }

    const currentYear = new Date().getFullYear();
    const comparison = await this.budgetService.getComparison(companyId, currentYear);
    for (const row of comparison) {
      if (row.budgeted <= 0 || row.variancePercent === null) continue;
      if (Math.abs(row.variancePercent) > BUDGET_VARIANCE_THRESHOLD_PERCENT) {
        anomalies.push({
          type: 'BUDGET_VARIANCE',
          severity: Math.abs(row.variancePercent) > 50 ? 'HIGH' : 'MEDIUM',
          message: `${row.accountCode} - ${row.label} : écart budgétaire de ${row.variancePercent.toFixed(1)}% (réel ${row.actual.toLocaleString('fr-FR')} XAF vs budget ${row.budgeted.toLocaleString('fr-FR')} XAF)`,
        });
      }
    }

    let analyseIA: string | null = null;
    if (anomalies.length > 0) {
      try {
        analyseIA = await this.aiProvider.generateText(
          `Voici une liste d'anomalies comptables détectées automatiquement pour cette entreprise (données réelles, pas d'invention) :\n` +
            anomalies.map((a) => `- [${a.severity}] ${a.message}`).join('\n') +
            '\n\nRésume en 2-3 phrases en français les points les plus prioritaires à traiter, sans ajouter de chiffre qui ne figure pas ci-dessus.',
        );
      } catch {
        analyseIA = null;
      }
    }

    return { anomalies, analyseIA };
  }

  /** Assistant conversationnel : répond uniquement à partir des données réelles et actuelles de l'entreprise. */
  async chat(companyId: string, question: string, currentScreen?: string): Promise<string> {
    const [bilan, compteDeResultat, balanceGenerale, budgetComparison] = await Promise.all([
      this.reportsService.getBilan(companyId),
      this.reportsService.getCompteDeResultat(companyId),
      this.accountingService.getBalanceGenerale(companyId),
      this.budgetService.getComparison(companyId, new Date().getFullYear()),
    ]);

    const context = JSON.stringify({ bilan, compteDeResultat, balanceGenerale, budgetVsReel: budgetComparison });
    const screenHint = currentScreen ? `\n\nL'utilisateur consulte actuellement l'écran : "${currentScreen}". Privilégie une réponse pertinente pour ce contexte si la question est ambiguë.` : '';

    const systemInstruction =
      'Tu es un assistant comptable pour une entreprise utilisant le référentiel SYSCOHADA (OHADA). ' +
      "Réponds UNIQUEMENT à partir des données JSON fournies ci-dessous, qui reflètent l'état réel et à jour de la comptabilité de l'entreprise. " +
      "N'invente JAMAIS un chiffre absent de ces données. Si la question porte sur une donnée absente, dis-le clairement plutôt que d'estimer. " +
      `Réponds en français, de façon concise.${screenHint}\n\nDonnées réelles de l'entreprise :\n${context}`;

    return this.aiProvider.generateText(question, systemInstruction);
  }

  /** Prévision de trésorerie 30/60/90 jours à partir des échéances réelles des factures non soldées. */
  async getCashflowForecast(companyId: string) {
    const today = new Date();
    const treasuryAccounts = await this.treasuryAccountRepo.find({ where: { companyId } });
    const soldeActuel = treasuryAccounts.reduce((s, a) => s + Number(a.balance), 0);

    const unpaidInvoices = await this.invoiceRepo.find({
      where: { companyId, status: In(['VALIDE', 'PARTIEL']) },
    });

    const buckets = {
      30: { entrees: 0, sorties: 0 },
      60: { entrees: 0, sorties: 0 },
      90: { entrees: 0, sorties: 0 },
    };

    for (const invoice of unpaidInvoices) {
      const remaining = Number(invoice.totalTTC) - Number(invoice.amountPaid);
      if (remaining <= 0) continue;

      const dueDate = new Date(invoice.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
      const isInflow = invoice.type === 'VENTE';
      const bucketKey = daysUntilDue <= 30 ? 30 : daysUntilDue <= 60 ? 60 : daysUntilDue <= 90 ? 90 : null;
      if (bucketKey === null) continue;

      if (isInflow) buckets[bucketKey].entrees += remaining;
      else buckets[bucketKey].sorties += remaining;
    }

    const projection30 = soldeActuel + buckets[30].entrees - buckets[30].sorties;
    const projection60 = projection30 + buckets[60].entrees - buckets[60].sorties;
    const projection90 = projection60 + buckets[90].entrees - buckets[90].sorties;

    const deterministic = {
      soldeActuel,
      horizon30: { ...buckets[30], soldeProjete: projection30 },
      horizon60: { ...buckets[60], soldeProjete: projection60 },
      horizon90: { ...buckets[90], soldeProjete: projection90 },
    };

    let analyseIA: string | null = null;
    try {
      analyseIA = await this.aiProvider.generateText(
        'Analyse cette projection de trésorerie sur 30/60/90 jours (calculée à partir des échéances réelles de factures non soldées) ' +
          'et donne 2-3 phrases de recommandation concise en français, en te basant strictement sur ces chiffres réels : ' +
          JSON.stringify(deterministic),
      );
    } catch {
      analyseIA = null;
    }

    return { ...deterministic, analyseIA };
  }

  private computeRiskLevel(overdueTotal: number, overdueInvoiceCount: number, creditLimit: number): RiskLevel {
    if (overdueInvoiceCount === 0) return 'AUCUN';
    const ratio = creditLimit > 0 ? overdueTotal / creditLimit : 0;
    if (ratio > 1 || overdueInvoiceCount >= 3) return 'ELEVE';
    if (ratio > 0.5 || overdueInvoiceCount >= 2) return 'MOYEN';
    return 'FAIBLE';
  }

  /** Analyse de risque client réelle : encours et retards calculés depuis les factures VENTE non soldées. */
  async getClientsRiskAnalysis(companyId: string): Promise<{ clients: ClientRisk[]; analyseIA: string | null }> {
    const today = new Date().toISOString().substring(0, 10);
    const customers = await this.customerRepo.find({ where: { companyId } });

    const rows = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .select('invoice.tierId', 'tierId')
      .addSelect('SUM(invoice.totalTTC - invoice.amountPaid)', 'outstanding')
      .addSelect(`SUM(CASE WHEN invoice.dueDate < :today THEN invoice.totalTTC - invoice.amountPaid ELSE 0 END)`, 'overdue')
      .addSelect(`SUM(CASE WHEN invoice.dueDate < :today THEN 1 ELSE 0 END)`, 'overdueCount')
      .where('invoice.companyId = :companyId', { companyId })
      .andWhere("invoice.type = 'VENTE'")
      .andWhere("invoice.status IN ('VALIDE', 'PARTIEL')")
      .andWhere('invoice.totalTTC > invoice.amountPaid')
      .groupBy('invoice.tierId')
      .setParameter('today', today)
      .getRawMany<{ tierId: string; outstanding: string; overdue: string; overdueCount: string }>();

    const byTierId = new Map(rows.map((r) => [r.tierId, r]));

    const clients: ClientRisk[] = customers.map((customer) => {
      const row = byTierId.get(customer.id);
      const outstandingTotal = Number(row?.outstanding) || 0;
      const overdueTotal = Number(row?.overdue) || 0;
      const overdueInvoiceCount = Number(row?.overdueCount) || 0;
      const creditLimit = Number(customer.creditLimit);
      return {
        customerId: customer.id,
        customerName: customer.name,
        outstandingTotal,
        overdueTotal,
        overdueInvoiceCount,
        creditLimit,
        riskLevel: this.computeRiskLevel(overdueTotal, overdueInvoiceCount, creditLimit),
      };
    });

    const atRisk = clients.filter((c) => c.riskLevel !== 'AUCUN').sort((a, b) => b.overdueTotal - a.overdueTotal);
    let analyseIA: string | null = null;
    if (atRisk.length > 0) {
      try {
        analyseIA = await this.aiProvider.generateText(
          "Voici les clients présentant un risque de retard de paiement (données réelles, factures échues non soldées) :\n" +
            atRisk.map((c) => `- [${c.riskLevel}] ${c.customerName} : ${c.overdueTotal.toLocaleString('fr-FR')} XAF en retard (${c.overdueInvoiceCount} facture(s))`).join('\n') +
            '\n\nDonne 2-3 phrases de recommandation concise en français sur les priorités de relance, sans inventer de chiffre absent ci-dessus.',
        );
      } catch {
        analyseIA = null;
      }
    }

    return { clients, analyseIA };
  }

  /** Analyse des dettes fournisseurs réellement en retard, calculée depuis les factures ACHAT non soldées. */
  async getSuppliersOverdueAnalysis(companyId: string): Promise<{ suppliers: SupplierAlert[]; analyseIA: string | null }> {
    const today = new Date().toISOString().substring(0, 10);
    const suppliersList = await this.supplierRepo.find({ where: { companyId } });

    const rows = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .select('invoice.tierId', 'tierId')
      .addSelect('SUM(invoice.totalTTC - invoice.amountPaid)', 'outstanding')
      .addSelect(`SUM(CASE WHEN invoice.dueDate < :today THEN invoice.totalTTC - invoice.amountPaid ELSE 0 END)`, 'overdue')
      .addSelect(`SUM(CASE WHEN invoice.dueDate < :today THEN 1 ELSE 0 END)`, 'overdueCount')
      .where('invoice.companyId = :companyId', { companyId })
      .andWhere("invoice.type = 'ACHAT'")
      .andWhere("invoice.status IN ('VALIDE', 'PARTIEL')")
      .andWhere('invoice.totalTTC > invoice.amountPaid')
      .groupBy('invoice.tierId')
      .setParameter('today', today)
      .getRawMany<{ tierId: string; outstanding: string; overdue: string; overdueCount: string }>();

    const byTierId = new Map(rows.map((r) => [r.tierId, r]));

    const suppliers: SupplierAlert[] = suppliersList.map((supplier) => {
      const row = byTierId.get(supplier.id);
      const outstandingTotal = Number(row?.outstanding) || 0;
      const overdueTotal = Number(row?.overdue) || 0;
      const overdueInvoiceCount = Number(row?.overdueCount) || 0;
      return {
        supplierId: supplier.id,
        supplierName: supplier.name,
        outstandingTotal,
        overdueTotal,
        overdueInvoiceCount,
        riskLevel: this.computeRiskLevel(overdueTotal, overdueInvoiceCount, 0),
      };
    });

    const atRisk = suppliers.filter((s) => s.riskLevel !== 'AUCUN').sort((a, b) => b.overdueTotal - a.overdueTotal);
    let analyseIA: string | null = null;
    if (atRisk.length > 0) {
      try {
        analyseIA = await this.aiProvider.generateText(
          'Voici les dettes fournisseurs en retard de paiement (données réelles, factures échues non soldées) :\n' +
            atRisk.map((s) => `- [${s.riskLevel}] ${s.supplierName} : ${s.overdueTotal.toLocaleString('fr-FR')} XAF en retard (${s.overdueInvoiceCount} facture(s))`).join('\n') +
            '\n\nDonne 2-3 phrases de recommandation concise en français sur les priorités de paiement, sans inventer de chiffre absent ci-dessus.',
        );
      } catch {
        analyseIA = null;
      }
    }

    return { suppliers, analyseIA };
  }

  /** Explique les variations du Compte de Résultat vs l'exercice précédent réel (pas de comparaison inventée). */
  async explainFinancialVariation(companyId: string): Promise<{
    currentYear: number;
    previousYear: number;
    current: CompteDeResultat;
    previous: CompteDeResultat;
    analyseIA: string | null;
  }> {
    const year = new Date().getFullYear();
    const [current, previous] = await Promise.all([
      this.reportsService.getCompteDeResultatForYear(companyId, year),
      this.reportsService.getCompteDeResultatForYear(companyId, year - 1),
    ]);

    let analyseIA: string | null = null;
    try {
      analyseIA = await this.aiProvider.generateText(
        `Voici le Compte de Résultat réel de l'exercice ${year} comparé à ${year - 1} (données réelles, JSON) :\n` +
          JSON.stringify({ [year]: current, [year - 1]: previous }) +
          "\n\nExplique en 3-4 phrases en français les principales variations (chiffre d'affaires, marge, résultat net). " +
          "Base-toi STRICTEMENT sur ces chiffres. Si l'un des deux exercices est vide (aucune activité), dis-le clairement plutôt que de commenter une variation qui n'a pas de sens.",
      );
    } catch {
      analyseIA = null;
    }

    return { currentYear: year, previousYear: year - 1, current, previous, analyseIA };
  }

  /** Suggère un montant de budget pour un compte, basé sur le réel de l'exercice précédent (aucune invention). */
  async suggestBudgetAmount(companyId: string, accountCode: string, exercice: number): Promise<{ accountCode: string; basedOnYear: number; suggestedAmount: number }> {
    const basedOnYear = exercice - 1;
    const balances = await this.accountingService.getAccountBalancesForYear(companyId, basedOnYear);
    const balance = balances.find((b) => b.code === accountCode);
    const suggestedAmount = balance ? (balance.type === 'credit' ? balance.soldeCrediteur : balance.soldeDebiteur) : 0;
    return { accountCode, basedOnYear, suggestedAmount };
  }
}
