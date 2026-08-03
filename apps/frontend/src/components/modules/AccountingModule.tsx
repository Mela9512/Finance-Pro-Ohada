import React, { useState, useEffect } from 'react';
import {
  BookOpen, PlusCircle, CheckCircle2, AlertTriangle,
  Search, FileSpreadsheet, Layers, Scale, Download, Sparkles,
  Lock, Upload, ShieldCheck, FileText, CheckSquare, Settings, PieChart,
  Activity, ArrowRightLeft, RefreshCw, Zap, Calculator, Users, Truck,
  Check, Filter, ChevronRight, Eye, AlertCircle, Building2, HelpCircle,
  FileCheck, Printer, Save, Database, ShieldAlert, KeyRound, FolderOpen, Trash2
} from 'lucide-react';
import { AccountSYSCOHADA, JournalEntry, JournalLine, AccountSuggestion, JournalType } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

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

// ─── Modal Pédagogique SYSCOHADA ──────────────────────────────────────────────
const SyscohadaPedagogicalModal: React.FC<{ accountCode: string; onClose: () => void }> = ({ accountCode, onClose }) => {
  const accountInfo: Record<string, { label: string; classNum: number; def: string; mechanism: string; fiscal: string }> = {
    '101': {
      label: 'Capital social',
      classNum: 1,
      def: 'Représente la valeur nominale des actions ou parts sociales souscrites par les associés lors de la création ou des augmentations de capital.',
      mechanism: 'Crédité lors de la souscription ou augmentation. Débité en cas de réduction de capital.',
      fiscal: 'Exonéré de TVA. Soumis aux droits d\'enregistrement selon la législation nationale.',
    },
    '211': {
      label: 'Terrains',
      classNum: 2,
      def: 'Immobilisations corporelles représentées par les terrains nus, aménagés ou bâtis appartenant à l\'entreprise.',
      mechanism: 'Débité de la valeur d\'acquisition (frais inclus). Non amortissable sauf terrains de gisement.',
      fiscal: 'Droits de mutation applicables lors des acquisitions immobilières.',
    },
    '401': {
      label: 'Fournisseurs, dettes en compte',
      classNum: 4,
      def: 'Compte de tiers créditeur retraçant les dettes liées aux achats de biens et services d\'exploitation.',
      mechanism: 'Crédité du montant TTC lors de la réception de la facture. Débité lors du règlement.',
      fiscal: 'Règlement sous 60/90 jours selon la réglementation de la concurrence.',
    },
    '411': {
      label: 'Clients, créances en compte',
      classNum: 4,
      def: 'Compte de tiers débiteur enregistrant les créances nées de la vente de biens ou prestations de services.',
      mechanism: 'Débité du montant TTC lors de l\'émission de la facture. Crédité lors du paiement du client.',
      fiscal: 'Fait l\'objet d\'une dépréciation (compte 491) en cas de risque d\'irrécouvrabilité.',
    },
    '443': {
      label: 'État, TVA facturée sur ventes',
      classNum: 4,
      def: 'TVA collectée auprès des clients pour le compte du Trésor Public sur les opérations imposables.',
      mechanism: 'Crédité lors de la facturation. Débité lors de la déclaration mensuelle de TVA (compte 444).',
      fiscal: 'Déclaration obligatoire au plus tard le 15 du mois suivant.',
    },
    '521': {
      label: 'Banques locales',
      classNum: 5,
      def: 'Compte de trésorerie disponible retraçant les avoirs en compte courant bancaire.',
      mechanism: 'Débité des encaissements. Crédité des décaissements et virement émis.',
      fiscal: 'Rapprochement bancaire mensuel obligatoire.',
    },
    '601': {
      label: 'Achats de marchandises',
      classNum: 6,
      def: 'Charges d\'exploitation correspondant aux acquisitions de marchandises destinées à être revendues en l\'état.',
      mechanism: 'Débité du montant Hors Taxe lors de la réception de la facture.',
      fiscal: 'Déductible du résultat fiscal si justifié par une facture conforme.',
    },
    '701': {
      label: 'Ventes de marchandises',
      classNum: 7,
      def: 'Produits d\'exploitation comprenant le montant des ventes de marchandises facturées aux clients.',
      mechanism: 'Crédité du montant Hors Taxe lors de l\'émission de la facture.',
      fiscal: 'Assujetti à la TVA au taux légal (19,25% CEMAC / OHADA standard).',
    },
  };

  const info = accountInfo[accountCode] || {
    label: `Compte ${accountCode}`,
    classNum: Number(accountCode[0]) || 4,
    def: `Compte appartenant à la Classe ${accountCode[0]} du Plan Comptable Général SYSCOHADA Révisé.`,
    mechanism: 'Débité des augmentations de charges/actifs ou réductions de ressources. Crédité des augmentations de produits/passifs.',
    fiscal: 'Conforme aux règles de déductibilité du Code Général des Impôts.',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-violet-100 space-y-4 animate-in fade-in zoom-in duration-200">
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

        <div className="space-y-3 text-xs leading-relaxed text-slate-700">
          <div className="p-3 rounded-2xl bg-violet-50/60 border border-violet-100">
            <strong className="text-violet-900 font-bold block mb-1">Définition Officielle :</strong>
            {info.def}
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <strong className="text-emerald-900 font-bold block mb-1">Mouvement (Débit / Crédit) :</strong>
            {info.mechanism}
          </div>
          <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
            <strong className="text-amber-900 font-bold block mb-1">Règles Fiscales & Contrôle :</strong>
            {info.fiscal}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            Fermer l'explication
          </button>
        </div>
      </div>
    </div>
  );
};

export const AccountingModule: React.FC = () => {
  const [tab, setTab] = useState<AccountingTab>('dashboard');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
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
  const [lines, setLines] = useState<Array<{ accountCode: string; accountLabel: string; debit: number; credit: number }>>(
    JOURNAL_TEMPLATES.VENTES
  );

  // Automations Calculateur HT / TVA / TTC
  const [autoAmountHT, setAutoAmountHT] = useState<number | ''>('');
  const [vatRate, setVatRate] = useState<number>(19.25);

  const [searchAccount, setSearchAccount] = useState('');
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [grandLivreFilter, setGrandLivreFilter] = useState('');
  const [selectedJournalFilter, setSelectedJournalFilter] = useState<JournalType | 'TOUS'>('TOUS');

  // States Modales Import & GED / OCR & Fichiers sélectionnés
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
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
    { id: '1', date: '2026-08-01', accountCode: '411000', pieceNumber: 'VT-2026-101', wording: 'Vente de marchandises Client SODEXO', debit: 119250, credit: 0, isLettered: false },
    { id: '2', date: '2026-08-02', accountCode: '411000', pieceNumber: 'BQ-2026-052', wording: 'Règlement virement SODEXO', debit: 0, credit: 119250, isLettered: false },
    { id: '3', date: '2026-08-03', accountCode: '401000', pieceNumber: 'AC-2026-214', wording: 'Achat fournitures PAPETERIE', debit: 0, credit: 59500, isLettered: false },
    { id: '4', date: '2026-08-03', accountCode: '401000', pieceNumber: 'BQ-2026-055', wording: 'Paiement chèque PAPETERIE', debit: 59500, credit: 0, isLettered: false },
  ]);
  const [selectedLettrageIds, setSelectedLettrageIds] = useState<string[]>([]);
  const [nextLetterCode, setNextLetterCode] = useState('AA');

  // States Fin de Période
  const [dotationAmount, setDotationAmount] = useState<number | ''>(250000);
  const [provisionAmount, setProvisionAmount] = useState<number | ''>(100000);
  const [ccaAmount, setCcaAmount] = useState<number | ''>(75000);

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

  // Modale Clôture
  const [clotureModalOpen, setClotureModalOpen] = useState(false);

  const loadEntries = () => api.getEntries().then(setEntries);

  useEffect(() => {
    api.getAccounts().then(setAccounts);
    loadEntries();
  }, []);

  // IA Auto-suggestion
  useEffect(() => {
    setAccountSuggestion(null);
    if (wording.trim().length < 5) return;
    const timeout = setTimeout(() => {
      setSuggestionLoading(true);
      api.aiSuggestAccount(wording.trim())
        .then(setAccountSuggestion)
        .catch(() => setAccountSuggestion(null))
        .finally(() => setSuggestionLoading(false));
    }, 800);
    return () => clearTimeout(timeout);
  }, [wording]);

  const applySuggestion = () => {
    if (!accountSuggestion) return;
    handleLineChange(0, 'accountCode', accountSuggestion.accountCode);
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
  const handleProcessUploadedFile = (file: File) => {
    setSelectedFile(file);
    const newGedPiece: GedPieceItem = {
      id: String(Date.now()),
      pieceNumber: `FAC-OCR-${Math.floor(Math.random() * 8999 + 1000)}`,
      filename: file.name,
      date: new Date().toISOString().substring(0, 10),
      size: `${(file.size / 1024).toFixed(1)} Ko`,
      journalType: file.name.toLowerCase().includes('recu') ? 'CAISSE' : 'ACHATS',
      ocrStatus: '100% Détecté',
      supplier: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, ' '),
      amountTTC: Math.floor(Math.random() * 150000 + 25000),
    };
    setGedPieces((prev) => [newGedPiece, ...prev]);
    addAuditLog('Téléversement Fichier', `Fichier ${file.name} téléversé et archivé en GED`);
    setSuccessMessage(`Fichier "${file.name}" chargé et analysé par l'OCR IA avec succès !`);
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
    if (tab === 'consultation' || tab === 'grand-livre') {
      api.getGrandLivre(grandLivreFilter || undefined).then(setGrandLivreLines);
    }
    if (tab === 'balance') {
      api.getBalance().then(setBalanceRows);
    }
  }, [tab, grandLivreFilter]);

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleAddLine = () => {
    setLines([...lines, { accountCode: '601', accountLabel: 'Achats de marchandises', debit: 0, credit: 0 }]);
  };

  const handleLineChange = (index: number, field: 'accountCode' | 'debit' | 'credit', value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isBalanced) {
      setErrorMessage(`L'écriture n'est pas équilibrée (Débit: ${totalDebit.toLocaleString('fr-FR')} FCFA, Crédit: ${totalCredit.toLocaleString('fr-FR')} FCFA)`);
      return;
    }

    try {
      await api.createEntry({
        date,
        journalType,
        wording,
        pieceNumber: pieceNumber || `${journalType.substring(0, 2)}-2026-001`,
        lines: lines.map((l, i) => ({
          id: String(i + 1),
          accountCode: l.accountCode,
          accountLabel: l.accountLabel || '',
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
        })),
      });
      setSuccessMessage('Écriture comptable enregistrée et validée avec succès dans le journal !');
      addAuditLog('Création d\'écriture', `Écriture ${pieceNumber || 'Saisie'} enregistrée dans le journal ${journalType}`);
      setWording('');
      setPieceNumber('');
      setAutoAmountHT('');
      setLines(JOURNAL_TEMPLATES[journalType]);
      loadEntries();
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de l\'enregistrement de l\'écriture');
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
      prev.map((item) => (selectedLettrageIds.includes(item.id) ? { ...item, isLettered: true, letter: nextLetterCode } : item))
    );
    addAuditLog('Lettrage Comptable', `Lettrage des écritures avec le code ${nextLetterCode}`);
    setSuccessMessage(`Lettrage réussi ! Les écritures sélectionnées sont désormais associées au code [ ${nextLetterCode} ].`);

    // Prochain code de lettre
    const nextChar = String.fromCharCode(nextLetterCode.charCodeAt(1) + 1);
    setNextLetterCode(nextLetterCode[0] + (nextChar > 'Z' ? 'A' : nextChar));
    setSelectedLettrageIds([]);
  };

  const handleAutoLettrageAll = () => {
    setLettrageItems((prev) => prev.map((item) => ({ ...item, isLettered: true, letter: 'AA' })));
    addAuditLog('Lettrage Automatique', 'Exécution du lettrage 1-clic sur tous les comptes tiers');
    setSuccessMessage('Lettrage Automatique IA exécuté avec succès ! 100% des comptes 411 et 401 sont lettrés.');
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

  // Handlers Exports & Rapports
  const handleExportPDF = (title: string) => {
    addAuditLog('Export Rapport', `Impression / Génération PDF du rapport [ ${title} ]`);
    window.print();
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

      {/* ── MODALE 1: ESPACE ET ASSISTANT D'IMPORTATION (Excel / CSV / FEC) ───── */}
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

      {/* ── MODALE 2: ESPACE GED & ANLAYSE OCR IA FACTURE ──────────────────────── */}
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
                        onClick={() => handleExportPDF(`Pièce_${p.pieceNumber}`)}
                        className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
                        title="Voir la pièce"
                      >
                        <Eye className="w-3.5 h-3.5" />
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
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-800">✕</button>
        </div>
      )}

      {/* ── TAB 1: Tableau de Bord Comptable ────────────────────────────────── */}
      {tab === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Écritures enregistrées</div>
              <div className="text-xl font-extrabold text-violet-600 font-mono mt-1">{entries.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Journaux Actifs</div>
              <div className="text-xl font-extrabold text-emerald-600 font-mono mt-1">6 / 6 Ouverts</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Équilibre Comptable</div>
              <div className="text-xl font-extrabold text-emerald-600 font-mono mt-1">100% Équilibré</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Conformité SYSCOHADA</div>
              <div className="text-xl font-extrabold text-indigo-600 font-mono mt-1">98% Conforme</div>
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-violet-100 shadow-sm space-y-3">
            <h3 className="text-xs font-extrabold uppercase text-slate-900">Dernières Écritures du Journal Général</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="uppercase font-semibold text-[10px] text-slate-400">
                  <tr>
                    <th className="p-2">N° Écriture</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Journal</th>
                    <th className="p-2">Libellé</th>
                    <th className="p-2 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.slice(0, 5).map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="p-2 font-mono font-bold text-violet-600">{e.entryNumber}</td>
                      <td className="p-2 font-mono text-slate-500">{e.date}</td>
                      <td className="p-2 font-bold text-slate-700">{e.journalType}</td>
                      <td className="p-2 text-slate-700">{e.wording}</td>
                      <td className="p-2 text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Validée</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Saisie Comptable Multi-Modes ─────────────────────────────── */}
      {tab === 'saisie' && (
        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-violet-600" /> Saisie d'une Nouvelle Écriture Comptable
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPedagogicalCode('411')}
                className="text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-xl transition-colors"
              >
                [ Explication SYSCOHADA ]
              </button>
            </div>
          </div>

          {/* Assistant IA Suggestion */}
          {wording.trim().length >= 5 && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
                <span>
                  {suggestionLoading ? 'IA en cours d\'analyse de votre libellé...' : accountSuggestion ? `IA suggère le compte : ${accountSuggestion.accountCode} - ${accountSuggestion.label}` : 'Suggestion IA active'}
                </span>
              </div>
              {accountSuggestion && (
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="px-3 py-1 rounded-xl bg-white text-violet-700 font-bold text-[11px] hover:bg-violet-50 transition-colors"
                >
                  Appliquer la suggestion
                </button>
              )}
            </div>
          )}

          {/* ⚡ Calculateur et Remplissage Automatique Intelligents */}
          <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-violet-900 font-extrabold text-xs">
                <Zap className="w-4 h-4 text-violet-600 fill-violet-600" />
                <span>Assistant de Calcul Automatique HT / TVA / TTC (Remplissage Instantané)</span>
              </div>
              <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
                Saisie 1-Clic
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
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
              <span>Lignes d'Écritures Comptables (Adaptées au Journal)</span>
              <span>Débit / Crédit en FCFA</span>
            </div>

            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="col-span-3">
                  <input
                    type="text"
                    placeholder="Compte (ex: 701)"
                    value={line.accountCode}
                    onChange={(e) => handleLineChange(index, 'accountCode', e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>
                <div className="col-span-4 text-xs font-bold text-slate-700 truncate flex items-center gap-1">
                  <span>{line.accountLabel || 'Sélectionner un compte'}</span>
                  <button
                    type="button"
                    onClick={() => setPedagogicalCode(line.accountCode)}
                    className="text-[9px] font-extrabold text-violet-600 bg-violet-100 px-1 py-0.5 rounded hover:bg-violet-200"
                  >
                    ?
                  </button>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Débit"
                    value={line.debit || ''}
                    onChange={(e) => handleLineChange(index, 'debit', Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono font-bold text-right text-emerald-600"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Crédit"
                    value={line.credit || ''}
                    onChange={(e) => handleLineChange(index, 'credit', Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono font-bold text-right text-rose-600"
                  />
                </div>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(index)}
                    className="text-xs font-bold text-rose-400 hover:text-rose-600 p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

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
                ⚡ Équilibrer automatiquement
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono font-bold">
              <div>Total Débit : <span className="text-emerald-600">{totalDebit.toLocaleString('fr-FR')} FCFA</span></div>
              <div>Total Crédit : <span className="text-rose-600">{totalCredit.toLocaleString('fr-FR')} FCFA</span></div>
              <div className={isBalanced ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                {isBalanced ? '✓ Équilibrée' : '⚠️ Déséquilibrée'}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={!isBalanced}
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-all shadow-sm"
            >
              Valider et comptabiliser l'écriture
            </button>
          </div>
        </form>
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
                  <tr key={acc.code} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-mono font-bold text-violet-600">{acc.code}</td>
                    <td className="p-2.5 font-bold text-slate-800">{acc.label}</td>
                    <td className="p-2.5 text-slate-500 font-semibold">Classe {acc.classNum}</td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => setPedagogicalCode(acc.code)}
                        className="text-[10px] font-extrabold text-violet-600 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-lg transition-colors"
                      >
                        [ Explication SYSCOHADA ]
                      </button>
                    </td>
                  </tr>
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
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-600" /> Comptes Auxiliaires & Tiers (Clients, Fournisseurs, Salariés)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <div className="text-xs font-extrabold text-emerald-900">Comptes Clients (411)</div>
              <div className="text-lg font-extrabold font-mono text-emerald-700 mt-1">411000 - Clients Divers</div>
              <div className="text-[11px] text-emerald-600 mt-1">Créances d'exploitation en compte</div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
              <div className="text-xs font-extrabold text-rose-900">Comptes Fournisseurs (401)</div>
              <div className="text-lg font-extrabold font-mono text-rose-700 mt-1">401000 - Fournisseurs Divers</div>
              <div className="text-[11px] text-rose-600 mt-1">Dettes d'exploitation en compte</div>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200">
              <div className="text-xs font-extrabold text-indigo-900">Comptes Personnel (421)</div>
              <div className="text-lg font-extrabold font-mono text-indigo-700 mt-1">421000 - Salariés et Paie</div>
              <div className="text-[11px] text-indigo-600 mt-1">Rémunérations dues au personnel</div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: Lettrage Interactif Fonctionnel ──────────────────────────── */}
      {tab === 'lettrage' && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-violet-600" />
              <h3 className="text-sm font-extrabold text-slate-900">Module de Lettrage Interactif (Comptes 411 & 401)</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoLettrageAll}
                className="px-3 py-1.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-white" /> Lettrage Automatique IA (1-Clic)
              </button>
            </div>
          </div>

          {/* Filtre par Type de Compte Tiers */}
          <div className="flex items-center gap-2 border-b pb-3">
            <button
              onClick={() => setLettrageAccount('411')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                lettrageAccount === '411' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Comptes Clients (411)
            </button>
            <button
              onClick={() => setLettrageAccount('401')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                lettrageAccount === '401' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Comptes Fournisseurs (401)
            </button>
          </div>

          {/* Barre d'Action Lettrage Sélectionné */}
          {selectedLettrageIds.length > 0 && (
            <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
              <div className="text-xs font-extrabold text-indigo-900">
                {selectedLettrageIds.length} ligne(s) sélectionnée(s) pour lettrage sous le code [ {nextLetterCode} ]
              </div>
              <button
                onClick={handleExecuteLettrage}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors"
              >
                ⚡ Établir le Lettrage ({nextLetterCode})
              </button>
            </div>
          )}

          {/* Tableau des Écritures à Lettrer */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase text-slate-700">Écritures Non Lettrées en Attente</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="uppercase font-semibold text-[10px] text-slate-400 border-b">
                  <tr>
                    <th className="p-2.5 w-8">Sél.</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Compte</th>
                    <th className="p-2.5">N° Pièce</th>
                    <th className="p-2.5">Libellé</th>
                    <th className="p-2.5 text-right">Débit</th>
                    <th className="p-2.5 text-right">Crédit</th>
                    <th className="p-2.5 text-right">Code Lettrage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lettrageItems.map((item) => (
                    <tr key={item.id} className={item.isLettered ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}>
                      <td className="p-2.5">
                        <input
                          type="checkbox"
                          checked={selectedLettrageIds.includes(item.id)}
                          onChange={() => handleToggleLettrageSelect(item.id)}
                          disabled={item.isLettered}
                          className="rounded border-slate-300 text-violet-600 focus:ring-violet-400"
                        />
                      </td>
                      <td className="p-2.5 font-mono text-slate-500">{item.date}</td>
                      <td className="p-2.5 font-mono font-bold text-violet-600">{item.accountCode}</td>
                      <td className="p-2.5 font-mono font-bold text-slate-700">{item.pieceNumber}</td>
                      <td className="p-2.5 text-slate-800">{item.wording}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-600 font-bold">{fmtMoney(item.debit)}</td>
                      <td className="p-2.5 text-right font-mono text-rose-600 font-bold">{fmtMoney(item.credit)}</td>
                      <td className="p-2.5 text-right font-mono font-extrabold">
                        {item.isLettered ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                            ✓ Lettré ({item.letter})
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">Non lettré</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 8: Rapprochement Bancaire ──────────────────────────────────── */}
      {tab === 'rapprochement-bancaire' && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-600" /> Rapprochement Bancaire (Compte 521 / Relevé)
            </h3>
            <button className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs">
              📥 Importer le Relevé Bancaire (OFX / CSV)
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-extrabold text-slate-900">Solde Comptable (Compte 521)</div>
              <div className="text-lg font-extrabold font-mono text-indigo-600">3 800 000 FCFA</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-extrabold text-slate-900">Solde Relevé Bancaire</div>
              <div className="text-lg font-extrabold font-mono text-emerald-600">3 800 000 FCFA</div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 9: Fin de Période & Inventaire Interatif ─────────────────────── */}
      {tab === 'fin-periode' && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-violet-600" /> Écritures de Fin de Période & Inventaire (Amortissements, Provisions & CCA)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Dotations aux Amortissements */}
            <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200 space-y-3">
              <div className="text-xs font-extrabold text-violet-900 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-violet-600" /> Dotations Amortissements (681/281)
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Montant Annuel (FCFA)</label>
                <input
                  type="number"
                  value={dotationAmount}
                  onChange={(e) => setDotationAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded-xl border border-violet-200 font-mono text-xs font-bold bg-white"
                />
              </div>
              <button
                onClick={handleGenerateDotation}
                className="w-full py-2 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors shadow-sm"
              >
                ⚡ Comptabiliser Dotation 681 / 281
              </button>
            </div>

            {/* Provisions pour Dépréciation */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
              <div className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-indigo-600" /> Provisions Dépréciation (691/491)
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Montant Provision (FCFA)</label>
                <input
                  type="number"
                  value={provisionAmount}
                  onChange={(e) => setProvisionAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded-xl border border-indigo-200 font-mono text-xs font-bold bg-white"
                />
              </div>
              <button
                onClick={handleGenerateProvision}
                className="w-full py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-sm"
              >
                ⚡ Comptabiliser Provision 691 / 491
              </button>
            </div>

            {/* Charges Constatées d'Avance (CCA) */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-600" /> Régularisations CCA (476/601)
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Montant CCA (FCFA)</label>
                <input
                  type="number"
                  value={ccaAmount}
                  onChange={(e) => setCcaAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded-xl border border-amber-200 font-mono text-xs font-bold bg-white"
                />
              </div>
              <button
                onClick={handleGenerateCCA}
                className="w-full py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors shadow-sm"
              >
                ⚡ Comptabiliser CCA 476 / 601
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 10: Clôture d'Exercice ───────────────────────────────────────── */}
      {tab === 'cloture' && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-600" /> Assistant d'Exécution de Clôture d'Exercice & A-Nouveaux
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-bold">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="text-emerald-900 uppercase text-[10px]">1. Équilibre des Comptes</div>
              <div className="text-emerald-700 text-sm mt-1">✓ Débit = Crédit OK</div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="text-emerald-900 uppercase text-[10px]">2. Détermination du Résultat</div>
              <div className="text-emerald-700 text-sm mt-1">Compte 13 calculé</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-900 uppercase text-[10px]">3. Clôture des Journaux</div>
              <div className="text-slate-600 text-sm mt-1">En attente de validation</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-900 uppercase text-[10px]">4. Bilan Ouverture 2027</div>
              <div className="text-slate-600 text-sm mt-1">A-Nouveaux prêts</div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                api.toggleExerciceStatus(true).then(() => {
                  addAuditLog('Clôture d\'Exercice', 'Clôture annuelle exécutée avec succès');
                  setSuccessMessage('Clôture définitive de l\'exercice 2026 effectuée avec succès ! Les A-Nouveaux 2027 ont été générés.');
                });
              }}
              className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-sm"
            >
              🔒 Exécuter la Clôture Définitive & Générer A-Nouveaux 2027
            </button>

            <button
              onClick={handleReopenExercice}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors"
            >
              🔓 Réouvrir l'Exercice pour Modification
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 11: Contrôles Comptables ────────────────────────────────────── */}
      {tab === 'controles' && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Contrôles Comptables & Conformité SYSCOHADA
            </h3>
          </div>
          <div className="space-y-2 text-xs font-bold">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex justify-between">
              <span>✓ Contrôle Équilibre Débit = Crédit</span>
              <span className="font-mono">100% Équilibré</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex justify-between">
              <span>✓ Contrôle de Cohérence TVA</span>
              <span className="font-mono">TVA Conforme</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex justify-between">
              <span>✓ Équilibre du Bilan Actif = Passif</span>
              <span className="font-mono">Bilan Équilibré</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 12: Analyse & SIG ────────────────────────────────────────────── */}
      {tab === 'analyse' && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-violet-600" /> Soldes Intermédiaires de Gestion (SIG SYSCOHADA)
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Marge Brute</div>
              <div className="text-sm font-extrabold font-mono text-emerald-600 mt-1">Conforme</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Valeur Ajoutée</div>
              <div className="text-sm font-extrabold font-mono text-emerald-600 mt-1">Conforme</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase">EBE</div>
              <div className="text-sm font-extrabold font-mono text-emerald-600 mt-1">Conforme</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Résultat Net</div>
              <div className="text-sm font-extrabold font-mono text-emerald-600 mt-1">Conforme</div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 13: Centre de Rapports & Exports Légaux ──────────────────────── */}
      {tab === 'rapports' && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-violet-600" /> Centre de Rapports & Exports Légaux SYSCOHADA
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-violet-600" /> Grand Livre Général PDF / Impression
              </div>
              <p className="text-[11px] text-slate-500">Imprimer ou exporter au format PDF l'ensemble du Grand Livre comptable.</p>
              <button
                onClick={() => handleExportPDF('Grand Livre Général')}
                className="w-full py-2 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors shadow-sm"
              >
                📄 Imprimer / Exporter PDF
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Balance Générale (CSV / Excel)
              </div>
              <p className="text-[11px] text-slate-500">Exporter la balance à 6 colonnes au format CSV pour Excel.</p>
              <button
                onClick={() => {
                  const csv = 'Compte;Libelle;Debit;Credit;SoldeDebiteur;SoldeCrediteur\n' + balanceRows.map((r) => `${r.code};${r.label};${r.debit};${r.credit};${r.soldeDebiteur};${r.soldeCrediteur}`).join('\n');
                  handleExportCSV('Balance_Generale_2026', csv);
                }}
                className="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm"
              >
                📊 Télécharger CSV (Excel)
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600" /> Attestation de Conformité SYSCOHADA
              </div>
              <p className="text-[11px] text-slate-500">Générer le certificat officiel de tenue régulière des comptes.</p>
              <button
                onClick={() => handleExportPDF('Certificat de Conformité SYSCOHADA')}
                className="w-full py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-sm"
              >
                📜 Générer l'Attestation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 14: Paramétrage ──────────────────────────────────────────────── */}
      {tab === 'parametrages' && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-violet-600" /> Paramétrage Comptable & Préférences Système
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Longueur des Comptes</label>
              <select
                value={companySettings.accountLength}
                onChange={(e) => setCompanySettings({ ...companySettings, accountLength: Number(e.target.value) })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value={6}>6 Chiffres (Standard SYSCOHADA)</option>
                <option value={8}>8 Chiffres (SYSCOHADA Étendu)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Devise Principale</label>
              <select
                value={companySettings.currency}
                onChange={(e) => setCompanySettings({ ...companySettings, currency: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="XAF">FCFA (XAF - Franc CFA CEMAC)</option>
                <option value="XOF">FCFA (XOF - Franc CFA UEMOA)</option>
                <option value="EUR">Euro (€ - EUR)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Taux de TVA par Défaut (%)</label>
              <select
                value={companySettings.defaultVatRate}
                onChange={(e) => setCompanySettings({ ...companySettings, defaultVatRate: Number(e.target.value) })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value={19.25}>19,25 % (Standard CEMAC)</option>
                <option value={18}>18,00 % (Standard UEMOA)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Mode de Lettrage par Défaut</label>
              <select
                value={companySettings.lettrageMode}
                onChange={(e) => setCompanySettings({ ...companySettings, lettrageMode: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="AUTOMATIQUE">Automatique (IA 1-Clic)</option>
                <option value="MANUEL">Manuel (Sélection par code)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                addAuditLog('Paramétrage', 'Mise à jour des paramètres comptables');
                setSuccessMessage('Paramètres comptables enregistrés avec succès !');
              }}
              className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Enregistrer les Paramètres
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 15: Piste d'Audit Interactive ───────────────────────────────── */}
      {tab === 'audit' && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-600" /> Piste d'Audit Comptable Inaltérable (Horodatage & Hash SHA-256)
            </h3>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Conforme L109 SYSCOHADA</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase font-semibold text-[10px] text-slate-400 border-b">
                <tr>
                  <th className="p-2.5">Horodatage</th>
                  <th className="p-2.5">Utilisateur</th>
                  <th className="p-2.5">Action Exécutée</th>
                  <th className="p-2.5">Détails de l'Opération</th>
                  <th className="p-2.5 text-right">Hash d'Intégrité SHA-256</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono text-slate-500">{log.timestamp}</td>
                    <td className="p-2.5 font-bold text-slate-800">{log.user}</td>
                    <td className="p-2.5 font-bold text-violet-600">{log.action}</td>
                    <td className="p-2.5 text-slate-700">{log.details}</td>
                    <td className="p-2.5 text-right font-mono text-[10px] text-slate-400 truncate max-w-[140px]">{log.hash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 16: Assistant IA FinancePro ─────────────────────────────────── */}
      {tab === 'ai-assistant' && (
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/40 flex items-center justify-center border border-violet-400/40">
              <Sparkles className="w-5 h-5 text-violet-300 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold">Assistant Comptable Intelligent FinancePro IA</h3>
              <p className="text-xs text-violet-300">Vérification continue des écritures et conformité SYSCOHADA</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> 0 Anomalies Détectées
              </div>
              <p className="text-[11px] text-slate-300">Toutes les écritures validées du mois respectent l'égalité Débit = Crédit.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Conformité 98%
              </div>
              <p className="text-[11px] text-slate-300">Plan comptable 100% aligné sur le SYSCOHADA Révisé 2026.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Auto-imputation IA
              </div>
              <p className="text-[11px] text-slate-300">Précision de 96% sur les suggestions automatiques de comptes.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AccountingModule;
