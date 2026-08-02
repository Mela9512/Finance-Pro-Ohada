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

  // ─── Paramètres de paie ───────────────────────────────────────────────────
  payrollSmig?: number;
  payrollTaxBrackets?: PayrollTaxBracket[];
  payrollEmployeeContributions?: PayrollContribution[];
  payrollEmployerContributions?: PayrollContribution[];

  // ─── Statut ───────────────────────────────────────────────────────────────
  isOnboarded?: boolean;
}

export interface PayrollTaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

export interface PayrollContribution {
  label: string;
  rate: number;
  ceiling?: number;
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

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogPage {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export type ImmobilisationStatus = 'EN_SERVICE' | 'CEDE' | 'REFORME';

export interface AmortissementRow {
  year: number;
  dotation: number;
  cumulAmortissements: number;
  valeurNetteComptable: number;
}

export interface Immobilisation {
  id: string;
  companyId: string;
  code: string;
  label: string;
  accountCode: string;
  dateAcquisition: string;
  dateMiseEnService: string;
  valeurAcquisitionHT: number;
  valeurResiduelle: number;
  dureeAmortissementAns: number;
  status: ImmobilisationStatus;
  dateCession?: string;
  valeurCession?: number;
  exercicesDotationGeneres?: number[];
  createdBy: string;
  createdAt: string;
  schedule: AmortissementRow[];
}

export interface CreateImmobilisationDto {
  label: string;
  accountCode: string;
  dateAcquisition: string;
  dateMiseEnService: string;
  valeurAcquisitionHT: number;
  valeurResiduelle?: number;
  dureeAmortissementAns: number;
}

export interface ImmobilisationSynthese {
  year: number;
  valeurBrute: number;
  dotationExercice: number;
  cumulAmortissements: number;
  valeurNetteComptable: number;
}

export type StockMouvementType = 'ENTREE' | 'SORTIE';

export interface StockMouvement {
  id: string;
  companyId: string;
  articleId: string;
  date: string;
  type: StockMouvementType;
  quantite: number;
  coutUnitaire: number;
  valeurTotale: number;
  reference?: string;
  createdBy: string;
  createdAt: string;
}

export interface StockState {
  quantite: number;
  valeur: number;
  cump: number;
}

export interface StockArticle {
  id: string;
  companyId: string;
  code: string;
  label: string;
  unite: string;
  accountCodeStock: string;
  seuilAlerte?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  etat: StockState;
}

export interface StockArticleDetail extends StockArticle {
  mouvements: StockMouvement[];
}

export interface CreateArticleDto {
  label: string;
  unite: string;
  accountCodeStock: string;
  seuilAlerte?: number;
}

export interface CreateMouvementDto {
  articleId: string;
  date: string;
  type: StockMouvementType;
  quantite: number;
  coutUnitaire?: number;
  reference?: string;
}

export interface StockSynthese {
  valeurTotale: number;
  nbArticles: number;
  parCompte: { accountCode: string; valeur: number }[];
}

export type CommandeType = 'VENTE' | 'ACHAT';
export type CommandeStatus = 'BROUILLON' | 'CONFIRMEE' | 'LIVREE' | 'FACTUREE' | 'ANNULEE';
export type BonLivraisonStatus = 'CONFIRME' | 'FACTURE';

export interface CommandeItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tvaRate: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  accountCode: string;
}

export interface Commande {
  id: string;
  companyId: string;
  numero: string;
  type: CommandeType;
  tierId: string;
  tierName: string;
  date: string;
  items: CommandeItem[];
  subtotalHT: number;
  totalTVA: number;
  totalTTC: number;
  status: CommandeStatus;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface BonLivraison {
  id: string;
  companyId: string;
  commandeId: string;
  numero: string;
  type: CommandeType;
  tierId: string;
  tierName: string;
  date: string;
  items: CommandeItem[];
  status: BonLivraisonStatus;
  invoiceId?: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateCommandeDto {
  type: CommandeType;
  tierId: string;
  tierName: string;
  date: string;
  items: Omit<CommandeItem, 'id'>[];
  subtotalHT: number;
  totalTVA: number;
  totalTTC: number;
  notes?: string;
}

export type EmployeeStatus = 'ACTIF' | 'INACTIF';

export interface Employee {
  id: string;
  companyId: string;
  matricule: string;
  nom: string;
  poste: string;
  dateEmbauche: string;
  salaireBase: number;
  numeroCNSS?: string;
  statut: EmployeeStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeDto {
  nom: string;
  poste: string;
  dateEmbauche: string;
  salaireBase: number;
  numeroCNSS?: string;
}

export type BulletinPaieStatus = 'BROUILLON' | 'VALIDE';

export interface ContributionLine {
  label: string;
  montant: number;
}

export interface BulletinPaie {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  periodYear: number;
  periodMonth: number;
  salaireBase: number;
  primesImposables: number;
  primesNonImposables: number;
  brut: number;
  detailCotisationsSalariales: ContributionLine[];
  totalCotisationsSalariales: number;
  detailCotisationsPatronales: ContributionLine[];
  totalCotisationsPatronales: number;
  salaireImposable: number;
  irpp: number;
  net: number;
  status: BulletinPaieStatus;
  journalEntryId?: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateBulletinDto {
  employeeId: string;
  periodYear: number;
  periodMonth: number;
  primesImposables?: number;
  primesNonImposables?: number;
}

export interface PayrollTemplate {
  countryLabel: string;
  smig: number;
  taxBrackets: PayrollTaxBracket[];
  employeeContributions: PayrollContribution[];
  employerContributions: PayrollContribution[];
}

/**
 * Modèles INDICATIFS pour pré-remplir les paramètres de paie — approximations basées
 * sur les structures publiques CNSS/CNPS et barèmes IRPP/IUTS généralement documentées
 * en zone CEMAC. À VÉRIFIER et ajuster avec un expert-comptable local avant toute
 * première paie réelle : les taux exacts évoluent et varient encore par catégorie de
 * risque professionnel, convention collective, etc.
 */
export const PAYROLL_TEMPLATES: Record<string, PayrollTemplate> = {
  CONGO: {
    countryLabel: 'Congo-Brazzaville (indicatif)',
    smig: 90_000,
    taxBrackets: [
      { min: 0, max: 464_000, rate: 1 },
      { min: 464_000, max: 1_000_000, rate: 10 },
      { min: 1_000_000, max: 3_000_000, rate: 25 },
      { min: 3_000_000, max: null, rate: 40 },
    ],
    employeeContributions: [{ label: 'CNSS — assurance vieillesse (salarié)', rate: 4, ceiling: 1_200_000 }],
    employerContributions: [
      { label: 'CNSS — assurance vieillesse (patronal)', rate: 8, ceiling: 1_200_000 },
      { label: 'CNSS — allocations familiales', rate: 10.03, ceiling: 600_000 },
      { label: 'CNSS — accidents du travail', rate: 2.25, ceiling: 600_000 },
    ],
  },
  CAMEROUN: {
    countryLabel: 'Cameroun (indicatif)',
    smig: 41_875,
    taxBrackets: [
      { min: 0, max: 2_000_000, rate: 10 },
      { min: 2_000_000, max: 3_000_000, rate: 15 },
      { min: 3_000_000, max: 5_000_000, rate: 25 },
      { min: 5_000_000, max: null, rate: 35 },
    ],
    employeeContributions: [{ label: 'CNPS — assurance pension (salarié)', rate: 4.2, ceiling: 750_000 }],
    employerContributions: [
      { label: 'CNPS — assurance pension (patronal)', rate: 4.2, ceiling: 750_000 },
      { label: 'CNPS — allocations familiales', rate: 7, ceiling: 750_000 },
      { label: 'CNPS — accidents du travail', rate: 1.75, ceiling: 750_000 },
    ],
  },
};

export interface DashboardAlert {
  type: 'TVA' | 'IS' | 'CNPS' | 'SALAIRES' | 'DECOUVERT' | 'STOCK' | 'CREDIT' | 'DSF' | 'FACTURE_ECHUE' | 'PATENTE';
  label: string;
  detail: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  daysLeft?: number;
  dueDate?: string;
  amount?: number;
}

export interface DashboardForecast {
  horizon: '30j' | '60j' | '90j' | '6m' | '12m';
  label: string;
  tresoreriePrevisionnelle: number;
  caPrevisionnelCumulé: number;
  probability: number; // 0–100
}

export interface ScoreDetaille {
  liquidite: number;   // /20
  rentabilite: number; // /20
  solvabilite: number; // /20
  croissance: number; // /20
  risque: number;     // /20
  total: number;      // /100
}

export interface DiagnosticIA {
  rentabiliteStatus: 'Faible' | 'Moyenne' | 'Forte';
  liquiditeStatus: 'Critique' | 'Satisfaisante' | 'Excellente';
  endettementStatus: 'Bon' | 'Modéré' | 'Élevé';
  tresorerieStatus: 'À surveiller' | 'Saine' | 'Solide';
  risqueGlobal: 'Faible' | 'Moyen' | 'Élevé';
  recommandations: string[];
}

export interface FluxOIF {
  fluxExploitation: number;
  fluxInvestissement: number;
  fluxFinancement: number;
  variationNette: number;
}

export interface BalanceAgee {
  moins30j: number;
  entre31et60j: number;
  entre61et90j: number;
  plus90j: number;
  total: number;
}

export interface ComparisonN1 {
  currentYear: number;
  previousYear: number;
  variationPct: number;
}

export interface CashDisponibleItem {
  nom: string;
  type: 'BANQUE' | 'CAISSE' | 'MOBILE_MONEY';
  solde: number;
  sigle: string;
}

export interface ConformiteSyscohada {
  score: number; // 0-100
  journauxEquilibres: boolean;
  tvaCoherente: boolean;
  balanceEquilibree: boolean;
  bilanEquilibre: boolean;
}

export interface HeatmapRisques {
  finance: 'LOW' | 'MEDIUM' | 'HIGH';
  fiscal: 'LOW' | 'MEDIUM' | 'HIGH';
  tresorerie: 'LOW' | 'MEDIUM' | 'HIGH';
  clients: 'LOW' | 'MEDIUM' | 'HIGH';
  stocks: 'LOW' | 'MEDIUM' | 'HIGH';
  conformite: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface MeteoIA {
  condition: 'ENSOLEILLE' | 'NUAGEUX' | 'ORAGEUX';
  description: string;
  probaTensionTréso: number;
  croissancePrevue: number;
  confianceIA: number;
}

export interface PerformanceBudget {
  caPct: number;       // % de l'objectif atteint
  chargesPct: number;  // % du budget consommé
  resultatPct: number; // % du résultat visé
}

export interface AFaireAujourdhui {
  facturesAEnvoyer: number;
  relancesClients: number;
  paiementsFournisseurs: number;
  alertesFiscales: number;
}

export interface DashboardMetrics {
  // ─── Santé Globale ─────────────────────────────────────────
  santeGlobalePct: number;
  santeGlobaleStatus: string;

  // ─── KPI Principaux ──────────────────────────────────────
  chiffreAffairesMois: number;
  chiffreAffairesVariation: number;
  tresorerieNetteTotal: number;
  creancesClientsTotal: number;
  dettesFournisseursTotal: number;

  // Résultats SYSCOHADA
  resultatNet: number;
  resultatExploitation: number;
  resultatFinancier: number;
  resultatHAO: number;
  resultatAvantImpot: number;
  resultatExceptionnel: number;
  margeBrute: number;
  margeNette: number; // %

  // Ratios financiers
  bfr: number;
  fdr: number;
  excédentBrutExploitation: number;
  ratioLiquidite: number;          // actif circulant / passif circulant
  ratioAutonomieFinanciere: number; // capitaux propres / total passif
  roe: number;                     // résultat net / capitaux propres (%)
  roa: number;                     // résultat net / total actif (%)
  endettement: number;             // dettes financières / capitaux propres

  // ─── Bilan OHADA ─────────────────────────────────────────
  capitauxPropres: number;
  totalActif: number;
  totalPassif: number;
  actifImmobilise: number;
  actifCirculant: number;
  passifCirculant: number;
  dettesFinancieres: number;
  disponibilites: number;
  valeurAjoutee: number;

  // ─── Score & Diagnostic IA ───────────────────────────────
  scoreFinancier: number; // 0–100
  scoreDetaille: ScoreDetaille;
  diagnosticIA: DiagnosticIA;
  meteoIA: MeteoIA;

  // ─── Cash & Conformité & Risques ──────────────────────────
  cashDisponible: CashDisponibleItem[];
  conformiteSyscohada: ConformiteSyscohada;
  heatmapRisques: HeatmapRisques;
  performanceBudget: PerformanceBudget;
  aFaireAujourdhui: AFaireAujourdhui;

  // ─── Flux & Balance ──────────────────────────────────────
  fluxOIF: FluxOIF;
  balanceAgee: BalanceAgee;

  // ─── Comparatifs N vs N-1 ────────────────────────────────
  comparatifN1: {
    ca: ComparisonN1;
    tresorerie: ComparisonN1;
    resultatNet: ComparisonN1;
    bfr: ComparisonN1;
  };

  // ─── Activité opérationnelle ─────────────────────────────
  facturesEmises: number;
  facturesEnAttente: number;
  facturesEchues: number;
  clientsActifs: number;
  fournisseursActifs: number;
  paiementsReçusAujourdhui: number;
  paiementsEffectuesAujourdhui: number;

  // ─── Graphiques ──────────────────────────────────────────
  fluxTrésorerieGraph: { month: string; encaissements: number; decaissements: number }[];
  caParMoisGraph: { month: string; ca: number }[];          // 12 mois
  chargesParMoisGraph: { month: string; charges: number }[]; // 6 mois
  resultatMensuelGraph: { month: string; resultat: number }[]; // 6 mois
  bfrParMoisGraph: { month: string; bfr: number }[];         // 6 mois
  chargesRepartitionGraph: { category: string; amount: number; percentage: number }[];
  produitsRepartitionGraph: { category: string; amount: number; percentage: number }[];

  // ─── Top performance ─────────────────────────────────────
  topClients: { nom: string; montant: number }[];
  topFournisseurs: { nom: string; montant: number }[];

  // ─── Alertes ─────────────────────────────────────────────
  alertes: DashboardAlert[];

  // ─── Prévisions IA ───────────────────────────────────────
  previsions: DashboardForecast[];

  // ─── Activités récentes ───────────────────────────────────
  ecrituresRecent: JournalEntry[];
  facturessRecent: { id: string; numero: string; client: string; montant: number; statut: string; date: string }[];
}





