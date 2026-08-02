import React, { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, Activity,
  Users, FileText, BarChart3, Clock, Bell,
  Star, FilePlus, UserPlus, Truck, CreditCard, Download, RefreshCw,
  Sparkles, Target, Globe,
} from 'lucide-react';
import { DashboardMetrics, DashboardAlert, DashboardForecast } from '@financepro/shared';
import { api } from '../../services/api';
import { ModuleId } from '../Sidebar';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtMoney = (v: number, short = false) => {
  if (short && Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (short && Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(v);
};
const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
const fmtNum = (v: number) => new Intl.NumberFormat('fr-FR').format(v);

// ─── Mini Sparkline SVG ───────────────────────────────────────────────────────
const Sparkline: React.FC<{ values: number[]; color: string; height?: number }> = ({ values, color, height = 28 }) => {
  if (values.length < 2) return null;
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

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────
const BarChart: React.FC<{
  data: { label: string; value: number; value2?: number }[];
  color: string;
  color2?: string;
  height?: number;
}> = ({ data, color, color2, height = 100 }) => {
  const maxV = Math.max(...data.map(d => Math.max(d.value, d.value2 ?? 0)), 1);
  const W = 340;
  const barW = color2 ? 14 : 24;
  const gap = W / data.length;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${height + 20}`} className="overflow-visible">
      {data.map((d, i) => {
        const x = i * gap + gap / 2;
        const h1 = (d.value / maxV) * height;
        const h2 = d.value2 !== undefined ? (d.value2 / maxV) * height : 0;
        return (
          <g key={i}>
            <rect x={x - (color2 ? barW + 1 : barW / 2)} y={height - h1} width={barW} height={Math.max(h1, 2)} rx="3" fill={color} opacity="0.85" />
            {color2 && d.value2 !== undefined && (
              <rect x={x + 1} y={height - h2} width={barW} height={Math.max(h2, 2)} rx="3" fill={color2} opacity="0.85" />
            )}
            <text x={x} y={height + 14} textAnchor="middle" fontSize="8" fill="#9CA3AF" fontFamily="system-ui">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Alert Color Map ──────────────────────────────────────────────────────────
const alertStyle = (severity: 'LOW' | 'MEDIUM' | 'HIGH') => {
  if (severity === 'HIGH') return { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C', dot: '#EF4444' };
  if (severity === 'MEDIUM') return { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', dot: '#F59E0B' };
  return { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534', dot: '#22C55E' };
};

// ─── Score Badge ──────────────────────────────────────────────────────────────
const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  const label = score >= 80 ? 'Excellente' : score >= 60 ? 'Satisfaisante' : 'Risquée';
  const circumference = 2 * Math.PI * 20;
  const dash = (score / 100) * circumference;
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-14 h-14 flex-shrink-0">
        <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
          <circle cx="22" cy="22" r="20" fill="none" stroke="#E5E7EB" strokeWidth="3" />
          <circle cx="22" cy="22" r="20" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`} style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold" style={{ color }}>{score}</span>
      </div>
      <div>
        <div className="text-sm font-extrabold" style={{ color }}>Situation {label}</div>
        <div className="text-[11px]" style={{ color: '#6B7280' }}>Score de Santé Financière / 100</div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const DashboardModule: React.FC<{ onNavigate?: (module: ModuleId) => void }> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ecritures' | 'factures'>('ecritures');
  const [activeGraphTab, setActiveGraphTab] = useState<'ca' | 'flux' | 'charges'>('ca');

  const loadMetrics = useCallback(() => {
    setLoading(true);
    api.getMetrics().then(m => { setMetrics(m); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-[#6B4EFF] border-t-transparent animate-spin" />
        <span className="text-xs font-medium text-slate-500">Chargement du tableau de bord ERP...</span>
      </div>
    </div>
  );

  if (!metrics) return (
    <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
      Impossible de charger les métriques. <button onClick={loadMetrics} className="ml-2 text-[#6B4EFF] underline">Réessayer</button>
    </div>
  );

  const m = metrics;

  // ─── Quick Actions ────────────────────────────────────────────────────────
  const quickActions: { label: string; icon: React.ElementType; color: string; bg: string; to: ModuleId }[] = [
    { label: 'Facture', icon: FilePlus, color: '#6B4EFF', bg: '#F3F0FF', to: 'invoicing' },
    { label: 'Écriture', icon: FileText, color: '#10B981', bg: '#ECFDF5', to: 'accounting' },
    { label: 'Client', icon: UserPlus, color: '#3B82F6', bg: '#EFF6FF', to: 'clients' },
    { label: 'Fournisseur', icon: Truck, color: '#F59E0B', bg: '#FFFBEB', to: 'suppliers' },
    { label: 'Paiement', icon: CreditCard, color: '#EC4899', bg: '#FDF2F8', to: 'treasury' },
    { label: 'Rapport', icon: Download, color: '#14B8A6', bg: '#F0FDFA', to: 'reports' },
  ];

  // ─── KPI Cards ────────────────────────────────────────────────────────────
  const kpiCards = [
    {
      label: 'Trésorerie Nette', sublabel: 'Comptes 521/541', value: m.tresorerieNetteTotal,
      sparkData: m.fluxTrésorerieGraph.map(f => f.encaissements - f.decaissements),
      color: '#6B4EFF', bg: '#F3F0FF', border: '#DDD6FE',
      variation: m.tresorerieNetteTotal >= 0 ? 'Positive' : 'Négative',
    },
    {
      label: "CA Mensuel", sublabel: "Compte 701", value: m.chiffreAffairesMois,
      sparkData: m.caParMoisGraph.slice(-6).map(d => d.ca),
      color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0',
      trend: m.chiffreAffairesVariation,
    },
    {
      label: 'Résultat Net', sublabel: "Exercice en cours", value: m.resultatNet,
      sparkData: m.resultatMensuelGraph.map(r => r.resultat),
      color: m.resultatNet >= 0 ? '#10B981' : '#EF4444',
      bg: m.resultatNet >= 0 ? '#ECFDF5' : '#FEF2F2',
      border: m.resultatNet >= 0 ? '#A7F3D0' : '#FECACA',
    },
    {
      label: 'Marge Nette', sublabel: "Résultat / CA", value: m.margeNette,
      isPercent: true,
      sparkData: [],
      color: m.margeNette >= 10 ? '#10B981' : m.margeNette >= 0 ? '#F59E0B' : '#EF4444',
      bg: '#FFFBEB', border: '#FDE68A',
    },
    {
      label: 'Créances Clients', sublabel: 'Compte 411', value: m.creancesClientsTotal,
      sparkData: [],
      color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A',
    },
    {
      label: 'Dettes Fournisseurs', sublabel: 'Compte 401', value: m.dettesFournisseursTotal,
      sparkData: [],
      color: '#EF4444', bg: '#FEF2F2', border: '#FECACA',
    },
    {
      label: 'Capitaux Propres', sublabel: 'Classe 1 bilan', value: m.capitauxPropres,
      sparkData: [],
      color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE',
    },
    {
      label: 'Total Actif', sublabel: 'Bilan SYSCOHADA', value: m.totalActif,
      sparkData: [],
      color: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD',
    },
  ];

  // ─── Activity Cards ───────────────────────────────────────────────────────
  const activityCards = [
    { label: 'Factures Émises', value: fmtNum(m.facturesEmises), icon: FileText, color: '#6B4EFF', bg: '#F3F0FF' },
    { label: 'En Attente', value: fmtNum(m.facturesEnAttente), icon: Clock, color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Échues (!)', value: fmtNum(m.facturesEchues), icon: AlertTriangle, color: '#EF4444', bg: '#FEF2F2' },
    { label: 'Clients Actifs', value: fmtNum(m.clientsActifs), icon: Users, color: '#10B981', bg: '#ECFDF5' },
    { label: 'Fournisseurs', value: fmtNum(m.fournisseursActifs), icon: Truck, color: '#0EA5E9', bg: '#F0F9FF' },
    { label: 'Encaissements / Auj.', value: fmtMoney(m.paiementsReçusAujourdhui, true), icon: TrendingUp, color: '#10B981', bg: '#ECFDF5' },
    { label: 'Décaissements / Auj.', value: fmtMoney(m.paiementsEffectuesAujourdhui, true), icon: TrendingDown, color: '#EF4444', bg: '#FEF2F2' },
  ];

  // ─── OHADA Indicators ─────────────────────────────────────────────────────
  const ohadaIndicators = [
    { label: 'Actif Immobilisé', value: m.actifImmobilise, account: 'Classe 2' },
    { label: 'Actif Circulant', value: m.actifCirculant, account: 'Classe 3/4' },
    { label: 'Passif Circulant', value: m.passifCirculant, account: 'Classe 4' },
    { label: 'Dettes Financières', value: m.dettesFinancieres, account: 'Classe 1' },
    { label: 'Valeur Ajoutée', value: m.valeurAjoutee, account: 'Compte de résultat' },
    { label: 'EBE', value: m.excédentBrutExploitation, account: 'Avant amortissements' },
    { label: 'Résultat Financier', value: m.resultatFinancier, account: 'Comptes 67/77' },
    { label: 'Résultat HAO', value: m.resultatExceptionnel, account: 'Comptes 81-88' },
    { label: 'Résultat Exploitation', value: m.resultatExploitation, account: 'Avant financier' },
  ];

  // ─── Ratios ───────────────────────────────────────────────────────────────
  const ratios = [
    { label: 'BFR', value: m.bfr, desc: 'Besoin en Fonds de Roulement' },
    { label: 'FDR', value: m.fdr, desc: 'Fonds de Roulement' },
    { label: 'Liquidité', value: m.ratioLiquidite, isRatio: true, desc: 'Actif circ. / Passif circ.', target: 1.5 },
    { label: 'Autonomie', value: m.ratioAutonomieFinanciere * 100, isPercent: true, desc: 'Capitaux propres / Total passif' },
    { label: 'ROE', value: m.roe, isPercent: true, desc: 'Rentabilité des fonds propres' },
    { label: 'ROA', value: m.roa, isPercent: true, desc: 'Rentabilité des actifs' },
  ];

  // ─── Forecast Colors ──────────────────────────────────────────────────────
  const forecastColor = (prob: number) => prob >= 75 ? '#10B981' : prob >= 55 ? '#F59E0B' : '#EF4444';

  return (
    <div className="space-y-5 pb-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: '#1E1060' }}>Tableau de bord financier</h2>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#9CA3AF' }}>
            Centre de pilotage ERP — Norme SYSCOHADA Révisé — Données temps réel
          </p>
        </div>
        <button onClick={loadMetrics} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors" style={{ color: '#6B7280' }}>
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {/* ── Score + Raccourcis ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Score santé */}
        <div className="lg:col-span-4 rounded-2xl p-5 flex items-center gap-4" style={{ background: '#fff', border: '1.5px solid #EDE9FE', boxShadow: '0 2px 12px rgba(107,78,255,0.07)' }}>
          <ScoreBadge score={m.scoreFinancier} />
        </div>

        {/* Raccourcis rapides */}
        <div className="lg:col-span-8 rounded-2xl p-4 flex flex-col justify-center" style={{ background: '#fff', border: '1.5px solid #EDE9FE' }}>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#9CA3AF' }}>Accès rapide</div>
          <div className="flex gap-2 flex-wrap">
            {quickActions.map(a => {
              const Icon = a.icon;
              return (
                <button key={a.label} onClick={() => onNavigate?.(a.to)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95"
                  style={{ background: a.bg, color: a.color, border: `1px solid ${a.bg}` }}>
                  <Icon className="w-3.5 h-3.5" />
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Résumé IA ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #6B4EFF 0%, #8B5CF6 50%, #A78BFA 100%)', boxShadow: '0 4px 20px rgba(107,78,255,0.3)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-white" />
          <span className="text-xs font-extrabold text-white uppercase tracking-widest">FinancePro AI — Résumé du jour</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { icon: m.tresorerieNetteTotal >= 0 ? '✅' : '🔴', label: `Trésorerie ${m.tresorerieNetteTotal >= 0 ? 'saine' : 'critique'} : ${fmtMoney(m.tresorerieNetteTotal, true)}` },
            { icon: m.facturesEchues > 0 ? '⚠️' : '✅', label: `${m.facturesEchues > 0 ? m.facturesEchues + ' factures échues — recouvrement urgent' : 'Aucune facture échue'}` },
            { icon: m.resultatNet >= 0 ? '📈' : '📉', label: `Résultat net : ${fmtMoney(m.resultatNet, true)} — Marge ${m.margeNette.toFixed(1)}%` },
            { icon: '🏦', label: `Liquidité : ${m.ratioLiquidite.toFixed(2)} (${m.ratioLiquidite >= 1.5 ? 'Confortable' : m.ratioLiquidite >= 1 ? 'Acceptable' : 'Insuffisante'})` },
            { icon: '🔮', label: `Prévision 30j : ${fmtMoney(m.previsions[0]?.tresoreriePrevisionnelle ?? 0, true)} (${m.previsions[0]?.probability ?? 0}% prob.)` },
            { icon: m.alertes.length > 0 ? '🔔' : '✅', label: `${m.alertes.length > 0 ? m.alertes.length + ' alerte(s) en cours — voir section alertes' : 'Aucune alerte critique'}` },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] text-white font-semibold opacity-95 bg-white/10 rounded-xl px-3 py-2">
              <span className="text-sm flex-shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 8 KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: '#fff', border: `1.5px solid ${kpi.border}`, borderLeft: `4px solid ${kpi.color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div className="flex items-start justify-between">
              <div className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>{kpi.label}</div>
              {kpi.trend !== undefined && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                  style={{ background: kpi.trend >= 0 ? '#DCFCE7' : '#FEE2E2', color: kpi.trend >= 0 ? '#15803D' : '#B91C1C' }}>
                  {kpi.trend >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {fmtPct(kpi.trend)}
                </span>
              )}
            </div>
            <div className="text-lg font-extrabold font-mono leading-tight" style={{ color: kpi.color }}>
              {kpi.isPercent ? `${kpi.value.toFixed(1)}%` : fmtMoney(kpi.value, true)}
            </div>
            <div className="text-[9px]" style={{ color: '#D1D5DB' }}>{kpi.sublabel}</div>
            {kpi.sparkData.length >= 2 && (
              <div className="opacity-70">
                <Sparkline values={kpi.sparkData} color={kpi.color} height={22} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Activité opérationnelle ─────────────────────────────────────────── */}
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-widest mb-2.5" style={{ color: '#9CA3AF' }}>
          Activité opérationnelle — Aujourd'hui
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {activityCards.map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-xl p-3 flex flex-col gap-1.5 text-center"
                style={{ background: '#fff', border: '1.5px solid #F3F4F6' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto" style={{ background: card.bg }}>
                  <Icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
                <div className="text-sm font-extrabold font-mono" style={{ color: '#1E1060' }}>{card.value}</div>
                <div className="text-[9px] font-semibold leading-tight" style={{ color: '#9CA3AF' }}>{card.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Alertes ────────────────────────────────────────────────────────── */}
      {m.alertes.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1.5px solid #EDE9FE' }}>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#1E1060' }}>
              Alertes & Notifications ({m.alertes.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {m.alertes.map((alert: DashboardAlert, i) => {
              const s = alertStyle(alert.severity);
              return (
                <div key={i} className="flex items-start gap-2.5 rounded-xl p-3"
                  style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: s.dot }} />
                  <div>
                    <div className="text-xs font-extrabold" style={{ color: s.color }}>{alert.label}</div>
                    <div className="text-[10px] mt-0.5 font-medium" style={{ color: s.color, opacity: 0.8 }}>{alert.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Graphiques ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1.5px solid #EDE9FE' }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4" style={{ color: '#6B4EFF' }} />
          <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#1E1060' }}>Graphiques financiers</h3>
          <div className="flex gap-1 ml-auto">
            {(['ca', 'flux', 'charges'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveGraphTab(tab)}
                className="text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all"
                style={activeGraphTab === tab ? { background: '#6B4EFF', color: '#fff' } : { background: '#F3F4F6', color: '#6B7280' }}>
                {tab === 'ca' ? 'CA 12 mois' : tab === 'flux' ? 'Flux Tréso.' : 'Charges'}
              </button>
            ))}
          </div>
        </div>

        {activeGraphTab === 'ca' && (
          <div>
            <div className="text-[10px] text-slate-400 mb-3">Évolution du Chiffre d'Affaires — 12 derniers mois</div>
            {m.caParMoisGraph.every(d => d.ca === 0) ? (
              <div className="text-xs italic text-center py-8 text-slate-400">Aucun CA enregistré sur cette période.</div>
            ) : (
              <BarChart data={m.caParMoisGraph.map(d => ({ label: d.month, value: d.ca }))} color="#6B4EFF" height={100} />
            )}
          </div>
        )}

        {activeGraphTab === 'flux' && (
          <div>
            <div className="flex gap-4 text-[10px] font-bold mb-3">
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded inline-block" style={{ background: '#10B981' }} />Encaissements</span>
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded inline-block" style={{ background: '#EF4444' }} />Décaissements</span>
            </div>
            {m.fluxTrésorerieGraph.every(f => f.encaissements === 0 && f.decaissements === 0) ? (
              <div className="text-xs italic text-center py-8 text-slate-400">Aucun flux de trésorerie enregistré.</div>
            ) : (
              <BarChart
                data={m.fluxTrésorerieGraph.map(f => ({ label: f.month, value: f.encaissements, value2: f.decaissements }))}
                color="#10B981" color2="#EF4444" height={100}
              />
            )}
          </div>
        )}

        {activeGraphTab === 'charges' && (
          <div>
            <div className="text-[10px] text-slate-400 mb-3">Charges mensuelles (Classe 6) — 6 derniers mois</div>
            {m.chargesParMoisGraph.every(d => d.charges === 0) ? (
              <div className="text-xs italic text-center py-8 text-slate-400">Aucune charge enregistrée sur cette période.</div>
            ) : (
              <BarChart data={m.chargesParMoisGraph.map(d => ({ label: d.month, value: d.charges }))} color="#EF4444" height={100} />
            )}
          </div>
        )}
      </div>

      {/* ── Ratios + Indicateurs OHADA ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ratios financiers */}
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1.5px solid #EDE9FE' }}>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4" style={{ color: '#6B4EFF' }} />
            <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#1E1060' }}>Ratios Financiers Clés</h3>
          </div>
          <div className="space-y-2.5">
            {ratios.map(r => {
              const positive = r.isRatio ? r.value >= 1 : r.value >= 0;
              return (
                <div key={r.label} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: '#F3F0FF' }}>
                  <div>
                    <div className="text-xs font-bold" style={{ color: '#374151' }}>{r.label}</div>
                    <div className="text-[9px]" style={{ color: '#9CA3AF' }}>{r.desc}</div>
                  </div>
                  <div className={`text-sm font-extrabold font-mono ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {r.isRatio ? r.value.toFixed(2) : r.isPercent ? `${r.value.toFixed(1)}%` : fmtMoney(r.value, true)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Indicateurs OHADA */}
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1.5px solid #EDE9FE' }}>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4" style={{ color: '#6B4EFF' }} />
            <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#1E1060' }}>Indicateurs OHADA — Bilan SYSCOHADA</h3>
          </div>
          <div className="space-y-2">
            {ohadaIndicators.map(ind => (
              <div key={ind.label} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: '#F3F0FF' }}>
                <div>
                  <div className="text-xs font-bold" style={{ color: '#374151' }}>{ind.label}</div>
                  <div className="text-[9px]" style={{ color: '#9CA3AF' }}>{ind.account}</div>
                </div>
                <div className={`text-xs font-extrabold font-mono ${ind.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {fmtMoney(ind.value, true)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Prévisions IA ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1.5px solid #EDE9FE' }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4" style={{ color: '#8B5CF6' }} />
          <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#1E1060' }}>Prévisions IA de Trésorerie</h3>
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">Basées sur la tendance réelle</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {m.previsions.map((prev: DashboardForecast) => {
            const c = forecastColor(prev.probability);
            const pos = prev.tresoreriePrevisionnelle >= 0;
            return (
              <div key={prev.horizon} className="rounded-xl p-3 text-center border"
                style={{ background: pos ? '#F0FDF4' : '#FFF1F2', borderColor: pos ? '#BBF7D0' : '#FECDD3' }}>
                <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>{prev.label}</div>
                <div className="text-sm font-extrabold font-mono" style={{ color: pos ? '#16A34A' : '#DC2626' }}>
                  {fmtMoney(prev.tresoreriePrevisionnelle, true)}
                </div>
                <div className="text-[9px] mt-1 font-semibold" style={{ color: c }}>
                  Probabilité {prev.probability}%
                </div>
                <div className="mt-1.5 h-1.5 rounded-full overflow-hidden bg-white/60">
                  <div className="h-full rounded-full" style={{ width: `${prev.probability}%`, background: c }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Top Performance ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Clients */}
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1.5px solid #EDE9FE' }}>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#1E1060' }}>Top Clients — Créances</h3>
          </div>
          {m.topClients.length === 0 ? (
            <div className="text-xs italic text-slate-400 py-4 text-center">Aucune créance enregistrée.</div>
          ) : (
            <div className="space-y-2">
              {m.topClients.map((c, i) => {
                const maxV = m.topClients[0].montant || 1;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-extrabold text-amber-700 flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate" style={{ color: '#374151' }}>{c.nom}</div>
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
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1.5px solid #EDE9FE' }}>
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#1E1060' }}>Top Fournisseurs — Dettes</h3>
          </div>
          {m.topFournisseurs.length === 0 ? (
            <div className="text-xs italic text-slate-400 py-4 text-center">Aucune dette fournisseur enregistrée.</div>
          ) : (
            <div className="space-y-2">
              {m.topFournisseurs.map((f, i) => {
                const maxV = m.topFournisseurs[0].montant || 1;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-[10px] font-extrabold text-rose-700 flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate" style={{ color: '#374151' }}>{f.nom}</div>
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

      {/* ── Activités Récentes ─────────────────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1.5px solid #EDE9FE' }}>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4" style={{ color: '#6B4EFF' }} />
          <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#1E1060' }}>Activités Récentes</h3>
          <div className="ml-auto flex gap-1">
            {(['ecritures', 'factures'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all"
                style={activeTab === tab ? { background: '#6B4EFF', color: '#fff' } : { background: '#F3F4F6', color: '#6B7280' }}>
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
                <thead className="uppercase font-semibold text-[10px]" style={{ color: '#9CA3AF' }}>
                  <tr>
                    <th className="p-2">N° Écriture</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Journal</th>
                    <th className="p-2">Libellé</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#F3F0FF' }}>
                  {m.ecrituresRecent.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2 font-mono font-bold" style={{ color: '#6B4EFF' }}>{entry.entryNumber}</td>
                      <td className="p-2 font-mono" style={{ color: '#6B7280' }}>{entry.date}</td>
                      <td className="p-2" style={{ color: '#374151' }}>{entry.journalType}</td>
                      <td className="p-2 truncate max-w-xs" style={{ color: '#374151' }}>{entry.wording}</td>
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
                <thead className="uppercase font-semibold text-[10px]" style={{ color: '#9CA3AF' }}>
                  <tr>
                    <th className="p-2">Numéro</th>
                    <th className="p-2">Client/Fourn.</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Montant TTC</th>
                    <th className="p-2">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#F3F0FF' }}>
                  {m.facturessRecent.map((inv: any) => {
                    const statusColor = inv.statut === 'PAYE' ? '#10B981' : inv.statut === 'VALIDE' ? '#3B82F6' : inv.statut === 'ANNULE' ? '#EF4444' : '#F59E0B';
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2 font-mono font-bold" style={{ color: '#6B4EFF' }}>{inv.numero}</td>
                        <td className="p-2 truncate max-w-xs" style={{ color: '#374151' }}>{inv.client}</td>
                        <td className="p-2 font-mono" style={{ color: '#6B7280' }}>{inv.date}</td>
                        <td className="p-2 font-extrabold font-mono" style={{ color: '#1E1060' }}>{fmtMoney(inv.montant, true)}</td>
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
    </div>
  );
};

export default DashboardModule;
