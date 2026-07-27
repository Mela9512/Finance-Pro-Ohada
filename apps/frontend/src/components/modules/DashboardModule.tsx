import React, { useEffect, useState } from 'react';
import {
  Calculator, Network, RefreshCw, FileText, TrendingUp,
  Users, ArrowRight, BarChart3, PieChart, AlertCircle
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
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-[#6B4EFF] border-t-transparent animate-spin" />
          <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Chargement des métriques OHADA...</span>
        </div>
      </div>
    );
  }

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  const kpis = [
    {
      label: 'Trésorerie Nette',
      sublabel: 'Comptes 521/541',
      value: formatMoney(metrics.tresorerieNetteTotal),
      icon: Calculator,
      color: '#6B4EFF',
      bg: '#F3F0FF',
      border: '#DDD6FE',
      trend: '+5.2%',
      trendUp: true,
    },
    {
      label: 'Chiffre d\'Affaires Mensuel',
      sublabel: 'Compte 701',
      value: formatMoney(metrics.chiffreAffairesMois),
      icon: TrendingUp,
      color: '#10B981',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      trend: '+12.4%',
      trendUp: true,
    },
    {
      label: 'Créances Clients',
      sublabel: 'Compte 411 — À recouvrer',
      value: formatMoney(metrics.creancesClientsTotal),
      icon: Users,
      color: '#F59E0B',
      bg: '#FFFBEB',
      border: '#FDE68A',
      trend: '-2.1%',
      trendUp: false,
    },
    {
      label: 'Dettes Fournisseurs',
      sublabel: 'Compte 401 — À régler',
      value: formatMoney(metrics.dettesFournisseursTotal),
      icon: FileText,
      color: '#EF4444',
      bg: '#FEF2F2',
      border: '#FECACA',
      trend: '+1.3%',
      trendUp: false,
    },
  ];

  return (
    <div className="space-y-6">

      {/* En-tête page */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: '#1E1060' }}>
            Tableau de bord financier
          </h2>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#9CA3AF' }}>
            Vue d'ensemble et contrôle budgétaire — Norme SYSCOHADA Révisé
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: '#F3F0FF', color: '#6B4EFF', border: '1.5px solid #DDD6FE' }}
          >
            Période : 01.01.2026 — 31.12.2026
          </span>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{
                background: '#ffffff',
                border: `1.5px solid ${kpi.border}`,
                boxShadow: '0 2px 12px rgba(107,78,255,0.06)',
                borderLeft: `4px solid ${kpi.color}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: kpi.bg }}
                >
                  <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: kpi.trendUp ? '#DCFCE7' : '#FEE2E2',
                    color: kpi.trendUp ? '#15803D' : '#B91C1C',
                  }}
                >
                  {kpi.trend}
                </span>
              </div>
              <div>
                <div className="text-2xl font-extrabold font-mono" style={{ color: '#1E1060' }}>
                  {kpi.value}
                </div>
                <div className="text-xs font-bold mt-1" style={{ color: '#374151' }}>
                  {kpi.label}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>
                  {kpi.sublabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barre de conformité */}
      <div
        className="rounded-2xl p-4"
        style={{ background: '#ffffff', border: '1.5px solid #EDE9FE', boxShadow: '0 1px 6px rgba(107,78,255,0.05)' }}
      >
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span style={{ color: '#1E1060' }}>CONFORMITÉ SYSCOHADA — Exercice 2026</span>
          <span style={{ color: '#6B4EFF' }}>62% — En bonne voie</span>
        </div>
        <div className="w-full rounded-full h-2.5 overflow-hidden" style={{ background: '#F3F0FF' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: '62%', background: 'linear-gradient(90deg, #6B4EFF, #8B72FF)' }}
          />
        </div>
      </div>

      {/* Grille centrale 3 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Colonne gauche : Collaborateurs & Flux */}
        <div
          className="lg:col-span-5 rounded-2xl p-5"
          style={{ background: '#ffffff', border: '1.5px solid #EDE9FE', boxShadow: '0 2px 12px rgba(107,78,255,0.05)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: '#F3F0FF' }}>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#1E1060' }}>
                PARAMÈTRES DE FLUX
              </h3>
              <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Écritures & collaborateurs actifs</p>
            </div>
            <div className="text-[10px] text-right font-mono" style={{ color: '#6B7280' }}>
              <div>Montant : 99 000 XAF</div>
              <div>Taux : 33%</div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { code: 'E1', name: 'Alain KOUASSI', role: 'Comptable', docs: 15, amount: '120 000 XAF', color: '#6B4EFF', bg: '#F3F0FF' },
              { code: 'E2', name: 'Fatou DIOP', role: 'Gestionnaire', docs: 12, amount: '95 000 XAF', color: '#10B981', bg: '#ECFDF5' },
              { code: 'E3', name: 'Marc KOFFI', role: 'Auditeur', docs: 8, amount: '80 000 XAF', color: '#F59E0B', bg: '#FFFBEB' },
            ].map((e) => (
              <div
                key={e.code}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: '#F8F7FF', border: '1px solid #EDE9FE' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold"
                    style={{ background: e.bg, color: e.color }}
                  >
                    {e.code}
                  </div>
                  <div>
                    <div className="text-xs font-bold" style={{ color: '#1E1060' }}>{e.name}</div>
                    <div className="text-[10px]" style={{ color: '#9CA3AF' }}>{e.docs} documents traités</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-extrabold font-mono" style={{ color: e.color }}>{e.amount}</div>
                  <div className="text-[10px]" style={{ color: '#9CA3AF' }}>{e.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne centre : Efficacité & Ratios */}
        <div
          className="lg:col-span-4 rounded-2xl p-5 flex flex-col"
          style={{ background: '#ffffff', border: '1.5px solid #EDE9FE', boxShadow: '0 2px 12px rgba(107,78,255,0.05)' }}
        >
          <div className="pb-3 border-b mb-4" style={{ borderColor: '#F3F0FF' }}>
            <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#1E1060' }}>
              EFFICACITÉ GLOBALE
            </h3>
            <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Ratios financiers OHADA</p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2 flex-1">
            {[
              { label: 'Ratio BFR/FDR', value: '97,7%', sub: 'Efficacité', color: '#6B4EFF' },
              { label: 'EBE Brut', value: '6,88M', sub: 'Montant Brut', color: '#10B981' },
            ].map((m) => (
              <div key={m.label} className="flex flex-col items-center justify-center gap-2">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    border: `8px solid ${m.color}`,
                    borderTopColor: m.color === '#6B4EFF' ? '#10B981' : '#6B4EFF',
                  }}
                >
                  <div className="text-center">
                    <div className="text-base font-extrabold" style={{ color: '#1E1060' }}>{m.value}</div>
                    <div className="text-[9px]" style={{ color: '#9CA3AF' }}>{m.label}</div>
                  </div>
                </div>
                <div className="text-xs font-bold" style={{ color: '#374151' }}>{m.sub}</div>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl p-2.5 text-center text-[10px] font-medium mt-2"
            style={{ background: '#F3F0FF', color: '#5B21B6' }}
          >
            Tous les ratios de solvabilité sont conformes aux exigences OHADA.
          </div>
        </div>

        {/* Colonne droite : Indicateurs généraux */}
        <div
          className="lg:col-span-3 rounded-2xl p-5"
          style={{ background: '#ffffff', border: '1.5px solid #EDE9FE', boxShadow: '0 2px 12px rgba(107,78,255,0.05)' }}
        >
          <div className="pb-3 border-b mb-4" style={{ borderColor: '#F3F0FF' }}>
            <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ color: '#1E1060' }}>
              INDICATEURS GÉNÉRAUX
            </h3>
            <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Coûts & scores journaliers</p>
          </div>

          <div className="space-y-2.5">
            {[
              { label: 'Coût journalier', value: '28 000 XAF', sub: 'par jour', color: '#6B4EFF', bg: '#F3F0FF' },
              { label: 'Coût mensuel', value: '555 000 XAF', sub: 'par mois', color: '#10B981', bg: '#ECFDF5' },
              { label: 'Score Qualité', value: '94,6 / 100', sub: '', color: '#10B981', bg: '#ECFDF5' },
              { label: 'Score Audit', value: '48 / 100', sub: '', color: '#F59E0B', bg: '#FFFBEB' },
            ].map((ind) => (
              <div
                key={ind.label}
                className="flex items-center justify-between p-2.5 rounded-xl"
                style={{ background: '#F8F7FF', border: '1px solid #EDE9FE' }}
              >
                <span className="text-[10px] font-semibold" style={{ color: '#6B7280' }}>{ind.label}</span>
                <span
                  className="text-xs font-extrabold px-2 py-0.5 rounded-full"
                  style={{ background: ind.bg, color: ind.color }}
                >
                  {ind.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section basse */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Collaborateurs — Classement */}
        <div className="lg:col-span-8 space-y-6">
          <div
            className="rounded-2xl p-5"
            style={{ background: '#ffffff', border: '1.5px solid #EDE9FE', boxShadow: '0 1px 8px rgba(107,78,255,0.05)' }}
          >
            <h3 className="text-xs font-extrabold uppercase tracking-wider mb-3" style={{ color: '#1E1060' }}>
              COLLABORATEURS — CLASSEMENT & FLUX
            </h3>
            <div className="grid grid-cols-3 gap-4 text-xs font-mono">
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase" style={{ color: '#9CA3AF' }}>Classement</div>
                <div style={{ color: '#374151' }}>1. Alain KOUASSI (8.8)</div>
                <div style={{ color: '#374151' }}>2. Fatou DIOP (7.8)</div>
                <div style={{ color: '#374151' }}>3. Marc KOFFI (5.0)</div>
              </div>
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase" style={{ color: '#9CA3AF' }}>Flux maximal</div>
                <div style={{ color: '#6B4EFF', fontWeight: 700 }}>41 validés : 4 999</div>
                <div style={{ color: '#6B4EFF', fontWeight: 700 }}>32 validés : 5 556</div>
                <div style={{ color: '#6B4EFF', fontWeight: 700 }}>20 validés : 3 589</div>
              </div>
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase" style={{ color: '#9CA3AF' }}>Flux minimal</div>
                <div style={{ color: '#6B7280' }}>20 validés : 4 999</div>
                <div style={{ color: '#6B7280' }}>15 validés : 5 556</div>
                <div style={{ color: '#6B7280' }}>10 validés : 3 589</div>
              </div>
            </div>
          </div>

          {/* Indicateurs d'efficacité */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider mb-3" style={{ color: '#1E1060' }}>
              INDICATEURS D'EFFICACITÉ
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {[
                { icon: Calculator, label: 'En opération', value: '11', color: '#6B4EFF' },
                { icon: FileText, label: 'En déchargement', value: '3', color: '#EF4444' },
                { icon: Network, label: 'En attente', value: '1', color: '#10B981' },
                { icon: BarChart3, label: 'En maintenance', value: '0', color: '#F59E0B' },
                { icon: Users, label: 'En transit', value: '7', color: '#8B72FF' },
              ].map((ind) => {
                const Icon = ind.icon;
                return (
                  <div
                    key={ind.label}
                    className="rounded-2xl p-3 text-center"
                    style={{ background: '#ffffff', border: '1.5px solid #EDE9FE', boxShadow: '0 1px 6px rgba(107,78,255,0.05)' }}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: ind.color }} />
                    <div className="text-base font-extrabold" style={{ color: '#1E1060' }}>{ind.value}</div>
                    <div className="text-[9px] leading-tight mt-0.5" style={{ color: '#9CA3AF' }}>{ind.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Comptes & Règlements */}
        <div
          className="lg:col-span-4 rounded-2xl p-6"
          style={{ background: '#ffffff', border: '1.5px solid #EDE9FE', boxShadow: '0 2px 12px rgba(107,78,255,0.07)' }}
        >
          <div className="border-b pb-3 mb-4" style={{ borderColor: '#F3F0FF' }}>
            <h3 className="text-base font-extrabold" style={{ color: '#1E1060' }}>Comptes & Règlements</h3>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Synthèse des comptes auxiliaires</p>
          </div>

          <div className="space-y-2 font-mono text-xs mb-4">
            <div
              className="flex justify-between items-center p-2.5 rounded-xl"
              style={{ background: '#F8F7FF', border: '1px solid #EDE9FE' }}
            >
              <span className="font-bold" style={{ color: '#374151' }}>99 Comptes</span>
              <span className="font-extrabold" style={{ color: '#EF4444' }}>9 999 999 XAF</span>
            </div>
            <div
              className="flex justify-between items-center p-2.5 rounded-xl"
              style={{ background: '#F8F7FF', border: '1px solid #EDE9FE' }}
            >
              <span className="font-bold" style={{ color: '#374151' }}>VENTES 88 Comptes</span>
              <span className="font-extrabold" style={{ color: '#6B4EFF' }}>8 888 888 XAF</span>
            </div>
          </div>

          <button
            className="w-full py-3 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 transition-all"
            style={{ background: 'linear-gradient(90deg, #6B4EFF, #8B72FF)', boxShadow: '0 4px 14px rgba(107,78,255,0.3)' }}
          >
            <span>Effectuer un règlement</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default DashboardModule;
