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

export interface CompanyProfileSuggestion {
  legalForm: string;
  taxRegime: string;
  vatRate: number;
  departments: string[];
  costCenters: string[];
  recommendedModuleIds: string[];
  rationale: string;
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

const COMPANY_PROFILE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    legalForm: { type: 'STRING', description: 'Une valeur exacte parmi la liste des formes juridiques fournie' },
    taxRegime: { type: 'STRING', description: 'Une valeur exacte parmi la liste des régimes fiscaux fournie' },
    vatRate: { type: 'NUMBER', description: 'Taux de TVA typique du pays/secteur, en %' },
    departments: { type: 'ARRAY', items: { type: 'STRING' }, description: '4 à 6 départements typiques pour ce secteur' },
    costCenters: { type: 'ARRAY', items: { type: 'STRING' }, description: '2 à 4 centres de coûts typiques pour ce secteur' },
    recommendedModuleIds: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Identifiants exacts parmi la liste de modules fournie' },
    rationale: { type: 'STRING', description: 'Justification en 1-2 phrases' },
  },
  required: ['legalForm', 'taxRegime', 'vatRate', 'departments', 'costCenters', 'recommendedModuleIds', 'rationale'],
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

const ENTRY_SUGGESTION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    journalType: { type: 'STRING', description: 'Une valeur parmi VENTES, ACHATS, BANQUE, CAISSE, OD, SALAIRES' },
    wording: { type: 'STRING', description: 'Libellé de l\'écriture' },
    lines: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          accountCode: { type: 'STRING', description: 'Numéro de compte SYSCOHADA (ex: 601100, 445200, 401100)' },
          accountLabel: { type: 'STRING', description: 'Nom de compte' },
          debit: { type: 'NUMBER' },
          credit: { type: 'NUMBER' },
        },
        required: ['accountCode', 'debit', 'credit'],
      },
    },
    explanation: { type: 'STRING', description: 'Explication des règles comptables appliquées selon le SYSCOHADA' },
  },
  required: ['journalType', 'wording', 'lines', 'explanation'],
};


const BUDGET_VARIANCE_THRESHOLD_PERCENT = 20;

// Le LLM reproduit parfois un tiret (– U+2013 vs — U+2014) ou des espaces différents
// de ceux fournis dans la liste d'options : on normalise avant de comparer, pour ne pas
// silencieusement rejeter une suggestion par ailleurs valide à cause d'un caractère invisible.
function normalizeForMatch(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[‐-―-]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function matchNormalized(value: string, options: string[]): string | null {
  const normalizedValue = normalizeForMatch(value);
  return options.find((option) => normalizeForMatch(option) === normalizedValue) ?? null;
}

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

    const result = await this.aiProvider.generateJson<AccountSuggestion>(prompt, ACCOUNT_SUGGESTION_SCHEMA);
    if (!result.label && result.accountCode) {
      const acc = accounts.find((a) => a.code === result.accountCode);
      if (acc) result.label = acc.label;
    }
    if (!result.label) {
      result.label = `Compte ${result.accountCode}`;
    }
    return result;
  }

  async suggestEntryPattern(companyId: string, wording: string, amount?: number): Promise<any> {
    const accounts = await this.accountRepo.find({ order: { code: 'ASC' } });
    const planText = accounts.map((a) => `${a.code} - ${a.label}`).join('\n');

    const prompt =
      `En tant qu'expert comptable SYSCOHADA (OHADA), analyse la demande suivante :\n` +
      `Libellé/Description : "${wording}"\n` +
      `Montant global indicatif : ${amount !== undefined ? amount + ' FCFA' : 'non spécifié'}\n\n` +
      `Plan comptable SYSCOHADA de l'entreprise :\n${planText}\n\n` +
      `Génère le modèle d'écriture comptable équilibré le plus approprié en double partie (Total Débit = Total Crédit) en utilisant les comptes exacts du plan comptable.\n` +
      `S'il y a de la TVA (généralement 19.25% ou 18% selon la description), décompose le montant HT, la TVA, et le montant TTC.\n` +
      `Réponds uniquement sous forme d'un objet JSON valide conforme au schéma demandé.`;

    const result = await this.aiProvider.generateJson<any>(prompt, ENTRY_SUGGESTION_SCHEMA);
    
    // Map account labels if missing
    if (result.lines && Array.isArray(result.lines)) {
      result.lines = result.lines.map((line: any) => {
        const acc = accounts.find((a) => a.code === line.accountCode);
        return {
          accountCode: line.accountCode,
          accountLabel: acc?.label || line.accountLabel || `Compte ${line.accountCode}`,
          debit: Number(line.debit) || 0,
          credit: Number(line.credit) || 0,
        };
      });
    }
    return result;
  }

  /**
   * Propose un profil d'entreprise TYPIQUE (forme juridique, régime fiscal, départements,
   * modules) à partir du nom et du secteur d'activité saisis pendant la création d'entreprise.
   * Ce sont des suggestions éditables, jamais un remplissage silencieux — l'utilisateur les
   * valide avant qu'elles soient enregistrées.
   */
  async suggestCompanyProfile(
    companyName: string,
    sector: string,
    legalFormOptions: string[],
    taxRegimeOptions: string[],
    moduleOptions: { id: string; label: string }[],
  ): Promise<CompanyProfileSuggestion> {
    const prompt =
      `Pour une entreprise nommée "${companyName}", dans le secteur d'activité "${sector}", en zone OHADA (Afrique francophone), ` +
      'propose un profil TYPIQUE pour cette activité. Ce sont des suggestions indicatives à ajuster, pas des faits réels de cette entreprise.\n\n' +
      `Formes juridiques possibles (choisis-en UNE exactement telle qu'écrite) :\n${legalFormOptions.join('\n')}\n\n` +
      `Régimes fiscaux possibles (choisis-en UN exactement tel qu'écrit) :\n${taxRegimeOptions.join('\n')}\n\n` +
      `Modules disponibles (choisis les identifiants les plus pertinents pour ce secteur parmi) :\n${moduleOptions.map((m) => `${m.id} - ${m.label}`).join('\n')}\n\n` +
      'Réponds uniquement avec les champs demandés par le schéma.';

    const suggestion = await this.aiProvider.generateJson<CompanyProfileSuggestion>(prompt, COMPANY_PROFILE_SCHEMA);

    const validModuleIds = new Set(moduleOptions.map((m) => m.id));
    return {
      ...suggestion,
      // Le modèle rend parfois un tiret légèrement différent (– au lieu de —) ou des espaces
      // différents dans les libellés fournis : on remappe vers la valeur EXACTE de la liste
      // fournie via une comparaison normalisée, plutôt que de silencieusement ignorer une
      // suggestion valide à cause d'un caractère invisible différent.
      legalForm: matchNormalized(suggestion.legalForm, legalFormOptions) ?? suggestion.legalForm,
      taxRegime: matchNormalized(suggestion.taxRegime, taxRegimeOptions) ?? suggestion.taxRegime,
      recommendedModuleIds: suggestion.recommendedModuleIds.filter((id) => validModuleIds.has(id)),
    };
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
    
    let personaPrompt = 'Tu es un assistant comptable pour une entreprise utilisant le référentiel SYSCOHADA (OHADA).';
    
    if (currentScreen === 'copilote_comptable') {
      personaPrompt = 
        "Tu es un expert comptable spécialisé dans le référentiel SYSCOHADA (OHADA). Ton rôle est d'assister l'utilisateur dans l'enregistrement de ses écritures, la codification comptable (classes 1 à 8), et le respect des principes comptables (coût historique, prudence, etc.). Explique clairement les schémas de comptabilisation.";
    } else if (currentScreen === 'copilote_controleur') {
      personaPrompt = 
        "Tu es un contrôleur de gestion et auditeur de comptes de l'espace OHADA. Ton rôle est d'auditer la balance générale, de pointer les anomalies et d'évaluer le contrôle interne de l'entreprise. Concentre-toi sur la détection des déséquilibres, des omissions et des écritures atypiques.";
    } else if (currentScreen === 'copilote_analyste') {
      personaPrompt = 
        "Tu es un analyste financier chevronné. Ton rôle est d'expliquer les soldes intermédiaires de gestion (SIG), d'analyser la structure du BFR (Besoin en Fonds de Roulement) et du FDR (Fonds de Roulement), et de commenter les ratios de rentabilité (EBITDA, ROE, ROA) et d'endettement.";
    } else if (currentScreen === 'copilote_fiscaliste') {
      personaPrompt = 
        "Tu es un conseiller fiscal spécialisé dans l'espace OHADA (régime d'imposition, TVA standard à 18%, acomptes IS, etc.). Ton rôle est d'orienter l'utilisateur sur la conformité fiscale, les dates limites de déclaration, et les mécanismes de déductibilité.";
    } else if (currentScreen === 'copilote_conseiller') {
      personaPrompt = 
        "Tu es le conseiller stratégique du dirigeant (CEO). Ton rôle est de synthétiser les données financières complexes en conseils de gestion simples, directs et orientés action (gestion du cash flow, urgence de recouvrement, réduction des charges d'exploitation, opportunités d'investissement).";
    }

    const screenHint = currentScreen && !currentScreen.startsWith('copilote_')
      ? `\n\nL'utilisateur consulte actuellement l'écran : "${currentScreen}". Privilégie une réponse pertinente pour ce contexte si la question est ambiguë.` 
      : '';

    const systemInstruction =
      `${personaPrompt} ` +
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
