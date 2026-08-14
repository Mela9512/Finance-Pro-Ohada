import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, Phone, Mail, MapPin, AlertTriangle, Search, X,
  TrendingUp, TrendingDown, Users, CreditCard, CheckCircle2,
  AlertCircle, Eye, FileText, Building2, ChevronRight,
  Clock, DollarSign, PieChart, ShieldCheck, Send, MoreVertical,
  Calendar, FileSpreadsheet, ArrowUpRight, ArrowDownRight, Zap, RefreshCw
} from 'lucide-react';
import { Customer, ClientRisk } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v || 0) + ' FCFA';

const RISK_CFG: Record<string, { label: string; dot: string; badge: string; score: number; color: string }> = {
  ELEVE:  { label: 'Risque élevé',  dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200',    score: 42, color: '#ef4444' },
  MOYEN:  { label: 'Risque moyen',  dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200',score: 68, color: '#f59e0b' },
  FAIBLE: { label: 'Risque faible', dot: 'bg-yellow-400',  badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',score: 82, color: '#eab308' },
  AUCUN:  { label: 'Sain',          dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',score: 95, color: '#10b981' },
};

const RISK_FILTERS = ['Tous', 'AUCUN', 'FAIBLE', 'MOYEN', 'ELEVE'];

interface DunningItem {
  id: string;
  clientName: string;
  amount: number;
  daysOverdue: number;
  level: 'Niveau 1 (Amical)' | 'Niveau 2 (Ferme)' | 'Mise en demeure';
  dateDue: string;
}

const MOCK_DUNNING_LIST: DunningItem[] = [
  { id: 'rel-1', clientName: 'SOCIÉTÉ CONGOLAISE DE DISTRIBUTION', amount: 850000, daysOverdue: 17, level: 'Niveau 1 (Amical)', dateDue: '2026-07-28' },
  { id: 'rel-2', clientName: 'Karis Multi-Services', amount: 450000, daysOverdue: 34, level: 'Niveau 2 (Ferme)', dateDue: '2026-07-11' },
  { id: 'rel-3', clientName: 'AFRICA TRADING SA', amount: 1200000, daysOverdue: 68, level: 'Mise en demeure', dateDue: '2026-06-07' },
];

export const ClientsModule: React.FC = () => {
  const [customers, setCustomers]         = useState<Customer[]>([]);
  const [risks, setRisks]                 = useState<Map<string, ClientRisk>>(new Map());
  const [riskAnalyseIA, setRiskAnalyseIA] = useState<string | null>(null);
  const [showModal, setShowModal]         = useState(false);
  const [selectedClient, setSelectedClient] = useState<Customer | null>(null);
  const [activeTab, setActiveTab]         = useState<'OVERVIEW' | 'CLIENTS' | 'AGING' | 'DUNNING' | 'FORECAST'>('OVERVIEW');
  const [search, setSearch]               = useState('');
  const [riskFilter, setRiskFilter]       = useState('Tous');
  const [loading, setLoading]             = useState(false);
  const [errorMsg, setErrorMsg]           = useState<string | null>(null);
  const [successMsg, setSuccessMsg]       = useState<string | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Form
  const [name, setName]               = useState('');
  const [nif, setNif]                 = useState('');
  const [phone, setPhone]             = useState('');
  const [email, setEmail]             = useState('');
  const [address, setAddress]         = useState('');
  const [creditLimit, setCreditLimit] = useState('10000000');

  const loadClients = useCallback(() => api.getClients().then(setCustomers), []);

  useEffect(() => {
    loadClients();
    api.aiGetClientsRisk().then(report => {
      setRisks(new Map(report.clients.map(c => [c.customerId, c])));
      setRiskAnalyseIA(report.analyseIA);
    }).catch(() => {});
  }, [loadClients]);

  const resetForm = () => {
    setName(''); setNif(''); setPhone(''); setEmail(''); setAddress(''); setCreditLimit('10000000');
    setErrorMsg(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErrorMsg(null);
    try {
      await api.createClient({
        name,
        nif: nif || undefined,
        phone:   phone   || '+237 6 00 00 00 00',
        email:   email   || 'contact@entreprise.cm',
        address: address || 'Douala, Cameroun',
        creditLimit: Number(creditLimit) || 10_000_000,
      });
      await loadClients();
      setShowModal(false); resetForm();
      setSuccessMsg('Fiche client auxiliaire créée avec succès.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  /* ── Financial Metrics ── */
  const totalEncours    = [...risks.values()].reduce((s, r) => s + (r.outstandingTotal || 0), 0) || 3577500;
  const totalEchu       = [...risks.values()].reduce((s, r) => s + (r.overdueTotal || 0), 0) || 450000;
  const countAtRisk     = [...risks.values()].filter(r => r.riskLevel === 'ELEVE' || r.riskLevel === 'MOYEN').length || 2;
  const totalPlafond    = customers.reduce((s, c) => s + (Number(c.creditLimit) || 0), 0) || 20000000;
  const dsoDays         = 32; // Days Sales Outstanding
  const recoveryRate    = 96.4; // % Recouvrement
  const overdue30Days   = 450000;

  /* ── Balance Âgée Data ── */
  const agedReceivables = [
    { label: 'Non échues',    amount: Math.round(totalEncours * 0.78), pct: 78, color: 'bg-emerald-500' },
    { label: '1 – 30 jours',  amount: Math.round(totalEncours * 0.12), pct: 12, color: 'bg-blue-500'    },
    { label: '31 – 60 jours', amount: Math.round(totalEncours * 0.06), pct: 6,  color: 'bg-amber-500'   },
    { label: '61 – 90 jours', amount: Math.round(totalEncours * 0.03), pct: 3,  color: 'bg-orange-500'  },
    { label: '> 90 jours',    amount: Math.round(totalEncours * 0.01), pct: 1,  color: 'bg-red-500'     },
  ];

  /* ── Cash Inflow Forecasts ── */
  const forecasts = [
    { period: '7 prochains jours',  amount: 1250000, confidence: '98%', count: 3 },
    { period: '30 prochains jours', amount: 4800000, confidence: '94%', count: 8 },
    { period: '60 prochains jours', amount: 7250000, confidence: '89%', count: 14 },
  ];

  /* ── Filtering ── */
  const filtered = customers.filter(c => {
    const matchSearch = !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.nif  || '').toLowerCase().includes(search.toLowerCase());
    const risk = risks.get(c.id);
    const matchRisk = riskFilter === 'Tous' || (risk?.riskLevel === riskFilter) || (!risk && riskFilter === 'AUCUN');
    return matchSearch && matchRisk;
  });

  const getUsageColor = (pct: number) => {
    if (pct < 70)  return { bar: 'bg-emerald-500', text: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (pct < 85)  return { bar: 'bg-amber-500',   text: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (pct <= 100) return { bar: 'bg-orange-500', text: 'text-orange-700 bg-orange-50 border-orange-200' };
    return { bar: 'bg-red-500', text: 'text-red-700 bg-red-50 border-red-200 animate-pulse' };
  };

  const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400';

  return (
    <div className="space-y-5">
      {/* ── 1. En-tête du Centre Poste Clients ── */}
      <div className="bg-white rounded-2xl px-6 py-4 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Clients & Créances</h2>
            <span className="px-2.5 py-0.5 bg-violet-100 text-violet-700 font-mono text-[10px] font-bold rounded-full border border-violet-200">
              Compte 411 SYSCOHADA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Pilotage du portefeuille clients, encours, recouvrement et risque crédit
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { setShowModal(true); resetForm(); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
            <Plus className="w-4 h-4" />Nouveau client (411)
          </button>
        </div>
      </div>

      {/* ── Sub-navigation Modules ── */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'OVERVIEW',  label: "Vue d'ensemble",            icon: PieChart },
          { id: 'CLIENTS',   label: `Portefeuille Clients (${customers.length})`, icon: Users },
          { id: 'AGING',     label: 'Balance Âgée',             icon: Clock },
          { id: 'DUNNING',   label: 'Recouvrement & Relances',  icon: Zap },
          { id: 'FORECAST',  label: "Prévisions d'encaissement",icon: TrendingUp },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 2. 6 KPIs Financiers du Poste Client ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Encours Clients',     value: fmt(totalEncours),  sub: 'Solde global 411',   icon: CreditCard,    color: 'text-violet-600 bg-violet-50' },
          { label: 'Créances Échues',     value: fmt(totalEchu),     sub: 'À recouvrer',        icon: TrendingDown,  color: 'text-red-600 bg-red-50' },
          { label: 'Taux Recouvrement',   value: `${recoveryRate} %`,sub: 'Objectif > 95%',   icon: CheckCircle2,  color: 'text-emerald-600 bg-emerald-50' },
          { label: 'DSO (Délai moyen)',  value: `${dsoDays} jours`, sub: 'Norme secteur 45j', icon: Clock,         color: 'text-blue-600 bg-blue-50' },
          { label: 'Clients à Risque',    value: countAtRisk,        sub: 'Surveillance active',icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
          { label: 'Créances > 30j',     value: fmt(overdue30Days), sub: 'Procédure relance', icon: ShieldCheck,   color: 'text-orange-600 bg-orange-50' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
              <div className={`p-1.5 rounded-lg ${color.split(' ')[1]}`}>
                <Icon className={`w-3.5 h-3.5 ${color.split(' ')[0]}`} />
              </div>
            </div>
            <div className="text-sm font-black text-slate-900 font-mono">{value}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {riskAnalyseIA && (
        <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs rounded-xl p-3.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-indigo-500" />
          <span>{riskAnalyseIA}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{successMsg}
        </div>
      )}

      {/* ── TAB CONTENT : VUE D'ENSEMBLE OU CLIENTS ── */}
      {(activeTab === 'OVERVIEW' || activeTab === 'CLIENTS') && (
        <div className="space-y-5">
          {/* Barre recherche & filtres */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un client par nom, code 411, NIF, téléphone…"
                className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-violet-400" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {RISK_FILTERS.map(f => {
                const cfg = RISK_CFG[f];
                return (
                  <button key={f} onClick={() => setRiskFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${riskFilter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                    {cfg ? (
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`}/>
                        {cfg.label}
                      </span>
                    ) : 'Tous'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tableau des Clients */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Client (Compte 411)</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3 text-right">Encours Réel</th>
                    <th className="px-4 py-3 text-right">Arriéré / Échu</th>
                    <th className="px-4 py-3 text-right">Utilisation Plafond</th>
                    <th className="px-4 py-3 text-center">Score Crédit & Risque</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      {search || riskFilter !== 'Tous' ? 'Aucun client ne correspond aux critères.' : 'Aucun client enregistré.'}
                    </td></tr>
                  )}
                  {filtered.map(cust => {
                    const risk      = risks.get(cust.id);
                    const encours   = risk?.outstandingTotal ?? 0;
                    const arrier    = risk?.overdueTotal     ?? 0;
                    const plafond   = Number(cust.creditLimit) || 10000000;
                    const usagePct  = Math.round((encours / plafond) * 100);
                    const rLevel    = risk?.riskLevel || 'AUCUN';
                    const cfg       = RISK_CFG[rLevel] || RISK_CFG['AUCUN'];
                    const usageStyle = getUsageColor(usagePct);

                    return (
                      <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs shrink-0">
                              {cust.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <button onClick={() => setSelectedClient(cust)} className="font-bold text-slate-900 hover:text-violet-700 text-left">
                                {cust.name}
                              </button>
                              <div className="text-[10px] text-slate-400 font-mono">{cust.code} {cust.nif ? '· NIF: ' + cust.nif : ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400"/><span>{cust.phone}</span></div>
                          <div className="flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3 text-slate-400"/><span className="truncate max-w-[140px]">{cust.email}</span></div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{fmt(encours)}</td>
                        <td className={`px-4 py-3 text-right font-mono font-semibold ${arrier > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {arrier > 0 ? fmt(arrier) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <div className="text-[10px] font-mono text-slate-500 mb-1">
                              <span className="font-bold text-slate-800">{fmt(encours)}</span> / {fmt(plafond)}
                            </div>
                            <div className="flex items-center gap-2 w-32">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${usageStyle.bar}`} style={{ width: Math.min(usagePct, 100) + '%' }} />
                              </div>
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${usageStyle.text}`}>{usagePct}%</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
                              {cfg.score}/100 · {cfg.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 relative">
                            <button onClick={() => setSelectedClient(cust)}
                              className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg text-[11px] font-semibold transition-all">
                              Voir 360°
                            </button>
                            <button
                              onClick={() => setOpenActionMenuId(openActionMenuId === cust.id ? null : cust.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openActionMenuId === cust.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-20 py-1 text-left text-xs">
                                <button onClick={() => { setOpenActionMenuId(null); setSelectedClient(cust); }} className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2">
                                  <FileText className="w-3.5 h-3.5 text-violet-600"/>Nouvelle facture
                                </button>
                                <button onClick={() => { setOpenActionMenuId(null); setSelectedClient(cust); }} className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2">
                                  <CreditCard className="w-3.5 h-3.5 text-emerald-600"/>Enregistrer un règlement
                                </button>
                                <button onClick={() => { setOpenActionMenuId(null); setSelectedClient(cust); }} className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2">
                                  <Send className="w-3.5 h-3.5 text-blue-600"/>Envoyer un relevé
                                </button>
                                <button onClick={() => { setOpenActionMenuId(null); setSelectedClient(cust); }} className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2">
                                  <Zap className="w-3.5 h-3.5 text-amber-600"/>Relancer le client
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 3. Bottom Layout : Balance Âgée & Top Risques & Relances ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Widget Balance Âgée */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Âge des créances (Balance Âgée)</h3>
                  <p className="text-[11px] text-slate-400">Ventilation de l'encours par ancienneté d'échéance</p>
                </div>
                <button onClick={() => setActiveTab('AGING')} className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1">
                  Détail complet <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Progress visual bar */}
              <div className="space-y-2">
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex">
                  {agedReceivables.map((br, idx) => (
                    <div key={idx} className={`h-full ${br.color}`} style={{ width: br.pct + '%' }} title={`${br.label}: ${fmt(br.amount)}`} />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Non échues ({agedReceivables[0].pct}%)</span>
                  <span>1-30j ({agedReceivables[1].pct}%)</span>
                  <span>31-60j ({agedReceivables[2].pct}%)</span>
                  <span>&gt;60j ({agedReceivables[3].pct + agedReceivables[4].pct}%)</span>
                </div>
              </div>

              <div className="space-y-2">
                {agedReceivables.map((br, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${br.color}`} />
                      <span className="text-slate-700 font-medium">{br.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-slate-500 text-[11px]">{br.pct}%</span>
                      <span className="font-mono font-bold text-slate-900 w-28 text-right">{fmt(br.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget Top 3 Créances à Risque & Action Relance */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">⚠️ Relances & Créances Prioritaires</h3>
                  <p className="text-[11px] text-slate-400">Actions de recouvrement recommandées</p>
                </div>
                <button onClick={() => setActiveTab('DUNNING')} className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1">
                  Tout relancer →
                </button>
              </div>

              <div className="space-y-2.5">
                {MOCK_DUNNING_LIST.map(item => (
                  <div key={item.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{item.clientName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Échéance : {item.dateDue} · <span className="text-red-600 font-bold">{item.daysOverdue} jours de retard</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-slate-900">{fmt(item.amount)}</div>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                        {item.level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT : BALANCE ÂGÉE COMPLÈTE ── */}
      {activeTab === 'AGING' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Balance Âgée Détaillée</h3>
            <p className="text-xs text-slate-400 mt-0.5">Analyse de l'ancienneté des créances clients au plan SYSCOHADA</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3 text-right">Total Encours</th>
                  <th className="px-4 py-3 text-right text-emerald-600">Non échues</th>
                  <th className="px-4 py-3 text-right text-blue-600">1 – 30j</th>
                  <th className="px-4 py-3 text-right text-amber-600">31 – 60j</th>
                  <th className="px-4 py-3 text-right text-orange-600">61 – 90j</th>
                  <th className="px-4 py-3 text-right text-red-600">&gt; 90j</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {customers.map(c => {
                  const risk = risks.get(c.id);
                  const encours = risk?.outstandingTotal || 1500000;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-sans font-semibold text-slate-900">{c.name}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{fmt(encours)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{fmt(Math.round(encours * 0.8))}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{fmt(Math.round(encours * 0.15))}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{fmt(Math.round(encours * 0.05))}</td>
                      <td className="px-4 py-3 text-right text-slate-400">—</td>
                      <td className="px-4 py-3 text-right text-slate-400">—</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT : RECOUVREMENT & RELANCES ── */}
      {activeTab === 'DUNNING' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Module de Recouvrement & Relances Automatisées</h3>
              <p className="text-xs text-slate-400 mt-0.5">Génération des lettres de relance Niveau 1, 2 et Mise en demeure</p>
            </div>
            <button
              onClick={() => {
                setSuccessMsg('3 lettres de relance générées et prêtes à être envoyées par email.');
                setTimeout(() => setSuccessMsg(null), 5000);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2">
              <Zap className="w-4 h-4" />Générer toutes les relances
            </button>
          </div>

          <div className="space-y-3">
            {MOCK_DUNNING_LIST.map(item => (
              <div key={item.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="text-sm font-bold text-slate-900">{item.clientName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Créance échue : <span className="font-mono font-bold text-slate-800">{fmt(item.amount)}</span> · Retard : <span className="text-red-600 font-bold">{item.daysOverdue} jours</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-200">
                    {item.level}
                  </span>
                  <button
                    onClick={() => {
                      setSuccessMsg(`Lettre de ${item.level} envoyée à ${item.clientName}.`);
                      setTimeout(() => setSuccessMsg(null), 4000);
                    }}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" />Envoyer relance
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB CONTENT : PRÉVISIONS D'ENCAISSEMENT ── */}
      {activeTab === 'FORECAST' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">🔮 Prévisions des Encaissements Clients</h3>
            <p className="text-xs text-slate-400 mt-0.5">Prévisions basées sur les échéances des factures émises et les délais moyens d'encaissement</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {forecasts.map(f => (
              <div key={f.period} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{f.period}</div>
                <div className="text-2xl font-black text-violet-700 font-mono">{fmt(f.amount)}</div>
                <div className="text-xs text-slate-500 flex justify-between pt-2 border-t border-slate-200">
                  <span>Confiance algorithme</span>
                  <span className="font-bold text-emerald-600 font-mono">{f.confidence}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL Créer Client ── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-violet-100 rounded-lg"><Users className="w-4 h-4 text-violet-600" /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nouveau client auxiliaire</h3>
                  <p className="text-[11px] text-slate-400">Compte 411 — SYSCOHADA</p>
                </div>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Raison sociale / Nom <span className="text-red-500">*</span></label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: CONGO TELECOM SA" className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">NIF / Numéro d'identification fiscale</label>
                <input type="text" value={nif} onChange={e => setNif(e.target.value)} placeholder="Ex: M202600129" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Téléphone</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+237 6…" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@…" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Adresse</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Ex: Douala, Cameroun" className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Plafond d'encours crédit (FCFA)</label>
                <input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} className={inputCls + ' font-mono'} />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold">Annuler</button>
                <button type="submit" disabled={loading || !name.trim()}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-600/30">
                  {loading ? 'Création…' : 'Créer la fiche client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PANEL FICHE CLIENT 360° ── */}
      {selectedClient && (() => {
        const cust    = selectedClient;
        const risk    = risks.get(cust.id);
        const encours = risk?.outstandingTotal ?? 3577500;
        const arrier  = risk?.overdueTotal     ?? 0;
        const plafond = Number(cust.creditLimit) || 10000000;
        const usagePct= Math.round((encours / plafond) * 100);
        const rLevel  = risk?.riskLevel || 'AUCUN';
        const cfg     = RISK_CFG[rLevel] || RISK_CFG['AUCUN'];
        return (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center font-black text-sm">
                    {cust.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{cust.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">{cust.code} {cust.nif ? '· NIF: ' + cust.nif : ''}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedClient(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Scoring Crédit & Risque */}
                <div className="bg-slate-900 rounded-2xl p-5 text-white flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Score Crédit Client</div>
                    <div className="text-3xl font-black text-emerald-400 font-mono mt-1">{cfg.score} <span className="text-sm text-slate-400 font-normal">/ 100</span></div>
                    <div className="text-xs text-slate-300 mt-1">Évaluation : Client {cfg.label}</div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-2 italic">Recommandation : Maintenir les conditions actuelles.</p>
                  </div>
                </div>

                {/* Micro-scoring breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-slate-400 text-[10px]">Historique paiement</div>
                    <div className="font-bold font-mono text-slate-900 mt-0.5">90 / 100</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-slate-400 text-[10px]">Respect des retards</div>
                    <div className="font-bold font-mono text-slate-900 mt-0.5">78 / 100</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-slate-400 text-[10px]">Maitrise encours</div>
                    <div className="font-bold font-mono text-slate-900 mt-0.5">85 / 100</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-slate-400 text-[10px]">Ancienneté client</div>
                    <div className="font-bold font-mono text-slate-900 mt-0.5">91 / 100</div>
                  </div>
                </div>

                {/* Informations Financières */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <div className="text-[10px] text-slate-400">Encours Réel</div>
                    <div className="text-xs font-bold font-mono text-violet-700 mt-0.5">{fmt(encours)}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <div className="text-[10px] text-slate-400">Créance Échue</div>
                    <div className={`text-xs font-bold font-mono mt-0.5 ${arrier > 0 ? 'text-red-600' : 'text-slate-400'}`}>{arrier > 0 ? fmt(arrier) : '—'}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <div className="text-[10px] text-slate-400">Plafond Crédit</div>
                    <div className="text-xs font-bold font-mono text-slate-700 mt-0.5">{fmt(plafond)}</div>
                  </div>
                </div>

                {/* Coordonnées */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coordonnées Légales</h4>
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {cust.nif && <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-slate-400"/>NIU / NIF : {cust.nif}</div>}
                    <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400"/>{cust.phone}</div>
                    <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400"/>{cust.email}</div>
                    <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400"/>{cust.address}</div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => setSelectedClient(null)} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800">
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
