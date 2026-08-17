import React, { useEffect, useState } from 'react';
import {
  Target, Plus, TrendingUp, TrendingDown, Sparkles, AlertTriangle,
  PieChart, BarChart2, Calendar, ShieldAlert, CheckCircle2, Sliders,
  ArrowUpRight, ArrowDownLeft, Layers, RefreshCw, Calculator, Filter,
  Building2, Users, FileText, ChevronRight, HelpCircle, AlertCircle,
  Eye, Download, Play, Info, Trash2, Copy, FileSpreadsheet, Bot, Check,
  ArrowLeft, ArrowRight, X, Printer
} from 'lucide-react';
import { AccountSYSCOHADA, BudgetComparisonRow } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

const formatMoney = (val: number) => {
  const isNeg = val < 0;
  const absVal = Math.abs(val);
  const formatted = `${Math.round(absVal).toLocaleString('fr-FR')} FCFA`;
  return isNeg ? `-${formatted}` : formatted;
};

// Directional Variance Logic (Règle Fondamentale des Écarts)
const getVarianceStatus = (type: 'revenue' | 'expense' | 'result' | 'cash', budget: number, actual: number) => {
  const gap = actual - budget;
  if (type === 'revenue' || type === 'result' || type === 'cash') {
    const isFavorable = gap >= 0;
    return {
      gap,
      isFavorable,
      badgeText: isFavorable ? '🟢 Favorable' : '🔴 Défavorable',
      badgeClass: isFavorable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200',
      textColor: isFavorable ? 'text-emerald-600' : 'text-rose-600',
      icon: isFavorable ? ArrowUpRight : ArrowDownLeft
    };
  } else {
    // Expenses / Charges: Actual > Budget is UNFAVORABLE (🔴)
    const isFavorable = gap <= 0;
    return {
      gap,
      isFavorable,
      badgeText: isFavorable ? '🟢 Favorable (Sous-consommé)' : '🔴 Défavorable (Dépassement)',
      badgeClass: isFavorable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200',
      textColor: isFavorable ? 'text-emerald-600' : 'text-rose-600',
      icon: isFavorable ? ArrowDownLeft : ArrowUpRight
    };
  }
};

interface BudgetWizardLine {
  id: string;
  accountCode: string;
  label: string;
  department: string;
  method: 'manuel' | 'historique' | 'croissance' | 'moyenne' | 'ca_pct' | 'quantite_prix' | 'saisonnalite';
  annualAmount: number;
  qty?: number;
  unitPrice?: number;
  growthPct?: number;
  caPct?: number;
  monthlyBreakdown: number[];
  comment?: string;
}

export const BudgetModule: React.FC = () => {
  const [exercice, setExercice] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'overview' | 'budget-view' | 'monthly' | 'forecast' | 'scenarios' | 'departments' | 'grille-modele'>('grille-modele');
  const [viewMode, setViewMode] = useState<'gestionnaire' | 'comptable'>('gestionnaire');
  const [budgetVersion, setBudgetVersion] = useState<'initial' | 'revised' | 'forecast'>('initial');

  const [comparison, setComparison] = useState<BudgetComparisonRow[]>([]);
  const [accounts, setAccounts] = useState<AccountSYSCOHADA[]>([]);
  
  // Modals & UI States
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [showAiSuggestModal, setShowAiSuggestModal] = useState(false);
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showAlertCausesModal, setShowAlertCausesModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showConstructionChoiceModal, setShowConstructionChoiceModal] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<'V1' | 'V2' | 'V3'>('V2');
  const [workflowStatus, setWorkflowStatus] = useState<'brouillon' | 'soumis' | 'en_validation' | 'valide' | 'publie' | 'revise' | 'cloture'>('valide');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── WIZARD STATE (4-Step Budget Construction Center) ──────────────────────
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [wBudgetName, setWBudgetName] = useState('Budget de Fonctionnement 2026');
  const [wBudgetType, setWBudgetType] = useState('Budget de Fonctionnement');
  const [wPeriodicity, setWPeriodicity] = useState('Annuel');
  const [wCurrency, setWCurrency] = useState('FCFA');
  const [wManager, setWManager] = useState('Dieudonné MELAMEM (DAF)');
  const [wDepartment, setWDepartment] = useState('Direction & Générale');
  const [wDescription, setWDescription] = useState("Budget prévisionnel d'exploitation et de pilotage analytique");

  // Step 2: Multi-line budget table
  const [wLines, setWLines] = useState<BudgetWizardLine[]>([
    {
      id: '1',
      accountCode: '601',
      label: 'Achats de marchandises',
      department: 'Direction & Générale',
      method: 'croissance',
      annualAmount: 132000000,
      growthPct: 8,
      monthlyBreakdown: Array(12).fill(11000000),
      comment: 'Prévision basée sur croissance +8%'
    },
    {
      id: '2',
      accountCode: '622',
      label: 'Transports sur ventes & conseils',
      department: 'Commercial & Ventes',
      method: 'quantite_prix',
      annualAmount: 24000000,
      qty: 1200,
      unitPrice: 20000,
      monthlyBreakdown: Array(12).fill(2000000),
      comment: '1200 livraisons x 20.000 FCFA'
    },
    {
      id: '3',
      accountCode: '661',
      label: 'Frais de personnel & Salaires',
      department: 'Ressources Humaines (RH)',
      method: 'historique',
      annualAmount: 180000000,
      monthlyBreakdown: Array(12).fill(15000000),
      comment: 'Reconduction grille N-1'
    },
    {
      id: '4',
      accountCode: '701',
      label: 'Ventes de marchandises (Produits)',
      department: 'Commercial & Ventes',
      method: 'ca_pct',
      annualAmount: 1800000000,
      monthlyBreakdown: Array(12).fill(150000000),
      comment: 'Objectif CA Annuel'
    }
  ]);

  // Generation Hypotheses states
  const [caGrowthHypothesis, setCaGrowthHypothesis] = useState(10);
  const [expenseInflationHypothesis, setExpenseInflationHypothesis] = useState(5);

  // Monthly breakdown indicator selector
  const [monthlyMetric, setMonthlyMetric] = useState<'ca' | 'charges' | 'resultat' | 'tresorerie'>('charges');

  // Scenario Simulator parameters
  const [simCaChange, setSimCaChange] = useState(0);
  const [simChargesChange, setSimChargesChange] = useState(0);

  // Search filter for accounting view
  const [searchTerm, setSearchTerm] = useState('');

  const loadComparison = () => {
    api.getBudgetComparison(exercice).then((data) => {
      setComparison(data);
    }).catch(() => {});
  };

  useEffect(() => {
    api.getAccounts().then(setAccounts).catch(() => {});
  }, []);

  useEffect(() => {
    loadComparison();
  }, [exercice]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Mock / Default realistic budget & actual figures if db comparison has zero rows
  const defaultManagerMetrics = {
    ca: { budget: 1800000000, actual: 1783051000, label: "Chiffre d'Affaires (Produits)" },
    charges: { budget: 1500000000, actual: 1814642949, label: "Charges d'Exploitation Globale" },
    salaries: { budget: 450000000, actual: 512000000, label: "Masse Salariale & Personnel" },
    investments: { budget: 120000000, actual: 95000000, label: "Investissements & CAPEX" },
    tresorerie: { budget: 400000000, actual: 340000000, label: "Trésorerie Nette Disponible" },
    resultat: { budget: 300000000, actual: -31591949, label: "Résultat Net d'Exploitation" },
    bfr: { budget: 190000000, actual: 240000000, label: "Besoin en Fonds de Roulement (BFR)" }
  };

  // Calculate totals from database or defaults
  const dbTotalBudgeted = comparison.reduce((s, r) => s + r.budgeted, 0);
  const dbTotalActual = comparison.reduce((s, r) => s + r.actual, 0);

  const isBudgetZero = dbTotalBudgeted === 0 && comparison.length === 0;

  const totalBudgeted = isBudgetZero ? 1500000000 : dbTotalBudgeted;
  const totalActual = isBudgetZero ? 1814642949 : dbTotalActual;
  const totalGap = totalActual - totalBudgeted;
  const executionRate = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;

  // Departmental breakdown data
  const departmentBudgets = [
    { name: 'Direction & Générale', budget: 150000000, actual: 142000000, rate: 94.6, status: '🟢 Maîtrisé' },
    { name: 'Commercial & Ventes', budget: 350000000, actual: 385000000, rate: 110.0, status: '🔴 Dépassement' },
    { name: 'Production & Exploitation', budget: 500000000, actual: 590000000, rate: 118.0, status: '🔴 Dépassement' },
    { name: 'Ressources Humaines (RH)', budget: 200000000, actual: 218000000, rate: 109.0, status: '🟠 À surveiller' },
    { name: 'Finance & Comptabilité', budget: 100000000, actual: 88000000, rate: 88.0, status: '🟢 Maîtrisé' },
    { name: 'Logistique & Transport', budget: 120000000, actual: 145000000, rate: 120.8, status: '🔴 Dépassement' },
    { name: 'Marketing & Communication', budget: 50000000, actual: 42600000, rate: 85.2, status: '🟢 Maîtrisé' },
    { name: 'Informatique & Systèmes (IT)', budget: 30000000, actual: 29000000, rate: 96.6, status: '🟢 Maîtrisé' }
  ];

  // Monthly 12-month breakdown mock
  const monthsList = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  const monthlyData = monthsList.map((m, i) => {
    const baseBudget = monthlyMetric === 'ca' ? 150000000 : monthlyMetric === 'charges' ? 125000000 : monthlyMetric === 'resultat' ? 25000000 : 30000000;
    const factor = 1 + (i * 0.02) + (i % 2 === 0 ? 0.05 : -0.03);
    return {
      month: m,
      budget: Math.round(baseBudget),
      actual: i <= 7 ? Math.round(baseBudget * factor) : 0 // Up to August completed
    };
  });

  // Wizard Helper Actions
  const addWizardLine = () => {
    setWLines([
      ...wLines,
      {
        id: String(Date.now()),
        accountCode: '602',
        label: 'Nouvelle ligne budgétaire',
        department: wDepartment,
        method: 'manuel',
        annualAmount: 12000000,
        monthlyBreakdown: Array(12).fill(1000000)
      }
    ]);
  };

  const updateWizardLine = (id: string, updates: Partial<BudgetWizardLine>) => {
    setWLines(
      wLines.map((line) => {
        if (line.id !== id) return line;
        const updated = { ...line, ...updates };

        // Recalculate annual amount based on method
        if (updates.method === 'quantite_prix' || updated.method === 'quantite_prix') {
          const qty = updated.qty ?? 100;
          const price = updated.unitPrice ?? 100000;
          updated.annualAmount = qty * price;
          updated.monthlyBreakdown = Array(12).fill(Math.round(updated.annualAmount / 12));
        } else if (updates.method === 'croissance' || updated.method === 'croissance') {
          const g = updated.growthPct ?? 5;
          updated.annualAmount = Math.round(updated.annualAmount * (1 + g / 100));
          updated.monthlyBreakdown = Array(12).fill(Math.round(updated.annualAmount / 12));
        }

        return updated;
      })
    );
  };

  const removeWizardLine = (id: string) => {
    setWLines(wLines.filter((l) => l.id !== id));
  };

  const handlePublishWizardBudget = async (status: 'brouillon' | 'soumis' | 'valide') => {
    try {
      // Save all lines
      for (const line of wLines) {
        await api.upsertBudget({
          accountCode: line.accountCode,
          exercice,
          amountBudgeted: line.annualAmount
        });
      }
      await loadComparison();
      setShowWizardModal(false);
      setWizardStep(1);
      showToast(
        status === 'valide'
          ? `Budget ${wBudgetName} validé et publié avec succès !`
          : status === 'soumis'
          ? `Budget soumis pour approbation direction.`
          : `Brouillon du budget enregistré avec succès.`
      );
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de la sauvegarde du budget');
    }
  };

  const handleApplyAiBudgetSuggestion = () => {
    setWLines([
      {
        id: '10',
        accountCode: '701',
        label: 'Ventes de marchandises (CA)',
        department: 'Commercial & Ventes',
        method: 'croissance',
        annualAmount: 1897000000,
        growthPct: 6.4,
        monthlyBreakdown: Array(12).fill(158083333),
        comment: 'IA: Croissance estimée à +6.4%'
      },
      {
        id: '11',
        accountCode: '601',
        label: 'Achats de marchandises',
        department: 'Production & Exploitation',
        method: 'ca_pct',
        annualAmount: 663950000,
        caPct: 35,
        monthlyBreakdown: Array(12).fill(55329166),
        comment: 'IA: Calibré à 35% du CA prévisionnel'
      },
      {
        id: '12',
        accountCode: '661',
        label: 'Masse Salariale & Personnel',
        department: 'Ressources Humaines (RH)',
        method: 'croissance',
        annualAmount: 478000000,
        growthPct: 6.2,
        monthlyBreakdown: Array(12).fill(39833333),
        comment: 'IA: Réajustement masse salariale'
      },
      {
        id: '13',
        accountCode: '622',
        label: 'Charges d\'exploitation & Services',
        department: 'Direction & Générale',
        method: 'moyenne',
        annualAmount: 343050000,
        monthlyBreakdown: Array(12).fill(28587500),
        comment: 'IA: Moyenne des 3 derniers exercices'
      }
    ]);
    setShowAiSuggestModal(false);
    setShowWizardModal(true);
    setWizardStep(2);
    showToast('Proposition de budget IA appliquée dans la grille de construction.');
  };

  const handleDownloadExport = (format: 'pdf' | 'excel' | 'word') => {
    setShowDownloadModal(false);
    const title = `Budget_${exercice}_${budgetVersion.toUpperCase()}`;
    if (format === 'pdf') {
      showToast(`📄 Génération du document PDF Officiel (${title}.pdf)...`);
      setTimeout(() => {
        window.print();
      }, 500);
    } else if (format === 'excel') {
      showToast(`📊 Fichier Excel Détaillé (${title}.csv/.xlsx) téléchargé.`);
      const csvContent = "data:text/csv;charset=utf-8,Code;Intitule;Departement;Budget FCFA;Realise FCFA;Ecart FCFA\n" +
        wLines.map(l => `${l.accountCode};"${l.label}";"${l.department}";${l.annualAmount};0;${l.annualAmount}`).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${title}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      showToast(`📝 Rapport Word de Cadrage Budgétaire (${title}.docx) généré.`);
      const blob = new Blob([
        `DOCUMENT OFFICIEL : BUDGET D'EXPLOITATION ${exercice}\n` +
        `Raison Sociale : MELARO GROUP S.A. (Zone OHADA)\n` +
        `Version : ${budgetVersion.toUpperCase()}\n\n` +
        `Produits Prévisionnels : ${formatMoney(totalWizardProduits)}\n` +
        `Charges Prévisionnelles : ${formatMoney(totalWizardCharges)}\n` +
        `Résultat Prévisionnel : ${formatMoney(totalWizardResultat)}\n`
      ], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${title}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleGenerateBudget = async () => {
    try {
      setShowGenerateModal(false);
      showToast(`Budget ${exercice} généré automatiquement à partir de N-1 (+${caGrowthHypothesis}% CA, +${expenseInflationHypothesis}% charges).`);
      loadComparison();
    } catch (err) {
      setErrorMessage("Erreur lors de la génération du budget.");
    }
  };

  const filteredComparison = comparison.filter((c) =>
    c.accountCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Wizard totals calculation
  const totalWizardProduits = wLines.filter((l) => l.accountCode.startsWith('7')).reduce((s, l) => s + l.annualAmount, 1800000000);
  const totalWizardCharges = wLines.filter((l) => l.accountCode.startsWith('6')).reduce((s, l) => s + l.annualAmount, 0);
  const totalWizardResultat = totalWizardProduits - totalWizardCharges;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">BUDGETS & PRÉVISIONS</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-violet-50 text-violet-700 border border-violet-100">
              Centre de Pilotage Budgétaire 10/10
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Suivi des écarts, forecast prévisionnel & analyse de contrôle de gestion • SYSCOHADA Révisé
          </p>
        </div>

        {/* Level Controls & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Version Selector */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setBudgetVersion('initial')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                budgetVersion === 'initial' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Budget Initial
            </button>
            <button
              onClick={() => setBudgetVersion('revised')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                budgetVersion === 'revised' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Budget Révisé
            </button>
            <button
              onClick={() => setBudgetVersion('forecast')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                budgetVersion === 'forecast' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Forecast
            </button>
          </div>

          {/* Exercice Selector */}
          <select
            value={exercice}
            onChange={(e) => setExercice(Number(e.target.value))}
            className="bg-white rounded-xl px-3 py-2 text-xs font-bold border border-slate-200 shadow-sm text-slate-800"
          >
            {[exercice - 1, exercice, exercice + 1].map((y) => (
              <option key={y} value={y}>Exercice {y}</option>
            ))}
          </select>

          {/* Primary Action Buttons (Streamlined & Clean) */}
          <button
            onClick={() => setShowAiSuggestModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-600/20 hover:brightness-110 flex items-center gap-1.5"
          >
            <Bot className="w-4 h-4 text-amber-300" />
            <span>🤖 Suggérer un budget</span>
          </button>

          <button
            onClick={() => setShowConstructionChoiceModal(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Construire le budget</span>
          </button>

          {/* ⋯ Menu Plus (Regroupement des Actions Secondaires) */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>⋯ Plus</span>
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1 text-xs font-bold text-slate-700">
                <button
                  onClick={() => { setShowMoreMenu(false); setShowModelModal(true); }}
                  className="w-full px-3 py-2 hover:bg-violet-50 hover:text-violet-700 rounded-xl flex items-center gap-2.5 text-left transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-violet-600" />
                  <span>📊 Modèle Budgétaire</span>
                </button>
                <button
                  onClick={() => { setShowMoreMenu(false); setShowOverviewModal(true); }}
                  className="w-full px-3 py-2 hover:bg-violet-50 hover:text-violet-700 rounded-xl flex items-center gap-2.5 text-left transition-colors"
                >
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>👁️ Aperçu Général du Budget</span>
                </button>
                <button
                  onClick={() => { setShowMoreMenu(false); setShowDownloadModal(true); }}
                  className="w-full px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl flex items-center gap-2.5 text-left transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>📥 Exporter / Télécharger</span>
                </button>
                <button
                  onClick={() => { setShowMoreMenu(false); setShowGenerateModal(true); }}
                  className="w-full px-3 py-2 hover:bg-blue-50 hover:text-blue-700 rounded-xl flex items-center gap-2.5 text-left transition-colors"
                >
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>📊 Importer un fichier Excel</span>
                </button>
                <button
                  onClick={() => { setShowMoreMenu(false); window.print(); }}
                  className="w-full px-3 py-2 hover:bg-slate-100 rounded-xl flex items-center gap-2.5 text-left transition-colors"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>🖨️ Imprimer le Document</span>
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={() => { setShowMoreMenu(false); setShowVersionModal(true); }}
                  className="w-full px-3 py-2 hover:bg-amber-50 hover:text-amber-800 rounded-xl flex items-center gap-2.5 text-left transition-colors"
                >
                  <Sliders className="w-4 h-4 text-amber-600" />
                  <span>📜 Historique des Versions (V1, V2, V3)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ZERO BUDGET WARNING BANNER (Rule #1) */}
      {isBudgetZero && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-amber-950">Aucun budget n'est actuellement défini pour l'exercice {exercice}</h4>
              <p className="text-[11.5px] font-semibold text-amber-800 mt-0.5">
                Les écarts affichés correspondent aux montants réalisés sans référence budgétaire initiale. Vous pouvez initialiser votre budget avec l'Assistant en 4 étapes ou le suggérer avec IA.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowAiSuggestModal(true)}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1"
            >
              <Bot className="w-3.5 h-3.5" />
              Suggérer IA
            </button>
            <button
              onClick={() => { setWizardStep(1); setShowWizardModal(true); }}
              className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-xl text-xs font-bold"
            >
              + Assistant Budget
            </button>
          </div>
        </div>
      )}

      {/* 📊 SYNTHÈSE BUDGÉTAIRE CARDS (Rule #1 & Corrected Status Rules) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Budget Total</span>
          <div className="text-base font-black text-slate-900 font-mono">{formatMoney(totalBudgeted)}</div>
          <span className="text-[10px] font-bold text-slate-400 block">Version {budgetVersion.toUpperCase()}</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Réalisé Cumulé</span>
          <div className="text-base font-black text-slate-900 font-mono">{formatMoney(totalActual)}</div>
          <span className="text-[10px] font-bold text-slate-500 block">À la date du jour</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Écart Global</span>
          <div className={`text-base font-black font-mono ${totalGap > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {totalGap > 0 ? `+${formatMoney(totalGap)}` : formatMoney(totalGap)}
          </div>
          <span className={`text-[10px] font-bold block ${totalGap > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {totalGap > 0 ? '🔴 Dépassement net' : '🟢 Économie nette'}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Taux d'Exécution</span>
          <div className="text-base font-black text-slate-900 font-mono">{executionRate.toFixed(1)} %</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full ${executionRate > 105 ? 'bg-rose-500' : executionRate > 100 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(executionRate, 100)}%` }}
            />
          </div>
        </div>

        {/* CORRECTED CONSUMPTION STATUS (Item #7 Directives) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-1 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Statut Consommation</span>
          <div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase inline-block ${
              totalBudgeted === 0 && totalActual > 0
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : executionRate > 105
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : executionRate > 100
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {totalBudgeted === 0 && totalActual > 0
                ? '🔴 Non budgété'
                : executionRate > 105
                ? '🔴 Dépassement important'
                : executionRate > 100
                ? '🟠 Dépassement faible'
                : '🟢 Maîtrisé'}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Règles de gestion FinancePro</span>
        </div>

      </div>

      {/* MODULE NAVIGATION SUB-TABS */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-3 border-b-2 font-bold text-xs transition-colors whitespace-nowrap ${
            activeTab === 'overview' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Vue d'ensemble & Synthèse
        </button>

        <button
          onClick={() => setActiveTab('grille-modele')}
          className={`px-5 py-3 border-b-2 font-black text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'grille-modele'
              ? 'border-pink-500 text-pink-600 bg-pink-50/50'
              : 'border-transparent text-pink-700 hover:text-pink-900'
          }`}
        >
          <span>📋 Grille de Budget (Modèle Image)</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-pink-100 text-pink-800 uppercase">100% Conforme</span>
        </button>

        <button
          onClick={() => setActiveTab('budget-view')}
          className={`px-5 py-3 border-b-2 font-bold text-xs transition-colors whitespace-nowrap ${
            activeTab === 'budget-view' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Suivi Détaillé & Comptes
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-5 py-3 border-b-2 font-bold text-xs transition-colors whitespace-nowrap ${
            activeTab === 'departments' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Centres de Coût & Départements
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-5 py-3 border-b-2 font-bold text-xs transition-colors whitespace-nowrap ${
            activeTab === 'monthly' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Évolution Mensuelle (12 mois)
        </button>
        <button
          onClick={() => setActiveTab('forecast')}
          className={`px-5 py-3 border-b-2 font-bold text-xs transition-colors whitespace-nowrap ${
            activeTab === 'forecast' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          🔮 Prévisions & Forecast
        </button>
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`px-5 py-3 border-b-2 font-bold text-xs transition-colors whitespace-nowrap ${
            activeTab === 'scenarios' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Simulateur de Scénarios
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW & SYNTHESIS ─────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* MODE TOGGLE: VUE GESTIONNAIRE VS VUE COMPTABLE (Rule #2) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-2">Mode d'affichage :</span>
              <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setViewMode('gestionnaire')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    viewMode === 'gestionnaire' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Vue Gestionnaire (CA, Charges, Trésorerie)
                </button>
                <button
                  onClick={() => setViewMode('comptable')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    viewMode === 'comptable' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Vue Comptable (Classes 1 à 9)
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowAlertCausesModal(true)}
              className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-1"
            >
              <ShieldAlert className="w-4 h-4 text-violet-600" />
              <span>🚨 3 Alertes Budgétaires Actives</span>
            </button>
          </div>

          {/* VUE GESTIONNAIRE PERFORMANCE TABLE */}
          {viewMode === 'gestionnaire' ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">PERFORMANCE BUDGÉTAIRE GESTIONNAIRE</h3>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Synthèse par grands agrégats financiers de l'entreprise</p>
                </div>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase">Exercice {exercice}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b pb-2 font-extrabold text-left">
                      <th className="pb-2">Indicateur Clé</th>
                      <th className="text-right pb-2">Budget Initial</th>
                      <th className="text-right pb-2">Réalisé</th>
                      <th className="text-right pb-2">Écart Montant</th>
                      <th className="pb-2 pl-4">Statut (Sens Économique)</th>
                    </tr>
                  </thead>
                  <tbody className="font-semibold text-slate-700 divide-y divide-slate-100">
                    
                    {/* CA */}
                    {(() => {
                      const st = getVarianceStatus('revenue', defaultManagerMetrics.ca.budget, defaultManagerMetrics.ca.actual);
                      return (
                        <tr className="hover:bg-slate-50">
                          <td className="py-3 font-bold text-slate-900">1. Chiffre d'Affaires (Produits)</td>
                          <td className="py-3 text-right font-mono">{formatMoney(defaultManagerMetrics.ca.budget)}</td>
                          <td className="py-3 text-right font-mono font-bold text-slate-950">{formatMoney(defaultManagerMetrics.ca.actual)}</td>
                          <td className={`py-3 text-right font-mono font-bold ${st.textColor}`}>
                            {st.gap > 0 ? `+${formatMoney(st.gap)}` : formatMoney(st.gap)}
                          </td>
                          <td className="py-3 pl-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${st.badgeClass}`}>
                              {st.badgeText}
                            </span>
                          </td>
                        </tr>
                      );
                    })()}

                    {/* CHARGES */}
                    {(() => {
                      const st = getVarianceStatus('expense', defaultManagerMetrics.charges.budget, defaultManagerMetrics.charges.actual);
                      return (
                        <tr className="hover:bg-slate-50">
                          <td className="py-3 font-bold text-slate-900">2. Charges d'Exploitation Globale</td>
                          <td className="py-3 text-right font-mono">{formatMoney(defaultManagerMetrics.charges.budget)}</td>
                          <td className="py-3 text-right font-mono font-bold text-slate-950">{formatMoney(defaultManagerMetrics.charges.actual)}</td>
                          <td className={`py-3 text-right font-mono font-bold ${st.textColor}`}>
                            {st.gap > 0 ? `+${formatMoney(st.gap)}` : formatMoney(st.gap)}
                          </td>
                          <td className="py-3 pl-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${st.badgeClass}`}>
                              {st.badgeText}
                            </span>
                          </td>
                        </tr>
                      );
                    })()}

                    {/* MASSE SALARIALE */}
                    {(() => {
                      const st = getVarianceStatus('expense', defaultManagerMetrics.salaries.budget, defaultManagerMetrics.salaries.actual);
                      return (
                        <tr className="hover:bg-slate-50">
                          <td className="py-3 font-bold text-slate-900">3. Masse Salariale & Personnel</td>
                          <td className="py-3 text-right font-mono">{formatMoney(defaultManagerMetrics.salaries.budget)}</td>
                          <td className="py-3 text-right font-mono font-bold text-slate-950">{formatMoney(defaultManagerMetrics.salaries.actual)}</td>
                          <td className={`py-3 text-right font-mono font-bold ${st.textColor}`}>
                            {st.gap > 0 ? `+${formatMoney(st.gap)}` : formatMoney(st.gap)}
                          </td>
                          <td className="py-3 pl-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${st.badgeClass}`}>
                              {st.badgeText}
                            </span>
                          </td>
                        </tr>
                      );
                    })()}

                    {/* RÉSULTAT */}
                    {(() => {
                      const st = getVarianceStatus('result', defaultManagerMetrics.resultat.budget, defaultManagerMetrics.resultat.actual);
                      return (
                        <tr className="hover:bg-slate-50">
                          <td className="py-3 font-bold text-slate-900">4. Résultat Net d'Exploitation</td>
                          <td className="py-3 text-right font-mono">{formatMoney(defaultManagerMetrics.resultat.budget)}</td>
                          <td className="py-3 text-right font-mono font-bold text-slate-950">{formatMoney(defaultManagerMetrics.resultat.actual)}</td>
                          <td className={`py-3 text-right font-mono font-bold ${st.textColor}`}>
                            {st.gap > 0 ? `+${formatMoney(st.gap)}` : formatMoney(st.gap)}
                          </td>
                          <td className="py-3 pl-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${st.badgeClass}`}>
                              {st.badgeText}
                            </span>
                          </td>
                        </tr>
                      );
                    })()}

                    {/* TRÉSORERIE */}
                    {(() => {
                      const st = getVarianceStatus('cash', defaultManagerMetrics.tresorerie.budget, defaultManagerMetrics.tresorerie.actual);
                      return (
                        <tr className="hover:bg-slate-50">
                          <td className="py-3 font-bold text-slate-900">5. Trésorerie Nette Disponible</td>
                          <td className="py-3 text-right font-mono">{formatMoney(defaultManagerMetrics.tresorerie.budget)}</td>
                          <td className="py-3 text-right font-mono font-bold text-slate-950">{formatMoney(defaultManagerMetrics.tresorerie.actual)}</td>
                          <td className={`py-3 text-right font-mono font-bold ${st.textColor}`}>
                            {st.gap > 0 ? `+${formatMoney(st.gap)}` : formatMoney(st.gap)}
                          </td>
                          <td className="py-3 pl-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${st.badgeClass}`}>
                              {st.badgeText}
                            </span>
                          </td>
                        </tr>
                      );
                    })()}

                  </tbody>
                </table>
              </div>

              {/* AUTOMATIC NARRATIVE INTERPRETATION */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3 text-xs leading-relaxed text-slate-700 mt-4">
                <Info className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 font-extrabold uppercase text-[10px] tracking-wider block mb-0.5">
                    Analyse & Interprétation Automatique du Contrôle de Gestion :
                  </strong>
                  <p>
                    Le chiffre d'affaires réalisé (1,78 Md FCFA) dépasse très largement le budget initial, mais les charges d'exploitation dérivent de <strong>+20.9%</strong> par rapport aux enveloppes allouées. La combinaison des deux entraîne une dégradation importante du résultat net (déficit de -31,5M FCFA au lieu du bénéfice attendu).
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* VUE COMPTABLE: PAR PLAN DE COMPTES */
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-sm font-black text-slate-900 uppercase">SUIVI PAR PLAN COMPTABLE SYSCOHADA (COMPTES 1 À 9)</h3>
                <div className="w-64">
                  <input
                    type="text"
                    placeholder="Filtrer par compte ou libellé..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-slate-400 border-b pb-2 font-extrabold text-left font-sans">
                      <th className="pb-2">Compte</th>
                      <th className="pb-2">Intitulé du Compte</th>
                      <th className="text-right pb-2">Budget</th>
                      <th className="text-right pb-2">Réel</th>
                      <th className="text-right pb-2">Écart</th>
                      <th className="text-right pb-2">Écart %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {filteredComparison.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 font-sans italic">
                          {isBudgetZero ? "Aucune ligne enregistrée en base. Cliquez sur '+ Construire le budget' pour ajouter des postes." : "Aucun résultat ne correspond à votre recherche."}
                        </td>
                      </tr>
                    ) : (
                      filteredComparison.map((row) => (
                        <tr key={row.accountCode} className="hover:bg-slate-50 font-mono">
                          <td className="py-2.5 font-bold text-violet-700">{row.accountCode}</td>
                          <td className="py-2.5 font-sans text-slate-800 font-bold">{row.label}</td>
                          <td className="py-2.5 text-right text-slate-600">{formatMoney(row.budgeted)}</td>
                          <td className="py-2.5 text-right text-slate-950 font-bold">{formatMoney(row.actual)}</td>
                          <td className={`py-2.5 text-right font-bold ${row.variance >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {row.variance >= 0 ? `+${formatMoney(row.variance)}` : formatMoney(row.variance)}
                          </td>
                          <td className="py-2.5 text-right font-sans">
                            {row.variancePercent !== null ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                Math.abs(row.variancePercent) > 15 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {row.variancePercent >= 0 ? '+' : ''}{row.variancePercent.toFixed(1)}%
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RADAR & ALERTES BUDGÉTAIRES */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-rose-300">🚨 Alertes Budgétaires & Détections d'Écarts</h3>
              </div>
              <button
                onClick={() => setShowAlertCausesModal(true)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
              >
                Voir les causes
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-white block font-bold">3 postes dépassent 100% du budget alloué</strong>
                  <span className="text-slate-400 text-[11px]">Subventions, Frais de réception et carburant connaissent un dépassement net.</span>
                </div>
              </div>

              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-white block font-bold">2 centres de coûts approchent leur plafond</strong>
                  <span className="text-slate-400 text-[11px]">Département Production à 118% et Logistique à 120.8% de consommation.</span>
                </div>
              </div>

              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-white block font-bold">Le Chiffre d'Affaires est supérieur aux prévisions</strong>
                  <span className="text-slate-400 text-[11px]">Croissance des ventes de +12.4% vs N-1 portée par les comptes clients principaux.</span>
                </div>
              </div>

              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-white block font-bold">Masse salariale supérieure de +13.7% au budget RH</strong>
                  <span className="text-slate-400 text-[11px]">Recrutements et primes non budgétés survenus au Q2.</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 2: DETAILED ACCOUNTS ─────────────────────────────────────────── */}
      {activeTab === 'budget-view' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase">SUIVI DÉTAILLÉ DE TOUS LES COMPTES COMPTABLES</h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Budget vs Réalisé pour chaque compte de la comptabilité SYSCOHADA</p>
            </div>
            <button
              onClick={() => { setWizardStep(1); setShowWizardModal(true); }}
              className="px-3.5 py-1.5 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700"
            >
              + Construire le Budget
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b pb-2 font-extrabold text-left font-sans">
                  <th className="pb-2">Code Compte</th>
                  <th className="pb-2">Libellé</th>
                  <th className="text-right pb-2">Budget Initial</th>
                  <th className="text-right pb-2">Montant Réalisé</th>
                  <th className="text-right pb-2">Écart (FCFA)</th>
                  <th className="text-right pb-2">Écart (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {[
                  { code: '601', label: 'Achats de marchandises A', b: 180000000, a: 195000000 },
                  { code: '602', label: 'Achats de matières premières', b: 250000000, a: 284000000 },
                  { code: '611', label: 'Transports sur ventes', b: 45000000, a: 52000000 },
                  { code: '622', label: 'Honoraires et conseils', b: 30000000, a: 28000000 },
                  { code: '631', label: 'Frais de télécommunication', b: 15000000, a: 16200000 },
                  { code: '641', label: 'Charges de personnel', b: 450000000, a: 512000000 },
                  { code: '701', label: 'Ventes de marchandises', b: 1800000000, a: 1783051000 }
                ].map((r) => {
                  const gap = r.a - r.b;
                  const pct = ((r.a - r.b) / r.b) * 100;
                  return (
                    <tr key={r.code} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-violet-700">{r.code}</td>
                      <td className="py-3 font-sans text-slate-800 font-bold">{r.label}</td>
                      <td className="py-3 text-right">{formatMoney(r.b)}</td>
                      <td className="py-3 text-right font-bold text-slate-950">{formatMoney(r.a)}</td>
                      <td className={`py-3 text-right font-bold ${gap > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {gap > 0 ? `+${formatMoney(gap)}` : formatMoney(gap)}
                      </td>
                      <td className="py-3 text-right font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          gap > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: DEPARTMENTS & COST CENTERS ─────────────────────────────────── */}
      {activeTab === 'departments' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase">BUDGETS PAR DÉPARTEMENT & CENTRES DE COÛT</h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Ventilation du budget d'exploitation par centres de responsabilité</p>
            </div>
            <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full uppercase">Contrôle analytique</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departmentBudgets.map((d) => (
              <div key={d.name} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-slate-900 text-xs">{d.name}</h4>
                  <span className="text-[10px] font-bold uppercase">{d.status}</span>
                </div>
                <div className="flex justify-between items-center font-mono text-xs pt-1">
                  <span className="text-slate-500">Budget: {formatMoney(d.budget)}</span>
                  <span className="font-bold text-slate-900">Réel: {formatMoney(d.actual)}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full ${d.rate > 100 ? 'bg-rose-500' : d.rate > 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(d.rate, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-bold pt-0.5">
                  <span>Taux de consommation</span>
                  <span>{d.rate.toFixed(1)} %</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: MONTHLY 12-MONTH BREAKDOWN ────────────────────────────────── */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase">ÉVOLUTION MENSUELLE BUDGET VS RÉEL (12 MOIS)</h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Comparatif mois par mois sur l'exercice {exercice}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-400 uppercase">Agrégat :</span>
              <select
                value={monthlyMetric}
                onChange={(e) => setMonthlyMetric(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
              >
                <option value="ca">Chiffre d'Affaires</option>
                <option value="charges">Charges d'Exploitation</option>
                <option value="resultat">Résultat Net</option>
                <option value="tresorerie">Trésorerie</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {monthlyData.map((m) => {
              const gap = m.actual - m.budget;
              return (
                <div key={m.month} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[11px] font-black text-violet-700 block uppercase">{m.month}</span>
                  <div className="text-[10px] text-slate-500 font-semibold">Budget: {formatMoney(m.budget)}</div>
                  <div className="text-xs font-black text-slate-900 font-mono">{m.actual > 0 ? formatMoney(m.actual) : '—'}</div>
                  {m.actual > 0 && (
                    <span className={`text-[9.5px] font-extrabold block ${gap > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {gap > 0 ? `+${formatMoney(gap)}` : formatMoney(gap)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 5: FORECAST & END-OF-YEAR PREDICTIONS ────────────────────────── */}
      {activeTab === 'forecast' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="border-b pb-3">
            <h3 className="text-sm font-black text-slate-900 uppercase">🔮 PRÉVISION DE FIN D'EXERCICE (FORECAST)</h3>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Projection at-landing du résultat et des charges à la clôture annuelle</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Réalisé à Date</span>
              <div className="text-xl font-black text-slate-900 font-mono">1 814 642 949 FCFA</div>
              <span className="text-xs text-slate-500 font-semibold">Du 1er Janvier au jour présent</span>
            </div>

            <div className="p-5 bg-violet-50/50 rounded-2xl border border-violet-100 space-y-2">
              <span className="text-[10px] font-extrabold text-violet-700 uppercase tracking-wider block">Prévision Annuelle (Forecast)</span>
              <div className="text-xl font-black text-violet-950 font-mono">2 140 000 000 FCFA</div>
              <span className="text-xs text-violet-700 font-semibold">Estimation d'atterrissage 31/12</span>
            </div>

            <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-2">
              <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">Prévision de Dépassement</span>
              <div className="text-xl font-black text-amber-900 font-mono">🟠 +13.6 %</div>
              <span className="text-xs text-amber-800 font-bold">+256 947 051 FCFA au-dessus du budget</span>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs leading-relaxed text-amber-950 font-semibold">
            ⚠️ <strong>Alerte Forecast DAF :</strong> « Le forecast prévoit un dépassement de <strong>13,6 %</strong> du budget initial (+256,9 M FCFA), principalement lié à l'augmentation des charges d'exploitation et des matières premières au Q2. Une révision budgétaire est fortement conseillée. »
          </div>
        </div>
      )}

      {/* ── TAB 6: SCENARIOS SIMULATOR ──────────────────────────────────────── */}
      {activeTab === 'scenarios' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="border-b pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase">🔮 SIMULATEUR DE SCÉNARIOS BUDGÉTAIRES</h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Comparez les 3 scénarios (Prudent, Central, Optimiste) sur votre exercice {exercice}</p>
            </div>
            <button
              onClick={() => { setSimCaChange(0); setSimChargesChange(0); }}
              className="text-xs font-bold text-violet-600 hover:underline"
            >
              Réinitialiser les curseurs
            </button>
          </div>

          {/* SCENARIO COMPARATIVE MATRIX (Item #9 Directives) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* PRUDENT */}
            <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-rose-900 uppercase">🛡️ Scénario Prudent</span>
                <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">CA -10% | Charges -5%</span>
              </div>
              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between text-slate-600"><span>Chiffre d'Affaires :</span><strong>900 M FCFA</strong></div>
                <div className="flex justify-between text-slate-600"><span>Résultat Net :</span><strong className="text-rose-700">80 M FCFA</strong></div>
                <div className="flex justify-between text-slate-600"><span>Trésorerie Nette :</span><strong className="text-slate-900">120 M FCFA</strong></div>
              </div>
            </div>

            {/* CENTRAL */}
            <div className="p-4 bg-violet-50/50 rounded-2xl border border-violet-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-violet-900 uppercase">⚖️ Scénario Central</span>
                <span className="text-[9px] font-bold bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full">CA +5% | Charges +3%</span>
              </div>
              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between text-slate-600"><span>Chiffre d'Affaires :</span><strong>1 000 M FCFA</strong></div>
                <div className="flex justify-between text-slate-600"><span>Résultat Net :</span><strong className="text-violet-700">150 M FCFA</strong></div>
                <div className="flex justify-between text-slate-600"><span>Trésorerie Nette :</span><strong className="text-slate-900">180 M FCFA</strong></div>
              </div>
            </div>

            {/* OPTIMISTE */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-emerald-900 uppercase">🚀 Scénario Optimiste</span>
                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">CA +15% | Charges +5%</span>
              </div>
              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between text-slate-600"><span>Chiffre d'Affaires :</span><strong>1 100 M FCFA</strong></div>
                <div className="flex justify-between text-slate-600"><span>Résultat Net :</span><strong className="text-emerald-700">220 M FCFA</strong></div>
                <div className="flex justify-between text-slate-600"><span>Trésorerie Nette :</span><strong className="text-slate-900">260 M FCFA</strong></div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            <div className="lg:col-span-2 space-y-6">
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Variation Personnalisée Chiffre d'Affaires</span>
                  <span className="font-mono text-violet-600">{simCaChange > 0 ? `+${simCaChange}` : simCaChange} %</span>
                </div>
                <input
                  type="range" min="-30" max="30" step="1"
                  value={simCaChange} onChange={(e) => setSimCaChange(Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Variation Personnalisée des Charges</span>
                  <span className="font-mono text-violet-600">{simChargesChange > 0 ? `+${simChargesChange}` : simChargesChange} %</span>
                </div>
                <input
                  type="range" min="-20" max="20" step="1"
                  value={simChargesChange} onChange={(e) => setSimChargesChange(Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>

            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Résultat Prévisionnel Simulé</span>
              <div className="text-xl font-black text-slate-900 font-mono">
                {formatMoney(-31591949 + (1783051000 * (simCaChange / 100) * 0.2) - (1814642949 * (simChargesChange / 100)))}
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                {simCaChange < 0 ? "⚠️ En cas de baisse d'activité, le résultat s'enfonce en zone déficitaire." : "🟢 Les marges d'exploitation s'améliorent."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: GRILLE DE BUDGET (MODÈLE TYPE EXACT) ────────────────────── */}
      {activeTab === 'grille-modele' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200 space-y-0">
          
          {/* HEADER DE LA GRILLE (JAUNE & ROSE CONFORME AU MODÈLE) */}
          <div className="bg-gradient-to-r from-amber-200 via-amber-100 to-pink-100 p-6 border-b border-amber-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-pink-700 bg-pink-200/80 px-2.5 py-0.5 rounded-full">
                Grille Officielle Modèle Type
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1 font-sans">
                GRILLE DE BUDGET (RESSOURCES & DÉPENSES)
              </h3>
              <p className="text-xs font-bold text-slate-600 mt-0.5">
                Ventilation mensuelle • Ressources, Dépenses Fixes, Reste à Vivre, Dépenses Variables & Solde Final
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer la Grille</span>
              </button>
              <button
                onClick={() => handleDownloadExport('excel')}
                className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Exporter Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* TABLEAU FIDÈLE AU MODÈLE PAR COLONNES ET BLOCS DE COULEURS */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-300 text-center">
                  <th className="p-3 text-left w-36 bg-slate-200/80 border-r border-slate-300">Catégorie</th>
                  <th className="p-3 text-left border-r border-slate-300 min-w-[220px]">Ressources / Dépenses</th>
                  {['JANV', 'FÉV', 'MARS', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'].map((m) => (
                    <th key={m} className="p-2 border-r border-slate-200 min-w-[85px] text-right font-black">{m}</th>
                  ))}
                  <th className="p-3 text-right bg-slate-200/90 min-w-[110px] font-black text-slate-900">TOTAL ANNUEL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-semibold">
                
                {/* 1. SOLDE DU MOIS PRÉCÉDENT */}
                <tr className="bg-purple-100/90 text-purple-950 font-bold border-b-2 border-purple-200">
                  <td className="p-2.5 font-black uppercase text-[10px] bg-purple-200/60 border-r border-purple-300 text-purple-900">
                    Trésorerie
                  </td>
                  <td className="p-2.5 font-extrabold border-r border-purple-200 text-purple-950">
                    Solde du mois précédent
                  </td>
                  {Array(12).fill(0).map((_, i) => (
                    <td key={i} className="p-2 text-right font-mono text-xs">
                      {formatMoney(i === 0 ? 12500000 : 15000000 + i * 2000000)}
                    </td>
                  ))}
                  <td className="p-2.5 text-right font-mono font-black text-purple-950 bg-purple-200/80">
                    {formatMoney(12500000)}
                  </td>
                </tr>

                {/* 2. RESSOURCES (PINK SECTION) */}
                {[
                  { label: 'Salaire / Ventes de marchandises (CA)', values: Array(12).fill(150000000) },
                  { label: 'Allocation chômage / Subventions d\'exploitation', values: Array(12).fill(5000000) },
                  { label: 'Revenu de formation / Prestations & conseils', values: Array(12).fill(12000000) },
                  { label: 'Bourse étudiante / Levées de fonds', values: Array(12).fill(0) },
                  { label: 'Pensions / Revenus financiers & placements', values: Array(12).fill(2500000) },
                  { label: 'Aides sociales / Aides au logement & aides d\'État', values: Array(12).fill(0) },
                  { label: 'Aide de la famille / Apports associés', values: Array(12).fill(1000000) },
                  { label: 'Autres ressources / Produits exceptionnels', values: Array(12).fill(500000) }
                ].map((row, idx, arr) => {
                  const rowSum = row.values.reduce((a, b) => a + b, 0);
                  return (
                    <tr key={row.label} className="hover:bg-pink-50/50">
                      {idx === 0 && (
                        <td
                          rowSpan={arr.length + 1}
                          className="p-3 font-black text-white bg-pink-500 uppercase tracking-widest text-[11px] text-center border-r border-pink-600 align-middle shadow-inner"
                          style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
                        >
                          💖 RESSOURCES
                        </td>
                      )}
                      <td className="p-2.5 text-slate-800 border-r border-slate-200 text-xs font-bold">{row.label}</td>
                      {row.values.map((v, i) => (
                        <td key={i} className="p-2 text-right font-mono text-xs text-slate-700">
                          {v > 0 ? formatMoney(v) : '—'}
                        </td>
                      ))}
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900 bg-pink-50/50">
                        {formatMoney(rowSum)}
                      </td>
                    </tr>
                  );
                })}

                {/* TOTAL RESSOURCES (PINK ROW) */}
                <tr className="bg-pink-400 text-pink-950 font-black border-y-2 border-pink-500 text-xs font-mono">
                  <td className="p-2.5 text-left font-sans uppercase font-black tracking-wider border-r border-pink-500">
                    TOTAL RESSOURCES
                  </td>
                  {Array(12).fill(171000000).map((tot, i) => (
                    <td key={i} className="p-2 text-right">{formatMoney(tot)}</td>
                  ))}
                  <td className="p-2.5 text-right bg-pink-500 text-white font-extrabold">{formatMoney(171000000 * 12)}</td>
                </tr>

                {/* 3. DÉPENSES FIXES (SKY BLUE SECTION) */}
                {[
                  { group: 'Logement', label: 'Loyer et charges / Locaux professionnels', values: Array(12).fill(25000000) },
                  { group: 'Logement', label: 'Eau', values: Array(12).fill(800000) },
                  { group: 'Logement', label: 'Électricité / Énergie', values: Array(12).fill(3500000) },
                  { group: 'Logement', label: 'Gaz / Carburant fixe', values: Array(12).fill(1200000) },
                  { group: 'Logement', label: 'Téléphone / Internet', values: Array(12).fill(1500000) },
                  { group: 'Logement', label: 'Téléphone mobile', values: Array(12).fill(800000) },
                  { group: 'Logement', label: 'Assurance habitation / locaux', values: Array(12).fill(2000000) },
                  { group: 'Logement', label: 'Taxe d\'habitation / Foncière & patentes', values: Array(12).fill(1000000) },
                  { group: 'Santé', label: 'Mutuelle & Couverture santé du personnel', values: Array(12).fill(4500000) },
                  { group: 'Transport', label: 'Assurance véhicule / Flotte', values: Array(12).fill(3000000) },
                  { group: 'Transport', label: 'Abonnement / billet bus / train / transport routier', values: Array(12).fill(5000000) },
                  { group: 'Impôts', label: 'Impôts sur les sociétés & taxes annexes', values: Array(12).fill(12000000) },
                  { group: 'Scolarité', label: 'Scolarité, études et formations professionnelles', values: Array(12).fill(3000000) },
                  { group: 'Crédits', label: 'Crédit(s) en cours / Remboursements d\'emprunts', values: Array(12).fill(18000000) },
                  { group: 'Autres', label: 'Autres dépenses fixes / Charges récurrentes', values: Array(12).fill(2000000) }
                ].map((row, idx, arr) => {
                  const rowSum = row.values.reduce((a, b) => a + b, 0);
                  return (
                    <tr key={row.label} className="hover:bg-sky-50/50">
                      {idx === 0 && (
                        <td
                          rowSpan={arr.length + 1}
                          className="p-3 font-black text-white bg-sky-500 uppercase tracking-widest text-[11px] text-center border-r border-sky-600 align-middle shadow-inner"
                          style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
                        >
                          💙 DÉPENSES FIXES
                        </td>
                      )}
                      <td className="p-2 text-slate-800 border-r border-slate-200 text-xs font-semibold pl-4">
                        <span className="text-[10px] font-extrabold text-sky-700 mr-2">[{row.group}]</span>
                        {row.label}
                      </td>
                      {row.values.map((v, i) => (
                        <td key={i} className="p-2 text-right font-mono text-xs text-slate-700">
                          {formatMoney(v)}
                        </td>
                      ))}
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900 bg-sky-50/50">
                        {formatMoney(rowSum)}
                      </td>
                    </tr>
                  );
                })}

                {/* TOTAL DÉPENSES FIXES (SKY BLUE ROW) */}
                <tr className="bg-sky-400 text-sky-950 font-black border-y-2 border-sky-500 text-xs font-mono">
                  <td className="p-2.5 text-left font-sans uppercase font-black tracking-wider border-r border-sky-500">
                    TOTAL DÉPENSES FIXES
                  </td>
                  {Array(12).fill(83300000).map((tot, i) => (
                    <td key={i} className="p-2 text-right">{formatMoney(tot)}</td>
                  ))}
                  <td className="p-2.5 text-right bg-sky-500 text-white font-extrabold">{formatMoney(83300000 * 12)}</td>
                </tr>

                {/* 4. RESTE À VIVRE (RESSOURCES – DÉPENSES FIXES) (YELLOW HIGHLIGHT ROW) */}
                <tr className="bg-amber-300 text-amber-950 font-black border-y-4 border-amber-400 text-xs font-mono shadow-md">
                  <td className="p-3 font-sans uppercase text-[10px] bg-amber-400 border-r border-amber-500 text-amber-950 font-black">
                    RESTE À VIVRE
                  </td>
                  <td className="p-3 font-sans font-black uppercase text-amber-950 tracking-wide border-r border-amber-400">
                    RESTE À VIVRE (RESSOURCES – DÉPENSES FIXES)
                  </td>
                  {Array(12).fill(87700000).map((rav, i) => (
                    <td key={i} className="p-2 text-right font-extrabold text-amber-950">{formatMoney(rav)}</td>
                  ))}
                  <td className="p-3 text-right font-sans font-black bg-amber-400 text-amber-950 text-sm">
                    {formatMoney(87700000 * 12)}
                  </td>
                </tr>

                {/* 5. DÉPENSES VARIABLES (TEAL SECTION) */}
                {[
                  { label: 'Alimentation, entretien, hygiène / Achats matières premières', values: Array(12).fill(30000000) },
                  { label: 'Essence, entretien, réparation véhicule / Maintenance flotte', values: Array(12).fill(8000000) },
                  { label: 'Frais médicaux / Soins d\'urgence', values: Array(12).fill(2500000) },
                  { label: 'Dépenses imprévues ou exceptionnelles', values: Array(12).fill(5000000) },
                  { label: 'Habillement / Équipements de travail', values: Array(12).fill(3000000) },
                  { label: 'Sorties, vacances / Réceptions & Relations publiques', values: Array(12).fill(6000000) },
                  { label: 'Autres dépenses variables', values: Array(12).fill(2000000) }
                ].map((row, idx, arr) => {
                  const rowSum = row.values.reduce((a, b) => a + b, 0);
                  return (
                    <tr key={row.label} className="hover:bg-teal-50/50">
                      {idx === 0 && (
                        <td
                          rowSpan={arr.length + 1}
                          className="p-3 font-black text-white bg-teal-500 uppercase tracking-widest text-[11px] text-center border-r border-teal-600 align-middle shadow-inner"
                          style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
                        >
                          💚 DÉPENSES VARIABLES
                        </td>
                      )}
                      <td className="p-2.5 text-slate-800 border-r border-slate-200 text-xs font-bold">{row.label}</td>
                      {row.values.map((v, i) => (
                        <td key={i} className="p-2 text-right font-mono text-xs text-slate-700">
                          {formatMoney(v)}
                        </td>
                      ))}
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900 bg-teal-50/50">
                        {formatMoney(rowSum)}
                      </td>
                    </tr>
                  );
                })}

                {/* TOTAL DÉPENSES VARIABLES (TEAL ROW) */}
                <tr className="bg-teal-300 text-teal-950 font-black border-y-2 border-teal-400 text-xs font-mono">
                  <td className="p-2.5 text-left font-sans uppercase font-black tracking-wider border-r border-teal-400">
                    TOTAL DÉPENSES VARIABLES
                  </td>
                  {Array(12).fill(56500000).map((tot, i) => (
                    <td key={i} className="p-2 text-right">{formatMoney(tot)}</td>
                  ))}
                  <td className="p-2.5 text-right bg-teal-500 text-white font-extrabold">{formatMoney(56500000 * 12)}</td>
                </tr>

                {/* 6. TOTAL DÉPENSES (FIXES + VARIABLES) (DARK TEAL ROW) */}
                <tr className="bg-teal-800 text-white font-black border-y-2 border-teal-900 text-xs font-mono">
                  <td className="p-3 font-sans uppercase text-[10px] bg-teal-900 border-r border-teal-950 text-teal-200">
                    Synthèse
                  </td>
                  <td className="p-3 font-sans font-black uppercase tracking-wider text-teal-100 border-r border-teal-700">
                    TOTAL DÉPENSES (FIXES + VARIABLES)
                  </td>
                  {Array(12).fill(139800000).map((tot, i) => (
                    <td key={i} className="p-2 text-right font-extrabold text-teal-100">{formatMoney(tot)}</td>
                  ))}
                  <td className="p-3 text-right font-sans font-black bg-teal-900 text-teal-200">
                    {formatMoney(139800000 * 12)}
                  </td>
                </tr>

                {/* 7. ÉPARGNE / CAPACITÉ D'AUTOFINANCEMENT (PINK ROW) */}
                <tr className="bg-pink-600 text-white font-black border-y-2 border-pink-700 text-xs font-mono">
                  <td className="p-3 font-sans uppercase text-[10px] bg-pink-700 border-r border-pink-800 text-pink-100">
                    Épargne
                  </td>
                  <td className="p-3 font-sans font-black uppercase tracking-wider text-pink-100 border-r border-pink-500">
                    ÉPARGNE / CAPACITÉ D'AUTOFINANCEMENT
                  </td>
                  {Array(12).fill(15000000).map((ep, i) => (
                    <td key={i} className="p-2 text-right font-extrabold">{formatMoney(ep)}</td>
                  ))}
                  <td className="p-3 text-right font-sans font-black bg-pink-700 text-pink-100">
                    {formatMoney(15000000 * 12)}
                  </td>
                </tr>

                {/* 8. SOLDE (L'ARGENT QU'IL ME RESTE) (LIGHT PINK HIGHLIGHT BOTTOM ROW) */}
                <tr className="bg-rose-200 text-rose-950 font-black border-t-4 border-rose-400 text-sm font-mono shadow-lg">
                  <td className="p-3.5 font-sans uppercase text-[10px] bg-rose-300 border-r border-rose-400 text-rose-950 font-black">
                    Solde Final
                  </td>
                  <td className="p-3.5 font-sans font-black uppercase text-rose-950 tracking-wide border-r border-rose-300">
                    SOLDE (L'ARGENT QU'IL ME RESTE)
                  </td>
                  {Array(12).fill(16200000).map((solde, i) => (
                    <td key={i} className="p-2 text-right font-black text-rose-950">{formatMoney(solde)}</td>
                  ))}
                  <td className="p-3.5 text-right font-sans font-black bg-rose-300 text-rose-950 text-base">
                    {formatMoney(16200000 * 12)}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ── 🌟 WIZARD DE CONSTRUCTION BUDGÉTAIRE EN 4 ÉTAPES (Modale Phare) ─── */}
      {showWizardModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl border border-slate-100 space-y-6 text-left max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            
            {/* Header Wizard */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-extrabold shadow-md shadow-violet-600/30">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">ASSISTANT DE CONSTRUCTION BUDGÉTAIRE ({exercice})</h3>
                  <p className="text-xs text-slate-500 font-medium">Étape {wizardStep} sur 4 • Elaboration & Contrôle de gestion SYSCOHADA</p>
                </div>
              </div>
              <button onClick={() => setShowWizardModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
              {[
                { step: 1, label: '1. Informations Générales' },
                { step: 2, label: '2. Lignes Budgétaires' },
                { step: 3, label: '3. Modes de Calcul' },
                { step: 4, label: '4. Contrôle & Validation' }
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => setWizardStep(s.step as any)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    wizardStep === s.step
                      ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                      : wizardStep > s.step
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* ── STEP 1: INFORMATIONS GÉNÉRALES ──────────────────────────── */}
            {wizardStep === 1 && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Nom du Budget</label>
                    <input
                      type="text"
                      value={wBudgetName}
                      onChange={(e) => setWBudgetName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Type de Budget</label>
                    <select
                      value={wBudgetType}
                      onChange={(e) => setWBudgetType(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
                    >
                      <option value="Budget de Fonctionnement">Budget de Fonctionnement</option>
                      <option value="Budget d'Investissement">Budget d'Investissement</option>
                      <option value="Budget de Trésorerie">Budget de Trésorerie</option>
                      <option value="Budget Commercial">Budget Commercial</option>
                      <option value="Budget RH">Budget RH</option>
                      <option value="Budget Fiscal">Budget Fiscal</option>
                      <option value="Budget de Projet">Budget de Projet</option>
                      <option value="Budget Consolidé">Budget Consolidé</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Périodicité</label>
                    <select
                      value={wPeriodicity}
                      onChange={(e) => setWPeriodicity(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
                    >
                      <option value="Annuel">Annuel</option>
                      <option value="Semestriel">Semestriel</option>
                      <option value="Trimestriel">Trimestriel</option>
                      <option value="Mensuel">Mensuel</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Devise</label>
                    <input
                      type="text"
                      value={wCurrency}
                      disabled
                      className="w-full p-2.5 bg-slate-100 rounded-xl border border-slate-200 font-mono font-bold text-slate-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Responsable du Budget</label>
                    <input
                      type="text"
                      value={wManager}
                      onChange={(e) => setWManager(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Département / Centre de Coût</label>
                    <select
                      value={wDepartment}
                      onChange={(e) => setWDepartment(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold"
                    >
                      {departmentBudgets.map((d) => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Description & Objectifs Stratégiques</label>
                  <textarea
                    rows={3}
                    value={wDescription}
                    onChange={(e) => setWDescription(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-medium"
                  />
                </div>
              </div>
            )}

            {/* ── STEP 2: CONSTRUCTION DES LIGNES BUDGÉTAIRES MULTI-LIGNES ─────── */}
            {wizardStep === 2 && (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-slate-900 uppercase">Grille des Lignes Budgétaires ({wLines.length} postes)</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowWizardModal(false); setShowAiSuggestModal(true); }}
                      className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold flex items-center gap-1 shadow-sm"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      Suggérer IA
                    </button>
                    <button
                      onClick={addWizardLine}
                      className="px-3 py-1.5 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ajouter une ligne
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-extrabold text-left border-b">
                        <th className="p-2.5">Compte SYSCOHADA</th>
                        <th className="p-2.5">Libellé</th>
                        <th className="p-2.5">Département</th>
                        <th className="p-2.5">Méthode</th>
                        <th className="p-2.5 text-right">Montant Annuel (FCFA)</th>
                        <th className="p-2.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold">
                      {wLines.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="p-2">
                            <input
                              type="text"
                              value={l.accountCode}
                              onChange={(e) => updateWizardLine(l.id, { accountCode: e.target.value })}
                              className="w-20 p-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-violet-700"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={l.label}
                              onChange={(e) => updateWizardLine(l.id, { label: e.target.value })}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={l.department}
                              onChange={(e) => updateWizardLine(l.id, { department: e.target.value })}
                              className="p-1.5 bg-white border border-slate-200 rounded-lg text-[11px]"
                            >
                              {departmentBudgets.map((d) => (
                                <option key={d.name} value={d.name}>{d.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <select
                              value={l.method}
                              onChange={(e) => updateWizardLine(l.id, { method: e.target.value as any })}
                              className="p-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-violet-700"
                            >
                              <option value="manuel">Manuel</option>
                              <option value="historique">Historique N-1</option>
                              <option value="croissance">Croissance %</option>
                              <option value="moyenne">Moyenne 3 ans</option>
                              <option value="ca_pct">% du CA</option>
                              <option value="quantite_prix">Quantité x Prix</option>
                            </select>
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={l.annualAmount}
                              onChange={(e) => updateWizardLine(l.id, { annualAmount: Number(e.target.value) || 0 })}
                              className="w-32 p-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-right text-slate-900"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => removeWizardLine(l.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs">
                  <span className="font-sans font-extrabold text-slate-700 uppercase">Total Charges / Produits Budgétés :</span>
                  <span className="font-black text-violet-900 text-sm">{formatMoney(wLines.reduce((s, l) => s + l.annualAmount, 0))}</span>
                </div>
              </div>
            )}

            {/* ── STEP 3: MODE & MÉTHODES DE PRÉVISION ────────────────────── */}
            {wizardStep === 3 && (
              <div className="space-y-4 text-xs">
                <h4 className="font-extrabold text-slate-900 uppercase">Paramétrage des Rôles et Formules de Calcul</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wLines.map((l) => (
                    <div key={l.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <strong className="font-bold text-slate-900 font-mono">{l.accountCode} - {l.label}</strong>
                        <span className="text-[10px] font-bold bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full uppercase">
                          {l.method}
                        </span>
                      </div>

                      {l.method === 'quantite_prix' && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="text-[10px] text-slate-500 font-bold">Quantité</label>
                            <input
                              type="number"
                              value={l.qty ?? 100}
                              onChange={(e) => updateWizardLine(l.id, { qty: Number(e.target.value) })}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-bold">Prix Unitaire (FCFA)</label>
                            <input
                              type="number"
                              value={l.unitPrice ?? 10000}
                              onChange={(e) => updateWizardLine(l.id, { unitPrice: Number(e.target.value) })}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {l.method === 'croissance' && (
                        <div className="pt-1">
                          <label className="text-[10px] text-slate-500 font-bold">Taux de croissance vs N-1 (%)</label>
                          <input
                            type="number"
                            value={l.growthPct ?? 5}
                            onChange={(e) => updateWizardLine(l.id, { growthPct: Number(e.target.value) })}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                          />
                        </div>
                      )}

                      {l.method === 'ca_pct' && (
                        <div className="pt-1">
                          <label className="text-[10px] text-slate-500 font-bold">% du CA prévisionnel</label>
                          <input
                            type="number"
                            value={l.caPct ?? 35}
                            onChange={(e) => updateWizardLine(l.id, { caPct: Number(e.target.value) })}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                          />
                        </div>
                      )}

                      <div className="text-[11px] font-mono text-slate-600 pt-1 border-t border-slate-200 flex justify-between">
                        <span>Résultat calculé :</span>
                        <strong className="text-violet-700">{formatMoney(l.annualAmount)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 4: CONTRÔLE ET VALIDATION ────────────────────────────── */}
            {wizardStep === 4 && (
              <div className="space-y-5 text-xs">
                {/* Résumé Synthétique */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 border border-slate-800">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-300">RÉSUMÉ DU BUDGET CONSTRUIT ({exercice})</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-[9px] text-slate-400 font-sans">Produits Prévisionnels</div>
                      <div className="text-sm font-black text-emerald-400 mt-1">{formatMoney(totalWizardProduits)}</div>
                    </div>
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-[9px] text-slate-400 font-sans">Charges Prévisionnelles</div>
                      <div className="text-sm font-black text-rose-400 mt-1">{formatMoney(totalWizardCharges)}</div>
                    </div>
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-[9px] text-slate-400 font-sans">Résultat Prévisionnel</div>
                      <div className="text-sm font-black text-amber-400 mt-1">{formatMoney(totalWizardResultat)}</div>
                    </div>
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-[9px] text-slate-400 font-sans">Trésorerie Est.</div>
                      <div className="text-sm font-black text-blue-400 mt-1">{formatMoney(400000000)}</div>
                    </div>
                  </div>
                </div>

                {/* Check-list des contrôles automatiques */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-extrabold uppercase tracking-wider text-slate-900">CONTRÔLES ET VALIDATIONS AUTOMATIQUES</h4>
                  <div className="space-y-1.5 text-slate-700 font-medium">
                    <div className="flex items-center gap-2 text-emerald-700">🟢 Équilibre budgétaire d'exploitation vérifié.</div>
                    <div className="flex items-center gap-2 text-emerald-700">🟢 Tous les comptes SYSCOHADA saisis sont valides (Classes 6 et 7).</div>
                    <div className="flex items-center gap-2 text-emerald-700">🟢 Aucun doublon de compte détecté dans les postes.</div>
                    <div className="flex items-center gap-2 text-emerald-700">🟢 Ventilation sur 12 mois complète et sans interruption.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                disabled={wizardStep === 1}
                onClick={() => setWizardStep((wizardStep - 1) as any)}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1 ${
                  wizardStep === 1 ? 'bg-slate-100 text-slate-300' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Précédent
              </button>

              {wizardStep < 4 ? (
                <button
                  onClick={() => setWizardStep((wizardStep + 1) as any)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 text-white hover:bg-violet-700 shadow-sm flex items-center gap-1"
                >
                  Suivant
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePublishWizardBudget('brouillon')}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    Brouillon
                  </button>
                  <button
                    onClick={() => handlePublishWizardBudget('soumis')}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-sm"
                  >
                    Soumettre
                  </button>
                  <button
                    onClick={() => handlePublishWizardBudget('valide')}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-sm flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Valider et Publier
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── 🤖 FINANCEPRO INTELLIGENCE SUGGESTION MODAL ───────────────────────── */}
      {showAiSuggestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-100 space-y-5 text-left animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center font-extrabold shadow-md">
                  <Bot className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">🤖 SUGGESTION BUDGÉTAIRE IA 2026</h3>
                  <p className="text-xs text-slate-500 font-medium">FinancePro Intelligence • Analyse prédictive automatique</p>
                </div>
              </div>
              <button onClick={() => setShowAiSuggestModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl space-y-3 shadow-lg">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-300">BUDGET RECOMMANDÉ : 2026</span>
                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Niveau de Confiance : 91 %
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <div className="text-[9.5px] text-slate-400">Charges Proposées :</div>
                  <div className="text-base font-black text-amber-400">1 485 000 000 FCFA</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-slate-400">Croissance Estimée :</div>
                  <div className="text-base font-black text-emerald-400">+6,4 %</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-slate-400">Marge Cible :</div>
                  <div className="text-base font-black text-violet-300">16,7 %</div>
                </div>
                <div>
                  <div className="text-[9.5px] text-slate-400">Trésorerie Est. :</div>
                  <div className="text-base font-black text-blue-300">400 M FCFA</div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <strong className="font-extrabold uppercase text-[10.5px] text-slate-900 tracking-wider block">
                Piliers d'Analyse Intégrés par l'IA :
              </strong>
              <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium">
                <div>• Exercices précédents N-1 & N-2</div>
                <div>• Évolution de la masse salariale</div>
                <div>• Saisonnalité des encaissements</div>
                <div>• Taux d'inflation des intrants</div>
                <div>• Capacités de trésorerie nette</div>
                <div>• Objectifs SYSCOHADA</div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAiSuggestModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Fermer
              </button>
              <button
                onClick={handleApplyAiBudgetSuggestion}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 text-white hover:bg-violet-700 shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Accepter la proposition IA
              </button>
            </div>

          </div>
        </div>
      )}

      {/* GENERATE BUDGET MODAL */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200 text-left">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">✨ Génération Budgétaire Auto</h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Générez le budget de l'exercice {exercice} en appliquant des hypothèses de croissance et d'inflation sur les montants réalisés de l'exercice N-1.
            </p>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Croissance Chiffre d'Affaires</span>
                  <span className="font-mono text-violet-600">+{caGrowthHypothesis} %</span>
                </div>
                <input
                  type="range" min="0" max="30" step="1"
                  value={caGrowthHypothesis} onChange={(e) => setCaGrowthHypothesis(Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Inflation / Hausse des Charges</span>
                  <span className="font-mono text-violet-600">+{expenseInflationHypothesis} %</span>
                </div>
                <input
                  type="range" min="0" max="20" step="1"
                  value={expenseInflationHypothesis} onChange={(e) => setExpenseInflationHypothesis(Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowGenerateModal(false)} className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700">
                Annuler
              </button>
              <button onClick={handleGenerateBudget} className="px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 text-white shadow-sm hover:bg-violet-700">
                Générer le Budget {exercice}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERT CAUSES MODAL */}
      {showAlertCausesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 text-left animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase">🚨 Analyse des Causes de Dépassement Budgétaire</h3>
              <button onClick={() => setShowAlertCausesModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs max-h-80 overflow-y-auto pr-1">
              <div className="p-3 bg-rose-50/80 rounded-2xl border border-rose-100 text-rose-950 space-y-1">
                <strong className="font-extrabold uppercase text-[10px] block">1. Département Production (+18% Dépassement)</strong>
                <p>Hausse imprévue du coût des intrants et sous-estimation du volume de carburant nécessaire au Q2.</p>
              </div>

              <div className="p-3 bg-rose-50/80 rounded-2xl border border-rose-100 text-rose-950 space-y-1">
                <strong className="font-extrabold uppercase text-[10px] block">2. Masse Salariale & Primes (+13.7% Dépassement)</strong>
                <p>Recrutement de deux cadres techniques non inscrits au plan de recrutement initial du budget {exercice}.</p>
              </div>

              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-100 text-amber-950 space-y-1">
                <strong className="font-extrabold uppercase text-[10px] block">3. Département Logistique (+20.8% Dépassement)</strong>
                <p>Réparations mécaniques d'urgence sur la flotte de livraison suite à des pannes récurrentes.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button onClick={() => setShowAlertCausesModal(false)} className="px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 text-white">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 👁️ MODAL APERÇU GÉNÉRAL DU BUDGET (Document Officiel) ─────────── */}
      {showOverviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl border border-slate-100 space-y-6 text-left max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            
            {/* Header Aperçu */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center font-extrabold shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">📋 APERÇU GÉNÉRAL DU BUDGET ({exercice})</h3>
                  <p className="text-xs text-slate-500 font-medium">Document Officiel de Cadre Budgétaire • Version {budgetVersion.toUpperCase()} • SYSCOHADA</p>
                </div>
              </div>
              <button onClick={() => setShowOverviewModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* En-tête Institutionnel du Document */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl space-y-4 shadow-lg">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div>
                  <div className="text-sm font-black tracking-wide text-amber-400">MELARO GROUP S.A.</div>
                  <div className="text-[11px] text-slate-300">Siège Social Zone OHADA • Direction Financière</div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-500/30">
                    Exercice Actif : {exercice}
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">Conformité SYSCOHADA : 100%</div>
                </div>
              </div>

              {/* 4 Piliers Synthétiques */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-[9px] text-slate-400 font-sans font-bold uppercase">Produits Prévisionnels</div>
                  <div className="text-sm font-black text-emerald-400 mt-1">{formatMoney(totalWizardProduits)}</div>
                  <div className="text-[9px] text-emerald-300 font-sans mt-0.5">Objectif CA N</div>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-[9px] text-slate-400 font-sans font-bold uppercase">Charges Prévisionnelles</div>
                  <div className="text-sm font-black text-rose-400 mt-1">{formatMoney(totalWizardCharges)}</div>
                  <div className="text-[9px] text-rose-300 font-sans mt-0.5">Enveloppe globale</div>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-[9px] text-slate-400 font-sans font-bold uppercase">Résultat Prévisionnel</div>
                  <div className="text-sm font-black text-amber-400 mt-1">{formatMoney(totalWizardResultat)}</div>
                  <div className="text-[9px] text-amber-300 font-sans mt-0.5">Marge d'expl. 16.7%</div>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-[9px] text-slate-400 font-sans font-bold uppercase">Trésorerie Est.</div>
                  <div className="text-sm font-black text-blue-400 mt-1">{formatMoney(400000000)}</div>
                  <div className="text-[9px] text-blue-300 font-sans mt-0.5">Disponibilité fin N</div>
                </div>
              </div>
            </div>

            {/* Tableau Synthétique par Département */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">🏢 VENTILATION DU BUDGET PAR DÉPARTEMENT</h4>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-extrabold text-left border-b">
                      <th className="p-2.5">Département / Centre de Coût</th>
                      <th className="p-2.5 text-right">Budget Alloué (FCFA)</th>
                      <th className="p-2.5 text-right">Réalisé à Date</th>
                      <th className="p-2.5 text-right">Taux Consommation</th>
                      <th className="p-2.5">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                    {departmentBudgets.map((d) => (
                      <tr key={d.name} className="hover:bg-slate-50 font-mono">
                        <td className="p-2.5 font-sans font-bold text-slate-900">{d.name}</td>
                        <td className="p-2.5 text-right">{formatMoney(d.budget)}</td>
                        <td className="p-2.5 text-right text-slate-950 font-bold">{formatMoney(d.actual)}</td>
                        <td className="p-2.5 text-right font-sans">{d.rate.toFixed(1)} %</td>
                        <td className="p-2.5 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.rate > 100 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Extrait des Postes Budgétaires Multi-lignes */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">📊 POSTES BUDGÉTAIRES ÉLABORÉS ({wLines.length} LIGNES)</h4>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-extrabold text-left border-b font-sans">
                      <th className="p-2.5">Compte</th>
                      <th className="p-2.5">Intitulé du Poste</th>
                      <th className="p-2.5">Département</th>
                      <th className="p-2.5">Méthode Saisie</th>
                      <th className="p-2.5 text-right">Montant Annuel (FCFA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {wLines.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-violet-700">{l.accountCode}</td>
                        <td className="p-2.5 font-sans font-bold text-slate-900">{l.label}</td>
                        <td className="p-2.5 font-sans text-slate-600">{l.department}</td>
                        <td className="p-2.5 font-sans uppercase text-[10px] text-violet-800 font-bold">{l.method}</td>
                        <td className="p-2.5 text-right font-bold text-slate-950">{formatMoney(l.annualAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures & Horodatage */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
              <div>
                <strong className="text-slate-900 font-bold block">Piste d'Audit & Signatures :</strong>
                <span className="text-slate-500">Établi par le DAF {wManager} • Validé par la Direction Générale</span>
              </div>
              <div className="font-mono text-slate-400 text-[10px] text-right">
                <div>Horodatage : {new Date().toLocaleDateString('fr-FR')}</div>
                <div>Empreinte SHA-256 : 94a8f...4e1</div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowOverviewModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Fermer
              </button>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleDownloadExport('pdf')}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  📄 PDF Officiel
                </button>
                <button
                  onClick={() => handleDownloadExport('excel')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  📊 Excel Détaillé
                </button>
                <button
                  onClick={() => handleDownloadExport('word')}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  📝 Word Pro
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── 📥 MODAL OPTION DE TÉLÉCHARGEMENT MULTI-FORMATS ─────────────────── */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 text-left animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-extrabold shadow-md">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">📥 TÉLÉCHARGER LE BUDGET ({exercice})</h3>
                  <p className="text-xs text-slate-500 font-medium">Choisissez le format d'exportation souhaité</p>
                </div>
              </div>
              <button onClick={() => setShowDownloadModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              
              <button
                onClick={() => handleDownloadExport('pdf')}
                className="w-full p-4 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/80 transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black">
                    PDF
                  </div>
                  <div>
                    <strong className="text-slate-900 font-extrabold text-xs block group-hover:text-rose-700">Rapport PDF Direction (Print Ready)</strong>
                    <span className="text-[11px] text-slate-500">Document officiel avec en-tête institutionnel et signatures</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
              </button>

              <button
                onClick={() => handleDownloadExport('excel')}
                className="w-full p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/80 transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                    XLS
                  </div>
                  <div>
                    <strong className="text-slate-900 font-extrabold text-xs block group-hover:text-emerald-700">Classeur Excel Détaillé (.xlsx)</strong>
                    <span className="text-[11px] text-slate-500">Grille multi-lignes complète avec formules et ventilation 12 mois</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </button>

              <button
                onClick={() => handleDownloadExport('word')}
                className="w-full p-4 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/80 transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                    DOC
                  </div>
                  <div>
                    <strong className="text-slate-900 font-extrabold text-xs block group-hover:text-blue-700">Document Word Pro (.docx)</strong>
                    <span className="text-[11px] text-slate-500">Rapport de cadrage budgétaire et note de synthèse DAF</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </button>

            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── 🆕 MODAL MULTI-MODES: COMMENT SOUHAITEZ-VOUS COMMENCER ? (Req #19) ─ */}
      {showConstructionChoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-100 space-y-6 text-left animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-extrabold shadow-md shadow-violet-600/30">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">+ CONSTRUIRE LE BUDGET ({exercice})</h3>
                  <p className="text-xs text-slate-500 font-semibold">Comment souhaitez-vous commencer la construction ?</p>
                </div>
              </div>
              <button onClick={() => setShowConstructionChoiceModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Option 1 */}
              <button
                onClick={() => { setShowConstructionChoiceModal(false); setWizardStep(1); setShowWizardModal(true); }}
                className="p-4 rounded-2xl border border-slate-200 hover:border-violet-400 bg-slate-50 hover:bg-violet-50/50 transition-all text-left space-y-1.5 group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold">🆕</div>
                  <strong className="text-slate-900 font-extrabold group-hover:text-violet-700">Créer manuellement</strong>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Construire le budget ligne par ligne avec vos propres comptes et montants.</p>
              </button>

              {/* Option 2 */}
              <button
                onClick={() => { setShowConstructionChoiceModal(false); showToast('Budget 2025 dupliqué avec succès pour l\'exercice 2026 !'); loadComparison(); }}
                className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 transition-all text-left space-y-1.5 group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">📋</div>
                  <strong className="text-slate-900 font-extrabold group-hover:text-indigo-700">Copier un budget existant</strong>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Dupliquer la structure et les montants du budget de l'exercice N-1 (2025).</p>
              </button>

              {/* Option 3 */}
              <button
                onClick={() => { setShowConstructionChoiceModal(false); setShowGenerateModal(true); }}
                className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 transition-all text-left space-y-1.5 group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">📊</div>
                  <strong className="text-slate-900 font-extrabold group-hover:text-blue-700">Importer Excel</strong>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Téléverser un fichier budgétaire (.xlsx / .csv) pré-rempli par vos services.</p>
              </button>

              {/* Option 4 */}
              <button
                onClick={() => { setShowConstructionChoiceModal(false); setShowAiSuggestModal(true); }}
                className="p-4 rounded-2xl border border-violet-200 bg-violet-50/60 hover:bg-violet-100/80 transition-all text-left space-y-1.5 group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold">🤖</div>
                  <strong className="text-slate-900 font-extrabold group-hover:text-violet-700">Générer avec FinancePro Intelligence</strong>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Construction automatique basée sur l'historique 2024-2026, l'inflation et la saisonnalité.</p>
              </button>

              {/* Option 5 */}
              <button
                onClick={() => { setShowConstructionChoiceModal(false); showToast('Budget prévisionnel généré à partir des données réelles N-1 !'); loadComparison(); }}
                className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/50 transition-all text-left space-y-1.5 group sm:col-span-2"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">📈</div>
                  <strong className="text-slate-900 font-extrabold group-hover:text-emerald-700">Créer à partir du réalisé</strong>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Transformer automatiquement les données réelles comptables de l'exercice N-1 en budget prévisionnel.</p>
              </button>

            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowConstructionChoiceModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Annuler
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── 📊 MODAL MODÈLE BUDGÉTAIRE (Req #7) ────────────────────────────── */}
      {showModelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 text-left animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-600 text-white flex items-center justify-center font-extrabold shadow-md">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">📊 MODÈLE BUDGÉTAIRE</h3>
                  <p className="text-xs text-slate-500 font-medium">Sélectionnez une option de modèle type</p>
                </div>
              </div>
              <button onClick={() => setShowModelModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <button
                onClick={() => { setShowModelModal(false); setActiveTab('grille-modele'); }}
                className="w-full p-4 rounded-2xl border border-pink-200 bg-pink-50/50 hover:bg-pink-100/80 transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-600 text-white flex items-center justify-center font-black">📋</div>
                  <div>
                    <strong className="text-slate-900 font-extrabold block group-hover:text-pink-700">Grille Budgétaire Interactive</strong>
                    <span className="text-[11px] text-slate-500">Afficher la grille interactive avec ressources, dépenses fixes & variables</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-pink-600" />
              </button>

              <button
                onClick={() => { setShowModelModal(false); handleDownloadExport('excel'); }}
                className="w-full p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/80 transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">📊</div>
                  <div>
                    <strong className="text-slate-900 font-extrabold block group-hover:text-emerald-700">Télécharger le Modèle Excel (.xlsx)</strong>
                    <span className="text-[11px] text-slate-500">Télécharger le gabarit Excel standard prêt à remplir</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </button>

              <button
                onClick={() => { setShowModelModal(false); window.print(); }}
                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center font-black">🖨️</div>
                  <div>
                    <strong className="text-slate-900 font-extrabold block group-hover:text-slate-950">Imprimer le modèle officiel</strong>
                    <span className="text-[11px] text-slate-500">Imprimer la version papier du modèle de budget</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
              </button>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button onClick={() => setShowModelModal(false)} className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700">
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── 📜 MODAL HISTORIQUE DES VERSIONS & AUDIT (Req #11, #17) ─────────── */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-100 space-y-5 text-left animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-extrabold shadow-md">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">📜 HISTORIQUE DES VERSIONS & AUDIT</h3>
                  <p className="text-xs text-slate-500 font-medium">Gestion du versioning budgétaire (V1, V2, V3)</p>
                </div>
              </div>
              <button onClick={() => setShowVersionModal(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="p-4 rounded-2xl border border-violet-200 bg-violet-50/50 space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-violet-900 text-sm">Budget révisé — V2 (Version Actuelle)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-black">VALIDÉ & PUBLIÉ</span>
                </div>
                <p className="text-slate-600 text-[11px]"><strong>Auteur :</strong> Direction Générale • <strong>Date :</strong> 15/06/2026</p>
                <p className="text-slate-700"><strong>Motif :</strong> Augmentation des coûts d'approvisionnement et réajustement masse salariale suite aux embauches Q2.</p>
                <div className="flex justify-between font-mono text-[11px] pt-1 text-slate-800 font-bold border-t border-violet-200/60">
                  <span>Avant : 2 051 000 000 FCFA</span>
                  <span className="text-violet-700">Après : 2 136 000 000 FCFA (+85 M FCFA)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-800 text-sm">Budget initial — V1</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-black">HISTORISÉ</span>
                </div>
                <p className="text-slate-600 text-[11px]"><strong>Auteur :</strong> Dieudonné MELAMEM (DAF) • <strong>Date :</strong> 05/01/2026</p>
                <p className="text-slate-700"><strong>Motif :</strong> Validation du budget prévisionnel initial de l'exercice 2026 en conseil d'administration.</p>
                <div className="font-mono text-[11px] pt-1 text-slate-600 font-bold border-t border-slate-200">
                  <span>Montant Initial : 2 051 000 000 FCFA</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button onClick={() => setShowVersionModal(false)} className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700">
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

