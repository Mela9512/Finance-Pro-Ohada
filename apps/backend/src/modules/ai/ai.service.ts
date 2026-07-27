import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AccountEntity } from '../../entities/account.entity';
import { JournalLineEntity } from '../../entities/journal-line.entity';
import { InvoiceEntity } from '../../entities/invoice.entity';
import { CustomerEntity } from '../../entities/customer.entity';
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
  async chat(companyId: string, question: string): Promise<string> {
    const [bilan, compteDeResultat, balanceGenerale, budgetComparison] = await Promise.all([
      this.reportsService.getBilan(companyId),
      this.reportsService.getCompteDeResultat(companyId),
      this.accountingService.getBalanceGenerale(companyId),
      this.budgetService.getComparison(companyId, new Date().getFullYear()),
    ]);

    const context = JSON.stringify({ bilan, compteDeResultat, balanceGenerale, budgetVsReel: budgetComparison });

    const systemInstruction =
      'Tu es un assistant comptable pour une entreprise utilisant le référentiel SYSCOHADA (OHADA). ' +
      "Réponds UNIQUEMENT à partir des données JSON fournies ci-dessous, qui reflètent l'état réel et à jour de la comptabilité de l'entreprise. " +
      "N'invente JAMAIS un chiffre absent de ces données. Si la question porte sur une donnée absente, dis-le clairement plutôt que d'estimer. " +
      `Réponds en français, de façon concise.\n\nDonnées réelles de l'entreprise :\n${context}`;

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
}
