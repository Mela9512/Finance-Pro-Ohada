export type UserRole = 'ADMIN' | 'COMPTABLE' | 'GESTIONNAIRE' | 'LECTEUR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  createdAt: string;
}

export interface Company {
  id: string;

  // ─── Informations générales ────────────────────────────────────────────────
  name: string;
  logo?: string;
  language?: string;
  currency: string; // XAF, XOF, USD, EUR
  country: string;

  // ─── Identification légale ─────────────────────────────────────────────────
  legalName?: string;
  legalForm?: string;
  rccm?: string;
  nif?: string;
  capital?: number;
  sector?: string;
  incorporationDate?: string;

  // ─── Coordonnées ──────────────────────────────────────────────────────────
  address: string;
  city: string;
  region?: string;
  phone?: string;
  email?: string;
  website?: string;

  // ─── Paramètres comptables ────────────────────────────────────────────────
  fiscalYearStart: string;
  fiscalYearEnd: string;
  fiscalYear?: number;
  accountLength?: number;
  decimals?: number;
  isExerciceClosed?: boolean;

  // ─── Fiscalité ────────────────────────────────────────────────────────────
  taxRegime?: string;
  taxCenter?: string;
  taxNumber?: string;
  vatEnabled?: boolean;
  vatRate?: number;
  withholdingTax?: boolean;
  corporateTax?: boolean;

  // ─── Banque & Trésorerie ──────────────────────────────────────────────────
  bankName?: string;
  bankAccount?: string;
  bankCode?: string;
  cashName?: string;
  paymentMethods?: string[];
  bankCurrency?: string;

  // ─── Organisation ─────────────────────────────────────────────────────────
  departments?: string[];
  directions?: string[];
  branches?: string[];
  costCenters?: string[];
  profitCenters?: string[];
  projects?: string[];

  // ─── Modules activés ──────────────────────────────────────────────────────
  enabledModules?: string[];

  // ─── Statut ───────────────────────────────────────────────────────────────
  isOnboarded?: boolean;
}

export type JournalType = 'ACHATS' | 'VENTES' | 'BANQUE' | 'CAISSE' | 'OD';

export interface JournalLine {
  id: string;
  accountCode: string;
  accountLabel: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  journalType: JournalType;
  wording: string; // Libellé de l'écriture
  pieceNumber: string; // Numéro de pièce justificative
  lines: JournalLine[];
  isValidated: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  code: string; // Ex: 411001
  name: string;
  nif?: string;
  phone: string;
  email: string;
  address: string;
  balance: number; // Solde courant (débiteur/créditeur)
  creditLimit: number;
}

export interface Supplier {
  id: string;
  code: string; // Ex: 401001
  name: string;
  nif?: string;
  phone: string;
  email: string;
  address: string;
  balance: number; // Solde courant (dette envers le fournisseur)
}

export type InvoiceStatus = 'BROUILLON' | 'VALIDE' | 'PAYE' | 'ANNULE' | 'PARTIEL';
export type InvoiceType = 'VENTE' | 'ACHAT' | 'AVOIR';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tvaRate: number; // Ex: 18%
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  accountCode: string; // Compte de charge ou produit SYSCOHADA
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  tierId: string;
  tierName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotalHT: number;
  totalTVA: number;
  airRate: number; // Retenue à la source AIR (ex: 2%, 5%)
  totalAIR: number;
  totalTTC: number;
  amountPaid: number;
  status: InvoiceStatus;
  notes?: string;
}

export interface TreasuryAccount {
  id: string;
  code: string; // Ex: 521001 ou 541001
  name: string; // Ex: BGFI Bank, Ecobank, Caisse Principale, Orange Money
  type: 'BANQUE' | 'CAISSE' | 'MOBILE_MONEY';
  accountNumber?: string;
  rib?: string;
  currency: string;
  balance: number;
}

export interface TreasuryTransaction {
  id: string;
  treasuryAccountId: string;
  treasuryAccountName: string;
  date: string;
  type: 'ENCAISSEMENT' | 'DECAISSEMENT' | 'VIREMENT_INTERNE';
  category: string;
  amount: number;
  reference: string;
  tierName?: string;
  status: 'RAPPROCHE' | 'EN_ATTENTE';
  description: string;
}

export interface BilanItem {
  codeRef: string;
  label: string;
  gross: number;
  depreciation: number;
  net: number;
  netPrevious: number;
}

export interface FinancialReportBilan {
  actif: {
    immobilise: BilanItem[];
    circulant: BilanItem[];
    tresorerie: BilanItem[];
    totalActif: number;
  };
  passif: {
    capitauxPropres: BilanItem[];
    dettesFinancieres: BilanItem[];
    passifCirculant: BilanItem[];
    tresoreriePassif: BilanItem[];
    totalPassif: number;
  };
}

export interface CompteDeResultat {
  chiffreAffaires: number;
  achatsMarchandises: number;
  margeBrute: number;
  consommationsIntermediaires: number;
  valeurAjoutee: number;
  chargesPersonnel: number;
  ebe: number; // Excédent Brut d'Exploitation
  dotationsAmortissements: number;
  resultatExploitation: number;
  chargesFinancieres: number;
  produitsFinanciers: number;
  resultatFinancier: number;
  resultatHAO: number;
  impotSurBenefices: number;
  resultatNet: number;
}

export interface Budget {
  id: string;
  accountCode: string;
  exercice: number;
  period: number | null;
  amountBudgeted: number;
  createdBy: string;
  createdAt: string;
}

export interface BudgetComparisonRow {
  accountCode: string;
  label: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number | null;
}

export interface FiscalDeclaration {
  year: number;
  month: number;
  periodLabel: string;
  tvaCollectee: number;
  tvaRecuperable: number;
  tvaAPayer: number;
  airSurVentes: number;
  airSurAchats: number;
  airTotal: number;
}

export interface ImportBankStatementResult {
  imported: number;
  matched: number;
  created: number;
}

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

export interface AnomalyReport {
  anomalies: Anomaly[];
  analyseIA: string | null;
}

export interface CashflowHorizon {
  entrees: number;
  sorties: number;
  soldeProjete: number;
}

export interface CashflowForecast {
  soldeActuel: number;
  horizon30: CashflowHorizon;
  horizon60: CashflowHorizon;
  horizon90: CashflowHorizon;
  analyseIA: string | null;
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

export interface ClientRiskReport {
  clients: ClientRisk[];
  analyseIA: string | null;
}

export interface SupplierAlert {
  supplierId: string;
  supplierName: string;
  outstandingTotal: number;
  overdueTotal: number;
  overdueInvoiceCount: number;
  riskLevel: RiskLevel;
}

export interface SupplierAlertReport {
  suppliers: SupplierAlert[];
  analyseIA: string | null;
}

export interface FinancialVariationExplanation {
  currentYear: number;
  previousYear: number;
  current: CompteDeResultat;
  previous: CompteDeResultat;
  analyseIA: string | null;
}

export interface YearProjection {
  year: number;
  revenue: number;
  variableCosts: number;
  fixedCosts: number;
  netCashFlow: number;
}

export interface BusinessPlan {
  id: string;
  companyId: string;
  createdBy: string;
  title: string;
  projectDescription: string;
  investmentAmount: number;
  projectionYears: number;
  year1Revenue: number;
  revenueGrowthRatePercent: number;
  variableCostPercent: number;
  fixedCostsAnnual: number;
  discountRatePercent: number;
  projections: YearProjection[];
  van: number;
  tri: number | null;
  seuilRentabilite: number;
  creditScore: number;
  narrative: string;
  createdAt: string;
}

export interface CreateBusinessPlanDto {
  title: string;
  projectDescription: string;
  investmentAmount: number;
  projectionYears: number;
  year1Revenue: number;
  revenueGrowthRatePercent: number;
  variableCostPercent: number;
  fixedCostsAnnual: number;
  discountRatePercent: number;
}

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

export interface CompanyProfileSuggestion {
  legalForm: string;
  taxRegime: string;
  vatRate: number;
  departments: string[];
  costCenters: string[];
  recommendedModuleIds: string[];
  rationale: string;
}

export interface DashboardMetrics {
  chiffreAffairesMois: number;
  chiffreAffairesVariation: number;
  tresorerieNetteTotal: number;
  creancesClientsTotal: number;
  dettesFournisseursTotal: number;
  bfr: number; // Besoin en Fonds de Roulement
  fdr: number; // Fonds de Roulement
  excédentBrutExploitation: number;
  fluxTrésorerieGraph: { month: string; encaissements: number; decaissements: number }[];
  ecrituresRecent: JournalEntry[];
}


