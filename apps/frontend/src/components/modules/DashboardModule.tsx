import React, { useEffect, useState } from 'react';
import { 
  Calculator, Network, RefreshCw, FileText, CheckCircle2, 
  TrendingUp, Users, ArrowRight, ShieldCheck, PieChart,
  Settings, Layers, ChevronRight, Activity, DollarSign
} from 'lucide-react';
import { DashboardMetrics } from '@financepro/shared';
import { api } from '../../services/api';

export const DashboardModule: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    api.getMetrics().then(setMetrics);
  }, []);

  if (!metrics) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">Chargement des métriques financières OHADA...</div>
    );
  }

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 bg-[#f4f7fc] min-h-screen p-4 sm:p-6 text-slate-900 rounded-2xl">

      {/* Top Section Title & Subtitle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Analitics characteristic</h2>
          <p className="text-xs text-slate-500 font-medium">Vue d'ensemble et contrôle budgétaire de l'entreprise (Norme SYSCOHADA)</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
            Période : 01.01.2026 - 31.12.2026
          </span>
        </div>
      </div>

      {/* 4 Top KPI Cards Row (Identical to Red, Blue, Teal, Gray Cards in Image) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Bright Crimson Red Card */}
        <div className="bg-red-600 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] text-white/80 font-mono">Header inside 01.01.2026</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">{formatMoney(metrics.tresorerieNetteTotal)}</div>
            <div className="text-xs text-white/90 font-medium mt-1">Trésorerie Nette Disponible (Comptes 521/541)</div>
          </div>
        </div>

        {/* Card 2: Deep Blue Card */}
        <div className="bg-[#0f2d5e] text-white rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Network className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] text-blue-200/80 font-mono">Header inside</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">{formatMoney(metrics.chiffreAffairesMois)}</div>
            <div className="text-xs text-blue-200 font-medium mt-1">Chiffre d'Affaires Mensuel (Compte 701)</div>
          </div>
        </div>

        {/* Card 3: Teal / Cyan Card */}
        <div className="bg-teal-600 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] text-teal-100/80 font-mono">Header inside</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">{formatMoney(metrics.creancesClientsTotal)}</div>
            <div className="text-xs text-teal-100 font-medium mt-1">Créances Clients à Recouvrer (Compte 411)</div>
          </div>
        </div>

        {/* Card 4: Soft Gray Metallic Card */}
        <div className="bg-slate-200 text-slate-900 border border-slate-300 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-slate-300 flex items-center justify-center">
              <FileText className="w-5 h-5 text-slate-700" />
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Header inside</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">{formatMoney(metrics.dettesFournisseursTotal)}</div>
            <div className="text-xs text-slate-600 font-medium mt-1">Dettes Fournisseurs à Régler (Compte 401)</div>
          </div>
        </div>

      </div>

      {/* Middle Progress Bar Section (DATA IN NUMBERS / Readiness 62%) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-900 tracking-wider">DATA IN NUMBERS 01.01.2026 — CONFORMITÉ SYSCOHADA</span>
          <span className="text-blue-900 font-extrabold">Readiness percentage - 62%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-r from-blue-900 via-teal-500 to-emerald-500 h-full w-[62%] rounded-full"></div>
        </div>
      </div>

      {/* Middle 3 Panel Grid (Identical to Image Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Panel: DEPOSIT PARAMETER / Employee & Partner Table */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-extrabold uppercase text-slate-900">DEPOSIT PARAMETER</h3>
              <p className="text-[10px] text-slate-400">Flux d'écritures & collaborateurs</p>
            </div>
            <div className="text-[10px] text-right text-slate-500 font-mono">
              <div>Parameter Amount : 99 000 XAF</div>
              <div>Parameter Percent : 33%</div>
            </div>
          </div>

          {/* Table Rows */}
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-[10px]">E1</div>
                <div>
                  <div className="font-bold text-slate-900 font-sans">Alain KOUASSI (Comptable)</div>
                  <div className="text-[10px] text-slate-400">15 documents traités</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-900">120 000 XAF</div>
                <div className="text-[10px] text-red-600 font-bold">-3%</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-900 flex items-center justify-center font-bold text-[10px]">E2</div>
                <div>
                  <div className="font-bold text-slate-900 font-sans">Fatou DIOP (Gestionnaire)</div>
                  <div className="text-[10px] text-slate-400">15 documents traités</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-teal-900">120 000 XAF</div>
                <div className="text-[10px] text-red-600 font-bold">-3%</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold text-[10px]">E3</div>
                <div>
                  <div className="font-bold text-slate-900 font-sans">Marc KOFFI (Auditeur)</div>
                  <div className="text-[10px] text-slate-400">15 documents traités</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-indigo-900">120 000 XAF</div>
                <div className="text-[10px] text-red-600 font-bold">-3%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel: OVERALL EFFICIENCY / Dual Donut Charts */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-xs font-extrabold uppercase text-slate-900">OVERALL EFFICIENCY</h3>
            <p className="text-[10px] text-slate-400">Efficacité globale & Ratios financiers</p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 text-center">
            {/* Donut Meter 1 */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-24 h-24 rounded-full border-8 border-blue-900 border-t-teal-400 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-base font-extrabold text-slate-900">97,7%</div>
                  <div className="text-[9px] text-slate-400">Ratio BFR/FDR</div>
                </div>
              </div>
              <div className="text-xs font-bold text-slate-800 mt-2">Effectivity</div>
            </div>

            {/* Donut Meter 2 */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-24 h-24 rounded-full border-8 border-red-600 border-l-blue-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs font-extrabold text-slate-900">6.88M</div>
                  <div className="text-[9px] text-slate-400">EBE Brut</div>
                </div>
              </div>
              <div className="text-xs font-bold text-slate-800 mt-2">Gross Amount</div>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center text-[10px] text-slate-600 font-medium">
            Tous les ratios de solvabilité sont conformes aux exigences financières OHADA.
          </div>
        </div>

        {/* Right Panel: General Indicators (4 Circular Cost Meters matching image) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-900">General indicators</h3>
            <p className="text-[10px] text-slate-400">Indicateurs de coûts journaliers</p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-600">Cost data</span>
              <span className="text-xs font-bold bg-blue-900 text-white px-2 py-0.5 rounded-full">28 000 XAF</span>
              <span className="text-[9px] text-slate-400">in a day</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-600">Cost data</span>
              <span className="text-xs font-bold bg-blue-900 text-white px-2 py-0.5 rounded-full">555 000 XAF</span>
              <span className="text-[9px] text-slate-400">in a day</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-600">Score Qualité</span>
              <span className="text-xs font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">94,6 / 100</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-600">Score Audit</span>
              <span className="text-xs font-bold bg-amber-600 text-white px-2 py-0.5 rounded-full">48 / 100</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Section: Employees Flow Table + Effectivity 5 Action Pill Cards + Accounts Callout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Bottom Left & Center: Employee Rating & 5 Action Cards */}
        <div className="lg:col-span-8 space-y-6">

          {/* Employee Rating Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase text-slate-900 mb-3">EMPLOYEES / RATING & FLOWS</h3>
            <div className="grid grid-cols-3 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Rating</div>
                <div className="text-slate-800">1. Janbiev Ivan (8.8)</div>
                <div className="text-slate-800">2. Bychkov Sergey (7.8)</div>
                <div className="text-slate-800">3. Mal'kov Evgeniy (5.0)</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Maximum flow</div>
                <div className="text-blue-900 font-bold">41 Passed: 4999</div>
                <div className="text-blue-900 font-bold">32 Passed: 5556</div>
                <div className="text-blue-900 font-bold">20 Passed: 3589</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Minimum flow</div>
                <div className="text-slate-600">20 Passed: 4999</div>
                <div className="text-slate-600">15 Passed: 5556</div>
                <div className="text-slate-600">10 Passed: 3589</div>
              </div>
            </div>
          </div>

          {/* Effectivity Indicators 5 Pill Cards Bar */}
          <div>
            <h3 className="text-xs font-extrabold uppercase text-slate-900 mb-3">Effectivity indicators</h3>
            <div className="grid grid-cols-5 gap-3">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-center">
                <Calculator className="w-5 h-5 text-blue-900 mx-auto mb-1" />
                <div className="text-base font-extrabold text-slate-900">11</div>
                <div className="text-[9px] text-slate-400">in operation</div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-center">
                <FileText className="w-5 h-5 text-red-600 mx-auto mb-1" />
                <div className="text-base font-extrabold text-slate-900">3</div>
                <div className="text-[9px] text-slate-400">at unloading</div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-center">
                <Network className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                <div className="text-base font-extrabold text-slate-900">1</div>
                <div className="text-[9px] text-slate-400">standing</div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-center">
                <Settings className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <div className="text-base font-extrabold text-slate-900">0</div>
                <div className="text-[9px] text-slate-400">on repair</div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-center">
                <Users className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                <div className="text-base font-extrabold text-slate-900">7</div>
                <div className="text-[9px] text-slate-400">on way</div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Right: Accounts Callout Floating Card (Identical to Red Payment Card in Image) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-lg space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-base font-extrabold text-slate-900">Accounts & Règlements</h3>
            <p className="text-xs text-slate-500 font-medium">Synthèse des comptes auxiliaires</p>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-700">99 Accounts</span>
              <span className="font-extrabold text-red-600">9 999 999 XAF</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-700">SALE 88 Accounts</span>
              <span className="font-extrabold text-blue-900">8 888 888 XAF</span>
            </div>
          </div>

          <div className="pt-2">
            <button className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2">
              <span>Payment / Effectuer un règlement</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardModule;
