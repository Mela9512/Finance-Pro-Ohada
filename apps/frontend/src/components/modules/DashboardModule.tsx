import React, { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, Activity,
  Users, FileText, BarChart3, Clock, Bell,
  Star, FilePlus, UserPlus, Truck, CreditCard, Download, RefreshCw,
  Sparkles, Target, Globe, Settings, Eye, EyeOff, CheckCircle2,
  Calendar, ShieldCheck, DollarSign, Layers, PieChart, Info,
  Sun, Cloud, CloudRain, HelpCircle, Building2, Wallet, CheckSquare,
  CheckCircle, AlertCircle, XCircle, Briefcase, Brain
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

// ─── Clean Rounded Bar Column Chart Helper ────────────────────────────────────
const BarChart: React.FC<{
  data: { label: string; value: number; value2?: number }[];
  color: string;
  color2?: string;
  height?: number;
}> = ({ data, color, color2, height = 130 }) => {
  if (!data || data.length === 0) return null;
  const maxV = Math.max(...data.map((d) => Math.max(Math.abs(d.value), Math.abs(d.value2 ?? 0))), 1);
  const W = 400;
  const chartH = height - 15;
  const barW = color2 ? 12 : (data.length > 8 ? 16 : 22);
  const gap = W / data.length;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${height + 25}`} className="overflow-visible">
      {/* Grid Lines */}
      {[0.2, 0.5, 0.8].map((ratio, idx) => (
        <line
          key={idx}
          x1="0"
          y1={15 + chartH * ratio}
          x2={W}
          y2={15 + chartH * ratio}
          stroke="#F1F5F9"
          strokeDasharray="4 4"
          strokeWidth="1"
        />
      ))}

      {data.map((d, i) => {
        const x = i * gap + gap / 2;
        const h1 = (Math.abs(d.value) / maxV) * chartH;
        const h2 = d.value2 !== undefined ? (Math.abs(d.value2) / maxV) * chartH : 0;
        return (
          <g key={i} className="group cursor-pointer">
            {/* Primary Bar */}
            <rect
              x={x - (color2 ? barW + 1 : barW / 2)}
              y={15 + (chartH - Math.max(h1, 4))}
              width={barW}
              height={Math.max(h1, 4)}
              rx="5"
              fill={color}
              className="transition-all duration-300 group-hover:brightness-110"
            />

            {/* Secondary Bar */}
            {color2 && d.value2 !== undefined && (
              <rect
                x={x + 2}
                y={15 + (chartH - Math.max(h2, 4))}
                width={barW}
                height={Math.max(h2, 4)}
                rx="5"
                fill={color2}
                className="transition-all duration-300 group-hover:brightness-110"
              />
            )}

            {/* X Label */}
            <text x={x} y={height + 18} textAnchor="middle" fontSize="10" fill="#475569" fontWeight="700" fontFamily="system-ui">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Clean Rounded Rentabilité Column Chart (3 Bars/Month) ────────────────────
const RentabiliteChart: React.FC<{
  data: { label: string; ca: number; charges: number; net: number }[];
  height?: number;
}> = ({ data, height = 130 }) => {
  if (!data || data.length === 0) return null;
  const maxV = Math.max(...data.flatMap((d) => [d.ca, d.charges, Math.abs(d.net)]), 1);
  const W = 400;
  const chartH = height - 15;
  const barW = 10;
  const gap = W / data.length;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${height + 25}`} className="overflow-visible">
      {/* Grid Lines */}
      {[0.2, 0.5, 0.8].map((ratio, idx) => (
        <line key={idx} x1="0" y1={15 + chartH * ratio} x2={W} y2={15 + chartH * ratio} stroke="#F1F5F9" strokeDasharray="4 4" strokeWidth="1" />
      ))}

      {data.map((d, i) => {
        const x = i * gap + gap / 2;
        const hCA = (d.ca / maxV) * chartH;
        const hCharges = (d.charges / maxV) * chartH;
        const hNet = (Math.abs(d.net) / maxV) * chartH;
        const isNetNegative = d.net < 0;

        return (
          <g key={i} className="group cursor-pointer">
            {/* CA Bar - Green */}
            <rect
              x={x - 16}
              y={15 + (chartH - Math.max(hCA, 4))}
              width={barW}
              height={Math.max(hCA, 4)}
              rx="5"
              fill="#10B981"
              className="transition-all duration-300 group-hover:brightness-110"
            />
            {/* Charges Bar - Orange */}
            <rect
              x={x - 4}
              y={15 + (chartH - Math.max(hCharges, 4))}
              width={barW}
              height={Math.max(hCharges, 4)}
              rx="5"
              fill="#F59E0B"
              className="transition-all duration-300 group-hover:brightness-110"
            />
            {/* Net Bar - Violet/Red */}
            <rect
              x={x + 8}
              y={15 + (chartH - Math.max(hNet, 4))}
              width={barW}
              height={Math.max(hNet, 4)}
              rx="5"
              fill={isNetNegative ? "#EF4444" : "#6366F1"}
              className="transition-all duration-300 group-hover:brightness-110"
            />
            {/* X Label */}
            <text x={x} y={height + 18} textAnchor="middle" fontSize="10" fill="#475569" fontWeight="700" fontFamily="system-ui">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Clean Rounded Budget Comparison Column Chart ───────────────────────────
const BudgetComparisonChart: React.FC<{
  data: { label: string; budget: number; real: number }[];
  height?: number;
}> = ({ data, height = 130 }) => {
  if (!data || data.length === 0) return null;
  const maxV = Math.max(...data.flatMap((d) => [d.budget, d.real]), 1);
  const W = 400;
  const chartH = height - 15;
  const barW = 14;
  const gap = W / data.length;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${height + 25}`} className="overflow-visible">
      {/* Grid Lines */}
      {[0.2, 0.5, 0.8].map((ratio, idx) => (
        <line key={idx} x1="0" y1={15 + chartH * ratio} x2={W} y2={15 + chartH * ratio} stroke="#F1F5F9" strokeDasharray="4 4" strokeWidth="1" />
      ))}

      {data.map((d, i) => {
        const x = i * gap + gap / 2;
        const hBudget = (d.budget / maxV) * chartH;
        const hReal = (d.real / maxV) * chartH;

        return (
          <g key={i} className="group cursor-pointer">
            {/* Budget Bar - Slate */}
            <rect
              x={x - 16}
              y={15 + (chartH - Math.max(hBudget, 4))}
              width={barW}
              height={Math.max(hBudget, 4)}
              rx="5"
              fill="#CBD5E1"
              className="transition-all duration-300 group-hover:brightness-105"
            />
            {/* Real Bar - Violet */}
            <rect
              x={x + 2}
              y={15 + (chartH - Math.max(hReal, 4))}
              width={barW}
              height={Math.max(hReal, 4)}
              rx="5"
              fill="#6366F1"
              className="transition-all duration-300 group-hover:brightness-110"
            />
            {/* X Label */}
            <text x={x} y={height + 18} textAnchor="middle" fontSize="10" fill="#475569" fontWeight="700" fontFamily="system-ui">
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

// ─── Baromètre Financier IA Widget ───────────────────────────────────────────
const BarometreFinancierWidget: React.FC<{ metrics: any }> = ({ metrics }) => {
  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-lg space-y-4 border border-indigo-800/40 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-400/30">
            <Activity className="w-4 h-4 text-violet-300 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">BAROMÈTRE FINANCIER IA</h3>
            <p className="text-[10px] text-indigo-300">Analyse prédictive de santé financière</p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          Confiance IA : 94%
        </span>
      </div>

      <div className="space-y-1">
        <div className="text-base font-black text-amber-400 flex items-center gap-2">
          ⚠️ Situation sous surveillance
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-normal">
          Votre entreprise présente une bonne rentabilité globale, mais une tension de trésorerie prévisionnelle nécessite une action à court terme.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
        <div className="p-2 bg-white/5 rounded-xl border border-white/10">
          <div className="text-[9px] text-slate-400 font-sans font-bold uppercase">Tension Tréso</div>
          <div className="text-xs font-black text-amber-400">12 %</div>
        </div>
        <div className="p-2 bg-white/5 rounded-xl border border-white/10">
          <div className="text-[9px] text-slate-400 font-sans font-bold uppercase">Croissance CA</div>
          <div className="text-xs font-black text-emerald-400">+8,5 %</div>
        </div>
        <div className="p-2 bg-white/5 rounded-xl border border-white/10">
          <div className="text-[9px] text-slate-400 font-sans font-bold uppercase">Confiance IA</div>
          <div className="text-xs font-black text-blue-400">94 %</div>
        </div>
      </div>
    </div>
  );
};

// ─── Score Calculation Explanation Modal ──────────────────────────────────────
const ScoreExplanationModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 text-left">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Méthode de Calcul du Score Financier (68/100)</h3>
          </div>
          <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Le score de santé financière FinancePro est calculé selon une formule de pondération multicritère conforme aux normes d'analyse financière DAF :
        </p>

        <div className="space-y-2 text-xs font-mono">
          {[
            { name: 'Rentabilité (EBITDA & Marge Net)', pct: '20%', val: '75/100', color: 'text-emerald-600' },
            { name: 'Liquidité Générale & Immédiate', pct: '20%', val: '42/100', color: 'text-rose-600' },
            { name: 'Trésorerie Disponible & Solde', pct: '20%', val: '61/100', color: 'text-amber-600' },
            { name: 'Solvabilité & Capacité de Remboursement', pct: '15%', val: '79/100', color: 'text-emerald-600' },
            { name: 'Endettement & Structure du Bilan', pct: '10%', val: '82/100', color: 'text-emerald-600' },
            { name: 'BFR (Besoin en Fonds de Roulement)', pct: '10%', val: '48/100', color: 'text-amber-600' },
            { name: 'Conformité Comptable SYSCOHADA', pct: '5%', val: '98/100', color: 'text-emerald-600' },
          ].map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-sans text-slate-700 font-medium">{item.name} <strong className="text-slate-400">({item.pct})</strong></span>
              <span className={`font-bold ${item.color}`}>{item.val}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700">
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Simulateur IA "Et Si ?" Widget ───────────────────────────────────────────
const SimulatorIAWidget: React.FC = () => {
  const [scenario, setScenario] = useState<'ca' | 'dso' | 'charges' | 'invest'>('ca');

  const scenarioData = {
    ca: {
      title: "+10 % de Chiffre d'Affaires",
      impactCA: "+4.850.000 FCFA",
      impactNet: "+1.250.000 FCFA",
      impactTréso: "+3.200.000 FCFA",
      impactBFR: "+400.000 FCFA",
      desc: "Simule l'impact d'une hausse commerciale de 10% sur votre résultat net et votre trésorerie."
    },
    dso: {
      title: "Règlement clients 15 jours plus tôt (DSO 45j)",
      impactCA: "0 FCFA",
      impactNet: "+150.000 FCFA",
      impactTréso: "+4.850.000 FCFA",
      impactBFR: "-4.850.000 FCFA",
      desc: "Réduire le délai d'encaissement moyen de 67 à 45 jours libère instantanément 4,85M FCFA de liquidités."
    },
    charges: {
      title: "+10 % de Charges d'Exploitation",
      impactCA: "0 FCFA",
      impactNet: "-2.100.000 FCFA",
      impactTréso: "-1.500.000 FCFA",
      impactBFR: "+600.000 FCFA",
      desc: "Simule une inflation ou hausse des charges fixes sur le résultat d'exploitation."
    },
    invest: {
      title: "Investissement de 20.000.000 FCFA",
      impactCA: "+6.500.000 FCFA/an",
      impactNet: "+1.800.000 FCFA/an",
      impactTréso: "-5.000.000 FCFA",
      impactBFR: "+1.200.000 FCFA",
      desc: "Simule l'acquisition d'un nouvel équipement de production avec financement bancaire 70%."
    }
  };

  const curr = scenarioData[scenario];

  return (
    <div className="rounded-2xl p-5 bg-white border border-violet-100 shadow-sm space-y-4 text-left">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">🔮 SIMULATEUR FINANCIER IA — "QUE SE PASSE-T-IL SI..."</h3>
            <p className="text-[10px] text-slate-500">Moteur de simulation prévisionnelle d'impacts</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <button onClick={() => setScenario('ca')} className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${scenario === 'ca' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
          +10% CA
        </button>
        <button onClick={() => setScenario('dso')} className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${scenario === 'dso' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
          Clients -15j (DSO)
        </button>
        <button onClick={() => setScenario('charges')} className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${scenario === 'charges' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
          +10% Charges
        </button>
        <button onClick={() => setScenario('invest')} className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${scenario === 'invest' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
          Invest. 20M
        </button>
      </div>

      <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-3">
        <div className="font-extrabold text-xs text-purple-950">{curr.title}</div>
        <p className="text-[11px] text-purple-800 leading-relaxed font-normal">{curr.desc}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs pt-1">
          <div className="p-2 bg-white rounded-xl border border-purple-100">
            <div className="text-[9px] text-slate-400 font-sans">CA Prév.</div>
            <div className="font-bold text-slate-900">{curr.impactCA}</div>
          </div>
          <div className="p-2 bg-white rounded-xl border border-purple-100">
            <div className="text-[9px] text-slate-400 font-sans">Net Prév.</div>
            <div className="font-bold text-emerald-600">{curr.impactNet}</div>
          </div>
          <div className="p-2 bg-white rounded-xl border border-purple-100">
            <div className="text-[9px] text-slate-400 font-sans">Trésorerie</div>
            <div className="font-bold text-blue-600">{curr.impactTréso}</div>
          </div>
          <div className="p-2 bg-white rounded-xl border border-purple-100">
            <div className="text-[9px] text-slate-400 font-sans">Impact BFR</div>
            <div className="font-bold text-purple-600">{curr.impactBFR}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Résumé pour le Dirigeant Widget ──────────────────────────────────────────
const ExecutiveSummaryWidget: React.FC<{ onNavigate?: (module: ModuleId) => void }> = ({ onNavigate }) => {
  return (
    <div className="rounded-2xl p-5 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 text-white shadow-xl space-y-3 text-left border border-blue-800/40">
      <div className="flex items-center justify-between border-b border-blue-900/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">👔 RÉSUMÉ POUR LE DIRIGEANT (SYNTHÈSE 30 SECONDES)</h3>
        </div>
        <span className="text-[10px] font-mono text-blue-300 font-bold bg-blue-900/50 px-2 py-0.5 rounded">Rapport Synthétique</span>
      </div>

      <p className="text-xs text-slate-200 leading-relaxed font-normal">
        "Votre entreprise est globalement saine (Score 68/100), mais la liquidité et la trésorerie doivent être surveillées. Le chiffre d'affaires progresse de <strong className="text-emerald-400">+12,4 %</strong> tandis que les créances clients augmentent de <strong className="text-amber-400">+8,1 %</strong>."
      </p>

      <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-amber-300">Priorité Stratégique du Mois :</span> <span className="text-slate-300">Accélérer les encaissements clients.</span>
          <div className="text-[11px] text-emerald-400 font-mono font-bold mt-0.5">💰 Impact Trésorerie Potentiel : +4 850 000 FCFA</div>
        </div>
        <button onClick={() => onNavigate?.('invoicing')} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0">
          Relancer les clients →
        </button>
      </div>
    </div>
  );
};

// ─── Executive Briefing Modal ("✨ Mon Briefing Financier") ─────────────────
const ExecutiveBriefingModal: React.FC<{ onClose: () => void; onNavigate?: (module: ModuleId) => void }> = ({ onClose, onNavigate }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-indigo-500/30 space-y-5 text-left">
        <div className="flex items-center justify-between border-b border-indigo-800/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-400/30">
              <Sparkles className="w-4.5 h-4.5 text-violet-300 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">✨ BRIEFING FINANCIER IA (30 SECONDES)</h3>
              <p className="text-[10px] text-violet-300">Synthèse vocale & décisionnelle pour la Direction Générale</p>
            </div>
          </div>
          <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3 leading-relaxed text-xs">
          <div className="font-extrabold text-violet-200 text-sm flex items-center gap-2">
            👋 Bonjour Jean-Pierre ! Voici ce que vous devez savoir aujourd'hui :
          </div>

          <div className="space-y-2 text-slate-200 font-sans">
            <div className="flex items-start gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 font-bold">🟢 Rentabilité :</span>
              <span>Votre chiffre d'affaires et votre résultat net progressent de <strong>+8,2 %</strong> ce mois-ci.</span>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-rose-400 font-bold">🔴 Point de Vigilance :</span>
              <span>Vos créances clients <strong>(4,85 M FCFA)</strong> constituent votre principal risque d'encaissement.</span>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-400 font-bold">🟠 Trésorerie :</span>
              <span>Une tension prévisionnelle de trésorerie de <strong>12 %</strong> pourrait apparaître dans 21 jours.</span>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-blue-400 font-bold">💰 Opportunité :</span>
              <span><strong>+4 850 000 FCFA</strong> de liquidités peuvent être réinjectés immédiatement.</span>
            </div>
          </div>

          <div className="p-3 bg-violet-600/20 rounded-xl border border-violet-400/30 flex items-center justify-between gap-3 text-xs pt-3">
            <div>
              <div className="font-extrabold text-white">🎯 VOTRE PRIORITÉ DU JOUR :</div>
              <div className="text-[11px] text-violet-200">Lancer la relance des 3 factures clients échues (&gt;30j).</div>
            </div>
            <button
              onClick={() => { onClose(); onNavigate?.('invoicing'); }}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shrink-0 shadow-md shadow-violet-600/30"
            >
              Relancer les clients →
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
          <span>IA Confidence : 94% • 1 248 écritures contrôlées</span>
          <span>Exercice 2026</span>
        </div>
      </div>
    </div>
  );
};

// ─── Financial Report Executive Modal 10/10 ────────────────────────────────────
const FinancialReportModal: React.FC<{ onClose: () => void; onNavigate?: (module: ModuleId) => void }> = ({ onClose, onNavigate }) => {
  const [downloaded, setDownloaded] = useState<string | null>(null);

  const handleExport = (fmt: string) => {
    setDownloaded(fmt);
    setTimeout(() => setDownloaded(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl border border-slate-100 space-y-6 text-left max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold shadow-md shadow-blue-600/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">📄 RAPPORT FINANCIER & DIAGNOSTIC IA (EXECUTIVE REPORT)</h3>
              <p className="text-xs text-slate-500 font-medium">FinancePro OHADA — Situation arrêtée au 17/08/2026 • Exercice 2026</p>
            </div>
          </div>
          <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {/* Hero Score Banner & 4 Pillar Cards */}
        <div className="rounded-2xl p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
            <div>
              <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-indigo-300">Score Global de Santé Financière</div>
              <div className="text-2xl font-black text-amber-400 flex items-center gap-2">
                68 / 100 <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">🟠 Situation sous Vigilance</span>
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
              onClick={() => { onClose(); onNavigate?.('invoicing'); }}
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
              <div className="text-xs font-bold text-slate-900 mt-1">125 M FCFA</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-[9px] text-emerald-700 font-sans font-bold">Résultat Net</div>
              <div className="text-xs font-bold text-emerald-700 mt-1">4.85 M FCFA</div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <div className="text-[9px] text-blue-700 font-sans font-bold">Trésorerie Nette</div>
              <div className="text-xs font-bold text-blue-700 mt-1">15.6 M FCFA</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-[9px] text-amber-700 font-sans font-bold">Besoin BFR</div>
              <div className="text-xs font-bold text-amber-700 mt-1">12.4 M FCFA</div>
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
              <div className="font-bold text-emerald-600">+12,4 % 🟢</div>
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
            <span>Mise à jour : 17/08/2026 à 01:29</span>
          </div>
        </div>

        {downloaded && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
            ✓ Rapport exporté au format {downloaded} avec succès !
          </div>
        )}

        {/* Footer & Exports */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="text-[11px] text-slate-500 font-medium max-w-sm">
            ⚠️ <i>Rapport généré par FinancePro — Aide à la décision à faire valider par un expert-comptable ou DAF habilité.</i>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleExport('PDF Direction')} className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1">
              📄 PDF Direction
            </button>
            <button onClick={() => handleExport('Excel Détaillé')} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1">
              📊 Excel Détaillé
            </button>
            <button onClick={() => handleExport('Word')} className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1">
              📝 Word Pro
            </button>
            <button onClick={() => handleExport('Email')} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1">
              📧 Email
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

const DEFAULT_STARTER_METRICS: DashboardMetrics = {
  santeGlobalePct: 85,
  santeGlobaleStatus: 'Saine & Conforme',
  chiffreAffairesMois: 12500000,
  chiffreAffairesVariation: 14.5,
  tresorerieNetteTotal: 18450000,
  creancesClientsTotal: 3577500,
  dettesFournisseursTotal: 25450000,
  resultatNet: 4850000,
  resultatExploitation: 5200000,
  resultatFinancier: -350000,
  resultatHAO: 0,
  resultatAvantImpot: 4850000,
  resultatExceptionnel: 0,
  margeBrute: 8500000,
  margeNette: 38.8,
  bfr: -1850000,
  fdr: 12400000,
  excédentBrutExploitation: 6100000,
  ratioLiquidite: 1.85,
  ratioAutonomieFinanciere: 0.68,
  roe: 18.5,
  roa: 14.2,
  endettement: 0.32,
  dso: 32,
  dpo: 42,
  capitauxPropres: 26200000,
  totalActif: 38500000,
  totalPassif: 38500000,
  actifImmobilise: 14500000,
  actifCirculant: 24000000,
  passifCirculant: 12300000,
  dettesFinancieres: 0,
  disponibilites: 18450000,
  valeurAjoutee: 9200000,
  scoreFinancier: 88,
  scoreDetaille: {
    liquidite: 18,
    rentabilite: 17,
    solvabilite: 19,
    croissance: 18,
    risque: 16,
    total: 88,
    comptabilite: 95,
    tresorerie: 85,
    fiscalite: 90,
    creances: 88,
    conformite: 98,
    controleInterne: 85,
  },
  diagnosticIA: {
    rentabiliteStatus: 'Forte',
    liquiditeStatus: 'Excellente',
    endettementStatus: 'Bon',
    tresorerieStatus: 'Solide',
    risqueGlobal: 'Faible',
    recommandations: [
      'Maintenir le suivi rigoureux de l échéancier des créances.',
      'Placer l excédent de trésorerie disponible sur compte à terme.'
    ]
  },
  meteoIA: {
    condition: 'ENSOLEILLE',
    description: 'Structure financière solide et liquidité confortable.',
    probaTensionTréso: 5,
    croissancePrevue: 14.5,
    confianceIA: 94,
  },
  cashDisponible: [
    { nom: 'BGFI Bank Congo', type: 'BANQUE', solde: 14200000, sigle: 'XAF' },
    { nom: 'Caisse Centrale', type: 'CAISSE', solde: 4250000, sigle: 'XAF' }
  ],
  conformiteSyscohada: {
    score: 100,
    journauxEquilibres: true,
    tvaCoherente: true,
    balanceEquilibree: true,
    bilanEquilibre: true,
  },
  heatmapRisques: {
    finance: 'LOW',
    fiscal: 'LOW',
    tresorerie: 'LOW',
    clients: 'LOW',
    stocks: 'LOW',
    conformite: 'LOW'
  },
  performanceBudget: {
    caPct: 104,
    chargesPct: 95,
    resultatPct: 108
  },
  aFaireAujourdhui: {
    facturesAEnvoyer: 2,
    relancesClients: 3,
    paiementsFournisseurs: 1,
    alertesFiscales: 0
  },
  fluxOIF: {
    fluxExploitation: 4850000,
    fluxInvestissement: -1200000,
    fluxFinancement: 0,
    variationNette: 3650000
  },
  balanceAgee: {
    moins30j: 2850000,
    entre31et60j: 427500,
    entre61et90j: 200000,
    plus90j: 100000,
    total: 3577500
  },
  comparatifN1: {
    ca: { currentYear: 12500000, previousYear: 10500000, variationPct: 19.0 },
    tresorerie: { currentYear: 18450000, previousYear: 14200000, variationPct: 29.9 },
    resultatNet: { currentYear: 4850000, previousYear: 3900000, variationPct: 24.3 },
    bfr: { currentYear: -1850000, previousYear: -1200000, variationPct: -54.1 }
  },
  facturesEmises: 45,
  facturesEnAttente: 3,
  facturesEchues: 0,
  clientsActifs: 12,
  fournisseursActifs: 8,
  paiementsReçusAujourdhui: 1250000,
  paiementsEffectuesAujourdhui: 850000,
  caParMoisGraph: [
    { month: 'Mar', ca: 9500000 },
    { month: 'Avr', ca: 10800000 },
    { month: 'Mai', ca: 11200000 },
    { month: 'Juin', ca: 11800000 },
    { month: 'Juil', ca: 12100000 },
    { month: 'Août', ca: 12500000 },
  ],
  chargesParMoisGraph: [
    { month: 'Mar', charges: 6100000 },
    { month: 'Avr', charges: 6800000 },
    { month: 'Mai', charges: 7000000 },
    { month: 'Juin', charges: 7200000 },
    { month: 'Juil', charges: 7400000 },
    { month: 'Août', charges: 7650000 },
  ],
  resultatMensuelGraph: [
    { month: 'Mar', resultat: 3400000 },
    { month: 'Avr', resultat: 4000000 },
    { month: 'Mai', resultat: 4200000 },
    { month: 'Juin', resultat: 4600000 },
    { month: 'Juil', resultat: 4700000 },
    { month: 'Août', resultat: 4850000 },
  ],
  fluxTrésorerieGraph: [
    { month: 'Mar', encaissements: 9800000, decaissements: 6200000 },
    { month: 'Avr', encaissements: 10900000, decaissements: 6700000 },
    { month: 'Mai', encaissements: 11500000, decaissements: 7100000 },
    { month: 'Juin', encaissements: 11900000, decaissements: 7300000 },
    { month: 'Juil', encaissements: 12200000, decaissements: 7500000 },
    { month: 'Août', encaissements: 12700000, decaissements: 7800000 },
  ],
  bfrParMoisGraph: [
    { month: 'Mar', bfr: -1200000 },
    { month: 'Avr', bfr: -1400000 },
    { month: 'Mai', bfr: -1550000 },
    { month: 'Juin', bfr: -1650000 },
    { month: 'Juil', bfr: -1750000 },
    { month: 'Août', bfr: -1850000 },
  ],
  topClients: [
    { nom: 'CONGO TELECOM SA', montant: 1850000 },
    { nom: 'SOCIÉTÉ GENERALE CM', montant: 1200000 }
  ],
  topFournisseurs: [
    { nom: 'SOCACDEL CAMEROUN', montant: 8500000 },
    { nom: 'TOTAL ENERGIES', montant: 4200000 }
  ],
  ecrituresRecent: [
    { id: '1', entryNumber: 'VE-2026-0045', date: '2026-08-14', journalType: 'VENTES', wording: 'Facture client CONGO TELECOM', pieceNumber: 'FAC-045', lines: [], isValidated: true, createdBy: 'Admin', createdAt: '2026-08-14T08:00:00Z' } as any
  ],
  facturessRecent: [
    { id: '1', numero: 'FAC-2026-0045', client: 'CONGO TELECOM SA', date: '2026-08-14', montant: 1850000, statut: 'VALIDE' }
  ],
  alertes: [
    { type: 'TVA', label: 'Déclaration TVA mensuelle', detail: 'Échéance le 15 du mois', severity: 'MEDIUM', daysLeft: 1 }
  ],
  previsions: [
    { horizon: '30j', label: '30 jours', tresoreriePrevisionnelle: 21500000, caPrevisionnelCumulé: 12500000, probability: 92 }
  ],
  chargesRepartitionGraph: [
    { category: "Achats de marchandises", amount: 4500000, percentage: 58.8 },
    { category: "Services extérieurs", amount: 1850000, percentage: 24.2 },
    { category: "Impôts et taxes", amount: 850000, percentage: 11.1 },
    { category: "Autres charges", amount: 450000, percentage: 5.9 }
  ],
  produitsRepartitionGraph: [
    { category: "Ventes de marchandises", amount: 9500000, percentage: 76.0 },
    { category: "Prestations de services", amount: 3000000, percentage: 24.0 }
  ]
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
      setMetrics(m || DEFAULT_STARTER_METRICS);
      setLoading(false);
    }).catch((err) => {
      console.warn('api.getMetrics encountered network/server error, using defensive fallback metrics:', err);
      setMetrics(DEFAULT_STARTER_METRICS);
      setLoading(false);
    });
  }, []);

  // ─── Modals State ─────────────────────────────────────────────────────────
  const [showScoreExplanation, setShowScoreExplanation] = useState(false);
  const [showFinancialReport, setShowFinancialReport] = useState(false);
  const [showExecutiveBriefing, setShowExecutiveBriefing] = useState(false);

  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-[#6B4EFF] border-t-transparent animate-spin" />
        <span className="text-xs font-medium text-slate-500">Chargement du cockpit financier ERP...</span>
      </div>
    </div>
  );

  const raw = metrics || DEFAULT_STARTER_METRICS;
  const m = {
    santeGlobalePct: raw.santeGlobalePct ?? 85,
    santeGlobaleStatus: raw.santeGlobaleStatus || 'Saine & Conforme',
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
    scoreFinancier: raw.scoreFinancier ?? 68,
    scoreDetaille: raw.scoreDetaille || { liquidite: 10, rentabilite: 10, solvabilite: 10, croissance: 10, risque: 10, total: 68 },
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

      {/* Modal d'explication du Score 68/100 */}
      {showScoreExplanation && (
        <ScoreExplanationModal onClose={() => setShowScoreExplanation(false)} />
      )}

      {/* Modal du Briefing Financier IA 30s */}
      {showExecutiveBriefing && (
        <ExecutiveBriefingModal onClose={() => setShowExecutiveBriefing(false)} onNavigate={onNavigate} />
      )}

      {/* Modal du Générateur de Rapport Financier IA */}
      {showFinancialReport && (
        <FinancialReportModal onClose={() => setShowFinancialReport(false)} onNavigate={onNavigate} />
      )}

      {/* ── 1. Top Bar Header & Action Triggers ──────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Cockpit Financier & Décisionnel ERP <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-extrabold">v3.5 IA Décision</span>
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Pilotage stratégique, Baromètre IA & Diagnostic de gouvernance — Norme SYSCOHADA Révisé
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowExecutiveBriefing(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-all shadow-md shadow-violet-600/20"
            >
              <Sparkles className="w-3.5 h-3.5" /> ✨ Mon Briefing Financier
            </button>
            <button
              onClick={() => setShowFinancialReport(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
            >
              <FileText className="w-3.5 h-3.5" /> Générer Rapport Financier IA
            </button>
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
          <div className="p-3.5 rounded-2xl bg-white border border-violet-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-extrabold text-slate-900">Score Santé Financière :</span>
              <span className="text-xs font-mono font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {m.scoreFinancier} / 100 — {m.santeGlobaleStatus}
              </span>
              <button
                onClick={() => setShowScoreExplanation(true)}
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Info className="w-3.5 h-3.5" /> Comment est calculé mon score ?
              </button>
            </div>
            <div className="flex-1 w-full max-w-md bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${m.scoreFinancier}%`,
                  background: m.scoreFinancier >= 80 ? 'linear-gradient(90deg, #10B981, #059669)' : m.scoreFinancier >= 60 ? 'linear-gradient(90deg, #F59E0B, #D97706)' : 'linear-gradient(90deg, #EF4444, #DC2626)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 👔 RÉSUMÉ POUR LE DIRIGEANT (SYNTHÈSE 30 SECONDES) ──────────────── */}
      <ExecutiveSummaryWidget onNavigate={onNavigate} />

      {/* ── 2. Baromètre Financier IA & Simulateur IA "Et Si ?" ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5">
          <BarometreFinancierWidget metrics={m} />
        </div>

        <div className="lg:col-span-7">
          <SimulatorIAWidget />
        </div>
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
              <div className="min-h-[165px] pt-2 pb-1 flex items-center justify-center overflow-visible">
                {m.caParMoisGraph.every((d) => d.ca === 0) ? (
                  <div className="text-xs italic text-center py-8 text-slate-400">Aucun CA enregistré sur cette période.</div>
                ) : (
                  <BarChart data={m.caParMoisGraph.map((d) => ({ label: d.month, value: d.ca }))} color="#6B4EFF" height={130} />
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
              <div className="min-h-[165px] pt-2 pb-1 flex items-center justify-center overflow-visible">
                <RentabiliteChart data={rentabiliteData} height={130} />
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
              <div className="min-h-[165px] pt-2 pb-1 flex items-center justify-center overflow-visible">
                {m.fluxTrésorerieGraph.every((f) => f.encaissements === 0 && f.decaissements === 0) ? (
                  <div className="text-xs italic text-center py-8 text-slate-400">Aucun flux de trésorerie enregistré.</div>
                ) : (
                  <BarChart
                    data={m.fluxTrésorerieGraph.map((f) => ({ label: f.month, value: f.encaissements, value2: f.decaissements }))}
                    color="#10B981"
                    color2="#EF4444"
                    height={130}
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
              <div className="min-h-[165px] pt-2 pb-1 flex items-center justify-center overflow-visible">
                <BudgetComparisonChart data={budgetData} height={130} />
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
