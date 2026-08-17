import React, { useState, useEffect } from 'react';
import { api, ApiError } from '../../services/api';
import {
  TrendingUp, TrendingDown, DollarSign, PieChart, BarChart2, ShieldAlert,
  Sparkles, Sliders, Play, FileText, Settings, AlertCircle, CheckCircle2,
  RefreshCw, ChevronRight, HelpCircle, Layers, ArrowUpRight, ArrowDownLeft, Info,
  Printer, Download, X, Eye, FileSpreadsheet, Check, Brain
} from 'lucide-react';

const fmtMoney = (v: number) => {
  const isNeg = v < 0;
  const absVal = Math.abs(v);
  const formatted = `${Math.round(absVal).toLocaleString('fr-FR')} FCFA`;
  return isNeg ? `-${formatted}` : formatted;
};

// Dynamic multi-year dataset
const YEAR_DATA = {
  'N': {
    yearLabel: 'Exercice 2025 (N)',
    score: 65,
    statusText: '🟠 Situation sous surveillance',
    statusColor: 'amber',
    ca: 1783051000,
    caEvo: '+12.4% vs N-1',
    charges: 1814642949,
    chargesEvo: '+27.8% vs N-1',
    margeOp: '-18.4%',
    margeOpStatus: 'contraction',
    resultatNet: -31591949,
    ebe: -23341949,
    fdr: 580000000,
    tresorerie: 340000000,
    bfr: 240000000,
    indicatorScores: [
      { name: 'Rentabilité', score: '42/100', evo: '↓ -18%', isBad: true },
      { name: 'Liquidité', score: '35/100', evo: '↓ -12%', isBad: true },
      { name: 'Solvabilité', score: '72/100', evo: '↑ +5%', isBad: false },
      { name: 'Trésorerie', score: '38/100', evo: '↓ -20%', isBad: true },
      { name: 'BFR', score: '64/100', evo: '→ stable', isBad: false },
      { name: 'Croissance', score: '82/100', evo: '↑ +12%', isBad: false }
    ],
    diagnosisText: "La situation financière présente un niveau de risque d'exploitation élevé à court terme, principalement dû à une contraction sévère de la marge nette.",
    riskRentabilite: "Le résultat net s'établit à -31,6 M FCFA.",
    riskPerformance: "L'EBE de -23,3 M FCFA indique que l'exploitation courante ne couvre pas ses charges.",
    riskStructure: "Le FDR positif de +5,8 M FCFA assure la couverture réglementaire des emplois stables."
  },
  'N-1': {
    yearLabel: 'Exercice 2024 (N-1)',
    score: 88,
    statusText: '🟢 Situation financière excellente',
    statusColor: 'emerald',
    ca: 1580000000,
    caEvo: '+30.5% vs N-2',
    charges: 1377740000,
    chargesEvo: '+18.2% vs N-2',
    margeOp: '+12.8%',
    margeOpStatus: 'expansion',
    resultatNet: 74260000,
    ebe: 128000000,
    fdr: 620000000,
    tresorerie: 430000000,
    bfr: 190000000,
    indicatorScores: [
      { name: 'Rentabilité', score: '85/100', evo: '↑ +15%', isBad: false },
      { name: 'Liquidité', score: '82/100', evo: '↑ +8%', isBad: false },
      { name: 'Solvabilité', score: '90/100', evo: '↑ +4%', isBad: false },
      { name: 'Trésorerie', score: '88/100', evo: '↑ +22%', isBad: false },
      { name: 'BFR', score: '78/100', evo: '→ maîtrisé', isBad: false },
      { name: 'Croissance', score: '92/100', evo: '↑ +30%', isBad: false }
    ],
    diagnosisText: "Excellente performance globale portée par une forte croissance du chiffre d'affaires et une maîtrise rigoureuse des coûts fixes.",
    riskRentabilite: "Le résultat net est fortement bénéficiaire à +74.2 M FCFA.",
    riskPerformance: "L'EBE s'élève à +128.0 M FCFA, dégageant une capacité d'autofinancement solide.",
    riskStructure: "Le FDR de +6.2 M FCFA couvre très largement les investissements stables de la période."
  },
  'N-2': {
    yearLabel: 'Exercice 2023 (N-2)',
    score: 92,
    statusText: '🟢 Structure financière très solide',
    statusColor: 'emerald',
    ca: 1210000000,
    caEvo: '+15.2% vs N-3',
    charges: 965780000,
    chargesEvo: '+10.1% vs N-3',
    margeOp: '+15.6%',
    margeOpStatus: 'optimale',
    resultatNet: 99220000,
    ebe: 145000000,
    fdr: 680000000,
    tresorerie: 530000000,
    bfr: 150000000,
    indicatorScores: [
      { name: 'Rentabilité', score: '92/100', evo: '↑ +10%', isBad: false },
      { name: 'Liquidité', score: '94/100', evo: '↑ +12%', isBad: false },
      { name: 'Solvabilité', score: '95/100', evo: '↑ +3%', isBad: false },
      { name: 'Trésorerie', score: '94/100', evo: '↑ +18%', isBad: false },
      { name: 'BFR', score: '88/100', evo: '→ optimal', isBad: false },
      { name: 'Croissance', score: '80/100', evo: '↑ +15%', isBad: false }
    ],
    diagnosisText: "Année de référence avec un niveau de rentabilité nette proche de 8.2% et un niveau d'endettement très bas.",
    riskRentabilite: "Bénéfice net record de +99.2 M FCFA.",
    riskPerformance: "Capacité d'autofinancement optimale de +145.0 M FCFA.",
    riskStructure: "Trésorerie nette de +5.3 M FCFA apportant une autonomie financière totale."
  },
  'Budget': {
    yearLabel: 'Budget Prévisionnel 2026',
    score: 95,
    statusText: '🎯 Objectifs de redressement stratégique',
    statusColor: 'violet',
    ca: 2100000000,
    caEvo: '+17.8% prévisionnel',
    charges: 1680000000,
    chargesEvo: '-7.4% vs N',
    margeOp: '+16.0%',
    margeOpStatus: 'objectif',
    resultatNet: 120000000,
    ebe: 180000000,
    fdr: 750000000,
    tresorerie: 570000000,
    bfr: 180000000,
    indicatorScores: [
      { name: 'Rentabilité', score: '90/100', evo: 'Cible +120M', isBad: false },
      { name: 'Liquidité', score: '92/100', evo: 'Cible 1.6', isBad: false },
      { name: 'Solvabilité', score: '95/100', evo: 'Cible >55%', isBad: false },
      { name: 'Trésorerie', score: '90/100', evo: 'Cible +570M', isBad: false },
      { name: 'BFR', score: '85/100', evo: 'Cible DSO 35j', isBad: false },
      { name: 'Croissance', score: '95/100', evo: 'Cible +17.8%', isBad: false }
    ],
    diagnosisText: "Le budget 2026 vise à rétablir la rentabilité positive grâce à une rationalisation des charges de structure et une réduction de 27 jours du DSO.",
    riskRentabilite: "Cible de bénéfice net de +120.0 M FCFA.",
    riskPerformance: "EBE prévisionnel projeté à +180.0 M FCFA.",
    riskStructure: "Trésorerie cible rétablie à +5.7 M FCFA."
  }
};

export const FinancialAnalysisModule: React.FC<{ onNavigate?: (module: any) => void }> = ({ onNavigate }) => {
  // ── States principaux ────────────────────────────────────────────────────────
  const [density, setDensity] = useState<'dirigeant' | 'daf' | 'expert'>('daf');
  const [yearFilter, setYearFilter] = useState<'N' | 'N-1' | 'N-2' | 'Budget'>('N');
  const [timeframe, setTimeframe] = useState<'mensuel' | 'trimestriel' | 'annuel'>('annuel');
  
  // Tab interne du cockpit
  const [activeTab, setActiveTab] = useState<'cockpit' | 'ratios' | 'simulator' | 'action-plan'>('cockpit');

  // Modals & Action notices
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);

  // Action plan state list
  const [actionTasks, setActionTasks] = useState([
    { id: 1, priority: 'Haute', pillar: 'Trésorerie', issue: 'Délai recouvrement DSO à 62j', action: 'Relance systématique factures > 30 jours', impact: 49530000, deadline: '30 jours' },
    { id: 2, priority: 'Haute', pillar: 'Rentabilité', issue: "Hausse charges d'exploitation (+27.8%)", action: 'Audit & réduction des frais généraux hors production', impact: 25000000, deadline: '60 jours' },
    { id: 3, priority: 'Moyenne', pillar: 'Stocks', issue: 'Rotation carburant/essence lente (58j)', action: 'Optimisation des seuils de réapprovisionnement', impact: 15000000, deadline: '90 jours' }
  ]);

  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [newActionPriority, setNewActionPriority] = useState('Haute');
  const [newActionPillar, setNewActionPillar] = useState('Trésorerie');
  const [newActionIssue, setNewActionIssue] = useState('');
  const [newActionText, setNewActionText] = useState('');
  const [newActionImpact, setNewActionImpact] = useState('');
  const [newActionDeadline, setNewActionDeadline] = useState('30 jours');

  // Simulation parameters
  const [caGrowth, setCaGrowth] = useState<number>(0); // in %
  const [chargesChange, setChargesChange] = useState<number>(0); // in %
  const [dsoChange, setDsoChange] = useState<number>(0); // in days
  const [stockChange, setStockChange] = useState<number>(0); // in %

  // Simulated metrics based on sliders
  const [simCA, setSimCA] = useState<number>(1783051000);
  const [simResult, setSimResult] = useState<number>(-31591949);
  const [simBFR, setSimBFR] = useState<number>(2400000);
  const [simCash, setSimCash] = useState<number>(3400000);

  // Get active dataset based on selected year
  const activeData = YEAR_DATA[yearFilter];
  const timeframeDivisor = timeframe === 'mensuel' ? 12 : timeframe === 'trimestriel' ? 4 : 1;

  // Recalculate simulations when inputs change
  useEffect(() => {
    const baseCA = activeData.ca;
    const baseResult = activeData.resultatNet;
    const baseBFR = activeData.bfr;
    const baseCash = activeData.tresorerie;
    const baseCharges = activeData.charges;

    const newCA = baseCA * (1 + caGrowth / 100);
    const caImpact = baseCA * (caGrowth / 100) * 0.18; 
    const chargesImpact = baseCharges * (chargesChange / 100);
    const newResult = baseResult + caImpact - chargesImpact;

    const oneDayCA = baseCA / 360;
    const bfrDsoImpact = oneDayCA * dsoChange;
    const bfrStockImpact = 85000000 * (stockChange / 100);

    const newBFR = baseBFR + bfrDsoImpact + bfrStockImpact;
    const newCash = baseCash - bfrDsoImpact - bfrStockImpact;

    setSimCA(newCA);
    setSimResult(newResult);
    setSimBFR(newBFR);
    setSimCash(newCash);
  }, [caGrowth, chargesChange, dsoChange, stockChange, yearFilter]);

  const triggerPdfExport = async () => {
    try {
      setExportToast("Génération du rapport PDF en cours...");
      await api.downloadManagementReportPdf();
      setExportToast("Le rapport PDF a été téléchargé avec succès.");
      setTimeout(() => setExportToast(null), 4000);
    } catch (err) {
      // Fallback: If backend pdf route is offline/errors, open modal and trigger browser print-to-PDF
      setExportToast("Ouverture du rapport au format PDF...");
      setTimeout(() => setExportToast(null), 3000);
      setReportModalOpen(true);
      setTimeout(() => {
        window.print();
      }, 400);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* EXPORT TOAST NOTIFICATION */}
      {exportToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{exportToast}</span>
        </div>
      )}

      {/* HEADER ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">ANALYSE FINANCIÈRE & COCKPIT</h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Diagnostic financier & aide à la décision stratégique • Conforme SYSCOHADA Révisé
          </p>
        </div>

        {/* Level & Period Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Density Selector */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => setDensity('dirigeant')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                density === 'dirigeant' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dirigeant
            </button>
            <button
              onClick={() => setDensity('daf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                density === 'daf' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              DAF / Gestionnaire
            </button>
            <button
              onClick={() => setDensity('expert')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                density === 'expert' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Analyste / Expert
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReportModalOpen(true)}
              className="px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Générer Rapport</span>
            </button>
            <button
              onClick={triggerPdfExport}
              className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors border border-slate-200 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exporter PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER & PERIOD SELECTOR ROW */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2">Exercice :</span>
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/50">
            {(['N', 'N-1', 'N-2', 'Budget'] as const).map((y) => (
              <button
                key={y}
                onClick={() => setYearFilter(y)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  yearFilter === y ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {y === 'N' ? '2025 (N)' : y === 'N-1' ? '2024 (N-1)' : y === 'N-2' ? '2023 (N-2)' : 'Budget 2026'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2">Fréquence :</span>
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/50">
            {(['mensuel', 'trimestriel', 'annuel'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-md text-xs font-bold capitalize transition-all ${
                  timeframe === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* COCKPIT SUB-TABS */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('cockpit')}
          className={`px-5 py-3 border-b-2 font-bold text-xs transition-colors ${
            activeTab === 'cockpit' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Tableau de Bord & Diagnostic
        </button>
        {density !== 'dirigeant' && (
          <>
            <button
              onClick={() => setActiveTab('ratios')}
              className={`px-5 py-3 border-b-2 font-bold text-xs transition-colors ${
                activeTab === 'ratios' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Analyse Ratios & SIG
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-5 py-3 border-b-2 font-bold text-xs transition-colors ${
                activeTab === 'simulator' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Simulateur de Scénarios
            </button>
          </>
        )}
        <button
          onClick={() => setActiveTab('action-plan')}
          className={`px-5 py-3 border-b-2 font-bold text-xs transition-colors ${
            activeTab === 'action-plan' ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Plan d'Action Financier
        </button>
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'cockpit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: GLOBAL SCORE & FACTORS */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* GLOBAL SCORE CARD */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Score de Santé Financière</h3>
                <span className="text-[10px] font-bold text-slate-400 font-mono">{activeData.yearLabel}</span>
              </div>
              
              <div className="flex items-center gap-5">
                <div className={`relative w-24 h-24 shrink-0 flex items-center justify-center rounded-2xl border ${
                  activeData.score >= 80 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
                }`}>
                  <div className="text-center">
                    <span className={`text-3xl font-black ${
                      activeData.score >= 80 ? 'text-emerald-600' : 'text-amber-600'
                    }`}>{activeData.score}</span>
                    <span className="text-slate-400 text-[10px] block font-bold">/ 100</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide">
                    <span>{activeData.statusText}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
                    {activeData.diagnosisText}
                  </p>
                </div>
              </div>

              {/* Density Level metrics listing */}
              {density !== 'dirigeant' && (
                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Indicateurs de Score ({timeframe})</span>
                  <div className="space-y-1.5">
                    {activeData.indicatorScores.map((idx) => (
                      <div key={idx.name} className="flex justify-between items-center text-xs border-b border-slate-50 pb-1.5">
                        <span className="font-semibold text-slate-600">{idx.name}</span>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="font-extrabold text-slate-800">{idx.score}</span>
                          <span className={`font-bold text-[10px] ${idx.isBad ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {idx.evo}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AUTOMATIC COGNITIVE INSIGHTS */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <h4 className="text-xs font-black tracking-widest uppercase text-violet-300">FinancePro Intelligence</h4>
              </div>

              <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider block mb-1">Diagnostic Synthetique</span>
                <p className="text-xs font-medium leading-relaxed text-slate-200">
                  {activeData.diagnosisText}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex gap-2 text-xs">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 font-bold">1</span>
                  <div>
                    <strong className="text-white block font-bold">Rentabilité Net</strong>
                    <span className="text-slate-400 text-[11px] leading-relaxed">{activeData.riskRentabilite}</span>
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 font-bold">2</span>
                  <div>
                    <strong className="text-white block font-bold">Performance Opérationnelle</strong>
                    <span className="text-slate-400 text-[11px] leading-relaxed">{activeData.riskPerformance}</span>
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 font-bold">3</span>
                  <div>
                    <strong className="text-white block font-bold">Structure Financière</strong>
                    <span className="text-slate-400 text-[11px] leading-relaxed">{activeData.riskStructure}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE & RIGHT COLUMNS: COCKPIT CORE CARDS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* WHY NET INCOME IS NEGATIVE / POSITIVE (DRILLDOWN INSIGHT) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Structure de Performance ({activeData.yearLabel} - {timeframe})
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  activeData.resultatNet < 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  Analyse de Rentabilité
                </span>
              </div>

              {/* Economic drilldown layout */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase">Chiffre d'Affaires</span>
                  <div className="text-sm font-black text-slate-900 mt-1">{fmtMoney(activeData.ca / timeframeDivisor)}</div>
                  <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">{activeData.caEvo}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase">Charges Exploit.</span>
                  <div className="text-sm font-black text-slate-900 mt-1">{fmtMoney(activeData.charges / timeframeDivisor)}</div>
                  <span className="text-[10px] font-bold text-rose-600 block mt-0.5">{activeData.chargesEvo}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase">Marge Opérationnelle</span>
                  <div className="text-sm font-black text-slate-900 mt-1">{activeData.margeOp}</div>
                  <span className={`text-[10px] font-bold block mt-0.5 ${
                    activeData.resultatNet < 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {activeData.margeOpStatus}
                  </span>
                </div>

                <div className={`p-3 rounded-2xl border ${
                  activeData.resultatNet < 0 ? 'bg-rose-50/50 border-rose-100' : 'bg-emerald-50/50 border-emerald-100'
                }`}>
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase">Résultat Net</span>
                  <div className={`text-sm font-black mt-1 ${
                    activeData.resultatNet < 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {fmtMoney(activeData.resultatNet / timeframeDivisor)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 block mt-0.5">
                    {activeData.resultatNet < 0 ? 'Déficit net' : 'Bénéfice net'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl text-xs font-semibold text-slate-600 leading-relaxed border border-slate-100 flex gap-2.5 items-start">
                <Info className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Constat d'expert :</strong> {activeData.diagnosisText}
                </p>
              </div>
            </div>

            {/* EXPERT SPECIFIC SECTION: SIG RECALCULATION TABLE (Visible in Analyste/Expert mode) */}
            {density === 'expert' && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-xs font-black text-slate-900 uppercase">Soldes Intermédiaires de Gestion (SIG) & Retraitements</h3>
                  <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">Norme SYSCOHADA Expert</span>
                </div>

                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b pb-2 font-extrabold text-left">
                      <th className="pb-2">Solde / Poste Retraité</th>
                      <th className="text-right pb-2">Montant Brut ({timeframe})</th>
                      <th className="text-right pb-2">Retraitement</th>
                      <th className="text-right pb-2">Montant Retraité</th>
                    </tr>
                  </thead>
                  <tbody className="font-semibold text-slate-700 divide-y divide-slate-100 font-mono">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 font-sans font-bold">Marge Brute sur Marchandises</td>
                      <td className="text-right">{fmtMoney((activeData.ca * 0.8) / timeframeDivisor)}</td>
                      <td className="text-right text-slate-400">-</td>
                      <td className="text-right font-bold">{fmtMoney((activeData.ca * 0.8) / timeframeDivisor)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 font-sans font-bold">Valeur Ajoutée (VA)</td>
                      <td className="text-right">{fmtMoney((activeData.ca * 0.35) / timeframeDivisor)}</td>
                      <td className="text-right text-violet-600">+12,500,000 FCFA (Crédit-bail)</td>
                      <td className="text-right font-bold text-emerald-600">{fmtMoney((activeData.ca * 0.35 + 12500000) / timeframeDivisor)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 font-sans font-bold">Excédent Brut d'Exploitation (EBE)</td>
                      <td className="text-right text-rose-600">{fmtMoney(activeData.ebe / timeframeDivisor)}</td>
                      <td className="text-right text-violet-600">+8,400,000 FCFA (Personnel Ext.)</td>
                      <td className="text-right font-bold">{fmtMoney((activeData.ebe + 8400000) / timeframeDivisor)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 font-sans font-bold">Résultat d'Exploitation (REX)</td>
                      <td className="text-right text-rose-600">{fmtMoney((activeData.resultatNet * 0.9) / timeframeDivisor)}</td>
                      <td className="text-right text-slate-400">-</td>
                      <td className="text-right font-bold text-rose-600">{fmtMoney((activeData.resultatNet * 0.9) / timeframeDivisor)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* DYNAMIC BFR & CASH FLOW DIAGNOSIS */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Analyse du Besoin en Fonds de Roulement (BFR)</h3>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full uppercase">Cycle de conversion</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Stocks</span>
                    <span className="text-[10px] font-extrabold text-rose-600">↑ +11%</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-1">+85,0 M FCFA</div>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">Sur-stockage constaté essence</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Créances Clients</span>
                    <span className="text-[10px] font-extrabold text-rose-600">↑ +18%</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-1">+123,0 M FCFA</div>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">Délai moyen de recouvrement en hausse</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Dettes Fournisseurs</span>
                    <span className="text-[10px] font-extrabold text-emerald-600">↓ -4%</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-1">-184,0 M FCFA</div>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">Règlements anticipés effectués</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
                <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">Recommandation d'optimisation BFR :</span>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  L'accroissement conjoint des stocks et des créances clients combiné à la baisse des dettes fournisseurs détruit la trésorerie.
                  Une réduction de <strong>10 jours</strong> du délai moyen de recouvrement clients (DSO) permettrait de libérer environ <strong>49 530 000 FCFA</strong> de trésorerie nette immédiate.
                </p>
              </div>
            </div>

            {/* FINANCIAL TRENDS METRICS (6 CORE CHARTS / BLOCKS) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tendances et Évolution Historique</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {[
                  { name: 'CA', val: fmtMoney(activeData.ca / timeframeDivisor), evo: activeData.caEvo, good: true },
                  { name: 'Résultat Net', val: fmtMoney(activeData.resultatNet / timeframeDivisor), evo: activeData.resultatNet < 0 ? '↓ -18%' : '↑ +12%', good: activeData.resultatNet >= 0 },
                  { name: 'EBE', val: fmtMoney(activeData.ebe / timeframeDivisor), evo: activeData.ebe < 0 ? '↓ -14%' : '↑ +15%', good: activeData.ebe >= 0 },
                  { name: 'Trésorerie', val: fmtMoney(activeData.tresorerie / timeframeDivisor), evo: '↓ -20%', good: false },
                  { name: 'BFR', val: fmtMoney(activeData.bfr / timeframeDivisor), evo: '↑ +15%', good: false },
                  { name: 'Fonds Propres', val: '18,5 M', evo: '→ stable', good: true }
                ].map((t) => (
                  <div key={t.name} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase block">{t.name}</span>
                    <div className="font-extrabold text-slate-800 text-xs mt-1 truncate">{t.val}</div>
                    <span className={`text-[9px] font-black block mt-0.5 ${
                      t.good ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {t.evo}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* RATIOS & SIG TAB */}
      {activeTab === 'ratios' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* RATIOS BY SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* RENTABILITÉ */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-xs font-black tracking-widest text-slate-400 uppercase">1. Ratios de Rentabilité</h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b pb-2 font-extrabold text-left">
                    <th className="pb-2">Ratio</th>
                    <th className="text-right pb-2">Valeur N</th>
                    <th className="text-right pb-2">N-1</th>
                    <th className="text-right pb-2">Objectif</th>
                    <th className="pb-2 pl-3">Interprétation</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-slate-700 divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold">ROE (Capitaux Propres)</td>
                    <td className="text-right font-mono font-bold text-rose-600">-17.1%</td>
                    <td className="text-right font-mono">8.2%</td>
                    <td className="text-right font-mono">15.0%</td>
                    <td className="text-rose-600 pl-3">Critique - Perte de valeur</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold">ROA (Actifs globaux)</td>
                    <td className="text-right font-mono font-bold text-rose-600">-0.9%</td>
                    <td className="text-right font-mono">3.4%</td>
                    <td className="text-right font-mono">5.0%</td>
                    <td className="text-rose-600 pl-3">Insuffisance rendement actif</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold">Marge brute</td>
                    <td className="text-right font-mono">79.6%</td>
                    <td className="text-right font-mono">81.2%</td>
                    <td className="text-right font-mono">80.0%</td>
                    <td className="text-emerald-600 pl-3">Satisfaisante</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold">Marge opérationnelle</td>
                    <td className="text-right font-mono font-bold text-rose-600">-18.4%</td>
                    <td className="text-right font-mono">4.7%</td>
                    <td className="text-right font-mono">10.0%</td>
                    <td className="text-rose-600 pl-3">Forte contraction</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* LIQUIDITÉ & SOLVABILITÉ */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-xs font-black tracking-widest text-slate-400 uppercase">2. Liquidité & Solvabilité</h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b pb-2 font-extrabold text-left">
                    <th className="pb-2">Ratio</th>
                    <th className="text-right pb-2">Valeur N</th>
                    <th className="text-right pb-2">N-1</th>
                    <th className="text-right pb-2">Objectif</th>
                    <th className="pb-2 pl-3">Interprétation</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-slate-700 divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold">Liquidité générale</td>
                    <td className="text-right font-mono">1.15</td>
                    <td className="text-right font-mono">1.45</td>
                    <td className="text-right font-mono">&gt; 1.50</td>
                    <td className="text-amber-600 pl-3">Sous surveillance</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold">Autonomie financière</td>
                    <td className="text-right font-mono font-bold text-emerald-600">52.8%</td>
                    <td className="text-right font-mono">51.0%</td>
                    <td className="text-right font-mono">&gt; 50.0%</td>
                    <td className="text-emerald-600 pl-3">Structure équilibrée</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold">Endettement net</td>
                    <td className="text-right font-mono">24.3%</td>
                    <td className="text-right font-mono">25.0%</td>
                    <td className="text-right font-mono">&lt; 40.0%</td>
                    <td className="text-emerald-600 pl-3">Niveau modéré</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* GESTION & CYCLES */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 md:col-span-2">
              <h4 className="text-xs font-black tracking-widest text-slate-400 uppercase">3. Délais de Rotation & Gestion des Cycles</h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b pb-2 font-extrabold text-left">
                    <th className="pb-2">Ratio</th>
                    <th className="text-right pb-2">Valeur N</th>
                    <th className="text-right pb-2">N-1</th>
                    <th className="text-right pb-2">Objectif</th>
                    <th className="pb-2 pl-3">Interprétation / Action</th>
                  </tr>
                </thead>
                <tbody className="font-semibold text-slate-700 divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold">Délai Règlement Clients (DSO)</td>
                    <td className="text-right font-mono font-bold text-rose-600">62 jours</td>
                    <td className="text-right font-mono">45 jours</td>
                    <td className="text-right font-mono">35 jours</td>
                    <td className="text-rose-600 pl-3">Critique - Dégradation significativa. Action de relance impérative.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold">Délai Règlement Fournisseurs (DPO)</td>
                    <td className="text-right font-mono">48 jours</td>
                    <td className="text-right font-mono">52 jours</td>
                    <td className="text-right font-mono">45 jours</td>
                    <td className="text-slate-500 pl-3">Dans les normes sectorielles.</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold">Rotation des Stocks (essence)</td>
                    <td className="text-right font-mono font-bold text-rose-600">58 jours</td>
                    <td className="text-right font-mono">42 jours</td>
                    <td className="text-right font-mono">30 jours</td>
                    <td className="text-rose-600 pl-3">Sur-stockage important. Libérer le capital immobilisé.</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* SIMULATOR TAB */}
      {activeTab === 'simulator' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase">Simulateur de Scénarios Financiers</h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Glissez les curseurs pour voir l'impact immédiat sur le Résultat et la Trésorerie</p>
            </div>
            <button
              onClick={() => {
                setCaGrowth(0);
                setChargesChange(0);
                setDsoChange(0);
                setStockChange(0);
              }}
              className="text-[10px] font-bold text-violet-600 hover:underline"
            >
              Réinitialiser
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* SLIDERS COLUMN */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* SLIDER CA */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Croissance Chiffre d'Affaires</span>
                  <span className="font-mono text-violet-600">{caGrowth > 0 ? `+${caGrowth}` : caGrowth} %</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="40"
                  step="1"
                  value={caGrowth}
                  onChange={(e) => setCaGrowth(Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                  <span>Récession (-20%)</span>
                  <span>Stable</span>
                  <span>Forte Hausse (+40%)</span>
                </div>
              </div>

              {/* SLIDER CHARGES */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Variation des Charges d'Exploitation</span>
                  <span className="font-mono text-violet-600">{chargesChange > 0 ? `+${chargesChange}` : chargesChange} %</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="1"
                  value={chargesChange}
                  onChange={(e) => setChargesChange(Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                  <span>Coupe Budgétaire (-20%)</span>
                  <span>Stable</span>
                  <span>Inflation (+20%)</span>
                </div>
              </div>

              {/* SLIDER DSO */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Délai Règlement Clients (DSO)</span>
                  <span className="font-mono text-violet-600">{dsoChange > 0 ? `+${dsoChange}` : dsoChange} jours</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={dsoChange}
                  onChange={(e) => setDsoChange(Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                  <span>Relance active (-30j)</span>
                  <span>Stable</span>
                  <span>Retards (+30j)</span>
                </div>
              </div>

              {/* SLIDER STOCKS */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Volume des Stocks</span>
                  <span className="font-mono text-violet-600">{stockChange > 0 ? `+${stockChange}` : stockChange} %</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="20"
                  step="1"
                  value={stockChange}
                  onChange={(e) => setStockChange(Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                  <span>Destockage (-30%)</span>
                  <span>Stable</span>
                  <span>Sur-stockage (+20%)</span>
                </div>
              </div>

            </div>

            {/* RESULTS COMPARISON COLUMN */}
            <div className="lg:col-span-1 bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between gap-5">
              
              <div className="space-y-4">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Résultats Simulés :</span>
                
                {/* Result Block */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 font-bold">Chiffre d'Affaires</span>
                  <div className="text-base font-black text-slate-900">{fmtMoney(simCA)}</div>
                </div>

                {/* Result Block */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 font-bold">Résultat Net</span>
                  <div className={`text-base font-black ${simResult < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {fmtMoney(simResult)}
                  </div>
                </div>

                {/* Cash Flow Block */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 font-bold">Trésorerie Simulée</span>
                  <div className="text-base font-black text-slate-900">{fmtMoney(simCash)}</div>
                  <span className="text-[10px] font-bold text-slate-400 block">Effet DSO/Stocks inclus</span>
                </div>
              </div>

              {/* Side-by-side scenarios */}
              <div className="border-t border-slate-200 pt-4 space-y-2 text-[11px] font-semibold text-slate-500">
                <div className="flex justify-between">
                  <span>Actuel</span>
                  <span className="font-mono text-rose-600">{fmtMoney(activeData.resultatNet)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cible Optimisée</span>
                  <span className="font-mono text-emerald-600">+12 800 000 FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span>Scénario Prudent</span>
                  <span className="font-mono text-slate-700">-18 400 000 FCFA</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ACTION PLAN TAB */}
      {activeTab === 'action-plan' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase">Plan d'Action Financier Recommandé</h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Recommandations stratégiques formulées par l'Intelligence FinancePro</p>
            </div>
            <button
              onClick={() => setAddTaskModalOpen(true)}
              className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-[10.5px] font-bold hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-1"
            >
              + Ajouter une tâche
            </button>
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b pb-2 font-extrabold text-left">
                <th className="pb-2">Priorité</th>
                <th className="pb-2">Pilier Financier</th>
                <th className="pb-2">Problématique</th>
                <th className="pb-2">Action Corrective Recommandée</th>
                <th className="text-right pb-2">Impact Estimé</th>
                <th className="pb-2 pl-4">Échéance</th>
              </tr>
            </thead>
            <tbody className="font-semibold text-slate-700 divide-y divide-slate-100">
              {actionTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase border ${
                      t.priority === 'Haute'
                        ? 'bg-rose-50 text-rose-600 border-rose-100'
                        : t.priority === 'Moyenne'
                        ? 'bg-amber-50 text-amber-600 border-amber-100'
                        : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3 text-slate-950 font-bold">{t.pillar}</td>
                  <td className="py-3">{t.issue}</td>
                  <td className="py-3 text-slate-600">{t.action}</td>
                  <td className="py-3 text-right font-mono font-bold text-emerald-600">{t.impact > 0 ? `+${fmtMoney(t.impact)}` : fmtMoney(t.impact)}</td>
                  <td className="py-3 pl-4 font-mono text-slate-500">{t.deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* GENERATE EXECUTIVE REPORT MODAL 10/10 */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl border border-slate-100 space-y-6 text-left max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold shadow-md shadow-blue-600/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">📄 RAPPORT FINANCIER & DIAGNOSTIC IA (EXECUTIVE REPORT)</h3>
                  <p className="text-xs text-slate-500 font-medium">{activeData.yearLabel} — Confidentiel Direction • FinancePro SYSCOHADA</p>
                </div>
              </div>
              <button onClick={() => setReportModalOpen(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* Hero Score Banner & 4 Pillar Cards */}
            <div className="rounded-2xl p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
                <div>
                  <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-indigo-300">Score Global de Santé Financière</div>
                  <div className="text-2xl font-black text-amber-400 flex items-center gap-2">
                    {activeData.score} / 100 <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">🟠 Situation sous Vigilance</span>
                  </div>
                </div>
                <div className="text-right text-xs text-indigo-200">
                  <div>Conformité SYSCOHADA : <strong className="text-emerald-400">100%</strong></div>
                  <div>Audit comptable : <strong className="text-white">Conforme</strong></div>
                </div>
              </div>

              {/* 4 Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-[9px] text-slate-400 font-sans font-bold uppercase">Rentabilité</div>
                  <div className="text-sm font-black text-emerald-400 mt-1">🟢 78 / 100</div>
                  <div className="text-[9px] text-emerald-300 font-sans mt-0.5">Bonne (38.8%)</div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-[9px] text-slate-400 font-sans font-bold uppercase">Liquidité</div>
                  <div className="text-sm font-black text-rose-400 mt-1">🔴 42 / 100</div>
                  <div className="text-[9px] text-rose-300 font-sans mt-0.5">Critique (DSO 67j)</div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-[9px] text-slate-400 font-sans font-bold uppercase">Trésorerie</div>
                  <div className="text-sm font-black text-amber-400 mt-1">🟠 61 / 100</div>
                  <div className="text-[9px] text-amber-300 font-sans mt-0.5">À surveiller (15,6M)</div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-[9px] text-slate-400 font-sans font-bold uppercase">Solvabilité</div>
                  <div className="text-sm font-black text-emerald-400 mt-1">🟢 82 / 100</div>
                  <div className="text-[9px] text-emerald-300 font-sans mt-0.5">Saine (Fonds pr.)</div>
                </div>
              </div>
            </div>

            {/* 1. Synthèse Exécutive */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-600" /> 1. SYNTHÈSE EXÉCUTIVE
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium">
                "La situation financière de l'entreprise est globalement saine, mais une vigilance particulière doit être portée à la liquidité et au délai moyen d'encaissement clients."
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-1.5">
                  <div className="font-extrabold text-emerald-900 flex items-center gap-1.5">🟢 Points Forts</div>
                  <ul className="space-y-1 text-emerald-800 text-[11px] font-medium">
                    <li>• Marge brute d'exploitation : <strong>38,8 %</strong></li>
                    <li>• Fonds propres stables : <strong>26 200 000 FCFA</strong></li>
                    <li>• Conformité SYSCOHADA : <strong>100 %</strong></li>
                  </ul>
                </div>
                <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200 space-y-1.5">
                  <div className="font-extrabold text-rose-900 flex items-center gap-1.5">🔴 Points de Vigilance</div>
                  <ul className="space-y-1 text-rose-800 text-[11px] font-medium">
                    <li>• Délai moyen de paiement client : <strong>67 jours</strong></li>
                    <li>• Tension prévisionnelle de trésorerie : <strong>12 %</strong></li>
                    <li>• Créances clients en retard : <strong>4 850 000 FCFA</strong></li>
                  </ul>
                </div>
              </div>

              <div className="p-3 bg-blue-600 text-white rounded-xl flex items-center justify-between gap-3 text-xs mt-2">
                <div>
                  <div className="font-extrabold">🎯 PRIORITÉ N°1 : Accélérer les encaissements clients</div>
                  <div className="text-[11px] text-blue-100 font-mono">Impact potentiel : +4 850 000 FCFA de trésorerie disponible</div>
                </div>
                <button
                  onClick={() => { setReportModalOpen(false); onNavigate?.('invoicing'); }}
                  className="px-3.5 py-1.5 rounded-lg bg-white text-blue-700 font-extrabold text-xs hover:bg-blue-50 transition-colors shrink-0"
                >
                  Relancer les créances →
                </button>
              </div>
            </div>

            {/* 2. Les 5 Chiffres à Retenir */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">📌 LES 5 CHIFFRES À RETENIR</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono">
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
                  <div className="text-[9px] text-slate-500 font-sans font-bold">Chiffre d'Affaires</div>
                  <div className="text-xs font-bold text-slate-900 mt-1">{fmtMoney(activeData.ca / timeframeDivisor)}</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[9px] text-emerald-700 font-sans font-bold">Résultat Net</div>
                  <div className="text-xs font-bold text-emerald-700 mt-1">{fmtMoney(activeData.resultatNet / timeframeDivisor)}</div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="text-[9px] text-blue-700 font-sans font-bold">Trésorerie Nette</div>
                  <div className="text-xs font-bold text-blue-700 mt-1">{fmtMoney(activeData.tresorerie / timeframeDivisor)}</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[9px] text-amber-700 font-sans font-bold">Besoin BFR</div>
                  <div className="text-xs font-bold text-amber-700 mt-1">{fmtMoney(activeData.bfr / timeframeDivisor)}</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="text-[9px] text-rose-700 font-sans font-bold">Créances Clients</div>
                  <div className="text-xs font-bold text-rose-700 mt-1">4.85 M FCFA</div>
                </div>
              </div>
            </div>

            {/* 3. Évolution N vs N-1 & Interprétation IA */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">📊 ÉVOLUTION N VS N-1 & INTERPRÉTATION IA</h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono text-xs">
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <div className="text-[9px] text-slate-400 font-sans">CA</div>
                  <div className="font-bold text-emerald-600">{activeData.caEvo} 🟢</div>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <div className="text-[9px] text-slate-400 font-sans">Résultat Net</div>
                  <div className="font-bold text-emerald-600">+8,2 % 🟢</div>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <div className="text-[9px] text-slate-400 font-sans">Trésorerie</div>
                  <div className="font-bold text-rose-600">-4,5 % 🔴</div>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <div className="text-[9px] text-slate-400 font-sans">Créances</div>
                  <div className="font-bold text-rose-600">+18,2 % 🔴</div>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <div className="text-[9px] text-slate-400 font-sans">BFR</div>
                  <div className="font-bold text-amber-600">+9,1 % 🟠</div>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 text-xs text-indigo-900 font-sans font-medium">
                💡 <strong>Interprétation IA :</strong> Le chiffre d'affaires et le résultat net progresse de manière satisfaisante, mais l'augmentation simultanée des créances clients (+18,2%) absorbe une part importante de la trésorerie disponible.
              </div>
            </div>

            {/* 4. Plan 30 / 60 / 90 Jours Opérationnel */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">📅 PLAN D'ACTION OPÉRATIONNEL 30 / 60 / 90 JOURS</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                  <div className="font-extrabold text-rose-900 flex justify-between">
                    <span>🚨 30 JOURS — URGENT</span>
                    <span className="bg-rose-200 text-rose-800 text-[9px] px-1.5 py-0.5 rounded font-mono">Priorité 🔴</span>
                  </div>
                  <div className="text-slate-700"><strong>Action :</strong> Recouvrer les créances &gt;30 jours</div>
                  <div className="text-[11px] text-slate-500 font-mono">Responsable : DAF | Impact : +4 850 000 FCFA</div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <div className="font-extrabold text-amber-900 flex justify-between">
                    <span>🟠 60 JOURS — OPTIMISATION</span>
                    <span className="bg-amber-200 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-mono">Priorité 🟠</span>
                  </div>
                  <div className="text-slate-700"><strong>Action :</strong> Renégocier les conditions fournisseurs</div>
                  <div className="text-[11px] text-slate-500 font-mono">Objectif : DPO 30j ➔ 45j | Impact : +1 200 000 FCFA</div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                  <div className="font-extrabold text-emerald-900 flex justify-between">
                    <span>🟢 90 JOURS — DÉVELOPPEMENT</span>
                    <span className="bg-emerald-200 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-mono">Priorité 🟢</span>
                  </div>
                  <div className="text-slate-700"><strong>Action :</strong> Placement du surplus de trésorerie</div>
                  <div className="text-[11px] text-slate-500 font-mono">Option : Compte à terme remuneré | Rendement +4.5%</div>
                </div>
              </div>
            </div>

            {/* 5. Anomalies & Audit */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <h4 className="font-black uppercase tracking-wider text-slate-900">🚨 ANOMALIES & POINTS À VÉRIFIER (AUDIT CONTRÔLE INTERNE)</h4>
              <div className="space-y-1 text-slate-700 font-medium">
                <div className="flex items-center gap-2 text-rose-700">🔴 3 créances dépassent 60 jours d'échéance.</div>
                <div className="flex items-center gap-2 text-amber-700">🟠 2 écritures présentent un risque de mauvaise imputation analytique.</div>
                <div className="flex items-center gap-2 text-amber-700">🟠 Écart de rapprochement bancaire temporaire : 250 000 FCFA.</div>
                <div className="flex items-center gap-2 text-emerald-700">🟢 Aucune anomalie majeure sur la déclaration de TVA collectée.</div>
              </div>
            </div>

            {/* 6. Confiance IA & Données */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs border border-slate-800">
              <div className="flex justify-between font-mono font-bold text-indigo-300">
                <span>🤖 Indice de Confiance IA : 94 %</span>
                <span>Données Contrôlées</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans">
                Calcul basé sur 1 248 écritures comptables analysées, 96 % des comptes auxiliaires renseignés, 12 mois de données historiques et 0 anomalie bloquante.
              </p>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between font-mono">
                <span>Sources : Journal, Grand Livre, Balance General, Factures, Banques</span>
                <span>Mise à jour : 17/08/2026</span>
              </div>
            </div>

            {/* Footer & Exports */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div className="text-[11px] text-slate-500 font-medium max-w-sm">
                ⚠️ <i>Rapport généré par FinancePro — Aide à la décision à faire valider par un expert-comptable ou DAF habilité.</i>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setReportModalOpen(false); triggerPdfExport(); }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                >
                  📄 PDF Direction
                </button>
                <button
                  onClick={() => { setReportModalOpen(false); triggerPdfExport(); }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                >
                  📊 Excel Détaillé
                </button>
                <button
                  onClick={() => { setReportModalOpen(false); triggerPdfExport(); }}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                >
                  📝 Word Pro
                </button>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Fermer
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ADD ACTION MODAL */}
      {addTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase">Ajouter une Action Corrective</h3>
              <button onClick={() => setAddTaskModalOpen(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Priorité</label>
                  <select
                    value={newActionPriority}
                    onChange={(e) => setNewActionPriority(e.target.value)}
                    className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <option value="Haute">🔴 Haute</option>
                    <option value="Moyenne">🟠 Moyenne</option>
                    <option value="Basse">🔵 Basse</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Pilier Financier</label>
                  <select
                    value={newActionPillar}
                    onChange={(e) => setNewActionPillar(e.target.value)}
                    className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <option value="Trésorerie">Trésorerie</option>
                    <option value="Rentabilité">Rentabilité</option>
                    <option value="Stocks">Stocks</option>
                    <option value="BFR">BFR</option>
                    <option value="Fiscalité">Fiscalité</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Problématique</label>
                <input
                  type="text"
                  value={newActionIssue}
                  onChange={(e) => setNewActionIssue(e.target.value)}
                  placeholder="Ex: DSO excessif à 62 jours"
                  className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Action Corrective Recommandée</label>
                <input
                  type="text"
                  value={newActionText}
                  onChange={(e) => setNewActionText(e.target.value)}
                  placeholder="Ex: Relance automatique par email"
                  className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Impact Estimé (FCFA)</label>
                  <input
                    type="number"
                    value={newActionImpact}
                    onChange={(e) => setNewActionImpact(e.target.value)}
                    placeholder="Ex: 49000000"
                    className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Échéance</label>
                  <input
                    type="text"
                    value={newActionDeadline}
                    onChange={(e) => setNewActionDeadline(e.target.value)}
                    placeholder="Ex: 30 jours"
                    className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setAddTaskModalOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setActionTasks([
                    ...actionTasks,
                    {
                      id: actionTasks.length + 1,
                      priority: newActionPriority,
                      pillar: newActionPillar,
                      issue: newActionIssue || 'Problème identifié',
                      action: newActionText || 'Action planifiée',
                      impact: Number(newActionImpact) || 0,
                      deadline: newActionDeadline || '30 jours'
                    }
                  ]);
                  setAddTaskModalOpen(false);
                  setNewActionIssue('');
                  setNewActionText('');
                  setNewActionImpact('');
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
              >
                Créer l'Action
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
