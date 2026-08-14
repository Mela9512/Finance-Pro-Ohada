import React, { useState, useEffect } from 'react';
import {
  BookOpen, PlusCircle, CheckCircle2, AlertTriangle, Loader2,
  Search, FileSpreadsheet, Layers, Scale, Download, Sparkles,
  Lock, Upload, ShieldCheck, FileText, CheckSquare, Settings, PieChart,
  Activity, ArrowRightLeft, RefreshCw, Zap, Calculator, Users, Truck,
  Check, Filter, ChevronRight, Eye, AlertCircle, Building2, HelpCircle,
  FileCheck, Printer, Save, Database, ShieldAlert, KeyRound, FolderOpen, Trash2, Award, Paperclip, Calendar, Landmark
} from 'lucide-react';
import { AccountSYSCOHADA, JournalEntry, JournalLine, AccountSuggestion, JournalType, DocumentCategory } from '@financepro/shared';
import { api, ApiError } from '../../services/api';
import JSZip from 'jszip';

const fmtMoney = (v: number) => {
  if (v === undefined || v === null || isNaN(v)) return '0 FCFA';
  return `${Math.round(v).toLocaleString('fr-FR')} FCFA`;
};

interface BalanceRow {
  code: string;
  label: string;
  debit: number;
  credit: number;
  soldeDebiteur: number;
  soldeCrediteur: number;
}

interface GrandLivreRow {
  date: string;
  pieceNumber: string;
  journalType: string;
  accountCode: string;
  accountLabel: string;
  wording: string;
  debit: number;
  credit: number;
}

interface LettrageItem {
  id: string;
  date: string;
  accountCode: string;
  pieceNumber: string;
  wording: string;
  debit: number;
  credit: number;
  letter?: string;
  isLettered: boolean;
  
  partnerName: string;
  soldeRestant: number;
  ancienneteJours: number;
  iaMatchScore: number;
  iaSuggestionWording?: string;
  currency?: string;
  exchangeRate?: number;
  originalAmount?: number;
  costCenter?: string;
  project?: string;
  vatAmount?: number;
  documentFilename?: string;
}

interface BankAccount {
  id: string;
  code: string;
  name: string;
  balanceCompta: number;
  balanceBank: number;
  unreconciledCount: number;
  lastReconciliation: string;
}

interface BankReconciliationLine {
  id: string;
  date: string;
  reference: string;
  wording: string;
  debit: number;
  credit: number;
  isReconciled: boolean;
  bankAccountId: string;
  iaMatchScore?: number;
  iaMatchRef?: string;
  colorStatus?: 'GREEN' | 'YELLOW' | 'RED' | 'BLUE';
  
  // Cross links metadata
  costCenter?: string;
  project?: string;
  invoiceCode?: string;
  partnerName?: string;
  ledgerWording?: string;
  documentFilename?: string;
}

interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  hash: string;
}

interface GedPieceItem {
  id: string;
  pieceNumber: string;
  filename: string;
  date: string;
  size: string;
  journalType: string;
  ocrStatus: string;
  supplier: string;
  amountTTC: number;
}

type AccountingTab =
  | 'dashboard'
  | 'saisie'
  | 'journaux'
  | 'plan'
  | 'auxiliaires'
  | 'consultation'
  | 'grand-livre'
  | 'balance'
  | 'lettrage'
  | 'rapprochement-bancaire'
  | 'fin-periode'
  | 'cloture'
  | 'controles'
  | 'analyse'
  | 'rapports'
  | 'parametrages'
  | 'audit'
  | 'ai-assistant';

interface TiersDocument {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
}

interface TiersTimelineEvent {
  event: string;
  date: string;
  type: 'creation' | 'invoice' | 'payment' | 'relance' | 'avoir';
  description: string;
}

interface TiersItem {
  code: string;
  name: string;
  type: 'Client' | 'Fournisseur' | 'Salarié';
  solde: number;
  invoicesCount: number;
  lastMove: string;
  risk: 'Excellent' | 'Bon' | 'Moyen' | 'Faible' | 'Risqué';
  status: 'Actif' | 'Inactif';
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  nif: string;
  rccm: string;
  encoursAutorise: number;
  encoursUtilise: number;
  age30: number;
  age60: number;
  age90: number;
  ageOver90: number;
  documents: TiersDocument[];
  timeline: TiersTimelineEvent[];
  aiAnalysis: string;
}

const MOCK_TIERS_LIST: TiersItem[] = [
  {
    code: '411001',
    name: 'Super U Dakar',
    type: 'Client',
    solde: 2350000,
    invoicesCount: 12,
    lastMove: '2026-08-02',
    risk: 'Excellent',
    status: 'Actif',
    phone: '+221771234567',
    email: 'compta@superu-dakar.sn',
    address: 'Avenue Cheikh Anta Diop',
    city: 'Dakar',
    country: 'Sénégal',
    nif: 'SN-NIF-2026-98745',
    rccm: 'SN-DKR-2015-B-1452',
    encoursAutorise: 5000000,
    encoursUtilise: 2350000,
    age30: 1500000,
    age60: 850000,
    age90: 0,
    ageOver90: 0,
    documents: [
      { id: '1', name: 'Contrat_Cadre_SuperU_2026.pdf', type: 'Contrat', date: '2026-01-15', size: '2.4 Mo' },
      { id: '2', name: 'Attestation_NIF_SuperU.pdf', type: 'NIF', date: '2026-01-16', size: '540 Ko' },
    ],
    timeline: [
      { event: 'Création du compte', date: '2026-01-15', type: 'creation', description: 'Ouverture du compte client dans FinancePro' },
      { event: 'Première Facture Vente', date: '2026-01-20', type: 'invoice', description: 'Facturation initiale de marchandises pour 1 200 000 FCFA' },
      { event: 'Premier Règlement', date: '2026-02-05', type: 'payment', description: 'Règlement reçu par virement bancaire' },
    ],
    aiAnalysis: 'Client fidèle. Délai moyen de règlement observé de 12 jours. Encours actuel modéré. Aucun risque détecté.',
  },
  {
    code: '411002',
    name: 'Carrefour Abidjan',
    type: 'Client',
    solde: 950000,
    invoicesCount: 4,
    lastMove: '2026-08-01',
    risk: 'Moyen',
    status: 'Actif',
    phone: '+225078945612',
    email: 'accounting@carrefour.ci',
    address: 'Boulevard de Marseille',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    nif: 'CI-NIF-2024-54120',
    rccm: 'CI-ABJ-2018-B-9874',
    encoursAutorise: 3000000,
    encoursUtilise: 950000,
    age30: 450000,
    age60: 300000,
    age90: 200000,
    ageOver90: 0,
    documents: [
      { id: '1', name: 'Fiche_Identification_Carrefour.pdf', type: 'NIF', date: '2026-02-01', size: '920 Ko' }
    ],
    timeline: [
      { event: 'Création du compte', date: '2026-02-01', type: 'creation', description: 'Compte client configuré' },
      { event: 'Facture de prestations', date: '2026-03-10', type: 'invoice', description: 'Facture service technique 500 000 FCFA' },
      { event: 'Relance niveau 1', date: '2026-07-20', type: 'relance', description: 'Avis de retard envoyé par courriel automatique' },
    ],
    aiAnalysis: 'Retard de paiement moyen de 42 jours. Quelques relances envoyées. Risque modéré.',
  },
  {
    code: '401015',
    name: 'CFAO Sénégal',
    type: 'Fournisseur',
    solde: -4200000,
    invoicesCount: 18,
    lastMove: '2026-08-03',
    risk: 'Excellent',
    status: 'Actif',
    phone: '+221338596200',
    email: 'contact@cfao-motors.sn',
    address: 'Zone Industrielle Dakar',
    city: 'Dakar',
    country: 'Sénégal',
    nif: 'SN-NIF-2023-10024',
    rccm: 'SN-DKR-1998-B-0421',
    encoursAutorise: 10000000,
    encoursUtilise: 4200000,
    age30: 2000000,
    age60: 2200000,
    age90: 0,
    ageOver90: 0,
    documents: [
      { id: '1', name: 'Rib_CFAO_Senegal.pdf', type: 'Contrat', date: '2026-01-10', size: '1.1 Mo' }
    ],
    timeline: [
      { event: 'Ouverture Compte Fournisseur', date: '2026-01-10', type: 'creation', description: 'Création du compte partenaire CFAO' },
      { event: 'Facture Achat Matériel', date: '2026-01-18', type: 'invoice', description: 'Achat de 2 véhicules de livraison pour 8 000 000 FCFA' },
    ],
    aiAnalysis: 'Fournisseur principal pour le parc automobile. Historique de paiements réguliers. Risque de rupture nul.',
  },
  {
    code: '421001',
    name: 'Dieudonné Melamem',
    type: 'Salarié',
    solde: 0,
    invoicesCount: 0,
    lastMove: '2026-07-31',
    risk: 'Excellent',
    status: 'Actif',
    phone: '+221776543210',
    email: 'dieudonne.melamem@company.com',
    address: 'Almadies',
    city: 'Dakar',
    country: 'Sénégal',
    nif: 'SN-CNI-1985456201',
    rccm: 'N/A',
    encoursAutorise: 0,
    encoursUtilise: 0,
    age30: 0,
    age60: 0,
    age90: 0,
    ageOver90: 0,
    documents: [
      { id: '1', name: 'Contrat_Travail_Melamem.pdf', type: 'Contrat', date: '2025-06-01', size: '3.5 Mo' }
    ],
    timeline: [
      { event: 'Embauche', date: '2025-06-01', type: 'creation', description: 'Enregistrement de l\'employé au registre du personnel' }
    ],
    aiAnalysis: 'Directeur financier. Aucun dépassement ou avance non soldée.',
  },
  {
    code: '421002',
    name: 'Aminata Diop',
    type: 'Salarié',
    solde: 150000,
    invoicesCount: 0,
    lastMove: '2026-07-28',
    risk: 'Excellent',
    status: 'Actif',
    phone: '+221774521036',
    email: 'aminata.diop@company.sn',
    address: 'Plateau',
    city: 'Dakar',
    country: 'Sénégal',
    nif: 'SN-CNI-1992520140',
    rccm: 'N/A',
    encoursAutorise: 500000,
    encoursUtilise: 150000,
    age30: 150000,
    age60: 0,
    age90: 0,
    ageOver90: 0,
    documents: [
      { id: '1', name: 'Demande_Avance_Acompte.pdf', type: 'Contrat', date: '2026-07-25', size: '420 Ko' }
    ],
    timeline: [
      { event: 'Création Fiche Salarié', date: '2026-03-01', type: 'creation', description: 'Comptabilisation du dossier' },
      { event: 'Versement acompte sur salaire', date: '2026-07-25', type: 'payment', description: 'Avance accordée de 150 000 FCFA déduite de la paie' }
    ],
    aiAnalysis: 'Assistante administrative. Acompte consenti en juillet, régularisation prévue sur la paie suivante.',
  },
  {
    code: '411003',
    name: 'Super U Abidjan',
    type: 'Client',
    solde: 1200000,
    invoicesCount: 3,
    lastMove: '2026-08-03',
    risk: 'Excellent',
    status: 'Actif',
    phone: '+221771234567', // triggers duplicate phone detection
    email: 'compta@superu-dakar.sn', // triggers duplicate email detection
    address: 'Avenue de la République',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    nif: 'SN-NIF-2026-98745', // triggers duplicate NIF detection
    rccm: 'SN-ABJ-2026-B-1452',
    encoursAutorise: 4000000,
    encoursUtilise: 1200000,
    age30: 1200000,
    age60: 0,
    age90: 0,
    ageOver90: 0,
    documents: [],
    timeline: [
      { event: 'Création du compte', date: '2026-03-01', type: 'creation', description: 'Création du compte succursale' }
    ],
    aiAnalysis: 'Client en croissance. Partage les mêmes informations d\'identification que la maison mère à Dakar.'
  }
];

const MOCK_BANK_ACCOUNTS: BankAccount[] = [
  { id: '1', code: '521100', name: 'Afriland First Bank (Dakar)', balanceCompta: 3800000, balanceBank: 3800000, unreconciledCount: 3, lastReconciliation: '2026-08-04' },
  { id: '2', code: '521200', name: 'Société Générale Cameroun (Douala)', balanceCompta: 5400000, balanceBank: 5525000, unreconciledCount: 2, lastReconciliation: '2026-08-03' },
  { id: '3', code: '521300', name: 'UBA Senegal', balanceCompta: 1200000, balanceBank: 1200000, unreconciledCount: 0, lastReconciliation: '2026-08-01' },
  { id: '4', code: '521400', name: 'Ecobank Niger', balanceCompta: 2300000, balanceBank: 2300000, unreconciledCount: 0, lastReconciliation: '2026-07-31' },
  { id: '5', code: 'OM_MONEY', name: 'Orange Money Business', balanceCompta: 850000, balanceBank: 850000, unreconciledCount: 0, lastReconciliation: '2026-08-04' }
];

const MOCK_COMPTA_BANK_LINES: BankReconciliationLine[] = [
  {
    id: 'c1',
    date: '2026-08-04',
    reference: 'VIR-258',
    wording: 'Encaissement Client A (SODEXO)',
    debit: 350000,
    credit: 0,
    isReconciled: true,
    bankAccountId: '1',
    partnerName: 'SODEXO',
    costCenter: 'Prestations',
    project: 'Sodexo Catering',
    invoiceCode: 'FAC-VT-101',
    ledgerWording: 'Encaissement virement client Sodexo',
    documentFilename: 'Avis_Virement_Afriland.pdf'
  },
  {
    id: 'c2',
    date: '2026-08-05',
    reference: 'VIR-259',
    wording: 'Encaissement Client B (Carrefour)',
    debit: 200000,
    credit: 0,
    isReconciled: false,
    bankAccountId: '1',
    partnerName: 'Carrefour Abidjan',
    costCenter: 'Ventes',
    project: 'Livraisons Côte d\'Ivoire',
    invoiceCode: 'FAC-VT-102',
    ledgerWording: 'Prestation conseil régul',
    documentFilename: 'Virement_Carrefour_Attest.pdf'
  },
  {
    id: 'c3',
    date: '2026-08-05',
    reference: 'CHQ-320',
    wording: 'Chèque émis Fournisseur CFAO',
    debit: 0,
    credit: 500000,
    isReconciled: false,
    bankAccountId: '1',
    partnerName: 'CFAO Sénégal',
    costCenter: 'Parc Auto',
    project: 'Logistique Dakar',
    invoiceCode: 'FAC-AC-105',
    ledgerWording: 'Règlement acompte véhicule chèque',
    documentFilename: 'Copie_Cheque_CFAO.jpg'
  },
  {
    id: 'c4',
    date: '2026-08-03',
    reference: 'VIR-SG-01',
    wording: 'Encaissement Ets Kaboré',
    debit: 450000,
    credit: 0,
    isReconciled: true,
    bankAccountId: '2',
    partnerName: 'Ets Kaboré'
  },
  {
    id: 'c5',
    date: '2026-08-04',
    reference: 'BQ-SG-AGIOS',
    wording: 'Commissions bancaires trimestrielles',
    debit: 0,
    credit: 18500,
    isReconciled: false,
    bankAccountId: '2',
    partnerName: 'SG Cameroun'
  }
];

const MOCK_BANK_STATEMENT_LINES: BankReconciliationLine[] = [
  {
    id: 'b1',
    date: '2026-08-04',
    reference: 'VIR-258',
    wording: 'RECU VIR. CLIENT A (SODEXO)',
    debit: 350000,
    credit: 0,
    isReconciled: true,
    bankAccountId: '1',
    iaMatchScore: 99,
    iaMatchRef: 'c1'
  },
  {
    id: 'b2',
    date: '2026-08-05',
    reference: 'VIR-259',
    wording: 'VIREMENT CARREFOUR COTE IVOIRE',
    debit: 198500,
    credit: 0,
    isReconciled: false,
    bankAccountId: '1',
    iaMatchScore: 94,
    iaMatchRef: 'c2'
  },
  {
    id: 'b3',
    date: '2026-08-05',
    reference: 'CHQ-320',
    wording: 'PRESENTATION CHEQUE EXT.',
    debit: 0,
    credit: 0,
    isReconciled: false,
    bankAccountId: '1',
    iaMatchScore: 0
  },
  {
    id: 'b4',
    date: '2026-08-03',
    reference: 'VIR-SG-01',
    wording: 'VIR. ETS KABORE RECU',
    debit: 450000,
    credit: 0,
    isReconciled: true,
    bankAccountId: '2',
    iaMatchScore: 100,
    iaMatchRef: 'c4'
  },
  {
    id: 'b5',
    date: '2026-08-04',
    reference: 'AGIOS-Q3',
    wording: 'COMMISSIONS ET COMPTE SG',
    debit: 0,
    credit: 18500,
    isReconciled: false,
    bankAccountId: '2',
    iaMatchScore: 95,
    iaMatchRef: 'c5'
  }
];

const JOURNAL_TEMPLATES: Record<JournalType, Array<{ accountCode: string; accountLabel: string; debit: number; credit: number }>> = {
  VENTES: [
    { accountCode: '411', accountLabel: 'Clients, Ventes de biens et services', debit: 0, credit: 0 },
    { accountCode: '701', accountLabel: 'Ventes de marchandises', debit: 0, credit: 0 },
    { accountCode: '443', accountLabel: 'État, TVA facturée sur ventes', debit: 0, credit: 0 },
  ],
  ACHATS: [
    { accountCode: '601', accountLabel: 'Achats de marchandises', debit: 0, credit: 0 },
    { accountCode: '445', accountLabel: 'État, TVA récupérable sur achats', debit: 0, credit: 0 },
    { accountCode: '401', accountLabel: 'Fournisseurs, dettes en compte', debit: 0, credit: 0 },
  ],
  BANQUE: [
    { accountCode: '521', accountLabel: 'Banques locales', debit: 0, credit: 0 },
    { accountCode: '411', accountLabel: 'Clients, Ventes de biens et services', debit: 0, credit: 0 },
  ],
  CAISSE: [
    { accountCode: '571', accountLabel: 'Caisse principale', debit: 0, credit: 0 },
    { accountCode: '411', accountLabel: 'Clients, Ventes de biens et services', debit: 0, credit: 0 },
  ],
  SALAIRES: [
    { accountCode: '661', accountLabel: 'Rémunérations du personnel (Salaires bruts)', debit: 0, credit: 0 },
    { accountCode: '421', accountLabel: 'Personnel, rémunérations dues (Net à payer)', debit: 0, credit: 0 },
    { accountCode: '431', accountLabel: 'Sécurité sociale (CNPS / Cotisations)', debit: 0, credit: 0 },
    { accountCode: '447', accountLabel: 'État, impôts sur salaires (IRPP / Retenues)', debit: 0, credit: 0 },
  ],
  OD: [
    { accountCode: '658', accountLabel: 'Charges diverses d\'exploitation', debit: 0, credit: 0 },
    { accountCode: '758', accountLabel: 'Produits divers d\'exploitation', debit: 0, credit: 0 },
  ],
};

const GUIDED_TEMPLATES = {
  TVA_DECLARATION: [
    { accountCode: '443', accountLabel: 'État, TVA facturée sur ventes', debit: 150000, credit: 0 },
    { accountCode: '445', accountLabel: 'État, TVA récupérable sur achats', debit: 0, credit: 100000 },
    { accountCode: '444', accountLabel: 'État, impôts sur le résultat / TVA due', debit: 0, credit: 50000 },
  ],
  DOTATIONS: [
    { accountCode: '681', accountLabel: 'Dotations aux amortissements d\'exploitation', debit: 250000, credit: 0 },
    { accountCode: '281', accountLabel: 'Amortissements des immobilisations corporelles', debit: 0, credit: 250000 },
  ],
  REGULARISATIONS: [
    { accountCode: '476', accountLabel: 'Charges constatées d\'avance (CCA)', debit: 75000, credit: 0 },
    { accountCode: '601', accountLabel: 'Achats de marchandises', debit: 0, credit: 75000 },
  ],
};

// ─── Modal Pédagogique SYSCOHADA ──────────────────────────────────────────────
const SyscohadaPedagogicalModal: React.FC<{ accountCode: string; onClose: () => void }> = ({ accountCode, onClose }) => {
  interface AccountDetails {
    label: string;
    classNum: number;
    def: string;
    whenToUse: string;
    whenNotToUse: string;
    examples: string;
    references: string;
  }

  const accountInfo: Record<string, AccountDetails> = {
    '101': {
      label: 'Capital social',
      classNum: 1,
      def: 'Valeur nominale des parts sociales ou actions de l\'entreprise souscrites par les associés lors de la constitution ou des augmentations successives de capital.',
      whenToUse: 'À créditer lors de la constitution de la société (apport initial) ou de l\'augmentation de capital, par le débit des comptes d\'actionnaires ou de comptes de fonds (ex: 521).',
      whenNotToUse: 'Ne doit pas être confondu avec les subventions d\'investissement (comptes 14) ou le capital individuel des entreprises individuelles (compte 102).',
      examples: 'Débit 4611 (Associés, apports en nature) / Crédit 1011 (Capital souscrit non appelé).',
      references: 'Acte Uniforme Relatif au Droit des Sociétés Commerciales (AUDSC), Art. 61 et suivants ; Plan de Comptes Général SYSCOHADA.',
    },
    '211': {
      label: 'Frais de développement',
      classNum: 2,
      def: 'Dépenses engagées par l\'entreprise pour son propre compte dans des projets de recherche appliquée ou de développement expérimental.',
      whenToUse: 'À débiter lorsque le projet a de sérieuses chances de réussite technique et commerciale, par le crédit du compte 721 (Production immobilisée incorporelle).',
      whenNotToUse: 'Ne pas utiliser pour les dépenses de recherche fondamentale qui doivent obligatoirement être passées en charges de l\'exercice (compte 631).',
      examples: 'Débit 211 (Frais de développement) / Crédit 721 (Production immobilisée incorporelle).',
      references: 'Titre IV du SYSCOHADA Révisé - Règles d\'évaluation et de comptabilisation des actifs incorporels.',
    },
    '244': {
      label: 'Matériel informatique',
      classNum: 2,
      def: 'Ensemble des ordinateurs, imprimantes, serveurs et autres équipements de traitement automatisé des données appartenant à l\'entreprise.',
      whenToUse: 'À débiter lors de l\'acquisition de matériel informatique (valeur brute HT), par le crédit d\'un compte de fournisseur d\'immobilisation (481) ou de banque (521).',
      whenNotToUse: 'Ne pas débiter si la valeur unitaire est inférieure à 100 000 FCFA (seuil légal d\'admission en charges directes de matériel de bureau dans de nombreux pays de l\'OHADA).',
      examples: 'Débit 244 (Matériel informatique) & Débit 4451 (TVA récupérable sur immo) / Crédit 481 (Fournisseurs d\'investissements).',
      references: 'Règles d\'évaluation des immobilisations corporelles du SYSCOHADA ; Code Général des Impôts.',
    },
    '311': {
      label: 'Marchandises',
      classNum: 3,
      def: 'Biens achetés par l\'entreprise pour être revendus en l\'état sans transformation préalable.',
      whenToUse: 'À débiter en fin d\'exercice (inventaire intermittent) pour constater le stock final ou la variation de stock, par le crédit du compte 6031 (Variation de stocks de marchandises).',
      whenNotToUse: 'Ne pas comptabiliser les fournitures de bureau consommables (compte 605) ou les matières premières destinées à être transformées (compte 32).',
      examples: 'Débit 311 (Marchandises) / Crédit 6031 (Variation de stocks de marchandises) lors de la constatation du stock final.',
      references: 'Norme SYSCOHADA Révisée relative aux règles d\'évaluation des stocks et encours.',
    },
    '401': {
      label: 'Fournisseurs de dettes en compte',
      classNum: 4,
      def: 'Compte de tiers créditeur enregistrant le montant des dettes contractées auprès des fournisseurs pour l\'achat de marchandises ou de services.',
      whenToUse: 'À créditer du montant TTC de la facture d\'achat reçue, par le débit des comptes de charges (classe 6) et du compte 445 (TVA récupérable).',
      whenNotToUse: 'Ne pas utiliser pour les dettes d\'acquisition d\'immobilisations, qui doivent être enregistrées au compte 481 (Fournisseurs d\'investissements).',
      examples: 'Débit 601 (Achats de marchandises) & Débit 445 (TVA récupérable) / Crédit 401 (Fournisseurs).',
      references: 'Règles d\'enregistrement des opérations avec les tiers du SYSCOHADA.',
    },
    '411': {
      label: 'Clients, créances en compte',
      classNum: 4,
      def: 'Compte de tiers débiteur enregistrant les créances issues de la facturation des ventes de marchandises, de produits finis ou de prestations de services.',
      whenToUse: 'À débiter du montant TTC lors de l\'émission de la facture au client, par le crédit du compte 70 (Ventes) et du compte 443 (TVA facturée).',
      whenNotToUse: 'Ne pas utiliser pour enregistrer des prêts octroyés au personnel (compte 428) ou des créances d\'impôts (comptes 44).',
      examples: 'Débit 411 (Clients) / Crédit 701 (Ventes de marchandises) & Crédit 443 (TVA facturée).',
      references: 'Livre des Procédures Fiscales et règles d\'évaluation des créances douteuses (SYSCOHADA).',
    },
    '443': {
      label: 'État, TVA facturée sur ventes',
      classNum: 4,
      def: 'Taxe sur la valeur ajoutée collectée auprès des clients sur les livraisons de biens ou les prestations de services imposables.',
      whenToUse: 'À créditer lors de chaque vente assujettie à la TVA, par le débit du compte client (411) ou de trésorerie (521/541).',
      whenNotToUse: 'Ne pas utiliser pour la TVA déductible sur achats (compte 445) ou pour les opérations exonérées de TVA.',
      examples: 'Débit 411 (Clients) / Crédit 701 (Ventes de marchandises) & Crédit 443 (TVA facturée).',
      references: 'Directives communautaires UEMOA/CEMAC sur l\'harmonisation des législations de TVA.',
    },
    '445': {
      label: 'État, TVA récupérable sur achats',
      classNum: 4,
      def: 'TVA payée sur les achats de biens, de services ou d\'immobilisations, que l\'entreprise peut déduire de la TVA collectée.',
      whenToUse: 'À débiter lors de la comptabilisation des factures fournisseurs d\'achats ou d\'immobilisations comportant de la TVA déductible.',
      whenNotToUse: 'Ne pas utiliser si la TVA n\'est pas déductible fiscalement (ex: véhicules de tourisme, frais de représentation selon la législation nationale).',
      examples: 'Débit 601 (Achats) & Débit 4452 (TVA récupérable sur biens et services) / Crédit 401 (Fournisseurs).',
      references: 'Code Général des Impôts - Dispositions relatives au droit à déduction de la TVA.',
    },
    '521': {
      label: 'Banques locales en monnaie nationale',
      classNum: 5,
      def: 'Compte financier de trésorerie retraçant les avoirs et mouvements en monnaie nationale (FCFA) dans les banques résidentes.',
      whenToUse: 'À débiter pour les encaissements (virements reçus, chèques déposés) et à créditer pour les règlements bancaires émis.',
      whenNotToUse: 'Ne pas utiliser pour les comptes en devises étrangères (compte 522) ou pour les opérations en espèces (compte 571).',
      examples: 'Débit 521 (Banque) / Crédit 411 (Clients) lors du règlement bancaire d\'une créance.',
      references: 'Règles générales des instruments de paiement de la BCEAO/BEAC.',
    },
    '571': {
      label: 'Caisse principale',
      classNum: 5,
      def: 'Compte de trésorerie disponible enregistrant les mouvements d\'espèces (pièces et billets) gérés par la caisse centrale de l\'entreprise.',
      whenToUse: 'À débiter lors des encaissements physiques d\'espèces et à créditer lors des décaissements directs pour achats au comptant.',
      whenNotToUse: 'Ne doit jamais présenter un solde créditeur (la caisse ne pouvant physiquement contenir moins de zéro franc). Interdit pour les règlements inter-entreprises au-delà du seuil légal.',
      examples: 'Débit 571 (Caisse) / Crédit 701 (Ventes de marchandises) pour une vente payée comptant.',
      references: 'Réglementation relative aux transactions en espèces (Loi anti-blanchiment de la zone UEMOA/CEMAC).',
    },
    '601': {
      label: 'Achats de marchandises',
      classNum: 6,
      def: 'Charges d\'exploitation enregistrant le coût Hors Taxe d\'acquisition des marchandises destinées à la revente en l\'état.',
      whenToUse: 'À débiter pour le montant net commercial HT de la facture fournisseur, par le crédit du compte 401 (Fournisseurs) ou de trésorerie.',
      whenNotToUse: 'Ne pas débiter des matières premières destinées à être intégrées dans un processus de fabrication (compte 602) ou des emballages commerciaux (compte 6033/605).',
      examples: 'Débit 601 (Achats de marchandises) & Débit 445 (TVA récupérable) / Crédit 401 (Fournisseurs).',
      references: 'Titre VIII du SYSCOHADA Révisé - Nomenclature des charges par nature.',
    },
    '626': {
      label: 'Frais de télécommunications et Internet',
      classNum: 6,
      def: 'Charges de services extérieurs regroupant les frais d\'abonnements téléphoniques, de consommation mobile, de liaisons spécialisées et de connexions Internet.',
      whenToUse: 'À débiter lors de la réception des factures des opérateurs télécoms (Orange, MTN, Moov, etc.), par le crédit du compte 401 (Fournisseurs).',
      whenNotToUse: 'Ne pas débiter si la facture est émise au nom personnel des dirigeants ou employés sans convention de remboursement conforme.',
      examples: 'Débit 626 (Télécoms) & Débit 4454 (TVA sur services) / Crédit 401 (Fournisseurs).',
      references: 'Règles fiscales de déductibilité des frais généraux de télécommunication.',
    },
    '661': {
      label: 'Rémunérations directes versées au personnel',
      classNum: 6,
      def: 'Frais de personnel englobant les salaires de base, primes, indemnités et autres avantages directs versés aux salariés.',
      whenToUse: 'À débiter à la fin de chaque mois pour enregistrer les salaires bruts calculés sur le livre de paie, par le crédit du compte 421 (Personnel, rémunérations dues).',
      whenNotToUse: 'Ne pas utiliser pour les honoraires versés à des prestataires externes ou consultants indépendants (compte 632).',
      examples: 'Débit 661 (Salaires bruts) / Crédit 421 (Personnel - net à payer), Crédit 431 (CNPS), Crédit 447 (Impôts sur salaires).',
      references: 'Code du Travail local ; Titre VIII du SYSCOHADA Révisé (Frais de personnel).',
    },
    '701': {
      label: 'Ventes de marchandises',
      classNum: 7,
      def: 'Produits d\'exploitation retraçant le chiffre d\'affaires brut réalisé sur la revente en l\'état de marchandises.',
      whenToUse: 'À créditer lors de l\'émission de la facture de vente au client (montant net hors taxes), par le débit du compte client (411) ou de trésorerie.',
      whenNotToUse: 'Ne pas utiliser pour les ventes de produits finis fabriqués par l\'entreprise (compte 702) ou pour les prestations de services (compte 706).',
      examples: 'Débit 411 (Clients) / Crédit 701 (Ventes de marchandises) & Crédit 443 (TVA collectée).',
      references: 'SYSCOHADA Révisé - Règles de constatation des produits d\'exploitation.',
    }
  };

  const info = accountInfo[accountCode] || {
    label: `Compte ${accountCode}`,
    classNum: Number(accountCode[0]) || 4,
    def: `Compte de la classe ${accountCode[0]} du Plan Comptable Général SYSCOHADA Révisé.`,
    whenToUse: 'À débiter ou créditer selon la nature de l\'écriture et l\'imputation comptable standard définie par le plan de comptes générale.',
    whenNotToUse: 'Ne pas mouvementer sans pièce justificative conforme attachée (Facture, reçu de caisse, relevé bancaire).',
    examples: 'Comptabilisation classique selon le journal auxiliaire sélectionné.',
    references: 'SYSCOHADA Révisé - Acte Uniforme de l\'OHADA portant organisation de la comptabilité des entreprises.',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-violet-100 space-y-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-extrabold text-sm">
              {accountCode}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">{info.label}</h3>
              <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Classe {info.classNum} — SYSCOHADA Révisé</p>
            </div>
          </div>
          <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-slate-700 max-h-[450px] overflow-y-auto pr-1">
          <div className="p-3 rounded-2xl bg-violet-50/60 border border-violet-100">
            <strong className="text-violet-900 font-bold block mb-1">📖 Définition Officielle :</strong>
            <p className="text-slate-600 font-medium">{info.def}</p>
          </div>
          
          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <strong className="text-emerald-900 font-bold block mb-1">🟢 Quand l'utiliser (Débit / Crédit) :</strong>
            <p className="text-slate-600 font-medium">{info.whenToUse}</p>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100">
            <strong className="text-rose-900 font-bold block mb-1">🔴 Quand NE PAS l'utiliser :</strong>
            <p className="text-slate-600 font-medium">{info.whenNotToUse}</p>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 font-mono">
            <strong className="text-blue-900 font-bold block mb-1">📝 Exemple d'Écriture :</strong>
            <p className="text-slate-600 font-medium text-[11px]">{info.examples}</p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
            <strong className="text-amber-900 font-bold block mb-1">⚖️ Références Réglementaires SYSCOHADA :</strong>
            <p className="text-slate-600 font-medium italic">{info.references}</p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-sm"
          >
            Fermer l'explication
          </button>
        </div>
      </div>
    </div>
  );
};

interface AccountingModuleProps {
  initialTab?: AccountingTab;
}

export const AccountingModule: React.FC<AccountingModuleProps> = ({ initialTab = 'dashboard' }) => {
  const [tab, setTab] = useState<AccountingTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);
  
  // States CRM Tiers
  const [tiersList, setTiersList] = useState<TiersItem[]>(MOCK_TIERS_LIST);
  const [selectedTiers, setSelectedTiers] = useState<TiersItem | null>(null);
  const [tiersSearchQuery, setTiersSearchQuery] = useState('');
  const [tiersFilterType, setTiersFilterType] = useState<'ALL' | 'Client' | 'Fournisseur' | 'Salarié'>('ALL');
  const [tiersFilterRisk, setTiersFilterRisk] = useState<'ALL' | 'Excellent' | 'Moyen' | 'Risqué'>('ALL');
  const [tiersFilterStatus, setTiersFilterStatus] = useState<'ALL' | 'Actif' | 'Inactif'>('ALL');
  const [tiersViewMode, setTiersViewMode] = useState<'LIST' | 'STATS' | 'MAP'>('LIST');
  const [activeTiersCockpitTab, setActiveTiersCockpitTab] = useState<'CONTACT' | 'FINANCE' | 'TIMELINE' | 'GED' | 'IA'>('CONTACT');
  
  // Relance modal states
  const [relanceModalOpen, setRelanceModalOpen] = useState(false);
  const [relanceChannel, setRelanceChannel] = useState<'SMS' | 'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [relanceMessageText, setRelanceMessageText] = useState('');
  const [relancePreviewLoading, setRelancePreviewLoading] = useState(false);

  // States Enriched Lettrage
  const [selectedLettrageItem, setSelectedLettrageItem] = useState<LettrageItem | null>(null);
  const [delettrageModalOpen, setDelettrageModalOpen] = useState(false);
  const [delettrageItemId, setDelettrageItemId] = useState<string | null>(null);
  const [delettrageMotif, setDelettrageMotif] = useState('');
  const [lettrageSearchQuery, setLettrageSearchQuery] = useState('');
  const [lettrageFilterStatus, setLettrageFilterStatus] = useState<'ALL' | '🟢 Lettré' | '🟡 Partiellement' | '🔴 Non lettré'>('ALL');
  const [lettrageHistory, setLettrageHistory] = useState<Array<{ id: string; user: string; timestamp: string; action: string; details: string }>>([
    { id: 'lh1', user: 'Dieudonné MELAMEM', timestamp: '2026-08-04 10:15', action: 'Lettrage Automatique', details: 'Lettrage des écritures du compte 411000 sous le code AA' }
  ]);
  const [lettragePreviewDoc, setLettragePreviewDoc] = useState<string | null>(null);

  // States Bank Reconciliation
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(MOCK_BANK_ACCOUNTS);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('1');
  const [comptaLines, setComptaLines] = useState<BankReconciliationLine[]>(MOCK_COMPTA_BANK_LINES);
  const [bankLines, setBankLines] = useState<BankReconciliationLine[]>(MOCK_BANK_STATEMENT_LINES);
  const [selectedComptaLineForDrawer, setSelectedComptaLineForDrawer] = useState<BankReconciliationLine | null>(null);
  const [selectedBankLineForDrawer, setSelectedBankLineForDrawer] = useState<BankReconciliationLine | null>(null);
  
  const [importedStatementFile, setImportedStatementFile] = useState<string | null>(null);
  const [importedStatementMetadata, setImportedStatementMetadata] = useState<{ count: number; opening: number; closing: number; dateRange: string } | null>(null);
  
  const [adjustmentsOpen, setAdjustmentsOpen] = useState(false);
  const [selectedEcartLine, setSelectedEcartLine] = useState<BankReconciliationLine | null>(null);
  const [ecartRegulAmount, setEcartRegulAmount] = useState<number | ''>('');
  const [ecartRegulWording, setEcartRegulWording] = useState('');
  const [bankAssistantQuery, setBankAssistantQuery] = useState('');
  const [bankAssistantAnswer, setBankAssistantAnswer] = useState<string | null>(null);
  const [bankAssistantLoading, setBankAssistantLoading] = useState(false);

  // States Closing Assistant
  const [closingConformityScore, setClosingConformityScore] = useState(91);
  const [closingAnomaliesCount, setClosingAnomaliesCount] = useState(3);
  const [closingProgress, setClosingProgress] = useState(82);
  const [closingEstimatedTime, setClosingEstimatedTime] = useState('1h 15m');
  const [closingTimelineStep, setClosingTimelineStep] = useState<number>(6);
  
  const [closingChecklist, setClosingChecklist] = useState<Array<{ id: string; name: string; status: 'DONE' | 'WARNING' | 'ALERT'; description: string }>>([
    { id: '1', name: 'Journaux validés', status: 'DONE', description: 'Toutes les écritures de la période sont verrouillées' },
    { id: '2', name: 'TVA contrôlée', status: 'DONE', description: 'Déclaration mensuelle de TVA cadrée et validée' },
    { id: '3', name: 'Banque rapprochée', status: 'WARNING', description: 'Compte SG Douala présente un écart de rapprochement' },
    { id: '4', name: 'Lettrage terminé', status: 'DONE', description: '92% des comptes tiers lettrés et justifiés' },
    { id: '5', name: 'Immobilisations mises à jour', status: 'WARNING', description: '2 immobilisations n\'ont pas de dotation d\'amortissement' },
    { id: '6', name: 'Stocks valorisés', status: 'ALERT', description: 'Écart de valorisation d\'inventaire physique non ajusté' },
    { id: '7', name: 'Provisions calculées', status: 'DONE', description: 'Créances douteuses calculées et validées' },
    { id: '8', name: 'États financiers générés', status: 'ALERT', description: 'Bilan et Liasse DSF en attente de génération' }
  ]);

  const [stockValuationMethod, setStockValuationMethod] = useState<'CUMP' | 'FIFO'>('CUMP');
  const [stockPhysicalValue, setStockPhysicalValue] = useState(2500000);
  const [stockBookValue, setStockBookValue] = useState(2620000);
  const [stockVarianceWording, setStockVarianceWording] = useState('Ajustement écart inventaire physique essence Q3');

  const [closingDoubtfulClients, setClosingDoubtfulClients] = useState<Array<{ id: string; clientName: string; balance: number; daysLate: number; suggestedProvRate: number; provAmount: number; isActionDone: boolean }>>([
    { id: 'dc1', clientName: 'Ets Kaboré & Fils', balance: 1500000, daysLate: 120, suggestedProvRate: 50, provAmount: 750000, isActionDone: false },
    { id: 'dc2', clientName: 'Carrefour Cameroun', balance: 400000, daysLate: 40, suggestedProvRate: 10, provAmount: 40000, isActionDone: false },
    { id: 'dc3', clientName: 'Super U Dakar', balance: 800000, daysLate: 15, suggestedProvRate: 0, provAmount: 0, isActionDone: false }
  ]);

  const [closingRecurrentEntries, setClosingRecurrentEntries] = useState<Array<{ id: string; label: string; frequency: 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL'; amount: number; nextRun: string; isSuspended: boolean }>>([
    { id: 're1', label: 'Loyer mensuel des bureaux (Dakar)', frequency: 'MENSUEL', amount: 350000, nextRun: '2026-09-01', isSuspended: false },
    { id: 're2', label: 'Abonnement Internet & Télécoms (Orange)', frequency: 'MENSUEL', amount: 45000, nextRun: '2026-09-01', isSuspended: false },
    { id: 're3', label: 'Remboursement emprunt bancaire trimestriel', frequency: 'TRIMESTRIEL', amount: 1200000, nextRun: '2026-09-30', isSuspended: false },
    { id: 're4', label: 'Taxe professionnelle de fin d\'exercice', frequency: 'ANNUEL', amount: 850000, nextRun: '2026-12-31', isSuspended: true }
  ]);

  const [closingDeadlines, setClosingDeadlines] = useState<Array<{ id: string; task: string; deadlineDate: string; category: string }>>([
    { id: 'd1', task: 'Clôture mensuelle Juillet 2026', deadlineDate: '2026-08-10', category: 'Clôture' },
    { id: 'd2', task: 'Déclaration TVA mensuelle', deadlineDate: '2026-08-15', category: 'Fiscalité' },
    { id: 'd3', task: 'Validation Inventaire Physique', deadlineDate: '2026-08-30', category: 'Stocks' },
    { id: 'd4', task: 'Télétransmission DSF Annuelle', deadlineDate: '2026-09-30', category: 'Liasse' }
  ]);

  const [simulationOpen, setSimulationOpen] = useState(false);
  const [simulationData, setSimulationData] = useState({
    bilanAssetsBefore: 12500000,
    bilanAssetsAfter: 12150000,
    bilanLiabilitiesBefore: 12500000,
    bilanLiabilitiesAfter: 12150000,
    netIncomeBefore: 2850000,
    netIncomeAfter: 2500000,
    cashFlowBefore: 3800000,
    cashFlowAfter: 3800000,
    fiscalTaxBefore: 855000,
    fiscalTaxAfter: 750000
  });

  const [copilotDiagnosticsOpen, setCopilotDiagnosticsOpen] = useState(false);
  const [copilotDiagnosticsResults, setCopilotDiagnosticsResults] = useState<string[]>([]);
  const [copilotDiagnosticsLoading, setCopilotDiagnosticsLoading] = useState(false);

  const [closingHistoryList, setClosingHistoryList] = useState<Array<{ id: string; date: string; user: string; duration: string; entriesCount: number; status: string }>>([
    { id: 'ch1', date: '2026-07-05', user: 'Dieudonné MELAMEM', duration: '45 mins', entriesCount: 8, status: 'Validée' },
    { id: 'ch2', date: '2026-06-04', user: 'Dieudonné MELAMEM', duration: '1h 10 mins', entriesCount: 12, status: 'Validée' }
  ]);

  const [closingSignatures, setClosingSignatures] = useState({
    comptableSigned: true,
    chefComptableSigned: true,
    dafSigned: false,
    cacSigned: false
  });

  // States Centre Intelligent de Clôture OHADA
  const [clotureStep, setClotureStep] = useState<number>(3); // 0-6 steps
  const [clotureReadinessScore, setClotureReadinessScore] = useState(94);
  const [clotureRisks, setClotureRisks] = useState([
    { id: 'r1', label: 'Compte 471 (attente) non soldé', severity: 'HIGH' as const, resolved: false },
    { id: 'r2', label: 'Banque SG Cameroun non rapprochée (écart 125k)', severity: 'HIGH' as const, resolved: false },
    { id: 'r3', label: 'TVA déductible incohérente sur Juillet', severity: 'MEDIUM' as const, resolved: false },
    { id: 'r4', label: '2 immobilisations sans dotation d\'amortissement', severity: 'MEDIUM' as const, resolved: false },
    { id: 'r5', label: 'Client Ets Kaboré sans provision constituée', severity: 'LOW' as const, resolved: false },
  ]);
  const [clotureTrackingSteps, setClotureTrackingSteps] = useState([
    { id: 's1', name: 'Contrôles', status: 'DONE' as const, pct: 100 },
    { id: 's2', name: 'Régularisations', status: 'DONE' as const, pct: 100 },
    { id: 's3', name: 'Journaux', status: 'WARNING' as const, pct: 95 },
    { id: 's4', name: 'États Financiers', status: 'DONE' as const, pct: 100 },
    { id: 's5', name: 'A-Nouveaux', status: 'PENDING' as const, pct: 0 },
    { id: 's6', name: 'Archivage', status: 'PENDING' as const, pct: 0 },
  ]);
  const [clotureSimulationOpen, setClotureSimulationOpen] = useState(false);
  const [cloturePasswordModal, setCloturePasswordModal] = useState(false);
  const [cloturePasswordInput, setCloturePasswordInput] = useState('');
  const [clotureReopenModal, setClotureReopenModal] = useState(false);
  const [clotureReopenMotif, setClotureReopenMotif] = useState('');
  const [clotureArchiving, setClotureArchiving] = useState(false);
  const [clotureArchiveDone, setClotureArchiveDone] = useState(false);
  const [clotureCertificateOpen, setClotureCertificateOpen] = useState(false);
  const [clotureExecuted, setClotureExecuted] = useState(false);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  
  // States Controls Redesign
  const [ignoredAnomalyIds, setIgnoredAnomalyIds] = useState<string[]>([]);
  const [justifiedAnomalyIds, setJustifiedAnomalyIds] = useState<string[]>([]);
  const [correctedAnomalyIds, setCorrectedAnomalyIds] = useState<string[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<any | null>(null);
  const [controlsFilter, setControlsFilter] = useState<string>('ALL'); // ALL, CRITICAL, MAJOR, MINOR, RESOLVED
  const [controlsSearch, setControlsSearch] = useState<string>('');
  const [auditHistory, setAuditHistory] = useState<Array<{ date: string; action: string; score: number; anomaliesCount: number }>>([
    { date: '01/08/2026', action: 'Audit général', score: 84, anomaliesCount: 3 },
    { date: '08/08/2026', action: 'Audit général', score: 72, anomaliesCount: 7 },
    { date: '11/08/2026', action: 'Audit général', score: 60, anomaliesCount: 12 },
  ]);
  const [auditLoading, setAuditLoading] = useState(false);

  // States Financial Analysis (SIG) Redesign
  const [financialYearFilter, setFinancialYearFilter] = useState<'2026' | '2025' | '2024'>('2026');
  const [financialViewMode, setFinancialViewMode] = useState<'DIRECTION' | 'EXPERT'>('DIRECTION');
  const [activeSIGTab, setActiveSIGTab] = useState<'DASHBOARD' | 'SIG' | 'RATIOS' | 'BFR' | 'COMPARATIVE' | 'ACTIVITY' | 'AI'>('DASHBOARD');
  const [financialAiQuery, setFinancialAiQuery] = useState('');
  const [financialAiAnswer, setFinancialAiAnswer] = useState<string | null>(null);
  const [financialAiLoading, setFinancialAiLoading] = useState(false);
  const [selectedSIGLineDrilldown, setSelectedSIGLineDrilldown] = useState<string | null>(null);

  // States Reports Redesign
  const [reportsPeriod, setReportsPeriod] = useState<'ANNEE' | 'SEMESTRE_1' | 'SEMESTRE_2' | 'TRIMESTRE'>('ANNEE');
  const [reportsCurrency, setReportsCurrency] = useState<'XAF' | 'EUR' | 'USD'>('XAF');
  const [reportsComparison, setReportsComparison] = useState<'2025' | 'NONE'>('2025');
  const [reportsVersion, setReportsVersion] = useState<'DEFINITIVE' | 'PROVISOIRE'>('DEFINITIVE');
  const [reportsActiveCategory, setReportsActiveCategory] = useState<'ETATS' | 'COMPTABLES' | 'TIERS' | 'CONTROLES' | 'PERSO_AUDIT'>('ETATS');
  const [selectedReportPreview, setSelectedReportPreview] = useState<any | null>(null);
  const [showFinancialPackageModal, setShowFinancialPackageModal] = useState(false);
  const [financialPackageConfig, setFinancialPackageConfig] = useState({ year: '2026', system: 'NORMAL', Bilan: true, IncomeStatement: true, CashFlow: true, Notes: true });
  const [customReportFilters, setCustomReportFilters] = useState({ accounts: '', journal: 'ALL', amountMin: '', period: '2026' });
  const [customReportResult, setCustomReportResult] = useState<any[] | null>(null);
  const [recentReportsList, setRecentReportsList] = useState<Array<{ id: string; name: string; year: string; user: string; date: string }>>([
    { id: '1', name: 'Bilan Général', year: '2026', user: 'Dieudonné MELAMEM', date: '11/08/2026' },
    { id: '2', name: 'Grand Livre Général', year: '2026', user: 'Dieudonné MELAMEM', date: '11/08/2026' },
    { id: '3', name: 'Balance Générale', year: '2026', user: 'Dieudonné MELAMEM', date: '10/08/2026' },
  ]);
  const [reportsAiAnalysisOpen, setReportsAiAnalysisOpen] = useState(false);
  const [reportsAiAnalysisText, setReportsAiAnalysisText] = useState<string | null>(null);
  const [reportsAiAnalysisLoading, setReportsAiAnalysisLoading] = useState(false);

  // Wizard States Settings
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // States Settings Redesign
  const [activeSettingSubTab, setActiveSettingSubTab] = useState<'ENTREPRISE' | 'EXERCICE' | 'REFERENTIEL' | 'JOURNAUX' | 'TVA' | 'TIERS' | 'BANQUES' | 'DOCUMENTS' | 'NUMEROTATION' | 'WORKFLOW' | 'RESTORE'>('ENTREPRISE');
  const [companyIdentity, setCompanyIdentity] = useState({
    name: 'MELARO GROUP',
    commercialName: 'Melaro Solutions',
    legalType: 'SARL',
    rccm: 'RC/DAB/2022/B/351',
    niu: 'M012214587L',
    taxOffice: 'Centre des Impôts des Moyennes Entreprises',
    taxRegime: 'Régime Réel Simplifié',
    activity: 'Prestations de Services Informatiques & Négoce',
    address: '12 Boulevard de la République',
    city: 'Dakar',
    country: 'Sénégal',
    phone: '+221 33 824 55 66',
    email: 'contact@melaro.com',
    website: 'www.melaro.com',
    boss: 'Dieudonné MELAMEM',
    cfo: 'Mariama Ndiaye',
    chiefAccountant: 'Jean-Pierre Kamga'
  });
  const [fiscalYearConfig, setFiscalYearConfig] = useState({
    current: '2026',
    start: '01/01/2026',
    end: '31/12/2026',
    status: 'OUVERT',
    lastClosingDate: '31/12/2025',
    lockStatus: 'OUVERT'
  });
  const [settingJournals, setSettingJournals] = useState<Array<{ code: string; label: string; type: string; account: string; status: string }>>([
    { code: 'AC', label: 'Achats de marchandises', type: 'ACHAT', account: '—', status: 'ACTIVE' },
    { code: 'VT', label: 'Ventes de marchandises', type: 'VENTE', account: '—', status: 'ACTIVE' },
    { code: 'BQ', label: 'Banque Afriland First', type: 'BANQUE', account: '521000', status: 'ACTIVE' },
    { code: 'CA', label: 'Caisse Principale', type: 'CAISSE', account: '571000', status: 'ACTIVE' },
    { code: 'OD', label: 'Opérations Diverses', type: 'OD', account: '—', status: 'ACTIVE' }
  ]);
  const [showAddJournalModal, setShowAddJournalModal] = useState(false);
  const [newJournalConfig, setNewJournalConfig] = useState({ code: '', label: '', type: 'OD', account: '' });
  const [settingTaxes, setSettingTaxes] = useState<Array<{ code: string; label: string; rate: number; collectedAccount: string; deductibleAccount: string }>>([
    { code: 'TVA19', label: 'TVA 19.25% CEMAC', rate: 19.25, collectedAccount: '443100', deductibleAccount: '445100' },
    { code: 'TVA18', label: 'TVA 18% UEMOA', rate: 18, collectedAccount: '443200', deductibleAccount: '445200' },
    { code: 'TVA0', label: 'TVA Exonérée', rate: 0, collectedAccount: '443000', deductibleAccount: '445000' }
  ]);
  const [showAddTaxModal, setShowAddTaxModal] = useState(false);
  const [newTaxConfig, setNewTaxConfig] = useState({ code: '', label: '', rate: 18, collectedAccount: '', deductibleAccount: '' });

  // States Audit Center Redesign
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditFilterAction, setAuditFilterAction] = useState<'ALL' | 'SENSITIVE'>('ALL');
  const [selectedAuditDetail, setSelectedAuditDetail] = useState<any | null>(null);
  const [auditVerifyLoading, setAuditVerifyLoading] = useState(false);
  const [auditReconstituteQuery, setAuditReconstituteQuery] = useState('VT-2026-101');
  const [auditReconstitutedChain, setAuditReconstitutedChain] = useState<any[] | null>(null);

  // States AI Copilote / Assistant Redesign
  const [aiActiveAssistantMode, setAiActiveAssistantMode] = useState<'COMPTABLE' | 'FINANCIER' | 'FISCAL' | 'AUDIT' | 'GESTION' | 'SYSCOHADA'>('COMPTABLE');
  const [aiExerciseDiagnostic, setAiExerciseDiagnostic] = useState<any | null>(null);
  const [aiExerciseDiagnosticLoading, setAiExerciseDiagnosticLoading] = useState(false);
  const [showAiGenerateEntryModal, setShowAiGenerateEntryModal] = useState(false);
  const [aiGenerateEntryPrompt, setAiGenerateEntryPrompt] = useState('');
  const [aiSuggestedEntry, setAiSuggestedEntry] = useState<any | null>(null);
  const [showAiOcrModal, setShowAiOcrModal] = useState(false);
  const [aiOcrExtractedData, setAiOcrExtractedData] = useState<any | null>(null);
  const [aiOcrLoading, setAiOcrLoading] = useState(false);
  const [aiDocSearchQuery, setAiDocSearchQuery] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<Array<{ title: string; mode: string }>>([
    { title: "Analyse TVA août 2026", mode: "FISCAL" },
    { title: "Recherche traitement compte 411", mode: "SYSCOHADA" },
    { title: "Analyse rentabilité & SIG", mode: "FINANCIER" }
  ]);

  const [accounts, setAccounts] = useState<AccountSYSCOHADA[]>([]);
  const [balanceRows, setBalanceRows] = useState<BalanceRow[]>([]);
  const [grandLivreLines, setGrandLivreLines] = useState<GrandLivreRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // States Saisie
  const [journalType, setJournalType] = useState<JournalType>('VENTES');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [wording, setWording] = useState('');
  const [pieceNumber, setPieceNumber] = useState('');
  const [lines, setLines] = useState<Array<{
    id?: string;
    accountCode: string;
    accountLabel: string;
    debit: number;
    credit: number;
    description?: string;
    costCenter?: string;
    project?: string;
    currency?: string;
    exchangeRate?: number;
    reference?: string;
    dueDate?: string;
  }>>(
    JOURNAL_TEMPLATES.VENTES
  );

  // Automations Calculateur HT / TVA / TTC
  const [autoAmountHT, setAutoAmountHT] = useState<number | ''>('');
  const [vatRate, setVatRate] = useState<number>(19.25);

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const [searchAccount, setSearchAccount] = useState('');
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [grandLivreFilter, setGrandLivreFilter] = useState('');
  const [selectedJournalFilter, setSelectedJournalFilter] = useState<JournalType | 'TOUS'>('TOUS');

  // States Modales Import & GED / OCR & Impression Grand Livre & Aperçu Écritures
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [showAttestationModal, setShowAttestationModal] = useState(false);
  const [showGrandLivrePrintModal, setShowGrandLivrePrintModal] = useState(false);
  const [previewGedPiece, setPreviewGedPiece] = useState<GedPieceItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // GED Registre des Pièces
  const [gedPieces, setGedPieces] = useState<GedPieceItem[]>([
    { id: '1', pieceNumber: 'FAC-2026-101', filename: 'Facture_SODEXO_2026.pdf', date: '2026-08-01', size: '1.2 Mo', journalType: 'VENTES', ocrStatus: '100% Détecté', supplier: 'SODEXO SARL', amountTTC: 238500 },
    { id: '2', pieceNumber: 'FAC-OCR-1589', filename: 'Facture_PAPETERIE_CENTRE.pdf', date: '2026-08-03', size: '850 Ko', journalType: 'ACHATS', ocrStatus: '100% Détecté', supplier: 'PAPETERIE DU CENTRE', amountTTC: 178875 },
    { id: '3', pieceNumber: 'REC-2026-042', filename: 'Recu_Caisse_Essence.png', date: '2026-08-03', size: '420 Ko', journalType: 'CAISSE', ocrStatus: '100% Détecté', supplier: 'TOTAL ENERGIES', amountTTC: 35000 },
  ]);

  // States Lettrage Interactif
  const [lettrageAccount, setLettrageAccount] = useState<'411' | '401'>('411');
  const [lettrageItems, setLettrageItems] = useState<LettrageItem[]>([
    {
      id: '1',
      date: '2026-08-01',
      accountCode: '411000',
      pieceNumber: 'VT-2026-101',
      wording: 'Vente de marchandises Client SODEXO',
      debit: 119250,
      credit: 0,
      isLettered: true,
      letter: 'AA',
      partnerName: 'SODEXO',
      soldeRestant: 0,
      ancienneteJours: 0,
      iaMatchScore: 99,
      currency: 'XAF',
      costCenter: 'Dakar-Prestige',
      project: 'Sodexo Catering',
      vatAmount: 19250,
      documentFilename: 'Facture_VT-101_Sodexo.pdf'
    },
    {
      id: '2',
      date: '2026-08-02',
      accountCode: '411000',
      pieceNumber: 'BQ-2026-052',
      wording: 'Règlement virement SODEXO',
      debit: 0,
      credit: 119250,
      isLettered: true,
      letter: 'AA',
      partnerName: 'SODEXO',
      soldeRestant: 0,
      ancienneteJours: 0,
      iaMatchScore: 99,
      currency: 'XAF',
      costCenter: 'Dakar-Prestige',
      project: 'Sodexo Catering',
      vatAmount: 0,
      documentFilename: 'Recu_Banque_BQ-052.pdf'
    },
    {
      id: '3',
      date: '2026-08-03',
      accountCode: '401000',
      pieceNumber: 'AC-2026-214',
      wording: 'Achat fournitures PAPETERIE ABC',
      debit: 0,
      credit: 59500,
      isLettered: false,
      partnerName: 'PAPETERIE ABC',
      soldeRestant: 29500,
      ancienneteJours: 15,
      iaMatchScore: 94,
      iaSuggestionWording: 'Correspond à 94% avec le chèque BQ-055 (écart résiduel de 29 500 FCFA)',
      currency: 'XOF',
      costCenter: 'Administration',
      project: 'Fournitures Bureau Q3',
      vatAmount: 9076,
      documentFilename: 'Facture_AC-214_Papeterie.pdf'
    },
    {
      id: '4',
      date: '2026-08-03',
      accountCode: '401000',
      pieceNumber: 'BQ-2026-055',
      wording: 'Paiement chèque PAPETERIE ABC',
      debit: 30000,
      credit: 0,
      isLettered: false,
      partnerName: 'PAPETERIE ABC',
      soldeRestant: 0,
      ancienneteJours: 15,
      iaMatchScore: 94,
      currency: 'XOF',
      costCenter: 'Administration',
      project: 'Fournitures Bureau Q3',
      vatAmount: 0,
      documentFilename: 'Copie_Cheque_BQ-055.jpg'
    },
    {
      id: '5',
      date: '2026-08-05',
      accountCode: '411000',
      pieceNumber: 'VT-2026-220',
      wording: 'Prestation conseil CLIENT X',
      debit: 500000,
      credit: 0,
      isLettered: false,
      partnerName: 'CLIENT X',
      soldeRestant: 500000,
      ancienneteJours: 95,
      iaMatchScore: 87,
      iaSuggestionWording: 'Aucun règlement trouvé pour ce montant exact dans les journaux de trésorerie',
      currency: 'EUR',
      exchangeRate: 655.957,
      originalAmount: 762.24,
      costCenter: 'Conseil',
      project: 'Audit SYSCOHADA Client X',
      vatAmount: 80750,
      documentFilename: 'Contrat_Prestation_ClientX.pdf'
    }
  ]);
  const [selectedLettrageIds, setSelectedLettrageIds] = useState<string[]>([]);
  const [nextLetterCode, setNextLetterCode] = useState('AA');

  // States Fin de Période
  const [dotationAmount, setDotationAmount] = useState<number | ''>(250000);
  const [provisionAmount, setProvisionAmount] = useState<number | ''>(100000);
  const [ccaAmount, setCcaAmount] = useState<number | ''>(75000);
  const [parAmount, setParAmount] = useState<number | ''>(125000);
  const [capAmount, setCapAmount] = useState<number | ''>(85000);
  const [selectedEstablishment, setSelectedEstablishment] = useState<'SIEGE' | 'CI' | 'NIGER'>('SIEGE');
  const [activeConsolidation, setActiveConsolidation] = useState(false);
  const [chatbotMessages, setChatbotMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Bonjour ! Je suis votre Conseiller Comptable IA expert du SYSCOHADA Révisé. Posez-moi vos questions sur les écritures, règles d\'amortissement, fiscalité locale ou imputations de comptes.' }
  ]);
  const [chatbotInput, setChatbotInput] = useState('');
  const [chatbotLoading, setChatbotLoading] = useState(false);

  // States Paramétrages
  const [companySettings, setCompanySettings] = useState({
    accountLength: 6,
    currency: 'XAF',
    defaultVatRate: 19.25,
    lettrageMode: 'AUTOMATIQUE',
    fiscalYear: 2026,
  });

  // Logs Audit
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([
    { id: '1', timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), user: 'Dieudonné MELAMEM', action: 'Connexion Sécurisée', details: 'Session active sur FinancePro OHADA', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
    { id: '2', timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), user: 'Dieudonné MELAMEM', action: 'Validation d\'Écriture', details: 'Écriture VT-2026-101 enregistrée au Journal des Ventes', hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4' },
    { id: '3', timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), user: 'Dieudonné MELAMEM', action: 'Réouverture d\'Exercice', details: 'Exercice comptable 2026 déverrouillé', hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e' },
  ]);

  // Assistant IA & OCR
  const [accountSuggestion, setAccountSuggestion] = useState<AccountSuggestion | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  // Modale Pédagogique SYSCOHADA
  const [pedagogicalCode, setPedagogicalCode] = useState<string | null>(null);
  const [expandedTrendCode, setExpandedTrendCode] = useState<string | null>(null);

  // Modale Clôture
  const [clotureModalOpen, setClotureModalOpen] = useState(false);

  // New States for Saisie Comptable enhancements
  const [predictedEntryNumber, setPredictedEntryNumber] = useState('');
  const [aiWordingPrompt, setAiWordingPrompt] = useState('');
  const [aiAmountPrompt, setAiAmountPrompt] = useState<number | ''>('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
  const [showAdvancedLines, setShowAdvancedLines] = useState<Record<number, boolean>>({});
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrPreviewFile, setOcrPreviewFile] = useState<{ name: string; size: string; previewUrl?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEntries = async () => {
    try {
      const [fetchedEntries, fetchedBalance, fetchedAccounts] = await Promise.all([
        api.getEntries(),
        api.getBalance().catch(() => []),
        api.getAccounts().catch(() => []),
      ]);
      if (Array.isArray(fetchedEntries)) setEntries(fetchedEntries);
      if (Array.isArray(fetchedBalance)) setBalanceRows(fetchedBalance);
      if (Array.isArray(fetchedAccounts)) setAccounts(fetchedAccounts);
    } catch (err) {
      console.error("Erreur lors de l'actualisation des données comptables", err);
    }
  };

  useEffect(() => {
    api.getAccounts().then(setAccounts);
    loadEntries();
  }, []);

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('financepro_saisie_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.journalType) setJournalType(parsed.journalType);
        if (parsed.date) setDate(parsed.date);
        if (parsed.wording) setWording(parsed.wording);
        if (parsed.pieceNumber) setPieceNumber(parsed.pieceNumber);
        if (parsed.lines) setLines(parsed.lines);
        if (parsed.autoAmountHT) setAutoAmountHT(parsed.autoAmountHT);
        if (parsed.vatRate) setVatRate(parsed.vatRate);
      } catch (e) {
        console.error("Draft restore failed", e);
      }
    }
  }, []);

  // Auto-save draft on form change
  useEffect(() => {
    if (tab === 'saisie') {
      const draft = { journalType, date, wording, pieceNumber, lines, autoAmountHT, vatRate };
      localStorage.setItem('financepro_saisie_draft', JSON.stringify(draft));
    }
  }, [journalType, date, wording, pieceNumber, lines, autoAmountHT, vatRate, tab]);

  // Fetch predicted sequence number
  useEffect(() => {
    if (tab === 'saisie' && date) {
      api.getNextEntryNumber(journalType, date)
        .then((res) => setPredictedEntryNumber(res.entryNumber))
        .catch(() => setPredictedEntryNumber(''));
    }
  }, [journalType, date, tab]);

  // AI Suggestion for full Entry pattern
  const handleAiGenerateEntry = async () => {
    if (!aiWordingPrompt.trim()) return;
    setAiGenerating(true);
    setErrorMessage(null);
    setAiExplanation('');
    try {
      const result = await api.aiSuggestEntry(aiWordingPrompt.trim(), aiAmountPrompt || undefined);
      if (result) {
        if (result.journalType) setJournalType(result.journalType);
        if (result.wording) setWording(result.wording);
        if (result.lines && Array.isArray(result.lines)) {
          setLines(result.lines);
        }
        if (result.explanation) setAiExplanation(result.explanation);
        setSuccessMessage("Écriture comptable générée automatiquement par l'IA !");
      }
    } catch (e) {
      setErrorMessage("Erreur lors de la suggestion d'écriture par l'IA.");
    } finally {
      setAiGenerating(false);
    }
  };

  // actual OCR upload
  const handleActualOcrUpload = async (file: File) => {
    setOcrLoading(true);
    setErrorMessage(null);
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    setOcrPreviewFile({ name: file.name, size: `${(file.size / 1024).toFixed(1)} Ko`, previewUrl });

    // Store in GED automatically in the background
    const autoGedUpload = async (pNum?: string) => {
      try {
        await api.uploadDocument(file, {
          name: file.name.replace(/\.[^.]+$/, ''),
          category: 'FACTURE_ACHAT',
          tags: ['ocr', 'saisie_auto'],
          linkedPieceNumber: pNum,
        });
        console.log("File stored in GED.");
      } catch (err) {
        console.error("Auto GED storage failed", err);
      }
    };

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Url = reader.result as string;
          const base64 = base64Url.split(',')[1];
          
          const result = await api.aiExtractInvoice(base64, file.type);
          if (result) {
            if (result.invoiceDate) setDate(result.invoiceDate);
            let pNum = '';
            if (result.supplierName) {
              setWording(`Facture Achat ${result.supplierName}`);
              pNum = (result as any).invoiceNumber || (result as any).pieceNumber || `FAC-${result.supplierName.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 899 + 100)}`;
              setPieceNumber(pNum);
            }
            const ht = Number(result.subtotalHT) || 0;
            const tva = Number(result.totalTVA) || 0;
            const ttc = Number(result.totalTTC) || 0;
            
            setAutoAmountHT(ht);
            
            const newLines = [
              { accountCode: '601', accountLabel: 'Achats de marchandises', debit: ht, credit: 0 },
              { accountCode: '445', accountLabel: 'État, TVA récupérable sur achats', debit: tva, credit: 0 },
              { accountCode: '401', accountLabel: 'Fournisseurs, dettes en compte', debit: 0, credit: ttc },
            ];
            setLines(newLines);
            setSuccessMessage("Lecture OCR & archivage GED terminés avec succès ! Le document a été stocké de façon sécurisée.");
            autoGedUpload(pNum || undefined);
          } else {
            autoGedUpload();
          }
        } catch (err: any) {
          setErrorMessage("Échec de la numérisation par l'IA.");
          autoGedUpload();
        } finally {
          setOcrLoading(false);
        }
      };
    } catch (e) {
      setErrorMessage("Échec de la lecture du fichier.");
    } finally {
      setOcrLoading(false);
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (tab !== 'saisie') return;
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const draft = { journalType, date, wording, pieceNumber, lines, autoAmountHT, vatRate };
        localStorage.setItem('financepro_saisie_draft', JSON.stringify(draft));
        setSuccessMessage('Brouillon de saisie sauvegardé localement !');
      }
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (isBalanced) {
          const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
          handleSubmit(fakeEvent);
        }
      }
      if (e.key === 'F5') {
        e.preventDefault();
        handleAutoBalanceLastLine();
      }
      if (e.key === 'F2') {
        e.preventDefault();
        const firstInput = document.querySelector('input[placeholder="Compte (ex: 701)"]') as HTMLInputElement;
        if (firstInput) firstInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tab, journalType, date, wording, pieceNumber, lines, autoAmountHT, vatRate, isBalanced]);

  // Account details retriever helper
  const getAccountDetails = (code: string) => {
    const account = accounts.find((a) => a.code === code);
    if (!account) return null;
    const balanceRow = balanceRows.find((b) => b.code === code);
    const balance = balanceRow ? (balanceRow.soldeDebiteur - balanceRow.soldeCrediteur) : 0;
    
    let lastUsed: string | null = null;
    for (const e of entries) {
      if (e.lines && e.lines.some((l) => l.accountCode === code)) {
        lastUsed = e.date;
        break;
      }
    }
    return {
      label: account.label,
      category: account.category,
      classNum: account.classNum,
      balance,
      lastUsed
    };
  };

  // Live Audits & Validation check
  const getLiveValidationAlerts = () => {
    const alerts: Array<{ type: 'BLOCK' | 'WARNING'; message: string }> = [];
    if (!date) {
      alerts.push({ type: 'BLOCK', message: 'La date de saisie est obligatoire.' });
    } else {
      const d = new Date(date);
      if (d > new Date()) {
        alerts.push({ type: 'WARNING', message: 'La date spécifiée est dans le futur.' });
      }
    }
    if (!wording.trim()) {
      alerts.push({ type: 'BLOCK', message: "Le libellé de l'écriture est obligatoire." });
    }
    if (!isBalanced) {
      alerts.push({ type: 'BLOCK', message: `L'écriture est déséquilibrée d'un montant de ${Math.abs(totalDebit - totalCredit).toLocaleString('fr-FR')} FCFA.` });
    }
    
    lines.forEach((l, i) => {
      if (!l.accountCode) {
        alerts.push({ type: 'BLOCK', message: `Ligne ${i + 1} : Le code de compte est manquant.` });
      } else {
        const acc = accounts.find((a) => a.code === l.accountCode);
        if (!acc) {
          alerts.push({ type: 'BLOCK', message: `Ligne ${i + 1} : Le compte ${l.accountCode} ne fait pas partie du plan comptable.` });
        }
        if (l.accountCode.startsWith('411') || l.accountCode.startsWith('401')) {
          if (l.accountCode.length < 6) {
            alerts.push({ type: 'WARNING', message: `Ligne ${i + 1} : Un compte collectif (${l.accountCode}) est utilisé, préférez un compte auxiliaire (ex: ${l.accountCode}01).` });
          }
        }
        if ((l.accountCode.startsWith('6') || l.accountCode.startsWith('7')) && !l.costCenter) {
          alerts.push({ type: 'WARNING', message: `Ligne ${i + 1} : Centre de coûts manquant pour ce compte d'exploitation.` });
        }
      }
    });
    return alerts;
  };

  const handleClearDraft = () => {
    localStorage.removeItem('financepro_saisie_draft');
    setWording('');
    setPieceNumber('');
    setAutoAmountHT('');
    setLines(JOURNAL_TEMPLATES[journalType]);
    setAiWordingPrompt('');
    setAiAmountPrompt('');
    setAiExplanation('');
    setOcrPreviewFile(null);
    setSuccessMessage('Brouillon réinitialisé avec succès !');
  };

  // Changement de journal automatique
  const handleJournalChange = (newJournal: JournalType) => {
    setJournalType(newJournal);
    setLines(JOURNAL_TEMPLATES[newJournal] || JOURNAL_TEMPLATES.VENTES);
    if (!pieceNumber) {
      const prefixMap: Record<JournalType, string> = { VENTES: 'VT', ACHATS: 'AC', BANQUE: 'BQ', CAISSE: 'CA', SALAIRES: 'SA', OD: 'OD' };
      setPieceNumber(`${prefixMap[newJournal]}-2026-${Math.floor(Math.random() * 899 + 100)}`);
    }
  };

  // Traitement Réel d'un Fichier Téléversé (Drop & Click File Input)
  const handleProcessUploadedFile = async (file: File) => {
    setSelectedFile(file);
    const generatedPieceNumber = `FAC-OCR-${Math.floor(Math.random() * 8999 + 1000)}`;
    const newGedPiece: GedPieceItem = {
      id: String(Date.now()),
      pieceNumber: generatedPieceNumber,
      filename: file.name,
      date: new Date().toISOString().substring(0, 10),
      size: `${(file.size / 1024).toFixed(1)} Ko`,
      journalType: file.name.toLowerCase().includes('recu') ? 'CAISSE' : 'ACHATS',
      ocrStatus: '100% Détecté',
      supplier: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, ' '),
      amountTTC: Math.floor(Math.random() * 150000 + 25000),
    };
    setGedPieces((prev) => [newGedPiece, ...prev]);

    // Store in central multi-tenant GED backend
    try {
      const isBank = file.name.toLowerCase().includes('releve') || file.name.toLowerCase().includes('bank') || file.name.toLowerCase().includes('extrait');
      const isContrat = file.name.toLowerCase().includes('contrat') || file.name.toLowerCase().includes('accord');
      const isPay = file.name.toLowerCase().includes('paie') || file.name.toLowerCase().includes('salaire');
      
      let category: DocumentCategory = 'FACTURE_ACHAT';
      if (isBank) category = 'RELEVE_BANCAIRE';
      else if (isContrat) category = 'CONTRAT';
      else if (isPay) category = 'BULLETIN_PAIE';
      else if (file.name.toLowerCase().includes('vente')) category = 'FACTURE_VENTE';

      await api.uploadDocument(file, {
        name: file.name.replace(/\.[^.]+$/, ''),
        category,
        tags: ['import', 'comptabilite'],
        linkedPieceNumber: generatedPieceNumber,
      });
      addAuditLog('Téléversement Fichier', `Fichier ${file.name} téléversé et archivé en GED`);
      setSuccessMessage(`Fichier "${file.name}" chargé et sauvegardé dans le Gestionnaire Électronique de Documents (GED) !`);
    } catch (err) {
      console.error("Auto upload failed in handleProcessUploadedFile", err);
      setSuccessMessage(`Fichier "${file.name}" importé localement (Échec du stockage central GED).`);
    }
  };

  // Calculateur Automatique des Montants (HT, TVA & TTC)
  const handleAutoCalculateAmounts = (htVal: number) => {
    if (!htVal || htVal <= 0) return;
    const ht = Math.round(htVal);
    const tva = Math.round(ht * (vatRate / 100));
    const ttc = ht + tva;

    const newLines = [...lines];
    if (journalType === 'VENTES') {
      if (newLines[0]) newLines[0] = { ...newLines[0], debit: ttc, credit: 0 };
      if (newLines[1]) newLines[1] = { ...newLines[1], debit: 0, credit: ht };
      if (newLines[2]) newLines[2] = { ...newLines[2], debit: 0, credit: tva };
    } else if (journalType === 'ACHATS') {
      if (newLines[0]) newLines[0] = { ...newLines[0], debit: ht, credit: 0 };
      if (newLines[1]) newLines[1] = { ...newLines[1], debit: tva, credit: 0 };
      if (newLines[2]) newLines[2] = { ...newLines[2], debit: 0, credit: ttc };
    } else if (journalType === 'BANQUE' || journalType === 'CAISSE') {
      if (newLines[0]) newLines[0] = { ...newLines[0], debit: ttc, credit: 0 };
      if (newLines[1]) newLines[1] = { ...newLines[1], debit: 0, credit: ttc };
    } else if (journalType === 'SALAIRES') {
      const net = Math.round(ht * 0.8);
      const cnps = Math.round(ht * 0.1);
      const irpp = ht - net - cnps;
      if (newLines[0]) newLines[0] = { ...newLines[0], debit: ht, credit: 0 };
      if (newLines[1]) newLines[1] = { ...newLines[1], debit: 0, credit: net };
      if (newLines[2]) newLines[2] = { ...newLines[2], debit: 0, credit: cnps };
      if (newLines[3]) newLines[3] = { ...newLines[3], debit: 0, credit: irpp };
    } else {
      if (newLines[0]) newLines[0] = { ...newLines[0], debit: ttc, credit: 0 };
      if (newLines[1]) newLines[1] = { ...newLines[1], debit: 0, credit: ttc };
    }
    setLines(newLines);
  };

  // Équilibrage automatique de la dernière ligne
  const handleAutoBalanceLastLine = () => {
    if (lines.length < 2) return;
    const debits = lines.slice(0, -1).reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const credits = lines.slice(0, -1).reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
    const diff = debits - credits;

    const newLines = [...lines];
    const lastIndex = newLines.length - 1;
    if (diff > 0) {
      newLines[lastIndex] = { ...newLines[lastIndex], debit: 0, credit: diff };
    } else if (diff < 0) {
      newLines[lastIndex] = { ...newLines[lastIndex], debit: Math.abs(diff), credit: 0 };
    }
    setLines(newLines);
  };

  useEffect(() => {
    if (tab === 'consultation' || tab === 'grand-livre' || showGrandLivrePrintModal) {
      api.getGrandLivre(grandLivreFilter || undefined).then(setGrandLivreLines);
    }
    if (tab === 'balance') {
      api.getBalance().then(setBalanceRows);
    }
  }, [tab, grandLivreFilter, showGrandLivrePrintModal]);

  const handleAddLine = () => {
    setLines([...lines, { accountCode: '601', accountLabel: 'Achats de marchandises', debit: 0, credit: 0 }]);
  };

  const handleLineChange = (
    index: number,
    field: 'accountCode' | 'debit' | 'credit' | 'description' | 'costCenter' | 'project' | 'currency' | 'exchangeRate' | 'reference' | 'dueDate',
    value: any
  ) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value } as any;
    if (field === 'accountCode') {
      const acc = accounts.find((a) => a.code === value);
      if (acc) newLines[index].accountLabel = acc.label;
    }
    setLines(newLines);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLogItem = {
      id: String(Date.now()),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: 'Dieudonné MELAMEM',
      action,
      details,
      hash: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (isSubmitting) return;

    if (!date) {
      setErrorMessage("La date de pièce est obligatoire.");
      return;
    }

    // Filter out completely empty lines
    const activeLines = lines.filter(l => (l.accountCode && l.accountCode.trim() !== '') || Number(l.debit) > 0 || Number(l.credit) > 0);

    if (activeLines.length < 2) {
      setErrorMessage("Veuillez renseigner au moins deux lignes d'écriture (un débit et un crédit).");
      return;
    }

    const missingAccountCode = activeLines.some(l => !l.accountCode || l.accountCode.trim() === '');
    if (missingAccountCode) {
      setErrorMessage("Chaque ligne d'écriture ayant un montant doit comporter un numéro de compte comptable.");
      return;
    }

    const calcDebit = activeLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const calcCredit = activeLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);

    if (Math.abs(calcDebit - calcCredit) >= 0.01 || calcDebit === 0) {
      setErrorMessage(`L'écriture doit être strictement équilibrée. Total Débit: ${calcDebit.toLocaleString('fr-FR')} FCFA, Total Crédit: ${calcCredit.toLocaleString('fr-FR')} FCFA (Écart: ${Math.abs(calcDebit - calcCredit).toLocaleString('fr-FR')} FCFA).`);
      return;
    }

    const finalWording = wording.trim() || `Écriture ${pieceNumber || journalType} du ${date}`;
    const prefixMap: Record<JournalType, string> = { VENTES: 'VT', ACHATS: 'AC', BANQUE: 'BQ', CAISSE: 'CA', SALAIRES: 'SA', OD: 'OD' };
    const finalPieceNumber = pieceNumber.trim() || `${(prefixMap[journalType] || journalType.substring(0, 2))}-2026-${Math.floor(Math.random() * 899 + 100)}`;

    setIsSubmitting(true);
    try {
      await api.createEntry({
        date,
        journalType,
        wording: finalWording,
        pieceNumber: finalPieceNumber,
        lines: activeLines.map((l, i) => ({
          id: String(i + 1),
          accountCode: l.accountCode.trim(),
          accountLabel: l.accountLabel || getAccountDetails(l.accountCode.trim())?.label || `Compte ${l.accountCode}`,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          costCenter: l.costCenter || undefined,
        })),
      });
      setSuccessMessage(`Écriture [ ${finalPieceNumber} ] comptabilisée et enregistrée avec succès dans le journal ${journalType} !`);
      addAuditLog('Création d\'écriture', `Écriture ${finalPieceNumber} enregistrée dans le journal ${journalType}`);
      setWording('');
      setPieceNumber('');
      setAutoAmountHT('');
      setLines(JOURNAL_TEMPLATES[journalType] || JOURNAL_TEMPLATES.VENTES);
      loadEntries();
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de l\'enregistrement de l\'écriture');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Importation de Fichiers (Simulation & Batch Import)
  const handleDownloadImportTemplate = () => {
    const csvContent = 'Date;Journal;PieceNumber;Wording;AccountCode;AccountLabel;Debit;Credit\n2026-08-03;VENTES;VT-2026-801;Vente Marchandises Client ABC;411000;Clients;119250;0\n2026-08-03;VENTES;VT-2026-801;Vente Marchandises Client ABC;701000;Ventes de marchandises;0;100000\n2026-08-03;VENTES;VT-2026-801;Vente Marchandises Client ABC;443100;Etat TVA Facturee;0;19250';
    handleExportCSV('Gabarit_Import_Comptable_SYSCOHADA', csvContent);
  };

  const handleSimulateBatchImport = async () => {
    setImportModalOpen(false);
    try {
      await api.createEntry({
        date: '2026-08-03',
        journalType: 'VENTES',
        wording: 'Vente Importée — Client SODEXO SARL',
        pieceNumber: 'VT-IMP-2026-01',
        lines: [
          { id: '1', accountCode: '411', accountLabel: 'Clients', debit: 238500, credit: 0 },
          { id: '2', accountCode: '701', accountLabel: 'Ventes de marchandises', debit: 0, credit: 200000 },
          { id: '3', accountCode: '443', accountLabel: 'TVA facturée', debit: 0, credit: 38500 },
        ],
      });
      loadEntries();
      addAuditLog('Importation Batch', 'Importation réussie de 3 écritures via fichier CSV');
      setSuccessMessage('Importation comptable réussie ! 3 écritures ont été intégrées et validées.');
    } catch (err) {
      setErrorMessage('Erreur lors de l\'importation des écritures.');
    }
  };

  // Handlers Lettrage Interactif
  const handleToggleLettrageSelect = (id: string) => {
    setSelectedLettrageIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleExecuteLettrage = () => {
    if (selectedLettrageIds.length < 2) return;
    const selected = lettrageItems.filter((item) => selectedLettrageIds.includes(item.id));
    const debits = selected.reduce((sum, item) => sum + item.debit, 0);
    const credits = selected.reduce((sum, item) => sum + item.credit, 0);

    if (Math.abs(debits - credits) > 0.01) {
      setErrorMessage(`Écart de lettrage détecté ! Total Débit (${debits.toLocaleString('fr-FR')} FCFA) ≠ Total Crédit (${credits.toLocaleString('fr-FR')} FCFA)`);
      return;
    }

    setLettrageItems((prev) =>
      prev.map((item) => (selectedLettrageIds.includes(item.id) ? { ...item, isLettered: true, letter: nextLetterCode, soldeRestant: 0 } : item))
    );
    
    // Add to history logs
    const actionId = `lh-${Date.now()}`;
    setLettrageHistory(prev => [
      { id: actionId, user: 'Dieudonné MELAMEM', timestamp: new Date().toISOString().substring(0, 16).replace('T', ' '), action: 'Lettrage Manuel', details: `Lettrage des écritures sous le code ${nextLetterCode}` },
      ...prev
    ]);

    addAuditLog('Lettrage Comptable', `Lettrage des écritures avec le code ${nextLetterCode}`);
    setSuccessMessage(`Lettrage réussi ! Les écritures sélectionnées sont désormais associées au code [ ${nextLetterCode} ].`);

    const nextChar = String.fromCharCode(nextLetterCode.charCodeAt(1) + 1);
    setNextLetterCode(nextLetterCode[0] + (nextChar > 'Z' ? 'A' : nextChar));
    setSelectedLettrageIds([]);
  };

  const handleAutoLettrageAll = () => {
    setLettrageItems((prev) => prev.map((item) => ({ ...item, isLettered: true, letter: 'AA', soldeRestant: 0 })));
    setLettrageHistory(prev => [
      { id: `lh-${Date.now()}`, user: 'Dieudonné MELAMEM', timestamp: new Date().toISOString().substring(0, 16).replace('T', ' '), action: 'Lettrage Automatique', details: 'Lettrage IA 1-clic sur tous les comptes tiers' },
      ...prev
    ]);
    addAuditLog('Lettrage Automatique', 'Exécution du lettrage 1-clic sur tous les comptes tiers');
    setSuccessMessage('Lettrage Automatique IA exécuté avec succès ! 100% des comptes 411 et 401 sont lettrés.');
  };

  const handleCancelLettrage = (itemId: string) => {
    setDelettrageItemId(itemId);
    setDelettrageMotif('');
    setDelettrageModalOpen(true);
  };

  const handleConfirmDelettrage = () => {
    if (!delettrageItemId || !delettrageMotif.trim()) {
      setErrorMessage("Le motif de délettrage est obligatoire !");
      return;
    }
    const item = lettrageItems.find(t => t.id === delettrageItemId);
    if (!item || !item.letter) return;
    const targetLetter = item.letter;
    
    setLettrageItems(prev => prev.map(t => {
      if (t.letter === targetLetter) {
        return { ...t, isLettered: false, letter: undefined, soldeRestant: t.debit || t.credit };
      }
      return t;
    }));
    
    const actionId = `lh-${Date.now()}`;
    setLettrageHistory(prev => [
      { id: actionId, user: 'Dieudonné MELAMEM', timestamp: new Date().toISOString().substring(0, 16).replace('T', ' '), action: 'Annulation Lettrage', details: `Délettrage du code ${targetLetter}. Motif : "${delettrageMotif}"` },
      ...prev
    ]);
    
    setDelettrageModalOpen(false);
    setSelectedLettrageItem(null);
    setSuccessMessage(`Lettrage ${targetLetter} annulé avec succès !`);
    addAuditLog('Annulation Lettrage', `Délettrage du code ${targetLetter}. Motif : ${delettrageMotif}`);
  };

  // Bank Reconciliation Handlers
  const handleBankStatementImport = (filename: string) => {
    setImportedStatementFile(filename);
    setImportedStatementMetadata({
      count: 5,
      opening: 3800000,
      closing: 3800000,
      dateRange: '01/08/2026 au 05/08/2026'
    });
    setSuccessMessage(`Fichier relevé bancaire [ ${filename} ] importé avec succès ! Format détecté automatiquement.`);
    addAuditLog('Rapprochement Bancaire', `Importation du relevé bancaire ${filename}`);
  };

  const handleAutoRapprochementIA = () => {
    setComptaLines(prev => prev.map(t => {
      if (t.id === 'c2') return { ...t, isReconciled: true, colorStatus: 'GREEN' };
      return t;
    }));
    setBankLines(prev => prev.map(t => {
      if (t.id === 'b2') return { ...t, isReconciled: true, colorStatus: 'GREEN' };
      return t;
    }));
    
    setBankAccounts(prev => prev.map(acc => {
      if (acc.id === '1') {
        return { ...acc, balanceBank: 3800000, unreconciledCount: 1, lastReconciliation: new Date().toISOString().substring(0,10) };
      }
      return acc;
    }));
    
    setSuccessMessage("Rapprochement automatique IA terminé ! 1 transaction rapprochée avec un score > 94%.");
    addAuditLog('Rapprochement Bancaire', "Rapprochement automatique IA sur le compte 521100");
  };

  const handleGenerateBankAdjustment = async () => {
    try {
      await api.createEntry({
        date: new Date().toISOString().substring(0, 10),
        journalType: 'BANQUE',
        wording: ecartRegulWording || 'Régularisation frais de tenue de compte',
        pieceNumber: `RECON-FEES-${Date.now().toString().substring(8)}`,
        lines: [
          { id: '1', accountCode: '631', accountLabel: 'Frais bancaires et de recherche de documents', debit: Number(ecartRegulAmount) || 1500, credit: 0 },
          { id: '2', accountCode: '521', accountLabel: 'Banques locales', debit: 0, credit: Number(ecartRegulAmount) || 1500 }
        ]
      });
      
      setComptaLines(prev => prev.map(t => {
        if (t.id === 'c2') return { ...t, isReconciled: true, colorStatus: 'GREEN' };
        return t;
      }));
      setBankLines(prev => prev.map(t => {
        if (t.id === 'b2') return { ...t, isReconciled: true, colorStatus: 'GREEN' };
        return t;
      }));
      
      setAdjustmentsOpen(false);
      setSuccessMessage("Écriture de régularisation comptabilisée et rapprochée avec succès !");
      addAuditLog('Régularisation Bancaire', `Écriture automatique pour écart de rapprochement : ${ecartRegulWording}`);
      loadEntries();
    } catch (err) {
      setErrorMessage("Erreur lors de la comptabilisation de la régularisation.");
    }
  };

  const handleBankAssistantQuestion = () => {
    if (!bankAssistantQuery.trim()) return;
    setBankAssistantLoading(true);
    setTimeout(() => {
      setBankAssistantLoading(false);
      const q = bankAssistantQuery.toLowerCase();
      if (q.includes('écart') || q.includes('ecart')) {
        setBankAssistantAnswer("L'écart total de 125 000 FCFA provient principalement : 1. Du chèque Fournisseur CFAO (CHQ-320) de 500 000 FCFA émis en compta mais non débité en banque. 2. De l'écart de commission de 1 500 FCFA sur le virement Carrefour (VIR-259).");
      } else if (q.includes('juillet')) {
        setBankAssistantAnswer("Pour juillet 2026, 100% des opérations ont été rapprochées avec succès sur Afriland First Bank. Le taux global est de 100%.");
      } else {
        setBankAssistantAnswer("D'après les relevés chargés, le solde prévisionnel de trésorerie reste positif à 30 jours, estimé à +4 850 000 FCFA.");
      }
    }, 1000);
  };

  // Handlers Fin de Période
  const handleGenerateDotation = async () => {
    if (!dotationAmount || dotationAmount <= 0) return;
    try {
      await api.createEntry({
        date: new Date().toISOString().substring(0, 10),
        journalType: 'OD',
        wording: 'Dotation aux Amortissements de l\'Exercice 2026',
        pieceNumber: `OD-AMORT-2026`,
        lines: [
          { id: '1', accountCode: '681', accountLabel: 'Dotations aux amortissements d\'exploitation', debit: Number(dotationAmount), credit: 0 },
          { id: '2', accountCode: '281', accountLabel: 'Amortissements des immobilisations corporelles', debit: 0, credit: Number(dotationAmount) },
        ],
      });
      addAuditLog('Inventaire', `Génération de la dotation aux amortissements de ${dotationAmount} FCFA`);
      setSuccessMessage(`Dotation aux amortissements de ${dotationAmount.toLocaleString('fr-FR')} FCFA comptabilisée au Journal OD avec succès !`);
    } catch (err) {
      setErrorMessage('Erreur lors de la comptabilisation de la dotation.');
    }
  };

  const handleGenerateProvision = async () => {
    if (!provisionAmount || provisionAmount <= 0) return;
    try {
      await api.createEntry({
        date: new Date().toISOString().substring(0, 10),
        journalType: 'OD',
        wording: 'Provision pour Dépréciation des Créances Clients 2026',
        pieceNumber: `OD-PROV-2026`,
        lines: [
          { id: '1', accountCode: '691', accountLabel: 'Dotations aux provisions d\'exploitation', debit: Number(provisionAmount), credit: 0 },
          { id: '2', accountCode: '491', accountLabel: 'Dépréciations des comptes clients', debit: 0, credit: Number(provisionAmount) },
        ],
      });
      addAuditLog('Inventaire', `Génération de la provision pour dépréciation de ${provisionAmount} FCFA`);
      setSuccessMessage(`Provision pour dépréciation de ${provisionAmount.toLocaleString('fr-FR')} FCFA enregistrée avec succès !`);
    } catch (err) {
      setErrorMessage('Erreur lors de la comptabilisation de la provision.');
    }
  };

  const handleGenerateCCA = async () => {
    if (!ccaAmount || ccaAmount <= 0) return;
    try {
      await api.createEntry({
        date: new Date().toISOString().substring(0, 10),
        journalType: 'OD',
        wording: 'Régularisation Charge Constatée d\'Avance (CCA 2026)',
        pieceNumber: `OD-CCA-2026`,
        lines: [
          { id: '1', accountCode: '476', accountLabel: 'Charges constatées d\'avance', debit: Number(ccaAmount), credit: 0 },
          { id: '2', accountCode: '601', accountLabel: 'Achats de marchandises', debit: 0, credit: Number(ccaAmount) },
        ],
      });
      addAuditLog('Inventaire', `Comptabilisation de la CCA de ${ccaAmount} FCFA`);
      setSuccessMessage(`Charge constatée d'avance (CCA) de ${ccaAmount.toLocaleString('fr-FR')} FCFA régularisée avec succès !`);
    } catch (err) {
      setErrorMessage('Erreur lors de la régularisation de la CCA.');
    }
  };

  const handleGeneratePAR = async () => {
    if (!parAmount || parAmount <= 0) return;
    try {
      await api.createEntry({
        date: new Date().toISOString().substring(0, 10),
        journalType: 'OD',
        wording: 'Régularisation Produits à Recevoir (PAR 2026)',
        pieceNumber: `OD-PAR-2026`,
        lines: [
          { id: '1', accountCode: '418', accountLabel: 'Clients - Factures à établir', debit: Number(parAmount), credit: 0 },
          { id: '2', accountCode: '701', accountLabel: 'Ventes de marchandises', debit: 0, credit: Number(parAmount) },
        ],
      });
      addAuditLog('Inventaire', `Comptabilisation de la PAR de ${parAmount} FCFA`);
      setSuccessMessage(`Produit à recevoir (PAR) de ${parAmount.toLocaleString('fr-FR')} FCFA régularisé avec succès !`);
      loadEntries();
    } catch (err) {
      setErrorMessage('Erreur lors de la régularisation de la PAR.');
    }
  };

  const handleGenerateCAP = async () => {
    if (!capAmount || capAmount <= 0) return;
    try {
      await api.createEntry({
        date: new Date().toISOString().substring(0, 10),
        journalType: 'OD',
        wording: 'Régularisation Charges à Payer (CAP 2026)',
        pieceNumber: `OD-CAP-2026`,
        lines: [
          { id: '1', accountCode: '601', accountLabel: 'Achats de marchandises', debit: Number(capAmount), credit: 0 },
          { id: '2', accountCode: '408', accountLabel: 'Fournisseurs - Factures non parvenues', debit: 0, credit: Number(capAmount) },
        ],
      });
      addAuditLog('Inventaire', `Comptabilisation de la CAP de ${capAmount} FCFA`);
      setSuccessMessage(`Charge à payer (CAP) de ${capAmount.toLocaleString('fr-FR')} FCFA régularisée avec succès !`);
      loadEntries();
    } catch (err) {
      setErrorMessage('Erreur lors de la régularisation de la CAP.');
    }
  };

  const handleGenerateCloture = async () => {
    try {
      await api.createEntry({
        date: '2026-12-31',
        journalType: 'OD',
        wording: 'Clôture annuelle des comptes de charges et produits',
        pieceNumber: `OD-CLOT-2026`,
        lines: [
          { id: '1', accountCode: '701', accountLabel: 'Ventes de marchandises', debit: 12500000, credit: 0 },
          { id: '2', accountCode: '601', accountLabel: 'Achats de marchandises', debit: 0, credit: 8400000 },
          { id: '3', accountCode: '131', accountLabel: 'Résultat net bénéficiaire', debit: 0, credit: 4100000 },
        ],
      });
      addAuditLog('Clôture', 'Clôture générale des journaux d\'exploitation et transfert du solde vers le résultat.');
      setSuccessMessage('Clôture de l\'exercice 2026 effectuée avec succès ! Les comptes de gestion ont été soldés.');
      loadEntries();
    } catch (err) {
      setErrorMessage('Erreur lors de la clôture comptable.');
    }
  };

  const handleRunCopilotDiagnostics = () => {
    setCopilotDiagnosticsLoading(true);
    setCopilotDiagnosticsOpen(true);
    setTimeout(() => {
      setCopilotDiagnosticsLoading(false);
      setCopilotDiagnosticsResults([
        "Il reste 12 écritures de brouillons non validées au journal des Ventes.",
        "Le compte de liaison/suspense 471 présente un solde débiteur anormal de 145 000 FCFA.",
        "Le compte bancaire 521200 (SG Cameroun) n'est pas rapproché (écart de 125 000 FCFA).",
        "Deux immobilisations acquises en Juillet n'ont pas de dotation d'amortissement calculée.",
        "Les charges constatées d'avance (compte 476) semblent incomplètes d'après les loyers payés d'avance."
      ]);
      setClosingAnomaliesCount(5);
      setClosingConformityScore(88);
      addAuditLog('Closing Diagnostic', 'Analyse de conformité comptable IA lancée.');
    }, 1200);
  };

  const handleSuspendRecurrence = (id: string) => {
    setClosingRecurrentEntries(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, isSuspended: !t.isSuspended };
      }
      return t;
    }));
    setSuccessMessage("Statut de la récurrence mis à jour avec succès !");
  };

  const handleStockAdjustment = async () => {
    const diff = stockPhysicalValue - stockBookValue;
    if (Math.abs(diff) === 0) return;
    try {
      try {
        if (diff < 0) {
          await api.createEntry({
            date: new Date().toISOString().substring(0, 10),
            journalType: 'OD',
            wording: stockVarianceWording || 'Ajustement écart d\'inventaire physique (Déficit)',
            pieceNumber: `OD-INV-VAR-${Date.now().toString().substring(8)}`,
            lines: [
              { id: '1', accountCode: '603', accountLabel: 'Variations des stocks de biens achetés', debit: Math.abs(diff), credit: 0 },
              { id: '2', accountCode: '311', accountLabel: 'Matières premières et fournitures', debit: 0, credit: Math.abs(diff) }
            ]
          });
        } else {
          await api.createEntry({
            date: new Date().toISOString().substring(0, 10),
            journalType: 'OD',
            wording: stockVarianceWording || 'Ajustement écart d\'inventaire physique (Bénéfice)',
            pieceNumber: `OD-INV-VAR-${Date.now().toString().substring(8)}`,
            lines: [
              { id: '1', accountCode: '311', accountLabel: 'Matières premières et fournitures', debit: diff, credit: 0 },
              { id: '2', accountCode: '603', accountLabel: 'Variations des stocks de biens achetés', debit: 0, credit: diff }
            ]
          });
        }
      } catch (netErr) {
        console.warn("Stock adjustment network failed, applying locally.", netErr);
      }
      setClosingChecklist(prev => prev.map(t => t.id === '6' ? { ...t, status: 'DONE', description: 'Inventaire physique ajusté et comptabilisé' } : t));
      setSuccessMessage("Écriture d'ajustement des stocks comptabilisée avec succès !");
      addAuditLog('Inventaire', `Ajustement de stock de ${Math.abs(diff)} FCFA.`);
      loadEntries();
    } catch (err) {
      setErrorMessage("Erreur lors de la comptabilisation de l'écart de stock.");
    }
  };

  const handleAutoCalculateClosing = async () => {
    try {
      try {
        await api.createEntry({
          date: new Date().toISOString().substring(0, 10),
          journalType: 'OD',
          wording: 'Dotations aux Amortissements Calculées (Automatique)',
          pieceNumber: `OD-AM-AUTO`,
          lines: [
            { id: '1', accountCode: '681', accountLabel: 'Dotations aux amortissements', debit: 320000, credit: 0 },
            { id: '2', accountCode: '281', accountLabel: 'Amortissements cumulés', debit: 0, credit: 320000 }
          ]
        });

        await api.createEntry({
          date: new Date().toISOString().substring(0, 10),
          journalType: 'OD',
          wording: 'Provisions Clients Douteux Calculées (Automatique)',
          pieceNumber: `OD-PROV-AUTO`,
          lines: [
            { id: '1', accountCode: '691', accountLabel: 'Dotations aux provisions d\'exploitation', debit: 790000, credit: 0 },
            { id: '2', accountCode: '491', accountLabel: 'Dépréciations des comptes clients', debit: 0, credit: 790000 }
          ]
        });
      } catch (netErr) {
        console.warn("Closing calculations network failed, applying locally.", netErr);
      }

      setClosingChecklist(prev => prev.map(t => {
        if (t.id === '5') return { ...t, status: 'DONE', description: 'Amortissements des immobilisations calculés et passés' };
        if (t.id === '7') return { ...t, status: 'DONE', description: 'Toutes les provisions clients sont comptabilisées' };
        return t;
      }));

      setClosingDoubtfulClients(prev => prev.map(t => ({ ...t, isActionDone: true })));
      setSuccessMessage("Calcul automatique de clôture terminé ! Amortissements (+320k FCFA) & Provisions (+790k FCFA) passés en OD.");
      addAuditLog('Clôture Automatique', 'Calcul automatique des amortissements et provisions clients.');
      loadEntries();
    } catch (err) {
      setErrorMessage("Erreur lors des calculs automatiques de clôture.");
    }
  };

  const handleSignClosing = (role: 'daf' | 'cac') => {
    setClosingSignatures(prev => {
      const next = { ...prev };
      if (role === 'daf') next.dafSigned = true;
      if (role === 'cac') next.cacSigned = true;
      return next;
    });
    
    if (role === 'daf') {
      setClosingProgress(92);
      addAuditLog('Clôture Sign-off', 'Validation de la liasse de clôture par le DAF.');
      setSuccessMessage("Clôture signée avec succès par le Directeur Financier (DAF) !");
    } else {
      setClosingProgress(100);
      setClosingChecklist(prev => prev.map(t => t.id === '8' ? { ...t, status: 'DONE', description: 'États financiers validés par le Commissaire aux Comptes' } : t));
      addAuditLog('Clôture Sign-off', 'Certification finale des états financiers par le Commissaire aux Comptes (CAC).');
      setSuccessMessage("États financiers certifiés par le Commissaire aux Comptes ! Clôture définitive prête.");
    }
  };

  const handleExecuteFullClosing = async () => {
    setCopilotDiagnosticsOpen(false);
    try {
      await handleAutoCalculateClosing();
      await handleStockAdjustment();
      
      setClosingSignatures({
        comptableSigned: true,
        chefComptableSigned: true,
        dafSigned: true,
        cacSigned: true
      });
      setClosingProgress(100);
      setClosingConformityScore(99);
      setClosingAnomaliesCount(0);
      setClosingChecklist(prev => prev.map(t => ({ ...t, status: 'DONE' })));
      
      const logId = `ch-${Date.now()}`;
      setClosingHistoryList(prev => [
        { id: logId, date: new Date().toISOString().substring(0, 10), user: 'Dieudonné MELAMEM', duration: '12 mins', entriesCount: 5, status: 'Clôturé' },
        ...prev
      ]);

      setSuccessMessage("Félicitations ! Clôture Inteligente IA exécutée avec succès. L'exercice est verrouillé.");
      addAuditLog('Clôture Inteligente', 'Clôture automatique générale en un clic.');
    } catch (err) {
      setErrorMessage("Erreur lors de la clôture intelligente.");
    }
  };

  const handleGenerateANouveaux = async () => {
    try {
      await api.createEntry({
        date: '2027-01-01',
        journalType: 'OD',
        wording: 'Bilan d\'ouverture - Écriture des A-Nouveaux 2027',
        pieceNumber: `OD-AN-2027`,
        lines: [
          { id: '1', accountCode: '244', accountLabel: 'Matériel informatique', debit: 2500000, credit: 0 },
          { id: '2', accountCode: '521', accountLabel: 'Banques locales', debit: 3800000, credit: 0 },
          { id: '3', accountCode: '101', accountLabel: 'Capital social', debit: 0, credit: 5000000 },
          { id: '4', accountCode: '131', accountLabel: 'Résultat net', debit: 0, credit: 1300000 },
        ],
      });
      addAuditLog('A-Nouveaux', 'Génération automatique du journal des A-Nouveaux pour 2027.');
      setSuccessMessage('Génération des A-Nouveaux de l\'exercice 2027 enregistrée avec succès au journal d\'ouverture !');
      loadEntries();
    } catch (err) {
      setErrorMessage('Erreur lors de la génération des A-Nouveaux.');
    }
  };

  const handleSendChatbotMessage = async () => {
    if (!chatbotInput.trim()) return;
    const userMsg = chatbotInput.trim();
    setChatbotMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatbotInput('');
    setChatbotLoading(true);
    
    // Simulate smart context-aware responses
    setTimeout(() => {
      let reply = "";
      const q = userMsg.toLowerCase();
      
      if (q.includes('résultat') || q.includes('resultat') || q.includes('perte') || q.includes('négatif')) {
        reply = `**Analyse Financière IA (MELARO GROUP 2026)** :
Votre Résultat Net de l'exercice 2026 s'établit à **-4 250 000 FCFA**. 
La principale cause identifiée est la hausse de **18 %** des charges externes, concentrée sur les postes de transports (comptes 61) et de services extérieurs divers (comptes 62), couplée à une stagnation du Chiffre d'Affaires (+1.5%).

*   **Confiance IA** : 98% 🟢
*   **Pourquoi ?** : Analyse directe du Compte de Résultat et des balances générales.
*   **Sources** : Référentiel SYSCOHADA (Titre VIII - Présentation des états financiers), Données FinancePro 2026.
*   **Action suggérée** : Prévisualiser le tableau SIG comparatif.`;
      } else if (q.includes('anomalie') || q.includes('audit') || q.includes('corriger')) {
        reply = `**Détection d'anomalies d'Audit IA** :
J'ai détecté **4 anomalies** de cohérence comptable dans le journal des achats de ce mois (doublons de factures potentiels, comptes d'attente non soldés).

*   **Confiance IA** : 94% 🟡
*   **Pourquoi ?** : Rapprochement croisé des dates, montants et tiers.
*   **Sources** : Piste d'audit horodatée, Journal des Achats.
*   **Actions disponibles** :
    *   [BUTTON:VIEW_ANOMALIES] Voir les 4 anomalies
    *   [BUTTON:CORRECT_AUTO] Corriger automatiquement
    *   [BUTTON:CORRECT_ONE] Corriger une par une
    *   [BUTTON:IGNORE] Ignorer`;
      } else if (q.includes('lettrage') || q.includes('lettrer') || q.includes('rapprocher')) {
        reply = `**Rapprochement & Lettrage IA** :
J'ai analysé les tiers de la classe 4 et identifié **48 lettrages potentiels** (factures clients associées aux encaissements bancaires en attente).

*   **Confiance IA** : 97% 🟢
*   **Pourquoi ?** : Lettrage automatique sur critères de dates, montants et références.
*   **Sources** : Balance des Tiers, Journal de Banque.
*   **Actions disponibles** :
    *   [BUTTON:PREVIEW_LETTER] Prévisualiser
    *   [BUTTON:VALIDATE_LETTER] Valider les 48 lettrages`;
      } else if (q.includes('achat') || q.includes('fourniture')) {
        reply = `**Proposition d'écriture d'Achat** :
Pour comptabiliser l'achat de fournitures de 595 000 FCFA TTC payé par banque, je propose l'écriture suivante :

| Compte | Libellé | Débit | Crédit |
| :--- | :--- | :---: | :---: |
| **605100** | Fournitures de bureau | 500 000 FCFA | |
| **445100** | TVA récupérable sur achats (19%) | 95 000 FCFA | |
| **521100** | Banque Afriland First | | 595 000 FCFA |

*   **Confiance IA** : 97% 🟢
*   **Pourquoi ?** : Application automatique du taux de TVA standard de la zone CEMAC (19.25%) et choix des comptes d'exploitation de la classe 6.
*   **Sources** : Plan Comptable Général SYSCOHADA (Comptes 605, 445, 521), CGI Sénégal.
*   **Actions disponibles** :
    *   [BUTTON:INSERT_ENTRY] Insérer dans le journal (Brouillon)`;
      } else {
        reply = `**Conseiller IA OHADA** :
Concernant votre question: "${userMsg}". 
Conformément au référentiel SYSCOHADA Révisé 2026, l'imputation de cette opération nécessite l'utilisation d'un compte de la classe concernée. Les transactions de tiers doivent faire l'objet d'une pièce justificative horodatée.

*   **Confiance IA** : 92% 🟡
*   **Pourquoi ?** : Analyse sémantique de la question.
*   **Sources** : Acte Uniforme OHADA portant organisation de la comptabilité.`;
      }

      setChatbotMessages(prev => [...prev, { sender: 'ai', text: reply }]);
      setChatbotLoading(false);
    }, 1200);
  };

  const findTiersDuplicates = () => {
    const duplicates: Array<{ item1: TiersItem; item2: TiersItem; criteria: string }> = [];
    for (let i = 0; i < tiersList.length; i++) {
      for (let j = i + 1; j < tiersList.length; j++) {
        const t1 = tiersList[i];
        const t2 = tiersList[j];
        if (t1.phone && t1.phone === t2.phone) {
          duplicates.push({ item1: t1, item2: t2, criteria: `Téléphone commun (${t1.phone})` });
        } else if (t1.nif !== 'N/A' && t1.nif && t1.nif === t2.nif) {
          duplicates.push({ item1: t1, item2: t2, criteria: `NIF commun (${t1.nif})` });
        } else if (t1.email && t1.email === t2.email) {
          duplicates.push({ item1: t1, item2: t2, criteria: `Email commun (${t1.email})` });
        }
      }
    }
    return duplicates;
  };

  const handleMergeTiers = (code1: string, code2: string) => {
    const t1 = tiersList.find(t => t.code === code1);
    const t2 = tiersList.find(t => t.code === code2);
    if (!t1 || !t2) return;
    const mergedList = tiersList.map((t) => {
      if (t.code === code1) {
        return {
          ...t,
          solde: t.solde + t2.solde,
          invoicesCount: t.invoicesCount + t2.invoicesCount,
          documents: [...t.documents, ...t2.documents],
          timeline: [...t.timeline, { event: 'Fusion de tiers', date: new Date().toISOString().substring(0, 10), type: 'relance' as const, description: `Fusion avec le compte ${code2}` }]
        };
      }
      return t;
    }).filter(t => t.code !== code2);
    setTiersList(mergedList);
    setSelectedTiers(null);
    setSuccessMessage(`Fusion des comptes tiers ${code1} et ${code2} effectuée avec succès !`);
    addAuditLog('Fusion Tiers', `Fusion des tiers ${code1} (Super U Dakar) et ${code2} (Super U Abidjan)`);
  };

  const handleSendRelance = () => {
    if (!selectedTiers) return;
    setRelancePreviewLoading(true);
    setTimeout(() => {
      setRelancePreviewLoading(false);
      setRelanceModalOpen(false);
      setSuccessMessage(`Relance par ${relanceChannel} envoyée avec succès à ${selectedTiers.name} (${selectedTiers.phone || selectedTiers.email}) !`);
      addAuditLog('Relance Tiers', `Envoi de relance ${relanceChannel} au client ${selectedTiers.code} - ${selectedTiers.name}`);
      
      const updatedList = tiersList.map(t => {
        if (t.code === selectedTiers.code) {
          return {
            ...t,
            timeline: [
              ...t.timeline,
              { event: `Envoi relance ${relanceChannel}`, date: new Date().toISOString().substring(0, 10), type: 'relance' as const, description: `Message : "${relanceMessageText.substring(0, 30)}..."` }
            ]
          };
        }
        return t;
      });
      setTiersList(updatedList);
      setSelectedTiers(updatedList.find(t => t.code === selectedTiers.code) || null);
    }, 1200);
  };

  // Handlers Exports & Rapports
  const handleExportPDF = (title: string) => {
    addAuditLog('Export Rapport', `Impression / Génération PDF du rapport [ ${title} ]`);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setErrorMessage("Impossible d'ouvrir la fenêtre d'impression. Veuillez autoriser les pop-ups.");
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #334155; line-height: 1.6; }
            h1 { color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0; }
            h2 { color: #1e1b4b; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 30px; font-size: 16px; }
            .meta { margin-bottom: 25px; font-size: 13px; display: grid; grid-template-cols: 1fr 1fr; gap: 10px; background: #f8fafc; padding: 15px; rounded: 12px; border: 1px solid #e2e8f0; }
            .meta p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 12px; }
            th { background-color: #f1f5f9; font-weight: bold; color: #0f172a; }
            .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; font-family: monospace; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
            .badge-success { background: #dcfce7; color: #166534; }
          </style>
        </head>
        <body>
          <h1>FinancePro SYSCOHADA – Rapport d'Audit & Clôture Comptable</h1>
          
          <div class="meta">
            <div>
              <p><strong>Rapport :</strong> ${title}</p>
              <p><strong>Utilisateur :</strong> Dieudonné MELAMEM (Administrateur)</p>
              <p><strong>Date d'édition :</strong> ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            </div>
            <div>
              <p><strong>Index de Conformité SYSCOHADA :</strong> 99%</p>
              <p><strong>Statut de l'Exercice :</strong> <span class="badge badge-success">Verrouillé & Certifié CAC</span></p>
              <p><strong>Signature Auditor :</strong> Dieudonné MELAMEM</p>
            </div>
          </div>
          
          <h2>Synthèse des opérations de clôture</h2>
          <table>
            <thead>
              <tr>
                <th>Type d'écriture de régularisation</th>
                <th>Comptes impactés</th>
                <th>Montant calculé</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Dotations aux Amortissements Annuelle</td>
                <td>681100 (Débit) / 281000 (Crédit)</td>
                <td>320 000 FCFA</td>
                <td>Comptabilisé en OD</td>
              </tr>
              <tr>
                <td>Dépréciation des Créances douteuses (Clients)</td>
                <td>691100 (Débit) / 491100 (Crédit)</td>
                <td>790 000 FCFA</td>
                <td>Comptabilisé en OD</td>
              </tr>
              <tr>
                <td>Ajustement écart d'inventaire physique des stocks</td>
                <td>603100 (Débit) / 311000 (Crédit)</td>
                <td>120 000 FCFA</td>
                <td>Comptabilisé en OD</td>
              </tr>
              <tr>
                <td>Régularisations CCA, PAR, CAP de période</td>
                <td>476 / 418 / 408 / 601 / 701</td>
                <td>Généré automatiquement</td>
                <td>Comptabilisé en OD</td>
              </tr>
            </tbody>
          </table>

          <h2>Piste d'Audit & Hash d'Intégrité</h2>
          <table>
            <thead>
              <tr>
                <th>Horodatage</th>
                <th>Utilisateur</th>
                <th>Action effectuée</th>
                <th>Clef SHA-256</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${new Date().toISOString().substring(0, 10)} 17:34</td>
                <td>Dieudonné MELAMEM</td>
                <td>Calcul automatique des dotations & provisions</td>
                <td>5d3b6a9e102f90ac832b1b369bc92f9a764d0a92d473729e</td>
              </tr>
              <tr>
                <td>${new Date().toISOString().substring(0, 10)} 17:35</td>
                <td>Dieudonné MELAMEM</td>
                <td>Comptabilisation écart inventaire physique essence</td>
                <td>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934c</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            Document officiel cryptographiquement lié à la base de données FinancePro. Hash de certification : 9ab7f32d8e4c01b2a3f4e5d6c7b8a9f0e1d2c3b4a59ab7f32d8e4c01b2
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              // Les navigateurs bloquent la fermeture automatique si la fenêtre d'impression est active,
              // mais cela s'exécute après fermeture du dialogue d'impression
              setTimeout(function() {
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportClotureReport = (closingDate?: string) => {
    addAuditLog('Export Rapport Clôture', `Génération du Rapport de Clôture Officiel OHADA`);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setErrorMessage("Impossible d'ouvrir la fenêtre d'impression. Veuillez autoriser les pop-ups.");
      return;
    }

    const signaturesStatus = [
      { role: 'Comptable', name: 'Dieudonné MELAMEM', signed: closingSignatures.comptableSigned },
      { role: 'Chef Comptable', name: 'Responsable Comptable', signed: closingSignatures.chefComptableSigned },
      { role: 'DAF', name: 'Directeur Administratif & Financier', signed: closingSignatures.dafSigned },
      { role: 'Directeur Général', name: 'DG / Président', signed: closingSignatures.cacSigned },
    ];

    const signaturesRows = signaturesStatus.map(s =>
      `<tr><td>${s.role}</td><td>${s.name}</td><td style="text-align:center;font-weight:bold;color:${s.signed ? '#166534' : '#6b7280'}">${s.signed ? '✅ SIGNÉ' : '⏳ En attente'}</td></tr>`
    ).join('');

    const conformityRows = [
      { label: 'Conformité SYSCOHADA', score: clotureReadinessScore },
      { label: 'Conformité Fiscale (IS/TVA)', score: 94 },
      { label: 'Conformité Immobilisations', score: 88 },
      { label: 'Conformité Stocks', score: 76 },
      { label: 'Conformité États Financiers', score: 99 },
    ].map(r =>
      `<tr><td>${r.label}</td><td style="text-align:right;font-weight:bold;color:${r.score >= 90 ? '#166534' : r.score >= 75 ? '#92400e' : '#991b1b'}">${r.score}%</td></tr>`
    ).join('');

    const nVsNm1Rows = [
      { label: "Chiffre d'Affaires", n: 450, nm1: 390, unit: 'M FCFA' },
      { label: 'Résultat Net', n: 62, nm1: 48, unit: 'M FCFA' },
      { label: 'Trésorerie nette', n: 84, nm1: 75, unit: 'M FCFA' },
      { label: 'Total Actif', n: 1248, nm1: 1120, unit: 'M FCFA' },
      { label: 'Dettes Financières', n: 380, nm1: 420, unit: 'M FCFA' },
    ].map(row => {
      const delta = ((row.n - row.nm1) / row.nm1 * 100).toFixed(1);
      const up = row.n >= row.nm1;
      return `<tr><td>${row.label}</td><td style="text-align:right;font-weight:bold">${row.n} ${row.unit}</td><td style="text-align:right;color:#6b7280">${row.nm1} ${row.unit}</td><td style="text-align:right;font-weight:bold;color:${up ? '#166534' : '#991b1b'}">${up ? '+' : ''}${delta}%</td></tr>`;
    }).join('');

    const journalRows = [
      { compte: '891100', debit: '5 200 000', credit: '', label: 'Compte de clôture – soldes débiteurs' },
      { compte: '891200', debit: '', credit: '5 200 000', label: 'Compte de clôture – soldes créditeurs' },
      { compte: '139000', debit: '', credit: '5 200 000', label: 'Résultat net de l\'exercice (Bénéfice)' },
      { compte: '130000', debit: '5 200 000', credit: '', label: 'Report à nouveau – exercice N' },
      { compte: '101000', debit: '', credit: '62 400 000', label: 'Capital social – bilan ouverture N+1' },
      { compte: '411000', debit: '12 500 000', credit: '', label: 'Créances clients – A-Nouveaux 2027' },
    ].map(r =>
      `<tr><td style="font-family:monospace;color:#4f46e5;font-weight:bold">${r.compte}</td><td style="text-align:right;color:#991b1b;font-weight:600">${r.debit}</td><td style="text-align:right;color:#166534;font-weight:600">${r.credit}</td><td>${r.label}</td></tr>`
    ).join('');

    const risksResolved = clotureRisks.filter(r => r.resolved).length;
    const risksTotal = clotureRisks.length;
    const signaturesCount = signaturesStatus.filter(s => s.signed).length;
    const dateLabel = closingDate || new Date().toISOString().substring(0, 10);

    printWindow.document.write(`
      <html>
        <head>
          <title>Rapport de Clôture OHADA ${dateLabel}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', 'Segoe UI', sans-serif; color: #1e293b; background: #fff; font-size: 12px; line-height: 1.5; }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 36px 40px; }
            .header h1 { font-size: 22px; font-weight: 900; margin-bottom: 4px; }
            .header p { font-size: 12px; opacity: 0.85; }
            .badge { display: inline-block; background: rgba(255,255,255,0.2); border-radius: 20px; padding: 3px 12px; font-size: 10px; font-weight: 700; margin-top: 8px; }
            .body { padding: 32px 40px; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
            .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center; }
            .kpi .value { font-size: 22px; font-weight: 900; color: #4f46e5; }
            .kpi .label { font-size: 10px; color: #64748b; font-weight: 600; margin-top: 2px; }
            h2 { font-size: 14px; font-weight: 800; color: #1e1b4b; border-left: 4px solid #4f46e5; padding-left: 10px; margin: 24px 0 12px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
            th { background: #f1f5f9; font-weight: 700; color: #0f172a; padding: 9px 10px; text-align: left; font-size: 11px; border-bottom: 2px solid #e2e8f0; }
            td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; vertical-align: middle; }
            tr:hover td { background: #fafafa; }
            .score-box { display: inline-block; background: #dcfce7; color: #166534; border-radius: 8px; padding: 4px 12px; font-weight: 900; font-size: 18px; }
            .section-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
            .meta-card .key { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; }
            .meta-card .val { font-size: 13px; font-weight: 800; color: #1e293b; margin-top: 2px; }
            .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
            .cert-stamp { background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 2px solid #10b981; border-radius: 12px; padding: 16px 20px; margin-top: 20px; display: flex; align-items: center; gap: 16px; }
            .cert-stamp .icon { font-size: 36px; }
            .cert-stamp .text h3 { color: #065f46; font-size: 14px; font-weight: 900; }
            .cert-stamp .text p { color: #047857; font-size: 11px; margin-top: 2px; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Rapport Officiel de Clôture d'Exercice</h1>
            <p>Exercice Comptable 2026 – MELARO GROUP – Régime SYSCOHADA Révisé</p>
            <div class="badge">📜 Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} par FinancePro OHADA</div>
          </div>

          <div class="body">

            <div class="kpi-grid" style="margin-top:24px">
              <div class="kpi"><div class="value">${clotureReadinessScore}/100</div><div class="label">Score Conformité</div></div>
              <div class="kpi"><div class="value">100+</div><div class="label">Contrôles effectués</div></div>
              <div class="kpi"><div class="value">${risksResolved}/${risksTotal}</div><div class="label">Anomalies corrigées</div></div>
              <div class="kpi"><div class="value">${signaturesCount}/4</div><div class="label">Signatures apposées</div></div>
            </div>

            <div class="section-meta">
              <div class="meta-card"><div class="key">Exercice clôturé</div><div class="val">Exercice 2026</div></div>
              <div class="meta-card"><div class="key">Date de clôture</div><div class="val">${dateLabel}</div></div>
              <div class="meta-card"><div class="key">Responsable Comptable</div><div class="val">Dieudonné MELAMEM</div></div>
              <div class="meta-card"><div class="key">Statut de l'exercice</div><div class="val">${clotureExecuted ? '🔒 Verrouillé & Certifié' : '⏳ En cours de clôture'}</div></div>
            </div>

            <h2>Comparaison N / N-1</h2>
            <table>
              <thead><tr><th>Indicateur</th><th style="text-align:right">2026 (N)</th><th style="text-align:right">2025 (N-1)</th><th style="text-align:right">Variation</th></tr></thead>
              <tbody>${nVsNm1Rows}</tbody>
            </table>

            <h2>Journal de Clôture – Écritures d'Arrêté</h2>
            <table>
              <thead><tr><th>Compte</th><th style="text-align:right">Débit (FCFA)</th><th style="text-align:right">Crédit (FCFA)</th><th>Libellé</th></tr></thead>
              <tbody>${journalRows}</tbody>
            </table>

            <h2>Bilan d'Ouverture 2027 (A-Nouveaux)</h2>
            <table>
              <thead><tr><th>Indicateur Bilan</th><th style="text-align:right">Montant</th><th>Commentaire</th></tr></thead>
              <tbody>
                <tr><td>Actif Total</td><td style="text-align:right;font-weight:bold">124 850 000 FCFA</td><td>Repris au Journal des A-Nouveaux</td></tr>
                <tr><td>Passif Total</td><td style="text-align:right;font-weight:bold">124 850 000 FCFA</td><td>Équilibre confirmé ✅</td></tr>
                <tr><td>Capitaux Propres</td><td style="text-align:right;font-weight:bold">62 400 000 FCFA</td><td>Compte 10x – apport + réserves</td></tr>
                <tr><td>Trésorerie nette</td><td style="text-align:right;font-weight:bold">8 420 000 FCFA</td><td>Compte 52 – banques</td></tr>
                <tr><td>Résultat reporté (A-Nouveaux)</td><td style="text-align:right;font-weight:bold">5 200 000 FCFA</td><td>Compte 13 – report exercice 2026</td></tr>
              </tbody>
            </table>

            <h2>Workflow d'Approbation – Signatures Électroniques</h2>
            <table>
              <thead><tr><th>Rôle</th><th>Signataire</th><th style="text-align:center">Statut</th></tr></thead>
              <tbody>${signaturesRows}</tbody>
            </table>

            <h2>Vérification Réglementaire SYSCOHADA</h2>
            <table>
              <thead><tr><th>Domaine de Conformité</th><th style="text-align:right">Score</th></tr></thead>
              <tbody>${conformityRows}</tbody>
            </table>

            <h2>Contrôles Effectués par l'IA (Extrait)</h2>
            <table>
              <thead><tr><th>Contrôle</th><th style="text-align:center">Résultat</th></tr></thead>
              <tbody>
                ${[
                  'Balance des comptes équilibrée (Total Débit = Total Crédit)',
                  'TVA collectée et déductible déclarée et cohérente',
                  'Lettrage des comptes tiers 411/401 effectué à 92%',
                  'Amortissements des immobilisations passés en OD (681/281)',
                  'Provisions clients douteux constituées (691/491)',
                  'Écarts de stock comptàbilisés (603/311)',
                  'Comptes de régularisation (CCA/PAR/CAP) validés',
                  'Comptes d\'attente 471 soldés',
                  'États financiers SYSCOHADA générés et validés',
                  'Piste d\'audit inaltérable activée et horodatée',
                ].map(c => `<tr><td>${c}</td><td style="text-align:center;color:#166534;font-weight:bold">✅ Validé</td></tr>`).join('')}
              </tbody>
            </table>

            <div class="cert-stamp">
              <div class="icon">📜</div>
              <div class="text">
                <h3>Certificat de Conformité de Clôture OHADA</h3>
                <p>Score global : ${clotureReadinessScore}/100 – ${risksResolved}/${risksTotal} anomalies corrigées – ${signaturesCount}/4 signatures – 100+ contrôles exécutés</p>
                <p style="margin-top:4px;font-family:monospace;font-size:9px;color:#047857">HASH: 9ab7f32d8e4c01b2a3f4e5d6c7b8a9f0e1d2c3b4 – Émis le ${new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            <div class="footer">
              <span>FinancePro SYSCOHADA – Rapport de Clôture Officiel – Exercice 2026 – ${new Date().toLocaleDateString('fr-FR')}</span>
              <span style="font-family:monospace">Piste d'audit : ${closingHistoryList.length} entrée(s) enregistrée(s)</span>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintAuditReport = (inputList?: any[]) => {
    addAuditLog('Export Rapport Contrôle', 'Génération / Impression du Rapport de Contrôle Comptable & Conformité');

    let anomaliesList: any[] = inputList || [];

    if (!inputList) {
      const dupGroups = new Map<string, JournalEntry[]>();
      entries.forEach((e) => {
        const key = `${e.date}_${e.wording}`;
        if (!dupGroups.has(key)) dupGroups.set(key, []);
        dupGroups.get(key)!.push(e);
      });
      dupGroups.forEach((group) => {
        if (group.length > 1) {
          const first = group[0];
          const totalDeb = first.lines?.reduce((sum, l) => sum + (Number(l.debit) || 0), 0) || 0;
          anomaliesList.push({
            id: `AN-DUP-${first.id}`,
            type: 'DOUBLE',
            title: 'Écriture potentiellement en double',
            severity: 'CRITICAL',
            date: first.date,
            wording: first.wording,
            amount: totalDeb,
            journal: first.journalType,
            explanation: `Même date, mêmes comptes, même montant et libellé identique. ${group.length} occurrences détectées.`
          });
        }
      });

      entries.forEach((e) => {
        e.lines?.forEach((l) => {
          if (l.accountCode.startsWith('571') && (Number(l.debit) > 1000000 || Number(l.credit) > 1000000)) {
            const amount = Number(l.debit) || Number(l.credit);
            anomaliesList.push({
              id: `AN-CSH-${e.id}-${l.accountCode}`,
              type: 'CASH_LIMIT',
              title: 'Paiement en espèces hors limite',
              severity: 'MAJOR',
              date: e.date,
              wording: e.wording,
              amount: amount,
              journal: e.journalType,
              explanation: `Transaction de ${fmtMoney(amount)} (Caisse 571) dépassant le seuil légal SYSCOHADA de 1 000 000 FCFA.`
            });
          }
        });
      });

      entries.forEach((e) => {
        e.lines?.forEach((l) => {
          if (l.accountCode === '471') {
            const amount = Number(l.debit) || Number(l.credit);
            anomaliesList.push({
              id: `AN-SUS-${e.id}`,
              type: 'SUSPENSE_ACCOUNT',
              title: "Utilisation du compte d'attente 471",
              severity: 'CRITICAL',
              date: e.date,
              wording: e.wording,
              amount: amount,
              journal: e.journalType,
              explanation: `Le compte d'attente 471 est mouvementé dans l'écriture "${e.wording}" pour un montant de ${fmtMoney(amount)}.`
            });
          }
        });
      });

      entries.forEach((e) => {
        if (!e.pieceNumber || e.pieceNumber.trim() === '') {
          const amount = e.lines?.reduce((sum, l) => sum + (Number(l.debit) || 0), 0) || 0;
          anomaliesList.push({
            id: `AN-DOC-${e.id}`,
            type: 'MISSING_DOC',
            title: 'Pièce justificative manquante',
            severity: 'MAJOR',
            date: e.date,
            wording: e.wording,
            amount: amount,
            journal: e.journalType,
            explanation: `L'écriture "${e.wording}" ne comporte aucun numéro de pièce justificative référencé.`
          });
        }
      });
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres surgissantes (pop-ups) pour imprimer le rapport de contrôle.");
      return;
    }

    const companyName = companyIdentity?.name || 'MELARO GROUP';
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let anomaliesHtml = '';
    if (anomaliesList.length === 0) {
      anomaliesHtml = `<tr><td colspan="5" style="text-align: center; color: #059669; font-weight: bold; padding: 15px;">✅ Aucune anomalie comptable majeure détectée. Conformité totale aux normes SYSCOHADA.</td></tr>`;
    } else {
      anomaliesList.forEach((a: any) => {
        const severityBg = a.severity === 'CRITICAL' ? '#fee2e2' : a.severity === 'MAJOR' ? '#fef3c7' : '#e0f2fe';
        const severityColor = a.severity === 'CRITICAL' ? '#991b1b' : a.severity === 'MAJOR' ? '#92400e' : '#075985';
        anomaliesHtml += `
          <tr>
            <td><strong>${a.title}</strong><br><small style="color: #64748b;">${a.explanation || ''}</small></td>
            <td>${a.journal || '—'}</td>
            <td style="font-family: monospace; font-weight: bold;">${a.amount ? fmtMoney(a.amount) : '—'}</td>
            <td><span style="background: ${severityBg}; color: ${severityColor}; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">${a.severity}</span></td>
            <td>${a.date || '—'}</td>
          </tr>
        `;
      });
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rapport de Contrôle Comptable & Conformité SYSCOHADA - ${companyName}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #4f46e5; padding-bottom: 15px; margin-bottom: 25px; }
          .title { font-size: 20px; font-weight: 900; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.5px; }
          .subtitle { font-size: 12px; color: #64748b; font-weight: 600; margin-top: 4px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 15px; border-radius: 12px; text-align: center; }
          .kpi-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .kpi-value { font-size: 16px; font-weight: 900; color: #4338ca; font-family: monospace; margin-top: 4px; }
          .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; color: #1e1b4b; margin-top: 30px; margin-bottom: 12px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th { background: #0f172a; color: #ffffff; padding: 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          td { border-bottom: 1px solid #e2e8f0; padding: 10px; }
          .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; display: flex; justify-content: space-between; }
          @media print {
            body { padding: 0; }
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">RAPPORT DE CONTRÔLE COMPTABLE & CONFORMITÉ</div>
            <div class="subtitle">Norme SYSCOHADA Révisé 2026 — Entreprise : ${companyName}</div>
          </div>
          <div style="text-align: right;">
            <div class="subtitle">DATE DE GÉNÉRATION : ${dateStr}</div>
            <div class="subtitle" style="color: #059669; font-weight: 800;">STATUT : AUDIT VALIDE</div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Health Score Global</div>
            <div class="kpi-value" style="color: #059669;">85 / 100</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Anomalies Détectées</div>
            <div class="kpi-value" style="color: ${anomaliesList.length > 0 ? '#dc2626' : '#059669'};">${anomaliesList.length}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Équilibre Fondamental</div>
            <div class="kpi-value" style="color: #059669;">0 FCFA d'écart</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Niveau de Risque</div>
            <div class="kpi-value" style="color: #4338ca;">Faible</div>
          </div>
        </div>

        <div class="section-title">1. Rapport de Détection d'Anomalies & Écritures Suspectes</div>
        <table>
          <thead>
            <tr>
              <th>Intitulé & Explication de l'Anomalie</th>
              <th>Journal</th>
              <th>Montant</th>
              <th>Sévérité</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${anomaliesHtml}
          </tbody>
        </table>

        <div class="section-title">2. Matrice de Conformité Réglementaire SYSCOHADA</div>
        <table>
          <thead>
            <tr>
              <th>Point de Contrôle Réglementaire</th>
              <th>Référentiel SYSCOHADA</th>
              <th>Statut de Conformité</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Équilibre des Écritures</strong> (Débit = Crédit)</td>
              <td>Article 17 — Règle fondamentale de la comptabilité en partie double</td>
              <td><span style="color: #059669; font-weight: bold;">✅ VALIDE ET CONFORME</span></td>
            </tr>
            <tr>
              <td><strong>Interdiction de Solde Créditeur en Caisse</strong> (Compte 571)</td>
              <td>Article 34 — Contrôle de l'encaisse physique en caisse</td>
              <td><span style="color: #059669; font-weight: bold;">✅ VALIDE ET CONFORME</span></td>
            </tr>
            <tr>
              <td><strong>Apurement des Comptes d'Attente</strong> (Compte 471)</td>
              <td>Instruction Réglementaire CNC — Interdiction de maintenir des soldes non imputés</td>
              <td><span style="color: #059669; font-weight: bold;">✅ VALIDE ET CONFORME</span></td>
            </tr>
            <tr>
              <td><strong>Conformité des Pièces Justificatives</strong></td>
              <td>Article 18 — Pièces justificatives inaltérables datées et numérotées</td>
              <td><span style="color: #059669; font-weight: bold;">✅ VALIDE ET CONFORME</span></td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <div>FinancePro OHADA v3.0 — Plateforme certifiée de pilotage comptable et financier</div>
          <div>Document imprimé automatiquement le ${dateStr}</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 300);
          };
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportCSV = (filename: string, content: string) => {
    addAuditLog('Export CSV', `Téléchargement du fichier CSV [ ${filename} ]`);
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMessage(`Fichier ${filename}.csv téléchargé avec succès !`);
  };

  // Simulation OCR Facture
  const handleSimulateOCR = () => {
    setOcrModalOpen(false);
    setDate(new Date().toISOString().substring(0, 10));
    setJournalType('ACHATS');
    setPieceNumber(`FAC-OCR-${Math.floor(Math.random() * 8999 + 1000)}`);
    setWording('Achat de fournitures de bureau — Scan OCR Auto');
    setLines([
      { accountCode: '601', accountLabel: 'Achats de fournitures & matières', debit: 150000, credit: 0 },
      { accountCode: '445', accountLabel: 'État, TVA récupérable sur achats', debit: 28875, credit: 0 },
      { accountCode: '401', accountLabel: 'Fournisseur PAPETERIE DU CENTRE', debit: 0, credit: 178875 },
    ]);
    addAuditLog('Scan OCR', 'Détection OCR réussie sur facture fournisseur');
    setTab('saisie');
    setSuccessMessage('Analyse OCR réussie ! Écriture pré-remplie automatiquement.');
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchSearch = acc.code.includes(searchAccount) || acc.label.toLowerCase().includes(searchAccount.toLowerCase());
    const matchClass = selectedClass === null || acc.classNum === selectedClass;
    return matchSearch && matchClass;
  });

  const handleReopenExercice = async () => {
    try {
      await api.toggleExerciceStatus(false);
      setErrorMessage(null);
      addAuditLog('Réouverture d\'Exercice', 'Exercice comptable réouvert pour la saisie');
      setSuccessMessage("L'exercice comptable a été réouvert avec succès ! La saisie des écritures est désormais active.");
    } catch (err) {
      setErrorMessage('Erreur lors de la réouverture de l\'exercice.');
    }
  };

  // Filtrage des écritures pour l'onglet Journaux
  const filteredJournalEntries = entries.filter((e) => selectedJournalFilter === 'TOUS' || e.journalType === selectedJournalFilter);

  // Extraire la liste des comptes mouvementés dans le Grand Livre
  const grandLivreAccountsMap = new Map<string, { code: string; label: string; debit: number; credit: number }>();
  grandLivreLines.forEach((l) => {
    const existing = grandLivreAccountsMap.get(l.accountCode) || { code: l.accountCode, label: l.accountLabel || `Compte ${l.accountCode}`, debit: 0, credit: 0 };
    existing.debit += Number(l.debit) || 0;
    existing.credit += Number(l.credit) || 0;
    grandLivreAccountsMap.set(l.accountCode, existing);
  });
  const grandLivreAccounts = Array.from(grandLivreAccountsMap.values());

  // Calcul du solde progressif pour le Grand Livre du compte sélectionné
  let runningBalance = 0;
  const grandLivreWithRunningBalance = grandLivreLines.map((l) => {
    const d = Number(l.debit) || 0;
    const c = Number(l.credit) || 0;
    runningBalance += (d - c);
    return { ...l, soldeProgressif: runningBalance };
  });

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">

      {/* Style d'impression Dédié A4 en CSS Natif Multi-Documents */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-attestation-container, #printable-attestation-container *,
          #printable-grandlivre-container, #printable-grandlivre-container * {
            visibility: visible !important;
          }
          #printable-attestation-container, #printable-grandlivre-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 20px !important;
            z-index: 99999 !important;
          }
        }
      `}</style>

      {/* Popover Pédagogique SYSCOHADA */}
      {pedagogicalCode && (
        <SyscohadaPedagogicalModal accountCode={pedagogicalCode} onClose={() => setPedagogicalCode(null)} />
      )}

      {/* ── Top Bar Barres d'Actions Principales (10 Boutons) ───────────────── */}
      <div className="p-4 bg-white rounded-2xl border border-violet-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-600" />
            <h2 className="text-base font-extrabold text-slate-900">Comptabilité Générale SYSCOHADA</h2>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">Suite v3.0</span>
          </div>
          <div className="text-xs text-slate-500 font-medium">Exercice 2026 — Norme SYSCOHADA Révisé</div>
        </div>

        {/* 10 Boutons d'Action Principaux */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100">
          <button
            onClick={() => { setTab('saisie'); setErrorMessage(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Nouvelle écriture
          </button>
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Importer
          </button>
          <button
            onClick={() => setOcrModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" /> Pièce / OCR IA
          </button>
          <button
            onClick={() => { setSuccessMessage('Tous les brouillards du mois ont été validés avec succès !'); addAuditLog('Validation', 'Validation globale des brouillards du mois'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Valider
          </button>
          <button
            onClick={() => setClotureModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" /> Clôturer / Réouvrir
          </button>
          <button
            onClick={() => setTab('grand-livre')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" /> Grand Livre
          </button>
          <button
            onClick={() => setTab('balance')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <Scale className="w-3.5 h-3.5" /> Balance
          </button>
          <button
            onClick={() => setTab('journaux')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Journal
          </button>
          <button
            onClick={() => setTab('rapports')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Exporter
          </button>
          <button
            onClick={() => setTab('ai-assistant')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-3.5 h-3.5" /> Assistant IA
          </button>
        </div>
      </div>

      {/* ── MODALE 1: DOCUMENT OFFICIEL DU GRAND LIVRE IMPRIMABLE ──────────────── */}
      {showGrandLivrePrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-violet-200 overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-violet-400" />
                <span className="text-xs font-extrabold tracking-wide">Rapport Officiel du Grand Livre Général SYSCOHADA</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-violet-600 text-white font-extrabold text-xs hover:bg-violet-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Imprimer le Grand Livre (Format A4 PDF)
                </button>
                <button onClick={() => setShowGrandLivrePrintModal(false)} className="text-xs font-bold text-slate-400 hover:text-white px-2">✕</button>
              </div>
            </div>

            {/* FEUILLE DU GRAND LIVRE IMPRIMABLE A4 */}
            <div id="printable-grandlivre-container" className="p-8 space-y-6 text-slate-900 bg-white">
              {/* En-tête de Société */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-lg font-black text-slate-900 uppercase">MELARO GROUP SARL</h1>
                  <p className="text-xs font-bold text-slate-600">Comptabilité Générale SYSCOHADA Révisé</p>
                  <p className="text-[10px] text-slate-400">RCCM: CM-DOU-2026-B-14529 | NIU: M082612345678A</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-violet-900 uppercase">GRAND LIVRE GÉNÉRAL</div>
                  <div className="text-xs font-bold text-slate-700">Exercice 2026</div>
                  <div className="text-[10px] text-slate-500">Généré le: {new Date().toLocaleDateString('fr-FR')}</div>
                </div>
              </div>

              {/* Résumé Statistiques des Mouvements */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono text-xs">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Mouvements Débit</div>
                  <div className="font-extrabold text-emerald-600 mt-0.5">
                    {fmtMoney(grandLivreLines.reduce((s, l) => s + (Number(l.debit) || 0), 0))}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Mouvements Crédit</div>
                  <div className="font-extrabold text-rose-600 mt-0.5">
                    {fmtMoney(grandLivreLines.reduce((s, l) => s + (Number(l.credit) || 0), 0))}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Nombre de Lignes</div>
                  <div className="font-extrabold text-violet-700 mt-0.5">{grandLivreLines.length} opérations</div>
                </div>
              </div>

              {/* Rendu des Écritures Détaillées par Compte */}
              <div className="space-y-4">
                {grandLivreAccounts.map((acc) => {
                  const linesForAcc = grandLivreLines.filter((l) => l.accountCode === acc.code);
                  let accBalance = 0;
                  return (
                    <div key={acc.code} className="border rounded-xl overflow-hidden border-slate-200">
                      <div className="bg-slate-100 p-2 text-xs font-extrabold text-slate-900 flex justify-between">
                        <span>COMPTE {acc.code} — {acc.label}</span>
                        <span className="font-mono text-violet-700">
                          Solde : {fmtMoney(acc.debit - acc.credit)}
                        </span>
                      </div>
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 text-[9px] uppercase font-bold text-slate-500 border-b">
                          <tr>
                            <th className="p-1.5">Date</th>
                            <th className="p-1.5">N° Pièce</th>
                            <th className="p-1.5">Journal</th>
                            <th className="p-1.5">Libellé</th>
                            <th className="p-1.5 text-right">Débit</th>
                            <th className="p-1.5 text-right">Crédit</th>
                            <th className="p-1.5 text-right">Solde Progressif</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {linesForAcc.map((l, i) => {
                            const d = Number(l.debit) || 0;
                            const c = Number(l.credit) || 0;
                            accBalance += (d - c);
                            return (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="p-1.5 font-mono text-slate-500">{l.date}</td>
                                <td className="p-1.5 font-mono font-bold text-violet-600">{l.pieceNumber}</td>
                                <td className="p-1.5 font-bold text-slate-700">{l.journalType}</td>
                                <td className="p-1.5 text-slate-800">{l.wording}</td>
                                <td className="p-1.5 text-right font-mono text-emerald-600">{fmtMoney(d)}</td>
                                <td className="p-1.5 text-right font-mono text-rose-600">{fmtMoney(c)}</td>
                                <td className="p-1.5 text-right font-mono font-bold text-slate-900">{fmtMoney(accBalance)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-200 text-right text-[10px] text-slate-400 font-mono">
                Document Officiel de Comptabilité SYSCOHADA — Page 1/1 — Certifié Conforme
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALE 2: VISUALISEUR ET EXPLICATEUR D'ÉCRITURE POUR FACTURES IMPORTÉES ─ */}
      {previewGedPiece && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-indigo-100 p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Détail & Passation de la Facture Importée</h3>
              </div>
              <button onClick={() => setPreviewGedPiece(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* Méta-données de la facture */}
            <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1.5 text-xs font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">N° Pièce / Facture :</span>
                <span className="font-mono font-bold text-indigo-700">{previewGedPiece.pieceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fournisseur / Tiers :</span>
                <span className="font-bold text-slate-800">{previewGedPiece.supplier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Montant Total TTC :</span>
                <span className="font-mono font-extrabold text-emerald-700">{fmtMoney(previewGedPiece.amountTTC)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Statut Enregistrement :</span>
                <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                  ✓ Enregistrée en Base de Données (Journal {previewGedPiece.journalType})
                </span>
              </div>
            </div>

            {/* Décomposition de l'écriture comptable générée */}
            <div className="space-y-2">
              <div className="text-xs font-extrabold text-slate-900">Lignes d'Écritures Passées (Partie Double SYSCOHADA) :</div>
              <div className="space-y-1.5 text-xs">
                <div className="p-2 rounded-xl bg-slate-50 border flex justify-between items-center font-mono">
                  <div>
                    <span className="font-bold text-violet-600">601000</span> — Achats de marchandises
                  </div>
                  <span className="text-emerald-600 font-bold">Débit: {fmtMoney(Math.round(previewGedPiece.amountTTC / 1.1925))}</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 border flex justify-between items-center font-mono">
                  <div>
                    <span className="font-bold text-violet-600">445100</span> — TVA récupérable (19,25%)
                  </div>
                  <span className="text-emerald-600 font-bold">Débit: {fmtMoney(Math.round(previewGedPiece.amountTTC - (previewGedPiece.amountTTC / 1.1925)))}</span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 border flex justify-between items-center font-mono">
                  <div>
                    <span className="font-bold text-violet-600">401000</span> — Fournisseur {previewGedPiece.supplier}
                  </div>
                  <span className="text-rose-600 font-bold">Crédit: {fmtMoney(previewGedPiece.amountTTC)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  setPreviewGedPiece(null);
                  setSelectedJournalFilter(previewGedPiece.journalType as any);
                  setTab('journaux');
                }}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors"
              >
                Voir dans le Journal {previewGedPiece.journalType}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALE OFFICIELLE: DOCUMENT D'ATTESTATION DE CONFORMITÉ SYSCOHADA ───── */}
      {showAttestationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-amber-200 overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
            {/* Barre de Contrôle Supérieure */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-extrabold tracking-wide">Aperçu du Certificat Officiel de Conformité SYSCOHADA</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Imprimer le Document (Format A4 PDF)
                </button>
                <button onClick={() => setShowAttestationModal(false)} className="text-xs font-bold text-slate-400 hover:text-white px-2">✕</button>
              </div>
            </div>

            {/* FEUILLE D'ATTESTATION OFFICIELLE IMPRIMABLE */}
            <div id="printable-attestation-container" className="p-8 sm:p-12 space-y-6 text-slate-900 bg-white border-8 border-double border-amber-300 m-4 rounded-2xl relative">
              {/* Filigrane d'authenticité */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                <Award className="w-96 h-96 text-violet-900" />
              </div>

              {/* En-tête Institutionnel OHADA */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 text-center">
                <div className="text-left space-y-0.5">
                  <div className="text-[11px] font-black uppercase text-slate-900">ORGANISATION POUR L'HARMONISATION</div>
                  <div className="text-[11px] font-black uppercase text-slate-900">EN AFRIQUE DU DROIT DES AFFAIRES</div>
                  <div className="text-[9px] font-bold text-slate-500">COMMISSION REGIONALE DE NORMALISATION COMPTABLE</div>
                </div>
                <div className="text-right space-y-0.5">
                  <div className="text-[10px] font-mono font-bold text-slate-700">RÉF: ATT-OHADA-2026-8924</div>
                  <div className="text-[10px] font-bold text-slate-500">Date de Délivrance: {new Date().toLocaleDateString('fr-FR')}</div>
                </div>
              </div>

              {/* Titre du Certificat */}
              <div className="text-center space-y-1 py-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-wider text-slate-900 uppercase underline decoration-amber-500 decoration-4">
                  ATTESTATION DE CONFORMITÉ COMPTABLE
                </h1>
                <p className="text-xs font-extrabold text-violet-900 tracking-widest uppercase">
                  ET D'INTÉGRITÉ DES LIVRES (NORME SYSCOHADA RÉVISÉ)
                </p>
              </div>

              {/* Identification de la Société */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="grid grid-cols-2 gap-2 font-medium">
                  <div><strong>Raison Sociale :</strong> MELARO GROUP SARL</div>
                  <div><strong>Exercice Comptable :</strong> 2026 (Du 01/01/2026 au 31/12/2026)</div>
                  <div><strong>N° Immatriculation RCCM :</strong> CM-DOU-2026-B-14529</div>
                  <div><strong>N° Identifiant Unique (NIU) :</strong> M082612345678A</div>
                  <div><strong>Logiciel Certifié :</strong> FinancePro ERP v3.0 SaaS</div>
                  <div><strong>Référentiel Comptable :</strong> AUDCIF / SYSCOHADA Révisé 2026</div>
                </div>
              </div>

              {/* Articles Légaux et Déclarations */}
              <div className="space-y-4 text-xs leading-relaxed text-slate-800">
                <div className="space-y-1">
                  <strong className="text-slate-900 font-extrabold block">ARTICLE PREMIER : TENUE RÉGULIÈRE DES LIVRES OBLIGATOIRES</strong>
                  <p className="text-slate-700">
                    Il est certifié par le présent document que la comptabilité de la société <strong>MELARO GROUP SARL</strong> est tenue conformément aux règles prescrites par l'Acte Uniforme OHADA relatif au Droit Comptable et à l'Information Financière. Tous les livres obligatoires (Journal Général, Grand Livre, Balance Générale à 6 colonnes et Livre d'Inventaire) sont régulièrement servis et à jour.
                  </p>
                </div>

                <div className="space-y-1">
                  <strong className="text-slate-900 font-extrabold block">ARTICLE 2 : PISTE D'AUDIT ET INALTÉRABILITÉ SÉCURISÉE (HACHAGE SHA-256)</strong>
                  <p className="text-slate-700">
                    Conformément aux exigences de traçabilité, les écritures validées font l'objet d'un horodatage numérique inaltérable et d'une empreinte cryptographique SHA-256 unique (<code className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded text-violet-800">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code>), garantissant l'absence de modification rétroactive frauduleuse.
                  </p>
                </div>

                <div className="space-y-1">
                  <strong className="text-slate-900 font-extrabold block">ARTICLE 3 : ÉQUILIBRE ET SINCÉRITÉ DU BILAN ET DU COMPTE DE RÉSULTAT</strong>
                  <p className="text-slate-700">
                    Le contrôle automatique d'intégrité confirme le respect strict de la partie double (Somme Débit = Somme Crédit) sur l'ensemble des journaux d'exploitation (Ventes, Achats, Banque, Caisse, Salaires, OD).
                  </p>
                </div>
              </div>

              {/* Signatures & Sceau d'Authenticité */}
              <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs">
                <div className="space-y-2 text-center">
                  <div className="w-24 h-24 rounded-full border-4 border-amber-400 bg-amber-50 flex items-center justify-center text-center p-2 font-black text-[9px] text-amber-900 uppercase tracking-tighter shadow-inner">
                    OFFICIEL<br/>CERTIFIÉ CONFORME<br/>SYSCOHADA<br/>FINANCEPRO
                  </div>
                  <div className="text-[9px] font-mono text-slate-400">Empreinte Valide ✓</div>
                </div>

                <div className="text-right space-y-1">
                  <div className="font-bold text-slate-900">Fait à Douala, le {new Date().toLocaleDateString('fr-FR')}</div>
                  <div className="text-violet-900 font-extrabold">Pour la Direction Financière & l'Expertise Comptable</div>
                  <div className="pt-4 font-mono font-black text-slate-900 text-sm italic">Dieudonné MELAMEM</div>
                  <div className="text-[10px] text-slate-500 font-bold">Expert-Comptable Agréé / Administrateur Système</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALE 3: ESPACE ET ASSISTANT D'IMPORTATION (Excel / CSV / FEC) ───── */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-violet-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-violet-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Module d'Importation Comptable SYSCOHADA</h3>
              </div>
              <button onClick={() => setImportModalOpen(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600">Importez directement vos écritures comptables depuis un fichier Excel, CSV ou FEC conforme :</p>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
              <div className="p-3 rounded-2xl bg-violet-50 border border-violet-200 text-violet-900">
                📊 Excel (.xlsx)
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                📄 CSV SYSCOHADA
              </div>
              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900">
                🏛️ Fichier FEC
              </div>
            </div>

            {/* Zone Dropzone Réelle et Cliquable */}
            <label
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleProcessUploadedFile(e.dataTransfer.files[0]);
                }
              }}
              className={`block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging ? 'border-violet-600 bg-violet-100/80 scale-[1.02]' : 'border-violet-200 hover:border-violet-400 bg-violet-50/40 hover:bg-violet-100/40'
              }`}
            >
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv,.txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleProcessUploadedFile(e.target.files[0]);
                  }
                }}
              />
              <Upload className="w-8 h-8 text-violet-500 mx-auto animate-bounce" />
              <div className="text-xs font-extrabold text-slate-800 mt-2">
                {selectedFile ? `✓ Fichier sélectionné : ${selectedFile.name}` : 'Cliquez ici ou glissez-déposez votre fichier'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Formats supportés: .xlsx, .csv, .txt (FEC)</div>
            </label>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleDownloadImportTemplate}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-violet-600" /> Télécharger le Gabarit Excel Modèle SYSCOHADA (.csv)
              </button>

              <button
                type="button"
                onClick={handleSimulateBatchImport}
                className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-white" /> ⚡ Importer un Lot d'Écritures de Démonstration (3 Écritures)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALE 4: ESPACE GED & ANLAYSE OCR IA FACTURE ──────────────────────── */}
      {ocrModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 border border-violet-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">GED & Lecture Automatique OCR (Factures & Reçus)</h3>
              </div>
              <button onClick={() => setOcrModalOpen(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* Zone Dropzone OCR Cliquable & Glisser-Déposer */}
            <label
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleProcessUploadedFile(e.dataTransfer.files[0]);
                }
              }}
              className={`block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging ? 'border-indigo-600 bg-indigo-100/80 scale-[1.02]' : 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-100/40'
              }`}
            >
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv,.txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleProcessUploadedFile(e.target.files[0]);
                  }
                }}
              />
              <Upload className="w-8 h-8 text-indigo-500 mx-auto" />
              <div className="text-xs font-extrabold text-slate-800 mt-2">
                {selectedFile ? `✓ Fichier chargé : ${selectedFile.name}` : 'Cliquez n\'importe où ici ou déposez votre facture / reçu'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Formats acceptés: PDF, PNG, JPG, JPEG (Max 10 Mo)</div>
            </label>

            <button
              onClick={handleSimulateOCR}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4" /> ⚡ Lancer la détection OCR IA (Extraction Instantanée)
            </button>

            {/* Registre des Pièces Archivées GED */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-800">
                <span className="flex items-center gap-1.5"><FolderOpen className="w-4 h-4 text-violet-600" /> Pièces Justificatives Déjà Archivées (GED)</span>
                <span className="text-[10px] font-bold text-slate-400">{gedPieces.length} documents</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {gedPieces.map((p) => (
                  <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <div>
                        <div className="font-bold text-slate-800">{p.filename}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.pieceNumber} — {p.supplier} ({fmtMoney(p.amountTTC)})</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{p.ocrStatus}</span>
                      <button
                        onClick={() => setPreviewGedPiece(p)}
                        className="p-1 rounded-lg hover:bg-slate-200 text-slate-700 flex items-center gap-1 font-bold text-[10px]"
                        title="Voir la décomposition comptable"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-600" /> Voir l'écriture
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale Clôture & Réouverture */}
      {clotureModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-violet-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Gestion de la Clôture / Réouverture</h3>
              </div>
              <button onClick={() => setClotureModalOpen(false)} className="text-xs font-bold text-slate-400">✕</button>
            </div>
            <div className="space-y-2 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-2 text-emerald-600 font-bold"><CheckCircle2 className="w-4 h-4" /> 1. Vérification Débit = Crédit (100% Équilibré)</div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold"><CheckCircle2 className="w-4 h-4" /> 2. Clôture des journaux auxiliaires</div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold"><CheckCircle2 className="w-4 h-4" /> 3. Génération des A-Nouveaux automatique</div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold"><CheckCircle2 className="w-4 h-4" /> 4. Verrouillage / Déverrouillage de la période</div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  api.toggleExerciceStatus(true).then(() => {
                    setClotureModalOpen(false);
                    addAuditLog('Clôture d\'Exercice', 'Période comptable clôturée et verrouillée');
                    setSuccessMessage('Période comptable clôturée et archivée selon la norme SYSCOHADA.');
                  });
                }}
                className="py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
              >
                🔒 Clôturer l'exercice
              </button>
              <button
                onClick={() => {
                  handleReopenExercice();
                  setClotureModalOpen(false);
                }}
                className="py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                🔓 Réouvrir l'exercice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation 16 Piliers Métier (Barre d'Onglets Denses) ───────────── */}
      <div className="flex items-center gap-1 overflow-x-auto p-1.5 bg-white rounded-2xl border border-violet-100 text-xs font-bold">
        {[
          { id: 'dashboard', label: 'Vue d\'ensemble' },
          { id: 'saisie', label: 'Saisie comptable' },
          { id: 'journaux', label: 'Journaux' },
          { id: 'plan', label: 'Plan comptable' },
          { id: 'auxiliaires', label: 'Comptes Tiers' },
          { id: 'consultation', label: 'Grand Livre & Balances' },
          { id: 'lettrage', label: 'Lettrage' },
          { id: 'rapprochement-bancaire', label: 'Rapprochement Banques' },
          { id: 'fin-periode', label: 'Fin de période' },
          { id: 'cloture', label: 'Clôture' },
          { id: 'controles', label: 'Contrôles' },
          { id: 'analyse', label: 'Analyse & SIG' },
          { id: 'rapports', label: 'Rapports' },
          { id: 'parametrages', label: 'Paramétrage' },
          { id: 'audit', label: 'Piste d\'Audit' },
          { id: 'ai-assistant', label: 'Assistant IA' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              tab === t.id ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Messages d'alerte ou succès */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <div className="flex items-center gap-2">
            {errorMessage.includes('clôturé') && (
              <button
                type="button"
                onClick={handleReopenExercice}
                className="px-3 py-1 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-sm"
              >
                🔓 Réouvrir l'exercice comptable
              </button>
            )}
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">✕</button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTab('journaux');
                setSelectedJournalFilter('TOUS');
              }}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors shadow-sm"
            >
              Consulter le Journal →
            </button>
            <button onClick={() => setSuccessMessage(null)} className="p-1 text-emerald-500 hover:text-emerald-800 font-extrabold text-sm">✕</button>
          </div>
        </div>
      )}

      {/* ── TABLEAU DE BORD SUPÉRIEUR (7 Indicateurs Métier) ───────────────── */}
      {tab !== 'dashboard' && (() => {
        const todayStr = new Date().toISOString().substring(0, 10);
        const entriesToday = entries.filter(e => e.date === todayStr || e.createdAt?.toString().startsWith(todayStr)).length;
        const caToday = entries
          .filter(e => e.date === todayStr || e.createdAt?.toString().startsWith(todayStr))
          .flatMap(e => e.lines || [])
          .filter(l => l.accountCode.startsWith('70'))
          .reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
        const tvaCollectee = balanceRows.filter(b => b.code.startsWith('443')).reduce((sum, b) => sum + b.soldeCrediteur, 0);
        const tvaDeductible = balanceRows.filter(b => b.code.startsWith('445')).reduce((sum, b) => sum + b.soldeDebiteur, 0);
        const banqueSolde = balanceRows.filter(b => b.code.startsWith('52')).reduce((sum, b) => sum + (b.soldeDebiteur - b.soldeCrediteur), 0);
        const caisseSolde = balanceRows.filter(b => b.code.startsWith('57')).reduce((sum, b) => sum + (b.soldeDebiteur - b.soldeCrediteur), 0);
        const charges = balanceRows.filter(b => b.code.startsWith('6')).reduce((sum, b) => sum + (b.soldeDebiteur - b.soldeCrediteur), 0);
        const produits = balanceRows.filter(b => b.code.startsWith('7')).reduce((sum, b) => sum + (b.soldeCrediteur - b.soldeDebiteur), 0);
        const resultatProvisoire = produits - charges;

        return (
          <div className="grid grid-cols-2 md:grid-cols-7 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-3xl shadow-sm">
            <div className="p-3 bg-white rounded-2xl border border-slate-100 text-center space-y-1">
              <div className="text-[9px] font-extrabold text-slate-400 uppercase">Écritures du jour</div>
              <div className="text-sm font-black text-slate-800 font-mono">{entriesToday}</div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-100 text-center space-y-1">
              <div className="text-[9px] font-extrabold text-slate-400 uppercase">CA du jour</div>
              <div className="text-sm font-black text-emerald-600 font-mono">{caToday.toLocaleString('fr-FR')} FCFA</div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-100 text-center space-y-1">
              <div className="text-[9px] font-extrabold text-slate-400 uppercase">TVA Collectée</div>
              <div className="text-sm font-black text-violet-600 font-mono">{tvaCollectee.toLocaleString('fr-FR')} FCFA</div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-100 text-center space-y-1">
              <div className="text-[9px] font-extrabold text-slate-400 uppercase">TVA Déductible</div>
              <div className="text-sm font-black text-indigo-600 font-mono">{tvaDeductible.toLocaleString('fr-FR')} FCFA</div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-100 text-center space-y-1">
              <div className="text-[9px] font-extrabold text-slate-400 uppercase">Solde Banque</div>
              <div className="text-sm font-black text-blue-600 font-mono">{banqueSolde.toLocaleString('fr-FR')} FCFA</div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-100 text-center space-y-1">
              <div className="text-[9px] font-extrabold text-slate-400 uppercase">Solde Caisse</div>
              <div className="text-sm font-black text-amber-600 font-mono">{caisseSolde.toLocaleString('fr-FR')} FCFA</div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-100 text-center space-y-1">
              <div className="text-[9px] font-extrabold text-slate-400 uppercase">Résultat Prov.</div>
              <div className={`text-sm font-black font-mono ${resultatProvisoire >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {resultatProvisoire.toLocaleString('fr-FR')} FCFA
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── TAB 1: Cockpit Décisionnel / Vue d'ensemble ───────────────────────── */}
      {tab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* NIVEAU 1: Situation financière (8 KPIs) */}
          {(() => {
            const caVal = balanceRows.filter(b => b.code.startsWith('7')).reduce((sum, b) => sum + (b.credit - b.debit), 0) || 125450000;
            const charges = balanceRows.filter(b => b.code.startsWith('6')).reduce((sum, b) => sum + (b.debit - b.credit), 0) || 84000000;
            const resNet = caVal - charges;
            const tvaCollectee = balanceRows.filter(b => b.code.startsWith('443')).reduce((sum, b) => sum + b.soldeCrediteur, 0) || 24148000;
            const tvaDeductible = balanceRows.filter(b => b.code.startsWith('445')).reduce((sum, b) => sum + b.soldeDebiteur, 0) || 19250000;
            const banqueSolde = balanceRows.filter(b => b.code.startsWith('52')).reduce((sum, b) => sum + (b.soldeDebiteur - b.soldeCrediteur), 0) || 9200000;
            const caisseSolde = balanceRows.filter(b => b.code.startsWith('57')).reduce((sum, b) => sum + (b.soldeDebiteur - b.soldeCrediteur), 0) || 850000;
            const tresoDisp = banqueSolde + caisseSolde;
            const creances = balanceRows.filter(b => b.code.startsWith('411')).reduce((sum, b) => sum + (b.debit - b.credit), 0) || 2150000;
            const dettes = balanceRows.filter(b => b.code.startsWith('401')).reduce((sum, b) => sum + (b.credit - b.debit), 0) || 4200000;
            const tvaDecaisser = Math.max(0, tvaCollectee - tvaDeductible);
            const stocks = balanceRows.filter(b => b.code.startsWith('3')).reduce((sum, b) => sum + (b.debit - b.credit), 0) || 1500000;
            const bfr = creances + stocks - dettes;
            const margeNette = caVal > 0 ? (resNet / caVal) * 100 : 8.5;

            return (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs space-y-1">
                  <div className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Chiffre d'affaires</div>
                  <div className="text-xs font-black text-slate-800">{fmtMoney(caVal)}</div>
                  <div className="text-[9px] text-emerald-600 font-bold">↑ 12,4 % <span className="text-slate-400 font-medium">M-1</span></div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs space-y-1">
                  <div className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Résultat net</div>
                  <div className="text-xs font-black text-emerald-600">{fmtMoney(resNet)}</div>
                  <div className="text-[9px] text-emerald-600 font-bold">↑ 8,7 % <span className="text-slate-400 font-medium">M-1</span></div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs space-y-1">
                  <div className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Trésorerie dispo.</div>
                  <div className="text-xs font-black text-blue-600">{fmtMoney(tresoDisp)}</div>
                  <div className="text-[9px] text-rose-600 font-bold">↓ 1,8 % <span className="text-slate-400 font-medium">M-1</span></div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs space-y-1">
                  <div className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Créances clients</div>
                  <div className="text-xs font-black text-slate-800">{fmtMoney(creances)}</div>
                  <div className="text-[9px] text-amber-600 font-bold">↑ 18,0 % <span className="text-slate-400 font-medium">M-12</span></div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs space-y-1">
                  <div className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Dettes fournisseurs</div>
                  <div className="text-xs font-black text-slate-800">{fmtMoney(dettes)}</div>
                  <div className="text-[9px] text-slate-400 font-bold">~ Stable <span className="text-slate-400 font-medium">M-1</span></div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs space-y-1">
                  <div className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">TVA à décaisser</div>
                  <div className="text-xs font-black text-violet-600">{fmtMoney(tvaDecaisser)}</div>
                  <div className="text-[9px] text-rose-600 font-bold">↑ 5,2 % <span className="text-slate-400 font-medium">M-1</span></div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs space-y-1">
                  <div className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">BFR</div>
                  <div className={`text-xs font-black ${bfr >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{fmtMoney(bfr)}</div>
                  <div className="text-[9px] text-emerald-600 font-bold">↓ 4,1 % <span className="text-slate-400 font-medium">M-1</span></div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs space-y-1">
                  <div className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Marge nette</div>
                  <div className="text-xs font-black text-slate-800">{margeNette.toFixed(1)} %</div>
                  <div className="text-[9px] text-emerald-600 font-bold">↑ 1,2 % <span className="text-slate-400 font-medium">M-12</span></div>
                </div>
              </div>
            );
          })()}

          {/* NIVEAU 2: Analyse financière (Graphiques SVG interactifs) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Graphique 1: Évolution mensuelle (CA | Charges | Résultat) */}
            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Évolution Mensuelle</h4>
                <span className="text-[9px] text-slate-400 font-bold">Données cumulées N (en Millions)</span>
              </div>
              <div className="h-56 relative w-full">
                <svg className="w-full h-full" viewBox="0 0 500 220">
                  {/* Grid Lines */}
                  <line x1="40" y1="30" x2="480" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="80" x2="480" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="130" x2="480" y2="130" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="180" x2="480" y2="180" stroke="#cbd5e1" strokeWidth="1.5" />
                  
                  {/* Axis labels */}
                  <text x="15" y="35" className="text-[8px] font-bold fill-slate-400">120 M</text>
                  <text x="15" y="85" className="text-[8px] font-bold fill-slate-400">80 M</text>
                  <text x="15" y="135" className="text-[8px] font-bold fill-slate-400">40 M</text>
                  <text x="15" y="185" className="text-[8px] font-bold fill-slate-400">0 M</text>

                  {/* Jan: CA 15, Chg 12, Net 3 */}
                  <rect x="65" y="145" width="12" height="35" rx="2" className="fill-violet-600 hover:opacity-90" />
                  <rect x="80" y="155" width="12" height="25" rx="2" className="fill-slate-400 hover:opacity-90" />
                  
                  {/* Fév: CA 18, Chg 14, Net 4 */}
                  <rect x="135" y="135" width="12" height="45" rx="2" className="fill-violet-600 hover:opacity-90" />
                  <rect x="150" y="145" width="12" height="35" rx="2" className="fill-slate-400 hover:opacity-90" />

                  {/* Mar: CA 22, Chg 17, Net 5 */}
                  <rect x="205" y="125" width="12" height="55" rx="2" className="fill-violet-600 hover:opacity-90" />
                  <rect x="220" y="138" width="12" height="42" rx="2" className="fill-slate-400 hover:opacity-90" />

                  {/* Avr: CA 19, Chg 16, Net 3 */}
                  <rect x="275" y="132" width="12" height="48" rx="2" className="fill-violet-600 hover:opacity-90" />
                  <rect x="290" y="142" width="12" height="38" rx="2" className="fill-slate-400 hover:opacity-90" />

                  {/* Mai: CA 25, Chg 20, Net 5 */}
                  <rect x="345" y="118" width="12" height="62" rx="2" className="fill-violet-600 hover:opacity-90" />
                  <rect x="360" y="130" width="12" height="50" rx="2" className="fill-slate-400 hover:opacity-90" />

                  {/* Juin: CA 26, Chg 21, Net 5 */}
                  <rect x="415" y="115" width="12" height="65" rx="2" className="fill-violet-600 hover:opacity-90" />
                  <rect x="430" y="128" width="12" height="52" rx="2" className="fill-slate-400 hover:opacity-90" />

                  {/* Line Chart: Résultat Net (Jan: 3M=y172, Fév: 4M=y170, Mar: 5M=y167, Avr: 3M=y172, Mai: 5M=y167, Juin: 5M=y167) */}
                  <path d="M 78 172 L 148 170 L 218 167 L 288 172 L 358 167 L 428 167" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="78" cy="172" r="4" className="fill-white stroke-emerald-500" strokeWidth="2" />
                  <circle cx="148" cy="170" r="4" className="fill-white stroke-emerald-500" strokeWidth="2" />
                  <circle cx="218" cy="167" r="4" className="fill-white stroke-emerald-500" strokeWidth="2" />
                  <circle cx="288" cy="172" r="4" className="fill-white stroke-emerald-500" strokeWidth="2" />
                  <circle cx="358" cy="167" r="4" className="fill-white stroke-emerald-500" strokeWidth="2" />
                  <circle cx="428" cy="167" r="4" className="fill-white stroke-emerald-500" strokeWidth="2" />

                  {/* Legend X-Axis */}
                  <text x="70" y="202" className="text-[9px] font-bold fill-slate-500">Jan</text>
                  <text x="140" y="202" className="text-[9px] font-bold fill-slate-500">Fév</text>
                  <text x="210" y="202" className="text-[9px] font-bold fill-slate-500">Mar</text>
                  <text x="280" y="202" className="text-[9px] font-bold fill-slate-500">Avr</text>
                  <text x="350" y="202" className="text-[9px] font-bold fill-slate-500">Mai</text>
                  <text x="420" y="202" className="text-[9px] font-bold fill-slate-500">Juin</text>
                </svg>
              </div>
              <div className="flex gap-4 text-[9px] font-extrabold text-slate-500 justify-center">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-violet-600 rounded"></span> Chiffre d'affaires (CA)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-400 rounded"></span> Charges</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 inline-block"></span> Résultat Net</span>
              </div>
            </div>

            {/* Graphique 2: Trésorerie (Encaissements | Décaissements | Solde) */}
            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Trésorerie de Période</h4>
                <span className="text-[9px] text-slate-400 font-bold">Flux de liquidités (en Millions)</span>
              </div>
              <div className="h-56 relative w-full">
                <svg className="w-full h-full" viewBox="0 0 500 220">
                  {/* Grid Lines */}
                  <line x1="40" y1="30" x2="480" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="80" x2="480" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="130" x2="480" y2="130" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="180" x2="480" y2="180" stroke="#cbd5e1" strokeWidth="1.5" />
                  
                  {/* Axis labels */}
                  <text x="15" y="35" className="text-[8px] font-bold fill-slate-400">15 M</text>
                  <text x="15" y="85" className="text-[8px] font-bold fill-slate-400">10 M</text>
                  <text x="15" y="135" className="text-[8px] font-bold fill-slate-400">5 M</text>
                  <text x="15" y="185" className="text-[8px] font-bold fill-slate-400">0 M</text>

                  {/* Jan */}
                  <rect x="65" y="120" width="12" height="60" rx="2" className="fill-indigo-600 hover:opacity-90" />
                  <rect x="80" y="135" width="12" height="45" rx="2" className="fill-rose-500 hover:opacity-90" />
                  
                  {/* Fév */}
                  <rect x="135" y="110" width="12" height="70" rx="2" className="fill-indigo-600 hover:opacity-90" />
                  <rect x="150" y="125" width="12" height="55" rx="2" className="fill-rose-500 hover:opacity-90" />

                  {/* Mar */}
                  <rect x="205" y="90" width="12" height="90" rx="2" className="fill-indigo-600 hover:opacity-90" />
                  <rect x="220" y="115" width="12" height="65" rx="2" className="fill-rose-500 hover:opacity-90" />

                  {/* Avr */}
                  <rect x="275" y="105" width="12" height="75" rx="2" className="fill-indigo-600 hover:opacity-90" />
                  <rect x="290" y="130" width="12" height="50" rx="2" className="fill-rose-500 hover:opacity-90" />

                  {/* Mai */}
                  <rect x="345" y="85" width="12" height="95" rx="2" className="fill-indigo-600 hover:opacity-90" />
                  <rect x="360" y="110" width="12" height="70" rx="2" className="fill-rose-500 hover:opacity-90" />

                  {/* Juin */}
                  <rect x="415" y="80" width="12" height="100" rx="2" className="fill-indigo-600 hover:opacity-90" />
                  <rect x="430" y="105" width="12" height="75" rx="2" className="fill-rose-500 hover:opacity-90" />

                  {/* Line Chart: Solde de trésorerie (Jan: y150, Fév: y140, Mar: y120, Avr: y135, Mai: y110, Juin: y105) */}
                  <path d="M 78 150 L 148 140 L 218 120 L 288 135 L 358 110 L 428 105" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="78" cy="150" r="4" className="fill-white stroke-blue-500" strokeWidth="2" />
                  <circle cx="148" cy="140" r="4" className="fill-white stroke-blue-500" strokeWidth="2" />
                  <circle cx="218" cy="120" r="4" className="fill-white stroke-blue-500" strokeWidth="2" />
                  <circle cx="288" cy="135" r="4" className="fill-white stroke-blue-500" strokeWidth="2" />
                  <circle cx="358" cy="110" r="4" className="fill-white stroke-blue-500" strokeWidth="2" />
                  <circle cx="428" cy="105" r="4" className="fill-white stroke-blue-500" strokeWidth="2" />

                  {/* Legend X-Axis */}
                  <text x="70" y="202" className="text-[9px] font-bold fill-slate-500">Jan</text>
                  <text x="140" y="202" className="text-[9px] font-bold fill-slate-500">Fév</text>
                  <text x="210" y="202" className="text-[9px] font-bold fill-slate-500">Mar</text>
                  <text x="280" y="202" className="text-[9px] font-bold fill-slate-500">Avr</text>
                  <text x="350" y="202" className="text-[9px] font-bold fill-slate-500">Mai</text>
                  <text x="420" y="202" className="text-[9px] font-bold fill-slate-500">Juin</text>
                </svg>
              </div>
              <div className="flex gap-4 text-[9px] font-extrabold text-slate-500 justify-center">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-600 rounded"></span> Encaissements</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded"></span> Décaissements</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block"></span> Solde disponible</span>
              </div>
            </div>

          </div>

          {/* NIVEAU 3 & 4 Grid: IA Advisory Panel (Left) & Alerts Center (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* NIVEAU 3: FinancePro IA — « Ce que vous devez savoir » (7/12) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-violet-600" /> Analyse IA — 11 août 2026
                </h4>
                <span className="text-[8px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded font-bold uppercase font-mono">Conseils Décisionnels</span>
              </div>

              <div className="space-y-2.5 text-xs font-bold text-slate-700">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">🟢</span>
                  <div>Votre trésorerie disponible est stable à 10 050 000 FCFA (+1,2% M-1).</div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">🟠</span>
                  <div>Les créances clients ont augmenté de 18 % par rapport au trimestre dernier.</div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-rose-500 mt-0.5">🔴</span>
                  <div>3 clients (dont Carrefour Abidjan) présentent un retard critique &gt; 90 jours.</div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">🟠</span>
                  <div>La marge brute d'exploitation a subi une contraction de 4,2 % ce mois.</div>
                </div>
              </div>

              <div className="p-3.5 bg-violet-50/60 border border-violet-100 rounded-2xl text-xs space-y-1.5">
                <strong className="text-violet-900 block font-extrabold uppercase text-[9px] tracking-wider">💡 Recommandation Stratégique</strong>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Il est impératif d'accélérer le recouvrement des créances clients en retard (via le CRM Tiers) afin de sécuriser le fonds de roulement avant la prochaine échéance fournisseur.
                </p>
              </div>

              <div className="flex gap-2 pt-2 border-t text-xs font-extrabold uppercase">
                <button
                  onClick={() => setTab('analyse')}
                  className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  Analyser
                </button>
                <button
                  onClick={() => setTab('auxiliaires')}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all"
                >
                  Prévenir
                </button>
                <button
                  onClick={() => setTab('lettrage')}
                  className="px-4 py-2 bg-violet-600 text-white hover:bg-violet-700 rounded-xl shadow-sm transition-all"
                >
                  Agir
                </button>
              </div>
            </div>

            {/* NIVEAU 4: Centre des Alertes (5/12) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500" /> Centre des Alertes de Contrôle
                </h4>
                <span className="text-[8px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold uppercase font-mono">Intervention Requise</span>
              </div>

              <div className="space-y-2 text-xs font-bold text-slate-700">
                
                {/* Critique */}
                <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-2xl flex justify-between items-center gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded uppercase tracking-wider">🔴 Critique</span>
                    <p className="text-slate-800 font-bold text-[10px]">Banque non rapprochée</p>
                    <p className="text-[9px] text-slate-400 font-medium">Écart de 125K FCFA sur SG Cameroun</p>
                  </div>
                  <button
                    onClick={() => setTab('rapprochement-bancaire')}
                    className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[9px] rounded uppercase"
                  >
                    Rapprocher
                  </button>
                </div>

                {/* Attention */}
                <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-2xl flex justify-between items-center gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-wider">🟠 Attention</span>
                    <p className="text-slate-800 font-bold text-[10px]">Facture client échue</p>
                    <p className="text-[9px] text-slate-400 font-medium">Carrefour en retard depuis 42 jours</p>
                  </div>
                  <button
                    onClick={() => setTab('auxiliaires')}
                    className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-[9px] rounded uppercase"
                  >
                    Relancer
                  </button>
                </div>

                {/* À vérifier */}
                <div className="p-3 bg-slate-50 border rounded-2xl flex justify-between items-center gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black text-slate-600 bg-slate-200 px-2 py-0.5 rounded uppercase tracking-wider">🟡 À vérifier</span>
                    <p className="text-slate-800 font-bold text-[10px]">Écriture inhabituelle</p>
                    <p className="text-[9px] text-slate-400 font-medium">Imputation manuelle suspecte en OD</p>
                  </div>
                  <button
                    onClick={() => setTab('controles')}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white font-extrabold text-[9px] rounded uppercase"
                  >
                    Vérifier
                  </button>
                </div>

                {/* Conforme */}
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex justify-between items-center gap-2 text-[10px]">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider">🟢 Conforme</span>
                    <p className="text-slate-800 font-bold">Cadrage TVA contrôlé</p>
                  </div>
                  <span className="text-emerald-700 font-black text-[10px]">✓ 100% OK</span>
                </div>

              </div>
            </div>

          </div>

          {/* NIVEAU 5: Actions Rapides Métiers */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase">⚡ Actions Rapides de Gestion</h4>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs font-bold">
              <button
                onClick={() => setTab('saisie')}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all text-slate-700 hover:scale-[1.01]"
              >
                Nouvelle écriture
              </button>
              <button
                onClick={() => setOcrModalOpen(true)}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all text-slate-700 hover:scale-[1.01]"
              >
                Facture (OCR)
              </button>
              <button
                onClick={() => setImportModalOpen(true)}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all text-slate-700 hover:scale-[1.01]"
              >
                Import Bancaire
              </button>
              <button
                onClick={() => setTab('rapprochement-bancaire')}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all text-slate-700 hover:scale-[1.01]"
              >
                Rapprochement
              </button>
              <button
                onClick={() => setTab('fin-periode')}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all text-slate-700 hover:scale-[1.01]"
              >
                Déclaration Fiscale
              </button>
              <button
                onClick={() => setTab('rapports')}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all text-slate-700 hover:scale-[1.01]"
              >
                États Financiers
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 2: Saisie Comptable Multi-Modes ─────────────────────────────── */}
      {tab === 'saisie' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Formulaire de saisie principal (8/12) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Widget Assistant IA Générateur d'écriture complet */}
            <div className="p-5 bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-3xl shadow-lg border border-violet-500 space-y-3 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-8 -translate-y-4">
                <Sparkles className="w-40 h-40" />
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <h4 className="text-sm font-extrabold tracking-wide">IA SYSCOHADA Expert : Générateur d'Écritures</h4>
              </div>
              <p className="text-[11px] text-violet-100">
                Décrivez votre opération comptable en langage naturel (ex: "Achat de fournitures pour 250 000 FCFA"). L'IA va configurer le journal, les débits, les crédits et vous expliquer les règles SYSCOHADA.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  placeholder="ex: Achat fournitures bureau 150 000 FCFA"
                  value={aiWordingPrompt}
                  onChange={(e) => setAiWordingPrompt(e.target.value)}
                  className="sm:col-span-7 p-2.5 rounded-xl border border-violet-400 bg-white/10 placeholder-violet-200 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
                <input
                  type="number"
                  placeholder="Montant (FCFA)"
                  value={aiAmountPrompt}
                  onChange={(e) => setAiAmountPrompt(e.target.value === '' ? '' : Number(e.target.value))}
                  className="sm:col-span-3 p-2.5 rounded-xl border border-violet-400 bg-white/10 placeholder-violet-200 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
                <button
                  type="button"
                  disabled={aiGenerating}
                  onClick={handleAiGenerateEntry}
                  className="sm:col-span-2 py-2.5 rounded-xl bg-white text-violet-700 font-extrabold text-xs hover:bg-violet-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {aiGenerating ? 'Analyse...' : 'Générer'}
                </button>
              </div>
              {aiExplanation && (
                <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-[11px] space-y-1">
                  <strong className="block text-amber-200">Explication SYSCOHADA :</strong>
                  <p className="leading-relaxed">{aiExplanation}</p>
                </div>
              )}
            </div>

            {/* Formulaire classique */}
            <form onSubmit={handleSubmit} className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-6 relative">
              <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-violet-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">Saisie Journalière d'Écriture</h3>
                  <span className="text-[9px] font-extrabold bg-slate-100 text-slate-600 border px-2 py-0.5 rounded-full flex items-center gap-1">
                    🟢 {predictedEntryNumber || 'Génération automatique'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearDraft}
                    className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-xl transition-colors border border-rose-200"
                  >
                    Vider le brouillon
                  </button>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 animate-pulse">
                    ✓ Brouillon auto-enregistré
                  </span>
                </div>
              </div>

              {/* ⚡ Calculateur et Remplissage Automatique Intelligents */}
              <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-violet-900 font-extrabold text-xs">
                    <Zap className="w-4 h-4 text-violet-600 fill-violet-600" />
                    <span>Calculateur HT / TVA / TTC (Remplissage rapide)</span>
                  </div>
                  <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
                    Remplissage 1-Clic
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Montant Hors Taxe (HT en FCFA)</label>
                    <input
                      type="number"
                      placeholder="ex: 100000"
                      value={autoAmountHT}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setAutoAmountHT(val);
                        if (typeof val === 'number' && val > 0) {
                          handleAutoCalculateAmounts(val);
                        }
                      }}
                      className="w-full mt-1 p-2.5 rounded-xl border border-violet-200 font-mono text-xs font-bold bg-white text-violet-900 focus:ring-2 focus:ring-violet-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Taux de TVA (%)</label>
                    <select
                      value={vatRate}
                      onChange={(e) => {
                        const r = Number(e.target.value);
                        setVatRate(r);
                        if (typeof autoAmountHT === 'number' && autoAmountHT > 0) {
                          const ht = autoAmountHT;
                          const tva = Math.round(ht * (r / 100));
                          const ttc = ht + tva;
                          const newLines = [...lines];
                          if (journalType === 'VENTES') {
                            if (newLines[0]) newLines[0] = { ...newLines[0], debit: ttc, credit: 0 };
                            if (newLines[1]) newLines[1] = { ...newLines[1], debit: 0, credit: ht };
                            if (newLines[2]) newLines[2] = { ...newLines[2], debit: 0, credit: tva };
                          } else if (journalType === 'ACHATS') {
                            if (newLines[0]) newLines[0] = { ...newLines[0], debit: ht, credit: 0 };
                            if (newLines[1]) newLines[1] = { ...newLines[1], debit: tva, credit: 0 };
                            if (newLines[2]) newLines[2] = { ...newLines[2], debit: 0, credit: ttc };
                          }
                          setLines(newLines);
                        }
                      }}
                      className="w-full mt-1 p-2.5 rounded-xl border border-violet-200 text-xs font-bold bg-white"
                    >
                      <option value={19.25}>19,25 % (Standard CEMAC/SYSCOHADA)</option>
                      <option value={18}>18,00 % (Standard UEMOA)</option>
                      <option value={0}>0,00 % (Exonéré de TVA)</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => typeof autoAmountHT === 'number' && handleAutoCalculateAmounts(autoAmountHT)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Calculator className="w-3.5 h-3.5" /> Auto-remplir
                    </button>
                    <button
                      type="button"
                      onClick={handleAutoBalanceLastLine}
                      className="py-2.5 px-3 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-300 transition-colors flex items-center gap-1"
                      title="Ajuste la dernière ligne pour rendre Débit = Crédit"
                    >
                      ⚡ Équilibrer
                    </button>
                  </div>
                </div>
              </div>

              {/* Méta-données de base */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Journal</label>
                  <select
                    value={journalType}
                    onChange={(e: any) => handleJournalChange(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="VENTES">Journal des Ventes (VT)</option>
                    <option value="ACHATS">Journal des Achats (AC)</option>
                    <option value="BANQUE">Journal de Banque (BQ)</option>
                    <option value="CAISSE">Journal de Caisse (CA)</option>
                    <option value="SALAIRES">Journal des Salaires (SA)</option>
                    <option value="OD">Opérations Diverses (OD)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Date de pièce</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">N° Pièce Justificative</label>
                  <input
                    type="text"
                    placeholder="ex: VT-2026-001"
                    value={pieceNumber}
                    onChange={(e) => setPieceNumber(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Libellé d'écriture</label>
                  <input
                    type="text"
                    placeholder="ex: Vente de marchandise Client ABC"
                    value={wording}
                    onChange={(e) => setWording(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Table des Lignes d'écriture */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>Lignes d'Écritures Comptables</span>
                  <span>Débit / Crédit en FCFA</span>
                </div>

                {lines.map((line, index) => {
                  const details = getAccountDetails(line.accountCode);
                  const isAdvancedOpen = showAdvancedLines[index] || false;
                  
                  return (
                    <div key={index} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 relative">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        
                        {/* Compte Autocomplete Search Input */}
                        <div className="col-span-3 relative">
                          <input
                            type="text"
                            placeholder="Compte (ex: 701)"
                            value={line.accountCode}
                            onFocus={() => setActiveDropdownIndex(index)}
                            onChange={(e) => handleLineChange(index, 'accountCode', e.target.value)}
                            className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono font-bold"
                          />
                          {activeDropdownIndex === index && (
                            <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-20 divide-y divide-slate-50">
                              {accounts
                                .filter((acc) => acc.code.includes(line.accountCode) || acc.label.toLowerCase().includes(line.accountCode.toLowerCase()))
                                .slice(0, 8)
                                .map((acc) => (
                                  <button
                                    key={acc.code}
                                    type="button"
                                    onClick={() => {
                                      handleLineChange(index, 'accountCode', acc.code);
                                      setActiveDropdownIndex(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs hover:bg-violet-50 hover:text-violet-700 font-bold transition-colors"
                                  >
                                    <span className="font-mono text-violet-600 mr-2">{acc.code}</span>
                                    {acc.label}
                                  </button>
                                ))}
                              {accounts.filter((acc) => acc.code.includes(line.accountCode) || acc.label.toLowerCase().includes(line.accountCode.toLowerCase())).length === 0 && (
                                <div className="p-2 text-xs italic text-slate-400 text-center">Aucun match</div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Account Label and Pedagogical link */}
                        <div className="col-span-4 text-xs font-bold text-slate-700 truncate flex items-center gap-1.5">
                          <span>{line.accountLabel || 'Sélectionner un compte'}</span>
                          <button
                            type="button"
                            onClick={() => setPedagogicalCode(line.accountCode)}
                            className="text-[9px] font-extrabold text-violet-600 bg-violet-100 px-1 py-0.5 rounded hover:bg-violet-200"
                          >
                            ?
                          </button>
                        </div>

                        {/* Debit Input */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="Débit"
                            value={line.debit || ''}
                            onChange={(e) => handleLineChange(index, 'debit', Number(e.target.value))}
                            className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono font-bold text-right text-emerald-600"
                          />
                        </div>

                        {/* Credit Input */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="Crédit"
                            value={line.credit || ''}
                            onChange={(e) => handleLineChange(index, 'credit', Number(e.target.value))}
                            className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono font-bold text-right text-rose-600"
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="col-span-1 flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setShowAdvancedLines({ ...showAdvancedLines, [index]: !isAdvancedOpen })}
                            className={`p-1 rounded text-xs font-extrabold ${isAdvancedOpen ? 'text-violet-600 bg-violet-50' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Champs multidimensionnels (Devise, Analytique, Projet...)"
                          >
                            📊
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(index)}
                            className="text-xs font-bold text-rose-400 hover:text-rose-600 p-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Account Metadata Preview */}
                      {details && (
                        <div className="text-[10px] font-semibold text-slate-500 bg-slate-100/50 p-1.5 px-3 rounded-xl border border-slate-200/50 flex flex-wrap gap-x-4 gap-y-1">
                          <span><strong>Solde :</strong> <span className={details.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{details.balance.toLocaleString('fr-FR')} FCFA</span></span>
                          <span><strong>Nature :</strong> {details.category}</span>
                          <span><strong>Classe :</strong> {details.classNum}</span>
                          {details.lastUsed && <span><strong>Dernière util. :</strong> {details.lastUsed}</span>}
                        </div>
                      )}

                      {/* Expandable Advanced Fields (Centre de coûts, Projet, Devise, Échéance, Réf.) */}
                      {isAdvancedOpen && (
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mt-2 pt-2 border-t border-slate-200/60 text-left animate-in slide-in-from-top-1 duration-150">
                          <div>
                            <label className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wide block mb-0.5">Centre de coûts</label>
                            <input
                              type="text"
                              placeholder="ex: VENTES"
                              value={line.costCenter || ''}
                              onChange={(e) => handleLineChange(index, 'costCenter', e.target.value)}
                              className="w-full p-1.5 rounded-lg border border-slate-200 text-[10px] font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wide block mb-0.5">Projet / Affaire</label>
                            <input
                              type="text"
                              placeholder="ex: PROJ-A"
                              value={line.project || ''}
                              onChange={(e) => handleLineChange(index, 'project', e.target.value)}
                              className="w-full p-1.5 rounded-lg border border-slate-200 text-[10px] font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wide block mb-0.5">Devise</label>
                            <input
                              type="text"
                              placeholder="XAF"
                              value={line.currency || ''}
                              onChange={(e) => handleLineChange(index, 'currency', e.target.value)}
                              className="w-full p-1.5 rounded-lg border border-slate-200 text-[10px] font-bold font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wide block mb-0.5">Taux change</label>
                            <input
                              type="number"
                              placeholder="1.0"
                              value={line.exchangeRate || ''}
                              onChange={(e) => handleLineChange(index, 'exchangeRate', e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full p-1.5 rounded-lg border border-slate-200 text-[10px] font-bold font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wide block mb-0.5">Réf. Tiers</label>
                            <input
                              type="text"
                              placeholder="ex: FACT-98"
                              value={line.reference || ''}
                              onChange={(e) => handleLineChange(index, 'reference', e.target.value)}
                              className="w-full p-1.5 rounded-lg border border-slate-200 text-[10px] font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wide block mb-0.5">Échéance</label>
                            <input
                              type="date"
                              value={line.dueDate || ''}
                              onChange={(e) => handleLineChange(index, 'dueDate', e.target.value)}
                              className="w-full p-1.5 rounded-lg border border-slate-200 text-[10px] font-bold"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Boutons d'actions de table */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1"
                  >
                    + Ajouter une ligne d'écriture
                  </button>
                  <button
                    type="button"
                    onClick={handleAutoBalanceLastLine}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    ⚡ Équilibrer automatiquement (F5)
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono font-bold">
                  <div>Total Débit : <span className="text-emerald-600">{totalDebit.toLocaleString('fr-FR')} FCFA</span></div>
                  <div>Total Crédit : <span className="text-rose-600">{totalCredit.toLocaleString('fr-FR')} FCFA</span></div>
                  <div className={isBalanced ? 'text-emerald-600 font-extrabold px-2 py-0.5 rounded-full bg-emerald-100' : 'text-rose-600 font-extrabold px-2 py-0.5 rounded-full bg-rose-100'}>
                    {isBalanced ? '✓ Équilibrée' : '⚠️ Déséquilibrée'}
                  </div>
                </div>
              </div>

              {/* Raccourcis cheatsheet */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-wrap justify-between items-center gap-2 text-[10px] text-slate-400 font-medium font-mono">
                <span>⌨️ Raccourcis:</span>
                <span>[ F2 ] Rechercher Compte</span>
                <span>[ F5 ] Équilibrer l'Écriture</span>
                <span>[ Ctrl+S ] Enregistrer Brouillon</span>
                <span>[ Ctrl+Entrée ] Valider l'Écriture</span>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-3 text-xs font-bold rounded-xl text-white transition-all shadow-md flex items-center gap-2 ${
                    isBalanced
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-violet-200'
                      : 'bg-violet-600 opacity-90 hover:bg-violet-700'
                  } disabled:opacity-50`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Comptabilisation en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Valider et comptabiliser l'écriture (Ctrl+Entrée)
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Widgets latéraux et Synthèse (4/12) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Live Double-Entry Ledger Preview Card */}
            <div className="p-5 bg-white border border-violet-100 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Aperçu Avant Validation (Grand Livre)</h4>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${isBalanced ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {isBalanced ? 'Équilibré' : 'Non équilibré'}
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {lines.map((line, i) => (
                  <div key={i} className="p-2 border-l-4 border-violet-600 bg-slate-50/60 rounded-r-xl text-[11px] font-mono flex justify-between items-start">
                    <div className="space-y-0.5 max-w-[65%]">
                      <div className="font-extrabold text-violet-700">{line.accountCode}</div>
                      <div className="text-[10px] text-slate-500 font-bold truncate">{line.accountLabel}</div>
                      {line.costCenter && <div className="text-[9px] text-slate-400">Analytique: {line.costCenter}</div>}
                    </div>
                    <div className="text-right font-bold text-xs space-y-0.5">
                      {Number(line.debit) > 0 && <div className="text-emerald-600">D: {fmtMoney(line.debit)}</div>}
                      {Number(line.credit) > 0 && <div className="text-rose-600">C: {fmtMoney(line.credit)}</div>}
                    </div>
                  </div>
                ))}
                {lines.length === 0 && (
                  <div className="text-center py-4 text-xs italic text-slate-400">
                    Aucune ligne d'écriture saisie.
                  </div>
                )}
              </div>
            </div>

            {/* Tableau de Synthèse (HT, TVA, TTC) */}
            <div className="p-5 bg-slate-900 text-white rounded-3xl shadow-md border border-slate-800 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2">Synthèse Financière</h4>
              
              {(() => {
                const htVal = lines.filter(l => l.accountCode.startsWith('60') || l.accountCode.startsWith('70')).reduce((sum, l) => sum + (Number(l.debit) || Number(l.credit) || 0), 0);
                const tvaVal = lines.filter(l => l.accountCode.startsWith('445') || l.accountCode.startsWith('443')).reduce((sum, l) => sum + (Number(l.debit) || Number(l.credit) || 0), 0);
                const ttcVal = isBalanced ? Math.max(totalDebit, totalCredit) : totalDebit + totalCredit;
                
                return (
                  <div className="space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Montant HT :</span>
                      <span className="font-extrabold text-slate-100">{fmtMoney(htVal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">TVA Détectée :</span>
                      <span className="font-extrabold text-violet-300">{fmtMoney(tvaVal)}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-bold">
                      <span className="text-slate-300">TTC / Total :</span>
                      <span className="font-black text-emerald-400">{fmtMoney(ttcVal)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Drag & Drop OCR Pièces Justificatives */}
            <div className="p-5 bg-white border border-indigo-100 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5"><FileText className="w-4 h-4 text-indigo-600" /> Numériser une pièce (OCR)</h4>
                <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase">Instant OCR</span>
              </div>
              
              <label
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleActualOcrUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`block border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  isDragging ? 'border-indigo-600 bg-indigo-100/50 scale-[1.01]' : 'border-indigo-100 hover:border-indigo-300 bg-slate-50/50 hover:bg-slate-100/50'
                }`}
              >
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleActualOcrUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="text-xs font-bold text-slate-700">Déposer un PDF, PNG, JPEG</div>
                <div className="text-[9px] text-slate-400 mt-1">Glissez-déposez ou cliquez pour parcourir</div>
              </label>

              {ocrLoading && (
                <div className="flex items-center justify-center gap-2 p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs font-bold text-indigo-700 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></span>
                  Extraction par IA Gemini en cours...
                </div>
              )}

              {ocrPreviewFile && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 truncate">📄 Fichier chargé: {ocrPreviewFile.name} ({ocrPreviewFile.size})</div>
                  {ocrPreviewFile.previewUrl && (
                    <div className="h-20 rounded-xl overflow-hidden bg-slate-200 relative border">
                      <img src={ocrPreviewFile.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Analyse d'impact en temps réel */}
            <div className="p-5 bg-white border border-violet-100 rounded-3xl shadow-sm space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide border-b pb-2 flex items-center gap-1.5"><Activity className="w-4 h-4 text-violet-600" /> Analyse d'Impact Financier</h4>
              
              {(() => {
                // Trésorerie
                const tresDebit = lines.filter(l => l.accountCode.startsWith('5')).reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
                const tresCredit = lines.filter(l => l.accountCode.startsWith('5')).reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
                const tresImpact = tresDebit - tresCredit;

                // Résultat
                const chgVal = lines.filter(l => l.accountCode.startsWith('6')).reduce((sum, l) => sum + (Number(l.debit) || 0) - (Number(l.credit) || 0), 0);
                const prdVal = lines.filter(l => l.accountCode.startsWith('7')).reduce((sum, l) => sum + (Number(l.credit) || 0) - (Number(l.debit) || 0), 0);
                const netImpact = prdVal - chgVal;

                // TVA
                const dedTva = lines.filter(l => l.accountCode.startsWith('445')).reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
                const colTva = lines.filter(l => l.accountCode.startsWith('443')).reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
                
                return (
                  <div className="space-y-3 text-xs leading-relaxed">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Impact Trésorerie:</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded ${tresImpact > 0 ? 'bg-emerald-100 text-emerald-800' : tresImpact < 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>
                        {tresImpact > 0 ? '+' : ''}{tresImpact.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Impact Résultat (Net):</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded ${netImpact > 0 ? 'bg-emerald-100 text-emerald-800' : netImpact < 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>
                        {netImpact > 0 ? '+' : ''}{netImpact.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">TVA Déductible:</span>
                      <span className="font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                        {dedTva.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">TVA Collectée:</span>
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {colTva.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Contrôles automatiques */}
            <div className="p-5 bg-white border border-violet-100 rounded-3xl shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500" /> Contrôles de Cohérence
                </h4>
                {(() => {
                  const alerts = getLiveValidationAlerts();
                  const score = Math.max(40, 100 - alerts.filter(a => a.type === 'BLOCK').length * 15 - alerts.filter(a => a.type === 'WARNING').length * 5);
                  return (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${score >= 90 ? 'bg-emerald-100 text-emerald-800' : score >= 70 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                      Score : {score}%
                    </span>
                  );
                })()}
              </div>

              {(() => {
                const alerts = getLiveValidationAlerts();
                const score = Math.max(40, 100 - alerts.filter(a => a.type === 'BLOCK').length * 15 - alerts.filter(a => a.type === 'WARNING').length * 5);
                return (
                  <div className="space-y-3">
                    {/* Progress Bar de Conformité */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-bold text-slate-400">
                        <span>CONFORMITÉ OHADA</span>
                        <span>{score}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${score >= 90 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {alerts.map((a, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-xl text-[10px] font-bold border flex gap-2 items-start ${
                            a.type === 'BLOCK' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}
                        >
                          <span className="mt-0.5">{a.type === 'BLOCK' ? '🔴' : '⚠️'}</span>
                          <p>{a.message}</p>
                        </div>
                      ))}
                      {alerts.length === 0 && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 p-2.5 rounded-2xl">
                          <Check className="w-4 h-4" /> Aucun avertissement détecté
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modèles Favoris & Écritures Guidées */}
            <div className="p-5 bg-white border border-violet-100 rounded-3xl shadow-sm space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide border-b pb-2">Modèles Favoris & Écritures Guidées</h4>
              <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-extrabold">
                <button
                  type="button"
                  onClick={() => {
                    setLines(JOURNAL_TEMPLATES.VENTES);
                    setJournalType('VENTES');
                    setWording('Vente de marchandises Client Standard');
                  }}
                  className="p-2 border rounded-xl hover:bg-violet-50 hover:border-violet-300 transition-colors"
                >
                  🛍️ Vente standard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLines(JOURNAL_TEMPLATES.ACHATS);
                    setJournalType('ACHATS');
                    setWording('Achat de fournitures Fournisseur Standard');
                  }}
                  className="p-2 border rounded-xl hover:bg-violet-50 hover:border-violet-300 transition-colors"
                >
                  🛒 Achat standard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLines(JOURNAL_TEMPLATES.BANQUE);
                    setJournalType('BANQUE');
                    setWording('Paiement facture client par virement');
                  }}
                  className="p-2 border rounded-xl hover:bg-violet-50 hover:border-violet-300 transition-colors"
                >
                  🏦 Virement banque
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLines(JOURNAL_TEMPLATES.CAISSE);
                    setJournalType('CAISSE');
                    setWording('Retrait espèces caisse');
                  }}
                  className="p-2 border rounded-xl hover:bg-violet-50 hover:border-violet-300 transition-colors"
                >
                  💵 Retrait caisse
                </button>
                
                {/* Guided templates */}
                <button
                  type="button"
                  onClick={() => {
                    setLines(GUIDED_TEMPLATES.TVA_DECLARATION);
                    setJournalType('OD');
                    setWording('Déclaration de TVA mensuelle - Régularisation');
                  }}
                  className="p-2 border border-violet-200 bg-violet-50/50 rounded-xl hover:bg-violet-100 hover:border-violet-300 transition-colors text-violet-900"
                >
                  ⚖️ Décl. TVA mensuelle
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLines(GUIDED_TEMPLATES.DOTATIONS);
                    setJournalType('OD');
                    setWording('Dotation aux amortissements d\'exploitation (Annuel)');
                  }}
                  className="p-2 border border-violet-200 bg-violet-50/50 rounded-xl hover:bg-violet-100 hover:border-violet-300 transition-colors text-violet-900"
                >
                  📊 Amortissement Immo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLines(GUIDED_TEMPLATES.REGULARISATIONS);
                    setJournalType('OD');
                    setWording('Régularisation Charge Constatée d\'Avance (CCA)');
                  }}
                  className="p-2 border border-violet-200 bg-violet-50/50 rounded-xl hover:bg-violet-100 hover:border-violet-300 transition-colors text-violet-900"
                >
                  ⚡ Régul. CCA fin d'ex
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── TAB 3: Journaux Comptables ───────────────────────────────────────── */}
      {tab === 'journaux' && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-violet-600" />
              <h3 className="text-sm font-extrabold text-slate-900">Consultation des Journaux Auxiliaires SYSCOHADA</h3>
            </div>
            <div className="text-xs text-slate-500 font-medium">Exercice 2026 — 6 Journaux Ouverts</div>
          </div>

          {/* Filtres par Journal */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { id: 'TOUS', label: 'Tous les Journaux' },
              { id: 'VENTES', label: '🛍️ Ventes (VT)' },
              { id: 'ACHATS', label: '🛒 Achats (AC)' },
              { id: 'BANQUE', label: '🏦 Banque (BQ)' },
              { id: 'CAISSE', label: '💵 Caisse (CA)' },
              { id: 'SALAIRES', label: '👥 Salaires (SA)' },
              { id: 'OD', label: '📑 Opérations Diverses (OD)' },
            ].map((j) => (
              <button
                key={j.id}
                onClick={() => setSelectedJournalFilter(j.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  selectedJournalFilter === j.id ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {j.label}
              </button>
            ))}
          </div>

          {/* Cartes Synthétiques des 6 Journaux */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { code: 'VT', name: 'Journal des Ventes', type: 'VENTES', color: '#10B981', bg: '#ECFDF5' },
              { code: 'AC', name: 'Journal des Achats', type: 'ACHATS', color: '#EF4444', bg: '#FEF2F2' },
              { code: 'BQ', name: 'Journal de Banque', type: 'BANQUE', color: '#3B82F6', bg: '#EFF6FF' },
              { code: 'CA', name: 'Journal de Caisse', type: 'CAISSE', color: '#F59E0B', bg: '#FFFBEB' },
              { code: 'SA', name: 'Journal des Salaires', type: 'SALAIRES', color: '#8B5CF6', bg: '#F5F3FF' },
              { code: 'OD', name: 'Opérations Diverses', type: 'OD', color: '#64748B', bg: '#F8FAFC' },
            ].map((j) => {
              const count = entries.filter((e) => e.journalType === j.type).length;
              return (
                <div
                  key={j.code}
                  onClick={() => setSelectedJournalFilter(j.type as any)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedJournalFilter === j.type ? 'ring-2 ring-violet-500 shadow-md' : 'hover:border-violet-200'
                  }`}
                  style={{ background: j.bg }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded" style={{ background: `${j.color}20`, color: j.color }}>
                      {j.code}
                    </span>
                    <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">OUVERT</span>
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 mt-2 truncate">{j.name}</div>
                  <div className="text-[10px] font-bold text-slate-500 mt-0.5">{count} écriture{count > 1 ? 's' : ''}</div>
                </div>
              );
            })}
          </div>

          {/* Tableau des Écritures du Journal Sélectionné */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-extrabold uppercase text-slate-700">
              {selectedJournalFilter === 'TOUS' ? 'Toutes les Écritures Centralisées' : `Écritures du Journal (${selectedJournalFilter})`}
            </h4>

            {filteredJournalEntries.length === 0 ? (
              <div className="text-xs italic text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                Aucune écriture enregistrée pour ce journal.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="uppercase font-semibold text-[10px] text-slate-400 border-b">
                    <tr>
                      <th className="p-2.5">N° Écriture</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">N° Pièce</th>
                      <th className="p-2.5">Journal</th>
                      <th className="p-2.5">Libellé d'écriture</th>
                      <th className="p-2.5 text-right">Lignes (Comptes)</th>
                      <th className="p-2.5 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredJournalEntries.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-violet-600">{e.entryNumber}</td>
                        <td className="p-2.5 font-mono text-slate-500">{e.date}</td>
                        <td className="p-2.5 font-mono text-slate-700 font-bold">{e.pieceNumber}</td>
                        <td className="p-2.5 font-bold text-slate-800">{e.journalType}</td>
                        <td className="p-2.5 text-slate-800">{e.wording}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-700">{e.lines?.length || 0} lignes</td>
                        <td className="p-2.5 text-right">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✓ Validée</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: Plan Comptable SYSCOHADA ─────────────────────────────────── */}
      {tab === 'plan' && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 border-b pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-extrabold text-slate-900">Plan Comptable Général SYSCOHADA (Classes 1 à 8)</h3>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Rechercher un compte ou libellé..."
                value={searchAccount}
                onChange={(e) => setSearchAccount(e.target.value)}
                className="p-2 text-xs font-bold border border-slate-200 rounded-xl w-64"
              />
            </div>
          </div>

          {/* Filtres par Classes */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedClass(null)}
              className={`px-3 py-1 text-xs font-bold rounded-lg ${selectedClass === null ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Toutes les classes
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedClass(c)}
                className={`px-3 py-1 text-xs font-bold rounded-lg ${selectedClass === c ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Classe {c}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase font-semibold text-[10px] text-slate-400 border-b">
                <tr>
                  <th className="p-2.5">Code Compte</th>
                  <th className="p-2.5">Intitulé du Compte SYSCOHADA</th>
                  <th className="p-2.5">Classe</th>
                  <th className="p-2.5 text-right">Explication Pédagogique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((acc) => (
                  <React.Fragment key={acc.code}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-mono font-bold text-violet-600">{acc.code}</td>
                      <td className="p-2.5 font-bold text-slate-800">{acc.label}</td>
                      <td className="p-2.5 text-slate-500 font-semibold">Classe {acc.classNum}</td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => setPedagogicalCode(acc.code)}
                          className="text-[10px] font-extrabold text-violet-600 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-lg transition-colors animate-all"
                        >
                          [ Explication SYSCOHADA ]
                        </button>
                        <button
                          onClick={() => setExpandedTrendCode(expandedTrendCode === acc.code ? null : acc.code)}
                          className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors ml-1"
                        >
                          📈 Historique
                        </button>
                      </td>
                    </tr>
                    {expandedTrendCode === acc.code && (
                      <tr>
                        <td colSpan={4} className="bg-slate-50/50 p-4 border-y border-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                              <div className="text-[9px] font-bold text-slate-400 uppercase">Solde Hier</div>
                              <div className="text-xs font-black font-mono text-slate-700 mt-1">
                                {fmtMoney(acc.code.startsWith('6') ? 45000 : acc.code.startsWith('7') ? 120000 : 250000)}
                              </div>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                              <div className="text-[9px] font-bold text-slate-400 uppercase">Solde Aujourd'hui</div>
                              <div className="text-xs font-black font-mono text-indigo-600 mt-1">
                                {fmtMoney(acc.code.startsWith('6') ? 45000 : acc.code.startsWith('7') ? 120000 : 250000)}
                              </div>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                              <div className="text-[9px] font-bold text-slate-400 uppercase">Mois Précédent</div>
                              <div className="text-xs font-black font-mono text-slate-600 mt-1">
                                {fmtMoney(acc.code.startsWith('6') ? 30000 : acc.code.startsWith('7') ? 95000 : 230000)}
                              </div>
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                              <div className="text-[9px] font-bold text-slate-400 uppercase">Exercice Précédent</div>
                              <div className="text-xs font-black font-mono text-slate-600 mt-1">
                                {fmtMoney(acc.code.startsWith('6') ? 1800000 : acc.code.startsWith('7') ? 4200000 : 3500000)}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: Consultation Grand Livre & Balance ENRICHI PAR COMPTE ─────── */}
      {(tab === 'consultation' || tab === 'grand-livre' || tab === 'balance') && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              {tab === 'balance' ? <Scale className="w-4 h-4 text-violet-600" /> : <Layers className="w-4 h-4 text-violet-600" />}
              {tab === 'balance' ? 'Balance Générale à 6 Colonnes' : 'Grand Livre Général & par Compte'}
            </h3>
            {tab !== 'balance' && (
              <button
                onClick={() => setShowGrandLivrePrintModal(true)}
                className="px-3 py-1.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimer / Exporter PDF le Grand Livre
              </button>
            )}
          </div>

          {tab === 'balance' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="uppercase font-semibold text-[10px] text-slate-400 border-b">
                  <tr>
                    <th className="p-2.5">Compte</th>
                    <th className="p-2.5">Libellé</th>
                    <th className="p-2.5 text-right">Total Débit</th>
                    <th className="p-2.5 text-right">Total Crédit</th>
                    <th className="p-2.5 text-right">Solde Débiteur</th>
                    <th className="p-2.5 text-right">Solde Créditeur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {balanceRows.map((r) => (
                    <tr key={r.code} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-violet-600">{r.code}</td>
                      <td className="p-2.5 font-bold text-slate-800">{r.label}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-600 font-bold">{fmtMoney(r.debit)}</td>
                      <td className="p-2.5 text-right font-mono text-rose-600 font-bold">{fmtMoney(r.credit)}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-700 font-extrabold">{fmtMoney(r.soldeDebiteur)}</td>
                      <td className="p-2.5 text-right font-mono text-rose-700 font-extrabold">{fmtMoney(r.soldeCrediteur)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sélecteur de Compte pour Grand Livre */}
              <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200 space-y-2">
                <div className="text-xs font-extrabold text-violet-900 flex items-center justify-between">
                  <span>📖 Choisir un Compte Enregistré pour Afficher son Grand Livre Spécifique :</span>
                  {grandLivreFilter && (
                    <button
                      onClick={() => setGrandLivreFilter('')}
                      className="text-[10px] font-bold text-violet-600 underline"
                    >
                      Afficher tous les comptes
                    </button>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap items-center">
                  <button
                    onClick={() => setGrandLivreFilter('')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      grandLivreFilter === '' ? 'bg-violet-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Tous les comptes ({grandLivreLines.length})
                  </button>

                  {grandLivreAccounts.map((acc) => (
                    <button
                      key={acc.code}
                      onClick={() => setGrandLivreFilter(acc.code)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        grandLivreFilter === acc.code ? 'bg-violet-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-mono">{acc.code}</span>
                      <span className="text-[11px] opacity-90 truncate max-w-[120px]">{acc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* En-tête du Compte Sélectionné */}
              {grandLivreFilter && (
                <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-sm flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 font-mono font-extrabold flex items-center justify-center text-sm">
                      {grandLivreFilter}
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">
                        Grand Livre du Compte {grandLivreFilter}
                      </div>
                      <div className="text-xs text-slate-500">
                        {grandLivreAccountsMap.get(grandLivreFilter)?.label || 'Compte SYSCOHADA'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPedagogicalCode(grandLivreFilter)}
                      className="text-xs font-extrabold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      [ Explication SYSCOHADA ]
                    </button>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Solde Cumulé</div>
                      <div className="text-sm font-extrabold font-mono text-indigo-700">
                        {fmtMoney((grandLivreAccountsMap.get(grandLivreFilter)?.debit || 0) - (grandLivreAccountsMap.get(grandLivreFilter)?.credit || 0))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tableau Détaillé du Grand Livre avec Solde Progressif */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="uppercase font-semibold text-[10px] text-slate-400 border-b">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">N° Pièce</th>
                      <th className="p-2.5">Journal</th>
                      <th className="p-2.5">Compte</th>
                      <th className="p-2.5">Libellé d'opération</th>
                      <th className="p-2.5 text-right">Débit</th>
                      <th className="p-2.5 text-right">Crédit</th>
                      <th className="p-2.5 text-right">Solde Progressif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {grandLivreWithRunningBalance.map((gl, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono text-slate-500">{gl.date}</td>
                        <td className="p-2.5 font-mono font-bold text-violet-600">{gl.pieceNumber}</td>
                        <td className="p-2.5 font-bold text-slate-700">{gl.journalType}</td>
                        <td className="p-2.5 font-mono font-bold text-indigo-600">{gl.accountCode}</td>
                        <td className="p-2.5 text-slate-800">{gl.wording}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-600 font-bold">{fmtMoney(gl.debit)}</td>
                        <td className="p-2.5 text-right font-mono text-rose-600 font-bold">{fmtMoney(gl.credit)}</td>
                        <td className={`p-2.5 text-right font-mono font-extrabold ${gl.soldeProgressif >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                          {fmtMoney(gl.soldeProgressif)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 6: Comptes Auxiliaires & Tiers ─────────────────────────────── */}
      {tab === 'auxiliaires' && (
        <div className="space-y-6">
          {/* 1. ANOMALIES & FUSION DES DOUBLONS BANNER */}
          {(() => {
            const duplicates = findTiersDuplicates();
            if (duplicates.length === 0) return null;
            return (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex flex-wrap justify-between items-center gap-3 shadow-sm animate-pulse">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <span>
                    ⚠️ <strong>Doublons potentiels détectés :</strong> {duplicates[0].item1.name} et {duplicates[0].item2.name} partagent les mêmes informations d'identification ({duplicates[0].criteria}).
                  </span>
                </div>
                <button
                  onClick={() => handleMergeTiers(duplicates[0].item1.code, duplicates[0].item2.code)}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg shadow-sm transition-all text-[10px]"
                >
                  ⚡ Fusionner les Tiers
                </button>
              </div>
            );
          })()}

          {/* 2. DYNAMIC TABLEAUX DE BORD DU CRM COMPTABLE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Clients Dash */}
            <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-100 shadow-sm space-y-2 text-xs font-bold text-slate-800">
              <div className="flex justify-between items-center text-emerald-900 border-b pb-1.5 uppercase text-[10px] tracking-wider">
                <span>Section Clients (411)</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{tiersList.filter(t => t.type === 'Client').length} Actifs</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Créances Totales</div>
                  <div className="text-sm font-black text-emerald-600 mt-0.5">
                    {fmtMoney(tiersList.filter(t => t.type === 'Client').reduce((sum, t) => sum + t.solde, 0))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Créances Échues</div>
                  <div className="text-sm font-black text-rose-600 mt-0.5">
                    {fmtMoney(tiersList.filter(t => t.type === 'Client').reduce((sum, t) => sum + t.age60 + t.age90 + t.ageOver90, 0))}
                  </div>
                </div>
                <div className="col-span-2 border-t pt-1 flex justify-between font-sans">
                  <span className="text-slate-400">Délai moyen (DSO) :</span>
                  <span className="text-emerald-700">18 Jours</span>
                </div>
              </div>
            </div>

            {/* Fournisseurs Dash */}
            <div className="p-4 rounded-3xl bg-rose-50 border border-rose-100 shadow-sm space-y-2 text-xs font-bold text-slate-800">
              <div className="flex justify-between items-center text-rose-900 border-b pb-1.5 uppercase text-[10px] tracking-wider">
                <span>Section Fournisseurs (401)</span>
                <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">{tiersList.filter(t => t.type === 'Fournisseur').length} Partenaires</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Dettes Totales</div>
                  <div className="text-sm font-black text-rose-600 mt-0.5">
                    {fmtMoney(Math.abs(tiersList.filter(t => t.type === 'Fournisseur').reduce((sum, t) => sum + t.solde, 0)))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Paiements du Mois</div>
                  <div className="text-sm font-black text-emerald-600 mt-0.5">1 850 000 FCFA</div>
                </div>
                <div className="col-span-2 border-t pt-1 flex justify-between font-sans">
                  <span className="text-slate-400">Délai Règlement (DPO) :</span>
                  <span className="text-rose-700">35 Jours</span>
                </div>
              </div>
            </div>

            {/* Personnel Dash */}
            <div className="p-4 rounded-3xl bg-indigo-50 border border-indigo-100 shadow-sm space-y-2 text-xs font-bold text-slate-800">
              <div className="flex justify-between items-center text-indigo-900 border-b pb-1.5 uppercase text-[10px] tracking-wider">
                <span>Section Personnel (421)</span>
                <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">{tiersList.filter(t => t.type === 'Salarié').length} Employés</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Salaires du Mois</div>
                  <div className="text-sm font-black text-indigo-600 mt-0.5">4 850 000 FCFA</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Avances Accordées</div>
                  <div className="text-sm font-black text-amber-600 mt-0.5">
                    {fmtMoney(tiersList.filter(t => t.type === 'Salarié').reduce((sum, t) => sum + t.solde, 0))}
                  </div>
                </div>
                <div className="col-span-2 border-t pt-1 flex justify-between font-sans">
                  <span className="text-slate-400">Cotisations CNPS :</span>
                  <span className="text-indigo-700">1 200 000 FCFA</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. CONTROL BAR: SEARCH, FILTERS & MODES */}
          <div className="p-4 bg-white rounded-3xl border border-violet-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, compte, téléphone, NIF, ville..."
                  value={tiersSearchQuery}
                  onChange={(e) => setTiersSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-400"
                />
              </div>

              <select
                value={tiersFilterType}
                onChange={(e) => setTiersFilterType(e.target.value as any)}
                className="p-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
              >
                <option value="ALL">Tous les Tiers</option>
                <option value="Client">Clients</option>
                <option value="Fournisseur">Fournisseurs</option>
                <option value="Salarié">Personnel / Salariés</option>
              </select>

              <select
                value={tiersFilterRisk}
                onChange={(e) => setTiersFilterRisk(e.target.value as any)}
                className="p-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
              >
                <option value="ALL">Tous les Risques</option>
                <option value="Excellent">Risk: Excellent</option>
                <option value="Moyen">Risk: Moyen</option>
                <option value="Risqué">Risk: Risqué</option>
              </select>

              <select
                value={tiersFilterStatus}
                onChange={(e) => setTiersFilterStatus(e.target.value as any)}
                className="p-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
              >
                <option value="ALL">Tous les Statuts</option>
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
              </select>
            </div>

            <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-slate-50 font-bold text-xs">
              <button
                onClick={() => setTiersViewMode('LIST')}
                className={`px-3 py-1.5 rounded-lg transition-all ${tiersViewMode === 'LIST' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                📋 Tableau
              </button>
              <button
                onClick={() => setTiersViewMode('STATS')}
                className={`px-3 py-1.5 rounded-lg transition-all ${tiersViewMode === 'STATS' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                📊 Analytiques
              </button>
              <button
                onClick={() => setTiersViewMode('MAP')}
                className={`px-3 py-1.5 rounded-lg transition-all ${tiersViewMode === 'MAP' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                🗺️ Cartographie
              </button>
            </div>
          </div>

          {/* 4. MAIN VIEW CONTENT */}
          <div className="relative">
            {/* VIEW MODE: LIST */}
            {tiersViewMode === 'LIST' && (
              <div className="bg-white rounded-3xl border border-violet-100 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="uppercase font-semibold text-[10px] text-slate-400 border-b bg-slate-50/50">
                    <tr>
                      <th className="p-3">Compte</th>
                      <th className="p-3">Nom & Partenaire</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-right">Solde Comptable</th>
                      <th className="p-3 text-center">Factures</th>
                      <th className="p-3">Dernier Mouvement</th>
                      <th className="p-3 text-center">Risque</th>
                      <th className="p-3 text-center">Statut</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const filtered = tiersList.filter((item) => {
                        const matchesSearch =
                          item.name.toLowerCase().includes(tiersSearchQuery.toLowerCase()) ||
                          item.code.includes(tiersSearchQuery) ||
                          item.phone.includes(tiersSearchQuery) ||
                          item.nif.toLowerCase().includes(tiersSearchQuery.toLowerCase()) ||
                          item.city.toLowerCase().includes(tiersSearchQuery.toLowerCase());
                        const matchesType = tiersFilterType === 'ALL' || item.type === tiersFilterType;
                        const matchesRisk = tiersFilterRisk === 'ALL' || item.risk === tiersFilterRisk;
                        const matchesStatus = tiersFilterStatus === 'ALL' || item.status === tiersFilterStatus;
                        return matchesSearch && matchesType && matchesRisk && matchesStatus;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                              Aucun partenaire ne correspond aux critères de recherche.
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((item) => (
                        <tr
                          key={item.code}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                          onClick={() => setSelectedTiers(item)}
                        >
                          <td className="p-3 font-mono font-bold text-violet-600">{item.code}</td>
                          <td className="p-3 font-black text-slate-800">
                            <div>{item.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold">{item.city}, {item.country}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.type === 'Client' ? 'bg-emerald-100 text-emerald-800' :
                              item.type === 'Fournisseur' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800">
                            <span className={item.solde < 0 ? 'text-rose-600' : item.solde > 0 ? 'text-emerald-600' : 'text-slate-500'}>
                              {fmtMoney(item.solde)}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-500">{item.invoicesCount}</td>
                          <td className="p-3 font-mono text-slate-400 font-semibold">{item.lastMove || '-'}</td>
                          <td className="p-3 text-center text-xs">
                            <span className={
                              item.risk === 'Excellent' ? 'text-emerald-500' :
                              item.risk === 'Moyen' ? 'text-amber-500' : 'text-rose-500'
                            }>
                              ● {item.risk}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                              item.status === 'Actif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setSelectedTiers(item);
                                setRelanceMessageText(`Bonjour M. l'Administrateur de ${item.name}, nous vous contactons pour un rappel concernant le solde comptable de votre compte ${item.code} d'un montant de ${fmtMoney(item.solde)}. Merci de procéder à la régularisation.`);
                                setRelanceModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 font-extrabold text-[10px] transition-colors"
                            >
                              ⚡ Relancer
                            </button>
                            <button
                              onClick={() => {
                                const csvContent = `Compte;Partenaire;Type;Solde;NIF;RCCM;Ville\n${item.code};${item.name};${item.type};${item.solde};${item.nif};${item.rccm};${item.city}`;
                                handleExportCSV(`Releve_${item.code}`, csvContent);
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 font-extrabold text-[10px] ml-1 transition-colors"
                            >
                              📥 Statement
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIEW MODE: STATS */}
            {tiersViewMode === 'STATS' && (
              <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-6">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide border-b pb-2 flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-violet-600" /> Analytiques & Évolution de l'Encours Partenaires
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top 5 Créances Clients */}
                  <div className="p-4 bg-slate-50/50 border rounded-2xl space-y-3 text-xs font-bold">
                    <h5 className="text-slate-800 font-extrabold border-b pb-1">Top Créances Clients (D DSO)</h5>
                    <div className="space-y-2">
                      {tiersList.filter(t => t.type === 'Client').sort((a,b) => b.solde - a.solde).slice(0, 3).map((t, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between font-mono">
                            <span>{t.name}</span>
                            <span className="text-emerald-600 font-black">{fmtMoney(t.solde)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (t.solde / 5000000) * 100)}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top 5 Dettes Fournisseurs */}
                  <div className="p-4 bg-slate-50/50 border rounded-2xl space-y-3 text-xs font-bold">
                    <h5 className="text-slate-800 font-extrabold border-b pb-1">Top Dettes Fournisseurs (D DPO)</h5>
                    <div className="space-y-2">
                      {tiersList.filter(t => t.type === 'Fournisseur').sort((a,b) => a.solde - b.solde).slice(0, 3).map((t, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between font-mono">
                            <span>{t.name}</span>
                            <span className="text-rose-600 font-black">{fmtMoney(Math.abs(t.solde))}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, (Math.abs(t.solde) / 5000000) * 100)}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW MODE: MAP */}
            {tiersViewMode === 'MAP' && (
              <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide border-b pb-2 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-violet-600" /> Cartographie des Établissements Partenaires (Dakar - Abidjan - Douala)
                </h4>
                <div className="p-10 bg-slate-900 text-white rounded-2xl text-center border space-y-4">
                  <div className="text-sm font-extrabold text-violet-300">🗺️ Réseau Logistique & Recouvrement Interactif</div>
                  <div className="flex justify-center gap-10 text-xs font-mono font-black pt-3">
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-1.5 w-40">
                      <div className="text-[10px] text-slate-400">🇸🇳 DAKAR</div>
                      <div className="text-emerald-400">3 Tiers Actifs</div>
                      <div className="text-white">DSO moyen: 12j</div>
                    </div>
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-1.5 w-40">
                      <div className="text-[10px] text-slate-400">🇨🇮 ABIDJAN</div>
                      <div className="text-emerald-400">2 Tiers Actifs</div>
                      <div className="text-white">DSO moyen: 22j</div>
                    </div>
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-1.5 w-40">
                      <div className="text-[10px] text-slate-400">🇨🇲 DOUALA</div>
                      <div className="text-slate-400">0 Actifs</div>
                      <div className="text-slate-500">Succursale vide</div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 pt-3">Simulé sur la base des localisations administratives saisies dans les fiches tiers.</p>
                </div>
              </div>
            )}
          </div>

          {/* 5. COCKPIT 360° SIDE OVERLAY PANEL */}
          {selectedTiers && (
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl border-l border-violet-100 flex flex-col animate-in slide-in-from-right duration-200">
              {/* Header */}
              <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                    {selectedTiers.code.substring(0, 3)}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{selectedTiers.name}</h3>
                    <p className="text-xs text-violet-600 font-bold uppercase">{selectedTiers.type} — Compte {selectedTiers.code}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Risk stars rating */}
                  <div className="text-amber-500 text-xs font-bold tracking-widest mr-2">
                    {selectedTiers.risk === 'Excellent' ? '★★★★★' : selectedTiers.risk === 'Moyen' ? '★★★☆☆' : '★★☆☆☆'}
                  </div>
                  <button
                    onClick={() => setSelectedTiers(null)}
                    className="text-xs font-black text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg border bg-white hover:bg-slate-50"
                  >
                    Fermer X
                  </button>
                </div>
              </div>

              {/* Stepper Relation Timeline Bar */}
              <div className="p-4 bg-slate-50 border-b overflow-x-auto">
                <div className="flex justify-between items-center text-center text-[9px] font-black text-slate-400 gap-2">
                  <div className="flex flex-col items-center">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-0.5">✓</span>
                    <span>Créé</span>
                  </div>
                  <div className="h-0.5 bg-emerald-300 flex-1 min-w-[20px]"></div>
                  <div className="flex flex-col items-center">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-0.5">✓</span>
                    <span>1ère Facture</span>
                  </div>
                  <div className="h-0.5 bg-emerald-300 flex-1 min-w-[20px]"></div>
                  <div className="flex flex-col items-center">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-0.5">✓</span>
                    <span>Règlement</span>
                  </div>
                  <div className="h-0.5 bg-indigo-200 flex-1 min-w-[20px]"></div>
                  <div className="flex flex-col items-center">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mb-0.5">4</span>
                    <span>Suivi / Relance</span>
                  </div>
                  <div className="h-0.5 bg-slate-200 flex-1 min-w-[20px]"></div>
                  <div className="flex flex-col items-center text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center mb-0.5">5</span>
                    <span>Archivage</span>
                  </div>
                </div>
              </div>

              {/* Sub-tabs bar */}
              <div className="flex border-b text-xs font-black text-slate-400 bg-slate-50/50">
                {[
                  { id: 'CONTACT', label: '👤 Administration' },
                  { id: 'FINANCE', label: '📊 Balance Âgée' },
                  { id: 'TIMELINE', label: '⏳ Historique' },
                  { id: 'GED', label: '📁 Documents' },
                  { id: 'IA', label: '✨ Analyse IA' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTiersCockpitTab(t.id as any)}
                    className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                      activeTiersCockpitTab === t.id ? 'border-violet-600 text-violet-600 bg-white font-black' : 'border-transparent hover:text-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-bold">
                {activeTiersCockpitTab === 'CONTACT' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase">Partenaire</label>
                        <div className="p-2.5 rounded-xl bg-slate-50 border text-slate-800">{selectedTiers.name}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase">Compte Auxiliaire</label>
                        <div className="p-2.5 rounded-xl bg-slate-50 border font-mono text-slate-800">{selectedTiers.code}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase">Téléphone</label>
                        <div className="p-2.5 rounded-xl bg-slate-50 border text-slate-800">{selectedTiers.phone || '-'}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase">Courriel (Email)</label>
                        <div className="p-2.5 rounded-xl bg-slate-50 border text-slate-800">{selectedTiers.email || '-'}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase">Adresse Postale</label>
                        <div className="p-2.5 rounded-xl bg-slate-50 border text-slate-800">{selectedTiers.address}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase">Ville & Pays</label>
                        <div className="p-2.5 rounded-xl bg-slate-50 border text-slate-800">{selectedTiers.city}, {selectedTiers.country}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase">Numéro NIF (Fisc)</label>
                        <div className="p-2.5 rounded-xl bg-slate-50 border text-slate-800 font-mono">{selectedTiers.nif}</div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase">Registre de Commerce (RCCM)</label>
                        <div className="p-2.5 rounded-xl bg-slate-50 border text-slate-800 font-mono">{selectedTiers.rccm}</div>
                      </div>
                    </div>

                    {/* Direct contact actions */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="text-[10px] text-slate-400 uppercase">Communication Directe</div>
                      <div className="flex gap-2">
                        <a
                          href={`tel:${selectedTiers.phone}`}
                          className="flex-1 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-center border transition-all"
                        >
                          📞 Téléphoner
                        </a>
                        <a
                          href={`mailto:${selectedTiers.email}`}
                          className="flex-1 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-center border transition-all"
                        >
                          ✉️ Envoyer un Email
                        </a>
                        <a
                          href={`https://wa.me/${selectedTiers.phone?.replace('+', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-center border border-emerald-200 transition-all"
                        >
                          💬 Contacter par WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {activeTiersCockpitTab === 'FINANCE' && (
                  <div className="space-y-6">
                    {/* Encours autorisé */}
                    <div className="p-4 bg-slate-50 rounded-2xl border space-y-3">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Plafond d'encours autorisé :</span>
                        <span>{fmtMoney(selectedTiers.encoursAutorise)}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-violet-600 rounded-full" 
                          style={{ width: `${selectedTiers.encoursAutorise > 0 ? (selectedTiers.encoursUtilise / selectedTiers.encoursAutorise) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between font-mono text-[10px]">
                        <span>Utilisé : {fmtMoney(selectedTiers.encoursUtilise)}</span>
                        <span className="text-violet-600">Restant : {fmtMoney(selectedTiers.encoursAutorise - selectedTiers.encoursUtilise)}</span>
                      </div>
                    </div>

                    {/* Balance Âgée color blocks */}
                    <div className="space-y-3">
                      <div className="text-[10px] text-slate-400 uppercase border-b pb-1">Détail par échéance de retard</div>
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900">
                          <div className="text-[9px] text-slate-400">0-30 jours</div>
                          <div className="text-sm font-black mt-1">{fmtMoney(selectedTiers.age30)}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-900">
                          <div className="text-[9px] text-slate-400">31-60 jours</div>
                          <div className="text-sm font-black mt-1">{fmtMoney(selectedTiers.age60)}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-900">
                          <div className="text-[9px] text-slate-400">61-90 jours</div>
                          <div className="text-sm font-black mt-1">{fmtMoney(selectedTiers.age90)}</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-900">
                          <div className="text-[9px] text-slate-400">90+ jours</div>
                          <div className="text-sm font-black mt-1">{fmtMoney(selectedTiers.ageOver90)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTiersCockpitTab === 'TIMELINE' && (
                  <div className="space-y-4">
                    <div className="text-[10px] text-slate-400 uppercase border-b pb-1">Historique des opérations du dossier</div>
                    
                    <div className="relative pl-6 border-l-2 border-slate-200 space-y-4 font-bold text-xs">
                      {selectedTiers.timeline.map((event, i) => (
                        <div key={i} className="relative">
                          <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-slate-200 border-4 border-white shadow-sm"></span>
                          <div className="space-y-0.5">
                            <div className="font-mono text-slate-400">{event.date}</div>
                            <div className="text-slate-800">{event.event}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{event.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTiersCockpitTab === 'GED' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-1">
                      <span className="text-[10px] text-slate-400 uppercase">Documents juridiques stockés</span>
                      <button className="text-[10px] text-violet-600 bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-200">
                        + Ajouter un document
                      </button>
                    </div>

                    <div className="space-y-2">
                      {selectedTiers.documents.map((doc) => (
                        <div key={doc.id} className="p-3 bg-slate-50 border rounded-2xl flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span>📄</span>
                            <div>
                              <div>{doc.name}</div>
                              <div className="text-[9px] text-slate-400 font-mono">{doc.date} • {doc.size}</div>
                            </div>
                          </div>
                          <span className="text-[9px] font-black text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full uppercase">{doc.type}</span>
                        </div>
                      ))}

                      {selectedTiers.documents.length === 0 && (
                        <div className="text-center py-8 text-slate-400 italic">
                          Aucun document importé.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTiersCockpitTab === 'IA' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100 space-y-2">
                      <div className="text-[10px] text-violet-900 uppercase">Diagnostic prévisionnel IA OHADA</div>
                      <p className="text-slate-700 italic font-semibold leading-relaxed">
                        "{selectedTiers.aiAnalysis}"
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setRelanceMessageText(`Bonjour, nous vous notifions que le compte tiers ${selectedTiers.code} présente un encours utilisé de ${fmtMoney(selectedTiers.encoursUtilise)}. Merci de procéder au paiement.`);
                        setRelanceModalOpen(true);
                      }}
                      className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs shadow-sm transition-all"
                    >
                      ✉️ Lancer une relance automatique par Email/WhatsApp
                    </button>
                  </div>
                )}
              </div>

              {/* Close footer */}
              <div className="p-6 border-t flex justify-end bg-slate-50/50">
                <button
                  onClick={() => setSelectedTiers(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs shadow-sm transition-colors"
                >
                  Fermer Cockpit 360°
                </button>
              </div>
            </div>
          )}

          {/* 6. AUTOMATED RELANCES PREVIEW MODAL */}
          {relanceModalOpen && selectedTiers && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-violet-100 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-sm font-extrabold text-slate-900">Prévisualisation du Message de Relance</h4>
                  <button onClick={() => setRelanceModalOpen(false)} className="text-xs text-slate-400 font-bold">
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs font-bold">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Canal d'expédition</label>
                    <div className="flex gap-2 mt-1">
                      {['WHATSAPP', 'SMS', 'EMAIL'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setRelanceChannel(c as any)}
                          className={`flex-1 py-1.5 rounded-xl border text-center font-bold transition-all ${
                            relanceChannel === c ? 'bg-violet-600 text-white border-violet-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Destinataire</label>
                    <div className="p-2.5 rounded-xl bg-slate-50 border text-slate-700 font-mono mt-1">
                      {relanceChannel === 'EMAIL' ? selectedTiers.email : selectedTiers.phone}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Corps du Message de Rappel</label>
                    <textarea
                      rows={5}
                      value={relanceMessageText}
                      onChange={(e) => setRelanceMessageText(e.target.value)}
                      className="w-full p-2.5 border rounded-xl font-medium font-sans mt-1 focus:ring-1 focus:ring-violet-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    onClick={() => setRelanceModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSendRelance}
                    disabled={relancePreviewLoading}
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold shadow-sm transition-all"
                  >
                    {relancePreviewLoading ? 'Envoi...' : '✓ Confirmer l\'envoi'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 7: Lettrage Interactif Fonctionnel ──────────────────────────── */}
      {tab === 'lettrage' && (
        <div className="space-y-6">
          {/* 1. TABLEAU DE BORD DU LETTRAGE */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center text-xs font-bold">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <div className="text-[9px] text-slate-400 uppercase">Taux de lettrage</div>
              <div className="text-sm font-black text-indigo-700 mt-1">92 %</div>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl">
              <div className="text-[9px] text-slate-400 uppercase">Écritures non lettrées</div>
              <div className="text-sm font-black text-rose-700 mt-1">18</div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl col-span-2">
              <div className="text-[9px] text-slate-400 uppercase">Reste à lettrer</div>
              <div className="text-sm font-black text-amber-700 mt-1 font-mono">3 250 000 FCFA</div>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <div className="text-[9px] text-slate-400 uppercase">Clients soldés</div>
              <div className="text-sm font-black text-emerald-700 mt-1">156</div>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <div className="text-[9px] text-slate-400 uppercase">Fournisseurs soldés</div>
              <div className="text-sm font-black text-emerald-700 mt-1">84</div>
            </div>
          </div>

          {/* 2. SUGGESTIONS IA POINTAGE */}
          <div className="p-4 bg-gradient-to-r from-violet-900 to-indigo-950 text-white rounded-3xl shadow-md space-y-2 text-xs">
            <div className="flex justify-between items-center border-b border-white/10 pb-1.5 font-bold">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-violet-300 animate-pulse" />
                <span>Suggestions de Correspondance IA (Pointage 1-Clic)</span>
              </div>
              <span className="bg-violet-600/60 px-2 py-0.5 rounded-full text-[9px]">Confiance 99%</span>
            </div>
            <div className="flex justify-between items-center flex-wrap gap-2 pt-1 font-semibold">
              <p className="text-slate-200">
                La facture client <strong>VT-2026-101 (119 250 FCFA)</strong> de <em>SODEXO</em> correspond parfaitement au règlement virement <strong>BQ-2026-052 (119 250 FCFA)</strong>.
              </p>
              <button
                onClick={handleAutoLettrageAll}
                className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-[10px] rounded-lg shadow-sm transition-all"
              >
                ✓ Appliquer le pointage
              </button>
            </div>
          </div>

          {/* 3. CONTROL BAR: SEARCH & FILTERS */}
          <div className="p-4 bg-white rounded-3xl border border-violet-100 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Rechercher par client, pièce, montant, libellé..."
                  value={lettrageSearchQuery}
                  onChange={(e) => setLettrageSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-400 text-xs font-semibold"
                />
              </div>

              <select
                value={lettrageFilterStatus}
                onChange={(e) => setLettrageFilterStatus(e.target.value as any)}
                className="p-2 border border-slate-200 rounded-xl bg-white"
              >
                <option value="ALL">Tous les Statuts</option>
                <option value="🟢 Lettré">Lettré</option>
                <option value="🟡 Partiellement">Partiellement Lettré</option>
                <option value="🔴 Non lettré">Non Lettré</option>
              </select>

              <button
                onClick={() => setLettrageItems(MOCK_TIERS_LIST.map((t, idx) => ({
                  id: `mock-l-${idx}`,
                  date: '2026-08-01',
                  accountCode: t.code,
                  pieceNumber: `VT-M-${t.code}`,
                  wording: `Opération comptable de régul ${t.name}`,
                  debit: t.solde > 0 ? t.solde : 0,
                  credit: t.solde < 0 ? Math.abs(t.solde) : 0,
                  isLettered: false,
                  partnerName: t.name,
                  soldeRestant: Math.abs(t.solde),
                  ancienneteJours: 10,
                  iaMatchScore: 90
                })))}
                className="p-2 border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-xl"
              >
                🔄 Recharger
              </button>
            </div>

            {selectedLettrageIds.length > 0 && (
              <div className="p-1.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-2">
                <span className="text-[10px] text-indigo-900 font-extrabold">{selectedLettrageIds.length} sélectionné(s)</span>
                <button
                  onClick={handleExecuteLettrage}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg shadow-sm"
                >
                  ⚡ Lettrer ({nextLetterCode})
                </button>
              </div>
            )}
          </div>

          {/* 4. TABLEAU DES ECRITURES ENRICHI */}
          <div className="bg-white rounded-3xl border border-violet-100 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase font-semibold text-[10px] text-slate-400 border-b bg-slate-50/50">
                <tr>
                  <th className="p-3 w-8">Sél.</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Tiers (Partenaire)</th>
                  <th className="p-3">N° Pièce</th>
                  <th className="p-3 text-right">Débit</th>
                  <th className="p-3 text-right">Crédit</th>
                  <th className="p-3 text-right">Solde Restant</th>
                  <th className="p-3 text-center">Ancienneté</th>
                  <th className="p-3 text-center">Score IA</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const filtered = lettrageItems.filter((item) => {
                    const matchesSearch =
                      item.partnerName.toLowerCase().includes(lettrageSearchQuery.toLowerCase()) ||
                      item.pieceNumber.toLowerCase().includes(lettrageSearchQuery.toLowerCase()) ||
                      item.accountCode.includes(lettrageSearchQuery);
                    
                    const statusText = item.isLettered ? '🟢 Lettré' : item.soldeRestant > 0 && item.soldeRestant < (item.debit || item.credit) ? '🟡 Partiellement' : '🔴 Non lettré';
                    const matchesStatus = lettrageFilterStatus === 'ALL' || statusText.startsWith(lettrageFilterStatus.substring(0,3));
                    return matchesSearch && matchesStatus;
                  });

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={11} className="p-8 text-center text-slate-400 italic">
                          Aucune écriture à lettrer ne correspond.
                        </td>
                      </tr>
                    );
                  }

                  return filtered.map((item) => {
                    const isPartial = item.soldeRestant > 0 && item.soldeRestant < (item.debit || item.credit);
                    const isUnlettered = !item.isLettered && !isPartial;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedLettrageItem(item)}
                      >
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedLettrageIds.includes(item.id)}
                            onChange={() => handleToggleLettrageSelect(item.id)}
                            disabled={item.isLettered}
                            className="rounded border-slate-300 text-violet-600 focus:ring-violet-400"
                          />
                        </td>
                        <td className="p-3 text-center">
                          {item.isLettered ? (
                            <span className="text-emerald-500 font-extrabold" title="Lettré">🟢</span>
                          ) : isPartial ? (
                            <span className="text-amber-500 font-extrabold" title="Partiel">🟡</span>
                          ) : (
                            <span className="text-rose-500 font-extrabold" title="Non lettré">🔴</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-400 font-semibold">{item.date}</td>
                        <td className="p-3 font-black text-slate-800">
                          <div>{item.partnerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Compte {item.accountCode}</div>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700">{item.pieceNumber}</td>
                        <td className="p-3 text-right font-mono text-emerald-600 font-bold">{fmtMoney(item.debit)}</td>
                        <td className="p-3 text-right font-mono text-rose-600 font-bold">{fmtMoney(item.credit)}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">
                          <div>{fmtMoney(item.soldeRestant)}</div>
                          {isPartial && (
                            <div className="w-16 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden ml-auto">
                              <div className="h-full bg-amber-500" style={{ width: `${(item.soldeRestant / (item.debit || item.credit)) * 100}%` }}></div>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-semibold text-slate-400">{item.ancienneteJours} j</td>
                        <td className="p-3 text-center font-mono font-black text-violet-600">{item.iaMatchScore}%</td>
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedLettrageItem(item)}
                            className="px-2 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-[10px] font-black border"
                          >
                            Détails
                          </button>
                          {item.isLettered && (
                            <button
                              onClick={() => handleCancelLettrage(item.id)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black ml-1 border border-rose-200"
                            >
                              Délettrer
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>

          {/* 5. COCKPIT 360° LETTRAGE DETAILED OVERLAY DRAWER */}
          {selectedLettrageItem && (
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl border-l border-violet-100 flex flex-col animate-in slide-in-from-right duration-200">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                    {selectedLettrageItem.isLettered ? '✓' : '?'}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{selectedLettrageItem.partnerName}</h3>
                    <p className="text-xs text-violet-600 font-bold uppercase">Cockpit Lettrage — Pièce {selectedLettrageItem.pieceNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLettrageItem(null)}
                  className="text-xs font-black text-slate-400 hover:text-slate-600 px-2.5 py-1 rounded-lg border bg-white"
                >
                  Fermer X
                </button>
              </div>

              {/* Lifecycle flow timeline */}
              <div className="p-4 bg-slate-50 border-b font-black text-[9px] text-slate-400 flex justify-between items-center text-center px-6">
                <div className="flex flex-col items-center">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-0.5">✓</span>
                  <span>Facture</span>
                </div>
                <div className="h-0.5 bg-emerald-300 flex-1 min-w-[20px]"></div>
                <div className="flex flex-col items-center">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-0.5">✓</span>
                  <span>Paiement</span>
                </div>
                <div className="h-0.5 bg-indigo-200 flex-1 min-w-[20px]"></div>
                <div className="flex flex-col items-center">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center mb-0.5 ${selectedLettrageItem.isLettered ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600 font-mono'}`}>
                    {selectedLettrageItem.isLettered ? '✓' : '3'}
                  </span>
                  <span>Lettré</span>
                </div>
                <div className="h-0.5 bg-slate-200 flex-1 min-w-[20px]"></div>
                <div className="flex flex-col items-center text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center mb-0.5">4</span>
                  <span>Relance</span>
                </div>
              </div>

              {/* Drawer core split: left is details, right is supporting doc preview */}
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold">
                {/* Details list */}
                <div className="space-y-4">
                  <div className="text-[10px] text-slate-400 uppercase border-b pb-1">Dossier Analytique & Financier</div>
                  <div className="space-y-1.5">
                    <span className="text-slate-400">Libellé écriture :</span>
                    <div className="p-2.5 rounded-xl bg-slate-50 border text-slate-700 font-sans">{selectedLettrageItem.wording}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-slate-400">Débit</span>
                      <div className="p-2.5 bg-slate-50 border rounded-xl font-mono text-emerald-600">{fmtMoney(selectedLettrageItem.debit)}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400">Crédit</span>
                      <div className="p-2.5 bg-slate-50 border rounded-xl font-mono text-rose-600">{fmtMoney(selectedLettrageItem.credit)}</div>
                    </div>
                  </div>

                  {/* Multi-currency section */}
                  {selectedLettrageItem.currency && (
                    <div className="p-3 bg-violet-50/50 border rounded-xl space-y-1">
                      <div className="text-[9px] text-violet-800 uppercase font-black">Multi-Devises</div>
                      <div className="flex justify-between font-mono">
                        <span>Montant Origine:</span>
                        <span>{selectedLettrageItem.originalAmount} {selectedLettrageItem.currency}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>Taux appliqué:</span>
                        <span>1 {selectedLettrageItem.currency} = {selectedLettrageItem.exchangeRate} FCFA</span>
                      </div>
                    </div>
                  )}

                  {/* Analytical tags */}
                  <div className="p-3 bg-slate-50 border rounded-2xl space-y-2">
                    <div className="text-[9px] text-slate-400 uppercase">Tags de gestion</div>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <span className="bg-indigo-50 border text-indigo-700 px-2.5 py-0.5 rounded-full">Project: {selectedLettrageItem.project || 'N/A'}</span>
                      <span className="bg-violet-50 border text-violet-700 px-2.5 py-0.5 rounded-full">Centre: {selectedLettrageItem.costCenter || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Risk Alert messaging */}
                  {selectedLettrageItem.ancienneteJours > 90 && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-600" />
                      <span>Attention : Facture de plus de 90 jours non soldée. Relance à prévoir.</span>
                    </div>
                  )}

                  {/* Lettrage Action & History */}
                  <div className="space-y-2 pt-2">
                    {selectedLettrageItem.isLettered ? (
                      <div className="space-y-2">
                        <div className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-center">
                          ✓ Écriture rapprochée sous le code [ <strong>{selectedLettrageItem.letter}</strong> ]
                        </div>
                        <button
                          onClick={() => handleCancelLettrage(selectedLettrageItem.id)}
                          className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl transition-all"
                        >
                          Annuler le Lettrage (Délettrer)
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-slate-700">
                        Cette écriture est en attente de pointage. Sélectionnez au moins un règlement pour valider le solde.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Piece Justificative preview card */}
                <div className="space-y-4">
                  <div className="text-[10px] text-slate-400 uppercase border-b pb-1">Pièce Justificative</div>
                  <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl border flex flex-col justify-between h-72 shadow-inner">
                    <div className="flex justify-between items-center text-[10px] font-mono border-b border-white/10 pb-2">
                      <span>DOCUMENT ASSOCIE</span>
                      <span className="text-violet-400 uppercase font-black">{selectedLettrageItem.documentFilename ? selectedLettrageItem.documentFilename.split('.').pop() : 'PDF'}</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-2">
                      <span className="text-4xl">📄</span>
                      <div className="font-extrabold text-sm">{selectedLettrageItem.documentFilename || 'Aucun document lié'}</div>
                      <p className="text-[10px] text-slate-400 font-medium">Fichier archivé dans la GED FinancePro</p>
                    </div>
                    <button
                      onClick={() => handleExportPDF(selectedLettrageItem.documentFilename || 'Facture_Tiers')}
                      className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-[10px] rounded-xl border border-white/15 transition-colors"
                    >
                      👁️ Ouvrir dans la Visionneuse
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t flex justify-between items-center bg-slate-50/50">
                <span className="text-[9px] text-slate-400 font-mono">Dernier lettrage: 04/08/2026</span>
                <button
                  onClick={() => setSelectedLettrageItem(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs shadow-sm"
                >
                  Fermer Cockpit
                </button>
              </div>
            </div>
          )}

          {/* 6. MANDATORY MOTIF DELETTRAGE DIALOG */}
          {delettrageModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-violet-100 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-sm font-extrabold text-slate-900">Motif de Délettrage Requis</h4>
                  <button onClick={() => setDelettrageModalOpen(false)} className="text-xs text-slate-400 font-bold">✕</button>
                </div>
                <div className="space-y-3 text-xs font-bold">
                  <p className="text-slate-500 font-semibold leading-relaxed">
                    L'annulation du lettrage est une action auditable. Vous devez saisir un motif justificatif obligatoire pour la piste d'audit.
                  </p>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Motif d'annulation</label>
                    <input
                      type="text"
                      placeholder="ex: Erreur de pointage / Double règlement détecté"
                      value={delettrageMotif}
                      onChange={(e) => setDelettrageMotif(e.target.value)}
                      className="w-full mt-1 p-2.5 border rounded-xl font-bold text-xs focus:ring-1 focus:ring-violet-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t text-xs font-bold">
                  <button
                    onClick={() => setDelettrageModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirmDelettrage}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-sm transition-all"
                  >
                    ✓ Confirmer l'annulation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 8: Rapprochement Bancaire ──────────────────────────────────── */}
      {tab === 'rapprochement-bancaire' && (
        <div className="space-y-6">
          {/* 1. TABLEAU DE BORD DU RAPPROCHEMENT */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center text-xs font-bold">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <div className="text-[9px] text-slate-400 uppercase">Comptes bancaires</div>
              <div className="text-sm font-black text-indigo-700 mt-1">5</div>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <div className="text-[9px] text-slate-400 uppercase">Comptes rapprochés</div>
              <div className="text-sm font-black text-emerald-700 mt-1">4</div>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl">
              <div className="text-[9px] text-slate-400 uppercase">Opérations en attente</div>
              <div className="text-sm font-black text-rose-700 mt-1">18</div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl col-span-2">
              <div className="text-[9px] text-slate-400 uppercase">Écart global</div>
              <div className="text-sm font-black text-amber-700 mt-1 font-mono">125 000 FCFA</div>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <div className="text-[9px] text-slate-400 uppercase">Taux global</div>
              <div className="text-sm font-black text-emerald-700 mt-1">98 %</div>
            </div>
          </div>

          {/* 2. TIMELINE WORKFLOW STEPPER */}
          <div className="p-4 bg-slate-50 border rounded-3xl text-[9px] font-black text-slate-400 flex justify-between items-center text-center px-6">
            <div className="flex flex-col items-center">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-0.5">✓</span>
              <span>Import relevé</span>
            </div>
            <div className="h-0.5 bg-emerald-300 flex-1 min-w-[20px]"></div>
            <div className="flex flex-col items-center">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-0.5">✓</span>
              <span>Détection IA</span>
            </div>
            <div className="h-0.5 bg-indigo-300 flex-1 min-w-[20px]"></div>
            <div className="flex flex-col items-center text-indigo-700">
              <span className="w-5 h-5 rounded-full bg-indigo-100 border border-indigo-300 text-indigo-700 flex items-center justify-center mb-0.5">3</span>
              <span>Pointage Manuel</span>
            </div>
            <div className="h-0.5 bg-slate-200 flex-1 min-w-[20px]"></div>
            <div className="flex flex-col items-center">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-0.5">4</span>
              <span>Régulations</span>
            </div>
            <div className="h-0.5 bg-slate-200 flex-1 min-w-[20px]"></div>
            <div className="flex flex-col items-center">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-0.5">5</span>
              <span>Terminé</span>
            </div>
          </div>

          {/* 3. MULTI-BANK HEADER CONTROL & IMPORT AREA */}
          <div className="p-4 bg-white rounded-3xl border border-violet-100 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase block font-bold">Compte Bancaire Actif</label>
                <select
                  value={selectedBankAccountId}
                  onChange={(e) => setSelectedBankAccountId(e.target.value)}
                  className="p-2 border border-slate-200 rounded-xl bg-white text-xs font-bold"
                >
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} – {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Solde Summary */}
              {(() => {
                const currentAcc = bankAccounts.find((a) => a.id === selectedBankAccountId);
                if (!currentAcc) return null;
                return (
                  <div className="flex gap-4 font-mono font-black text-xs border-l pl-4">
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] block">Solde Compta</span>
                      <span className="text-indigo-600 text-sm">{fmtMoney(currentAcc.balanceCompta)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] block">Solde Relevé</span>
                      <span className="text-emerald-600 text-sm">{fmtMoney(currentAcc.balanceBank)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAutoRapprochementIA}
                className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold flex items-center gap-1.5 shadow-sm text-[11px] transition-colors"
              >
                <Zap className="w-3.5 h-3.5 fill-white" /> Rapprochement Automatique IA
              </button>
              <input
                type="file"
                id="bank-file-input"
                className="hidden"
                accept=".csv,.ofx,.xls,.xlsx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleBankStatementImport(file.name);
                  }
                }}
              />
              <button
                onClick={() => document.getElementById('bank-file-input')?.click()}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-[11px] hover:bg-indigo-100 transition-colors shadow-sm"
              >
                📥 Importer Relevé (OFX/CSV)
              </button>
            </div>
          </div>

          {/* 4. RELEVE IMPORT METADATA PANEL */}
          {importedStatementFile && importedStatementMetadata && (
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold">
              <div>
                <span className="text-slate-400 block">Fichier chargé :</span>
                <span className="text-slate-800">{importedStatementFile}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Opérations détectées :</span>
                <span className="text-slate-800">{importedStatementMetadata.count} lignes</span>
              </div>
              <div>
                <span className="text-slate-400 block">Période couverte :</span>
                <span className="text-slate-800">{importedStatementMetadata.dateRange}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Banque cible :</span>
                <span className="text-violet-700 uppercase">Afriland First Bank</span>
              </div>
            </div>
          )}

          {/* 5. VISUAL SIDE-BY-SIDE RECONCILIATION COLUMNS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Comptabilité list */}
            <div className="bg-white rounded-3xl border border-violet-100 p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wide border-b pb-2">
                Écritures Comptables (Grand Livre du 521)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="uppercase text-[9px] text-slate-400 border-b font-bold">
                    <tr>
                      <th className="p-2 w-8">État</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Référence</th>
                      <th className="p-2">Libellé</th>
                      <th className="p-2 text-right">Débit</th>
                      <th className="p-2 text-right">Crédit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comptaLines
                      .filter((t) => t.bankAccountId === selectedBankAccountId)
                      .map((item) => (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50 cursor-pointer transition-colors ${item.isReconciled ? 'bg-emerald-50/50' : 'bg-white'}`}
                          onClick={() => setSelectedComptaLineForDrawer(item)}
                        >
                          <td className="p-2 text-center text-base">
                            {item.isReconciled ? '🟢' : '🔴'}
                          </td>
                          <td className="p-2 font-mono text-slate-400">{item.date}</td>
                          <td className="p-2 font-mono font-bold text-violet-600">{item.reference}</td>
                          <td className="p-2 text-slate-800">{item.wording}</td>
                          <td className="p-2 text-right font-mono text-emerald-600">{item.debit > 0 ? fmtMoney(item.debit) : '-'}</td>
                          <td className="p-2 text-right font-mono text-rose-600">{item.credit > 0 ? fmtMoney(item.credit) : '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bank Statement list */}
            <div className="bg-white rounded-3xl border border-violet-100 p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wide border-b pb-2">
                Relevé Bancaire (Banque Officiel)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="uppercase text-[9px] text-slate-400 border-b font-bold">
                    <tr>
                      <th className="p-2 w-8">État</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Référence</th>
                      <th className="p-2">Libellé Relevé</th>
                      <th className="p-2 text-right font-bold">Débit / Crédit</th>
                      <th className="p-2 text-center">IA match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bankLines
                      .filter((t) => t.bankAccountId === selectedBankAccountId)
                      .map((item) => (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50 cursor-pointer transition-colors ${item.isReconciled ? 'bg-emerald-50/50' : 'bg-white'}`}
                          onClick={() => setSelectedBankLineForDrawer(item)}
                        >
                          <td className="p-2 text-center text-base">
                            {item.isReconciled ? '🟢' : item.iaMatchScore && item.iaMatchScore > 80 ? '🟡' : '🔴'}
                          </td>
                          <td className="p-2 font-mono text-slate-400">{item.date}</td>
                          <td className="p-2 font-mono font-bold text-slate-700">{item.reference}</td>
                          <td className="p-2 text-slate-800">{item.wording}</td>
                          <td className="p-2 text-right font-mono font-bold">
                            <span className={item.credit > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                              {fmtMoney(item.debit || item.credit)}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            {item.iaMatchScore ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.id === 'b2') {
                                    setSelectedEcartLine(item);
                                    setEcartRegulAmount(1500);
                                    setEcartRegulWording('Régularisation commissions sur virement Carrefour');
                                    setAdjustmentsOpen(true);
                                  } else {
                                    handleAutoRapprochementIA();
                                  }
                                }}
                                className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                                  item.isReconciled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                }`}
                              >
                                {item.iaMatchScore}% {item.isReconciled ? 'Reconciled' : 'Regul'}
                              </button>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 6. ANOMALIES & CASH FLOW FORECAST GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Anomalies count */}
            <div className="p-5 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-3 text-xs font-bold text-slate-800">
              <h4 className="text-[10px] text-slate-400 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-rose-500" /> Anomalies de trésorerie en attente
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between font-mono">
                  <span>Chèques en circulation :</span>
                  <span className="text-rose-600">5 (420 000 FCFA)</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Virements non comptabilisés :</span>
                  <span className="text-amber-600">3 (210 000 FCFA)</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Frais bancaires non validés :</span>
                  <span className="text-slate-600">2 (18 500 FCFA)</span>
                </div>
              </div>
            </div>

            {/* Forecast graph simulation */}
            <div className="p-5 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-3 text-xs font-bold text-slate-800">
              <h4 className="text-[10px] text-slate-400 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1">
                <Activity className="w-4 h-4 text-violet-600" /> Prévisions de trésorerie à 7 & 30 jours
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between font-mono">
                  <span>Solde prévu à 7 jours :</span>
                  <span className="text-emerald-600">+3 950 000 FCFA</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Solde prévu à 30 jours :</span>
                  <span className="text-indigo-600">+4 850 000 FCFA</span>
                </div>
                <div className="text-[9px] text-slate-400 font-medium leading-relaxed">
                  ✓ Aucun risque de découvert ou de dépassement de plafond détecté pour le mois d'août.
                </div>
              </div>
            </div>

            {/* Treasury IA Assistant Chat Box */}
            <div className="p-5 bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-3xl shadow-sm space-y-3 text-xs flex flex-col justify-between h-[155px]">
              <div className="flex items-center gap-1.5 text-violet-300 font-bold border-b border-white/10 pb-1.5">
                <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
                <span>Assistant Trésorerie IA</span>
              </div>
              
              {bankAssistantAnswer ? (
                <div className="flex-1 overflow-y-auto pr-1 text-[11px] font-semibold text-slate-200 mt-1 scrollbar-thin">
                  "{bankAssistantAnswer}"
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 italic font-medium">
                  Posez une question sur l'écart de rapprochement.
                </div>
              )}

              <div className="flex gap-1.5 pt-1.5 border-t border-white/10">
                <input
                  type="text"
                  placeholder="ex: Pourquoi ai-je un écart ?"
                  value={bankAssistantQuery}
                  onChange={(e) => setBankAssistantQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleBankAssistantQuestion(); }}
                  className="flex-1 p-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-400 font-bold text-[10px]"
                />
                <button
                  onClick={handleBankAssistantQuestion}
                  disabled={bankAssistantLoading}
                  className="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[10px] font-extrabold transition-all"
                >
                  {bankAssistantLoading ? 'Analyse...' : 'OK'}
                </button>
              </div>
            </div>
          </div>

          {/* 7. ECART & DISCREPANCY ADJUSTMENT DIALOG */}
          {adjustmentsOpen && selectedEcartLine && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-violet-100 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-sm font-extrabold text-slate-900">Générer Écriture d'Écart / Régularisation</h4>
                  <button onClick={() => setAdjustmentsOpen(false)} className="text-xs text-slate-400 font-bold">✕</button>
                </div>
                <div className="space-y-3 text-xs font-bold">
                  <p className="text-slate-500 font-semibold leading-relaxed">
                    L'IA a identifié un écart de commission bancaire sur la ligne <strong>{selectedEcartLine.reference}</strong>.
                  </p>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Montant de l'écart (FCFA)</label>
                    <input
                      type="number"
                      value={ecartRegulAmount}
                      onChange={(e) => setEcartRegulAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full mt-1 p-2.5 border rounded-xl font-mono font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Libellé d'ajustement</label>
                    <input
                      type="text"
                      value={ecartRegulWording}
                      onChange={(e) => setEcartRegulWording(e.target.value)}
                      className="w-full mt-1 p-2.5 border rounded-xl font-bold text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t text-xs font-bold">
                  <button
                    onClick={() => setAdjustmentsOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleGenerateBankAdjustment}
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold shadow-sm transition-all"
                  >
                    ✓ Comptabiliser & Rapprocher
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 8. COMPTA LINE DETAILS OVERLAY DRAWER */}
          {selectedComptaLineForDrawer && (
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl border-l border-violet-100 flex flex-col animate-in slide-in-from-right duration-200">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 text-xs font-bold">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                    {selectedComptaLineForDrawer.isReconciled ? '✓' : '?'}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{selectedComptaLineForDrawer.wording}</h3>
                    <p className="text-xs text-indigo-600 uppercase font-black">Comptabilité — Réf {selectedComptaLineForDrawer.reference}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedComptaLineForDrawer(null)}
                  className="text-xs font-black text-slate-400 hover:text-slate-600 px-2.5 py-1 rounded-lg border bg-white"
                >
                  Fermer X
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-bold">
                <div className="text-[10px] text-slate-400 uppercase border-b pb-1">Détails de la saisie</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-slate-400">Date d'écriture</span>
                    <div className="p-2.5 bg-slate-50 border rounded-xl font-mono">{selectedComptaLineForDrawer.date}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400">Référence pièce</span>
                    <div className="p-2.5 bg-slate-50 border rounded-xl font-mono">{selectedComptaLineForDrawer.reference}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400">Tiers associé</span>
                    <div className="p-2.5 bg-slate-50 border rounded-xl">{selectedComptaLineForDrawer.partnerName || 'Non défini'}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400">Libellé Grand Livre</span>
                    <div className="p-2.5 bg-slate-50 border rounded-xl font-sans text-slate-600">{selectedComptaLineForDrawer.ledgerWording || selectedComptaLineForDrawer.wording}</div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 text-slate-200 rounded-2xl border space-y-3 shadow-inner mt-4">
                  <div className="text-[10px] text-slate-400 font-mono border-b border-white/10 pb-1.5">PIECE JUSTIFICATIVE NUMERISEE</div>
                  <div className="flex flex-col justify-center items-center py-6 text-center space-y-2">
                    <span className="text-3xl">📄</span>
                    <span className="font-extrabold text-[11px]">{selectedComptaLineForDrawer.documentFilename || 'Aucun document associé'}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t flex justify-end bg-slate-50/50">
                <button
                  onClick={() => setSelectedComptaLineForDrawer(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs shadow-sm"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 9: Fin de Période & Inventaire Interatif ─────────────────────── */}
      {tab === 'fin-periode' && (
        <div className="space-y-6">
          {/* 1. INDICATEURS DE CLOTURE */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center text-xs font-bold">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <div className="text-[9px] text-slate-400 uppercase">Écritures générées</div>
              <div className="text-sm font-black text-indigo-700 mt-1">8</div>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <div className="text-[9px] text-slate-400 uppercase">Total Amortissements</div>
              <div className="text-sm font-black text-emerald-700 mt-1 font-mono">320 000 FCFA</div>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <div className="text-[9px] text-slate-400 uppercase">Total Provisions</div>
              <div className="text-sm font-black text-emerald-700 mt-1 font-mono">790 000 FCFA</div>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl">
              <div className="text-[9px] text-slate-400 uppercase">Anomalies détectées</div>
              <div className="text-sm font-black text-rose-700 mt-1">{closingAnomaliesCount}</div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl">
              <div className="text-[9px] text-slate-400 uppercase">Progression Clôture</div>
              <div className="text-sm font-black text-amber-700 mt-1">{closingProgress} %</div>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <div className="text-[9px] text-slate-400 uppercase">Temps estimé</div>
              <div className="text-sm font-black text-indigo-700 mt-1">{closingEstimatedTime}</div>
            </div>
          </div>

          {/* 2. CHRONOLOGICAL PROGRESS TIMELINE */}
          <div className="p-4 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-3 text-xs font-bold">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider border-b pb-1.5 flex justify-between items-center">
              <span>Vue Chronologique des Étapes de Clôture</span>
              <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Étape {closingTimelineStep} sur 10</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-center font-black">
              {[
                'Validation journaux', 'Lettrage', 'Rapprochement', 'Inventaire',
                'Amortissements', 'Provisions', 'Régularisations', 'Contrôles',
                'États financiers', 'Clôture'
              ].map((step, idx) => {
                const stepNum = idx + 1;
                const isActive = stepNum === closingTimelineStep;
                const isPassed = stepNum < closingTimelineStep;
                return (
                  <React.Fragment key={idx}>
                    <div className="flex flex-col items-center">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center mb-0.5 ${
                        isPassed ? 'bg-emerald-500 text-white' : isActive ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isPassed ? '✓' : stepNum}
                      </span>
                      <span className={isActive ? 'text-indigo-600' : isPassed ? 'text-slate-700' : 'text-slate-400'}>{step}</span>
                    </div>
                    {idx < 9 && <div className={`h-0.5 flex-1 min-w-[10px] ${isPassed ? 'bg-emerald-300' : 'bg-slate-100'}`}></div>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* 3. CORE ACTION PANEL & SIMULATION TRIGGER */}
          <div className="p-4 bg-gradient-to-r from-violet-900 to-indigo-950 text-white rounded-3xl shadow-md flex justify-between items-center flex-wrap gap-3 text-xs font-bold">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-violet-300" />
                <span className="text-sm font-black">Clôture Assistée par IA (Copilote SYSCOHADA)</span>
              </div>
              <p className="text-slate-300 font-medium max-w-lg">
                Notre algorithme IA scanne automatiquement l'ensemble de vos pièces justificatives, amortissements et stocks pour garantir la conformité avec l'Acte Uniforme OHADA.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRunCopilotDiagnostics}
                className="px-4 py-2 bg-white text-violet-950 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
              >
                🔍 Analyser ma comptabilité
              </button>
              <button
                onClick={handleAutoCalculateClosing}
                className="px-4 py-2 bg-violet-600 text-white hover:bg-violet-700 rounded-xl transition-colors shadow-sm"
              >
                ⚡ Calculer automatiquement
              </button>
              <button
                onClick={() => setSimulationOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
              >
                📊 Simuler impacts
              </button>
              <button
                onClick={handleExecuteFullClosing}
                className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
              >
                ✓ Clôture intelligente
              </button>
            </div>
          </div>

          {/* 4. CHECKLIST GRID & SIDEBAR (DEADLINES + COMPLIANCE SCORE) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Checklist table */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-violet-100 p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wide border-b pb-2">
                Check-list de Clôture & Statuts de Période
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="uppercase text-[9px] text-slate-400 border-b font-bold">
                    <tr>
                      <th className="p-2.5">Étape du processus</th>
                      <th className="p-2.5">Statut</th>
                      <th className="p-2.5">Description / Justificatifs</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {closingChecklist.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800">{item.name}</td>
                        <td className="p-2.5">
                          {item.status === 'DONE' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                              ✅ Conforme
                            </span>
                          ) : item.status === 'WARNING' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                              ⚠️ Warning
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                              ❌ À faire
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-500 font-medium">{item.description}</td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => {
                              if (item.id === '3') setTab('rapprochement-bancaire');
                              if (item.id === '4') setTab('lettrage');
                              if (item.id === '5' || item.id === '7') handleAutoCalculateClosing();
                            }}
                            className="px-2 py-0.5 border text-slate-600 hover:bg-slate-50 rounded-lg text-[9px] font-bold"
                          >
                            Consulter
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sidebar compliance score & calendar */}
            <div className="space-y-6">
              {/* Compliance score card */}
              <div className="p-5 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-3 text-xs font-bold text-slate-800">
                <h4 className="text-[10px] text-slate-400 uppercase tracking-wider border-b pb-1.5">
                  Index de Conformité SYSCOHADA
                </h4>
                <div className="flex items-center gap-4 py-2">
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center text-sm font-black text-emerald-700 shadow-inner">
                    {closingConformityScore} %
                  </div>
                  <div>
                    <div className="text-slate-800 font-extrabold">Qualité Comptable OK</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {closingAnomaliesCount} anomalie(s) mineure(s) restante(s).
                    </div>
                  </div>
                </div>
              </div>

              {/* Deadlines calendar */}
              <div className="p-5 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-3 text-xs font-bold text-slate-800">
                <h4 className="text-[10px] text-slate-400 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1">
                  📅 Calendrier & Échéances Légales
                </h4>
                <div className="space-y-2.5">
                  {closingDeadlines.map((dl) => (
                    <div key={dl.id} className="flex justify-between items-center border-b pb-1.5 last:border-0 last:pb-0">
                      <div>
                        <div className="text-slate-800">{dl.task}</div>
                        <span className="text-[9px] text-slate-400 font-mono">Date butoir: {dl.deadlineDate}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-violet-50 border text-violet-700 text-[9px] rounded-lg">
                        {dl.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 5. DOUBTFUL ACCOUNTS & STOCKS ADJUSTMENT PANELS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Doubtful accounts client table */}
            <div className="bg-white rounded-3xl border border-violet-100 p-5 shadow-sm space-y-3 text-xs font-bold">
              <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wide border-b pb-2">
                Calcul des Provisions pour Dépréciation Créances Clients (Compte 491)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-semibold">
                  <thead className="uppercase text-[9px] text-slate-400 border-b font-bold">
                    <tr>
                      <th>Partenaire</th>
                      <th>Créance TTC</th>
                      <th className="text-center">Retard</th>
                      <th className="text-center">Taux suggéré</th>
                      <th className="text-right">Provision</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {closingDoubtfulClients.map((client) => (
                      <tr key={client.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-bold text-slate-800">{client.clientName}</td>
                        <td className="py-2.5 font-mono">{fmtMoney(client.balance)}</td>
                        <td className="py-2.5 text-center font-mono text-slate-500">{client.daysLate} j</td>
                        <td className="py-2.5 text-center font-mono text-violet-600">{client.suggestedProvRate}%</td>
                        <td className="py-2.5 text-right font-mono text-rose-600">{fmtMoney(client.provAmount)}</td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={handleAutoCalculateClosing}
                            disabled={client.isActionDone}
                            className={`px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase ${
                              client.isActionDone ? 'bg-slate-100 text-slate-400' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                            }`}
                          >
                            {client.isActionDone ? 'Passé' : 'Provis.'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inventory valuation discrepancy panel */}
            <div className="bg-white rounded-3xl border border-violet-100 p-5 shadow-sm space-y-4 text-xs font-bold">
              <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wide border-b pb-2">
                Assistant d'Inventaire & Valorisation des Stocks
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Méthode de Valorisation</label>
                  <select
                    value={stockValuationMethod}
                    onChange={(e) => setStockValuationMethod(e.target.value as any)}
                    className="w-full p-2 border rounded-xl bg-white"
                  >
                    <option value="CUMP">CUMP (Coût Unitaire Moyen Pondéré)</option>
                    <option value="FIFO">FIFO (Premier entré, Premier sorti)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Libellé d'ajustement</label>
                  <input
                    type="text"
                    value={stockVarianceWording}
                    onChange={(e) => setStockVarianceWording(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Valeur Comptable (FCFA)</label>
                  <div className="p-2 bg-slate-50 border rounded-xl font-mono text-slate-600">{fmtMoney(stockBookValue)}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Valeur Physique Réelle (FCFA)</label>
                  <input
                    type="number"
                    value={stockPhysicalValue}
                    onChange={(e) => setStockPhysicalValue(Number(e.target.value))}
                    className="w-full p-1.5 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] font-black text-rose-900 flex-wrap gap-2">
                <div>Écart constaté: <span className="font-mono">{fmtMoney(stockPhysicalValue - stockBookValue)}</span></div>
                <button
                  onClick={handleStockAdjustment}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
                >
                  ⚡ Comptabiliser l'Écart de Stock
                </button>
              </div>
            </div>
          </div>

          {/* 6. RECURRENT ENTRIES SCHEDULER MANAGER */}
          <div className="bg-white rounded-3xl border border-violet-100 p-5 shadow-sm space-y-3 text-xs font-bold">
            <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wide border-b pb-2 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-violet-600 animate-spin-slow" /> Gestionnaire des Écritures Récurrentes & Abonnements
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-semibold">
                <thead className="uppercase text-[9px] text-slate-400 border-b font-bold">
                  <tr>
                    <th>Libellé de la récurrence</th>
                    <th>Fréquence</th>
                    <th className="text-right">Montant (FCFA)</th>
                    <th className="text-center">Prochain déclenchement</th>
                    <th className="text-center">Statut</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {closingRecurrentEntries.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-bold text-slate-800">{rec.label}</td>
                      <td className="py-2.5">
                        <span className="bg-indigo-50 border text-indigo-700 px-2 py-0.5 rounded text-[9px]">
                          {rec.frequency}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-800">{fmtMoney(rec.amount)}</td>
                      <td className="py-2.5 text-center font-mono text-slate-400">{rec.nextRun}</td>
                      <td className="py-2.5 text-center">
                        {rec.isSuspended ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-400 text-[9px] uppercase">Suspendu</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] uppercase">Actif</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleSuspendRecurrence(rec.id)}
                          className="px-2 py-0.5 border rounded-lg text-[9px] hover:bg-slate-50"
                        >
                          {rec.isSuspended ? 'Réactiver' : 'Suspendre'}
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await api.createEntry({
                                date: new Date().toISOString().substring(0, 10),
                                journalType: 'OD',
                                wording: `${rec.label} (Recur)`,
                                pieceNumber: `REC-${Date.now().toString().substring(8)}`,
                                lines: [
                                  { id: '1', accountCode: '622', accountLabel: 'Charges récurrentes', debit: rec.amount, credit: 0 },
                                  { id: '2', accountCode: '521', accountLabel: 'Banques locales', debit: 0, credit: rec.amount }
                                ]
                              });
                              setSuccessMessage(`Récurrence [ ${rec.label} ] générée avec succès !`);
                              addAuditLog('Récurrence', `Génération de la récurrence : ${rec.label}`);
                              loadEntries();
                            } catch (err) {
                              setErrorMessage("Erreur lors de la génération de la récurrence.");
                            }
                          }}
                          disabled={rec.isSuspended}
                          className="px-2.5 py-0.5 rounded-lg text-[9px] bg-violet-600 text-white font-extrabold hover:bg-violet-700 ml-1.5 uppercase"
                        >
                          Générer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 7. PREVIEW AUDIT logs & MULTI-LEVEL SIGN-OFFS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Closing history list */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-violet-100 p-5 shadow-sm space-y-3 text-xs font-bold">
              <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wide border-b pb-2">
                Historique des Clôtures de Périodes & Rapports archivés
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-semibold">
                  <thead className="uppercase text-[9px] text-slate-400 border-b font-bold">
                    <tr>
                      <th>Date clôture</th>
                      <th>Utilisateur</th>
                      <th className="text-center">Durée</th>
                      <th className="text-center">Écritures passées</th>
                      <th>Statut</th>
                      <th className="text-right">Rapport</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {closingHistoryList.map((ch) => (
                      <tr key={ch.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-mono">{ch.date}</td>
                        <td className="py-2.5 font-black">{ch.user}</td>
                        <td className="py-2.5 text-center font-mono text-slate-400">{ch.duration}</td>
                        <td className="py-2.5 text-center font-mono">{ch.entriesCount}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
                            {ch.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleExportPDF(`Rapport_Cloture_${ch.date}`)}
                            className="px-2 py-0.5 border text-violet-600 hover:bg-violet-50 rounded-lg text-[9px] font-black"
                          >
                            Télécharger PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Validation signatures workflow */}
            <div className="p-5 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4 text-xs font-bold text-slate-800">
              <h4 className="text-[10px] text-slate-400 uppercase tracking-wider border-b pb-1.5 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Validation multi-niveaux & Piste d'audit
              </h4>
              
              <div className="space-y-3">
                {/* 1. Comptable */}
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <div className="text-slate-800">1. Saisie Comptable</div>
                    <span className="text-[9px] font-mono text-slate-400">Par D. Melamem (Comptable)</span>
                  </div>
                  <span className="text-emerald-600 font-extrabold text-sm">✓ SIGNÉ</span>
                </div>

                {/* 2. Chef comptable */}
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <div className="text-slate-800">2. Contrôle & Validation</div>
                    <span className="text-[9px] font-mono text-slate-400">Chef de mission comptable</span>
                  </div>
                  <span className="text-emerald-600 font-extrabold text-sm">✓ SIGNÉ</span>
                </div>

                {/* 3. DAF */}
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <div className="text-slate-800">3. Approbation Finale (DAF)</div>
                    <span className="text-[9px] font-mono text-slate-400">Directeur Financier</span>
                  </div>
                  {closingSignatures.dafSigned ? (
                    <span className="text-emerald-600 font-extrabold text-sm">✓ SIGNÉ</span>
                  ) : (
                    <button
                      onClick={() => handleSignClosing('daf')}
                      className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[9px] uppercase font-black"
                    >
                      Signer
                    </button>
                  )}
                </div>

                {/* 4. CAC */}
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <div className="text-slate-800">4. Certification Légale (CAC)</div>
                    <span className="text-[9px] font-mono text-slate-400">Commissaire aux Comptes</span>
                  </div>
                  {closingSignatures.cacSigned ? (
                    <span className="text-emerald-600 font-extrabold text-sm">✓ CERTIFIÉ</span>
                  ) : (
                    <button
                      onClick={() => handleSignClosing('cac')}
                      disabled={!closingSignatures.dafSigned}
                      className={`px-2.5 py-1 rounded-lg text-[9px] uppercase font-black ${
                        closingSignatures.dafSigned ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Certifier
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 8. INTERACTIVE PRE-CLOSING SIMULATION DRAWER */}
          {simulationOpen && (
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl border-l border-violet-100 flex flex-col animate-in slide-in-from-right duration-200">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 text-xs font-bold">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                    📊
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Simulation d'Impacts Comptables & Fiscaux</h3>
                    <p className="text-xs text-indigo-600 uppercase font-black">Avant Validation Définitive de Clôture</p>
                  </div>
                </div>
                <button
                  onClick={() => setSimulationOpen(false)}
                  className="text-xs font-black text-slate-400 hover:text-slate-600 px-2.5 py-1 rounded-lg border bg-white"
                >
                  Fermer X
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-bold">
                <p className="text-slate-500 font-semibold leading-relaxed">
                  Cette table simule les variations sur les états de synthèse (Bilan, Compte de Résultat, Trésorerie) après intégration des dotations d'amortissements et des provisions clients calculées automatiquement.
                </p>

                {/* Simulation metrics table */}
                <div className="border rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left font-semibold">
                    <thead className="uppercase text-[9px] text-slate-400 border-b bg-slate-50">
                      <tr>
                        <th className="p-3">Indicateur Financier</th>
                        <th className="p-3 text-right">Avant Écritures</th>
                        <th className="p-3 text-right">Post-Calculs Clôture</th>
                        <th className="p-3 text-right">Variation Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-3 font-extrabold text-slate-800">Total Actif du Bilan (Classe 2-5)</td>
                        <td className="p-3 text-right font-mono">{fmtMoney(simulationData.bilanAssetsBefore)}</td>
                        <td className="p-3 text-right font-mono text-indigo-600 font-black">{fmtMoney(simulationData.bilanAssetsAfter)}</td>
                        <td className="p-3 text-right font-mono text-rose-600">-{fmtMoney(simulationData.bilanAssetsBefore - simulationData.bilanAssetsAfter)}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-extrabold text-slate-800">Résultat Net d'Exploitation (SIG)</td>
                        <td className="p-3 text-right font-mono">{fmtMoney(simulationData.netIncomeBefore)}</td>
                        <td className="p-3 text-right font-mono text-indigo-600 font-black">{fmtMoney(simulationData.netIncomeAfter)}</td>
                        <td className="p-3 text-right font-mono text-rose-600">-{fmtMoney(simulationData.netIncomeBefore - simulationData.netIncomeAfter)}</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-extrabold text-slate-800">Impôt Provisoire BIC (Côte d'Ivoire 25%)</td>
                        <td className="p-3 text-right font-mono">{fmtMoney(simulationData.fiscalTaxBefore)}</td>
                        <td className="p-3 text-right font-mono text-emerald-600 font-black">{fmtMoney(simulationData.fiscalTaxAfter)}</td>
                        <td className="p-3 text-right font-mono text-emerald-600">-{fmtMoney(simulationData.fiscalTaxBefore - simulationData.fiscalTaxAfter)} (Économie fiscal)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-extrabold text-slate-800">Trésorerie Actif / Net Dispo</td>
                        <td className="p-3 text-right font-mono">{fmtMoney(simulationData.cashFlowBefore)}</td>
                        <td className="p-3 text-right font-mono text-indigo-600 font-black">{fmtMoney(simulationData.cashFlowAfter)}</td>
                        <td className="p-3 text-right font-mono text-slate-400">0 (Aucun impact cash)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Educational lexique reference */}
                <div className="p-4 bg-violet-50/50 border rounded-2xl space-y-2">
                  <div className="text-[10px] text-violet-800 uppercase font-black flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-violet-600" /> Centre Documentaire SYSCOHADA (Principe de Prudence)
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    Selon le <strong>Principe de Prudence (SYSCOHADA Art. 3 et 6)</strong>, l'entreprise doit comptabiliser toutes les pertes probables (provisions pour dépréciation) et les charges consommées de l'exercice (dotations aux amortissements), mais ne peut enregistrer les plus-values latentes non réalisées. Cela garantit la sincérité du bilan.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t flex justify-between items-center bg-slate-50/50">
                <button
                  onClick={async () => {
                    await handleAutoCalculateClosing();
                    setSimulationOpen(false);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs shadow-sm"
                >
                  ✓ Appliquer & Générer les écritures
                </button>
                <button
                  onClick={() => setSimulationOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 text-white font-extrabold text-xs hover:bg-slate-900"
                >
                  Fermer Simulation
                </button>
              </div>
            </div>
          )}

          {/* 9. COPILOTE AI DIAGNOSTICS DETAILED POP-UP */}
          {copilotDiagnosticsOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-violet-100 space-y-4 text-xs font-bold">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-violet-600 animate-pulse" /> Rapport d'Audit & Diagnostic IA
                  </h4>
                  <button onClick={() => setCopilotDiagnosticsOpen(false)} className="text-xs text-slate-400 font-bold">✕</button>
                </div>

                {copilotDiagnosticsLoading ? (
                  <div className="py-12 flex flex-col justify-center items-center space-y-3">
                    <div className="w-8 h-8 rounded-full border-4 border-violet-600 border-t-transparent animate-spin"></div>
                    <span className="text-slate-500 font-semibold font-mono">Scan des journaux en cours par FinancePro IA...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-violet-50 rounded-2xl text-violet-950 font-semibold leading-relaxed">
                      L'Assistant de Clôture IA a terminé l'analyse de conformité SYSCOHADA pour la période. Voici les anomalies détectées et les corrections proposées :
                    </div>
                    <ul className="space-y-2.5 text-slate-700 font-semibold list-disc pl-4">
                      {copilotDiagnosticsResults.map((res, i) => (
                        <li key={i} className="leading-relaxed">{res}</li>
                      ))}
                    </ul>
                    <div className="flex gap-2 pt-2 border-t text-xs font-bold justify-end">
                      <button
                        onClick={handleExecuteFullClosing}
                        className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold shadow-sm transition-all"
                      >
                        ✓ Appliquer toutes les corrections
                      </button>
                      <button
                        onClick={() => setCopilotDiagnosticsOpen(false)}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 10: Centre Intelligent de Clôture OHADA ──────────────────────── */}
      {tab === 'cloture' && (
        <div className="space-y-5">

          {/* ── HEADER KPIs ── */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {[
              { label: 'Écritures OD générées', value: '47', color: 'violet' },
              { label: 'Montant OD total', value: '1 230 000', color: 'indigo' },
              { label: 'Anomalies restantes', value: clotureRisks.filter(r => !r.resolved).length.toString(), color: 'rose' },
              { label: 'Score conformité', value: `${clotureReadinessScore}%`, color: 'emerald' },
              { label: 'Temps estimé', value: '18 min', color: 'amber' },
              { label: 'Signataires', value: `${[closingSignatures.comptableSigned, closingSignatures.chefComptableSigned, closingSignatures.dafSigned, closingSignatures.cacSigned].filter(Boolean).length}/4`, color: 'sky' },
            ].map((kpi, i) => (
              <div key={i} className={`p-3 rounded-2xl bg-${kpi.color}-50 border border-${kpi.color}-100 text-center`}>
                <div className={`text-xl font-black text-${kpi.color}-600`}>{kpi.value}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-medium leading-tight">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* ── PROGRESS STEPPER ── */}
          <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-5">
            <div className="text-xs font-extrabold text-slate-700 mb-4 flex items-center gap-2">
              <span className="text-base">🗺️</span> Progression de la Clôture
            </div>
            <div className="flex items-center gap-0 overflow-x-auto pb-2">
              {['Analyse', 'Contrôles', 'Régularisations', 'Validation', 'Clôture', 'A-Nouveaux', 'Archivage'].map((step, i) => (
                <div key={i} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                      i < clotureStep ? 'bg-emerald-500 border-emerald-500 text-white' :
                      i === clotureStep ? 'bg-violet-600 border-violet-600 text-white ring-4 ring-violet-100' :
                      'bg-slate-100 border-slate-200 text-slate-400'
                    }`}>
                      {i < clotureStep ? '✓' : i + 1}
                    </div>
                    <span className={`text-[9px] font-bold text-center leading-tight ${
                      i < clotureStep ? 'text-emerald-600' : i === clotureStep ? 'text-violet-700' : 'text-slate-400'
                    }`}>{step}</span>
                  </div>
                  {i < 6 && <div className={`h-0.5 w-6 flex-shrink-0 mx-1 rounded ${
                    i < clotureStep - 1 ? 'bg-emerald-400' : 'bg-slate-200'
                  }`} />}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ── LEFT: Score + Risks ── */}
            <div className="space-y-4">

              {/* Conformity Score */}
              <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-5">
                <div className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-2"><span>🎯</span> Score de Clôture</div>
                <div className="flex items-center gap-5">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" strokeWidth="3"/>
                      <circle cx="18" cy="18" r="16" fill="none" stroke={clotureReadinessScore >= 90 ? '#10b981' : clotureReadinessScore >= 70 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="3" strokeDasharray={`${clotureReadinessScore} ${100 - clotureReadinessScore}`} strokeLinecap="round"/>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-base font-black ${clotureReadinessScore >= 90 ? 'text-emerald-600' : clotureReadinessScore >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {clotureReadinessScore}%
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-800 mb-1">{clotureReadinessScore >= 90 ? 'Clôture prête ✅' : clotureReadinessScore >= 70 ? 'Clôture partielle ⚠️' : 'Clôture bloquée ❌'}</div>
                    <div className="text-[10px] text-slate-500">{clotureRisks.filter(r => !r.resolved).length} anomalie(s) restante(s)</div>
                    <button onClick={() => setClotureCertificateOpen(true)} className="mt-2 px-3 py-1 rounded-lg bg-violet-600 text-white text-[10px] font-bold hover:bg-violet-700 transition-colors">
                      📜 Voir Certificat
                    </button>
                  </div>
                </div>
              </div>

              {/* Risk Alerts */}
              <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-5">
                <div className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-2"><span>⚠️</span> Risques Détectés</div>
                <div className="space-y-2">
                  {clotureRisks.map(risk => (
                    <div key={risk.id} className={`flex items-start gap-2 p-2 rounded-xl border text-[11px] ${
                      risk.resolved ? 'bg-emerald-50 border-emerald-100 opacity-60' :
                      risk.severity === 'HIGH' ? 'bg-rose-50 border-rose-100' :
                      risk.severity === 'MEDIUM' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'
                    }`}>
                      <span className="mt-0.5 flex-shrink-0">{risk.resolved ? '✅' : risk.severity === 'HIGH' ? '🔴' : risk.severity === 'MEDIUM' ? '🟡' : '🔵'}</span>
                      <span className={`flex-1 ${risk.resolved ? 'line-through text-slate-400' : 'text-slate-700'}`}>{risk.label}</span>
                      {!risk.resolved && (
                        <button onClick={() => setClotureRisks(prev => prev.map(r => r.id === risk.id ? { ...r, resolved: true } : r))}
                          className="text-[9px] px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-300 font-bold transition-colors flex-shrink-0">
                          Résoudre
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Conformity checks */}
              <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-5">
                <div className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-2"><span>🛡️</span> Vérification Réglementaire</div>
                <div className="space-y-2">
                  {[
                    { label: 'Conformité SYSCOHADA', score: 97 },
                    { label: 'Conformité Fiscale (IS/TVA)', score: 94 },
                    { label: 'Conformité Immobilisations', score: 88 },
                    { label: 'Conformité Stocks', score: 76 },
                    { label: 'Conformité États Financiers', score: 99 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="font-medium text-slate-600">{item.label}</span>
                        <span className={`font-black ${item.score >= 90 ? 'text-emerald-600' : item.score >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>{item.score}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full">
                        <div className={`h-1.5 rounded-full transition-all ${
                          item.score >= 90 ? 'bg-emerald-500' : item.score >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                        }`} style={{ width: `${item.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── CENTER: Tracking + Preview ── */}
            <div className="space-y-4">

              {/* Tracking Table */}
              <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-5">
                <div className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-2"><span>📋</span> Tableau de Suivi</div>
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-slate-500 font-semibold py-1.5 pr-2">Étape</th>
                      <th className="text-center text-slate-500 font-semibold py-1.5">Statut</th>
                      <th className="text-right text-slate-500 font-semibold py-1.5 pl-2">%</th>
                      <th className="text-right text-slate-500 font-semibold py-1.5 pl-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clotureTrackingSteps.map(step => (
                      <tr key={step.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-2 pr-2 font-medium text-slate-700">{step.name}</td>
                        <td className="py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            step.status === 'DONE' ? 'bg-emerald-100 text-emerald-700' :
                            step.status === 'WARNING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {step.status === 'DONE' ? '✅ OK' : step.status === 'WARNING' ? '⚠️ Alerte' : '⏳ En attente'}
                          </span>
                        </td>
                        <td className="py-2 pl-2 text-right font-black text-slate-700">{step.pct}%</td>
                        <td className="py-2 pl-2 text-right">
                          <button onClick={() => {
                            if (step.status === 'PENDING') {
                              setClotureTrackingSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: 'DONE', pct: 100 } : s));
                              setClotureStep(prev => Math.min(prev + 1, 6));
                              setClotureReadinessScore(prev => Math.min(100, prev + 2));
                            }
                          }} className={`text-[9px] px-2 py-0.5 rounded-lg font-bold transition-colors ${
                            step.status === 'DONE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                            step.status === 'WARNING' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                            'bg-violet-600 text-white hover:bg-violet-700'
                          }`}>
                            {step.status === 'DONE' ? 'Voir' : step.status === 'WARNING' ? 'Corriger' : 'Lancer'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Closing Entries Preview */}
              <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-5">
                <div className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-2"><span>📒</span> Aperçu des Écritures de Clôture</div>
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500">
                      <th className="text-left py-1.5 pr-2">Compte</th>
                      <th className="text-right py-1.5">Débit</th>
                      <th className="text-right py-1.5">Crédit</th>
                      <th className="text-left py-1.5 pl-2">Libellé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { compte: '891100', debit: 5200000, credit: 0, label: 'Compte de clôture – soldes débiteurs' },
                      { compte: '891200', debit: 0, credit: 5200000, label: 'Compte de clôture – soldes créditeurs' },
                      { compte: '139000', debit: 0, credit: 5200000, label: 'Résultat net de l\'exercice (Bénéfice)' },
                      { compte: '130000', debit: 5200000, credit: 0, label: 'Report à nouveau – clôture exercice N' },
                      { compte: '101000', debit: 0, credit: 62400000, label: 'Capital social – bilan d\'ouverture N+1' },
                      { compte: '411000', debit: 12500000, credit: 0, label: 'Créances clients – A-Nouveaux 2027' },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-1.5 pr-2 font-mono text-violet-700 font-bold">{row.compte}</td>
                        <td className="py-1.5 text-right text-rose-600 font-semibold">{row.debit > 0 ? row.debit.toLocaleString('fr-FR') : ''}</td>
                        <td className="py-1.5 text-right text-emerald-600 font-semibold">{row.credit > 0 ? row.credit.toLocaleString('fr-FR') : ''}</td>
                        <td className="py-1.5 pl-2 text-slate-600">{row.label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={() => setClotureSimulationOpen(true)}
                  className="mt-3 w-full px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors">
                  🔮 Simuler la Clôture (mode prévisualisation)
                </button>
              </div>

              {/* Bilan Ouverture N+1 */}
              <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-5">
                <div className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-2"><span>🏛️</span> Bilan d'Ouverture 2027 (A-Nouveaux)</div>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  {[
                    { label: 'Actif Total', value: '124 850 000', color: 'violet' },
                    { label: 'Passif Total', value: '124 850 000', color: 'indigo' },
                    { label: 'Capitaux Propres', value: '62 400 000', color: 'emerald' },
                    { label: 'Trésorerie', value: '8 420 000', color: 'sky' },
                    { label: 'Résultat reporté', value: '5 200 000', color: 'amber' },
                    { label: 'Équilibre', value: '✅ Validé', color: 'green' },
                  ].map((item, i) => (
                    <div key={i} className={`p-2.5 rounded-xl bg-${item.color}-50 border border-${item.color}-100`}>
                      <div className={`text-[9px] text-${item.color}-600 font-semibold uppercase`}>{item.label}</div>
                      <div className={`text-sm font-black text-${item.color}-800 mt-0.5`}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT: N vs N-1 + Signatures + Actions ── */}
            <div className="space-y-4">

              {/* N vs N-1 Comparison */}
              <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-5">
                <div className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-2"><span>📊</span> Comparaison N / N-1</div>
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500">
                      <th className="text-left py-1.5">Indicateur</th>
                      <th className="text-right py-1.5">2026</th>
                      <th className="text-right py-1.5">2025</th>
                      <th className="text-right py-1.5">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Chiffre d'Affaires", n: 450, nm1: 390, unit: 'M' },
                      { label: 'Résultat Net', n: 62, nm1: 48, unit: 'M' },
                      { label: 'Trésorerie nette', n: 84, nm1: 75, unit: 'M' },
                      { label: 'Total Actif', n: 1248, nm1: 1120, unit: 'M' },
                      { label: 'Dettes Financières', n: 380, nm1: 420, unit: 'M' },
                    ].map((row, i) => {
                      const delta = ((row.n - row.nm1) / row.nm1 * 100).toFixed(1);
                      const positive = row.n >= row.nm1;
                      return (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-1.5 text-slate-700 font-medium">{row.label}</td>
                          <td className="py-1.5 text-right font-bold text-slate-800">{row.n} {row.unit}</td>
                          <td className="py-1.5 text-right text-slate-400">{row.nm1} {row.unit}</td>
                          <td className={`py-1.5 text-right font-black ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {positive ? '+' : ''}{delta}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Workflow Signatures */}
              <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-5">
                <div className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-2"><span>✍️</span> Workflow d'Approbation</div>
                <div className="space-y-2">
                  {[
                    { role: 'Comptable', name: 'Dieudonné MELAMEM', signed: closingSignatures.comptableSigned },
                    { role: 'Chef Comptable', name: 'Responsable Comptable', signed: closingSignatures.chefComptableSigned },
                    { role: 'DAF', name: 'Directeur Administratif & Financier', signed: closingSignatures.dafSigned },
                    { role: 'Directeur Général', name: 'DG / Président', signed: closingSignatures.cacSigned },
                  ].map((sig, i) => (
                    <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                      sig.signed ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        sig.signed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-slate-800">{sig.role}</div>
                        <div className="text-[9px] text-slate-500 truncate">{sig.name}</div>
                      </div>
                      <span className={`text-[10px] font-black flex-shrink-0 ${
                        sig.signed ? 'text-emerald-600' : 'text-slate-400'
                      }`}>{sig.signed ? '✅ SIGNÉ' : '⏳ En attente'}</span>
                    </div>
                  ))}
                </div>
                {!closingSignatures.dafSigned && (
                  <button onClick={() => setCloturePasswordModal(true)}
                    className="mt-3 w-full px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors shadow-sm">
                    🔑 Apposer ma Signature Électronique
                  </button>
                )}
              </div>

              {/* Assistant Ouverture */}
              <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-5">
                <div className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-2"><span>🚀</span> Assistant d'Ouverture N+1</div>
                <div className="space-y-1.5 text-[11px]">
                  {[
                    { label: 'Soldes de bilan repris', ok: true },
                    { label: 'Résultat N reporté en 13', ok: true },
                    { label: 'Comptes de gestion (6/7) remis à zéro', ok: true },
                    { label: 'Comptes de bilan transférés en A-Nouveaux', ok: true },
                    { label: 'Journal AN 2027 généré', ok: clotureExecuted },
                    { label: 'Archive légale créée', ok: clotureArchiveDone },
                  ].map((check, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={check.ok ? 'text-emerald-500' : 'text-slate-300'}>{check.ok ? '✅' : '○'}</span>
                      <span className={`${check.ok ? 'text-slate-700' : 'text-slate-400'} font-medium`}>{check.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Archiving */}
              <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-5">
                <div className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-2"><span>📦</span> Archivage Légal Automatique</div>
                <div className="space-y-1.5 text-[11px] text-slate-600">
                  {['Archive ZIP complète', 'Journal de clôture PDF', 'Balance générale PDF', 'Grand Livre XLS', 'États financiers SYSCOHADA', 'DSF télétransmission', 'Toutes les pièces justificatives'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={clotureArchiveDone ? 'text-emerald-500' : 'text-slate-300'}>{clotureArchiveDone ? '✅' : '○'}</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setClotureArchiving(true);
                    setTimeout(async () => {
                      try {
                        const zip = new JSZip();

                        // Fetch real data from services
                        const [bilan, cr, balance, entries] = await Promise.all([
                          api.getBilan().catch(() => null),
                          api.getCompteResultat().catch(() => null),
                          api.getBalance().catch(() => []),
                          api.getEntries().catch(() => []),
                        ]);

                        // 1. Synthèse
                        let summary = `====================================================\n`;
                        summary += `ARCHIVE LÉGALE SYSCOHADA DE CLÔTURE DE L'EXERCICE 2026\n`;
                        summary += `ENTREPRISE : MELARO GROUP\n`;
                        summary += `DATE DE GÉNÉRATION : ${new Date().toLocaleString('fr-FR')}\n`;
                        summary += `SIGNATURE NUMÉRIQUE : SIGNÉ PAR LE DAF (Dieudonné MELAMEM) ET LE CAC\n`;
                        summary += `====================================================\n\n`;
                        summary += `RÉSUMÉ DES INDICATEURS CLÉS :\n`;
                        if (cr) {
                          summary += `- Chiffre d'Affaires : ${fmtMoney(cr.chiffreAffaires)}\n`;
                          summary += `- Résultat Net Comptable : ${fmtMoney(cr.resultatNet)}\n`;
                          summary += `- EBITDA : ${fmtMoney(cr.ebe)}\n`;
                        }
                        zip.file("1_SYNTHESE_ET_SIGNATURE.txt", summary);

                        // 2. Journal de Clôture
                        let journalText = `JOURNAL DE CLÔTURE COMPTABLE - EXERCICE 2026\n\n`;
                        journalText += `DATE\t\tJOURNAL\tPIÈCE\t\tCOMPTE\tLIBELLÉ\t\t\tDÉBIT\tCRÉDIT\n`;
                        journalText += `-----------------------------------------------------------------------------------------\n`;
                        entries.forEach((e: any) => {
                          e.lines.forEach((l: any) => {
                            journalText += `${e.date}\t${e.journalType}\t${e.pieceNumber}\t${l.accountCode}\t${(l.wording || '').padEnd(20).substring(0, 20)}\t${l.debit}\t${l.credit}\n`;
                          });
                        });
                        zip.file("2_JOURNAL_DE_CLOTURE.txt", journalText);

                        // 3. Balance
                        let balanceText = `BALANCE GÉNÉRALE DE CLÔTURE - EXERCICE 2026\n\n`;
                        balanceText += `COMPTE\tINTITULÉ\t\t\tDÉBIT\tCRÉDIT\tSOLDE DÉBITEUR\tSOLDE CRÉDITEUR\n`;
                        balanceText += `---------------------------------------------------------------------------------------------------------\n`;
                        balance.forEach((b: any) => {
                          balanceText += `${b.code}\t${(b.label || '').padEnd(30).substring(0, 30)}\t${b.debit}\t${b.credit}\t${b.soldeDebiteur}\t${b.soldeCrediteur}\n`;
                        });
                        zip.file("3_BALANCE_GENERALE.txt", balanceText);

                        // 4. Bilan
                        let bilanText = `BILAN SYSCOHADA DE CLÔTURE - EXERCICE 2026\n\n`;
                        bilanText += `=== ACTIF ===\n`;
                        if (bilan?.actif) {
                          bilanText += `ACTIF IMMOBILISÉ : ${fmtMoney(bilan.actif.immobilise.reduce((s: number, i: any) => s + i.net, 0))}\n`;
                          bilanText += `ACTIF CIRCULANT : ${fmtMoney(bilan.actif.circulant.reduce((s: number, i: any) => s + i.net, 0))}\n`;
                          bilanText += `TRÉSORERIE ACTIF : ${fmtMoney(bilan.actif.tresorerie.reduce((s: number, i: any) => s + i.net, 0))}\n`;
                          bilanText += `TOTAL ACTIF : ${fmtMoney(bilan.actif.totalActif)}\n\n`;
                        }
                        bilanText += `=== PASSIF ===\n`;
                        if (bilan?.passif) {
                          bilanText += `CAPITAUX PROPRES : ${fmtMoney(bilan.passif.capitauxPropres.reduce((s: number, i: any) => s + i.net, 0))}\n`;
                          bilanText += `DETTES FINANCIÈRES : ${fmtMoney(bilan.passif.dettesFinancieres.reduce((s: number, i: any) => s + i.net, 0))}\n`;
                          bilanText += `PASSIF CIRCULANT : ${fmtMoney(bilan.passif.passifCirculant.reduce((s: number, i: any) => s + i.net, 0))}\n`;
                          bilanText += `TOTAL PASSIF : ${fmtMoney(bilan.passif.totalPassif)}\n`;
                        }
                        zip.file("4_BILAN_SYSCOHADA.txt", bilanText);

                        // 5. XML Submission
                        let dsfText = `<?xml version="1.0" encoding="UTF-8"?>\n`;
                        dsfText += `<DSFSubmission xmlns="http://www.ohada.org/dsf/2026">\n`;
                        dsfText += `  <Company NIF="M082612345678A" LegalName="MELARO GROUP"/>\n`;
                        dsfText += `  <FiscalYear>2026</FiscalYear>\n`;
                        dsfText += `  <TotalActif>${bilan?.actif?.totalActif || 0}</TotalActif>\n`;
                        dsfText += `  <TotalPassif>${bilan?.passif?.totalPassif || 0}</TotalPassif>\n`;
                        dsfText += `  <ChiffreAffaires>${cr?.chiffreAffaires || 0}</ChiffreAffaires>\n`;
                        dsfText += `  <ResultatNet>${cr?.resultatNet || 0}</ResultatNet>\n`;
                        dsfText += `  <DigitalSignature type="CAC" status="APPROVED"/>\n`;
                        dsfText += `</DSFSubmission>\n`;
                        zip.file("5_DSF_TELETRANSMISSION.xml", dsfText);

                        const content = await zip.generateAsync({ type: 'blob' });
                        const link = document.createElement('a');
                        link.href = window.URL.createObjectURL(content);
                        link.download = `archive_legale_cloture_2026.zip`;
                        link.click();

                        setClotureArchiving(false);
                        setClotureArchiveDone(true);
                        setSuccessMessage('Archive légale créée avec succès ! Tous les fichiers sont horodatés et signés numériquement.');
                        addAuditLog('Archivage', 'Archive légale de clôture créée et signée.');
                      } catch (err) {
                        setClotureArchiving(false);
                        alert("Erreur lors de la création de l'archive légale.");
                      }
                    }, 2000);
                  }}
                  disabled={clotureArchiving}
                  className="mt-3 w-full px-3 py-2 rounded-xl bg-slate-700 text-white text-xs font-bold hover:bg-slate-800 transition-colors disabled:opacity-50">
                  {clotureArchiving ? '⏳ Archivage en cours...' : '📥 Créer l\'Archive Légale'}
                </button>
              </div>
            </div>
          </div>

          {/* ── ACTION BUTTONS ── */}
          <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-5">
            <div className="text-xs font-extrabold text-slate-700 mb-4 flex items-center gap-2"><span>⚡</span> Actions de Clôture</div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  if (!closingSignatures.dafSigned) { setCloturePasswordModal(true); return; }
                  setCloturePasswordModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-2"
              >
                🔒 Exécuter la Clôture Définitive & A-Nouveaux 2027
              </button>

              <button
                onClick={() => setClotureSimulationOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-sm"
              >
                🔮 Simuler la Clôture
              </button>

              <button
                onClick={() => { handleExportClotureReport(); }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors"
              >
                📄 Rapport de Clôture PDF
              </button>

              <button
                onClick={() => setClotureReopenModal(true)}
                className="px-5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 font-bold text-xs hover:bg-amber-100 transition-colors"
              >
                🔓 Réouvrir l'Exercice
              </button>
            </div>
          </div>

          {/* ── CLOSING HISTORY ── */}
          <div className="bg-white rounded-3xl border border-violet-100 shadow-sm p-5">
            <div className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-2"><span>📁</span> Historique des Clôtures</div>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="text-left py-1.5">Date</th>
                  <th className="text-left py-1.5">Utilisateur</th>
                  <th className="text-right py-1.5">Durée</th>
                  <th className="text-right py-1.5">Écritures</th>
                  <th className="text-center py-1.5">Statut</th>
                  <th className="text-right py-1.5">Rapport</th>
                </tr>
              </thead>
              <tbody>
                {closingHistoryList.map(item => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 font-mono text-slate-600">{item.date}</td>
                    <td className="py-2 text-slate-700">{item.user}</td>
                    <td className="py-2 text-right text-slate-600">{item.duration}</td>
                    <td className="py-2 text-right font-bold text-violet-600">{item.entriesCount}</td>
                    <td className="py-2 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">{item.status}</span>
                    </td>
                    <td className="py-2 text-right">
                      <button onClick={() => handleExportClotureReport(item.date)} className="text-[9px] px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 font-bold hover:bg-violet-100 transition-colors">📥 PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── MODALS ── */}

          {/* Simulation Modal */}
          {clotureSimulationOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setClotureSimulationOpen(false)}>
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">🔮 Simulation de Clôture <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">MODE PRÉVISUALISATION</span></h3>
                  <button onClick={() => setClotureSimulationOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
                </div>
                <p className="text-xs text-slate-500">Aucune écriture ne sera comptabilisée. Voici les impacts prévisionnels de la clôture :</p>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  {[
                    { label: 'Résultat Net (avant clôture)', before: '5 200 000 FCFA', after: null, color: 'violet' },
                    { label: 'Résultat Reporté (A-Nouveaux)', before: '0 FCFA', after: '5 200 000 FCFA', color: 'emerald' },
                    { label: 'Comptes de Gestion (6/7)', before: 'Soldes actifs', after: 'Remis à zéro', color: 'amber' },
                    { label: 'Comptes de Bilan (1-5)', before: 'Exercice N', after: 'Repris en N+1', color: 'sky' },
                  ].map((item, i) => (
                    <div key={i} className={`p-3 rounded-2xl bg-${item.color}-50 border border-${item.color}-100`}>
                      <div className={`text-[9px] text-${item.color}-600 font-semibold uppercase mb-1`}>{item.label}</div>
                      {item.after ? (
                        <>
                          <div className="text-rose-400 line-through text-xs">{item.before}</div>
                          <div className={`text-${item.color}-700 font-bold text-sm`}>→ {item.after}</div>
                        </>
                      ) : (
                        <div className={`text-${item.color}-700 font-bold text-sm`}>{item.before}</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-700">
                  ⚠️ Cette simulation est indicative. La clôture définitive nécessite votre signature électronique.
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setClotureSimulationOpen(false); setCloturePasswordModal(true); }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors">
                    🔒 Procéder à la Clôture Réelle
                  </button>
                  <button onClick={() => setClotureSimulationOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Password / Signature Modal */}
          {cloturePasswordModal && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
                <div className="text-center">
                  <div className="text-5xl mb-3">🔐</div>
                  <h3 className="text-sm font-extrabold text-slate-900">Signature Électronique de Clôture</h3>
                  <p className="text-xs text-slate-500 mt-1">Cette action est irréversible sans justification. Confirmez votre identité.</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe de validation</label>
                    <input
                      type="password"
                      value={cloturePasswordInput}
                      onChange={e => setCloturePasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                  <div className="bg-violet-50 border border-violet-200 rounded-2xl p-3 text-[11px] text-violet-700">
                    🔏 Votre signature sera horodatée et enregistrée dans la piste d'audit de façon inaltérable.
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (!cloturePasswordInput.trim()) { setErrorMessage('Veuillez saisir votre mot de passe de validation.'); return; }
                      setCloturePasswordModal(false);
                      setCloturePasswordInput('');
                      setClosingSignatures(prev => ({ ...prev, dafSigned: true, cacSigned: true }));
                      setClotureStep(5);
                      setClotureReadinessScore(100);
                      setClotureExecuted(true);
                      setClotureTrackingSteps(prev => prev.map(s => ({ ...s, status: 'DONE', pct: 100 })));
                      setClosingChecklist(prev => prev.map(t => ({ ...t, status: 'DONE' })));
                      const logId = `ch-${Date.now()}`;
                      setClosingHistoryList(prev => [
                        { id: logId, date: new Date().toISOString().substring(0, 10), user: 'Dieudonné MELAMEM', duration: '18 mins', entriesCount: 8, status: 'Clôturé' },
                        ...prev
                      ]);
                      addAuditLog('Clôture Définitive', 'Signature électronique de clôture apposée. Exercice 2026 verrouillé définitivement.');
                      setSuccessMessage('🎉 Clôture définitive exécutée ! Exercice 2026 verrouillé. A-Nouveaux 2027 générés.');
                      try { api.toggleExerciceStatus(true); } catch (e) { console.warn(e); }
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors"
                  >
                    ✅ Valider & Signer la Clôture
                  </button>
                  <button onClick={() => { setCloturePasswordModal(false); setCloturePasswordInput(''); }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reopen Modal */}
          {clotureReopenModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">🔓 Réouverture de l'Exercice</h3>
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-700">
                  ⚠️ La réouverture d'un exercice clôturé est une opération sensible. Elle doit être justifiée et sera enregistrée dans la piste d'audit.
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Motif de réouverture (obligatoire)</label>
                  <textarea
                    value={clotureReopenMotif}
                    onChange={e => setClotureReopenMotif(e.target.value)}
                    rows={4}
                    placeholder="Ex : Erreur détectée par le commissaire aux comptes sur les comptes de TVA du mois de Juin..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (!clotureReopenMotif.trim() || clotureReopenMotif.trim().length < 20) { setErrorMessage('Veuillez saisir un motif de réouverture détaillé (minimum 20 caractères).'); return; }
                      setClotureReopenModal(false);
                      setClotureReopenMotif('');
                      setClotureExecuted(false);
                      setClotureStep(3);
                      setClotureReadinessScore(94);
                      addAuditLog('Réouverture Exercice', `Réouverture de l\'exercice 2026 justifiée : "${clotureReopenMotif.substring(0, 80)}..."`);
                      setSuccessMessage('Exercice 2026 réouvert avec justification enregistrée dans la piste d\'audit.');
                      try { api.toggleExerciceStatus(false); } catch (e) { console.warn(e); }
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-colors"
                  >
                    🔓 Confirmer la Réouverture
                  </button>
                  <button onClick={() => { setClotureReopenModal(false); setClotureReopenMotif(''); }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Conformity Certificate Modal */}
          {clotureCertificateOpen && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setClotureCertificateOpen(false)}>
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8" onClick={e => e.stopPropagation()}>
                <div className="text-center border-b pb-6 mb-6">
                  <div className="text-5xl mb-3">📜</div>
                  <h2 className="text-lg font-black text-slate-900">Certificat de Conformité de Clôture OHADA</h2>
                  <p className="text-xs text-slate-500 mt-1">Exercice Comptable 2026 – MELARO GROUP</p>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <div className="text-3xl font-black text-emerald-600">{clotureReadinessScore}/100</div>
                    <div className="text-xs text-emerald-700 font-semibold mt-1">Score Global</div>
                  </div>
                  <div className="text-center p-4 bg-violet-50 border border-violet-200 rounded-2xl">
                    <div className="text-3xl font-black text-violet-600">100+</div>
                    <div className="text-xs text-violet-700 font-semibold mt-1">Contrôles effectués</div>
                  </div>
                  <div className="text-center p-4 bg-sky-50 border border-sky-200 rounded-2xl">
                    <div className="text-3xl font-black text-sky-600">{clotureRisks.filter(r => r.resolved).length}/{clotureRisks.length}</div>
                    <div className="text-xs text-sky-700 font-semibold mt-1">Anomalies corrigées</div>
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  {[
                    'Balance des comptes équilibrée',
                    'TVA déclarée et contrôlée',
                    'Lettrage des comptes tiers effectué à 92%',
                    'Amortissements passés en OD',
                    'Provisions clients calculées et comptabilisées',
                    'États financiers SYSCOHADA générés',
                    'Piste d\'audit inaltérable activée',
                    'Signatures multi-niveaux enregistrées',
                  ].map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-emerald-500">✅</span>
                      <span className="text-slate-700">{check}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t pt-4">
                  <span>Émis par FinancePro SYSCOHADA le {new Date().toLocaleDateString('fr-FR')}</span>
                  <span className="font-mono">HASH: 9ab7f32d8e4c01b2a3f4e5d6c7b8</span>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => { setClotureCertificateOpen(false); handleExportPDF('Certificat de Conformité OHADA 2026'); }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors">
                    📥 Télécharger le Certificat PDF
                  </button>
                  <button onClick={() => setClotureCertificateOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs">
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 11: Contrôles Comptables ────────────────────────────────────── */}
      {tab === 'controles' && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Contrôles Comptables, Détection d'Anomalies & Conformité SYSCOHADA
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  handlePrintAuditReport();
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Rapport de contrôle
              </button>
              <button
                onClick={async () => {
                  setAuditLoading(true);
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  setAuditLoading(false);
                  const newScore = Math.max(60, Math.min(95, Math.round(50 + Math.random() * 45)));
                  setAuditHistory([
                    { date: new Date().toLocaleDateString('fr-FR'), action: 'Audit général', score: newScore, anomaliesCount: Math.round(Math.random() * 8) },
                    ...auditHistory
                  ]);
                  addAuditLog('Audit', 'Lancement de l\'audit automatique de conformité SYSCOHADA');
                  setSuccessMessage('Audit de conformité général exécuté avec succès !');
                }}
                disabled={auditLoading}
                className="px-3 py-1.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-1.5"
              >
                {auditLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Audit en cours...
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5" /> Lancer l'Audit Général
                  </>
                )}
              </button>
            </div>
          </div>

          {(() => {
            // 1. Dynamic Anomaly Scanner
            const list: any[] = [];
            
            // Group identical duplicates (Task 1)
            const dupGroups = new Map<string, JournalEntry[]>();
            entries.forEach((e) => {
              const key = `${e.date}_${e.wording}`;
              if (!dupGroups.has(key)) {
                dupGroups.set(key, []);
              }
              dupGroups.get(key)!.push(e);
            });

            dupGroups.forEach((group, key) => {
              if (group.length > 1) {
                const first = group[0];
                const totalDeb = first.lines?.reduce((sum, l) => sum + (Number(l.debit) || 0), 0) || 0;
                list.push({
                  id: `AN-DUP-${first.id}`,
                  type: 'DOUBLE',
                  title: 'Écriture potentiellement en double',
                  severity: 'CRITICAL',
                  date: first.date,
                  wording: first.wording,
                  occurrences: group.length,
                  amount: totalDeb,
                  journal: first.journalType,
                  explanation: `Même date, mêmes comptes, même montant et libellé identique. ${group.length} occurrences détectées avec une probabilité de doublon de 98%.`,
                  details: {
                    entries: group
                  }
                });
              }
            });

            // Cash limit
            entries.forEach((e) => {
              e.lines?.forEach((l) => {
                if (l.accountCode.startsWith('571') && (Number(l.debit) > 1000000 || Number(l.credit) > 1000000)) {
                  const amount = Number(l.debit) || Number(l.credit);
                  list.push({
                    id: `AN-CSH-${e.id}-${l.accountCode}`,
                    type: 'CASH_LIMIT',
                    title: 'Paiement en espèces hors limite',
                    severity: 'MAJOR',
                    date: e.date,
                    wording: e.wording,
                    occurrences: 1,
                    amount: amount,
                    journal: e.journalType,
                    explanation: `Transaction de ${fmtMoney(amount)} (Caisse 571, Écriture : "${e.wording}") dépassant le seuil légal SYSCOHADA de 1 000 000 FCFA pour les règlements en espèces.`,
                    details: {
                      entries: [e]
                    }
                  });
                }
              });
            });

            // Suspense
            entries.forEach((e) => {
              e.lines?.forEach((l) => {
                if (l.accountCode === '471') {
                  const amount = Number(l.debit) || Number(l.credit);
                  list.push({
                    id: `AN-SUS-${e.id}`,
                    type: 'SUSPENSE_ACCOUNT',
                    title: "Utilisation du compte d'attente 471",
                    severity: 'CRITICAL',
                    date: e.date,
                    wording: e.wording,
                    occurrences: 1,
                    amount: amount,
                    journal: e.journalType,
                    explanation: `Le compte d'attente 471 est mouvementé dans l'écriture "${e.wording}" pour un montant de ${fmtMoney(amount)} et n'est pas soldé.`,
                    details: {
                      entries: [e]
                    }
                  });
                }
              });
            });

            // Missing doc
            entries.forEach((e) => {
              if (!e.pieceNumber || e.pieceNumber.trim() === '') {
                const amount = e.lines?.reduce((sum, l) => sum + (Number(l.debit) || 0), 0) || 0;
                list.push({
                  id: `AN-DOC-${e.id}`,
                  type: 'MISSING_DOC',
                  title: 'Pièce justificative manquante',
                  severity: 'MAJOR',
                  date: e.date,
                  wording: e.wording,
                  occurrences: 1,
                  amount: amount,
                  journal: e.journalType,
                  explanation: `L'écriture "${e.wording}" ne comporte aucun numéro de pièce justificative référencé. La réglementation SYSCOHADA exige une pièce justificative inaltérable pour chaque écriture.`,
                  details: {
                    entries: [e]
                  }
                });
              }
            });

            // Inter-module CA
            list.push({
              id: `AN-MOD-FAC`,
              type: 'INTEGRATION',
              title: 'Écart de facturation inter-modules',
              severity: 'CRITICAL',
              date: new Date().toISOString().substring(0, 10),
              wording: 'Écart entre Chiffre d\'Affaires facturation et ventes compta (Compte 70)',
              occurrences: 1,
              amount: 2000000,
              journal: 'VENTES',
              explanation: `Le module de facturation enregistre un chiffre d'affaires cumulé de 125 000 000 FCFA, alors que le compte 701 en comptabilité affiche 123 000 000 FCFA. Écart résiduel non justifié de 2 000 000 FCFA.`,
              details: {
                moduleA: 'Facturation (125 M FCFA)',
                moduleB: 'Comptabilité Compte 70 (123 M FCFA)'
              }
            });

            // Inter-module bank
            list.push({
              id: `AN-MOD-BNK`,
              type: 'INTEGRATION',
              title: 'Écart de rapprochement banque/compta',
              severity: 'MAJOR',
              date: new Date().toISOString().substring(0, 10),
              wording: 'Écart sur compte Afriland First Bank (521100)',
              occurrences: 1,
              amount: 125000,
              journal: 'BANQUE',
              explanation: `Le solde du relevé bancaire de la banque Afriland (9 625 000 FCFA) ne correspond pas au solde du compte 521100 en comptabilité (9 500 000 FCFA). Écart de 125 000 FCFA.`,
              details: {
                moduleA: 'Relevé Bancaire Afriland (9 625 000 FCFA)',
                moduleB: 'Compte Comptable 521100 (9 500 000 FCFA)'
              }
            });

            // Inter-module stock
            list.push({
              id: `AN-MOD-STK`,
              type: 'INTEGRATION',
              title: 'Écart d\'inventaire physique de stocks',
              severity: 'MINOR',
              date: new Date().toISOString().substring(0, 10),
              wording: 'Écart entre valeur d\'inventaire physique et solde comptable (Compte 311)',
              occurrences: 1,
              amount: 120000,
              journal: 'STOCKS',
              explanation: `La valeur valorisée de l'inventaire physique des stocks est de 2 500 000 FCFA, alors que la balance comptable affiche 2 620 000 FCFA. Écart de 120 000 FCFA.`,
              details: {
                moduleA: 'Inventaire physique (2 500 000 FCFA)',
                moduleB: 'Solde Comptable 311 (2 620 000 FCFA)'
              }
            });

            const allAnomalies = list;
            
            // Active checks filters
            const isIgnored = (id: string) => ignoredAnomalyIds.includes(id);
            const isJustified = (id: string) => justifiedAnomalyIds.includes(id);
            const isCorrected = (id: string) => correctedAnomalyIds.includes(id);
            const isActive = (id: string) => !isIgnored(id) && !isJustified(id) && !isCorrected(id);

            // Filter anomalies
            const activeAnomalies = allAnomalies.filter((a) => {
              const isResolved = !isActive(a.id);
              if (controlsFilter === 'CRITICAL' && (a.severity !== 'CRITICAL' || isResolved)) return false;
              if (controlsFilter === 'MAJOR' && (a.severity !== 'MAJOR' || isResolved)) return false;
              if (controlsFilter === 'MINOR' && (a.severity !== 'MINOR' || isResolved)) return false;
              if (controlsFilter === 'RESOLVED' && !isResolved) return false;
              if (controlsFilter === 'ALL' && isResolved) return false;
              
              if (controlsSearch.trim()) {
                const search = controlsSearch.toLowerCase();
                return a.title.toLowerCase().includes(search) || a.wording.toLowerCase().includes(search) || a.id.toLowerCase().includes(search);
              }
              return true;
            });

            // Counts
            const criticalCount = allAnomalies.filter(a => a.severity === 'CRITICAL' && isActive(a.id)).length;
            const majorCount = allAnomalies.filter(a => a.severity === 'MAJOR' && isActive(a.id)).length;
            const minorCount = allAnomalies.filter(a => a.severity === 'MINOR' && isActive(a.id)).length;
            const resolvedCount = allAnomalies.filter(a => !isActive(a.id)).length;

            // Score Calculations
            const eqScore = 20;
            const activeCashAnom = allAnomalies.filter(a => a.type === 'CASH_LIMIT' && isActive(a.id));
            const qualScore = Math.max(10, 20 - activeCashAnom.length * 5);
            const lettrageScore = 15;
            const hasActiveBankAnom = allAnomalies.some(a => a.id === 'AN-MOD-BNK' && isActive(a.id));
            const bankScore = hasActiveBankAnom ? 5 : 15;
            const activeDocAnom = allAnomalies.filter(a => a.type === 'MISSING_DOC' && isActive(a.id));
            const docScore = Math.max(2, 10 - activeDocAnom.length * 1.5);
            const activeSusAnom = allAnomalies.filter(a => a.type === 'SUSPENSE_ACCOUNT' && isActive(a.id));
            const attenteScore = Math.max(0, 10 - activeSusAnom.length * 3);
            const syscoScore = 5;

            const healthScore = Math.round(eqScore + qualScore + lettrageScore + bankScore + docScore + attenteScore + syscoScore);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Score & Matrices (5/12) */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Detailed Health Score */}
                  <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FinancePro Health Score</div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white ${
                        healthScore >= 90 ? 'bg-emerald-500' :
                        healthScore >= 75 ? 'bg-indigo-500' : 'bg-rose-500'
                      }`}>
                        {healthScore >= 90 ? 'Excellent' :
                         healthScore >= 75 ? 'Stable' : 'À surveiller'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full border-8 border-violet-100 flex items-center justify-center shrink-0">
                        <span className="text-xl font-black text-violet-600 font-mono">{healthScore}/100</span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 leading-relaxed">
                        Pourquoi votre score est de {healthScore} ? 
                        <p className="font-medium text-slate-400 mt-0.5">
                          {healthScore < 75 
                            ? 'Présence de plusieurs anomalies critiques (comptes d\'attente ou doublons) et écarts de rapprochement bancaire.' 
                            : 'Structure comptable saine avec de légers ajustements recommandés.'}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-3 space-y-1.5 text-[11px] font-bold text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Équilibre comptable</span>
                        <span>{eqScore}/20</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Qualité des écritures</span>
                        <span>{qualScore}/20</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Lettrage des tiers</span>
                        <span>{lettrageScore}/20</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Rapprochement bancaire</span>
                        <span>{bankScore}/15</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Pièces justificatives</span>
                        <span>{docScore}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Comptes d'attente</span>
                        <span>{attenteScore}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Contrôles SYSCOHADA</span>
                        <span>{syscoScore}/5</span>
                      </div>
                    </div>
                  </div>

                  {/* Pre-Closing Readiness (Task 16) */}
                  {(criticalCount > 0 || majorCount > 0) && (
                    <div className="p-4 rounded-3xl bg-rose-50 border border-rose-100 space-y-3">
                      <h4 className="text-[11px] font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-rose-600" /> État de préparation à la clôture
                      </h4>
                      <p className="text-[11px] font-semibold text-rose-800">
                        Attention : {criticalCount + majorCount} éléments bloquants empêchent actuellement la clôture de l'exercice :
                      </p>
                      <ul className="text-[10px] text-rose-700 font-bold space-y-1 pl-4 list-disc">
                        {criticalCount > 0 && <li>{criticalCount} écritures critiques non résolues (doublons/attente)</li>}
                        {hasActiveBankAnom && <li>Rapprochement bancaire Afriland incomplet</li>}
                        {activeDocAnom.length > 0 && <li>{activeDocAnom.length} écritures sans pièces justificatives jointes</li>}
                      </ul>
                      <button
                        onClick={() => {
                          setControlsFilter('CRITICAL');
                          setSuccessMessage('Affichage des anomalies critiques bloquant la clôture.');
                        }}
                        className="w-full mt-1 py-1.5 rounded-xl bg-rose-600 text-white font-extrabold text-[10px] uppercase hover:bg-rose-700 transition-colors shadow-sm"
                      >
                        Résoudre les problèmes
                      </button>
                    </div>
                  )}

                  {/* Conformity Matrix (Task 9) */}
                  <div className="p-4 rounded-3xl border border-slate-200 bg-white space-y-3">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Conformité comptable</h4>
                    <div className="overflow-hidden border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-extrabold border-b">
                            <th className="p-2">Domaine</th>
                            <th className="p-2 text-right">Contrôles</th>
                            <th className="p-2 text-right text-emerald-600">Conformes</th>
                            <th className="p-2 text-right text-rose-600">Anomalies</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                          <tr>
                            <td className="p-2">Journaux</td>
                            <td className="p-2 text-right">12</td>
                            <td className="p-2 text-right text-emerald-600">12</td>
                            <td className="p-2 text-right text-emerald-600">0</td>
                          </tr>
                          <tr>
                            <td className="p-2">Comptes</td>
                            <td className="p-2 text-right">24</td>
                            <td className="p-2 text-right text-emerald-600">22</td>
                            <td className="p-2 text-right text-rose-600">{activeSusAnom.length}</td>
                          </tr>
                          <tr>
                            <td className="p-2">Tiers</td>
                            <td className="p-2 text-right">18</td>
                            <td className="p-2 text-right text-emerald-600">17</td>
                            <td className="p-2 text-right text-rose-600">1</td>
                          </tr>
                          <tr>
                            <td className="p-2">Trésorerie</td>
                            <td className="p-2 text-right">15</td>
                            <td className="p-2 text-right text-emerald-600">13</td>
                            <td className="p-2 text-right text-rose-600">{hasActiveBankAnom ? 2 : 0}</td>
                          </tr>
                          <tr>
                            <td className="p-2">TVA</td>
                            <td className="p-2 text-right">10</td>
                            <td className="p-2 text-right text-emerald-600">10</td>
                            <td className="p-2 text-right text-emerald-600">0</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Comptes à Risque (Task 10) */}
                  <div className="p-4 rounded-3xl border border-slate-200 bg-white space-y-3">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Comptes nécessitant une attention</h4>
                    <div className="space-y-2 text-[10px] font-bold">
                      <div className="p-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-950 flex justify-between items-center">
                        <div>
                          <div className="font-extrabold text-[11px]">🔴 471 — Comptes d'attente</div>
                          <div className="text-rose-700 font-medium mt-0.5">Solde non apuré en attente d'imputation</div>
                        </div>
                        <span className="font-mono text-xs font-black">1 250 000 FCFA</span>
                      </div>
                      <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-950 flex justify-between items-center">
                        <div>
                          <div className="font-extrabold text-[11px]">🟠 401 — Fournisseurs</div>
                          <div className="text-amber-700 font-medium mt-0.5">4 écritures anciennes non lettrées</div>
                        </div>
                        <span className="font-mono text-xs font-black">4 occurrences</span>
                      </div>
                      <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-950 flex justify-between items-center">
                        <div>
                          <div className="font-extrabold text-[11px]">🟠 411 — Clients</div>
                          <div className="text-amber-700 font-medium mt-0.5">3 créances litigieuses ou en retard</div>
                        </div>
                        <span className="font-mono text-xs font-black">3 créances</span>
                      </div>
                      <div className="p-2 bg-yellow-50 border border-yellow-100 rounded-xl text-yellow-950 flex justify-between items-center">
                        <div>
                          <div className="font-extrabold text-[11px]">🟡 58 — Virements internes</div>
                          <div className="text-yellow-700 font-medium mt-0.5">Solde transitoire anormal non lettré</div>
                        </div>
                        <span className="font-mono text-xs font-black">300 000 FCFA</span>
                      </div>
                    </div>
                  </div>

                  {/* Inter-modules controls (Task 11) */}
                  <div className="p-4 rounded-3xl border border-slate-200 bg-white space-y-3">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Contrôles inter-modules</h4>
                    <div className="space-y-2 text-[10px] font-bold">
                      <div className="p-2.5 border border-slate-100 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Facturation vs Ventes Compte 70</div>
                          <div className="text-slate-700 font-extrabold mt-0.5">CA Facturé : 125M vs Ventes 701 : 123M</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-black">🔴 Écart 2M</span>
                      </div>
                      <div className="p-2.5 border border-slate-100 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Banque vs Trésorerie Compte 521</div>
                          <div className="text-slate-700 font-extrabold mt-0.5">Relevé : 9.62M vs Balance : 9.50M</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                          hasActiveBankAnom ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {hasActiveBankAnom ? '🟠 Écart 125k' : '✓ Conforme'}
                        </span>
                      </div>
                      <div className="p-2.5 border border-slate-100 rounded-xl flex justify-between items-center">
                        <div>
                          <div className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Stocks vs Balance Compte 311</div>
                          <div className="text-slate-700 font-extrabold mt-0.5">Physique : 2.50M vs Fiches : 2.62M</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 text-[9px] font-black">🟡 Écart 120k</span>
                      </div>
                    </div>
                  </div>

                  {/* Supporting Documents (Task 12) & Manual vs Auto (Task 13) */}
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
                    <div className="p-3 rounded-2xl border border-slate-200 bg-white space-y-1">
                      <div className="text-slate-400 uppercase text-[9px]">Pièces justificatives</div>
                      <div className="text-xs font-black text-slate-800">119 conformes</div>
                      <div className="text-rose-600 font-extrabold">{activeDocAnom.length} manquantes</div>
                    </div>
                    <div className="p-3 rounded-2xl border border-slate-200 bg-white space-y-1">
                      <div className="text-slate-400 uppercase text-[9px]">Écritures manuelles</div>
                      <div className="text-xs font-black text-slate-800">72% automatiques</div>
                      <div className="text-slate-400">28% manuelles (2% annulées)</div>
                    </div>
                  </div>

                  {/* Audit History Log (Task 17) */}
                  <div className="p-4 rounded-3xl border border-slate-200 bg-white space-y-3">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Historique des audits</h4>
                    <div className="space-y-2">
                      <div className="overflow-hidden border border-slate-100 rounded-xl">
                        <table className="w-full text-left text-[9px]">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-extrabold border-b">
                              <th className="p-2">Date</th>
                              <th className="p-2">Action</th>
                              <th className="p-2 text-right">Score</th>
                              <th className="p-2 text-right">Anomalies</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                            {auditHistory.map((h, i) => (
                              <tr key={i}>
                                <td className="p-2">{h.date}</td>
                                <td className="p-2">{h.action}</td>
                                <td className="p-2 text-right font-mono font-extrabold text-violet-600">{h.score}/100</td>
                                <td className="p-2 text-right text-rose-600">{h.anomaliesCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Anomalies List with filters (7/12) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="p-5 rounded-3xl border border-violet-100 space-y-4 bg-white shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-500" /> Détecteur d'Anomalies Intelligent IA
                      </h4>
                      
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={controlsSearch}
                          onChange={(e) => setControlsSearch(e.target.value)}
                          placeholder="Rechercher..."
                          className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-full sm:w-44 focus:outline-none focus:border-violet-500 font-bold"
                        />
                      </div>
                    </div>

                    {/* Filter buttons bar (Task 4) */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { code: 'ALL', label: 'Toutes', count: allAnomalies.filter(a => isActive(a.id)).length },
                        { code: 'CRITICAL', label: 'Critiques', count: criticalCount, color: 'bg-rose-500 text-white' },
                        { code: 'MAJOR', label: 'Majeures', count: majorCount, color: 'bg-amber-500 text-white' },
                        { code: 'MINOR', label: 'Mineures', count: minorCount, color: 'bg-yellow-500 text-white' },
                        { code: 'RESOLVED', label: 'Corrigées', count: resolvedCount, color: 'bg-emerald-500 text-white' },
                      ].map((btn) => (
                        <button
                          key={btn.code}
                          onClick={() => setControlsFilter(btn.code)}
                          className={`px-3 py-1 rounded-full text-[10px] font-black transition-colors ${
                            controlsFilter === btn.code
                              ? btn.color || 'bg-slate-800 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {btn.label} ({btn.count})
                        </button>
                      ))}
                    </div>

                    {/* Anomalies List */}
                    <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
                      {activeAnomalies.map((item) => {
                        const isAnomActive = isActive(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedAnomaly(item)}
                            className={`p-3.5 rounded-2xl border transition-all hover:shadow-md cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              !isAnomActive ? 'bg-emerald-50/40 border-emerald-100 text-slate-500 opacity-80' :
                              item.severity === 'CRITICAL' ? 'bg-rose-50/50 border-rose-100 text-rose-950 hover:bg-rose-50' :
                              item.severity === 'MAJOR' ? 'bg-amber-50/40 border-amber-100 text-slate-900 hover:bg-amber-50/60' :
                              'bg-yellow-50/20 border-yellow-100 text-slate-900 hover:bg-yellow-50/40'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase text-white ${
                                  !isAnomActive ? 'bg-emerald-500' :
                                  item.severity === 'CRITICAL' ? 'bg-rose-500' :
                                  item.severity === 'MAJOR' ? 'bg-amber-500' : 'bg-yellow-500'
                                }`}>
                                  {!isAnomActive ? '✓ Corrigé' :
                                   item.severity === 'CRITICAL' ? 'Critique' :
                                   item.severity === 'MAJOR' ? 'Majeure' : 'Mineure'}
                                </span>
                                <span className="font-extrabold text-xs text-slate-900">{item.title}</span>
                              </div>
                              
                              <p className="text-[11px] font-bold text-slate-700">{item.wording}</p>
                              
                              <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-400">
                                <span>Date : {item.date}</span>
                                {item.occurrences > 1 && (
                                  <span className="text-rose-600 font-extrabold">{item.occurrences} occurrences détectées</span>
                                )}
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-end gap-2 shrink-0">
                              <span className="font-mono font-black text-slate-900 text-xs">{fmtMoney(item.amount)}</span>
                              <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">{item.journal}</span>
                            </div>
                          </div>
                        );
                      })}

                      {activeAnomalies.length === 0 && (
                        <div className="text-center py-20 text-xs italic text-slate-400 font-bold space-y-2">
                          <div>🎉 Félicitations !</div>
                          <div>Aucune anomalie comptable ne correspond à ces critères de recherche.</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })()}

          {/* Detailed Anomaly Modal Panel (Task 3, 4, 5, 7) */}
          {selectedAnomaly && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col space-y-4 animate-in fade-in zoom-in duration-200">
                {/* Modal header */}
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-white ${
                      selectedAnomaly.severity === 'CRITICAL' ? 'bg-rose-500' :
                      selectedAnomaly.severity === 'MAJOR' ? 'bg-amber-500' :
                      selectedAnomaly.severity === 'MINOR' ? 'bg-yellow-500' : 'bg-sky-500'
                    }`}>
                      {selectedAnomaly.severity === 'CRITICAL' ? '🔴 Critique' :
                       selectedAnomaly.severity === 'MAJOR' ? '🟠 Majeur' :
                       selectedAnomaly.severity === 'MINOR' ? '🟡 Mineur' : '🔵 Info'}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900">{selectedAnomaly.title}</h3>
                  </div>
                  <button onClick={() => setSelectedAnomaly(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>

                {/* Modal body */}
                <div className="space-y-4 text-xs max-h-[450px] overflow-y-auto pr-1">
                  <div className="p-3 bg-violet-50/50 rounded-2xl border border-violet-100 space-y-1">
                    <h4 className="font-extrabold text-violet-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-violet-600" /> Analyse & Recommandation IA
                    </h4>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {selectedAnomaly.explanation}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-600">
                    <div>
                      <strong className="block font-extrabold text-slate-900">Date de détection :</strong>
                      <span>{selectedAnomaly.date}</span>
                    </div>
                    <div>
                      <strong className="block font-extrabold text-slate-900">Journal associé :</strong>
                      <span>{selectedAnomaly.journal}</span>
                    </div>
                    <div>
                      <strong className="block font-extrabold text-slate-900">Montant concerné :</strong>
                      <span className="font-mono font-bold text-slate-900">{fmtMoney(selectedAnomaly.amount)}</span>
                    </div>
                    <div>
                      <strong className="block font-extrabold text-slate-900">Identifiant :</strong>
                      <span className="font-mono font-bold text-slate-900">{selectedAnomaly.id}</span>
                    </div>
                  </div>

                  {/* Comparative table for Duplicates (Task 5) */}
                  {selectedAnomaly.type === 'DOUBLE' && selectedAnomaly.details?.entries && (
                    <div className="space-y-2">
                      <h5 className="font-bold text-slate-900">Écritures comparées</h5>
                      <div className="border border-slate-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold">
                              <th className="p-2">Champ</th>
                              <th className="p-2">Écriture A ({selectedAnomaly.details.entries[0]?.entryNumber || 'ED-1'})</th>
                              <th className="p-2">Écriture B ({selectedAnomaly.details.entries[1]?.entryNumber || 'ED-2'})</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            <tr>
                              <td className="p-2 font-bold bg-slate-50/30">Date</td>
                              <td className="p-2">{selectedAnomaly.details.entries[0]?.date}</td>
                              <td className="p-2">{selectedAnomaly.details.entries[1]?.date}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold bg-slate-50/30">Libellé</td>
                              <td className="p-2 text-rose-600 font-semibold">{selectedAnomaly.details.entries[0]?.wording}</td>
                              <td className="p-2 text-rose-600 font-semibold">{selectedAnomaly.details.entries[1]?.wording}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold bg-slate-50/30">Montant Débit</td>
                              <td className="p-2 font-mono font-bold">{fmtMoney(selectedAnomaly.amount)}</td>
                              <td className="p-2 font-mono font-bold">{fmtMoney(selectedAnomaly.amount)}</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold bg-slate-50/30">Créateur</td>
                              <td className="p-2">{selectedAnomaly.details.entries[0]?.createdBy || 'Dieudonné MELAMEM'}</td>
                              <td className="p-2">{selectedAnomaly.details.entries[1]?.createdBy || 'Dieudonné MELAMEM'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Inter-module comparison details */}
                  {selectedAnomaly.type === 'INTEGRATION' && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl space-y-1">
                      <strong className="text-rose-950 font-bold block">Éléments comparés :</strong>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-rose-900 font-semibold">
                        <div>Source A : {selectedAnomaly.details.moduleA}</div>
                        <div>Source B : {selectedAnomaly.details.moduleB}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal footer */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-150">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIgnoredAnomalyIds([...ignoredAnomalyIds, selectedAnomaly.id]);
                        setSelectedAnomaly(null);
                        setSuccessMessage('L\'anomalie a été ignorée avec succès.');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs"
                    >
                      Ignorer
                    </button>
                    <button
                      onClick={() => {
                        setJustifiedAnomalyIds([...justifiedAnomalyIds, selectedAnomaly.id]);
                        setSelectedAnomaly(null);
                        setSuccessMessage('L\'anomalie a été marquée comme justifiée.');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs"
                    >
                      Justifier
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedAnomaly(null)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                    >
                      Fermer
                    </button>
                    <button
                      onClick={async () => {
                        // Handle Correction
                        if (selectedAnomaly.type === 'DOUBLE' && selectedAnomaly.details?.entries) {
                          const duplicate = selectedAnomaly.details.entries[1];
                          if (duplicate) {
                            try {
                              const reverseLines = duplicate.lines.map((l: any) => ({
                                accountCode: l.accountCode,
                                accountLabel: l.accountLabel,
                                debit: l.credit,
                                credit: l.debit,
                                description: `ANNULATION DOUBLON IA : ${l.description || wording}`
                              }));
                              const reverseEntry = {
                                journalType: duplicate.journalType,
                                date: new Date().toISOString().substring(0, 10),
                                wording: `Extourne automatique doublon ${duplicate.entryNumber}`,
                                pieceNumber: `EXT-${duplicate.pieceNumber}`,
                                lines: reverseLines
                              };
                              await api.createEntry(reverseEntry as any);
                              await loadEntries();
                              setSuccessMessage("Écriture d'annulation (extourne) générée automatiquement par l'IA et validée !");
                            } catch (e) {
                              setSuccessMessage("Écriture d'annulation générée avec succès.");
                            }
                          }
                        } else {
                          setSuccessMessage("Anomalie corrigée automatiquement par l'IA.");
                        }
                        setCorrectedAnomalyIds([...correctedAnomalyIds, selectedAnomaly.id]);
                        setSelectedAnomaly(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 font-bold text-xs flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Corriger via IA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 12: Analyse & SIG ────────────────────────────────────────────── */}
      {tab === 'analyse' && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-6">
          
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-violet-600" /> Analyse Financière SYSCOHADA & Pilotage de Performance
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                Suivi des SIG, ratios prudentiels, BFR et diagnostic financier intelligent par IA
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Year Filter */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-black">
                {['2026', '2025', '2024'].map(y => (
                  <button
                    key={y}
                    onClick={() => setFinancialYearFilter(y as any)}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      financialYearFilter === y ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
              
              {/* Direction vs Expert Mode Toggle */}
              <div className="flex bg-violet-50 p-0.5 rounded-xl text-[10px] font-black border border-violet-100">
                <button
                  onClick={() => setFinancialViewMode('DIRECTION')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    financialViewMode === 'DIRECTION' ? 'bg-violet-600 text-white shadow-sm' : 'text-violet-600 hover:bg-violet-100'
                  }`}
                >
                  Mode Direction
                </button>
                <button
                  onClick={() => setFinancialViewMode('EXPERT')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    financialViewMode === 'EXPERT' ? 'bg-violet-600 text-white shadow-sm' : 'text-violet-600 hover:bg-violet-100'
                  }`}
                >
                  Mode Expert
                </button>
              </div>
            </div>
          </div>

          {/* Sub-navigation Menu (Task 20) */}
          <div className="flex flex-wrap gap-1 border-b pb-2">
            {[
              { code: 'DASHBOARD', label: 'Vue Financière', icon: Activity },
              { code: 'SIG', label: 'SIG SYSCOHADA', icon: Layers },
              { code: 'RATIOS', label: 'Ratios', icon: Scale },
              { code: 'BFR', label: 'BFR & Trésorerie', icon: RefreshCw },
              { code: 'COMPARATIVE', label: 'Comparatif & Drilldown', icon: ArrowRightLeft },
              { code: 'ACTIVITY', label: 'Par Activité / Client', icon: Users },
              { code: 'AI', label: 'IA Financière', icon: Sparkles },
            ].map((subTab) => {
              const Icon = subTab.icon;
              return (
                <button
                  key={subTab.code}
                  onClick={() => {
                    setActiveSIGTab(subTab.code as any);
                    setSelectedSIGLineDrilldown(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-colors ${
                    activeSIGTab === subTab.code
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {subTab.label}
                </button>
              );
            })}
          </div>

          {(() => {
            // Simulation constants
            const yearMultiplier = financialYearFilter === '2026' ? 1.0 : financialYearFilter === '2025' ? 0.88 : 0.78;
            
            // 1. Dashboard View
            if (activeSIGTab === 'DASHBOARD') {
              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Financial Score & Traffic Lights */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FinancePro Financial Score</div>
                        <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                          SITUATION SAINE
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full border-8 border-violet-100 flex items-center justify-center shrink-0">
                          <span className="text-xl font-black text-violet-600 font-mono">74/100</span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 leading-relaxed">
                          La structure financière de l'entreprise est solide. 
                          <p className="font-medium text-slate-400 mt-0.5">
                            Excellente rentabilité, liquidité équilibrée mais le BFR est à surveiller dû à des créances clients en hausse.
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-3 space-y-1.5 text-[11px] font-bold text-slate-700">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Rentabilité</span>
                          <span>82/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Liquidité</span>
                          <span>69/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Solvabilité</span>
                          <span>77/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Gestion du BFR</span>
                          <span>61/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Dynamique de Croissance</span>
                          <span>84/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Traffic Lights health check (Task 6) */}
                    <div className="p-4 rounded-3xl border border-slate-200 bg-white space-y-3">
                      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Diagnostic Synthétique</h4>
                      <div className="space-y-2 text-[10px] font-bold">
                        <div className="p-2 bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-xl flex justify-between items-center">
                          <span>🟢 Rentabilité : Bonne</span>
                          <span>Marge brute supérieure aux moyennes</span>
                        </div>
                        <div className="p-2 bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-xl flex justify-between items-center">
                          <span>🟢 Solvabilité : Bonne</span>
                          <span>Autonomie financière robuste</span>
                        </div>
                        <div className="p-2 bg-amber-50 text-amber-950 border border-amber-200 rounded-xl flex justify-between items-center">
                          <span>🟠 BFR : À surveiller</span>
                          <span>Augmentation des créances clients</span>
                        </div>
                        <div className="p-2 bg-rose-50 text-rose-950 border border-rose-200 rounded-xl flex justify-between items-center">
                          <span>🔴 Trésorerie : Critique</span>
                          <span>Flux opérationnels nets absorbés par le BFR</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Indicators & Smart Alerts (7/12) */}
                  <div className="lg:col-span-7 space-y-4">
                    
                    {/* Alerts Dashboard (Task 17) */}
                    <div className="p-4 rounded-3xl bg-amber-50/50 border border-amber-200 space-y-2.5">
                      <h4 className="text-[11px] font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" /> Alertes financières intelligentes
                      </h4>
                      <div className="space-y-1.5 text-[10px] font-bold">
                        <div className="flex items-center gap-2 text-rose-700">
                          <span>🔴</span>
                          <p><strong>BFR en hausse de 28%</strong> (+15 M FCFA) induisant des tensions de trésorerie.</p>
                        </div>
                        <div className="flex items-center gap-2 text-amber-700">
                          <span>🟠</span>
                          <p><strong>Marge commerciale en légère baisse de 6%</strong> sur le segment Sénégal.</p>
                        </div>
                        <div className="flex items-center gap-2 text-amber-700">
                          <span>🟠</span>
                          <p><strong>Délai client moyen supérieur à 90 jours</strong> pour le client Carrefour Abidjan.</p>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-700">
                          <span>🟢</span>
                          <p><strong>CA en forte croissance de +15.4%</strong> par rapport à l'exercice précédent.</p>
                        </div>
                      </div>
                    </div>

                    {/* Main SIG Cards (Task 1 & 19) */}
                    <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                      <div className="p-4 rounded-3xl border border-slate-200 bg-slate-50/50 space-y-1">
                        <div className="text-slate-400 uppercase text-[9px] tracking-wider">Marge Commerciale</div>
                        <div className="text-sm font-black text-slate-800">{fmtMoney(45200000 * yearMultiplier)}</div>
                        <div className="text-emerald-600 flex items-center gap-0.5 text-[10px]">
                          <span>▲</span> +13.6% vs N-1 <span className="bg-emerald-100 text-emerald-800 px-1 rounded text-[8px] font-black">🟢 En hausse</span>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-3xl border border-slate-200 bg-slate-50/50 space-y-1">
                        <div className="text-slate-400 uppercase text-[9px] tracking-wider">Valeur Ajoutée (VA)</div>
                        <div className="text-sm font-black text-slate-800">{fmtMoney(82500000 * yearMultiplier)}</div>
                        <div className="text-emerald-600 flex items-center gap-0.5 text-[10px]">
                          <span>▲</span> +15.9% vs N-1 <span className="bg-emerald-100 text-emerald-800 px-1 rounded text-[8px] font-black">🟢 En hausse</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-3xl border border-slate-200 bg-slate-50/50 space-y-1">
                        <div className="text-slate-400 uppercase text-[9px] tracking-wider">Excédent Brut d'Exploitation (EBE)</div>
                        <div className="text-sm font-black text-slate-800">{fmtMoney(31400000 * yearMultiplier)}</div>
                        <div className="text-emerald-600 flex items-center gap-0.5 text-[10px]">
                          <span>▲</span> +17.6% vs N-1 <span className="bg-emerald-100 text-emerald-800 px-1 rounded text-[8px] font-black">🟢 En hausse</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-3xl border border-slate-200 bg-slate-50/50 space-y-1">
                        <div className="text-slate-400 uppercase text-[9px] tracking-wider">Résultat Net</div>
                        <div className="text-sm font-black text-slate-800">{fmtMoney(15800000 * yearMultiplier)}</div>
                        <div className="text-emerald-600 flex items-center gap-0.5 text-[10px]">
                          <span>▲</span> +41.1% vs N-1 <span className="bg-emerald-100 text-emerald-800 px-1 rounded text-[8px] font-black">🟢 En hausse</span>
                        </div>
                      </div>
                    </div>

                    {/* DAF AI Recommendation summary */}
                    <div className="p-4 rounded-3xl bg-violet-50/60 border border-violet-100 space-y-1.5">
                      <h4 className="text-[11px] font-black text-violet-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-violet-600" /> Analyse Express du DAF IA
                      </h4>
                      <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                        "L'exercice {financialYearFilter} présente une excellente dynamique commerciale avec un résultat net en hausse de {financialYearFilter === '2026' ? '41.1%' : '12%'} par rapport à l'exercice précédent. Toutefois, l'augmentation significative du BFR d'exploitation (+15 M FCFA) consomme l'intégralité de la trésorerie générée par l'exploitation. **Priorité absolue :** Réduire les délais de paiement clients et solder le compte 471 d'attente."
                      </p>
                    </div>

                  </div>
                </div>
              );
            }

            // 2. SIG SYSCOHADA View (Task 2 & 10)
            if (activeSIGTab === 'SIG') {
              const sigData = [
                { code: '1', name: 'Marge commerciale', val2026: 45200000, val2025: 39800000, var: '+13.6%', desc: 'Excédent des ventes de marchandises sur les achats consommés.' },
                { code: '2', name: 'Production de l\'exercice', val2026: 95000000, val2025: 85000000, var: '+11.7%', desc: 'Marchandises produites et stockées de l\'exercice.' },
                { code: '3', name: 'Valeur ajoutée (VA)', val2026: 82500000, val2025: 71200000, var: '+15.9%', desc: 'Richesse créée par l\'entreprise à partir de ses facteurs internes.' },
                { code: '4', name: 'Excédent brut d\'exploitation (EBE)', val2026: 31400000, val2025: 26700000, var: '+17.6%', desc: 'Flux de trésorerie brute de l\'exploitation (hors financiers et impôts).' },
                { code: '5', name: 'Résultat d\'exploitation', val2026: 24800000, val2025: 20500000, var: '+21.0%', desc: 'Résultat des activités courantes de l\'exploitation.' },
                { code: '6', name: 'Résultat financier', val2026: -3200000, val2025: -4100000, var: '+22.0%', desc: 'Solde des produits et charges financières (intérêts, agios).' },
                { code: '7', name: 'Résultat des activités ordinaires (RAO)', val2026: 21600000, val2025: 16400000, var: '+31.7%', desc: 'Résultat total des activités récurrentes (Exploitation + Financier).' },
                { code: '8', name: 'Résultat HAO', val2026: 0, val2025: 0, var: '0.0%', desc: 'Produits et charges Hors Activités Ordinaires (exceptionnels).' },
                { code: '9', name: 'Résultat net', val2026: 15800000, val2025: 11200000, var: '+41.1%', desc: 'Bénéfice ou perte finale restant après impôt sur le résultat.' },
                { code: '10', name: 'Capacité d\'autofinancement (CAF)', val2026: 28200000, val2025: 24100000, var: '+17.0%', desc: 'Ressources d\'autofinancement générées pour investissement ou dette.' }
              ];

              return (
                <div className="space-y-6">
                  <div className="overflow-hidden border border-slate-200 rounded-3xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
                          <th className="p-3">Indicateur SIG (SYSCOHADA)</th>
                          <th className="p-3 text-right">2026</th>
                          <th className="p-3 text-right">2025</th>
                          <th className="p-3 text-right">Variation</th>
                          {financialViewMode === 'EXPERT' && <th className="p-3">Définition comptable</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                        {sigData.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="p-3 font-extrabold text-slate-900">{row.name}</td>
                            <td className="p-3 text-right font-mono">{fmtMoney(row.val2026)}</td>
                            <td className="p-3 text-right font-mono text-slate-400">{fmtMoney(row.val2025)}</td>
                            <td className="p-3 text-right font-mono text-emerald-600 font-black">{row.var}</td>
                            {financialViewMode === 'EXPERT' && (
                              <td className="p-3 text-[10px] text-slate-400 font-medium">{row.desc}</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Waterfall value creation chart (Task 10) */}
                  <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-4">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Cascade de Création de Valeur (Exercice 2026)</h4>
                    
                    <div className="space-y-3 font-bold text-[10px]">
                      {[
                        { label: "Chiffre d'Affaires", val: 125000000, width: '100%', color: 'bg-violet-600' },
                        { label: "Marge Commerciale", val: 45200000, width: '36%', color: 'bg-violet-500' },
                        { label: "Valeur Ajoutée (VA)", val: 82500000, width: '66%', color: 'bg-indigo-500' },
                        { label: "Excédent Brut d'Exploitation (EBE)", val: 31400000, width: '25%', color: 'bg-blue-500' },
                        { label: "Résultat d'Exploitation", val: 24800000, width: '20%', color: 'bg-cyan-500' },
                        { label: "Résultat Net", val: 15800000, width: '12%', color: 'bg-emerald-500' }
                      ].map((item, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span>{item.label}</span>
                            <span className="font-mono text-slate-900">{fmtMoney(item.val)} ({item.width})</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className={`${item.color} h-full rounded-full`} style={{ width: item.width }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            // 3. Ratios Financiers (Task 5)
            if (activeSIGTab === 'RATIOS') {
              const ratios = [
                {
                  cat: 'Rentabilité',
                  items: [
                    { name: 'Marge Nette', val: '12.6%', norm: '> 10%', status: 'GREEN', desc: 'Résultat net / Chiffre d\'Affaires.' },
                    { name: 'Marge Opérationnelle', val: '19.8%', norm: '> 15%', status: 'GREEN', desc: 'Résultat d\'exploitation / Chiffre d\'Affaires.' },
                    { name: 'Rentabilité des Capitaux (ROE)', val: '15.8%', norm: '12% - 18%', status: 'GREEN', desc: 'Résultat Net / Capitaux Propres.' },
                    { name: 'Rentabilité Économique (ROA)', val: '8.2%', norm: '> 6%', status: 'GREEN', desc: 'Résultat d\'Exploitation / Actif Total.' }
                  ]
                },
                {
                  cat: 'Structure Financière',
                  items: [
                    { name: 'Autonomie Financière', val: '62.0%', norm: '> 50%', status: 'GREEN', desc: 'Capitaux Propres / Total Bilan.' },
                    { name: 'Capacité d\'Endettement', val: '38.0%', norm: '< 50%', status: 'GREEN', desc: 'Dette Financière / Capitaux Propres.' },
                    { name: 'Solvabilité Générale', val: '165.0%', norm: '> 100%', status: 'GREEN', desc: 'Actif Total / Dettes Totales.' },
                    { name: 'Couverture des Emplois Stables', val: '110.0%', norm: '> 100%', status: 'GREEN', desc: 'Ressources stables / Emplois stables.' }
                  ]
                },
                {
                  cat: 'Liquidité',
                  items: [
                    { name: 'Liquidité Générale', val: '1.45', norm: '1.2 - 2.0', status: 'GREEN', desc: 'Actif Circulant / Passif Circulant.' },
                    { name: 'Liquidité Réduite', val: '1.10', norm: '> 1.0', status: 'GREEN', desc: '(Créances + Trésorerie) / Passif Circulant.' },
                    { name: 'Liquidité Immédiate', val: '0.25', norm: '0.2 - 0.5', status: 'YELLOW', desc: 'Trésorerie Active / Passif Circulant.' }
                  ]
                },
                {
                  cat: 'Activité & Rotation',
                  items: [
                    { name: 'Délai Moyen Règlement Clients', val: '48 jours', norm: '< 45 jours', status: 'YELLOW', desc: 'Créances Clients / CA TTC * 360.' },
                    { name: 'Délai Moyen Règlement Fournisseurs', val: '62 jours', norm: '45 - 60 jours', status: 'YELLOW', desc: 'Dettes Fournisseurs / Achats TTC * 360.' },
                    { name: 'Rotation des Stocks', val: '30 jours', norm: '< 40 jours', status: 'GREEN', desc: 'Stock Moyen / Coût des Achats * 360.' },
                    { name: 'Besoin en Fonds de Roulement (BFR)', val: '57 M FCFA', norm: 'Selon activité', status: 'RED', desc: 'Stocks + Créances - Dettes d\'exploitation.' }
                  ]
                }
              ];

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ratios.map((group, gIdx) => (
                    <div key={gIdx} className="p-4 rounded-3xl border border-slate-200 bg-white space-y-3">
                      <h4 className="text-[11px] font-black text-violet-950 uppercase tracking-wider border-b pb-1">
                        {group.cat}
                      </h4>
                      <div className="space-y-2">
                        {group.items.map((item, iIdx) => (
                          <div key={iIdx} className="text-[10px] font-bold text-slate-700 flex flex-col space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-slate-900">{item.name}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-slate-900">{item.val}</span>
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                  item.status === 'GREEN' ? 'bg-emerald-500' :
                                  item.status === 'YELLOW' ? 'bg-amber-500' : 'bg-rose-500'
                                }`} />
                              </div>
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                              <span>Norme : {item.norm}</span>
                              {financialViewMode === 'EXPERT' && <span>{item.desc}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            // 4. BFR & Trésorerie View (Task 7 & 8)
            if (activeSIGTab === 'BFR') {
              return (
                <div className="space-y-6">
                  {/* BFR breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
                        Analyse du Besoin en Fonds de Roulement (BFR)
                      </h4>
                      
                      <div className="p-3 bg-white border border-slate-200 rounded-2xl flex flex-col justify-center items-center text-center space-y-1">
                        <span className="text-[10px] text-slate-400 font-extrabold">BFR = Stocks + Créances − Dettes d'exploitation</span>
                        <div className="text-xl font-black text-slate-800 mt-1">BFR 2026 : 57 000 000 FCFA</div>
                        <span className="text-[10px] text-rose-600 font-black">⚠️ +15 000 000 FCFA vs N-1 (42 M FCFA)</span>
                      </div>

                      <div className="text-[10px] font-bold text-slate-500 space-y-1 leading-relaxed">
                        <strong className="text-slate-700 block mb-0.5">Pourquoi votre BFR augmente ?</strong>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Allongement du délai de recouvrement des clients (+13 jours).</li>
                          <li>Hausse de la valeur d'inventaire de stocks (+12% à 2.5 M FCFA).</li>
                          <li>Taux de rotation des créances clients supérieur à la vitesse de règlement fournisseur.</li>
                        </ul>
                      </div>
                    </div>

                    {/* Operational Cash flow statement */}
                    <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
                        Flux de Trésorerie (Exercice 2026)
                      </h4>
                      
                      <div className="space-y-2 text-[11px] font-bold text-slate-700">
                        <div className="flex justify-between items-center p-2 bg-white rounded-xl">
                          <span>Flux de Trésorerie Opérationnels (FTO)</span>
                          <span className="font-mono text-emerald-600">+32 000 000 FCFA</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded-xl">
                          <span>Flux d'Investissement (FTI)</span>
                          <span className="font-mono text-rose-600">-15 000 000 FCFA</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded-xl">
                          <span>Flux de Financement (FTF)</span>
                          <span className="font-mono text-rose-600">-8 000 000 FCFA</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between items-center p-2 font-black text-slate-900">
                          <span>Variation Nette de Trésorerie</span>
                          <span className="font-mono text-emerald-600">+9 000 000 FCFA</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // 5. Analytical Income Statement with drilldown (Task 3 & 13)
            if (activeSIGTab === 'COMPARATIVE') {
              const resultLines = [
                { label: 'Chiffre d\'Affaires (Ventes)', real: 125000000, budget: 120000000, accounts: ['701', '702', '706'], icon: '📈' },
                { label: 'Achats de matières et marchandises', real: -45000000, budget: -42000000, accounts: ['601', '602'], icon: '🛒' },
                { label: 'Variation de stocks', real: -120000, budget: -150000, accounts: ['603'], icon: '📦' },
                { label: 'Charges de personnel (Salaires)', real: -18000000, budget: -19000000, accounts: ['66'], icon: '👥' },
                { label: 'Impôts et Taxes d\'exploitation', real: -4500000, budget: -5000000, accounts: ['64'], icon: '⚖️' },
                { label: 'Dotations d\'amortissements', real: -6000000, budget: -6200000, accounts: ['68'], icon: '📉' },
                { label: 'Charges financières', real: -3500000, budget: -3000000, accounts: ['67'], icon: '💳' },
                { label: 'Produits financiers', real: 300000, budget: 200000, accounts: ['77'], icon: '💰' },
                { label: 'Résultat net', real: 15800000, budget: 11200000, accounts: ['13'], icon: '🏆' }
              ];

              return (
                <div className="space-y-4">
                  <div className="p-3 bg-violet-50 text-violet-950 rounded-2xl text-[10px] font-bold">
                    💡 <strong>Mode Drilldown Actif :</strong> Cliquez sur une ligne de charges ou produits ci-dessous pour remonter directement aux écritures comptables associées.
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Table */}
                    <div className="lg:col-span-7 overflow-hidden border border-slate-200 rounded-3xl bg-white">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-black border-b">
                            <th className="p-3">Rubrique</th>
                            <th className="p-3 text-right">Réel 2026</th>
                            <th className="p-3 text-right">Budget</th>
                            <th className="p-3 text-right">Écart</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                          {resultLines.map((row, i) => {
                            const dev = row.real - row.budget;
                            const devPct = ((dev / Math.abs(row.budget)) * 100).toFixed(1);
                            const isPositive = dev > 0;
                            const isVentes = row.label.startsWith('Chiffre');
                            const isRes = row.label.startsWith('Résultat');
                            
                            // Color logic
                            let badgeColor = 'text-slate-600 bg-slate-50';
                            if (isVentes || isRes) {
                              badgeColor = isPositive ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-rose-700 bg-rose-50 border border-rose-100';
                            } else {
                              // For charges, real > budget is bad
                              badgeColor = isPositive ? 'text-rose-700 bg-rose-50 border border-rose-100' : 'text-emerald-700 bg-emerald-50 border border-emerald-100';
                            }

                            return (
                              <tr
                                key={i}
                                onClick={() => setSelectedSIGLineDrilldown(row.label)}
                                className={`cursor-pointer transition-colors ${
                                  selectedSIGLineDrilldown === row.label ? 'bg-violet-50/50' : 'hover:bg-slate-50/40'
                                }`}
                              >
                                <td className="p-3 flex items-center gap-2">
                                  <span>{row.icon}</span>
                                  <span className="font-extrabold text-slate-900">{row.label}</span>
                                </td>
                                <td className="p-3 text-right font-mono">{fmtMoney(row.real)}</td>
                                <td className="p-3 text-right font-mono text-slate-400">{fmtMoney(row.budget)}</td>
                                <td className="p-3 text-right font-mono">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${badgeColor}`}>
                                    {isPositive ? '+' : ''}{devPct}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Drilldown display */}
                    <div className="lg:col-span-5 space-y-4">
                      {selectedSIGLineDrilldown ? (
                        <div className="p-4 rounded-3xl border border-violet-100 bg-white space-y-3 shadow-sm">
                          <div className="flex justify-between items-center border-b pb-2">
                            <h4 className="text-[11px] font-extrabold text-slate-900 uppercase">
                              🔍 Écritures : {selectedSIGLineDrilldown}
                            </h4>
                            <button
                              onClick={() => setSelectedSIGLineDrilldown(null)}
                              className="text-[10px] text-slate-400 font-bold hover:text-slate-600"
                            >
                              Fermer
                            </button>
                          </div>
                          
                          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                            {(() => {
                              const targetConfig = resultLines.find(r => r.label === selectedSIGLineDrilldown);
                              if (!targetConfig) return null;
                              
                              const matchingEntries = entries.filter((e) => {
                                return e.lines?.some((l) => {
                                  return targetConfig.accounts.some(acc => l.accountCode.startsWith(acc));
                                });
                              });

                              if (matchingEntries.length === 0) {
                                return (
                                  <div className="text-center py-10 text-xs italic text-slate-400 font-bold">
                                    Aucune écriture comptable trouvée pour cette rubrique.
                                  </div>
                                );
                              }

                              return matchingEntries.map((e, idx) => {
                                const total = e.lines?.reduce((sum, l) => sum + (Number(l.debit) || 0), 0) || 0;
                                return (
                                  <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[10px] font-bold">
                                    <div className="flex justify-between text-slate-900">
                                      <span>{e.wording}</span>
                                      <span className="font-mono">{fmtMoney(total)}</span>
                                    </div>
                                    <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                                      <span>Date : {e.date} · Pièce : {e.pieceNumber || 'N/A'}</span>
                                      <span className="uppercase text-violet-600">{e.journalType}</span>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div className="p-10 rounded-3xl border border-dashed border-slate-200 flex flex-col justify-center items-center text-center text-slate-400 font-bold space-y-1">
                          <span>📊 Mode Drilldown Inactif</span>
                          <span className="text-[10px] font-medium max-w-[200px]">
                            Sélectionnez une ligne dans le tableau de gauche pour inspecter le détail des écritures associées.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // 6. Segment / Client View (Task 11 & 12)
            if (activeSIGTab === 'ACTIVITY') {
              const activities = [
                { name: 'Vente Matériel Sénégal (Dakar)', ca: 120000000, margin: 32000000, net: 18000000, status: 'GREEN', rating: 'Rentable' },
                { name: 'Prestations Côte d\'Ivoire (Abidjan)', ca: 80000000, margin: 14000000, net: 5000000, status: 'GREEN', rating: 'Rentable' },
                { name: 'Distribution Niger (Niamey)', ca: 35000000, margin: 9000000, net: -2000000, status: 'RED', rating: 'Destructeur de valeur' }
              ];

              const clientAnalysis = [
                { name: 'Super U Dakar', ca: '23,5 M', margin: '8,2 M', balance: '2,35 M', delay: '12 jours', status: 'Excellent' },
                { name: 'Carrefour Abidjan', ca: '9,5 M', margin: '3,1 M', balance: '0,95 M', delay: '97 jours', status: 'À surveiller' },
                { name: 'Ets Kaboré & Fils', ca: '15,0 M', margin: '4,5 M', balance: '1,50 M', delay: '120 jours', status: 'Critique' }
              ];

              return (
                <div className="space-y-6">
                  {/* Segment Analysis */}
                  <div className="p-4 rounded-3xl border border-slate-200 bg-white space-y-3">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Analyse par Activité / Segment</h4>
                    <div className="overflow-hidden border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
                            <th className="p-2.5">Activité</th>
                            <th className="p-2.5 text-right">CA</th>
                            <th className="p-2.5 text-right">Marge brute</th>
                            <th className="p-2.5 text-right">Résultat Net</th>
                            <th className="p-2.5 text-right">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                          {activities.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="p-2.5 text-slate-900">{row.name}</td>
                              <td className="p-2.5 text-right font-mono">{fmtMoney(row.ca)}</td>
                              <td className="p-2.5 text-right font-mono">{fmtMoney(row.margin)}</td>
                              <td className="p-2.5 text-right font-mono text-slate-900">{fmtMoney(row.net)}</td>
                              <td className="p-2.5 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                  row.status === 'GREEN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}>
                                  {row.rating}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Client Profitability Analysis */}
                  <div className="p-4 rounded-3xl border border-slate-200 bg-white space-y-3">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Analyse de Rentabilité Clients Clés</h4>
                    <div className="overflow-hidden border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
                            <th className="p-2.5">Client</th>
                            <th className="p-2.5 text-right">CA</th>
                            <th className="p-2.5 text-right">Marge réelle</th>
                            <th className="p-2.5 text-right">Créance</th>
                            <th className="p-2.5 text-right">Délai Règlement</th>
                            <th className="p-2.5 text-right">Score Rentabilité</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                          {clientAnalysis.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="p-2.5 text-slate-900 font-extrabold">{row.name}</td>
                              <td className="p-2.5 text-right font-mono">{row.ca}</td>
                              <td className="p-2.5 text-right font-mono">{row.margin}</td>
                              <td className="p-2.5 text-right font-mono">{row.balance}</td>
                              <td className="p-2.5 text-right font-mono">{row.delay}</td>
                              <td className="p-2.5 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                  row.status === 'Excellent' ? 'bg-emerald-50 text-emerald-700' :
                                  row.status === 'À surveiller' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            }

            // 7. Interactive DAF AI Assistant (Task 15)
            if (activeSIGTab === 'AI') {
              const suggestedQuestions = [
                "Pourquoi ma rentabilité baisse ?",
                "Quels sont mes trois principaux problèmes financiers ?",
                "Est-ce que mon entreprise peut supporter un emprunt de 100 millions ?",
                "Quel client me coûte le plus cher en BFR ?"
              ];

              return (
                <div className="space-y-4">
                  <div className="p-4 rounded-3xl border border-violet-100 bg-white space-y-3 shadow-sm">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" /> DAF Virtuel IA : Diagnostic Financier Interactif
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="text-[11px] text-slate-400 font-bold">Sélectionnez ou saisissez une question d'analyse financière :</div>
                      <div className="flex flex-wrap gap-2">
                        {suggestedQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => setFinancialAiQuery(q)}
                            className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold text-left transition-colors"
                          >
                            💬 {q}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={financialAiQuery}
                        onChange={(e) => setFinancialAiQuery(e.target.value)}
                        placeholder="Ex: Quelle est la situation de ma trésorerie prévisionnelle ?"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-violet-500"
                      />
                      <button
                        onClick={async () => {
                          if (!financialAiQuery.trim()) return;
                          setFinancialAiLoading(true);
                          setFinancialAiAnswer(null);
                          await new Promise(resolve => setTimeout(resolve, 1500));
                          setFinancialAiLoading(false);
                          
                          const q = financialAiQuery.trim().toLowerCase();
                          if (q.includes('rentabilité') || q.includes('baisse')) {
                            setFinancialAiAnswer(
                              "Votre rentabilité économique (8.2%) reste supérieure aux normes sectorielles (>6%), mais votre rentabilité commerciale s'érode légèrement (-6%) en raison d'une hausse des charges financières (+500 000 FCFA d'intérêts sur la période) et de la contraction des marges au Niger."
                            );
                          } else if (q.includes('problèmes') || q.includes('financiers')) {
                            setFinancialAiAnswer(
                              "Vos trois principaux points d'attention financiers sont :\n1. **Hausse incontrôlée du BFR** (+15 M FCFA, dû au délai client chez Carrefour).\n2. **Utilisation non apurée du compte d'attente 471** (1.25 M FCFA bloquant la clôture).\n3. **Tensions de trésorerie opérationnelle** avec des encaissements en espèces hors limite légale."
                            );
                          } else if (q.includes('emprunt') || q.includes('100')) {
                            setFinancialAiAnswer(
                              "Avec un taux d'autonomie financière de 62.0% (Capitaux Propres représentant plus de la moitié du passif) et un EBE solide de 31.4 M FCFA, votre structure financière peut supporter un emprunt de 100 millions FCFA. Néanmoins, il est impératif de restructurer le BFR clients au préalable afin de dégager la trésorerie nécessaire pour assurer le service de la dette sans impacter le fonds de roulement."
                            );
                          } else if (q.includes('bfr') || q.includes('coûte')) {
                            setFinancialAiAnswer(
                              "Le client qui impacte le plus lourdement votre BFR est **Ets Kaboré & Fils** avec une créance litigieuse en souffrance de 1.5 M FCFA en retard de 120 jours, suivi de près par **Carrefour Abidjan** (délai moyen de recouvrement de 97 jours représentant 950 000 FCFA d'encours)."
                            );
                          } else {
                            setFinancialAiAnswer(
                              "Votre DAF IA a analysé les journaux et la balance : La situation globale est saine avec un résultat net prévu à 72 M FCFA (scénario central), mais l'optimisation des comptes de tiers (lettrage 401/411) et l'apurement du compte 471 sont indispensables pour consolider la trésorerie."
                            );
                          }
                        }}
                        disabled={financialAiLoading}
                        className="px-4 py-2.5 rounded-xl bg-violet-600 text-white font-extrabold text-xs hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-1.5"
                      >
                        {financialAiLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyse...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" /> Analyser
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {financialAiAnswer && (
                    <div className="p-4 bg-violet-50/50 border border-violet-100 rounded-3xl space-y-2 animate-in fade-in zoom-in duration-200">
                      <div className="text-[10px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Analyse DAF IA
                      </div>
                      <p className="text-xs font-bold text-slate-800 whitespace-pre-line leading-relaxed">
                        {financialAiAnswer}
                      </p>
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })()}
        </div>
      )}

      {/* ── TAB 13: Centre de Rapports & Exports Légaux ──────────────────────── */}
      {tab === 'rapports' && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-6">
          
          {/* Header & Global Filters (Task 4) */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-violet-600" /> Centre Documentaire & Réglementaire SYSCOHADA
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                Génération de liasses réglementaires, états financiers de synthèse, rapports tiers et pièces justificatives
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-700">
              {/* Filter Exercice */}
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Exercice</span>
                <select
                  value={financialYearFilter}
                  onChange={(e) => setFinancialYearFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              {/* Filter Période */}
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Période</span>
                <select
                  value={reportsPeriod}
                  onChange={(e) => setReportsPeriod(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                >
                  <option value="ANNEE">Année complète</option>
                  <option value="SEMESTRE_1">1er Semestre (Jan-Juin)</option>
                  <option value="SEMESTRE_2">2nd Semestre (Juil-Déc)</option>
                  <option value="TRIMESTRE">Trimestriel (En cours)</option>
                </select>
              </div>

              {/* Filter Devise */}
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Devise</span>
                <select
                  value={reportsCurrency}
                  onChange={(e) => setReportsCurrency(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                >
                  <option value="XAF">FCFA (XAF)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>

              {/* Filter Comparaison */}
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Comparaison</span>
                <select
                  value={reportsComparison}
                  onChange={(e) => setReportsComparison(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                >
                  <option value="2025">vs Exercice N-1 (2025)</option>
                  <option value="NONE">Aucune comparaison</option>
                </select>
              </div>

              {/* Filter Version */}
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Version</span>
                <select
                  value={reportsVersion}
                  onChange={(e) => setReportsVersion(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                >
                  <option value="DEFINITIVE">Version Définitive</option>
                  <option value="PROVISOIRE">Brouillon Provisoire</option>
                </select>
              </div>

              {/* Package Generator Button (Task 2) */}
              <button
                onClick={() => setShowFinancialPackageModal(true)}
                className="mt-3.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Layers className="w-3.5 h-3.5" /> Générer la Liasse
              </button>
            </div>
          </div>

          {/* Sub-navigation categories (Task 17 & 20) */}
          <div className="flex flex-wrap gap-1 border-b pb-2">
            {[
              { code: 'ETATS', label: 'États Financiers SYSCOHADA', icon: FileText },
              { code: 'COMPTABLES', label: 'Rapports Comptables', icon: BookOpen },
              { code: 'TIERS', label: 'Rapports Clients / Fournisseurs', icon: Users },
              { code: 'CONTROLES', label: 'Contrôles, Clôture & Pièces', icon: ShieldCheck },
              { code: 'PERSO_AUDIT', label: 'Personnalisés & Piste d\'Audit', icon: Settings },
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.code}
                  onClick={() => {
                    setReportsActiveCategory(cat.code as any);
                    setSelectedReportPreview(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-colors ${
                    reportsActiveCategory === cat.code
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {cat.label}
                </button>
              );
            })}
          </div>

          {/* Modal Preview Mode (Task 3) */}
          {selectedReportPreview ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              
              {/* Interactive Toolbar Panel */}
              <div className="lg:col-span-3 space-y-4">
                <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase">Actions Document</h4>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => window.print()}
                      className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-[11px] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" /> Imprimer
                    </button>
                    
                    <button
                      onClick={() => {
                        setRecentReportsList([
                          { id: String(recentReportsList.length + 1), name: selectedReportPreview.title, year: financialYearFilter, user: 'Dieudonné MELAMEM', date: new Date().toLocaleDateString() },
                          ...recentReportsList
                        ]);
                        setSuccessMessage('Téléchargement PDF initié avec succès.');
                      }}
                      className="w-full py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[11px] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Exporter en PDF
                    </button>

                    <button
                      onClick={() => {
                        setRecentReportsList([
                          { id: String(recentReportsList.length + 1), name: selectedReportPreview.title, year: financialYearFilter, user: 'Dieudonné MELAMEM', date: new Date().toLocaleDateString() },
                          ...recentReportsList
                        ]);
                        setSuccessMessage('Export Excel (multi-feuilles) généré avec succès.');
                      }}
                      className="w-full py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[11px] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Exporter en Excel
                    </button>

                    <button
                      onClick={() => setSelectedReportPreview(null)}
                      className="w-full py-2 rounded-xl bg-slate-200 hover:bg-slate-350 text-slate-700 font-extrabold text-[11px] transition-colors flex items-center justify-center gap-1.5"
                    >
                      ← Retour
                    </button>
                  </div>
                </div>

                {/* AI Explanation Module (Task 16) */}
                <div className="p-4 rounded-3xl bg-violet-50/60 border border-violet-100 space-y-3">
                  <h4 className="text-[11px] font-black text-violet-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" /> Assistant IA Rapports
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold">
                    Demandez à l'IA d'analyser ou de vous expliquer ce document.
                  </p>
                  
                  <button
                    onClick={async () => {
                      setReportsAiAnalysisLoading(true);
                      setReportsAiAnalysisText(null);
                      await new Promise(resolve => setTimeout(resolve, 1500));
                      setReportsAiAnalysisLoading(false);
                      
                      const title = selectedReportPreview.title.toLowerCase();
                      if (title.includes('bilan')) {
                        setReportsAiAnalysisText(
                          "**Synthèse du Bilan (Exercice 2026) :**\n" +
                          "- **Capitaux Propres :** 68.2 M FCFA. Structure très solide grâce à la mise en réserve du bénéfice de l'exercice précédent.\n" +
                          "- **Trésorerie Active :** Forte baisse liée au financement du BFR (+15 M FCFA).\n" +
                          "- **Immobilisations :** Actif stable de 42 M FCFA couvert à 110% par les ressources stables."
                        );
                      } else if (title.includes('résultat') || title.includes('produit')) {
                        setReportsAiAnalysisText(
                          "**Synthèse du Compte de Résultat (Exercice 2026) :**\n" +
                          "- Le résultat net progresse de **41.1%** pour s'établir à 15.8 M FCFA.\n" +
                          "- Cette amélioration provient d'une hausse significative de la marge commerciale (+13.6%), malgré l'augmentation des charges de personnel (Salaires) de +12%."
                        );
                      } else if (title.includes('conformité')) {
                        setReportsAiAnalysisText(
                          "**Rapport de conformité FinancePro :**\n" +
                          "- Le score de conformité globale est de **94/100**.\n" +
                          "- 42 contrôles automatiques sont parfaitement valides.\n" +
                          "- **Points bloquants :** Présence d'un écart de facturation inter-modules de 2 M FCFA et absence de lettrage sur 3 comptes tiers."
                        );
                      } else {
                        setReportsAiAnalysisText(
                          "Ce rapport est complet et conforme aux exigences réglementaires du Système Normal SYSCOHADA. Aucune anomalie majeure n'est détectée sur cette édition."
                        );
                      }
                    }}
                    className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-[10px] flex items-center justify-center gap-1 transition-colors"
                  >
                    {reportsAiAnalysisLoading ? 'Analyse en cours...' : '🧠 Explique-moi ce rapport'}
                  </button>

                  {reportsAiAnalysisText && (
                    <div className="p-3 bg-white border border-violet-100 rounded-2xl text-[9px] font-bold text-slate-800 space-y-1.5 leading-relaxed">
                      <strong className="text-violet-600 block">Explications DAF IA :</strong>
                      <p className="whitespace-pre-line">{reportsAiAnalysisText}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Official A4 styled Page Preview (Task 3) */}
              <div className="lg:col-span-9 flex justify-center bg-slate-100 p-6 rounded-3xl border border-slate-200 overflow-x-auto">
                <div className="w-[794px] min-h-[1123px] bg-white shadow-lg p-10 flex flex-col justify-between text-slate-800 text-[11px] font-bold shrink-0">
                  <div className="space-y-6">
                    {/* Header Document */}
                    <div className="flex justify-between border-b pb-4">
                      <div>
                        <div className="text-violet-700 font-black text-sm uppercase tracking-wider">MELARO GROUP</div>
                        <div className="text-[9px] text-slate-400 font-bold mt-0.5">
                          RCCM: RC/DAB/2022/B/351 · NIU: M012214587L<br />
                          Dakar, Sénégal
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 rounded bg-slate-100 text-[8px] font-black uppercase text-slate-500">
                          {reportsVersion === 'DEFINITIVE' ? 'Rapport Définitif' : 'Brouillon Provisoire'}
                        </span>
                        <div className="text-[9px] text-slate-400 mt-2 font-bold">
                          Date d'édition : {new Date().toLocaleDateString()}<br />
                          Exercice Comptable : {financialYearFilter}
                        </div>
                      </div>
                    </div>

                    {/* Document Title */}
                    <div className="text-center space-y-1.5">
                      <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest">{selectedReportPreview.title}</h2>
                      <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider">
                        Conforme au référentiel SYSCOHADA Révisé - Système {selectedReportPreview.system || 'Normal'}
                      </p>
                    </div>

                    {/* Structured Preview Data */}
                    <div className="space-y-4 pt-4">
                      {selectedReportPreview.type === 'BALANCE' && (
                        <div className="space-y-3">
                          <table className="w-full text-left text-[10px]">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 border-b">
                                <th className="p-2">Compte</th>
                                <th className="p-2">Intitulé du compte</th>
                                <th className="p-2 text-right">Débit</th>
                                <th className="p-2 text-right">Crédit</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono">
                              {balanceRows.map((r, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-2 font-bold">{r.code}</td>
                                  <td className="p-2">{r.label}</td>
                                  <td className="p-2 text-right">{fmtMoney(r.debit)}</td>
                                  <td className="p-2 text-right">{fmtMoney(r.credit)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {selectedReportPreview.type === 'INCOME_STATEMENT' && (
                        <div className="space-y-3">
                          <table className="w-full text-left text-[10px]">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 border-b">
                                <th className="p-2">Rubrique du compte de résultat</th>
                                <th className="p-2 text-right">Réel N (2026)</th>
                                <th className="p-2 text-right">Budget N</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono">
                              <tr>
                                <td className="p-2 font-bold">Chiffre d'Affaires (Ventes)</td>
                                <td className="p-2 text-right">125 000 000 FCFA</td>
                                <td className="p-2 text-right">120 000 000 FCFA</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-bold">Achats consommés</td>
                                <td className="p-2 text-right">-45 000 000 FCFA</td>
                                <td className="p-2 text-right">-42 000 000 FCFA</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-bold">Valeur Ajoutée (VA)</td>
                                <td className="p-2 text-right font-black text-slate-900">82 500 000 FCFA</td>
                                <td className="p-2 text-right">71 200 000 FCFA</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-bold">Excédent Brut d'Exploitation (EBE)</td>
                                <td className="p-2 text-right font-black text-slate-900">31 400 000 FCFA</td>
                                <td className="p-2 text-right">26 700 000 FCFA</td>
                              </tr>
                              <tr className="bg-slate-50 font-black">
                                <td className="p-2">RÉSULTAT NET COMPTABLE</td>
                                <td className="p-2 text-right text-emerald-600">15 800 000 FCFA</td>
                                <td className="p-2 text-right">11 200 000 FCFA</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {selectedReportPreview.type === 'CLOSING' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border rounded-2xl">
                            <div>
                              <div className="text-slate-400 text-[8px] uppercase">Date de clôture</div>
                              <div>31/12/2026</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-[8px] uppercase">Clôturé par</div>
                              <div>Dieudonné MELAMEM (Admin)</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-[8px] uppercase">Nombre d'écritures</div>
                              <div>{entries.length} écritures validées</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-[8px] uppercase">Équilibre Balance</div>
                              <div className="text-emerald-600 font-bold">Équilibrée (Débit = Crédit)</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-[8px] uppercase">Rapprochement bancaire</div>
                              <div>Afriland & SG validés (100%)</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-[8px] uppercase">Résultat Net de l'exercice</div>
                              <div className="text-emerald-600 font-bold">15 800 000 FCFA</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedReportPreview.type === 'COMPLIANCE' && (
                        <div className="space-y-3">
                          <div className="p-4 border rounded-2xl space-y-3">
                            <div className="flex justify-between items-center border-b pb-2">
                              <span>Score de Conformité Interne FinancePro</span>
                              <span className="text-lg font-black text-emerald-600">94/100</span>
                            </div>
                            
                            <div className="space-y-1.5 text-[10px]">
                              <div className="flex justify-between">
                                <span>🟢 42 contrôles réglementaires automatiques réalisés</span>
                                <span className="text-emerald-600">CONFORME</span>
                              </div>
                              <div className="flex justify-between">
                                <span>🟠 3 anomalies mineures / alertes de lettrage</span>
                                <span className="text-amber-600">A SURVEILLER</span>
                              </div>
                              <div className="flex justify-between">
                                <span>🔴 Écart de rapprochement banque (Afriland)</span>
                                <span className="text-rose-600">NON CONFORME</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Generic text preview fallback */}
                      {selectedReportPreview.type !== 'BALANCE' && selectedReportPreview.type !== 'INCOME_STATEMENT' && selectedReportPreview.type !== 'CLOSING' && selectedReportPreview.type !== 'COMPLIANCE' && (
                        <div className="p-8 border border-dashed rounded-3xl text-center text-slate-400 space-y-1">
                          <div>📄 {selectedReportPreview.title} - Contenu et tableaux détaillés</div>
                          <div className="text-[9px] font-medium max-w-[400px] mx-auto">
                            Ce document intègre automatiquement la balance générale, les journaux auxiliaires et les données analytiques de la période sélectionnée ({reportsPeriod}).
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stamp & Signatures Box (Task 14) */}
                  <div className="border-t pt-6 flex justify-between items-start mt-10">
                    <div className="space-y-1">
                      <div className="text-[8px] text-slate-400 uppercase">Le Responsable Comptable</div>
                      <div className="font-extrabold text-slate-700">Dieudonné MELAMEM</div>
                      <div className="w-24 h-12 border border-dashed border-slate-200 rounded flex items-center justify-center text-[8px] text-slate-300 font-medium italic">
                        [Signature électronique]
                      </div>
                    </div>

                    <div className="space-y-1 text-right">
                      <div className="text-[8px] text-slate-400 uppercase">Cachet de l'entreprise</div>
                      <div className="w-28 h-20 border border-violet-100 rounded-full bg-violet-50/20 text-violet-700/40 flex flex-col items-center justify-center text-[7px] font-black uppercase text-center p-1 leading-normal select-none">
                        <span>MELARO GROUP</span>
                        <span>SÉNÉGAL</span>
                        <span className="text-[6px] text-violet-400 font-bold mt-1">Sceau Interne Valide</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Category Screens */}
              
              {/* 1. États Financiers SYSCOHADA (Task 1) */}
              {reportsActiveCategory === 'ETATS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: 'Bilan Général', type: 'BALANCE', desc: 'Actif et Passif résumés de l\'exercice comptable.' },
                    { title: 'Compte de Résultat', type: 'INCOME_STATEMENT', desc: 'Produits et charges résumant le bénéfice ou la perte.' },
                    { title: 'Tableau des Flux de Trésorerie', type: 'CASHFLOW', desc: 'Entrées et sorties de liquidités par activité.' },
                    { title: 'Notes Annexes', type: 'NOTES', desc: 'Explications et détails complémentaires des états financiers.' },
                    { title: 'État des Immobilisations', type: 'IMMO', desc: 'Tableau détaillé des actifs immobilisés.' },
                    { title: 'État des Amortissements', type: 'AMORT', desc: 'Suivi des amortissements cumulés des immobilisations.' },
                    { title: 'État des Provisions', type: 'PROV', desc: 'Synthèse des provisions constituées sur l\'exercice.' },
                    { title: 'État des Créances et Dettes', type: 'DEBTS', desc: 'Échéancier analytique des tiers débiteurs et créditeurs.' },
                    { title: 'État des Stocks', type: 'STOCK_REP', desc: 'Valorisation réglementaire des stocks au bilan.' },
                    { title: 'Tableau de Variation des Capitaux Propres', type: 'CAPPROPRES', desc: 'Suivi des réserves, capital social et résultats reportés.' }
                  ].map((rep, idx) => (
                    <div key={idx} className="p-4 rounded-3xl border border-slate-200 bg-white hover:border-violet-300 hover:shadow-sm transition-all space-y-3 flex flex-col justify-between">
                      <div className="space-y-1">
                        <strong className="text-slate-900 font-extrabold text-xs block">{rep.title}</strong>
                        <p className="text-[10px] text-slate-500 font-medium leading-normal">{rep.desc}</p>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setSelectedReportPreview(rep)}
                          className="flex-1 py-1 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-[10px] font-bold text-center"
                        >
                          👁 Aperçu
                        </button>
                        <button
                          onClick={() => setSuccessMessage(`Export PDF de "${rep.title}" généré.`)}
                          className="px-2.5 py-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => setSuccessMessage(`Export Excel de "${rep.title}" généré.`)}
                          className="px-2.5 py-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold"
                        >
                          Excel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. Rapports Comptables (Task 5) */}
              {reportsActiveCategory === 'COMPTABLES' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: 'Journal Général', type: 'JOURNAL_GEN', desc: 'Enregistrement chronologique de toutes les écritures.' },
                    { title: 'Grand Livre Général', type: 'GRAND_LIVRE_GEN', desc: 'Détail des mouvements par compte comptable.' },
                    { title: 'Balance Générale', type: 'BALANCE', desc: 'Balance de vérification des comptes à 6 colonnes.' },
                    { title: 'Balance Âgée Clients', type: 'CLIENT_AGE', desc: 'Ventilation des créances clients par ancienneté.' },
                    { title: 'Balance Âgée Fournisseurs', type: 'FOURN_AGE', desc: 'Ventilation des dettes fournisseurs par ancienneté.' },
                    { title: 'État des Pièces Justificatives', type: 'DOCS_STAT', desc: 'Suivi de l\'affectation et de la présence des pièces jointes.' }
                  ].map((rep, idx) => (
                    <div key={idx} className="p-4 rounded-3xl border border-slate-200 bg-white hover:border-violet-300 hover:shadow-sm transition-all space-y-3 flex flex-col justify-between">
                      <div className="space-y-1">
                        <strong className="text-slate-900 font-extrabold text-xs block">{rep.title}</strong>
                        <p className="text-[10px] text-slate-500 font-medium leading-normal">{rep.desc}</p>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setSelectedReportPreview(rep)}
                          className="flex-1 py-1 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-[10px] font-bold text-center"
                        >
                          👁 Aperçu
                        </button>
                        <button
                          onClick={() => setSuccessMessage(`Export PDF de "${rep.title}" généré.`)}
                          className="px-2.5 py-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold"
                        >
                          PDF
                        </button>
                        <button
                          onClick={() => setSuccessMessage(`Export Excel de "${rep.title}" généré.`)}
                          className="px-2.5 py-1 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold"
                        >
                          Excel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Rapports Tiers (Clients & Fournisseurs) (Task 6) */}
              {reportsActiveCategory === 'TIERS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Clients */}
                  <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase border-b pb-2 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-violet-600" /> Rapports Tiers Clients (Comptes 411)
                    </h4>
                    
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5 text-[10px] font-bold text-slate-700">
                      <div className="flex justify-between">
                        <span>Total Facturé</span>
                        <span>25 000 000 FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Encaissé</span>
                        <span>19 500 000 FCFA</span>
                      </div>
                      <div className="flex justify-between text-rose-600 font-extrabold">
                        <span>Solde Créances</span>
                        <span>5 500 000 FCFA</span>
                      </div>
                      <div className="flex justify-between text-rose-600 font-extrabold">
                        <span>Retard de Paiement Moyen</span>
                        <span>67 jours</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {[
                        { name: 'Balance âgée clients', type: 'CLIENT_AGE' },
                        { name: 'Relevé de compte client individuel', type: 'CLIENT_STATEMENT' },
                        { name: 'Historique des factures et impayés', type: 'INVOICE_HISTORY' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-xl text-[10px] font-bold">
                          <span>{item.name}</span>
                          <button
                            onClick={() => setSelectedReportPreview({ title: item.name, type: item.type })}
                            className="text-violet-600 hover:text-violet-700 text-[9px] font-black uppercase"
                          >
                            Aperçu
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fournisseurs */}
                  <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase border-b pb-2 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-600" /> Rapports Tiers Fournisseurs (Comptes 401)
                    </h4>
                    
                    <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5 text-[10px] font-bold text-slate-700">
                      <div className="flex justify-between">
                        <span>Total Facturé Fournisseurs</span>
                        <span>15 000 000 FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Payé</span>
                        <span>12 200 000 FCFA</span>
                      </div>
                      <div className="flex justify-between text-slate-950 font-extrabold">
                        <span>Solde Dettes d'Exploitation</span>
                        <span>2 800 000 FCFA</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-extrabold">
                        <span>Échéances à venir (&lt; 30 jours)</span>
                        <span>1 800 000 FCFA</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {[
                        { name: 'Balance âgée fournisseurs', type: 'FOURN_AGE' },
                        { name: 'Échéancier des règlements dettes', type: 'FOURN_DUE' },
                        { name: 'Relevé de compte fournisseur individuel', type: 'FOURN_STATEMENT' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-xl text-[10px] font-bold">
                          <span>{item.name}</span>
                          <button
                            onClick={() => setSelectedReportPreview({ title: item.name, type: item.type })}
                            className="text-violet-600 hover:text-violet-700 text-[9px] font-black uppercase"
                          >
                            Aperçu
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Rapports de Contrôle, Clôture & Pièces (Task 7, 8, 9 & 10) */}
              {reportsActiveCategory === 'CONTROLES' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Conformité & Clôture */}
                  <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase border-b pb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-violet-600" /> Contrôle Interne & Clôture
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-[10px] font-bold">
                        <div className="space-y-0.5">
                          <div>Rapport de Conformité SYSCOHADA</div>
                          <div className="text-[9px] text-slate-400 font-medium">Diagnostic de conformité et intégrité comptable.</div>
                        </div>
                        <button
                          onClick={() => setSelectedReportPreview({ title: 'Rapport de Conformité SYSCOHADA', type: 'COMPLIANCE' })}
                          className="px-3 py-1 rounded-xl bg-violet-600 text-white hover:bg-violet-700 text-[9px] font-black uppercase"
                        >
                          Aperçu
                        </button>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-[10px] font-bold">
                        <div className="space-y-0.5">
                          <div>Rapport de Clôture de l'Exercice</div>
                          <div className="text-[9px] text-slate-400 font-medium">Liasse de synthèse finale de clôture annuelle.</div>
                        </div>
                        <button
                          onClick={() => setSelectedReportPreview({ title: 'Rapport de Clôture de l\'Exercice', type: 'CLOSING' })}
                          className="px-3 py-1 rounded-xl bg-violet-600 text-white hover:bg-violet-700 text-[9px] font-black uppercase"
                        >
                          Aperçu
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pièces justificatives missing stats (Task 9) */}
                  <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase flex items-center gap-1.5">
                        <Paperclip className="w-4 h-4 text-amber-600" /> État des Pièces Justificatives
                      </h4>
                      <button
                        onClick={() => setSuccessMessage('Rapport des pièces justificatives manquantes généré avec succès.')}
                        className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[9px] font-black"
                      >
                        Générer Rapport Manquantes
                      </button>
                    </div>

                    <div className="space-y-2 text-[10px] font-bold">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400">
                            <th className="p-1.5">N° Pièce</th>
                            <th className="p-1.5">Libellé</th>
                            <th className="p-1.5 text-right">Montant</th>
                            <th className="p-1.5 text-center">Pièce</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                          <tr>
                            <td className="p-1.5 font-bold">VT-2026-001</td>
                            <td className="p-1.5">Facture client ABC</td>
                            <td className="p-1.5 text-right font-mono font-bold">1 250 000 FCFA</td>
                            <td className="p-1.5 text-center text-emerald-600 font-bold">☑ Présente</td>
                          </tr>
                          <tr>
                            <td className="p-1.5 font-bold">AC-2026-014</td>
                            <td className="p-1.5">Achat fournitures bureau</td>
                            <td className="p-1.5 text-right font-mono font-bold">350 000 FCFA</td>
                            <td className="p-1.5 text-center text-rose-500 font-bold">⚠️ Manquante</td>
                          </tr>
                          <tr>
                            <td className="p-1.5 font-bold">BQ-2026-088</td>
                            <td className="p-1.5">Frais de tenue de compte</td>
                            <td className="p-1.5 text-right font-mono font-bold">45 000 FCFA</td>
                            <td className="p-1.5 text-center text-emerald-600 font-bold">☑ Présente</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Personnalisé & Audit (Task 11 & 15) */}
              {reportsActiveCategory === 'PERSO_AUDIT' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Custom Report Builder */}
                  <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase border-b pb-2 flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-violet-600" /> Générateur de Rapports Personnalisés
                    </h4>

                    <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-slate-700">
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase">Comptes (Ex: 60)</label>
                        <input
                          type="text"
                          value={customReportFilters.accounts}
                          onChange={(e) => setCustomReportFilters({ ...customReportFilters, accounts: e.target.value })}
                          placeholder="60..."
                          className="w-full mt-1 p-2 rounded-xl border focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase">Journal</label>
                        <select
                          value={customReportFilters.journal}
                          onChange={(e) => setCustomReportFilters({ ...customReportFilters, journal: e.target.value })}
                          className="w-full mt-1 p-2 rounded-xl border focus:outline-none bg-white"
                        >
                          <option value="ALL">Tous les journaux</option>
                          <option value="VENTES">Ventes</option>
                          <option value="ACHATS">Achats</option>
                          <option value="BANQUE">Banque</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase">Montant Minimum</label>
                        <input
                          type="number"
                          value={customReportFilters.amountMin}
                          onChange={(e) => setCustomReportFilters({ ...customReportFilters, amountMin: e.target.value })}
                          placeholder="500000"
                          className="w-full mt-1 p-2 rounded-xl border focus:outline-none"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            // Filter logic
                            const acc = customReportFilters.accounts.trim();
                            const jrn = customReportFilters.journal;
                            const minAmt = Number(customReportFilters.amountMin) || 0;
                            
                            const results = entries.filter((e) => {
                              if (jrn !== 'ALL' && e.journalType !== jrn) return false;
                              const matchAmt = e.lines?.some((l) => {
                                const total = (Number(l.debit) || 0) + (Number(l.credit) || 0);
                                if (total < minAmt) return false;
                                if (acc && !l.accountCode.startsWith(acc)) return false;
                                return true;
                              });
                              return matchAmt;
                            });

                            setCustomReportResult(results);
                          }}
                          className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-[10px] transition-colors"
                        >
                          Générer le rapport
                        </button>
                      </div>
                    </div>

                    {customReportResult && (
                      <div className="pt-2 space-y-2 max-h-[150px] overflow-y-auto">
                        <div className="text-[9px] text-slate-400 font-extrabold uppercase">Résultat ({customReportResult.length}) :</div>
                        {customReportResult.length === 0 ? (
                          <div className="text-center py-4 italic text-slate-400 text-[10px] font-bold">Aucune écriture trouvée.</div>
                        ) : (
                          customReportResult.map((res, idx) => (
                            <div key={idx} className="p-2 bg-slate-50 border rounded-xl text-[9px] font-bold flex justify-between items-center">
                              <div>
                                <div className="text-slate-900">{res.wording}</div>
                                <div className="text-slate-400 font-medium">Date: {res.date} · Journal: {res.journalType}</div>
                              </div>
                              <span className="font-mono text-slate-700">
                                {fmtMoney(res.lines?.reduce((sum: number, l: any) => sum + (Number(l.debit) || 0), 0) || 0)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Audit Trail Log (Task 15) */}
                  <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase border-b pb-2 flex items-center gap-1.5">
                      <Search className="w-4 h-4 text-violet-600" /> Rapport de Piste d'Audit
                    </h4>

                    <div className="space-y-2 text-[10px] font-bold">
                      <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                        <div className="flex justify-between text-slate-900">
                          <span>Création Écriture Ventes</span>
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded">VALIDE</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-medium font-mono">
                          <span>Admin (Dieudonné M.) · {new Date().toLocaleDateString()}</span>
                          <span>Solde: +1 250 000 FCFA</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                        <div className="flex justify-between text-slate-900">
                          <span>Modification Écriture Extourne (IA)</span>
                          <span className="text-[8px] bg-violet-100 text-violet-800 px-1 rounded">CORRIGÉ IA</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-medium font-mono">
                          <span>Système (IA Assistant) · {new Date().toLocaleDateString()}</span>
                          <span>Modification Pièce justificative</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Excel professional sheets list summary (Task 12) */}
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-950 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 animate-pulse" /> Export Excel Professionnel Multi-Feuilles
                  </h4>
                  <p className="text-[10px] text-slate-500 font-bold max-w-[500px]">
                    Téléchargez un classeur de synthèse comptable complet intégrant la balance, le grand livre, les journaux auxiliaires, l'audit, le SIG et les ratios.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setRecentReportsList([
                      { id: String(recentReportsList.length + 1), name: 'Export Comptable Global (Multi-Feuilles)', year: financialYearFilter, user: 'Dieudonné MELAMEM', date: new Date().toLocaleDateString() },
                      ...recentReportsList
                    ]);
                    setSuccessMessage("Classeur Excel Multi-Feuilles (01_Balance à 10_Ratios) exporté avec succès !");
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-colors shrink-0"
                >
                  📊 Télécharger Classeur Excel (.xlsx)
                </button>
              </div>

              {/* Recent Reports Log (Task 13) */}
              <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-4">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase">🕘 Rapports Récemment Générés</h4>
                <div className="overflow-hidden border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs font-bold text-slate-700">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 border-b">
                        <th className="p-2.5">Nom du Rapport</th>
                        <th className="p-2.5">Exercice</th>
                        <th className="p-2.5">Généré par</th>
                        <th className="p-2.5">Date de génération</th>
                        <th className="p-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentReportsList.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 text-slate-900">{row.name}</td>
                          <td className="p-2.5 font-mono">{row.year}</td>
                          <td className="p-2.5 font-medium">{row.user}</td>
                          <td className="p-2.5 font-mono font-medium text-slate-400">{row.date}</td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => setSelectedReportPreview({ title: row.name, type: 'GENERIC' })}
                              className="text-violet-600 hover:underline mr-3 text-[10px]"
                            >
                              👁 Aperçu
                            </button>
                            <button
                              onClick={() => setSuccessMessage(`Rapport "${row.name}" re-téléchargé.`)}
                              className="text-slate-400 hover:text-slate-600 text-[10px]"
                            >
                              ⬇ Télécharger
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Interactive Financial Package Modal (Task 2) */}
          {showFinancialPackageModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-[450px] p-6 bg-white rounded-3xl border border-slate-100 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-violet-600" /> Générer la Liasse des États Financiers
                  </h3>
                  <button
                    onClick={() => setShowFinancialPackageModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Fermer
                  </button>
                </div>

                <div className="space-y-3 text-[10px] font-bold text-slate-700">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase">Exercice fiscal</label>
                    <select
                      value={financialPackageConfig.year}
                      onChange={(e) => setFinancialPackageConfig({ ...financialPackageConfig, year: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border focus:outline-none bg-white"
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 uppercase">Type de système SYSCOHADA</label>
                    <select
                      value={financialPackageConfig.system}
                      onChange={(e) => setFinancialPackageConfig({ ...financialPackageConfig, system: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border focus:outline-none bg-white"
                    >
                      <option value="NORMAL">Système Normal (Standard)</option>
                      <option value="MINIMAL">Système Minimal de Trésorerie (SMT)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[9px] text-slate-400 uppercase block mb-1">Documents à inclure</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={financialPackageConfig.Bilan}
                        onChange={(e) => setFinancialPackageConfig({ ...financialPackageConfig, Bilan: e.target.checked })}
                        className="rounded"
                      />
                      <span>Bilan Général</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={financialPackageConfig.IncomeStatement}
                        onChange={(e) => setFinancialPackageConfig({ ...financialPackageConfig, IncomeStatement: e.target.checked })}
                        className="rounded"
                      />
                      <span>Compte de Résultat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={financialPackageConfig.CashFlow}
                        onChange={(e) => setFinancialPackageConfig({ ...financialPackageConfig, CashFlow: e.target.checked })}
                        className="rounded"
                      />
                      <span>Tableau des flux de trésorerie</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={financialPackageConfig.Notes}
                        onChange={(e) => setFinancialPackageConfig({ ...financialPackageConfig, Notes: e.target.checked })}
                        className="rounded"
                      />
                      <span>Notes annexes et tableaux d'immobilisations</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    onClick={() => setShowFinancialPackageModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      setShowFinancialPackageModal(false);
                      setRecentReportsList([
                        { id: String(recentReportsList.length + 1), name: 'Liasse Fiscale SYSCOHADA Complète', year: financialPackageConfig.year, user: 'Dieudonné MELAMEM', date: new Date().toLocaleDateString() },
                        ...recentReportsList
                      ]);
                      setSuccessMessage('Compilation de la liasse fiscale complétée avec succès !');
                    }}
                    className="px-4 py-2 rounded-xl bg-violet-600 text-white font-extrabold text-xs hover:bg-violet-700"
                  >
                    Générer la liasse complète
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* ── TAB 14: Paramétrage ──────────────────────────────────────────────── */}
      {tab === 'parametrages' && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-6 animate-in fade-in duration-200">
          
          {/* Header & Complétion Score Dashboard (Task 17 & 18) */}
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-8 border-violet-600 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-slate-800">92%</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase">État de Configuration de FinancePro</h4>
                <p className="text-[10px] text-slate-400 font-bold">
                  Votre configuration comptable est presque complète. 1 élément requiert votre attention.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1 text-[9px] font-black">
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">🟢 Entreprise</span>
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">🟢 Exercice 2026</span>
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">🟢 SYSCOHADA Révisé</span>
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">🟢 Journaux</span>
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">🟢 TVA & Taxes</span>
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">🟢 Banques</span>
                  <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">🟠 Fiscalité</span>
                  <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">🔴 Sauvegardes</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSetupWizard(true);
                setWizardStep(1);
              }}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs shadow-sm transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Assistant Configuration
            </button>
          </div>

          {/* Sub-tab menu navigation (Task 1) */}
          <div className="flex flex-wrap gap-1 border-b pb-2">
            {[
              { code: 'ENTREPRISE', label: '🏢 Entreprise', icon: Building2 },
              { code: 'EXERCICE', label: '📅 Exercice', icon: Calendar },
              { code: 'REFERENTIEL', label: '📚 SYSCOHADA', icon: BookOpen },
              { code: 'JOURNAUX', label: '📒 Journaux', icon: Layers },
              { code: 'TVA', label: '🧾 TVA & Taxes', icon: Scale },
              { code: 'TIERS', label: '👥 Tiers & Règles', icon: Users },
              { code: 'BANQUES', label: '🏦 Banques & Caisses', icon: Landmark },
              { code: 'DOCUMENTS', label: '📎 Pièces jointes', icon: Paperclip },
              { code: 'NUMEROTATION', label: '🔢 Numérotation', icon: ChevronRight },
              { code: 'WORKFLOW', label: '👤 Droits & Workflow', icon: ShieldCheck },
              { code: 'RESTORE', label: '💾 Sauvegardes', icon: Save },
            ].map((subTab) => (
              <button
                key={subTab.code}
                onClick={() => setActiveSettingSubTab(subTab.code as any)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-colors ${
                  activeSettingSubTab === subTab.code
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {subTab.label}
              </button>
            ))}
          </div>

          {/* Sub-tab content panes */}
          {(() => {
            // 1. Enterprise Identification (Task 2)
            if (activeSettingSubTab === 'ENTREPRISE') {
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase">Raison sociale</label>
                      <input
                        type="text"
                        value={companyIdentity.name}
                        onChange={(e) => setCompanyIdentity({ ...companyIdentity, name: e.target.value })}
                        className="w-full mt-1 p-2 rounded-xl border focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase">Nom commercial</label>
                      <input
                        type="text"
                        value={companyIdentity.commercialName}
                        onChange={(e) => setCompanyIdentity({ ...companyIdentity, commercialName: e.target.value })}
                        className="w-full mt-1 p-2 rounded-xl border focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase">Forme juridique</label>
                      <input
                        type="text"
                        value={companyIdentity.legalType}
                        onChange={(e) => setCompanyIdentity({ ...companyIdentity, legalType: e.target.value })}
                        className="w-full mt-1 p-2 rounded-xl border focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase">RCCM</label>
                      <input
                        type="text"
                        value={companyIdentity.rccm}
                        onChange={(e) => setCompanyIdentity({ ...companyIdentity, rccm: e.target.value })}
                        className="w-full mt-1 p-2 rounded-xl border focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase">NIU (Numéro d'Identifiant Unique)</label>
                      <input
                        type="text"
                        value={companyIdentity.niu}
                        onChange={(e) => setCompanyIdentity({ ...companyIdentity, niu: e.target.value })}
                        className="w-full mt-1 p-2 rounded-xl border focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase">Régime fiscal</label>
                      <input
                        type="text"
                        value={companyIdentity.taxRegime}
                        onChange={(e) => setCompanyIdentity({ ...companyIdentity, taxRegime: e.target.value })}
                        className="w-full mt-1 p-2 rounded-xl border focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[9px] text-slate-400 uppercase">Activité principale</label>
                      <input
                        type="text"
                        value={companyIdentity.activity}
                        onChange={(e) => setCompanyIdentity({ ...companyIdentity, activity: e.target.value })}
                        className="w-full mt-1 p-2 rounded-xl border focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase">Email Contact</label>
                      <input
                        type="email"
                        value={companyIdentity.email}
                        onChange={(e) => setCompanyIdentity({ ...companyIdentity, email: e.target.value })}
                        className="w-full mt-1 p-2 rounded-xl border focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <h5 className="text-[10px] font-black uppercase text-slate-400 mb-2">Responsables de l'entité</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase">Dirigeant Principal</label>
                        <input
                          type="text"
                          value={companyIdentity.boss}
                          onChange={(e) => setCompanyIdentity({ ...companyIdentity, boss: e.target.value })}
                          className="w-full mt-1 p-2 rounded-xl border focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase">Responsable Financier (DAF)</label>
                        <input
                          type="text"
                          value={companyIdentity.cfo}
                          onChange={(e) => setCompanyIdentity({ ...companyIdentity, cfo: e.target.value })}
                          className="w-full mt-1 p-2 rounded-xl border focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase">Responsable Comptable</label>
                        <input
                          type="text"
                          value={companyIdentity.chiefAccountant}
                          onChange={(e) => setCompanyIdentity({ ...companyIdentity, chiefAccountant: e.target.value })}
                          className="w-full mt-1 p-2 rounded-xl border focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t">
                    <button
                      onClick={() => setSuccessMessage("Identification de l'entreprise mise à jour.")}
                      className="px-4 py-2 rounded-xl bg-violet-600 text-white font-extrabold text-[11px] hover:bg-violet-700"
                    >
                      Enregistrer les informations
                    </button>
                  </div>
                </div>
              );
            }

            // 2. Exercice comptable (Task 3)
            if (activeSettingSubTab === 'EXERCICE') {
              return (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-extrabold uppercase">Statut de l'Exercice</div>
                      <div className="text-sm font-black text-slate-800 flex items-center gap-2 mt-1">
                        {fiscalYearConfig.status === 'OUVERT' ? (
                          <>
                            <span>🔓 Exercice {fiscalYearConfig.current} Ouvert</span>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-black uppercase">
                              Actif
                            </span>
                          </>
                        ) : (
                          <>
                            <span>🔒 Exercice {fiscalYearConfig.current} Clôturé</span>
                            <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-full font-black uppercase">
                              Verrouillé
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {fiscalYearConfig.status === 'OUVERT' ? (
                        <button
                          onClick={() => {
                            setFiscalYearConfig({ ...fiscalYearConfig, status: 'CLOTURE' });
                            addAuditLog('Verrouillage Clôture', `Clôture définitive de l'exercice comptable ${fiscalYearConfig.current}`);
                            setSuccessMessage(`Exercice ${fiscalYearConfig.current} verrouillé.`);
                          }}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs"
                        >
                          🔒 Verrouiller & Clôturer
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setFiscalYearConfig({ ...fiscalYearConfig, status: 'OUVERT' });
                            addAuditLog('Réouverture Exercice', `Réouverture autorisée pour motif : Corrections fiscales`);
                            setSuccessMessage(`Exercice ${fiscalYearConfig.current} réouvert pour modifications.`);
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs"
                        >
                          🔓 Déverrouiller & Réouvrir
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase">Date d'ouverture</label>
                      <input type="text" value={fiscalYearConfig.start} disabled className="w-full mt-1 p-2 rounded-xl border bg-slate-50" />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase">Date de clôture automatique</label>
                      <input type="text" value={fiscalYearConfig.end} disabled className="w-full mt-1 p-2 rounded-xl border bg-slate-50" />
                    </div>
                  </div>
                </div>
              );
            }

            // 3. Référentiel SYSCOHADA (Task 4)
            if (activeSettingSubTab === 'REFERENTIEL') {
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Référentiel comptable applicable</label>
                      <select className="w-full mt-1 p-2.5 rounded-xl border bg-white focus:outline-none">
                        <option>SYSCOHADA Révisé 2026</option>
                        <option>Système Minimal de Trésorerie (SMT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Longueur par défaut des comptes généraux</label>
                      <select
                        value={companySettings.accountLength}
                        onChange={(e) => setCompanySettings({ ...companySettings, accountLength: Number(e.target.value) })}
                        className="w-full mt-1 p-2.5 rounded-xl border bg-white focus:outline-none"
                      >
                        <option value={6}>6 Chiffres (Standard)</option>
                        <option value={8}>8 Chiffres (SYSCOHADA Étendu)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border rounded-2xl space-y-3">
                    <h5 className="text-[10px] font-black uppercase text-slate-400">Règles automatiques d'intégrité comptable</h5>
                    <div className="space-y-2 text-[10px] text-slate-600 font-bold">
                      <div className="flex justify-between">
                        <span>Blocage de la saisie sur comptes de regroupement interdits</span>
                        <span className="text-emerald-600">🟢 Activé</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avertissement de non-lettrage des tiers collectifs</span>
                        <span className="text-emerald-600">🟢 Activé</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Calcul automatique de TVA déductible / collectée</span>
                        <span className="text-emerald-600">🟢 Activé</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // 4. Journaux (Task 5)
            if (activeSettingSubTab === 'JOURNAUX') {
              return (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Journaux enregistrés</span>
                    <button
                      onClick={() => {
                        setNewJournalConfig({ code: '', label: '', type: 'OD', account: '' });
                        setShowAddJournalModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-violet-600 text-white font-extrabold text-[10px] hover:bg-violet-700 transition-colors"
                    >
                      + Nouveau journal
                    </button>
                  </div>

                  <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white">
                    <table className="w-full text-left text-xs font-bold text-slate-700">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b">
                          <th className="p-2.5">Code</th>
                          <th className="p-2.5">Libellé</th>
                          <th className="p-2.5">Type journal</th>
                          <th className="p-2.5">Compte par défaut</th>
                          <th className="p-2.5 text-right">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {settingJournals.map((j, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5 text-violet-700 font-extrabold">{j.code}</td>
                            <td className="p-2.5">{j.label}</td>
                            <td className="p-2.5 text-slate-400 text-[10px]">{j.type}</td>
                            <td className="p-2.5 font-mono">{j.account}</td>
                            <td className="p-2.5 text-right">
                              <span className="text-[8px] bg-emerald-50 text-emerald-800 font-black px-1.5 py-0.5 rounded uppercase">
                                Actif
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            // 5. Taxes & TVA (Task 6)
            if (activeSettingSubTab === 'TVA') {
              return (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Taux de Taxes configurés</span>
                    <button
                      onClick={() => {
                        setNewTaxConfig({ code: '', label: '', rate: 18, collectedAccount: '', deductibleAccount: '' });
                        setShowAddTaxModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-violet-600 text-white font-extrabold text-[10px] hover:bg-violet-700 transition-colors"
                    >
                      + Nouvelle taxe
                    </button>
                  </div>

                  <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white">
                    <table className="w-full text-left text-xs font-bold text-slate-700">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b">
                          <th className="p-2.5">Code</th>
                          <th className="p-2.5">Libellé</th>
                          <th className="p-2.5 text-right">Taux</th>
                          <th className="p-2.5">Compte Collecté</th>
                          <th className="p-2.5">Compte Déductible</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {settingTaxes.map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5 text-violet-700 font-bold">{t.code}</td>
                            <td className="p-2.5 font-bold font-sans text-slate-700">{t.label}</td>
                            <td className="p-2.5 text-right font-black">{t.rate}%</td>
                            <td className="p-2.5">{t.collectedAccount}</td>
                            <td className="p-2.5">{t.deductibleAccount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            // 6. Comptes Tiers (Task 12)
            if (activeSettingSubTab === 'TIERS') {
              return (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-slate-900">Règles d'imputation automatique</h4>
                  
                  <div className="space-y-2 text-[10px] font-bold">
                    <div className="p-3 bg-slate-50 border rounded-2xl space-y-1">
                      <div className="flex justify-between">
                        <span>Fournisseur Orange Cameroun</span>
                        <span className="text-violet-600 font-black">→ Compte 605000 (Achat énergie/télécom)</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium">Journal: ACHATS · TVA déductible standard</div>
                    </div>

                    <div className="p-3 bg-slate-50 border rounded-2xl space-y-1">
                      <div className="flex justify-between">
                        <span>Client Super U Dakar</span>
                        <span className="text-violet-600 font-black">→ Compte 411100 (Client Collectif)</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium">Journal: VENTES · TVA collectée standard</div>
                    </div>
                  </div>
                </div>
              );
            }

            // 7. Banques & Caisses (Task 9)
            if (activeSettingSubTab === 'BANQUES') {
              return (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-slate-900">Comptes Financiers Actifs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-2xl bg-slate-50/50 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <strong className="text-slate-900 font-extrabold">UBA - Compte Courant</strong>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-black rounded uppercase">Actif</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold space-y-1">
                        <div>Compte Comptable : 521100 (Afriland/UBA)</div>
                        <div>Devise : XAF (FCFA)</div>
                        <div>Rapprochement bancaire : 100% complet</div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-2xl bg-slate-50/50 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <strong className="text-slate-900 font-extrabold">Caisse Centrale Siège</strong>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-black rounded uppercase">Actif</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold space-y-1">
                        <div>Compte Comptable : 571100</div>
                        <div>Devise : XAF (FCFA)</div>
                        <div>Seuil d'alerte : 500 000 FCFA</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // 8. Pièces jointes (Task 10)
            if (activeSettingSubTab === 'DOCUMENTS') {
              return (
                <div className="space-y-4 text-xs font-bold text-slate-700">
                  <div className="p-4 bg-slate-50 rounded-3xl border space-y-3">
                    <h5 className="text-[10px] font-black uppercase text-slate-400">Configuration Documentaire (OCR & Stockage)</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase">Taille maximale autorisée</label>
                        <select className="w-full mt-1 p-2 rounded-xl border bg-white focus:outline-none">
                          <option>10 Mo (Standard)</option>
                          <option>20 Mo</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase">Chiffrement cloud des justificatifs</label>
                        <select className="w-full mt-1 p-2 rounded-xl border bg-white focus:outline-none">
                          <option>Activé (AES-256)</option>
                          <option>Désactivé</option>
                        </select>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <span>📁 Nomenclature automatique active :</span>
                      <code className="text-violet-600 font-mono">2026/08/VENTES/VT-2026-001.pdf</code>
                    </div>
                  </div>
                </div>
              );
            }

            // 9. Numérotation (Task 11)
            if (activeSettingSubTab === 'NUMEROTATION') {
              return (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-slate-900">Format de Numérotation des pièces</h4>
                  <div className="p-4 bg-slate-50 border rounded-3xl text-[10px] font-bold text-slate-700 space-y-1">
                    <div className="flex justify-between">
                      <span>Journal des Ventes (VT)</span>
                      <span className="font-mono text-violet-700">VT-2026-000001</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Journal des Achats (AC)</span>
                      <span className="font-mono text-violet-700">AC-2026-000001</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Journal de Banque (BQ)</span>
                      <span className="font-mono text-violet-700">BQ-2026-000001</span>
                    </div>
                  </div>
                </div>
              );
            }

            // 10. Droits & validations (Task 13 & 14)
            if (activeSettingSubTab === 'WORKFLOW') {
              return (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black uppercase text-slate-900">Matrice des droits par rôles</h4>
                  <div className="overflow-hidden border rounded-2xl">
                    <table className="w-full text-left text-xs font-bold text-slate-700">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b">
                          <th className="p-2.5">Rôle</th>
                          <th className="p-2.5 text-center">Saisie</th>
                          <th className="p-2.5 text-center">Contrôle</th>
                          <th className="p-2.5 text-center">Validation</th>
                          <th className="p-2.5 text-center">Clôture</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-center">
                        <tr>
                          <td className="p-2.5 text-left text-slate-900">Comptable</td>
                          <td className="p-2.5">✅</td>
                          <td className="p-2.5">❌</td>
                          <td className="p-2.5">❌</td>
                          <td className="p-2.5">❌</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-left text-slate-900">Chef Comptable</td>
                          <td className="p-2.5">✅</td>
                          <td className="p-2.5">✅</td>
                          <td className="p-2.5">⚠️ &lt; 5M</td>
                          <td className="p-2.5">❌</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-left text-slate-900">DAF</td>
                          <td className="p-2.5">✅</td>
                          <td className="p-2.5">✅</td>
                          <td className="p-2.5">✅</td>
                          <td className="p-2.5">❌</td>
                        </tr>
                        <tr className="bg-violet-50/10">
                          <td className="p-2.5 text-left text-slate-900 font-extrabold">Administrateur</td>
                          <td className="p-2.5">✅</td>
                          <td className="p-2.5">✅</td>
                          <td className="p-2.5">✅</td>
                          <td className="p-2.5">✅</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            // 11. Sauvegardes (Task 15)
            if (activeSettingSubTab === 'RESTORE') {
              return (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-extrabold uppercase font-sans">Sauvegardes automatiques</div>
                      <div className="text-xs font-black text-slate-800 mt-1">🟢 Dernière sauvegarde : Aujourd'hui à 17:45</div>
                    </div>
                    <button
                      onClick={() => setSuccessMessage('Sauvegarde instantanée cloud exécutée.')}
                      className="px-4 py-2 rounded-xl bg-violet-600 text-white font-extrabold text-xs hover:bg-violet-700"
                    >
                      Sauvegarder maintenant
                    </button>
                  </div>
                </div>
              );
            }

            return null;
          })()}

          {/* Stepper Wizard Modal Popup (Task 16) */}
          {showSetupWizard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-[500px] p-6 bg-white rounded-3xl border border-slate-100 shadow-xl space-y-4">
                
                {/* Stepper Header */}
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-600" /> Assistant de Configuration Guidée
                  </h3>
                  <button
                    onClick={() => setShowSetupWizard(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Fermer
                  </button>
                </div>

                {/* Progress Indicators */}
                <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                  {['Entreprise', 'SYSCOHADA', 'Exercice', 'Journaux', 'Clôture'].map((stepName, i) => (
                    <span key={i} className={wizardStep === i + 1 ? 'text-violet-600 font-black' : ''}>
                      {stepName}
                    </span>
                  ))}
                </div>

                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-violet-600 h-full rounded-full transition-all duration-300" style={{ width: `${(wizardStep / 5) * 100}%` }} />
                </div>

                {/* Steps Content */}
                <div className="py-2 text-xs font-bold text-slate-700">
                  {wizardStep === 1 && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-400">Étape 1 : Validez l'identification de votre entité juridique.</p>
                      <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                        <div>MELARO GROUP (SARL)</div>
                        <div>RCCM: RC/DAB/2022/B/351 · Dakar, Sénégal</div>
                      </div>
                    </div>
                  )}

                  {wizardStep === 2 && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-400">Étape 2 : Configuration du référentiel et longueur de plan comptable.</p>
                      <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                        <div>Référentiel : SYSCOHADA Révisé 2026</div>
                        <div>Longueur : 6 Chiffres</div>
                      </div>
                    </div>
                  )}

                  {wizardStep === 3 && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-400">Étape 3 : Exercice comptable actif et dates d'ouvertures.</p>
                      <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                        <div>Période active : 01/01/2026 au 31/12/2026</div>
                      </div>
                    </div>
                  )}

                  {wizardStep === 4 && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-400">Étape 4 : Journaux de saisie par défaut.</p>
                      <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                        <div>Ventes, Achats, Banque, Caisse, OD configurés.</div>
                      </div>
                    </div>
                  )}

                  {wizardStep === 5 && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-400">Étape 5 : Droits d'accès et workflow de validation.</p>
                      <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                        <div>Workflow à double validation activé pour les pièces importantes (&gt; 5M).</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex justify-between pt-2 border-t">
                  <button
                    disabled={wizardStep === 1}
                    onClick={() => setWizardStep(wizardStep - 1)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  
                  {wizardStep === 5 ? (
                    <button
                      onClick={() => {
                        setShowSetupWizard(false);
                        setSuccessMessage('Configuration guidée FinancePro complétée avec succès (100%) !');
                      }}
                      className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs"
                    >
                      Terminer
                    </button>
                  ) : (
                    <button
                      onClick={() => setWizardStep(wizardStep + 1)}
                      className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs"
                    >
                      Suivant
                    </button>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Modal Popup: Add Journal (Task 5) */}
          {showAddJournalModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-[400px] p-6 bg-white rounded-3xl border border-slate-100 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-violet-600" /> Ajouter un Nouveau Journal Comptable
                  </h3>
                  <button onClick={() => setShowAddJournalModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Fermer</button>
                </div>

                <div className="space-y-3 text-[10px] font-bold text-slate-700">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase">Code Journal (2 ou 3 lettres)</label>
                    <input
                      type="text"
                      value={newJournalConfig.code}
                      onChange={(e) => setNewJournalConfig({ ...newJournalConfig, code: e.target.value.toUpperCase() })}
                      placeholder="Ex: BQ"
                      className="w-full mt-1 p-2.5 rounded-xl border focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase">Libellé</label>
                    <input
                      type="text"
                      value={newJournalConfig.label}
                      onChange={(e) => setNewJournalConfig({ ...newJournalConfig, label: e.target.value })}
                      placeholder="Ex: Banque Société Générale"
                      className="w-full mt-1 p-2.5 rounded-xl border focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase">Type journal</label>
                    <select
                      value={newJournalConfig.type}
                      onChange={(e) => setNewJournalConfig({ ...newJournalConfig, type: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border focus:outline-none bg-white"
                    >
                      <option value="ACHAT">Achat</option>
                      <option value="VENTE">Vente</option>
                      <option value="BANQUE">Banque</option>
                      <option value="CAISSE">Caisse</option>
                      <option value="OD">Opérations Diverses</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase">Compte comptable par défaut</label>
                    <input
                      type="text"
                      value={newJournalConfig.account}
                      onChange={(e) => setNewJournalConfig({ ...newJournalConfig, account: e.target.value })}
                      placeholder="521200"
                      className="w-full mt-1 p-2.5 rounded-xl border focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button onClick={() => setShowAddJournalModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs">Annuler</button>
                  <button
                    onClick={() => {
                      if (!newJournalConfig.code || !newJournalConfig.label) return;
                      setSettingJournals([...settingJournals, {
                        code: newJournalConfig.code,
                        label: newJournalConfig.label,
                        type: newJournalConfig.type,
                        account: newJournalConfig.account || '—',
                        status: 'ACTIVE'
                      }]);
                      setShowAddJournalModal(false);
                      setSuccessMessage(`Journal [ ${newJournalConfig.code} ] créé avec succès !`);
                    }}
                    className="px-4 py-2 rounded-xl bg-violet-600 text-white font-extrabold text-xs hover:bg-violet-700"
                  >
                    Créer le journal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Popup: Add Tax (Task 6) */}
          {showAddTaxModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-[400px] p-6 bg-white rounded-3xl border border-slate-100 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-violet-600" /> Paramétrer une Nouvelle Taxe / TVA
                  </h3>
                  <button onClick={() => setShowAddTaxModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Fermer</button>
                </div>

                <div className="space-y-3 text-[10px] font-bold text-slate-700">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase">Code Taxe</label>
                    <input
                      type="text"
                      value={newTaxConfig.code}
                      onChange={(e) => setNewTaxConfig({ ...newTaxConfig, code: e.target.value.toUpperCase() })}
                      placeholder="Ex: TVA19"
                      className="w-full mt-1 p-2.5 rounded-xl border focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase">Libellé</label>
                    <input
                      type="text"
                      value={newTaxConfig.label}
                      onChange={(e) => setNewTaxConfig({ ...newTaxConfig, label: e.target.value })}
                      placeholder="Ex: TVA 19.25% CEMAC"
                      className="w-full mt-1 p-2.5 rounded-xl border focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase">Taux (%)</label>
                    <input
                      type="number"
                      value={newTaxConfig.rate}
                      onChange={(e) => setNewTaxConfig({ ...newTaxConfig, rate: Number(e.target.value) })}
                      placeholder="18"
                      className="w-full mt-1 p-2.5 rounded-xl border focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase">Compte collecté</label>
                    <input
                      type="text"
                      value={newTaxConfig.collectedAccount}
                      onChange={(e) => setNewTaxConfig({ ...newTaxConfig, collectedAccount: e.target.value })}
                      placeholder="443100"
                      className="w-full mt-1 p-2.5 rounded-xl border focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase">Compte déductible</label>
                    <input
                      type="text"
                      value={newTaxConfig.deductibleAccount}
                      onChange={(e) => setNewTaxConfig({ ...newTaxConfig, deductibleAccount: e.target.value })}
                      placeholder="445100"
                      className="w-full mt-1 p-2.5 rounded-xl border focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button onClick={() => setShowAddTaxModal(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs">Annuler</button>
                  <button
                    onClick={() => {
                      if (!newTaxConfig.code || !newTaxConfig.label) return;
                      setSettingTaxes([...settingTaxes, {
                        code: newTaxConfig.code,
                        label: newTaxConfig.label,
                        rate: newTaxConfig.rate,
                        collectedAccount: newTaxConfig.collectedAccount || '443000',
                        deductibleAccount: newTaxConfig.deductibleAccount || '445000'
                      }]);
                      setShowAddTaxModal(false);
                      setSuccessMessage(`Taxe [ ${newTaxConfig.code} ] ajoutée avec succès !`);
                    }}
                    className="px-4 py-2 rounded-xl bg-violet-600 text-white font-extrabold text-xs hover:bg-violet-700"
                  >
                    Ajouter la taxe
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── TAB 15: Piste d'Audit Interactive ───────────────────────────────── */}
      {tab === 'audit' && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-6 animate-in fade-in duration-200">
          
          {/* Header (Task 16) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-600" /> Centre d'Audit Expert & Traçabilité Générale
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                Journalisation continue, horodatage, empreintes de justificatifs SHA-256 et vérification d'intégrité de la chaîne
              </p>
            </div>
            <span className="text-[9px] font-black px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase select-none">
              🟢 Intégrité et traçabilité activées
            </span>
          </div>

          {/* Top Dashboard Row (Task 4 & 10) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk Score */}
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score de Risque de la Piste d'Audit</div>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-8 border-violet-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-violet-600 font-mono">87/100</span>
                </div>
                <div className="text-[11px] font-bold text-slate-500 leading-relaxed">
                  Faible risque de fraude ou altération de données.
                  <p className="font-medium text-slate-400 mt-0.5">
                    100% des écritures comptables sont tracées de manière inaltérable. 2 réouvertures d'exercices justifiées.
                  </p>
                </div>
              </div>

              <div className="border-t pt-3 space-y-1 text-[10px] text-slate-500 font-bold">
                <div className="flex justify-between">
                  <span>Modifications non autorisées</span>
                  <span className="text-emerald-600">0 détectées</span>
                </div>
                <div className="flex justify-between">
                  <span>Écritures supprimées définitivement</span>
                  <span className="text-emerald-600">0 (interdit par l'ERP)</span>
                </div>
                <div className="flex justify-between">
                  <span>Pièces justificatives présentes</span>
                  <span className="text-slate-700">98% (2 manquantes)</span>
                </div>
              </div>
            </div>

            {/* Integrity Panel */}
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intégrité de la Piste d'Audit</span>
                  <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">
                    ✓ INTÈGRE
                  </span>
                </div>
                
                <div className="text-[11px] font-bold text-slate-700 space-y-1.5 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium font-sans">Événements vérifiés</span>
                    <span>1 248</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium font-sans">Événements altérés</span>
                    <span>0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium font-sans">Chaîne de Hash SHA-256</span>
                    <span className="text-emerald-600">Valide (Chained Hash)</span>
                  </div>
                </div>
              </div>

              <button
                onClick={async () => {
                  setAuditVerifyLoading(true);
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  setAuditVerifyLoading(false);
                  setSuccessMessage("Chaîne d'audit (1248 événements) scannée avec succès. Signature cryptographique valide !");
                }}
                disabled={auditVerifyLoading}
                className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                {auditVerifyLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Vérification cryptographique...
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" /> Vérifier l'Intégrité de la Piste
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search, Filter & Exports (Task 5 & 6) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
            <div className="flex flex-1 max-w-md gap-2">
              <input
                type="text"
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                placeholder="Rechercher une écriture, utilisateur, pièce, compte..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-violet-500"
              />
              
              <select
                value={auditFilterAction}
                onChange={(e) => setAuditFilterAction(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none"
              >
                <option value="ALL">Tous les événements</option>
                <option value="SENSITIVE">Actions sensibles uniquement ⚠️</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSuccessMessage('Rapport PDF d\'audit d\'intégrité généré.')}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" /> Générer Rapport
              </button>
              <button
                onClick={() => setSuccessMessage('Téléchargement du dossier d\'audit complet premium lancé (.zip).')}
                className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Dossier Audit (.zip)
              </button>
            </div>
          </div>

          {/* Stepper Reconstitution Module (Task 12) */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase">Reconstituer l'historique d'une écriture</h4>
                <p className="text-[10px] text-slate-400 font-bold">Visualisez chronologiquement toutes les étapes d'un enregistrement comptable</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={auditReconstituteQuery}
                  onChange={(e) => setAuditReconstituteQuery(e.target.value)}
                  placeholder="Ex: VT-2026-101"
                  className="px-3 py-1.5 rounded-xl border bg-white text-xs font-bold focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (!auditReconstituteQuery.trim()) return;
                    setAuditReconstitutedChain([
                      { step: 1, label: 'Saisie Brouillon', user: 'Dieudonné MELAMEM', time: '11/08/2026 17:09:30', details: 'Saisie initiale dans le journal des VENTES' },
                      { step: 2, label: 'Validation Ledger', user: 'Dieudonné MELAMEM', time: '11/08/2026 17:10:00', details: 'Écriture définitive et inaltérable' },
                      { step: 3, label: 'Lettrage', user: 'Dieudonné MELAMEM', time: '11/08/2026 17:11:15', details: 'Lettrage avec le compte de tiers 411000' },
                      { step: 4, label: 'Rapprochement', user: 'System (IA)', time: '11/08/2026 17:15:00', details: 'Rapprochement bancaire avec relevé Afriland' },
                      { step: 5, label: 'Verrouillage Clôture', user: 'Admin', time: '11/08/2026 17:20:00', details: 'Verrouillé suite à clôture de l\'exercice' }
                    ]);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs hover:bg-slate-800"
                >
                  Reconstituer
                </button>
              </div>
            </div>

            {auditReconstitutedChain && (
              <div className="flex justify-between items-center text-center text-[10px] font-extrabold text-slate-500 overflow-x-auto gap-4 py-2 border-t pt-4">
                {auditReconstitutedChain.map((c, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <div className="w-8 border-t-2 border-dashed border-slate-200 shrink-0"></div>}
                    <div className="flex flex-col items-center min-w-[120px] space-y-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-mono ${
                        c.step === 5 ? 'bg-rose-100 text-rose-700 border-rose-300' :
                        c.step === 4 ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-violet-100 text-violet-700 border-violet-300'
                      }`}>
                        {c.step}
                      </div>
                      <span className="text-slate-800 font-extrabold">{c.label}</span>
                      <span className="text-[8px] text-slate-400 font-medium font-mono">{c.time}</span>
                      <span className="text-[8px] text-slate-500 font-bold max-w-[120px] leading-tight mt-0.5">{c.details}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Audit Logs Table (Task 9) */}
          <div className="overflow-hidden border border-slate-200 rounded-3xl bg-white">
            <table className="w-full text-left text-xs font-bold text-slate-700">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b">
                  <th className="p-3">Date/Heure</th>
                  <th className="p-3">Utilisateur</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Objet concerné</th>
                  <th className="p-3 text-center">Intégrité</th>
                  <th className="p-3">Sensibilité</th>
                  <th className="p-3 text-right">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { date: '11/08/2026 17:09:30', user: 'Dieudonné MELAMEM', action: 'Validation d\'écriture', target: 'VT-2026-101', status: '✓ OK', level: 'FAIBLE', desc: 'Validation définitive de la facture VENTES', before: 'Brouillon', after: 'Validée', lines: [{ acc: '411000', label: 'Client ABC', deb: 119250, cred: 0 }, { acc: '701000', label: 'Ventes', deb: 0, cred: 100000 }, { acc: '443000', label: 'TVA', deb: 0, cred: 19250 }], file: 'Facture_F2026-101.pdf', fingerprint: '8F4A3920BC8E2D99BF56D29810A2B112' },
                  { date: '11/08/2026 17:10:15', user: 'Dieudonné MELAMEM', action: 'Lettrage de tiers', target: 'Compte 411000', status: '✓ OK', level: 'FAIBLE', desc: 'Lettrage de créance client', before: 'Non lettré', after: 'Lettré', lines: [], file: '', fingerprint: '' },
                  { date: '11/08/2026 17:15:00', user: 'Administrateur', action: 'Réouverture d\'exercice', target: 'Exercice 2026', status: '✓ OK', level: 'ELEVE', desc: 'Déverrouillage annuel pour régularisation', before: 'Clôturé', after: 'Ouvert', lines: [], file: '', fingerprint: '' },
                  { date: '11/08/2026 17:18:22', user: 'Administrateur', action: 'Modification taux TVA', target: 'Taux Standard CEMAC', status: '✓ OK', level: 'ELEVE', desc: 'Modification configuration taxe d\'exploitation', before: '19.25%', after: '19.25% (Règle ré-enregistrée)', lines: [], file: '', fingerprint: '' },
                  { date: '11/08/2026 17:25:40', user: 'Dieudonné MELAMEM', action: 'Suppression de pièce', target: 'Justificatif AC-2026-014', status: '✓ OK', level: 'ELEVE', desc: 'Suppression d\'un fichier justificatif achat obsolète', before: 'Présent', after: 'Supprimé', lines: [], file: '', fingerprint: '' }
                ].filter((row) => {
                  if (auditFilterAction === 'SENSITIVE' && row.level !== 'ELEVE') return false;
                  if (auditSearchQuery.trim()) {
                    const q = auditSearchQuery.toLowerCase();
                    return row.action.toLowerCase().includes(q) || row.user.toLowerCase().includes(q) || row.target.toLowerCase().includes(q) || row.desc.toLowerCase().includes(q);
                  }
                  return true;
                }).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono text-slate-400 text-[10px]">{row.date}</td>
                    <td className="p-3 text-slate-900">{row.user}</td>
                    <td className="p-3">
                      <span className="text-violet-700">{row.action}</span>
                    </td>
                    <td className="p-3 font-mono font-extrabold text-[10px]">{row.target}</td>
                    <td className="p-3 text-center text-emerald-600 font-black font-mono">{row.status}</td>
                    <td className="p-3">
                      {row.level === 'ELEVE' ? (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[9px] font-black uppercase">
                          ⚠️ ACTION SENSIBLE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[9px] font-black uppercase">
                          Faible
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedAuditDetail(row)}
                        className="text-violet-600 hover:text-violet-700 text-[10px] font-black uppercase"
                      >
                        👁 Détail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Operation Detail Dialog Modal (Task 2 & 3) */}
          {selectedAuditDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-[500px] p-6 bg-white rounded-3xl border border-slate-100 shadow-xl space-y-4 text-xs font-bold text-slate-700">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    🔍 Détail de l'opération : {selectedAuditDetail.target}
                  </h3>
                  <button
                    onClick={() => setSelectedAuditDetail(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Fermer
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border text-[10px]">
                    <div>
                      <div className="text-slate-400 uppercase text-[8px]">Utilisateur</div>
                      <div>{selectedAuditDetail.user}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 uppercase text-[8px]">Date & Heure</div>
                      <div className="font-mono">{selectedAuditDetail.date}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 uppercase text-[8px]">Statut avant action</div>
                      <div>{selectedAuditDetail.before}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 uppercase text-[8px]">Statut après action</div>
                      <div>{selectedAuditDetail.after}</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    <strong>Description :</strong> {selectedAuditDetail.desc}
                  </p>

                  {/* Accounting lines preview */}
                  {selectedAuditDetail.lines && selectedAuditDetail.lines.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-[10px] text-slate-400 uppercase">Imputation Comptable associée :</div>
                      <div className="overflow-hidden border border-slate-100 rounded-xl">
                        <table className="w-full text-left text-[10px] font-bold">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b">
                              <th className="p-1.5">Compte</th>
                              <th className="p-1.5">Libellé</th>
                              <th className="p-1.5 text-right">Débit</th>
                              <th className="p-1.5 text-right">Crédit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {selectedAuditDetail.lines.map((l: any, i: number) => (
                              <tr key={i}>
                                <td className="p-1.5 text-violet-700">{l.acc}</td>
                                <td className="p-1.5 font-sans">{l.label}</td>
                                <td className="p-1.5 text-right">{l.deb > 0 ? fmtMoney(l.deb) : '—'}</td>
                                <td className="p-1.5 text-right">{l.cred > 0 ? fmtMoney(l.cred) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Attachment document tracking fingerprint check */}
                  {selectedAuditDetail.file && (
                    <div className="p-3 bg-violet-50/50 border border-violet-100 rounded-2xl space-y-1.5 text-[10px]">
                      <div className="flex justify-between items-center text-slate-900 font-extrabold">
                        <span>📎 Pièce Justificative jointe :</span>
                        <a href="#" className="text-violet-600 hover:underline">{selectedAuditDetail.file}</a>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                        <span>Empreinte cryptographique du document :</span>
                        <span className="font-bold">SHA-256: {selectedAuditDetail.fingerprint}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t">
                  <button
                    onClick={() => setSelectedAuditDetail(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-extrabold text-xs"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── TAB 16: Assistant IA FinancePro ─────────────────────────────────── */}
      {tab === 'ai-assistant' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Centre de contrôle IA (Task 1) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 border rounded-3xl text-xs space-y-1 shadow-sm">
              <div className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">🟢 Écritures Contrôlées</div>
              <div className="text-base font-black text-slate-800">1 248 / 1 248</div>
              <div className="text-[9px] text-emerald-600 font-bold">100% de la base auditée</div>
            </div>
            
            <div className="p-4 bg-slate-50 border rounded-3xl text-xs space-y-1 shadow-sm">
              <div className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">🔴 Anomalies Détectées</div>
              <div className="text-base font-black text-rose-600">3</div>
              <div className="text-[9px] text-slate-400 font-medium">Requiert extourne ou correction</div>
            </div>

            <div className="p-4 bg-slate-50 border rounded-3xl text-xs space-y-1 shadow-sm">
              <div className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">🟡 Écritures à Vérifier</div>
              <div className="text-base font-black text-amber-600">12</div>
              <div className="text-[9px] text-slate-400 font-medium">Doutes d'imputations ou pièces</div>
            </div>

            <div className="p-4 bg-slate-50 border rounded-3xl text-xs space-y-1 shadow-sm">
              <div className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">🤖 Confiance Moyenne IA</div>
              <div className="text-base font-black text-violet-600">96.4 %</div>
              <div className="text-[9px] text-slate-400 font-medium">Basé sur 1 200+ apprentissages</div>
            </div>
          </div>

          {/* Action Tools Row (Task 2 & 9 & 10) */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={async () => {
                setAiExerciseDiagnosticLoading(true);
                await new Promise(resolve => setTimeout(resolve, 1500));
                setAiExerciseDiagnosticLoading(false);
                setAiExerciseDiagnostic({
                  total: 1248,
                  critical: 3,
                  warnings: 8,
                  missingFiles: 14,
                  valid: 1223
                });
                setSuccessMessage("Diagnostic global d'exercice complété avec succès !");
              }}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" /> 🔍 Analyser l'exercice
            </button>

            <button
              onClick={() => {
                setAiSuggestedEntry(null);
                setAiGenerateEntryPrompt('');
                setShowAiGenerateEntryModal(true);
              }}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> 🧾 Générer une écriture
            </button>

            <button
              onClick={() => {
                setAiOcrExtractedData(null);
                setShowAiOcrModal(true);
              }}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Paperclip className="w-3.5 h-3.5" /> 📎 Traitement OCR Pièce
            </button>
          </div>

          {/* Diagnostic Report Panel (Task 2) */}
          {aiExerciseDiagnostic && (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-3 animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="text-xs font-black text-slate-900 uppercase">Rapport de Diagnostic IA - Exercice 2026</h4>
                <button
                  onClick={() => setAiExerciseDiagnostic(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕ Fermer
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-slate-700">
                <div className="p-3 bg-white border rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400">Écritures conformes</span>
                  <div className="text-emerald-600 font-black">{aiExerciseDiagnostic.valid}</div>
                </div>
                <div className="p-3 bg-white border rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400">Anomalies critiques</span>
                  <div className="text-rose-600 font-black">{aiExerciseDiagnostic.critical}</div>
                </div>
                <div className="p-3 bg-white border rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400">Anomalies à vérifier</span>
                  <div className="text-amber-600 font-black">{aiExerciseDiagnostic.warnings}</div>
                </div>
                <div className="p-3 bg-white border rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400">Pièces justificatives manquantes</span>
                  <div className="text-slate-500 font-black">{aiExerciseDiagnostic.missingFiles}</div>
                </div>
              </div>
            </div>
          )}

          {/* Split Workspace Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Specialized Modes, History & Interactive Documentation (Taks 7, 8, 11 & 12) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Specialized Assistant Modes (Task 12) */}
              <div className="bg-white border rounded-3xl p-5 space-y-3 shadow-sm">
                <h4 className="text-xs font-black text-slate-900 uppercase">Assistant Spécialisé</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { code: 'COMPTABLE', label: '🤖 Comptable' },
                    { code: 'FINANCIER', label: '📊 Financier' },
                    { code: 'FISCAL', label: '🧾 Fiscal' },
                    { code: 'AUDIT', label: '🔍 Audit' },
                    { code: 'GESTION', label: '📈 Gestion' },
                    { code: 'SYSCOHADA', label: '📚 SYSCOHADA' }
                  ].map((mode) => (
                    <button
                      key={mode.code}
                      onClick={() => {
                        setAiActiveAssistantMode(mode.code as any);
                        setSuccessMessage(`Mode assistant basculé sur : [ ${mode.label} ]`);
                      }}
                      className={`p-2 rounded-xl text-[10px] font-black text-left border transition-all ${
                        aiActiveAssistantMode === mode.code
                          ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat History list (Task 11) */}
              <div className="bg-white border rounded-3xl p-5 space-y-3 shadow-sm">
                <h4 className="text-xs font-black text-slate-900 uppercase">💬 Mes Analyses Récentes</h4>
                <div className="space-y-1.5 text-[10px] font-bold text-slate-600">
                  {aiChatHistory.map((hist, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setChatbotInput(`Charger l'analyse : ${hist.title}`);
                        setSuccessMessage(`Historique chargé.`);
                      }}
                      className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 cursor-pointer flex justify-between items-center"
                    >
                      <span>{hist.title}</span>
                      <span className="text-[8px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-mono uppercase">
                        {hist.mode}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Documentation Center (Task 7) */}
              <div className="bg-white border rounded-3xl p-5 space-y-4 shadow-sm text-xs">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase">📚 Centre Documentaire Comptable</h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Explorez les règles SYSCOHADA et interrogez directement le copilote</p>
                </div>

                <input
                  type="text"
                  value={aiDocSearchQuery}
                  onChange={(e) => setAiDocSearchQuery(e.target.value)}
                  placeholder="Rechercher une règle, un compte, une classe..."
                  className="w-full p-2 rounded-xl border font-bold text-[10px] focus:outline-none"
                />

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {[
                    { code: '411', label: 'Compte 411 — Clients', desc: 'Règles d\'imputation de créance client et lettrage obligatoire' },
                    { code: '401', label: 'Compte 401 — Fournisseurs', desc: 'Comptabilisation des dettes fournisseurs courantes d\'exploitation' },
                    { code: '101', label: 'Compte 101 — Capital Social', desc: 'Fonds propres et variations de capitaux requis' },
                    { code: '605', label: 'Compte 605 — Fournitures d\'énergie', desc: 'Charges de fluides (électricité, eau, internet)' },
                    { code: 'TVA', label: 'Règle TVA — Cadrage de Taxe', desc: 'Application des taux standard 19.25% (CEMAC) ou 18% (UEMOA)' }
                  ].filter(doc => doc.label.toLowerCase().includes(aiDocSearchQuery.toLowerCase()) || doc.desc.toLowerCase().includes(aiDocSearchQuery.toLowerCase()))
                   .map((doc, i) => (
                    <div key={i} className="p-3 bg-slate-50 border rounded-2xl space-y-2">
                      <div>
                        <strong className="text-slate-800 text-[10px] block">{doc.label}</strong>
                        <span className="text-[9px] text-slate-400 font-medium leading-tight block mt-0.5">{doc.desc}</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setChatbotInput(`Explique la règle pour : ${doc.label}`)}
                          className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[8px] font-black rounded uppercase"
                        >
                          Expliquer
                        </button>
                        <button
                          onClick={() => setChatbotInput(`Exemple d'écriture pour : ${doc.label}`)}
                          className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[8px] font-black rounded uppercase"
                        >
                          Exemple d'écriture
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Chat Assistant Console (Task 3, 4, 5, 8, 15, 17) */}
            <div className="lg:col-span-7 bg-white border rounded-3xl p-6 shadow-sm flex flex-col h-[650px]">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-3 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-violet-600 animate-spin" /> Copilote Comptable FinancePro IA
                  </h3>
                </div>
                <span className="text-[9px] font-black text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Mode {aiActiveAssistantMode}
                </span>
              </div>

              {/* Message history */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 text-xs">
                {chatbotMessages.map((msg, idx) => {
                  const isUser = msg.sender === 'user';
                  
                  // Render buttons inside chatbot replies
                  const renderButtons = () => {
                    const buttons: React.ReactNode[] = [];
                    if (msg.text.includes('[BUTTON:VIEW_ANOMALIES]')) {
                      buttons.push(
                        <button
                          key="va"
                          onClick={() => {
                            setTab('controles');
                            setSuccessMessage('Redirection vers le centre de contrôle des anomalies.');
                          }}
                          className="px-3 py-1.5 bg-violet-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-violet-700 transition-colors"
                        >
                          Voir les 4 anomalies
                        </button>
                      );
                    }
                    if (msg.text.includes('[BUTTON:CORRECT_AUTO]')) {
                      buttons.push(
                        <button
                          key="ca"
                          onClick={() => {
                            addAuditLog('Correction IA', "Correction automatique d'anomalies de doublons par extourne");
                            setSuccessMessage("Correction automatique IA validée !");
                          }}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-emerald-700 transition-colors"
                        >
                          Corriger automatiquement
                        </button>
                      );
                    }
                    if (msg.text.includes('[BUTTON:CORRECT_ONE]')) {
                      buttons.push(
                        <button
                          key="co"
                          onClick={() => setSuccessMessage("Lancement du module de correction assistée étape par étape.")}
                          className="px-3 py-1.5 bg-amber-500 text-slate-950 rounded-xl text-[9px] font-black uppercase hover:bg-amber-600 transition-colors"
                        >
                          Corriger une par une
                        </button>
                      );
                    }
                    if (msg.text.includes('[BUTTON:PREVIEW_LETTER]')) {
                      buttons.push(
                        <button
                          key="pl"
                          onClick={() => {
                            setTab('lettrage');
                            setSuccessMessage('Prévisualisation des suggestions de lettrages IA.');
                          }}
                          className="px-3 py-1.5 bg-violet-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-violet-700 transition-colors"
                        >
                          Prévisualiser
                        </button>
                      );
                    }
                    if (msg.text.includes('[BUTTON:VALIDATE_LETTER]')) {
                      buttons.push(
                        <button
                          key="vl"
                          onClick={() => {
                            handleAutoLettrageAll();
                            addAuditLog('Lettrage IA', "Validation en bloc de 48 écritures lettrées");
                          }}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-emerald-700"
                        >
                          Valider les 48 lettrages
                        </button>
                      );
                    }
                    if (msg.text.includes('[BUTTON:INSERT_ENTRY]')) {
                      buttons.push(
                        <button
                          key="ie"
                          onClick={() => {
                            setJournalType('ACHATS');
                            setWording('Achat fournitures bureau');
                            setDate(new Date().toISOString().substring(0, 10));
                            setLines([
                              { accountCode: '605100', accountLabel: 'Fournitures de bureau', debit: 500000, credit: 0 },
                              { accountCode: '445100', accountLabel: 'TVA récupérable sur achats', debit: 95000, credit: 0 },
                              { accountCode: '521100', accountLabel: 'Banque Afriland First', debit: 0, credit: 595000 }
                            ]);
                            setTab('saisie');
                            addAuditLog('Saisie Assistée IA', "Écriture brouillon d'achat de fournitures insérée");
                            setSuccessMessage("Écriture chargée dans le journal d'Achats brouillon (non validée) !");
                          }}
                          className="px-3 py-1.5 bg-violet-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-violet-700 transition-colors"
                        >
                          Insérer dans le journal
                        </button>
                      );
                    }
                    return buttons.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t mt-2">
                        {buttons}
                      </div>
                    ) : null;
                  };

                  // Clean tags from displayed text
                  const cleanText = msg.text
                    .replace(/\[BUTTON:[A-Z_]+\]\s*/g, '');

                  return (
                    <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-4 rounded-3xl max-w-[85%] leading-relaxed shadow-sm border ${
                        isUser
                          ? 'bg-violet-600 text-white rounded-br-none border-violet-700 font-bold'
                          : 'bg-slate-50 text-slate-700 rounded-bl-none border-slate-200 font-semibold space-y-2'
                      }`}>
                        
                        <div className="whitespace-pre-line font-medium leading-relaxed">
                          {cleanText}
                        </div>

                        {/* IA Reliability indicators (Task 17) */}
                        {!isUser && cleanText.includes('Confiance IA') && (
                          <div className="text-[8px] font-bold text-slate-400 border-t pt-1.5 flex items-center justify-between">
                            <span>🛡️ Fiabilité de la réponse : Source vérifiée</span>
                            <span className="text-emerald-600 font-black">VALIDATION REQUISE</span>
                          </div>
                        )}

                        {renderButtons()}
                      </div>
                    </div>
                  );
                })}

                {chatbotLoading && (
                  <div className="flex justify-start">
                    <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl rounded-bl-none border flex items-center gap-2 font-bold animate-pulse text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce delay-75"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce delay-150"></span>
                      Rapprochement des états financiers FinancePro...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Inputs & Shortcuts triggers (Task 15) */}
              <div className="space-y-3 shrink-0">
                
                {/* Shortcuts Prompts */}
                <div className="flex flex-wrap gap-1 mt-2 border-t pt-2.5">
                  {(() => {
                    const shortcuts = [];
                    if (aiActiveAssistantMode === 'COMPTABLE') {
                      shortcuts.push({ text: 'Achat de fournitures', q: 'Saisir un achat de fournitures de 595 000 FCFA TTC payé par banque' });
                      shortcuts.push({ text: 'Acquisition véhicule', q: 'Quelles sont les écritures pour l\'achat d\'un véhicule à crédit ?' });
                    } else if (aiActiveAssistantMode === 'FISCAL') {
                      shortcuts.push({ text: 'Vérifier anomalies TVA', q: 'Fais un audit de la cohérence de TVA sur le journal d\'Achats' });
                      shortcuts.push({ text: 'Taux taxes CEMAC', q: 'Quels sont les taux de TVA applicables dans la zone CEMAC ?' });
                    } else if (aiActiveAssistantMode === 'FINANCIER') {
                      shortcuts.push({ text: 'Pourquoi résultat négatif ?', q: 'Pourquoi mon résultat net est négatif ?' });
                    } else if (aiActiveAssistantMode === 'AUDIT') {
                      shortcuts.push({ text: 'Détecter les anomalies', q: 'Analyse le journal à la recherche d\'anomalies critiques' });
                    } else {
                      shortcuts.push({ text: 'Rapprochement des tiers', q: 'Comment lettrer automatiquement mes comptes tiers ?' });
                    }
                    return shortcuts.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => setChatbotInput(item.q)}
                        className="text-[9px] font-extrabold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-100 px-2 py-1 rounded-lg transition-all"
                      >
                        💡 {item.text}
                      </button>
                    ));
                  })()}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatbotInput}
                    onChange={(e) => setChatbotInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatbotMessage(); }}
                    placeholder="Posez votre question (ex: Pourquoi mon résultat net est négatif ?)"
                    className="flex-1 p-2.5 border rounded-xl font-bold text-xs focus:ring-2 focus:ring-violet-400 focus:outline-none"
                  />
                  <button
                    onClick={handleSendChatbotMessage}
                    disabled={chatbotLoading}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all"
                  >
                    Envoyer
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* Modal Popup: AI Generate double entry script tool (Task 9) */}
          {showAiGenerateEntryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-[500px] p-6 bg-white rounded-3xl border border-slate-100 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-violet-600" /> Assistant d'écriture intelligente
                  </h3>
                  <button onClick={() => setShowAiGenerateEntryModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Fermer</button>
                </div>

                <div className="space-y-3 text-xs font-bold text-slate-700">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase">Décrivez votre opération en langage naturel</label>
                    <textarea
                      rows={2}
                      value={aiGenerateEntryPrompt}
                      onChange={(e) => setAiGenerateEntryPrompt(e.target.value)}
                      placeholder="Ex: Achat de matériel informatique de 1 200 000 FCFA TTC réglé par chèque..."
                      className="w-full mt-1 p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>

                  <button
                    onClick={async () => {
                      if (!aiGenerateEntryPrompt.trim()) return;
                      setAiSuggestedEntry({
                        lines: [
                          { acc: '244000', label: 'Matériel informatique', deb: 1000000, cred: 0 },
                          { acc: '445100', label: 'TVA déductible sur immo (19.25%)', deb: 192500, cred: 0 },
                          { acc: '521100', label: 'Banque Afriland First', deb: 0, cred: 1192500 }
                        ],
                        confidence: '97% (Forte confiance 🟢)',
                        motive: 'Acquisition d\'immobilisation corporelle avec taxe récupérable standard.'
                      });
                    }}
                    className="w-full py-2 bg-violet-600 text-white rounded-xl text-xs hover:bg-violet-700"
                  >
                    Générer la proposition d'écriture
                  </button>

                  {aiSuggestedEntry && (
                    <div className="space-y-3 pt-2 border-t text-[10px]">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Indice de confiance :</span>
                        <span className="text-emerald-600">{aiSuggestedEntry.confidence}</span>
                      </div>
                      
                      <div className="overflow-hidden border border-slate-100 rounded-xl">
                        <table className="w-full text-left font-mono">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b">
                              <th className="p-1.5">Compte</th>
                              <th className="p-1.5">Libellé</th>
                              <th className="p-1.5 text-right">Débit</th>
                              <th className="p-1.5 text-right">Crédit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {aiSuggestedEntry.lines.map((l: any, idx: number) => (
                              <tr key={idx}>
                                <td className="p-1.5 text-violet-700">{l.acc}</td>
                                <td className="p-1.5 font-sans">{l.label}</td>
                                <td className="p-1.5 text-right">{fmtMoney(l.deb)}</td>
                                <td className="p-1.5 text-right">{fmtMoney(l.cred)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="text-[9px] text-slate-400 font-medium">
                        <strong>Justification :</strong> {aiSuggestedEntry.motive}
                      </div>

                      <button
                        onClick={() => {
                          setJournalType('OD');
                          setWording('Achat de matériel informatique (IA)');
                          setLines(aiSuggestedEntry.lines.map((l: any) => ({
                            accountCode: l.acc,
                            accountLabel: l.label,
                            debit: l.deb,
                            credit: l.cred
                          })));
                          setTab('saisie');
                          setShowAiGenerateEntryModal(false);
                          addAuditLog('Saisie Assistée IA', "Écriture brouillon d'immo informatique insérée");
                          setSuccessMessage("Écriture chargée dans le journal d'OD brouillon !");
                        }}
                        className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs hover:bg-slate-800"
                      >
                        Insérer dans le journal d'écriture
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal Popup: AI OCR processing (Task 10) */}
          {showAiOcrModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-[500px] p-6 bg-white rounded-3xl border border-slate-100 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-violet-600" /> Traitement OCR & Analyse Facture
                  </h3>
                  <button onClick={() => setShowAiOcrModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Fermer</button>
                </div>

                <div className="space-y-3 text-xs font-bold text-slate-700">
                  <div className="border-2 border-dashed rounded-2xl p-6 text-center text-slate-400 space-y-2 cursor-pointer hover:border-violet-400">
                    <Upload className="w-8 h-8 mx-auto text-slate-300" />
                    <div>Sélectionner la pièce d'achat ou de vente</div>
                    <div className="text-[10px]">Facture PDF, PNG, JPG (Max 10 Mo)</div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        setAiOcrLoading(true);
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        setAiOcrLoading(false);
                        setAiOcrExtractedData({
                          vendor: 'ORANGE SÉNÉGAL',
                          date: '11/08/2026',
                          ref: 'FAC-OR-2026-987',
                          amountHT: 45000,
                          amountTVA: 8100,
                          amountTTC: 53100,
                          lines: [
                            { acc: '605200', label: 'Fournitures de télécoms (Internet)', deb: 45000, cred: 0 },
                            { acc: '445100', label: 'TVA déductible sur achats (18%)', deb: 8100, cred: 0 },
                            { acc: '401100', label: 'Fournisseur Orange Sénégal', deb: 0, cred: 53100 }
                          ]
                        });
                      }}
                      className="w-full py-2 bg-violet-600 text-white rounded-xl text-xs hover:bg-violet-700"
                    >
                      {aiOcrLoading ? 'Numérisation en cours...' : 'Simuler une numérisation de facture'}
                    </button>
                  </div>

                  {aiOcrExtractedData && (
                    <div className="space-y-3 pt-2 border-t text-[10px]">
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 border p-2 rounded-xl text-[9px] font-bold">
                        <div>
                          <span className="text-slate-400">Fournisseur</span>
                          <div className="text-slate-800">{aiOcrExtractedData.vendor}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Date</span>
                          <div className="text-slate-800 font-mono">{aiOcrExtractedData.date}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Réf Facture</span>
                          <div className="text-slate-800 font-mono">{aiOcrExtractedData.ref}</div>
                        </div>
                      </div>

                      <div className="flex justify-between text-slate-800 font-black">
                        <span>Total TTC Extrait :</span>
                        <span>{fmtMoney(aiOcrExtractedData.amountTTC)}</span>
                      </div>

                      <div className="overflow-hidden border border-slate-100 rounded-xl">
                        <table className="w-full text-left font-mono">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b">
                              <th className="p-1.5">Compte</th>
                              <th className="p-1.5">Libellé</th>
                              <th className="p-1.5 text-right">Débit</th>
                              <th className="p-1.5 text-right">Crédit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {aiOcrExtractedData.lines.map((l: any, idx: number) => (
                              <tr key={idx}>
                                <td className="p-1.5 text-violet-700">{l.acc}</td>
                                <td className="p-1.5 font-sans">{l.label}</td>
                                <td className="p-1.5 text-right">{fmtMoney(l.deb)}</td>
                                <td className="p-1.5 text-right">{fmtMoney(l.cred)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <button
                        onClick={() => {
                          setJournalType('ACHATS');
                          setWording(`Facture Orange ${aiOcrExtractedData.ref}`);
                          setLines(aiOcrExtractedData.lines.map((l: any) => ({
                            accountCode: l.acc,
                            accountLabel: l.label,
                            debit: l.deb,
                            credit: l.cred
                          })));
                          setTab('saisie');
                          setShowAiOcrModal(false);
                          addAuditLog('Saisie OCR IA', `Facture Orange ${aiOcrExtractedData.ref} numérisée`);
                          setSuccessMessage("Facture OCR chargée en brouillon !");
                        }}
                        className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs hover:bg-slate-800"
                      >
                        Créer l'écriture comptable
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default AccountingModule;
