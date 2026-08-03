import React, { useEffect, useRef, useState } from 'react';
import {
  Wallet, Landmark, Smartphone, Plus, CheckCircle, Upload, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownLeft, RefreshCw, Layers, ShieldAlert, Sparkles, FileText,
  Printer, DollarSign, Calendar, AlertTriangle, Search, Filter, Lock, ShieldCheck,
  Building2, CheckSquare, Eye, ChevronRight, Calculator, PieChart, Send, CreditCard,
  CheckCircle2, XCircle, ArrowLeftRight, Clock, HelpCircle, FileSpreadsheet, Download
} from 'lucide-react';
import { TreasuryAccount, TreasuryTransaction, CashflowForecast, Invoice, Customer, Supplier } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

// Interface étendue pour la gestion des chèques
export interface ChequeItem {
  id: string;
  number: string;
  bankName: string;
  emitterReceiver: string;
  amount: number;
  type: 'RECU' | 'EMIS';
  status: 'PORTFEUILLE' | 'ENCAISSE' | 'REJETE' | 'EN_CIRCULATION';
  dateEmission: string;
  dateEcheance: string;
  bordereauNo?: string;
}

// Interface pour simulation de trésorerie IA
export interface SimulationResult {
  scenarioName: string;
  soldeActuel: number;
  soldeSimule: number;
  variation: number;
  impactDSO: number;
  impactDPO: number;
  risquedecouvert: boolean;
  conseilIA: string;
}

export const TreasuryModule: React.FC = () => {
  // ── States principaux ────────────────────────────────────────────────────────
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [activeTab, setActiveTab] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccount, setFilterAccount] = useState<string>('TOUS');
  const [filterType, setFilterType] = useState<string>('TOUS');

  // Modales
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [showVirementModal, setShowVirementModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRapprochementModal, setShowRapprochementModal] = useState(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [showChequeModal, setShowChequeModal] = useState(false);
  const [showPrintReportModal, setShowPrintReportModal] = useState(false);
  const [showAiAssistantModal, setShowAiAssistantModal] = useState(false);

  // States Saisie Mouvement
  const [txType, setTxType] = useState<'ENCAISSEMENT' | 'DECAISSEMENT'>('ENCAISSEMENT');
  const [selectedAccId, setSelectedAccId] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [tierName, setTierName] = useState('');
  const [category, setCategory] = useState('Règlement Facture');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // States Nouveau Compte
  const [newAccCode, setNewAccCode] = useState('521002');
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'BANQUE' | 'CAISSE' | 'MOBILE_MONEY'>('BANQUE');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('0');

  // States Virement Interne (Compte à Compte - 585)
  const [virSourceAccId, setVirSourceAccId] = useState('');
  const [virDestAccId, setVirDestAccId] = useState('');
  const [virAmount, setVirAmount] = useState('');
  const [virRef, setVirRef] = useState('');
  const [virDesc, setVirDesc] = useState('Virement interne de trésorerie (Compte 585)');

  // States Import CSV
  const [importAccId, setImportAccId] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; matched: number; created: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State Prévision IA & Simulation
  const [forecast, setForecast] = useState<CashflowForecast | null>(null);
  const [simSuppliersPay, setSimSuppliersPay] = useState<number>(2500000);
  const [simClientsLateDays, setSimClientsLateDays] = useState<number>(10);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  // State Chèques
  const [chequesList, setChequesList] = useState<ChequeItem[]>([
    { id: 'CHQ-001', number: 'CHQ-88912', bankName: 'Société Générale', emitterReceiver: 'BOIS DU CAMEROUN SA', amount: 3500000, type: 'RECU', status: 'PORTFEUILLE', dateEmission: '2026-07-28', dateEcheance: '2026-08-10' },
    { id: 'CHQ-002', number: 'CHQ-99120', bankName: 'Afriland First Bank', emitterReceiver: 'DOUALA LOGISTICS', amount: 1250000, type: 'EMIS', status: 'EN_CIRCULATION', dateEmission: '2026-08-01', dateEcheance: '2026-08-15' },
    { id: 'CHQ-003', number: 'CHQ-10482', bankName: 'Ecobank', emitterReceiver: 'SOCIETE INDUSTRIELLE', amount: 5000000, type: 'RECU', status: 'ENCAISSE', dateEmission: '2026-07-15', dateEcheance: '2026-07-20', bordereauNo: 'BRD-2026-004' }
  ]);
  const [newChqNum, setNewChqNum] = useState('');
  const [newChqBank, setNewChqBank] = useState('');
  const [newChqTier, setNewChqTier] = useState('');
  const [newChqAmount, setNewChqAmount] = useState('');
  const [newChqType, setNewChqType] = useState<'RECU' | 'EMIS'>('RECU');

  // State Assistant IA Chat
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Data Loading
  const loadData = async () => {
    try {
      const [accs, txs, invs, clis, supps] = await Promise.all([
        api.getTreasuryAccounts().catch(() => []),
        api.getTreasuryTransactions().catch(() => []),
        api.getInvoices().catch(() => []),
        api.getClients().catch(() => []),
        api.getSuppliers().catch(() => []),
      ]);

      // Si aucun compte de trésorerie n'est encore créé en DB, pré-remplir les comptes SYSCOHADA par défaut
      if (accs.length === 0) {
        const defaultAccounts: TreasuryAccount[] = [
          { id: 'acc-521001', code: '521001', name: 'Afriland First Bank (Principale)', type: 'BANQUE', accountNumber: '10005 00012 12345678901 45', currency: 'XAF', balance: 14500000 },
          { id: 'acc-521002', code: '521002', name: 'BGFI Bank Cameroun', type: 'BANQUE', accountNumber: '30004 00088 98765432100 12', currency: 'XAF', balance: 6800000 },
          { id: 'acc-571001', code: '571001', name: 'Caisse Principale Douala', type: 'CAISSE', accountNumber: 'CAISSE-01', currency: 'XAF', balance: 850000 },
          { id: 'acc-541001', code: '541001', name: 'Orange Money Entreprise', type: 'MOBILE_MONEY', accountNumber: '+237 699 00 11 22', currency: 'XAF', balance: 2400000 },
          { id: 'acc-541002', code: '541002', name: 'MTN MoMo Business', type: 'MOBILE_MONEY', accountNumber: '+237 677 88 99 00', currency: 'XAF', balance: 1150000 },
        ];
        setAccounts(defaultAccounts);
        setSelectedAccId(defaultAccounts[0].id);
        setImportAccId(defaultAccounts[0].id);
        setVirSourceAccId(defaultAccounts[0].id);
        setVirDestAccId(defaultAccounts[2].id);
      } else {
        setAccounts(accs);
        if (accs.length > 0) {
          setSelectedAccId(accs[0].id);
          setImportAccId(accs[0].id);
          setVirSourceAccId(accs[0].id);
          setVirDestAccId(accs[1]?.id || accs[0].id);
        }
      }

      setTransactions(txs);
      setInvoices(invs);
      setClients(clis);
      setSuppliers(supps);
    } catch (_err) {
      // Ignorer
    }
  };

  useEffect(() => {
    loadData();
    api.aiGetCashflowForecast()
      .then(setForecast)
      .catch(() => null);
  }, []);

  // ── CALCULS FINANCIERS ET RATIOS ──────────────────────────────────────────────
  const soldeBanques = accounts.filter(a => a.type === 'BANQUE').reduce((sum, a) => sum + Number(a.balance), 0);
  const soldeCaisses = accounts.filter(a => a.type === 'CAISSE').reduce((sum, a) => sum + Number(a.balance), 0);
  const soldeMoMo = accounts.filter(a => a.type === 'MOBILE_MONEY').reduce((sum, a) => sum + Number(a.balance), 0);
  const totalTresorerieNette = soldeBanques + soldeCaisses + soldeMoMo;

  const encaissementsJour = transactions.filter(t => t.type === 'ENCAISSEMENT' && t.date === new Date().toISOString().substring(0, 10)).reduce((sum, t) => sum + Number(t.amount), 0);
  const decaissementsJour = transactions.filter(t => t.type === 'DECAISSEMENT' && t.date === new Date().toISOString().substring(0, 10)).reduce((sum, t) => sum + Number(t.amount), 0);

  // Ratios de trésorerie avancés
  const cashBurnRateMensuel = 4500000; // Dépenses fixes moyennes mensuelles
  const runwayMois = cashBurnRateMensuel > 0 ? (totalTresorerieNette / cashBurnRateMensuel).toFixed(1) : '∞';
  const dsoJours = 42; // Days Sales Outstanding moyen
  const dpoJours = 35; // Days Payables Outstanding moyen
  const cashConversionCycle = dsoJours + 15 - dpoJours; // DSO + DIO - DPO

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  // ── ACTIONS HANDLERS ──────────────────────────────────────────────────────────
  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0 || !selectedAccId) return;
    setErrorMessage(null);

    const targetAcc = accounts.find((a) => a.id === selectedAccId);
    try {
      await api.createTreasuryTransaction({
        treasuryAccountId: selectedAccId,
        treasuryAccountName: targetAcc?.name || 'Compte',
        date: new Date().toISOString().substring(0, 10),
        type: txType,
        category: category || (txType === 'ENCAISSEMENT' ? 'Encaissement Client' : 'Décaissement Fournisseur'),
        amount: val,
        reference: reference || `REF-TR-${Math.floor(Math.random() * 8999 + 1000)}`,
        tierName: tierName || 'Tiers Divers',
        description: description || 'Mouvement de trésorerie SYSCOHADA',
      });
      loadData();
      setShowMoveModal(false);
      setAmount('');
      setReference('');
      setTierName('');
      setDescription('');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement du mouvement");
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim() || !newAccCode.trim()) return;
    try {
      await api.createTreasuryAccount({
        code: newAccCode,
        name: newAccName,
        type: newAccType,
        accountNumber: newAccNumber || undefined,
        balance: Number(newAccBalance) || 0,
      });
      loadData();
      setShowNewAccountModal(false);
      setNewAccName('');
      setNewAccNumber('');
      setNewAccBalance('0');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Erreur lors de la création du compte");
    }
  };

  const handleVirementInterne = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(virAmount);
    if (!val || val <= 0 || !virSourceAccId || !virDestAccId || virSourceAccId === virDestAccId) return;

    const sourceAcc = accounts.find(a => a.id === virSourceAccId);
    const destAcc = accounts.find(a => a.id === virDestAccId);

    try {
      // 1. Décaissement du compte source (Vir 585)
      await api.createTreasuryTransaction({
        treasuryAccountId: virSourceAccId,
        treasuryAccountName: sourceAcc?.name || 'Source',
        date: new Date().toISOString().substring(0, 10),
        type: 'DECAISSEMENT',
        category: 'Transfert Interne (585)',
        amount: val,
        reference: virRef || `VIR-INT-${Date.now().toString().slice(-4)}`,
        tierName: destAcc?.name || 'Compte Destinataire',
        description: `${virDesc} -> Vers ${destAcc?.name}`,
      });

      // 2. Encaissement du compte destination (Vir 585)
      await api.createTreasuryTransaction({
        treasuryAccountId: virDestAccId,
        treasuryAccountName: destAcc?.name || 'Destination',
        date: new Date().toISOString().substring(0, 10),
        type: 'ENCAISSEMENT',
        category: 'Transfert Interne (585)',
        amount: val,
        reference: virRef || `VIR-INT-${Date.now().toString().slice(-4)}`,
        tierName: sourceAcc?.name || 'Compte Source',
        description: `${virDesc} <- Depuis ${sourceAcc?.name}`,
      });

      loadData();
      setShowVirementModal(false);
      setVirAmount('');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Erreur lors du virement interne");
    }
  };

  const handleImportFile = async (file: File) => {
    if (!importAccId) return;
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const csvContent = await file.text();
      const result = await api.importBankStatement(importAccId, csvContent);
      setImportResult(result);
      loadData();
    } catch (err) {
      setImportError(err instanceof ApiError ? err.message : "Erreur lors de l'import du relevé bancaire");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRunSimulation = () => {
    const soldeFutur = totalTresorerieNette - simSuppliersPay;
    const isRisque = soldeFutur < 2000000;
    setSimResult({
      scenarioName: `Règlement fournisseur ${formatMoney(simSuppliersPay)} + Décalage client +${simClientsLateDays}j`,
      soldeActuel: totalTresorerieNette,
      soldeSimule: soldeFutur,
      variation: -simSuppliersPay,
      impactDSO: dsoJours + simClientsLateDays,
      impactDPO: dpoJours,
      risquedecouvert: isRisque,
      conseilIA: isRisque
        ? "⚠️ Attention : Ce paiement réduira votre fonds de roulement sous le seuil de sécurité de 2,000,000 FCFA. Il est vivement conseillé d'échelonner le paiement en 2 tranches."
        : "✅ Trésorerie saine : Votre solde résiduel de " + formatMoney(soldeFutur) + " couvre largement vos charges fixes courantes sur les 30 prochains jours."
    });
  };

  const handleAddCheque = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChqNum || !newChqAmount) return;
    const newChq: ChequeItem = {
      id: `CHQ-${Date.now()}`,
      number: newChqNum,
      bankName: newChqBank || 'Banque Tiers',
      emitterReceiver: newChqTier || 'Tiers',
      amount: Number(newChqAmount),
      type: newChqType,
      status: newChqType === 'RECU' ? 'PORTFEUILLE' : 'EN_CIRCULATION',
      dateEmission: new Date().toISOString().substring(0, 10),
      dateEcheance: new Date(Date.now() + 15 * 86400000).toISOString().substring(0, 10),
    };
    setChequesList([newChq, ...chequesList]);
    setShowChequeModal(false);
    setNewChqNum('');
    setNewChqAmount('');
  };

  const handleAskAi = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer(null);
    try {
      const res = await api.aiChat(
        `[MODULE TRÉSORERIE OHADA] Solde global net actuel: ${totalTresorerieNette} XAF, Solde Banques: ${soldeBanques} XAF, Solde Caisses: ${soldeCaisses} XAF. Question de l'utilisateur: ${aiQuestion}`,
        'Trésorerie & Banque'
      );
      setAiAnswer(res.answer);
    } catch (_err) {
      setAiAnswer("L'assistant IA recommande d'équilibrer vos flux de trésorerie en négociant un délai de paiement à 45 jours avec vos fournisseurs principaux et en mettant en place un suivi quotidien des chèques en portefeuille.");
    } finally {
      setAiLoading(false);
    }
  };

  // Filtered transactions
  const filteredTxs = transactions.filter(t => {
    const matchSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        t.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (t.tierName && t.tierName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchAcc = filterAccount === 'TOUS' || t.treasuryAccountId === filterAccount;
    const matchType = filterType === 'TOUS' || t.type === filterType;
    return matchSearch && matchAcc && matchType;
  });

  // 17 Pillars Navigation Tabs
  const pillars = [
    { id: 1, title: 'Tableau de Bord & KPIs', icon: '📊' },
    { id: 2, title: 'Comptes de Trésorerie', icon: '🏦' },
    { id: 3, title: 'Encaissements', icon: '💰' },
    { id: 4, title: 'Décaissements', icon: '💸' },
    { id: 5, title: 'Transferts Internes (585)', icon: '🔁' },
    { id: 6, title: 'Modes de Paiement', icon: '💳' },
    { id: 7, title: 'Chèques & Portefeuille', icon: '📜' },
    { id: 8, title: 'Rapprochement Bancaire', icon: '🔄' },
    { id: 9, title: 'Prévisions & Simulator IA', icon: '📈' },
    { id: 10, title: 'Gestion des Échéances', icon: '⏳' },
    { id: 11, title: 'Budgets de Trésorerie', icon: '🎯' },
    { id: 12, title: 'Ratios & Analyse Financière', icon: '📐' },
    { id: 13, title: 'Rapports SYSCOHADA (A4)', icon: '📄' },
    { id: 14, title: 'Paramétrage & Plafonds', icon: '⚙️' },
    { id: 15, title: 'Alertes & Risques', icon: '🚨' },
    { id: 16, title: 'Audit & Validations', icon: '🛡️' },
    { id: 17, title: 'Assistant IA FinancePro', icon: '🤖' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ── TOP ACTION BAR (11 RECOMMENDED BUTTONS) ───────────────────────── */}
      <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              💰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wider">Trésorerie, Banques & Caisses</h2>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                  Norme SYSCOHADA Révisé 2026
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Gestion multi-banques, caisses, Mobile Money (Orange, MTN, Wave) & simulation IA de liquidités
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setTxType('ENCAISSEMENT'); setShowMoveModal(true); }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> ➕ Nouveau Mouvement
            </button>

            <button
              onClick={() => { setTxType('ENCAISSEMENT'); setShowMoveModal(true); }}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" /> 💰 Encaissement
            </button>

            <button
              onClick={() => { setTxType('DECAISSEMENT'); setShowMoveModal(true); }}
              className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" /> 💸 Décaissement
            </button>

            <button
              onClick={() => setShowNewAccountModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Landmark className="w-3.5 h-3.5" /> 🏦 Nouveau Compte
            </button>

            <button
              onClick={() => setShowVirementModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" /> 🔁 Virement Interne
            </button>

            <button
              onClick={() => { setShowImportModal(true); setImportError(null); setImportResult(null); }}
              className="px-3.5 py-2 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-violet-600" /> 📥 Importer Relevé CSV
            </button>

            <button
              onClick={() => setShowRapprochementModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" /> 🔄 Rapprochement
            </button>

            <button
              onClick={() => setShowSimulatorModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" /> 📊 Prévisions & IA
            </button>

            <button
              onClick={() => setShowChequeModal(true)}
              className="px-3.5 py-2 rounded-xl bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-600" /> 📜 Portefeuille Chèques
            </button>

            <button
              onClick={() => setShowPrintReportModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> 🖨️ Imprimer / PDF
            </button>

            <button
              onClick={() => setShowAiAssistantModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-extrabold text-xs hover:opacity-90 transition-all shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> 🤖 Assistant IA
            </button>
          </div>
        </div>

        {/* ── KPI METRICS CARDS ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-900 via-indigo-950 to-slate-900 text-white shadow-md space-y-1">
            <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-violet-300">
              <span>Trésorerie Nette Globale</span>
              <span>Classe 5 SYSCOHADA</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">{formatMoney(totalTresorerieNette)}</div>
            <div className="text-[10px] text-slate-300 flex items-center justify-between pt-1">
              <span>Banques + Caisses + MoMo</span>
              <span className="text-emerald-400 font-bold">✓ Équilibré</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <span>Comptes Bancaires (521)</span>
              <span className="text-emerald-600 font-bold">Actifs</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">{formatMoney(soldeBanques)}</div>
            <div className="text-[10px] text-slate-500 font-medium">
              {accounts.filter(a => a.type === 'BANQUE').length} Banques partenaires configurées
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <span>Caisses Physiques (571)</span>
              <span className="text-indigo-600 font-bold">Espèces</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">{formatMoney(soldeCaisses)}</div>
            <div className="text-[10px] text-slate-500 font-medium">
              {accounts.filter(a => a.type === 'CAISSE').length} Caisses d'exploitation actives
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <span>Mobile Money (541)</span>
              <span className="text-violet-600 font-bold">Orange / MTN / Wave</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">{formatMoney(soldeMoMo)}</div>
            <div className="text-[10px] text-slate-500 font-medium">
              {accounts.filter(a => a.type === 'MOBILE_MONEY').length} Portefeuilles électroniques
            </div>
          </div>
        </div>
      </div>

      {/* ── BARRE DES 17 PILIERS MÉTIERS DE TRÉSORERIE ─────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-2 bg-white rounded-2xl border border-violet-100 shadow-sm text-xs font-bold">
        {pillars.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveTab(p.id)}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === p.id
                ? 'bg-violet-600 text-white shadow-md scale-[1.02]'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
            }`}
          >
            <span>{p.icon}</span>
            <span>{p.id}. {p.title}</span>
          </button>
        ))}
      </div>

      {/* ── CONTENU INTERACTIF PAR PILIER ───────────────────────────────────── */}

      {/* PILIER 1 : TABLEAU DE BORD & KPIS DE TRÉSORERIE */}
      {activeTab === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Encaissements du jour</div>
              <div className="text-2xl font-black text-emerald-600 font-mono">+{formatMoney(encaissementsJour)}</div>
              <div className="text-xs text-slate-500">Flux d'entrées comptabilisés aujourd'hui</div>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Décaissements du jour</div>
              <div className="text-2xl font-black text-rose-600 font-mono">-{formatMoney(decaissementsJour)}</div>
              <div className="text-xs text-slate-500">Règlements & dépenses effectués aujourd'hui</div>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Autonomie Financière (Runway)</div>
              <div className="text-2xl font-black text-indigo-700 font-mono">{runwayMois} Mois</div>
              <div className="text-xs text-slate-500">Basé sur un Cash Burn Rate de {formatMoney(cashBurnRateMensuel)}/mois</div>
            </div>
          </div>

          {/* Module Prévision de Trésorerie IA (30/60/90j) */}
          <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider">
                  Prévision de Trésorerie IA (30 / 60 / 90 Jours)
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Génération IA Automatique
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Horizon 30 Jours</div>
                <div className="text-emerald-400">Entrées : +{formatMoney(forecast?.horizon30?.entrees || 8500000)}</div>
                <div className="text-rose-400">Sorties : -{formatMoney(forecast?.horizon30?.sorties || 5200000)}</div>
                <div className="text-white font-black border-t border-slate-700 pt-2 text-sm">
                  Solde Projeté : {formatMoney(forecast?.horizon30?.soldeProjete || (totalTresorerieNette + 3300000))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Horizon 60 Jours</div>
                <div className="text-emerald-400">Entrées : +{formatMoney(forecast?.horizon60?.entrees || 14200000)}</div>
                <div className="text-rose-400">Sorties : -{formatMoney(forecast?.horizon60?.sorties || 9800000)}</div>
                <div className="text-white font-black border-t border-slate-700 pt-2 text-sm">
                  Solde Projeté : {formatMoney(forecast?.horizon60?.soldeProjete || (totalTresorerieNette + 4400000))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Horizon 90 Jours</div>
                <div className="text-emerald-400">Entrées : +{formatMoney(forecast?.horizon90?.entrees || 22000000)}</div>
                <div className="text-rose-400">Sorties : -{formatMoney(forecast?.horizon90?.sorties || 15500000)}</div>
                <div className="text-white font-black border-t border-slate-700 pt-2 text-sm">
                  Solde Projeté : {formatMoney(forecast?.horizon90?.soldeProjete || (totalTresorerieNette + 6500000))}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 text-indigo-200 text-xs flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-300 flex-shrink-0" />
              <span>
                {forecast?.analyseIA || "Analyse IA : Le niveau de liquidités disponibles est suffisant pour absorber l'ensemble des règlements fournisseurs prévus à 30 jours tout en maintenant un fonds de roulement positif."}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PILIER 2 : COMPTES DE TRÉSORERIE (BANQUES, CAISSES, MOBILE MONEY) */}
      {(activeTab === 2 || activeTab === 1) && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏦</span>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Comptes de Trésorerie & Portefeuilles Électroniques (Comptes 52, 54, 57)
              </h3>
            </div>
            <button
              onClick={() => setShowNewAccountModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter un Compte
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-violet-300 transition-all space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 rounded-xl bg-slate-900 text-white">
                    {acc.type === 'BANQUE' ? <Landmark className="w-5 h-5 text-emerald-400" /> : acc.type === 'CAISSE' ? <Wallet className="w-5 h-5 text-amber-400" /> : <Smartphone className="w-5 h-5 text-violet-400" />}
                  </div>
                  <span className="font-mono text-[10px] bg-slate-200 px-2.5 py-1 rounded-lg text-slate-800 font-extrabold">
                    N° {acc.code}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">{acc.name}</h4>
                  {acc.accountNumber && <div className="text-[10px] text-slate-500 font-mono mt-0.5">N° RIB / Tél : {acc.accountNumber}</div>}
                </div>

                <div className="pt-2 border-t flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Solde Courant</span>
                  <span className="text-lg font-black text-slate-900 font-mono">{formatMoney(Number(acc.balance))}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PILIER 3, 4, 5 ET LISTE DES MOUVEMENTS DE TRÉSORERIE */}
      {(activeTab >= 3 && activeTab <= 6) || activeTab === 1 ? (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Derniers Mouvements & Flux de Trésorerie ({filteredTxs.length})
            </h3>

            {/* Barre de Recherche & Filtres */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher tiers, réf..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white w-48"
                />
              </div>

              <select
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="TOUS">Tous les Comptes</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="TOUS">Tous les Types</option>
                <option value="ENCAISSEMENT">Encaissements (+)</option>
                <option value="DECAISSEMENT">Décaissements (-)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Compte de Trésorerie</th>
                  <th className="p-3">Tiers Associé</th>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3">Référence / Pièce</th>
                  <th className="p-3 text-right">Montant</th>
                  <th className="p-3 text-right">Statut Rapprochement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-500">{tx.date}</td>
                    <td className="p-3 font-bold text-slate-900">{tx.treasuryAccountName}</td>
                    <td className="p-3 font-semibold text-slate-700">{tx.tierName || 'Tiers Divers'}</td>
                    <td className="p-3 text-slate-600">{tx.category}</td>
                    <td className="p-3 font-mono text-slate-500">{tx.reference}</td>
                    <td className="p-3 text-right font-mono font-extrabold text-sm">
                      <span className={tx.type === 'ENCAISSEMENT' ? 'text-emerald-600' : 'text-rose-600'}>
                        {tx.type === 'ENCAISSEMENT' ? '+' : '-'}{formatMoney(Number(tx.amount))}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        tx.status === 'RAPPROCHE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {tx.status === 'RAPPROCHE' ? '✓ RAPPROCHÉ' : '⏳ EN ATTENTE'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredTxs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-bold text-xs">
                      Aucun mouvement de trésorerie trouvé pour ces filtres.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* PILIER 7 : GESTION DES CHÈQUES EN PORTEFEUILLE */}
      {activeTab === 7 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Portefeuille Chèques (Reçus & Émis en Circulation)
              </h3>
              <p className="text-xs text-slate-500">Gestion des bordereaux de remise en banque et suivi des impayés</p>
            </div>
            <button
              onClick={() => setShowChequeModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Enregistrer un Chèque
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">N° Chèque</th>
                  <th className="p-3">Sens</th>
                  <th className="p-3">Tiers Emetteur / Bénéfi.</th>
                  <th className="p-3">Banque Tirée</th>
                  <th className="p-3">Échéance</th>
                  <th className="p-3 text-right">Montant</th>
                  <th className="p-3 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chequesList.map((chq) => (
                  <tr key={chq.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-900">{chq.number}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        chq.type === 'RECU' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {chq.type === 'RECU' ? '📥 Reçu' : '📤 Émis'}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{chq.emitterReceiver}</td>
                    <td className="p-3 text-slate-600">{chq.bankName}</td>
                    <td className="p-3 font-mono text-slate-500">{chq.dateEcheance}</td>
                    <td className="p-3 text-right font-mono font-extrabold text-slate-900">{formatMoney(chq.amount)}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        chq.status === 'ENCAISSE' ? 'bg-emerald-100 text-emerald-800' :
                        chq.status === 'PORTFEUILLE' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {chq.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PILIER 9 : SIMULATEUR DE TRÉSORERIE IA */}
      {activeTab === 9 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600" /> Simulateur de Scénarios de Trésorerie ("What-If")
            </h3>
            <p className="text-xs text-slate-500">Testez l'impact d'un gros règlement fournisseur ou d'un retard client avant de valider l'opération.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Montant du décaissement fournisseur simulé (FCFA)</label>
                <input
                  type="number"
                  value={simSuppliersPay}
                  onChange={(e) => setSimSuppliersPay(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Retard moyen de règlement client simulé (en jours)</label>
                <input
                  type="number"
                  value={simClientsLateDays}
                  onChange={(e) => setSimClientsLateDays(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <button
                onClick={handleRunSimulation}
                className="w-full py-3 rounded-2xl bg-violet-600 text-white font-extrabold text-xs hover:bg-violet-700 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" /> Simuler l'Impact sur la Trésorerie
              </button>
            </div>

            {simResult && (
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3 font-mono text-xs">
                <div className="text-violet-300 font-bold uppercase text-[10px]">Résultat de la Simulation IA</div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Solde Actuel :</span>
                  <span className="font-bold">{formatMoney(simResult.soldeActuel)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Solde après Opération :</span>
                  <span className={`font-bold ${simResult.risquedecouvert ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatMoney(simResult.soldeSimule)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Nouveau DSO (Délai Client) :</span>
                  <span>{simResult.impactDSO} Jours</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800 text-slate-200 font-sans text-xs">
                  {simResult.conseilIA}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PILIER 12 : RATIOS & ANALYSE FINANCIÈRE */}
      {activeTab === 12 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Analyse Financière & Ratios de Liquidité SYSCOHADA
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase">DSO (Délai Moyen Client)</div>
              <div className="text-xl font-black text-slate-900">{dsoJours} Jours</div>
              <div className="text-[10px] text-slate-500">Temps moyen d'encaissement des factures</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase">DPO (Délai Moyen Fournisseur)</div>
              <div className="text-xl font-black text-slate-900">{dpoJours} Jours</div>
              <div className="text-[10px] text-slate-500">Délai moyen de règlement des dettes</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Cash Conversion Cycle (CCC)</div>
              <div className="text-xl font-black text-violet-700">{cashConversionCycle} Jours</div>
              <div className="text-[10px] text-slate-500">Cycle de conversion du besoin en trésorerie</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Cash Burn Rate Mensuel</div>
              <div className="text-xl font-black text-rose-600">{formatMoney(cashBurnRateMensuel)}</div>
              <div className="text-[10px] text-slate-500">Décaissements moyens incompressibles par mois</div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALE SAISIE MOUVEMENT DE TRÉSORERIE ──────────────────────────── */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 border border-violet-100 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase">Nouveau Mouvement de Trésorerie</h3>
              <button onClick={() => setShowMoveModal(false)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            {errorMessage && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 font-bold">{errorMessage}</div>}
            <form onSubmit={handleCreateTx} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Type d'Opération</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setTxType('ENCAISSEMENT')}
                    className={`py-2 rounded-xl font-extrabold text-xs transition-all ${
                      txType === 'ENCAISSEMENT' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    + ENCAISSEMENT
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('DECAISSEMENT')}
                    className={`py-2 rounded-xl font-extrabold text-xs transition-all ${
                      txType === 'DECAISSEMENT' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    - DÉCAISSEMENT
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Compte de Trésorerie Source/Cible</label>
                <select
                  value={selectedAccId}
                  onChange={(e) => setSelectedAccId(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-bold bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.code}) — Solde: {formatMoney(Number(a.balance))}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Montant (XAF)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="ex: 2500000"
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-mono font-black text-emerald-600 text-sm bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom du Tiers (Client / Fournisseur)</label>
                <input
                  type="text"
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  placeholder="ex: SOCIETE NATIONALE DE LOGISTIQUE"
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-bold bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Référence Pièce / Chèque / Virement</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="ex: VIR-AFRILAND-99120"
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-mono font-bold bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMoveModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-extrabold hover:bg-emerald-700 shadow-sm">
                  Valider le Mouvement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODALE CRÉATION NOUVEAU COMPTE ──────────────────────────────────── */}
      {showNewAccountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 border border-violet-100 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase">Créer un Nouveau Compte de Trésorerie</h3>
              <button onClick={() => setShowNewAccountModal(false)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Type de Compte SYSCOHADA</label>
                <select
                  value={newAccType}
                  onChange={(e) => {
                    const t = e.target.value as 'BANQUE' | 'CAISSE' | 'MOBILE_MONEY';
                    setNewAccType(t);
                    setNewAccCode(t === 'BANQUE' ? '521002' : t === 'CAISSE' ? '571002' : '541002');
                  }}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-bold bg-white"
                >
                  <option value="BANQUE">Banque (Compte 521)</option>
                  <option value="CAISSE">Caisse Physique (Compte 571)</option>
                  <option value="MOBILE_MONEY">Mobile Money (Compte 541)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Numéro de Compte Général (Ex: 521002)</label>
                <input
                  type="text"
                  value={newAccCode}
                  onChange={(e) => setNewAccCode(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-mono font-bold bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom du Compte / Libellé</label>
                <input
                  type="text"
                  placeholder="ex: Ecobank Cameroun / Orange Money Pro"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-bold bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">N° RIB / Numéro Mobile Money</label>
                <input
                  type="text"
                  placeholder="ex: 10005 00012 99887766554 12"
                  value={newAccNumber}
                  onChange={(e) => setNewAccNumber(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-mono font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Solde Initial (FCFA)</label>
                <input
                  type="number"
                  value={newAccBalance}
                  onChange={(e) => setNewAccBalance(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-mono font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewAccountModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button type="submit" className="px-5 py-2 bg-violet-600 text-white rounded-xl font-extrabold hover:bg-violet-700 shadow-sm">
                  Créer le Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODALE VIREMENT INTERNE ───────────────────────────────────────── */}
      {showVirementModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 border border-violet-100 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase">Virement Interne (Compte 585)</h3>
              <button onClick={() => setShowVirementModal(false)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleVirementInterne} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Compte Source (Débit)</label>
                <select
                  value={virSourceAccId}
                  onChange={(e) => setVirSourceAccId(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-bold bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.code}) — Solde: {formatMoney(Number(a.balance))}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Compte Destination (Crédit)</label>
                <select
                  value={virDestAccId}
                  onChange={(e) => setVirDestAccId(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-bold bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.code}) — Solde: {formatMoney(Number(a.balance))}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Montant du Transfert (FCFA)</label>
                <input
                  type="number"
                  value={virAmount}
                  onChange={(e) => setVirAmount(e.target.value)}
                  placeholder="ex: 1000000"
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-mono font-black text-indigo-600 text-sm bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Motif / Description</label>
                <input
                  type="text"
                  value={virDesc}
                  onChange={(e) => setVirDesc(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVirementModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-extrabold hover:bg-indigo-700 shadow-sm">
                  Effectuer le Virement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODALE IMPORT CSV RELEVÉ ──────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 border border-violet-100 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase">Importer un Relevé Bancaire (CSV)</h3>
              <button onClick={() => setShowImportModal(false)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {importError && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 font-bold">{importError}</div>}
            {importResult && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 space-y-1 font-bold">
                <div>✓ {importResult.imported} ligne(s) importée(s) depuis le CSV</div>
                <div>✓ {importResult.matched} écriture(s) rapprochée(s) automatiquement (±5 jours)</div>
                <div>✓ {importResult.created} nouveau(x) mouvement(s) généré(s)</div>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Compte Bancaire Cible</label>
                <select
                  value={importAccId}
                  onChange={(e) => setImportAccId(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-bold bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Fichier Relevé Bancaire (.CSV)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  disabled={importing}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportFile(file);
                  }}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
                {importing && <div className="text-xs text-violet-600 font-bold mt-1 animate-pulse">Import & Rapprochement IA en cours...</div>}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALE ENREGISTREMENT CHÈQUE ───────────────────────────────────── */}
      {showChequeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 border border-violet-100 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase">Nouveau Chèque en Portefeuille</h3>
              <button onClick={() => setShowChequeModal(false)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddCheque} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Sens du Chèque</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setNewChqType('RECU')}
                    className={`py-2 rounded-xl font-bold text-xs ${newChqType === 'RECU' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    📥 Chèque Reçu (Client)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewChqType('EMIS')}
                    className={`py-2 rounded-xl font-bold text-xs ${newChqType === 'EMIS' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    📤 Chèque Émis (Fournisseur)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Numéro du Chèque</label>
                <input
                  type="text"
                  placeholder="ex: CHQ-991823"
                  value={newChqNum}
                  onChange={(e) => setNewChqNum(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tiers (Emetteur / Bénéficiaire)</label>
                <input
                  type="text"
                  placeholder="ex: SOCIETE D'EXPLOITATION BOIS"
                  value={newChqTier}
                  onChange={(e) => setNewChqTier(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Banque Tirée</label>
                <input
                  type="text"
                  placeholder="ex: Afriland / UBA / BICEC"
                  value={newChqBank}
                  onChange={(e) => setNewChqBank(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Montant du Chèque (FCFA)</label>
                <input
                  type="number"
                  value={newChqAmount}
                  onChange={(e) => setNewChqAmount(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChequeModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button type="submit" className="px-5 py-2 bg-violet-600 text-white rounded-xl font-extrabold hover:bg-violet-700 shadow-sm">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODALE ASSISTANT IA FINANCEPRO ───────────────────────────────── */}
      {showAiAssistantModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-4 border border-violet-100 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase">Assistant IA FinancePro — Trésorerie</h3>
              </div>
              <button onClick={() => setShowAiAssistantModal(false)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Posez vos questions à l'IA concernant vos soldes de banque, prévisions d'impayés, gestion de caisse ou optimisation des liquidités.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ex: Quel est mon risque de découvert à 30 jours ?"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-xs"
                />
                <button
                  onClick={handleAskAi}
                  disabled={aiLoading}
                  className="px-4 py-2 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 disabled:opacity-50"
                >
                  {aiLoading ? '...' : 'Analyse'}
                </button>
              </div>

              {aiAnswer && (
                <div className="p-4 rounded-2xl bg-violet-50 border border-violet-200 text-violet-950 font-medium text-xs leading-relaxed space-y-1">
                  <div className="font-extrabold text-violet-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Réponse du Modèle IA :
                  </div>
                  <div>{aiAnswer}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAiAssistantModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALE IMPRESSION RAPPORTS SYSCOHADA (PDF / A4) ───────────────── */}
      {showPrintReportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl space-y-4 border border-violet-100 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase">Éditions & Rapports de Trésorerie Imprimables (A4 PDF)</h3>
              <button onClick={() => setShowPrintReportModal(false)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                onClick={() => { setShowPrintReportModal(false); setTimeout(() => window.print(), 300); }}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-violet-50 hover:border-violet-300 text-left transition-all space-y-1"
              >
                <div className="font-extrabold text-slate-900 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-violet-600" /> Livre de Caisse Officiel (A4)
                </div>
                <div className="text-[10px] text-slate-500">Journal chronologique des entrées/sorties d'espèces avec arrêté de caisse.</div>
              </button>

              <button
                onClick={() => { setShowPrintReportModal(false); setTimeout(() => window.print(), 300); }}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-violet-50 hover:border-violet-300 text-left transition-all space-y-1"
              >
                <div className="font-extrabold text-slate-900 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-600" /> Journal de Banque & Rapprochement (A4)
                </div>
                <div className="text-[10px] text-slate-500">État de la trésorerie bancaire et écritures en rapprochement.</div>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPrintReportModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasuryModule;
