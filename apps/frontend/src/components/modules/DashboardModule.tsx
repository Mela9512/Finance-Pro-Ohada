import React, { useEffect, useState } from 'react';
import {
  Calculator, TrendingUp, TrendingDown, Users, FileText, Activity,
  AlertTriangle, Scale,
} from 'lucide-react';
import { DashboardMetrics, AnomalyReport } from '@financepro/shared';
import { api } from '../../services/api';

export const DashboardModule: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyReport | null>(null);

  useEffect(() => {
    api.getMetrics().then(setMetrics);
    api.aiGetAnomalies().then(setAnomalies).catch(() => {});
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
    },
    {
      label: "Chiffre d'Affaires Mensuel",
      sublabel: 'Compte 701',
      value: formatMoney(metrics.chiffreAffairesMois),
      icon: TrendingUp,
      color: '#10B981',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      trend: metrics.chiffreAffairesVariation,
    },
    {
      label: 'Créances Clients',
      sublabel: 'Compte 411 — Factures non soldées',
      value: formatMoney(metrics.creancesClientsTotal),
      icon: Users,
      color: '#F59E0B',
      bg: '#FFFBEB',
      border: '#FDE68A',
    },
    {
      label: 'Dettes Fournisseurs',
      sublabel: 'Compte 401 — Factures non soldées',
      value: formatMoney(metrics.dettesFournisseursTotal),
      icon: FileText,
      color: '#EF4444',
      bg: '#FEF2F2',
      border: '#FECACA',
    },
  ];

  const maxFlow = Math.max(1, ...metrics.fluxTrésorerieGraph.flatMap((f) => [f.encaissements, f.decaissements]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold" style={{ color: '#1E1060' }}>
          Tableau de bord financier
        </h2>
        <p className="text-xs font-medium mt-0.5" style={{ color: '#9CA3AF' }}>
          Vue d'ensemble basée sur vos écritures réelles — Norme SYSCOHADA Révisé
        </p>
      </div>

      {/* 4 KPI Cards (données réelles) */}
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
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: kpi.bg }}>
                  <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
                {kpi.trend !== undefined && (
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{
                      background: kpi.trend >= 0 ? '#DCFCE7' : '#FEE2E2',
                      color: kpi.trend >= 0 ? '#15803D' : '#B91C1C',
                    }}
                  >
                    {kpi.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {kpi.trend >= 0 ? '+' : ''}{kpi.trend.toFixed(1)}%
                  </span>
                )}
              </div>
              <div>
                <div className="text-2xl font-extrabold font-mono" style={{ color: '#1E1060' }}>{kpi.value}</div>
                <div className="text-xs font-bold mt-1" style={{ color: '#374151' }}>{kpi.label}</div>
                <div className="text-[10px] mt-0.5" style={{ color: '#9CA3AF' }}>{kpi.sublabel}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ratios réels BFR / FDR / EBE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Besoin en Fonds de Roulement (BFR)', value: metrics.bfr },
          { label: 'Fonds de Roulement (FDR)', value: metrics.fdr },
          { label: "Excédent Brut d'Exploitation (EBE)", value: metrics.excédentBrutExploitation },
        ].map((r) => (
          <div
            key={r.label}
            className="rounded-2xl p-4 flex items-center justify-between"
            style={{ background: '#ffffff', border: '1.5px solid #EDE9FE', boxShadow: '0 1px 6px rgba(107,78,255,0.05)' }}
          >
            <div>
              <div className="text-[10px] font-bold uppercase" style={{ color: '#9CA3AF' }}>{r.label}</div>
              <div className={`text-lg font-extrabold font-mono mt-1 ${r.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatMoney(r.value)}
              </div>
            </div>
            <Scale className="w-6 h-6" style={{ color: '#6B4EFF' }} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Flux de trésorerie réel sur 6 mois */}
        <div
          className="lg:col-span-7 rounded-2xl p-5"
          style={{ background: '#ffffff', border: '1.5px solid #EDE9FE', boxShadow: '0 2px 12px rgba(107,78,255,0.05)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: '#F3F0FF' }}>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2" style={{ color: '#1E1060' }}>
                <Activity className="w-4 h-4" style={{ color: '#6B4EFF' }} /> Flux de Trésorerie (6 derniers mois)
              </h3>
              <p className="text-[10px]" style={{ color: '#9CA3AF' }}>Encaissements vs décaissements réels</p>
            </div>
          </div>

          {metrics.fluxTrésorerieGraph.every((f) => f.encaissements === 0 && f.decaissements === 0) ? (
            <div className="text-xs italic py-8 text-center" style={{ color: '#9CA3AF' }}>
              Aucun mouvement de trésorerie enregistré sur cette période.
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.fluxTrésorerieGraph.map((f) => (
                <div key={f.month} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold w-8" style={{ color: '#6B7280' }}>{f.month}</span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#ECFDF5' }}>
                        <div className="h-full rounded-full" style={{ width: `${(f.encaissements / maxFlow) * 100}%`, background: '#10B981' }} />
                      </div>
                      <span className="text-[10px] font-mono w-20 text-right text-emerald-600">+{formatMoney(f.encaissements)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#FEF2F2' }}>
                        <div className="h-full rounded-full" style={{ width: `${(f.decaissements / maxFlow) * 100}%`, background: '#EF4444' }} />
                      </div>
                      <span className="text-[10px] font-mono w-20 text-right text-rose-600">-{formatMoney(f.decaissements)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Anomalies IA réelles */}
        <div
          className="lg:col-span-5 rounded-2xl p-5"
          style={{ background: '#ffffff', border: '1.5px solid #EDE9FE', boxShadow: '0 2px 12px rgba(107,78,255,0.05)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: '#F3F0FF' }}>
            <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2" style={{ color: '#1E1060' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: '#F59E0B' }} /> Points d'Attention (IA)
            </h3>
          </div>

          {!anomalies ? (
            <div className="text-xs italic" style={{ color: '#9CA3AF' }}>Analyse en cours...</div>
          ) : anomalies.anomalies.length === 0 ? (
            <div className="text-xs" style={{ color: '#10B981' }}>Aucune anomalie détectée actuellement.</div>
          ) : (
            <div className="space-y-2">
              {anomalies.anomalies.slice(0, 4).map((a, i) => (
                <div
                  key={i}
                  className="text-[11px] rounded-xl p-2.5"
                  style={{
                    background: a.severity === 'HIGH' ? '#FEF2F2' : '#FFFBEB',
                    color: a.severity === 'HIGH' ? '#B91C1C' : '#92400E',
                    border: `1px solid ${a.severity === 'HIGH' ? '#FECACA' : '#FDE68A'}`,
                  }}
                >
                  {a.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Écritures récentes réelles */}
      <div
        className="rounded-2xl p-5"
        style={{ background: '#ffffff', border: '1.5px solid #EDE9FE', boxShadow: '0 2px 12px rgba(107,78,255,0.05)' }}
      >
        <h3 className="text-xs font-extrabold uppercase tracking-wider mb-4" style={{ color: '#1E1060' }}>
          Dernières Écritures Comptables
        </h3>
        {metrics.ecrituresRecent.length === 0 ? (
          <div className="text-xs italic py-4 text-center" style={{ color: '#9CA3AF' }}>
            Aucune écriture enregistrée pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead style={{ color: '#9CA3AF' }} className="uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-2">N° Écriture</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Journal</th>
                  <th className="p-2">Libellé</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#F3F0FF' }}>
                {metrics.ecrituresRecent.map((entry) => (
                  <tr key={entry.id}>
                    <td className="p-2 font-mono font-bold" style={{ color: '#6B4EFF' }}>{entry.entryNumber}</td>
                    <td className="p-2 font-mono" style={{ color: '#6B7280' }}>{entry.date}</td>
                    <td className="p-2" style={{ color: '#374151' }}>{entry.journalType}</td>
                    <td className="p-2" style={{ color: '#374151' }}>{entry.wording}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardModule;
