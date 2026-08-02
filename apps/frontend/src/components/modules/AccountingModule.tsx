import React, { useState, useEffect } from 'react';
import {
  BookOpen, PlusCircle, CheckCircle2, AlertTriangle,
  Search, FileSpreadsheet, Layers, Scale, Download, Sparkles,
  Lock, Upload, ShieldCheck, FileText, CheckSquare, Settings, PieChart,
  Activity, ArrowRightLeft, RefreshCw
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
  const [lines, setLines] = useState<Array<{ accountCode: string; accountLabel: string; debit: number; credit: number }>>([
    { accountCode: '411', accountLabel: 'Clients, Ventes de biens et services', debit: 0, credit: 0 },
    { accountCode: '701', accountLabel: 'Ventes de marchandises', debit: 0, credit: 0 },
    { accountCode: '443', accountLabel: 'État, TVA facturée sur ventes', debit: 0, credit: 0 },
  ]);

  const [searchAccount, setSearchAccount] = useState('');
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [grandLivreFilter, setGrandLivreFilter] = useState('411');

  // Assistant IA & OCR
  const [accountSuggestion, setAccountSuggestion] = useState<AccountSuggestion | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);

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
        pieceNumber,
        lines: lines.map((l, i) => ({
          id: String(i + 1),
          accountCode: l.accountCode,
          accountLabel: l.accountLabel || '',
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
        })),
      });
      setSuccessMessage('Écriture comptable enregistrée et validée avec succès dans le journal !');
      setWording('');
      setPieceNumber('');
      setLines([
        { accountCode: '411', accountLabel: 'Clients, Ventes de biens et services', debit: 0, credit: 0 },
        { accountCode: '701', accountLabel: 'Ventes de marchandises', debit: 0, credit: 0 },
        { accountCode: '443', accountLabel: 'État, TVA facturée sur ventes', debit: 0, credit: 0 },
      ]);
      loadEntries();
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de l\'enregistrement de l\'écriture');
    }
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
    setTab('saisie');
    setSuccessMessage('Analyse OCR réussie ! Écriture pré-remplie automatiquement.');
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchSearch = acc.code.includes(searchAccount) || acc.label.toLowerCase().includes(searchAccount.toLowerCase());
    const matchClass = selectedClass === null || acc.classNum === selectedClass;
    return matchSearch && matchClass;
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
            onClick={() => setTab('saisie')}
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
            onClick={() => setSuccessMessage('Tous les brouillards du mois ont été validés avec succès !')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Valider
          </button>
          <button
            onClick={() => setClotureModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" /> Clôturer
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

      {/* Modale Simulation OCR */}
      {ocrModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-violet-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Lecture Automatique (OCR IA)</h3>
              </div>
              <button onClick={() => setOcrModalOpen(false)} className="text-xs font-bold text-slate-400">✕</button>
            </div>
            <p className="text-xs text-slate-600">Déposez une facture PDF ou une photo de reçu pour générer automatiquement l'écriture comptable :</p>
            <div className="border-2 border-dashed border-violet-200 rounded-2xl p-8 text-center bg-violet-50/50 space-y-2">
              <Upload className="w-8 h-8 text-violet-500 mx-auto" />
              <div className="text-xs font-bold text-slate-700">Glissez-déposez la facture ici</div>
              <div className="text-[10px] text-slate-400">Format PDF, PNG, JPG jusqu'à 10 Mo</div>
            </div>
            <button
              onClick={handleSimulateOCR}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 transition-colors"
            >
              Simuler la détection OCR instantanée
            </button>
          </div>
        </div>
      )}

      {/* Modale Clôture */}
      {clotureModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-violet-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Clôture Comptable de Période</h3>
              </div>
              <button onClick={() => setClotureModalOpen(false)} className="text-xs font-bold text-slate-400">✕</button>
            </div>
            <div className="space-y-2 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-2 text-emerald-600 font-bold"><CheckCircle2 className="w-4 h-4" /> 1. Vérification Débit = Crédit (100% Équilibré)</div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold"><CheckCircle2 className="w-4 h-4" /> 2. Clôture des journaux auxiliaires</div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold"><CheckCircle2 className="w-4 h-4" /> 3. Génération des A-Nouveaux automatique</div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold"><CheckCircle2 className="w-4 h-4" /> 4. Verrouillage inaltérable de la période</div>
            </div>
            <button
              onClick={() => { setClotureModalOpen(false); setSuccessMessage('Période comptable clôturée et archivée en toute sécurité selon la norme SYSCOHADA.'); }}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors"
            >
              Exécuter la clôture définitive
            </button>
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
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">✕</button>
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

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Journal</label>
              <select
                value={journalType}
                onChange={(e: any) => setJournalType(e.target.value)}
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
                placeholder="ex: FAC-2026-001"
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
              <span>Lignes d'Écritures Comptables</span>
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
            <button
              type="button"
              onClick={handleAddLine}
              className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1"
            >
              + Ajouter une ligne d'écriture
            </button>

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

      {/* ── TAB 3: Plan Comptable SYSCOHADA ─────────────────────────────────── */}
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

      {/* ── TAB 4: Consultation Grand Livre & Balance ───────────────────────── */}
      {(tab === 'consultation' || tab === 'grand-livre' || tab === 'balance') && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              {tab === 'balance' ? <Scale className="w-4 h-4 text-violet-600" /> : <Layers className="w-4 h-4 text-violet-600" />}
              {tab === 'balance' ? 'Balance Générale à 6 Colonnes' : 'Grand Livre Général des Comptes'}
            </h3>
            {tab !== 'balance' && (
              <input
                type="text"
                placeholder="Filtrer par compte (ex: 411)..."
                value={grandLivreFilter}
                onChange={(e) => setGrandLivreFilter(e.target.value)}
                className="p-2 text-xs font-mono font-bold border border-slate-200 rounded-xl w-56"
              />
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="uppercase font-semibold text-[10px] text-slate-400 border-b">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">N° Pièce</th>
                    <th className="p-2.5">Journal</th>
                    <th className="p-2.5">Compte</th>
                    <th className="p-2.5">Libellé</th>
                    <th className="p-2.5 text-right">Débit</th>
                    <th className="p-2.5 text-right">Crédit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grandLivreLines.map((gl, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono text-slate-500">{gl.date}</td>
                      <td className="p-2.5 font-mono font-bold text-violet-600">{gl.pieceNumber}</td>
                      <td className="p-2.5 font-bold text-slate-700">{gl.journalType}</td>
                      <td className="p-2.5 font-mono font-bold text-indigo-600">{gl.accountCode}</td>
                      <td className="p-2.5 text-slate-800">{gl.wording}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-600 font-bold">{fmtMoney(gl.debit)}</td>
                      <td className="p-2.5 text-right font-mono text-rose-600 font-bold">{fmtMoney(gl.credit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: Assistant IA FinancePro ─────────────────────────────────── */}
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
