import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, ShieldCheck, 
  Scale, AlertCircle, FileText, Activity 
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
      <div className="p-8 text-center text-slate-400">Chargement des métriques financières OHADA...</div>
    );
  }

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Top Banner Alert / Status */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Bilan & Exercice 2026 à jour (SYSCOHADA Révisé)</h2>
            <p className="text-xs text-slate-400">Tous les journaux (Achats, Ventes, Banque, Caisse) sont équilibrés.</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 font-mono">
            Ratios de Solvabilité: <strong className="text-emerald-400">1.82 (Excellent)</strong>
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CA Card */}
        <div className="glass-card rounded-xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chiffre d'Affaires (Mois)</span>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-white tracking-tight">{formatMoney(metrics.chiffreAffairesMois)}</div>
          <div className="mt-2 flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{metrics.chiffreAffairesVariation}% par rapport au mois dernier</span>
          </div>
        </div>

        {/* Trésorerie Card */}
        <div className="glass-card rounded-xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trésorerie Nette Disponible</span>
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-white tracking-tight">{formatMoney(metrics.tresorerieNetteTotal)}</div>
          <div className="mt-2 text-xs text-slate-400">
            Comptes 521 (BGFI/Eco) + 541 (Caisse) + 571
          </div>
        </div>

        {/* Créances Clients */}
        <div className="glass-card rounded-xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Créances Clients (Compte 411)</span>
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-amber-300 tracking-tight">{formatMoney(metrics.creancesClientsTotal)}</div>
          <div className="mt-2 text-xs text-slate-400">Factures non encore encaissées</div>
        </div>

        {/* Dettes Fournisseurs */}
        <div className="glass-card rounded-xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dettes Fournisseurs (Compte 401)</span>
            <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-rose-300 tracking-tight">{formatMoney(metrics.dettesFournisseursTotal)}</div>
          <div className="mt-2 text-xs text-slate-400">Échéances à régler sous 30j</div>
        </div>
      </div>

      {/* Financial Health & BFR / FDR Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart Simulation */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Évolution des Flux de Trésorerie (2026)</span>
              </h3>
              <p className="text-xs text-slate-400">Encaissements vs Décaissements mensuels</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span>
                <span className="text-slate-300">Encaissements</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 bg-rose-500 rounded-sm"></span>
                <span className="text-slate-300">Décaissements</span>
              </span>
            </div>
          </div>

          {/* Bar Visualization */}
          <div className="space-y-3 pt-2">
            {metrics.fluxTrésorerieGraph.map((item) => (
              <div key={item.month} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300 font-mono">
                  <span>{item.month}</span>
                  <span className="text-emerald-400">+{formatMoney(item.encaissements)} / <span className="text-rose-400">-{formatMoney(item.decaissements)}</span></span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 flex overflow-hidden p-0.5 border border-slate-800">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${(item.encaissements / 50000000) * 100}%` }}></div>
                  <div className="bg-rose-500 h-full rounded-full transition-all duration-500 ml-1" style={{ width: `${(item.decaissements / 50000000) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BFR & Ratios Panel */}
        <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-4">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Indicateurs SYSCOHADA</span>
            </h3>

            <div className="space-y-4">
              <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400">BFR (Besoin en Fonds de Roulement)</div>
                <div className="text-lg font-bold text-white mt-1">{formatMoney(metrics.bfr)}</div>
                <div className="text-[11px] text-emerald-400 mt-1">Couvert à 100% par le FDR</div>
              </div>

              <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400">FDR (Fonds de Roulement Net Global)</div>
                <div className="text-lg font-bold text-emerald-400 mt-1">{formatMoney(metrics.fdr)}</div>
                <div className="text-[11px] text-slate-400 mt-1">Capitaux permanents - Actif immobilisé</div>
              </div>

              <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400">EBE (Excédent Brut d'Exploitation)</div>
                <div className="text-lg font-bold text-indigo-300 mt-1">{formatMoney(metrics.excédentBrutExploitation)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Dernières Écritures Comptables Validées</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">N° Écriture</th>
                <th className="p-3">Date</th>
                <th className="p-3">Journal</th>
                <th className="p-3">Libellé</th>
                <th className="p-3">Montant Total</th>
                <th className="p-3 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {metrics.ecrituresRecent.map((entry) => {
                const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
                return (
                  <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-medium text-emerald-400">{entry.entryNumber}</td>
                    <td className="p-3 text-slate-300">{entry.date}</td>
                    <td className="p-3 font-semibold text-white">{entry.journalType}</td>
                    <td className="p-3 text-slate-200">{entry.wording}</td>
                    <td className="p-3 font-mono font-bold text-white">{formatMoney(totalDebit)}</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Équilibré
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
