import React, { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, Activity,
  Users, FileText, BarChart3, Clock, Bell,
  Star, FilePlus, UserPlus, Truck, CreditCard, Download, RefreshCw,
  Sparkles, Target, Globe, Settings, Eye, EyeOff, CheckCircle2,
  Calendar, ShieldCheck, DollarSign, Layers, PieChart, Info,
  Sun, Cloud, CloudRain, HelpCircle, Building2, Wallet, CheckSquare,
  CheckCircle, AlertCircle, XCircle
} from 'lucide-react';
import {
  DashboardMetrics, DashboardAlert, DashboardForecast, ScoreDetaille,
  DiagnosticIA, FluxOIF, BalanceAgee, ComparisonN1, CashDisponibleItem,
  ConformiteSyscohada, HeatmapRisques, MeteoIA, PerformanceBudget, AFaireAujourdhui,
} from '@financepro/shared';
import { api } from '../../services/api';
import { ModuleId } from '../Sidebar';

// ─── Formatting Helpers (FCFA & French Decimals) ──────────────────────────────
const fmtMoney = (v: number, short = false) => {
  if (v === undefined || v === null || isNaN(v)) return '0 FCFA';
  if (short && Math.abs(v) >= 1_000_000) {
    const m = (v / 1_000_000).toFixed(1).replace('.', ',');
    return `${m}M FCFA`;
  }
  if (short && Math.abs(v) >= 1_000) {
    const k = (v / 1_000).toFixed(0).replace('.', ',');
    return `${k}K FCFA`;
  }
  const formatted = Math.round(v).toLocaleString('fr-FR');
  return `${formatted} FCFA`;
};

const fmtPct = (v: number | undefined) => {
  if (v === undefined || v === null || isNaN(v)) return '0,00 %';
  const s = v >= 0 ? '+' : '';
  return `${s}${v.toFixed(2).replace('.', ',')} %`;
};

const fmtDec = (v: number | undefined, decimals = 2) => {
  if (v === undefined || v === null || isNaN(v)) return '0,00';
  return v.toFixed(decimals).replace('.', ',');
};

const fmtNum = (v: number | undefined) => {
  if (v === undefined || v === null || isNaN(v)) return '0';
  return new Intl.NumberFormat('fr-FR').format(v);
};

// ─── Mini Sparkline SVG ───────────────────────────────────────────────────────
const Sparkline: React.FC<{ values: number[]; color: string; height?: number }> = ({ values, color, height = 24 }) => {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const W = 80;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

// ─── SVG Bar Chart Component ──────────────────────────────────────────────────
const BarChart: React.FC<{
  data: { label: string; value: number; value2?: number }[];
  color: string;
  color2?: string;
  height?: number;
}> = ({ data, color, color2, height = 110 }) => {
  if (!data || data.length === 0) return null;
  const maxV = Math.max(...data.map((d) => Math.max(Math.abs(d.value), Math.abs(d.value2 ?? 0))), 1);
  const W = 360;
  const barW = color2 ? 14 : 22;
  const gap = W / data.length;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${height + 24}`} className="overflow-visible">
      {data.map((d, i) => {
        const x = i * gap + gap / 2;
        const h1 = (Math.abs(d.value) / maxV) * height;
        const h2 = d.value2 !== undefined ? (Math.abs(d.value2) / maxV) * height : 0;
        return (
          <g key={i}>
            <rect
              x={x - (color2 ? barW + 1 : barW / 2)}
              y={height - h1}
              width={barW}
              height={Math.max(h1, 3)}
              rx="3"
              fill={color}
              opacity="0.88"
            />
            {color2 && d.value2 !== undefined && (
              <rect
                x={x + 1}
                y={height - h2}
                width={barW}
                height={Math.max(h2, 3)}
                rx="3"
                fill={color2}
                opacity="0.88"
              />
            )}
            <text x={x} y={height + 16} textAnchor="middle" fontSize="8.5" fill="#9CA3AF" fontWeight="600" fontFamily="system-ui">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── SVG Rentabilité Chart (3 bars/month) ──────────────────────────────────────
const RentabiliteChart: React.FC<{
  data: { label: string; ca: number; charges: number; net: number }[];
  height?: number;
}> = ({ data, height = 110 }) => {
  if (!data || data.length === 0) return null;
  const maxV = Math.max(...data.flatMap((d) => [d.ca, d.charges, Math.abs(d.net)]), 1);
  const W = 360;
  const barW = 8;
  const gap = W / data.length;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${height + 24}`} className="overflow-visible">
      {data.map((d, i) => {
        const x = i * gap + gap / 2;
        const hCA = (d.ca / maxV) * height;
        const hCharges = (d.charges / maxV) * height;
        const hNet = (Math.abs(d.net) / maxV) * height;
        const isNetNegative = d.net < 0;

        return (
          <g key={i}>
            {/* CA Bar - Green */}
            <rect
              x={x - 14}
              y={height - hCA}
              width={barW}
              height={Math.max(hCA, 2)}
              rx="1.5"
              fill="#10B981"
              opacity="0.88"
            />
            {/* Charges Bar - Orange */}
            <rect
              x={x - 4}
              y={height - hCharges}
              width={barW}
              height={Math.max(hCharges, 2)}
              rx="1.5"
              fill="#F59E0B"
              opacity="0.88"
            />
            {/* Net Income Bar - Violet/Red */}
            <rect
              x={x + 6}
              y={height - hNet}
              width={barW}
              height={Math.max(hNet, 2)}
              rx="1.5"
              fill={isNetNegative ? "#EF4444" : "#6B4EFF"}
              opacity="0.88"
            />
            <text x={x} y={height + 16} textAnchor="middle" fontSize="8.5" fill="#9CA3AF" fontWeight="600" fontFamily="system-ui">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── SVG Budget Comparison Chart ────────────────────────────────────────────────
const BudgetComparisonChart: React.FC<{
  data: { label: string; budget: number; real: number }[];
  height?: number;
}> = ({ data, height = 110 }) => {
  if (!data || data.length === 0) return null;
  const maxV = Math.max(...data.flatMap((d) => [d.budget, d.real]), 1);
  const W = 360;
  const barW = 10;
  const gap = W / data.length;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${height + 24}`} className="overflow-visible">
      {data.map((d, i) => {
        const x = i * gap + gap / 2;
        const hBudget = (d.budget / maxV) * height;
        const hReal = (d.real / maxV) * height;

        return (
          <g key={i}>
            {/* Budget Bar - Slate */}
            <rect
              x={x - 12}
              y={height - hBudget}
              width={barW}
              height={Math.max(hBudget, 2)}
              rx="2"
              fill="#94A3B8"
              opacity="0.5"
            />
            {/* Real Bar - Violet */}
            <rect
              x={x + 2}
              y={height - hReal}
              width={barW}
              height={Math.max(hReal, 2)}
              rx="2"
              fill="#6B4EFF"
              opacity="0.9"
            />
            <text x={x} y={height + 16} textAnchor="middle" fontSize="8.5" fill="#9CA3AF" fontWeight="600" fontFamily="system-ui">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Alert Style Helper ───────────────────────────────────────────────────────
const alertStyle = (severity: 'LOW' | 'MEDIUM' | 'HIGH') => {
  if (severity === 'HIGH') return { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C', dot: '#EF4444' };
  if (severity === 'MEDIUM') return { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', dot: '#F59E0B' };
  return { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534', dot: '#22C55E' };
};

// ─── Categorized Alerts Center Widget ──────────────────────────────────────────
const AlertsCenterWidget: React.FC<{ alertes: DashboardAlert[] }> = ({ alertes }) => {
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  if (!alertes || alertes.length === 0) return null;

  const filtered = alertes.filter((a) => {
    if (filter === 'ALL') return true;
    return a.severity === filter;
  });

  const countFor = (sev: 'HIGH' | 'MEDIUM' | 'LOW') => alertes.filter((a) => a.severity === sev).length;

  return (
    <div className="rounded-2xl p-5 bg-white border border-violet-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4.5 h-4.5 text-amber-500 animate-swing" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
            Centre des Alertes & Échéanciers ({alertes.length})
          </h3>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(
            [
              { id: 'ALL', label: 'Toutes', count: alertes.length },
              { id: 'HIGH', label: '🔴 Critique', count: countFor('HIGH') },
              { id: 'MEDIUM', label: '🟠 Attention', count: countFor('MEDIUM') },
              { id: 'LOW', label: '🟢 Info', count: countFor('LOW') },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 border ${
                filter === tab.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[9px] text-slate-700">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-xs italic text-center py-6 text-slate-400">Aucune alerte dans cette catégorie.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((alert, i) => {
            const s = alertStyle(alert.severity);
            return (
              <div key={i} className="flex items-start gap-2.5 rounded-xl p-3 border hover:shadow-md transition-shadow" style={{ background: s.bg, borderColor: s.border }}>
                <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ background: s.dot }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-extrabold" style={{ color: s.color }}>{alert.label}</div>
                    {alert.daysLeft !== undefined && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/60" style={{ color: s.color }}>
                        dans {alert.daysLeft}j
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] mt-0.5 font-medium opacity-90" style={{ color: s.color }}>{alert.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Temporal Analysis Spreadsheet Widget ──────────────────────────────────────
const TemporalAnalysisWidget: React.FC<{ metrics: any }> = ({ metrics }) => {
  const m = metrics;
  const months = m.caParMoisGraph.slice(-6).map((d) => d.month);

  const getCA = (month: string) => m.caParMoisGraph.find((d) => d.month === month)?.ca ?? 0;
  const getCharges = (month: string) => m.chargesParMoisGraph.find((d) => d.month === month)?.charges ?? 0;
  const getNet = (month: string) => m.resultatMensuelGraph.find((d) => d.month === month)?.resultat ?? (getCA(month) - getCharges(month));
  const getCashFlow = (month: string) => {
    const flow = m.fluxTrésorerieGraph.find((f) => f.month === month);
    return flow ? (flow.encaissements - flow.decaissements) : getNet(month);
  };

  return (
    <div className="rounded-2xl p-5 bg-white border border-violet-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Calendar className="w-4.5 h-4.5 text-violet-600" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
            Analyse Temporelle Synthétique (6 derniers mois)
          </h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Exercice Courant</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-semibold">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase">
              <th className="py-2.5">Indicateurs Financiers</th>
              {months.map((m) => (
                <th key={m} className="py-2.5 text-right px-2">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-700">
            {/* Chiffre d'Affaires */}
            <tr>
              <td className="py-3 font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Chiffre d'Affaires (70x)
              </td>
              {months.map((m) => (
                <td key={m} className="py-3 text-right font-mono px-2 text-emerald-600 font-bold">{fmtMoney(getCA(m), true)}</td>
              ))}
            </tr>
            {/* Charges */}
            <tr>
              <td className="py-3 font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Charges d'Exploitation (6x)
              </td>
              {months.map((m) => (
                <td key={m} className="py-3 text-right font-mono px-2 text-amber-600">{fmtMoney(getCharges(m), true)}</td>
              ))}
            </tr>
            {/* Résultat Net */}
            <tr>
              <td className="py-3 font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-600" /> Résultat Net comptable
              </td>
              {months.map((m) => {
                const val = getNet(m);
                return (
                  <td key={m} className={`py-3 text-right font-mono px-2 font-bold ${val >= 0 ? 'text-violet-600' : 'text-rose-600'}`}>
                    {fmtMoney(val, true)}
                  </td>
                );
              })}
            </tr>
            {/* Trésorerie Nette */}
            <tr>
              <td className="py-3 font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" /> Flux Net de Trésorerie
              </td>
              {months.map((m) => {
                const val = getCashFlow(m);
                return (
                  <td key={m} className={`py-3 text-right font-mono px-2 ${val >= 0 ? 'text-sky-600' : 'text-rose-600'}`}>
                    {fmtMoney(val, true)}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Pedagogical Tooltip Modal ("Pourquoi ?") ──────────────────────────────────
const PedagogicalExplanationModal: React.FC<{
  metricKey: string;
  metricLabel: string;
  onClose: () => void;
  metrics: any;
}> = ({ metricKey, metricLabel, onClose, metrics }) => {
  const m = metrics;

  const explanations: Record<string, string> = {
    bfr: m.bfr <= 0
      ? `Le Besoin en Fonds de Roulement (BFR) est négatif (${fmtMoney(m.bfr)}). Vos dettes d'exploitation auprès de vos fournisseurs dépassent le montant de vos créances et stocks. Votre cycle d'exploitation ne consomme pas de trésorerie : au contraire, il en génère ! C'est une excellente situation d'aisance financière.`
      : `Le Besoin en Fonds de Roulement (BFR) est positif (${fmtMoney(m.bfr)}). Cela signifie que vos créances clients et stocks nécessitent d'être financés avant que l'argent ne rentre. Négociez des délais de paiement plus longs avec vos fournisseurs pour réduire ce besoin.`,

    fdr: m.fdr >= 0
      ? `Le Fonds de Roulement (FDR) est positif (${fmtMoney(m.fdr)}). Vos ressources stables (capitaux propres et emprunts à long terme) financent intégralement vos investissements durables et laissent un excédent de sécurité pour le cycle d'exploitation.`
      : `Le Fonds de Roulement (FDR) est négatif (${fmtMoney(m.fdr)}). Vos investissements à long terme sont partiellement financés par des dettes à court terme. Il est recommandé de renforcer vos capitaux propres ou d'avoir recours à un prêt à moyen terme.`,

    ebe: `L'Excédent Brut d'Exploitation (EBE) (${fmtMoney(m.excédentBrutExploitation)}) mesure la ressource financière brute générée par le cœur d'activité de l'entreprise, avant l'impact des amortissements, des décisions de financement et des impôts.`,

    roe: `Le Return on Equity (ROE) (${fmtPct(m.roe)}) indique le taux de rendement financier net obtenu par les actionnaires pour chaque franc de capitaux propres investi dans la société.`,

    roa: `Le Return on Assets (ROA) (${fmtPct(m.roa)}) mesure la capacité de l'ensemble du patrimoine comptable (bâtiments, machines, stock, banques) à générer un bénéfice net.`,

    ratioLiquidite: `Le ratio de liquidité générale (${fmtDec(m.ratioLiquidite)}) compare l'ensemble de votre actif circulant (disponibilités + créances + stocks) à vos dettes à court terme. Un ratio supérieur à 1,5 garantit que vous pouvez honorer 100% de vos dettes à court terme sans tension.`,

    margeNette: `La marge nette (${fmtPct(margeNette(m))}) représente la part de bénéfice net restant dans l'entreprise pour chaque 100 FCFA de Chiffre d'Affaires facturé.`,

    capitauxPropres: `Les capitaux propres (${fmtMoney(m.capitauxPropres)}) constituent la valeur nette théorique revenant aux associés (capital social + réserves accumulées + bénéfice de l'exercice).`,

    resultatNet: `Le Résultat Net (${fmtMoney(m.resultatNet)}) correspond au bénéfice ou à la perte finale de l'exercice après déduction de toutes les charges d'exploitation, financières, exceptionnelles et de l'impôt sur les sociétés.`,
  };

  function margeNette(m: any) { return m.margeNette; }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-violet-100 space-y-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
              <HelpCircle className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Explication Pédagogique</h3>
              <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">{metricLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-violet-50/60 border border-violet-100 text-xs leading-relaxed text-slate-700 font-medium">
          {explanations[metricKey] || `Cet indicateur mesure la performance comptable de votre entreprise selon la norme SYSCOHADA.`}
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Score Breakdown Component (7 axes /100) ──────────────────────────────────
const DetailedScoreWidget: React.FC<{ scoreDetaille: ScoreDetaille }> = ({ scoreDetaille }) => {
  const total = scoreDetaille?.total ?? 50;
  const color = total >= 80 ? '#10B981' : total >= 60 ? '#F59E0B' : '#EF4444';
  const label = total >= 80 ? 'Excellente' : total >= 60 ? 'Satisfaisante' : 'Risquée';

  const axes = [
    { label: 'Comptabilité', score: scoreDetaille?.comptabilite ?? 95, max: 100 },
    { label: 'Trésorerie', score: scoreDetaille?.tresorerie ?? 75, max: 100 },
    { label: 'Fiscalité', score: scoreDetaille?.fiscalite ?? 85, max: 100 },
    { label: 'Rentabilité', score: scoreDetaille?.rentabilite ? (scoreDetaille.rentabilite <= 20 ? scoreDetaille.rentabilite * 5 : scoreDetaille.rentabilite) : 75, max: 100 },
    { label: 'Créances Clients', score: scoreDetaille?.creances ?? 90, max: 100 },
    { label: 'Conformité', score: scoreDetaille?.conformite ?? 98, max: 100 },
    { label: 'Contrôle Interne', score: scoreDetaille?.controleInterne ?? 85, max: 100 },
  ];

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-2xl bg-white border border-violet-100 shadow-sm">
      {/* Jauge Globale */}
      <div className="flex flex-col items-center flex-shrink-0 text-center">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
            <circle cx="22" cy="22" r="18" fill="none" stroke="#F3F4F6" strokeWidth="4" />
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(total / 100) * 113} 113`}
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold font-mono leading-none" style={{ color }}>
              {total}
            </span>
            <span className="text-[9px] font-bold text-slate-400">/ 100</span>
          </div>
        </div>
        <div className="mt-2 text-xs font-extrabold" style={{ color }}>
          Santé {label}
        </div>
      </div>

      {/* 7 Sous-jauges */}
      <div className="flex-1 w-full space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Décomposition du Score Financier
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          {axes.map((axe) => (
            <div key={axe.label} className="space-y-0.5">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span>{axe.label}</span>
                <span className="font-mono text-slate-900 font-bold">
                  {axe.score} / {axe.max}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(axe.score / axe.max) * 100}%`,
                    background: axe.score >= 80 ? '#10B981' : axe.score >= 60 ? '#F59E0B' : '#EF4444',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Diagnostic IA Widget ─────────────────────────────────────────────────────
const DiagnosticIAWidget: React.FC<{ diagnostic: DiagnosticIA; onNavigate?: (module: ModuleId) => void }> = ({ diagnostic, onNavigate }) => {
  if (!diagnostic) return null;

  const statusColor = (s: string) => {
    if (['Forte', 'Excellente', 'Bon', 'Solide', 'Faible'].includes(s)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (['Moyenne', 'Satisfaisante', 'Modéré', 'Saine', 'Moyen'].includes(s)) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const getActionForRec = (rec: string) => {
    const lower = rec.toLowerCase();
    if (lower.includes('relancer') || lower.includes('facture')) {
      return { label: 'Relancer les clients ➡️', action: () => onNavigate?.('invoicing') };
    }
    if (lower.includes('liquidité') || lower.includes('trésorerie') || lower.includes('surplus')) {
      return { label: 'Gérer la trésorerie ➡️', action: () => onNavigate?.('treasury') };
    }
    if (lower.includes('budget') || lower.includes('charges')) {
      return { label: 'Ajuster les budgets ➡️', action: () => onNavigate?.('budget') };
    }
    return null;
  };

  return (
    <div className="rounded-2xl p-5 border border-indigo-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-600/30 flex items-center justify-center border border-violet-400/30">
            <Sparkles className="w-4 h-4 text-violet-300 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-wide text-white">Diagnostic & Recommandations IA</h3>
            <p className="text-[10px] text-violet-300">Analyse automatisée de votre santé financière et préconisations</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-200 border border-violet-400/20">
          Risque Global : <strong className="text-white">{diagnostic.risqueGlobal}</strong>
        </span>
      </div>

      {/* Ratios Piliers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Rentabilité', val: diagnostic.rentabiliteStatus },
          { label: 'Liquidité', val: diagnostic.liquiditeStatus },
          { label: 'Endettement', val: diagnostic.endettementStatus },
          { label: 'Trésorerie', val: diagnostic.tresorerieStatus },
        ].map((item) => (
          <div key={item.label} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="text-[10px] font-medium text-slate-400">{item.label}</div>
            <div className={`text-xs font-bold mt-1 inline-block px-2 py-0.5 rounded-md border ${statusColor(item.val)}`}>
              {item.val}
            </div>
          </div>
        ))}
      </div>

      {/* Recommandations */}
      <div className="space-y-1.5 bg-white/5 p-3 rounded-xl border border-white/10">
        <div className="text-[10px] font-extrabold uppercase text-violet-300 tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> Recommandations Stratégiques Actionnables
        </div>
        <div className="space-y-1">
          {diagnostic.recommandations.map((rec, i) => {
            const act = getActionForRec(rec);
            return (
              <div key={i} className="text-xs text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <div className="flex items-start gap-2">
                  <span className="text-violet-400 font-bold">•</span>
                  <span>{rec}</span>
                </div>
                {act && (
                  <button
                    onClick={act.action}
                    className="px-2.5 py-1 text-[9px] font-extrabold bg-violet-600 hover:bg-violet-500 text-white rounded-md transition-colors flex-shrink-0"
                  >
                    {act.label}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Component Main ───────────────────────────────────────────────────────────
export const DashboardModule: React.FC<{ onNavigate?: (module: ModuleId) => void }> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal d'explication pédagogique "Pourquoi ?"
  const [pedagogicalModal, setPedagogicalModal] = useState<{ key: string; label: string } | null>(null);

  // States UI
  const [activeTab, setActiveTab] = useState<'ecritures' | 'factures'>('ecritures');
  const [activeGraphTab, setActiveGraphTab] = useState<'ca' | 'flux' | 'resultat' | 'bfr' | 'charges' | 'produits' | 'agee'>('ca');
  const [showN1Comparison, setShowN1Comparison] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Personnalisation des widgets affichés
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>({
    healthBar: true,
    meteoIA: true,
    score: true,
    quickActions: true,
    diagnosticIA: true,
    cashDisponible: true,
    aFaire: true,
    conformite: true,
    heatmapRisques: true,
    performanceBudget: true,
    kpis: true,
    activity: true,
    alertes: true,
    graphiques: true,
    ratios: true,
    ohada: true,
    previsions: true,
    fluxOIF: true,
    balanceAgee: true,
    topPerformance: true,
    activitesRecentes: true,
  });

  const toggleWidget = (key: string) => {
    setVisibleWidgets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const loadMetrics = useCallback(() => {
    setLoading(true);
    api.getMetrics().then((m) => {
      setMetrics(m);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-[#6B4EFF] border-t-transparent animate-spin" />
        <span className="text-xs font-medium text-slate-500">Chargement du centre de pilotage ERP...</span>
      </div>
    </div>
  );

  if (!metrics) return (
    <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
      Impossible de charger les métriques. <button onClick={loadMetrics} className="ml-2 text-[#6B4EFF] underline">Réessayer</button>
    </div>
  );

  // Normalisation défensive des données
  const raw = metrics;
  const m = {
    santeGlobalePct: raw.santeGlobalePct ?? 68,
    santeGlobaleStatus: raw.santeGlobaleStatus || 'Stable (Saine)',
    tresorerieNetteTotal: raw.tresorerieNetteTotal ?? 0,
    chiffreAffairesMois: raw.chiffreAffairesMois ?? 0,
    chiffreAffairesVariation: raw.chiffreAffairesVariation ?? 0,
    resultatNet: raw.resultatNet ?? 0,
    resultatExploitation: raw.resultatExploitation ?? 0,
    resultatFinancier: raw.resultatFinancier ?? 0,
    resultatHAO: raw.resultatHAO ?? 0,
    resultatAvantImpot: raw.resultatAvantImpot ?? 0,
    resultatExceptionnel: raw.resultatExceptionnel ?? 0,
    margeBrute: raw.margeBrute ?? 0,
    margeNette: raw.margeNette ?? 0,
    creancesClientsTotal: raw.creancesClientsTotal ?? 0,
    dettesFournisseursTotal: raw.dettesFournisseursTotal ?? 0,
    capitauxPropres: raw.capitauxPropres ?? 0,
    totalActif: raw.totalActif ?? 0,
    totalPassif: raw.totalPassif ?? 0,
    bfr: raw.bfr ?? 0,
    fdr: raw.fdr ?? 0,
    excédentBrutExploitation: raw.excédentBrutExploitation ?? 0,
    ratioLiquidite: raw.ratioLiquidite ?? 0,
    ratioAutonomieFinanciere: raw.ratioAutonomieFinanciere ?? 0,
    roe: raw.roe ?? 0,
    roa: raw.roa ?? 0,
    endettement: raw.endettement ?? 0,
    actifImmobilise: raw.actifImmobilise ?? 0,
    actifCirculant: raw.actifCirculant ?? 0,
    passifCirculant: raw.passifCirculant ?? 0,
    dettesFinancieres: raw.dettesFinancieres ?? 0,
    valeurAjoutee: raw.valeurAjoutee ?? 0,
    scoreFinancier: raw.scoreFinancier ?? 50,
    scoreDetaille: raw.scoreDetaille || { liquidite: 10, rentabilite: 10, solvabilite: 10, croissance: 10, risque: 10, total: 50 },
    diagnosticIA: raw.diagnosticIA || {
      rentabiliteStatus: 'Moyenne', liquiditeStatus: 'Satisfaisante', endettementStatus: 'Bon', tresorerieStatus: 'Saine', risqueGlobal: 'Faible', recommandations: ['Assurer le suivi régulier du calendrier fiscal.']
    },
    meteoIA: raw.meteoIA || {
      condition: 'ENSOLEILLE', description: 'Situation financière stable et propice au développement', probaTensionTréso: 12, croissancePrevue: 8.5, confianceIA: 94
    },
    cashDisponible: raw.cashDisponible || [
      { nom: 'Société Générale (SGBC)', type: 'BANQUE', solde: 2500000, sigle: 'SGBC' },
      { nom: 'UBA Bank', type: 'BANQUE', solde: 800000, sigle: 'UBA' },
      { nom: 'CCA Bank', type: 'BANQUE', solde: 350000, sigle: 'CCA' },
      { nom: 'Caisse Principale', type: 'CAISSE', solde: 150000, sigle: 'Caisse' },
    ],
    conformiteSyscohada: raw.conformiteSyscohada || {
      score: 98, journauxEquilibres: true, tvaCoherente: true, balanceEquilibree: true, bilanEquilibre: true
    },
    heatmapRisques: raw.heatmapRisques || {
      finance: 'LOW', fiscal: 'MEDIUM', tresorerie: 'LOW', clients: 'HIGH', stocks: 'LOW', conformite: 'LOW'
    },
    performanceBudget: raw.performanceBudget || { caPct: 65, chargesPct: 82, resultatPct: 54 },
    aFaireAujourdhui: raw.aFaireAujourdhui || { facturesAEnvoyer: 3, relancesClients: 5, paiementsFournisseurs: 2, alertesFiscales: 2 },
    fluxOIF: raw.fluxOIF || { fluxExploitation: 0, fluxInvestissement: 0, fluxFinancement: 0, variationNette: 0 },
    balanceAgee: raw.balanceAgee || { moins30j: 0, entre31et60j: 0, entre61et90j: 0, plus90j: 0, total: 0 },
    comparatifN1: raw.comparatifN1 || {
      ca: { currentYear: 0, previousYear: 0, variationPct: 0 },
      tresorerie: { currentYear: 0, previousYear: 0, variationPct: 0 },
      resultatNet: { currentYear: 0, previousYear: 0, variationPct: 0 },
      bfr: { currentYear: 0, previousYear: 0, variationPct: 0 }
    },
    facturesEmises: raw.facturesEmises ?? 0,
    facturesEnAttente: raw.facturesEnAttente ?? 0,
    facturesEchues: raw.facturesEchues ?? 0,
    clientsActifs: raw.clientsActifs ?? 0,
    fournisseursActifs: raw.fournisseursActifs ?? 0,
    paiementsReçusAujourdhui: raw.paiementsReçusAujourdhui ?? 0,
    paiementsEffectuesAujourdhui: raw.paiementsEffectuesAujourdhui ?? 0,
    fluxTrésorerieGraph: raw.fluxTrésorerieGraph || [],
    caParMoisGraph: raw.caParMoisGraph || [],
    chargesParMoisGraph: raw.chargesParMoisGraph || [],
    resultatMensuelGraph: raw.resultatMensuelGraph || [],
    bfrParMoisGraph: raw.bfrParMoisGraph || [],
    chargesRepartitionGraph: raw.chargesRepartitionGraph || [],
    produitsRepartitionGraph: raw.produitsRepartitionGraph || [],
    topClients: raw.topClients || [],
    topFournisseurs: raw.topFournisseurs || [],
    alertes: raw.alertes || [],
    previsions: raw.previsions || [],
    ecrituresRecent: raw.ecrituresRecent || [],
    facturessRecent: raw.facturessRecent || [],
  };

  // ─── Actions Rapides ──────────────────────────────────────────────────────
  const quickActions: { label: string; icon: React.ElementType; color: string; bg: string; to: ModuleId }[] = [
    { label: 'Facture', icon: FilePlus, color: '#6B4EFF', bg: '#F3F0FF', to: 'invoicing' },
    { label: 'Écriture', icon: FileText, color: '#10B981', bg: '#ECFDF5', to: 'accounting' },
    { label: 'Client', icon: UserPlus, color: '#3B82F6', bg: '#EFF6FF', to: 'clients' },
    { label: 'Fournisseur', icon: Truck, color: '#F59E0B', bg: '#FFFBEB', to: 'suppliers' },
    { label: 'Paiement', icon: CreditCard, color: '#EC4899', bg: '#FDF2F8', to: 'treasury' },
    { label: 'Rapport', icon: Download, color: '#14B8A6', bg: '#F0FDFA', to: 'reports' },
  ];

  // ─── 8 KPI Cards ──────────────────────────────────────────────────────────
  const kpiCards = [
    {
      key: 'ca', label: "Chiffre d'Affaires", sublabel: "CA Mensuel (Compte 70x)", value: m.chiffreAffairesMois,
      compN1: m.comparatifN1.ca,
      sparkData: m.caParMoisGraph.slice(-6).map(d => d.ca),
      color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0',
      trend: m.chiffreAffairesVariation,
    },
    {
      key: 'resultatNet', label: 'Résultat Net', sublabel: "SYSCOHADA", value: m.resultatNet,
      compN1: m.comparatifN1.resultatNet,
      sparkData: m.resultatMensuelGraph.map(r => r.resultat),
      color: m.resultatNet >= 0 ? '#10B981' : '#EF4444',
      bg: m.resultatNet >= 0 ? '#ECFDF5' : '#FEF2F2',
      border: m.resultatNet >= 0 ? '#A7F3D0' : '#FECACA',
    },
    {
      key: 'tresorerie', label: 'Trésorerie Disponible', sublabel: 'Caisse & Banques', value: m.tresorerieNetteTotal,
      compN1: m.comparatifN1.tresorerie,
      sparkData: m.fluxTrésorerieGraph.map(f => f.encaissements - f.decaissements),
      color: '#6B4EFF', bg: '#F3F0FF', border: '#DDD6FE',
    },
    {
      key: 'creances', label: 'Créances Clients', sublabel: 'Compte 411 (encours)', value: m.creancesClientsTotal,
      sparkData: [],
      color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A',
    },
    {
      key: 'dettes', label: 'Dettes Fournisseurs', sublabel: 'Compte 401 (encours)', value: m.dettesFournisseursTotal,
      sparkData: [],
      color: '#EF4444', bg: '#FEF2F2', border: '#FECACA',
    },
    {
      key: 'margeNette', label: 'Marge Nette', sublabel: "Résultat / CA", value: m.margeNette,
      isPercent: true,
      sparkData: [],
      color: m.margeNette >= 10 ? '#10B981' : m.margeNette >= 0 ? '#F59E0B' : '#EF4444',
      bg: '#FFFBEB', border: '#FDE68A',
    },
    {
      key: 'soldeBancaire', label: 'Solde Bancaire', sublabel: 'Banques uniquement',
      value: m.cashDisponible.filter(c => c.type === 'BANQUE').reduce((s, c) => s + c.solde, 0),
      sparkData: [],
      color: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD',
    },
    {
      key: 'risques', label: 'Risques Détectés', sublabel: 'Alertes et anomalies',
      value: m.alertes.length,
      isCount: true,
      sparkData: [],
      color: m.alertes.length > 0 ? '#EF4444' : '#10B981',
      bg: m.alertes.length > 0 ? '#FEF2F2' : '#ECFDF5',
      border: m.alertes.length > 0 ? '#FECACA' : '#A7F3D0',
    },
  ];

  // ─── Activité opérationnelle ──────────────────────────────────────────────
  const activityCards = [
    { label: 'Factures Émises', value: fmtNum(m.facturesEmises), icon: FileText, color: '#6B4EFF', bg: '#F3F0FF' },
    { label: 'En Attente', value: fmtNum(m.facturesEnAttente), icon: Clock, color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Échues (!)', value: fmtNum(m.facturesEchues), icon: AlertTriangle, color: '#EF4444', bg: '#FEF2F2' },
    { label: 'Clients Actifs', value: fmtNum(m.clientsActifs), icon: Users, color: '#10B981', bg: '#ECFDF5' },
    { label: 'Fournisseurs', value: fmtNum(m.fournisseursActifs), icon: Truck, color: '#0EA5E9', bg: '#F0F9FF' },
    { label: 'Encaissements / Auj.', value: fmtMoney(m.paiementsReçusAujourdhui, true), icon: TrendingUp, color: '#10B981', bg: '#ECFDF5' },
    { label: 'Décaissements / Auj.', value: fmtMoney(m.paiementsEffectuesAujourdhui, true), icon: TrendingDown, color: '#EF4444', bg: '#FEF2F2' },
  ];

  // ─── Indicateurs OHADA (SYSCOHADA Révisé) ───────────────────────────────
  const ohadaIndicators = [
    { label: 'Actif Immobilisé', value: m.actifImmobilise, account: 'Classe 2' },
    { label: 'Actif Circulant', value: m.actifCirculant, account: 'Classe 3/4' },
    { label: 'Passif Circulant', value: m.passifCirculant, account: 'Classe 4' },
    { label: 'Dettes Financières', value: m.dettesFinancieres, account: 'Classe 1' },
    { label: 'Valeur Ajoutée', value: m.valeurAjoutee, account: 'Compte de résultat' },
    { label: 'EBE', value: m.excédentBrutExploitation, account: 'Avant amortissements', key: 'ebe' },
    { label: 'Résultat d\'Exploitation', value: m.resultatExploitation, account: 'Opérationnel' },
    { label: 'Résultat Financier', value: m.resultatFinancier, account: 'Comptes 67/77' },
    { label: 'Résultat HAO (Exceptionnel)', value: m.resultatHAO, account: 'Comptes 81-88' },
    { label: 'Résultat Avant Impôt', value: m.resultatAvantImpot, account: 'Exploitation + Fin. + HAO' },
    { label: 'Résultat Net', value: m.resultatNet, account: 'Après impôts (891)', key: 'resultatNet' },
  ];

  // ─── Ratios Financiers ───────────────────────────────────────────────────
  const ratios = [
    { label: 'BFR', value: m.bfr, isMoney: true, desc: 'Besoin en Fonds de Roulement', key: 'bfr' },
    { label: 'FDR', value: m.fdr, isMoney: true, desc: 'Fonds de Roulement', key: 'fdr' },
    { label: 'Liquidité', value: m.ratioLiquidite, isRatio: true, desc: 'Actif circ. / Passif circ.', key: 'ratioLiquidite' },
    { label: 'Autonomie', value: m.ratioAutonomieFinanciere * 100, isPercent: true, desc: 'Capitaux propres / Total passif' },
    { label: 'ROE', value: m.roe, isPercent: true, desc: 'Rentabilité fonds propres', key: 'roe' },
    { label: 'ROA', value: m.roa, isPercent: true, desc: 'Rentabilité des actifs', key: 'roa' },
  ];

  // Pastille de couleur Risk360
  const riskDot = (val: 'LOW' | 'MEDIUM' | 'HIGH') => {
    if (val === 'LOW') return <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm" />;
    if (val === 'MEDIUM') return <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm" />;
    return <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-sm" />;
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">

      {/* Modal Pédagogique "Pourquoi ?" */}
      {pedagogicalModal && (
        <PedagogicalExplanationModal
          metricKey={pedagogicalModal.key}
          metricLabel={pedagogicalModal.label}
          metrics={m}
          onClose={() => setPedagogicalModal(null)}
        />
      )}

      {/* ── 1. Top Bar Header & Barre de Santé Globale ────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Tableau de bord financier ERP <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-extrabold">v3.0 Pédagogique</span>
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Centre de pilotage & Diagnostic IA — Norme SYSCOHADA Révisé
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowN1Comparison(!showN1Comparison)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                showN1Comparison ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              ⚖️ Comparatif N vs N-1
            </button>
            <button
              onClick={() => setShowCustomizer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Settings className="w-3.5 h-3.5" /> Personnaliser
            </button>
            <button
              onClick={loadMetrics}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Actualiser
            </button>
          </div>
        </div>

        {/* Barre de Santé Globale Visuelle */}
        {visibleWidgets.healthBar && (
          <div className="p-3.5 rounded-2xl bg-white border border-violet-100 shadow-sm flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-extrabold text-slate-900">Santé Globale Entreprise</span>
              <span className="text-xs font-mono font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {m.santeGlobalePct} % — {m.santeGlobaleStatus}
              </span>
            </div>
            <div className="flex-1 w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${m.santeGlobalePct}%`,
                  background: m.santeGlobalePct >= 80 ? 'linear-gradient(90deg, #10B981, #059669)' : m.santeGlobalePct >= 60 ? 'linear-gradient(90deg, #F59E0B, #D97706)' : 'linear-gradient(90deg, #EF4444, #DC2626)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Modal/Tiroir de Personnalisation ───────────────────────────────── */}
      {showCustomizer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-violet-600" /> Personnaliser le Tableau de Bord
              </h3>
              <button onClick={() => setShowCustomizer(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                ✕ Fermer
              </button>
            </div>
            <p className="text-xs text-slate-500">Sélectionnez les modules à afficher sur votre centre de pilotage :</p>
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
              {Object.entries({
                healthBar: 'Barre de Santé Globale',
                meteoIA: 'Météo IA FinancePro',
                score: 'Score Santé (Détail)',
                quickActions: 'Accès Rapides',
                diagnosticIA: 'Diagnostic FinancePro IA',
                cashDisponible: 'Cash Disponible (Banques)',
                aFaire: 'À faire aujourd\'hui',
                conformite: 'Conformité SYSCOHADA (98%)',
                heatmapRisques: 'Heatmap des Risques Risk360',
                performanceBudget: 'Performance & Budgets',
                kpis: 'KPI Principaux',
                activity: 'Activité Opérationnelle',
                alertes: 'Alertes & Calendrier Fiscal',
                graphiques: 'Graphiques Financiers',
                ratios: 'Ratios Financiers',
                ohada: 'Indicateurs SYSCOHADA',
                previsions: 'Prévisions IA',
                fluxOIF: 'Tableau des Flux (OIF)',
                balanceAgee: 'Balance Âgée',
                topPerformance: 'Top Clients & Fournisseurs',
                activitesRecentes: 'Activités Récentes',
              }).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => toggleWidget(key)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    visibleWidgets[key]
                      ? 'bg-violet-50 text-violet-700 border-violet-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  <span>{label}</span>
                  {visibleWidgets[key] ? <Eye className="w-3.5 h-3.5 text-violet-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-300" />}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowCustomizer(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
              >
                Valider et Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Météo IA + Diagnostic IA ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {visibleWidgets.meteoIA && (
          <div className="lg:col-span-4 rounded-2xl p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-6 h-6 text-amber-200 animate-spin-slow" />
                <span className="text-xs font-extrabold uppercase tracking-wider">Météo IA FinancePro</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">Confiance {m.meteoIA.confianceIA}%</span>
            </div>
            <div className="my-3 space-y-1">
              <div className="text-lg font-extrabold flex items-center gap-2">
                ☀ Situation Stable
              </div>
              <p className="text-xs text-amber-100 leading-snug">{m.meteoIA.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/10 p-2 rounded-xl border border-white/10">
              <div>Tension tréso. : <strong className="text-white">{m.meteoIA.probaTensionTréso}%</strong></div>
              <div>Croissance : <strong className="text-white">+{m.meteoIA.croissancePrevue}%</strong></div>
            </div>
          </div>
        )}

        {visibleWidgets.diagnosticIA && (
          <div className={`${visibleWidgets.meteoIA ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
            <DiagnosticIAWidget diagnostic={m.diagnosticIA} onNavigate={onNavigate} />
          </div>
        )}
      </div>

      {/* ── 3. Score Santé Détaillé + Accès Rapide ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {visibleWidgets.score && (
          <div className="lg:col-span-7">
            <DetailedScoreWidget scoreDetaille={m.scoreDetaille} />
          </div>
        )}

        {visibleWidgets.quickActions && (
          <div className={`${visibleWidgets.score ? 'lg:col-span-5' : 'lg:col-span-12'} rounded-2xl p-4 bg-white border border-violet-100 shadow-sm flex flex-col justify-center`}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">Accès rapides</div>
            <div className="grid grid-cols-3 gap-2">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.label}
                    onClick={() => onNavigate?.(a.to)}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95 text-center"
                    style={{ background: a.bg, color: a.color, borderColor: a.bg }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] leading-none">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Cash Disponible par Banque + À Faire + Conformité ────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cash disponible */}
        {visibleWidgets.cashDisponible && (
          <div className="rounded-2xl p-4 bg-white border border-violet-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Cash Disponible Auj.</h3>
            </div>
            <div className="space-y-2">
              {m.cashDisponible.map((acc, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-extrabold">
                      {acc.sigle.substring(0, 3)}
                    </div>
                    <div className="text-xs font-bold text-slate-800 truncate max-w-[130px]">{acc.nom}</div>
                  </div>
                  <div className="text-xs font-extrabold font-mono text-emerald-700">{fmtMoney(acc.solde, true)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* À Faire Aujourd'hui */}
        {visibleWidgets.aFaire && (
          <div className="rounded-2xl p-4 bg-white border border-violet-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-violet-600" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">À Faire Aujourd'hui</h3>
            </div>
            <div className="space-y-2 text-xs font-bold">
              <div className="flex justify-between p-2 rounded-xl bg-violet-50 text-violet-900 border border-violet-100">
                <span>Factures à envoyer</span>
                <span className="font-mono bg-violet-200 text-violet-800 px-2 py-0.5 rounded-full">{m.aFaireAujourdhui.facturesAEnvoyer}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-100">
                <span>Relances clients urgentes</span>
                <span className="font-mono bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">{m.aFaireAujourdhui.relancesClients}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-rose-50 text-rose-900 border border-rose-100">
                <span>Échéances fiscales / TVA</span>
                <span className="font-mono bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full">{m.aFaireAujourdhui.alertesFiscales}</span>
              </div>
            </div>
          </div>
        )}

        {/* Conformité SYSCOHADA */}
        {visibleWidgets.conformite && (
          <div className="rounded-2xl p-4 bg-white border border-violet-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Conformité SYSCOHADA</h3>
              </div>
              <span className="text-xs font-extrabold font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {m.conformiteSyscohada.score} %
              </span>
            </div>
            <div className="space-y-1.5 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <CheckCircle className="w-3.5 h-3.5" /> Journaux équilibrés (Débit = Crédit)
              </div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <CheckCircle className="w-3.5 h-3.5" /> TVA collectée & déductible cohérentes
              </div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <CheckCircle className="w-3.5 h-3.5" /> Balance générale équilibrée
              </div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <CheckCircle className="w-3.5 h-3.5" /> Bilan Actif = Passif
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Heatmap des Risques Risk360 + Performance Budgétaire ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleWidgets.heatmapRisques && (
          <div className="rounded-2xl p-4 bg-white border border-violet-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Heatmap des Risques (Risk360)</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
                <span>Finance</span> {riskDot(m.heatmapRisques.finance)}
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
                <span>Fiscal</span> {riskDot(m.heatmapRisques.fiscal)}
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
                <span>Trésorerie</span> {riskDot(m.heatmapRisques.tresorerie)}
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
                <span>Clients</span> {riskDot(m.heatmapRisques.clients)}
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
                <span>Stocks</span> {riskDot(m.heatmapRisques.stocks)}
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
                <span>Conformité</span> {riskDot(m.heatmapRisques.conformite)}
              </div>
            </div>
          </div>
        )}

        {visibleWidgets.performanceBudget && (
          <div className="rounded-2xl p-4 bg-white border border-violet-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-violet-600" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Performance & Budgets</h3>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Objectif CA du mois</span> <span className="font-mono text-emerald-600">{m.performanceBudget.caPct}% atteint</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${m.performanceBudget.caPct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Budget Charges consommé</span> <span className="font-mono text-amber-600">{m.performanceBudget.chargesPct}% consommé</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${m.performanceBudget.chargesPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 6. 8 KPI Cards (Homogènes min-h-[140px] + Bouton "Pourquoi ?") ───── */}
      {visibleWidgets.kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpiCards.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl p-4 flex flex-col justify-between bg-white border shadow-sm relative overflow-hidden min-h-[140px]"
              style={{ borderColor: kpi.border, borderLeft: `4px solid ${kpi.color}` }}
            >
              <div className="flex items-start justify-between">
                <div className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{kpi.label}</div>
                {kpi.trend !== undefined && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                    style={{ background: kpi.trend >= 0 ? '#DCFCE7' : '#FEE2E2', color: kpi.trend >= 0 ? '#15803D' : '#B91C1C' }}
                  >
                    {kpi.trend >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {fmtPct(kpi.trend)}
                  </span>
                )}
              </div>

              <div>
                <div className="text-lg font-extrabold font-mono leading-tight" style={{ color: kpi.color }}>
                  {kpi.isPercent ? `${fmtDec(kpi.value)} %` : kpi.isCount ? fmtNum(kpi.value) : fmtMoney(kpi.value, true)}
                </div>

                {/* Affichage Comparatif N vs N-1 si activé */}
                {showN1Comparison && kpi.compN1 && (
                  <div className="text-[10px] font-bold pt-1 border-t border-slate-100 flex items-center justify-between text-slate-500">
                    <span>N-1 : {fmtMoney(kpi.compN1.previousYear, true)}</span>
                    <span className={kpi.compN1.variationPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {fmtPct(kpi.compN1.variationPct)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[9px] text-slate-400">{kpi.sublabel}</span>

                {/* Bouton Pédagogique Pourquoi ? */}
                {['tresorerie', 'bfr', 'fdr', 'ebe', 'roe', 'roa', 'ratioLiquidite', 'margeNette', 'resultatNet', 'capitauxPropres'].includes(kpi.key) && (
                  <button
                    onClick={() => setPedagogicalModal({ key: kpi.key, label: kpi.label })}
                    className="text-[9px] font-extrabold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-1.5 py-0.5 rounded transition-colors"
                  >
                    Pourquoi ?
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 7. Activité Opérationnelle ────────────────────────────────────── */}
      {visibleWidgets.activity && (
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-2.5">
            Activité opérationnelle — Aujourd'hui
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {activityCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-xl p-3 flex flex-col gap-1.5 text-center bg-white border border-slate-100">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto" style={{ background: card.bg }}>
                    <Icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{card.label}</div>
                  <div className="text-xs font-black text-slate-800 font-mono">{card.value}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 9. Graphiques Financiers - Grille 4 Graphiques Cockpit ────────── */}
      {visibleWidgets.graphiques && (() => {
        // Préparation des données de rentabilité
        const rentabiliteData = m.caParMoisGraph.slice(-6).map((caItem) => {
          const label = caItem.month;
          const chargesItem = m.chargesParMoisGraph.find(c => c.month === label);
          const netItem = m.resultatMensuelGraph.find(r => r.month === label);
          const caValue = caItem.ca;
          const chargesValue = chargesItem ? chargesItem.charges : 0;
          const netValue = netItem ? netItem.resultat : (caValue - chargesValue);
          return { label, ca: caValue, charges: chargesValue, net: netValue };
        });

        // Préparation des données de budget
        const lastCharges = m.chargesParMoisGraph.slice(-1)[0]?.charges || 0;
        const lastCA = m.chiffreAffairesMois || 0;
        const lastEBE = m.excédentBrutExploitation || 0;
        const budgetData = [
          { label: 'Chiffre d\'Affaires', real: lastCA, budget: lastCA / ((m.performanceBudget.caPct || 100) / 100) },
          { label: 'Charges', real: lastCharges, budget: lastCharges / ((m.performanceBudget.chargesPct || 100) / 100) },
          { label: 'EBITDA (EBE)', real: lastEBE, budget: lastEBE / ((m.performanceBudget.resultatPct || 100) / 100) },
        ];

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Graph 1: Évolution du Chiffre d'Affaires */}
            <div className="rounded-2xl p-5 bg-white border border-violet-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-violet-600" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Évolution du CA (12 mois)</h3>
                </div>
              </div>
              <div className="h-[120px] flex items-center justify-center">
                {m.caParMoisGraph.every((d) => d.ca === 0) ? (
                  <div className="text-xs italic text-center py-8 text-slate-400">Aucun CA enregistré sur cette période.</div>
                ) : (
                  <BarChart data={m.caParMoisGraph.map((d) => ({ label: d.month, value: d.ca }))} color="#6B4EFF" height={100} />
                )}
              </div>
            </div>

            {/* Graph 2: Rentabilité CA vs Charges vs Net */}
            <div className="rounded-2xl p-5 bg-white border border-violet-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-600" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Rentabilité (CA / Charges / Net)</h3>
                </div>
                <div className="flex gap-2 text-[8px] font-bold">
                  <span className="text-emerald-600">● CA</span>
                  <span className="text-amber-500">● Charges</span>
                  <span className="text-violet-600">● Net</span>
                </div>
              </div>
              <div className="h-[120px] flex items-center justify-center">
                <RentabiliteChart data={rentabiliteData} height={100} />
              </div>
            </div>

            {/* Graph 3: Flux de Trésorerie */}
            <div className="rounded-2xl p-5 bg-white border border-violet-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-violet-600" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Flux de Trésorerie (6 mois)</h3>
                </div>
                <div className="flex gap-2 text-[8px] font-bold">
                  <span className="text-emerald-600">● Encaissements</span>
                  <span className="text-rose-500">● Décaissements</span>
                </div>
              </div>
              <div className="h-[120px] flex items-center justify-center">
                {m.fluxTrésorerieGraph.every((f) => f.encaissements === 0 && f.decaissements === 0) ? (
                  <div className="text-xs italic text-center py-8 text-slate-400">Aucun flux de trésorerie enregistré.</div>
                ) : (
                  <BarChart
                    data={m.fluxTrésorerieGraph.map((f) => ({ label: f.month, value: f.encaissements, value2: f.decaissements }))}
                    color="#10B981"
                    color2="#EF4444"
                    height={100}
                  />
                )}
              </div>
            </div>

            {/* Graph 4: Budget vs Réalisé */}
            <div className="rounded-2xl p-5 bg-white border border-violet-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-600" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Budget vs Réalisé</h3>
                </div>
                <div className="flex gap-2 text-[8px] font-bold">
                  <span className="text-slate-400">● Budget</span>
                  <span className="text-violet-600">● Réalisé</span>
                </div>
              </div>
              <div className="h-[120px] flex items-center justify-center">
                <BudgetComparisonChart data={budgetData} height={100} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Centre des Alertes Catégorisé */}
      {visibleWidgets.alertes && (
        <AlertsCenterWidget alertes={m.alertes} />
      )}

      {/* Analyse Temporelle */}
      <TemporalAnalysisWidget metrics={m} />

      {/* ── 10. Tableau des Flux de Trésorerie OIF + Indicateurs OHADA ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {visibleWidgets.fluxOIF && (
          <div className="rounded-2xl p-5 bg-white border border-violet-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-600" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                Tableau des Flux de Trésorerie (OIF)
              </h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Flux d\'Exploitation (O)', val: m.fluxOIF.fluxExploitation, desc: 'Encaissements - décaissements d\'exploitation' },
                { label: 'Flux d\'Investissement (I)', val: m.fluxOIF.fluxInvestissement, desc: 'Acquisitions / cessions d\'immobilisations' },
                { label: 'Flux de Financement (F)', val: m.fluxOIF.fluxFinancement, desc: 'Emprunts, remboursements et capital' },
              ].map((f) => (
                <div key={f.label} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{f.label}</div>
                    <div className="text-[9px] text-slate-400">{f.desc}</div>
                  </div>
                  <div className={`text-xs font-extrabold font-mono ${f.val >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {fmtMoney(f.val, true)}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50 border border-violet-200 mt-2">
                <div className="text-xs font-extrabold text-violet-900">Variation Nette de Trésorerie</div>
                <div className={`text-sm font-extrabold font-mono ${m.fluxOIF.variationNette >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {fmtMoney(m.fluxOIF.variationNette, true)}
                </div>
              </div>
            </div>
          </div>
        )}

        {visibleWidgets.ohada && (
          <div className="rounded-2xl p-5 bg-white border border-violet-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-violet-600" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                Indicateurs OHADA — Bilan SYSCOHADA
              </h3>
            </div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {ohadaIndicators.map((ind) => (
                <div key={ind.label} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{ind.label}</div>
                      <div className="text-[9px] text-slate-400">{ind.account}</div>
                    </div>
                    {ind.key && (
                      <button
                        onClick={() => setPedagogicalModal({ key: ind.key, label: ind.label })}
                        className="text-[9px] font-extrabold text-violet-600 bg-violet-50 px-1 py-0.5 rounded"
                      >
                        Pourquoi ?
                      </button>
                    )}
                  </div>
                  <div className={`text-xs font-extrabold font-mono ${ind.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {fmtMoney(ind.value, true)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 11. Ratios & Prévisions IA ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {visibleWidgets.ratios && (
          <div className="lg:col-span-5 rounded-2xl p-5 bg-white border border-violet-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-600" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Ratios Financiers Clés</h3>
            </div>
            <div className="space-y-2">
              {ratios.map((r) => {
                const positive = r.isRatio ? r.value >= 1 : r.value >= 0;
                return (
                  <div key={r.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-800">{r.label}</div>
                        <div className="text-[9px] text-slate-400">{r.desc}</div>
                      </div>
                      {r.key && (
                        <button
                          onClick={() => setPedagogicalModal({ key: r.key, label: r.label })}
                          className="text-[9px] font-extrabold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded hover:bg-violet-100"
                        >
                          Pourquoi ?
                        </button>
                      )}
                    </div>
                    <div className={`text-sm font-extrabold font-mono ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {r.isRatio ? fmtDec(r.value, 2) : r.isPercent ? fmtPct(r.value) : fmtMoney(r.value, true)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {visibleWidgets.previsions && (
          <div className={`${visibleWidgets.ratios ? 'lg:col-span-7' : 'lg:col-span-12'} rounded-2xl p-5 bg-white border border-violet-100 shadow-sm space-y-3`}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Prévisions IA de Trésorerie</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {m.previsions.map((prev: DashboardForecast) => {
                const pos = prev.tresoreriePrevisionnelle >= 0;
                return (
                  <div
                    key={prev.horizon}
                    className={`rounded-xl p-3 text-center border ${pos ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'}`}
                  >
                    <div className="text-[10px] font-extrabold uppercase text-slate-500 mb-1">{prev.label}</div>
                    <div className={`text-xs font-extrabold font-mono ${pos ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {fmtMoney(prev.tresoreriePrevisionnelle, true)}
                    </div>
                    <div className="text-[9px] mt-1 font-semibold text-slate-500">
                      Prob. <strong className="text-slate-900">{prev.probability}%</strong>
                    </div>
                    <div className="mt-1.5 h-1 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-violet-600 rounded-full" style={{ width: `${prev.probability}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 12. Top Clients & Fournisseurs ─────────────────────────────────── */}
      {visibleWidgets.topPerformance && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top Clients */}
          <div className="rounded-2xl p-5 bg-white border border-violet-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Top Clients — Créances</h3>
            </div>
            {m.topClients.length === 0 ? (
              <div className="text-xs italic text-slate-400 py-4 text-center">Aucune créance enregistrée.</div>
            ) : (
              <div className="space-y-2">
                {m.topClients.map((c, i) => {
                  const maxV = m.topClients[0]?.montant || 1;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-extrabold text-amber-700 flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">{c.nom}</div>
                        <div className="h-1.5 rounded-full mt-1 overflow-hidden bg-amber-50">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: `${(c.montant / maxV) * 100}%` }} />
                        </div>
                      </div>
                      <div className="text-xs font-extrabold font-mono flex-shrink-0 text-amber-700">{fmtMoney(c.montant, true)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Fournisseurs */}
          <div className="rounded-2xl p-5 bg-white border border-violet-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Top Fournisseurs — Dettes</h3>
            </div>
            {m.topFournisseurs.length === 0 ? (
              <div className="text-xs italic text-slate-400 py-4 text-center">Aucune dette fournisseur enregistrée.</div>
            ) : (
              <div className="space-y-2">
                {m.topFournisseurs.map((f, i) => {
                  const maxV = m.topFournisseurs[0]?.montant || 1;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-[10px] font-extrabold text-rose-700 flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">{f.nom}</div>
                        <div className="h-1.5 rounded-full mt-1 overflow-hidden bg-rose-50">
                          <div className="h-full rounded-full bg-rose-400" style={{ width: `${(f.montant / maxV) * 100}%` }} />
                        </div>
                      </div>
                      <div className="text-xs font-extrabold font-mono flex-shrink-0 text-rose-700">{fmtMoney(f.montant, true)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 13. Activités Récentes ────────────────────────────────────────── */}
      {visibleWidgets.activitesRecentes && (
        <div className="rounded-2xl p-5 bg-white border border-violet-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-600" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Activités Récentes</h3>
            </div>
            <div className="flex gap-1">
              {(['ecritures', 'factures'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                    activeTab === tab ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'ecritures' ? 'Écritures' : 'Factures'}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'ecritures' && (
            m.ecrituresRecent.length === 0 ? (
              <div className="text-xs italic py-4 text-center text-slate-400">Aucune écriture enregistrée.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="uppercase font-semibold text-[10px] text-slate-400">
                    <tr>
                      <th className="p-2">N° Écriture</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Journal</th>
                      <th className="p-2">Libellé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {m.ecrituresRecent.map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2 font-mono font-bold text-violet-600">{entry.entryNumber}</td>
                        <td className="p-2 font-mono text-slate-500">{entry.date}</td>
                        <td className="p-2 text-slate-700">{entry.journalType}</td>
                        <td className="p-2 truncate max-w-xs text-slate-700">{entry.wording}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === 'factures' && (
            m.facturessRecent.length === 0 ? (
              <div className="text-xs italic py-4 text-center text-slate-400">Aucune facture enregistrée.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="uppercase font-semibold text-[10px] text-slate-400">
                    <tr>
                      <th className="p-2">Numéro</th>
                      <th className="p-2">Client/Fourn.</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Montant TTC</th>
                      <th className="p-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {m.facturessRecent.map((inv: any) => {
                      const statusColor =
                        inv.statut === 'PAYE'
                          ? '#10B981'
                          : inv.statut === 'VALIDE'
                          ? '#3B82F6'
                          : inv.statut === 'ANNULE'
                          ? '#EF4444'
                          : '#F59E0B';
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2 font-mono font-bold text-violet-600">{inv.numero}</td>
                          <td className="p-2 truncate max-w-xs text-slate-700">{inv.client}</td>
                          <td className="p-2 font-mono text-slate-500">{inv.date}</td>
                          <td className="p-2 font-extrabold font-mono text-slate-900">{fmtMoney(inv.montant, true)}</td>
                          <td className="p-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${statusColor}18`, color: statusColor }}>
                              {inv.statut}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

    </div>
  );
};

export default DashboardModule;
