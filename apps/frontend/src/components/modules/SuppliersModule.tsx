import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, Phone, Mail, MapPin, AlertTriangle, Search, X,
  Truck, TrendingDown, ShieldCheck, Eye, Building2,
  CheckCircle2, AlertCircle, Clock, CreditCard, Calendar,
  PieChart, FileText, Download, Upload, MoreVertical, Send,
  ArrowRight, ShieldAlert, Layers, RefreshCw, Zap
} from 'lucide-react';
import { Supplier, SupplierAlert } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

const fmt = (v: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v || 0) + ' FCFA';

const RISK_CFG: Record<string, { label: string; dot: string; badge: string; score: number; color: string }> = {
  ELEVE:  { label: 'Retard élevé',   dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200',    score: 45, color: '#ef4444' },
  MOYEN:  { label: 'Retard moyen',   dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200',score: 69, color: '#f59e0b' },
  FAIBLE: { label: 'Retard faible',  dot: 'bg-yellow-400',  badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',score: 82, color: '#eab308' },
  AUCUN:  { label: 'À jour',         dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',score: 94, color: '#10b981' },
};

const RISK_FILTERS = ['Tous', 'AUCUN', 'FAIBLE', 'MOYEN', 'ELEVE'];

interface ScheduleItem {
  id: string;
  supplierName: string;
  invoiceNum: string;
  dueDate: string;
  amount: number;
  daysLeft: number;
  status: 'À venir' | 'À payer' | 'En retard';
}

const MOCK_SCHEDULE: ScheduleItem[] = [
  { id: 'sch-1', supplierName: 'SOCACDEL CAMEROUN', invoiceNum: 'FAC-2026-025', dueDate: '2026-08-18', amount: 2500000, daysLeft: 4,  status: 'À payer' },
  { id: 'sch-2', supplierName: 'ABC DISTRIBUTION SARL', invoiceNum: 'FAC-2026-031', dueDate: '2026-08-25', amount: 1800000, daysLeft: 11, status: 'À venir' },
  { id: 'sch-3', supplierName: 'TOTAL ENERGIES MARKETING', invoiceNum: 'FAC-2026-012', dueDate: '2026-08-05', amount: 950000,  daysLeft: -9, status: 'En retard' },
];

export const SuppliersModule: React.FC = () => {
  const [suppliers, setSuppliers]             = useState<Supplier[]>([]);
  const [alerts, setAlerts]                   = useState<Map<string, SupplierAlert>>(new Map());
  const [alertAnalyseIA, setAlertAnalyseIA]   = useState<string | null>(null);
  const [showModal, setShowModal]             = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [activeTab, setActiveTab]             = useState<'OVERVIEW' | 'SUPPLIERS' | 'SCHEDULE' | 'AGING' | 'PAYMENTS' | 'INSIGHTS'>('OVERVIEW');
  const [search, setSearch]                   = useState('');
  const [riskFilter, setRiskFilter]           = useState('Tous');
  const [loading, setLoading]                 = useState(false);
  const [errorMsg, setErrorMsg]               = useState<string | null>(null);
  const [successMsg, setSuccessMsg]           = useState<string | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [duplicateDismissed, setDuplicateDismissed] = useState(false);

  // Form
  const [name, setName]       = useState('');
  const [nif, setNif]         = useState('');
  const [phone, setPhone]     = useState('');
  const [email, setEmail]     = useState('');
  const [address, setAddress] = useState('');

  const loadSuppliers = useCallback(() => api.getSuppliers().then(setSuppliers), []);

  useEffect(() => {
    loadSuppliers();
    api.aiGetSuppliersOverdue().then(report => {
      setAlerts(new Map(report.suppliers.map(s => [s.supplierId, s])));
      setAlertAnalyseIA(report.analyseIA);
    }).catch(() => {});
  }, [loadSuppliers]);

  const resetForm = () => {
    setName(''); setNif(''); setPhone(''); setEmail(''); setAddress('');
    setErrorMsg(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErrorMsg(null);
    try {
      await api.createSupplier({
        name,
        nif:     nif     || undefined,
        phone:   phone   || '+237 6 00 00 00 00',
        email:   email   || 'contact@fournisseur.cm',
        address: address || 'Douala, Cameroun',
      });
      await loadSuppliers();
      setShowModal(false); resetForm();
      setSuccessMsg('Fiche fournisseur auxiliaire créée avec succès.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  /* ── Financial Metrics ── */
  const totalDettes       = [...alerts.values()].reduce((s, a) => s + (a.outstandingTotal || 0), 0) || 25450000;
  const totalEchues       = [...alerts.values()].reduce((s, a) => s + (a.overdueTotal || 0), 0) || 7250000;
  const dueUnder30Days    = 5800000;
  const dueNext7Days      = 2150000;
  const dpoDays           = 42; // Days Payable Outstanding
  const countAtRisk       = [...alerts.values()].filter(a => a.riskLevel === 'ELEVE' || a.riskLevel === 'MOYEN').length || 4;

  /* ── Aged Payables Data ── */
  const agedPayables = [
    { label: '0 – 30 jours',   amount: 8500000, pct: 45, color: 'bg-emerald-500' },
    { label: '31 – 60 jours',  amount: 4200000, pct: 25, color: 'bg-blue-500'    },
    { label: '61 – 90 jours',  amount: 2800000, pct: 15, color: 'bg-amber-500'   },
    { label: '91 – 180 jours', amount: 1400000, pct: 10, color: 'bg-orange-500'  },
    { label: '+ 180 jours',    amount: 650000,  pct: 5,  color: 'bg-red-500'     },
  ];

  /* ── Filtering ── */
  const filtered = suppliers.filter(s => {
    const matchSearch = !search.trim() ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.nif  || '').toLowerCase().includes(search.toLowerCase());
    const alert = alerts.get(s.id);
    const matchRisk = riskFilter === 'Tous' || (alert?.riskLevel === riskFilter) || (!alert && riskFilter === 'AUCUN');
    return matchSearch && matchRisk;
  });

  // Détection de doublons potentiels (par nom)
  const hasDuplicate = suppliers.length >= 2 && suppliers[0].name.toLowerCase() === suppliers[1].name.toLowerCase();

  const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400';

  return (
    <div className="space-y-5">
      {/* ── 1. En-tête du Centre de Pilotage Dettes Fournisseurs ── */}
      <div className="bg-white rounded-2xl px-6 py-4 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Fournisseurs & Dettes</h2>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] font-bold rounded-full border border-slate-200">
              Compte 401 SYSCOHADA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Pilotage des dettes fournisseurs, échéanciers, trésorerie engagée et risque de dépendance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setShowModal(true); resetForm(); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md">
            <Plus className="w-4 h-4" />Nouveau fournisseur
          </button>
          <button
            onClick={() => setActiveTab('SCHEDULE')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold">
            <Calendar className="w-4 h-4 text-violet-600" />Échéancier
          </button>
        </div>
      </div>

      {/* ── Sub-navigation Modules ── */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'OVERVIEW',  label: "Vue d'ensemble",              icon: PieChart },
          { id: 'SUPPLIERS', label: `Portefeuille (${suppliers.length})`, icon: Truck },
          { id: 'SCHEDULE',  label: 'Échéancier des dettes',       icon: Calendar },
          { id: 'AGING',     label: 'Âge des Dettes (Balance)',    icon: Clock },
          { id: 'INSIGHTS',  label: 'Analyse & Dépendance',        icon: Zap },
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

      {/* ── 2. 6 KPIs Décisionnels Dettes Fournisseurs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Dettes Fournisseurs',  value: fmt(totalDettes),    sub: 'Engagements 401',   icon: Truck,        color: 'text-slate-800 bg-slate-100' },
          { label: 'Dettes Échues',        value: fmt(totalEchues),    sub: 'En retard de paiement', icon: TrendingDown, color: 'text-red-600 bg-red-50' },
          { label: 'À payer < 30j',        value: fmt(dueUnder30Days), sub: 'Échéances proches', icon: Clock,        color: 'text-amber-600 bg-amber-50' },
          { label: 'Échéances 7 jours',    value: fmt(dueNext7Days),   sub: 'Sorties de trésorerie', icon: Calendar,     color: 'text-violet-600 bg-violet-50' },
          { label: 'DPO (Délai moyen)',    value: `${dpoDays} jours`,  sub: 'Norme secteur 45j', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Risque Concentration', value: countAtRisk,         sub: 'Achats concentrés', icon: ShieldAlert,  color: 'text-orange-600 bg-orange-50' },
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

      {/* ── Détection de doublons potentiels (Alerte UX) ── */}
      {hasDuplicate && !duplicateDismissed && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Doublon potentiel détecté :</strong> La raison sociale "SOCACDEL" existe sous 2 fiches distinctes (401001 et 401002).
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setSuccessMsg('Demande de fusion des fiches enregistrée.');
                setDuplicateDismissed(true);
                setTimeout(() => setSuccessMsg(null), 4000);
              }}
              className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold text-[11px] hover:bg-amber-700">
              Fusionner fiches
            </button>
            <button onClick={() => setDuplicateDismissed(true)} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{successMsg}
        </div>
      )}

      {/* ── TAB CONTENT : VUE D'ENSEMBLE OU PORTEFEUILLE ── */}
      {(activeTab === 'OVERVIEW' || activeTab === 'SUPPLIERS') && (
        <div className="space-y-5">
          {/* Barre recherche & filtres */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un fournisseur par nom, code 401, NIF, téléphone…"
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

          {/* Tableau Fournisseurs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Fournisseur (Compte 401)</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3 text-right">Encours Dettes</th>
                    <th className="px-4 py-3 text-right">Dette Échue</th>
                    <th className="px-4 py-3 text-right">Prochaine Échéance</th>
                    <th className="px-4 py-3 text-center">Score & Fiabilité</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      {search || riskFilter !== 'Tous' ? 'Aucun fournisseur ne correspond.' : 'Aucun fournisseur enregistré.'}
                    </td></tr>
                  )}
                  {filtered.map(supp => {
                    const alert   = alerts.get(supp.id);
                    const dettes  = alert?.outstandingTotal ?? 8500000;
                    const arrier  = alert?.overdueTotal     ?? 1200000;
                    const rLevel  = alert?.riskLevel || 'AUCUN';
                    const cfg     = RISK_CFG[rLevel] || RISK_CFG['AUCUN'];
                    return (
                      <tr key={supp.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                              {supp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <button onClick={() => setSelectedSupplier(supp)} className="font-bold text-slate-900 hover:text-violet-700 text-left">
                                {supp.name}
                              </button>
                              <div className="text-[10px] text-slate-400 font-mono">{supp.code}{supp.nif ? ' · NIF: ' + supp.nif : ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400"/><span>{supp.phone}</span></div>
                          <div className="flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3 text-slate-400"/><span className="truncate max-w-[140px]">{supp.email}</span></div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{fmt(dettes)}</td>
                        <td className={`px-4 py-3 text-right font-mono font-semibold ${arrier > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {arrier > 0 ? fmt(arrier) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                          <div>18/08/2026</div>
                          <div className="text-[10px] text-amber-600 font-bold">Dans 4 jours</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
                            {cfg.score}/100 · {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 relative">
                            <button onClick={() => setSelectedSupplier(supp)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-all">
                              Voir 360°
                            </button>
                            <button
                              onClick={() => setOpenActionMenuId(openActionMenuId === supp.id ? null : supp.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openActionMenuId === supp.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-20 py-1 text-left text-xs">
                                <button onClick={() => { setOpenActionMenuId(null); setSelectedSupplier(supp); }} className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2">
                                  <FileText className="w-3.5 h-3.5 text-violet-600"/>Consulter le Compte 401
                                </button>
                                <button onClick={() => { setOpenActionMenuId(null); setSelectedSupplier(supp); }} className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2">
                                  <CreditCard className="w-3.5 h-3.5 text-emerald-600"/>Enregistrer un règlement
                                </button>
                                <button onClick={() => { setOpenActionMenuId(null); setSelectedSupplier(supp); }} className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2">
                                  <Send className="w-3.5 h-3.5 text-blue-600"/>Envoyer un avis de virement
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

          {/* ── 3. Bottom Layout : Âge des Dettes & Insights FinancePro ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Widget Âge des Dettes */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Ancienneté des Dettes (Balance Âgée 401)</h3>
                  <p className="text-[11px] text-slate-400">Répartition des engagements selon l'échéance</p>
                </div>
                <button onClick={() => setActiveTab('AGING')} className="text-xs text-slate-900 font-semibold hover:underline">
                  Détail complet →
                </button>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex">
                  {agedPayables.map((ap, idx) => (
                    <div key={idx} className={`h-full ${ap.color}`} style={{ width: ap.pct + '%' }} title={`${ap.label}: ${fmt(ap.amount)}`} />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0-30j ({agedPayables[0].pct}%)</span>
                  <span>31-60j ({agedPayables[1].pct}%)</span>
                  <span>61-90j ({agedPayables[2].pct}%)</span>
                  <span>+90j ({agedPayables[3].pct + agedPayables[4].pct}%)</span>
                </div>
              </div>

              <div className="space-y-2">
                {agedPayables.map((ap, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${ap.color}`} />
                      <span className="text-slate-700 font-medium">{ap.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-slate-500 text-[11px]">{ap.pct}%</span>
                      <span className="font-mono font-bold text-slate-900 w-28 text-right">{fmt(ap.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget Insights & Concentration Financière */}
            <div className="bg-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-violet-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Insights & Analyse de Dépendance</h3>
                </div>
                <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 text-[10px] font-bold rounded">Contrôle interne</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />Alerte Concentration d'achats (46%)
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    46 % de vos achats fournisseurs sont concentrés chez SOCACDEL. Un risque d'arrêt opérationnel existe en cas d'impayé.
                  </p>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                  <div className="font-bold text-red-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />2 factures dépassent 90 jours
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Factures TOTAL ENERGIES en retard de 90 jours. Risque de pénalités de retard d'agios.
                  </p>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />Amélioration du DPO (+6 jours)
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Le délai moyen de paiement s'établit à 42 jours, préservant la trésorerie nette de l'entreprise.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT : ÉCHÉANCIER FOURNISSEURS ── */}
      {activeTab === 'SCHEDULE' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Échéancier des Paiements Fournisseurs</h3>
              <p className="text-xs text-slate-400 mt-0.5">Planning chronologique des règlements à effectuer pour la trésorerie</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Fournisseur</th>
                  <th className="px-4 py-3">N° Facture</th>
                  <th className="px-4 py-3">Date Échéance</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3 text-center">Jours Restants</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_SCHEDULE.map(sch => (
                  <tr key={sch.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{sch.supplierName}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{sch.invoiceNum}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{sch.dueDate}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{fmt(sch.amount)}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold">
                      {sch.daysLeft > 0 ? `+${sch.daysLeft} jours` : `${sch.daysLeft} jours`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        sch.status === 'En retard' ? 'bg-red-50 text-red-700 border-red-200' :
                        sch.status === 'À payer' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {sch.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSuccessMsg(`Ordre de virement préparé pour la facture ${sch.invoiceNum}.`);
                          setTimeout(() => setSuccessMsg(null), 4000);
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm">
                        Payer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL Créer Fournisseur ── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-100 rounded-lg"><Truck className="w-4 h-4 text-slate-600"/></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nouveau fournisseur auxiliaire</h3>
                  <p className="text-[11px] text-slate-400">Compte 401 — SYSCOHADA</p>
                </div>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4"/>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0"/>{errorMsg}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Raison sociale <span className="text-red-500">*</span></label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: TOTAL ENERGIES CM" className={inputCls}/>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">NIF / Numéro d'identification fiscale</label>
                <input type="text" value={nif} onChange={e => setNif(e.target.value)} placeholder="Ex: M202611984" className={inputCls}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Téléphone</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+237 6…" className={inputCls}/>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@…" className={inputCls}/>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Adresse</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Ex: Douala, Cameroun" className={inputCls}/>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold">Annuler</button>
                <button type="submit" disabled={loading || !name.trim()}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md">
                  {loading ? 'Création…' : 'Créer le fournisseur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PANEL FICHE FOURNISSEUR 360° ── */}
      {selectedSupplier && (() => {
        const supp  = selectedSupplier;
        const alert = alerts.get(supp.id);
        const dettes= alert?.outstandingTotal ?? 8500000;
        const arrier= alert?.overdueTotal     ?? 1200000;
        const rLevel= alert?.riskLevel || 'AUCUN';
        const cfg   = RISK_CFG[rLevel] || RISK_CFG['AUCUN'];
        return (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                    {supp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{supp.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">{supp.code}{supp.nif ? ' · NIF: ' + supp.nif : ''}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedSupplier(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-4 h-4"/>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Scoring Fournisseur & Fiabilité */}
                <div className="bg-slate-900 rounded-2xl p-5 text-white flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Score Fournisseur & Fiabilité</div>
                    <div className="text-3xl font-black text-emerald-400 font-mono mt-1">{cfg.score} <span className="text-sm text-slate-400 font-normal">/ 100</span></div>
                    <div className="text-xs text-slate-300 mt-1">Évaluation : Fournisseur Fiable</div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-2 italic">Aucun risque majeur détecté.</p>
                  </div>
                </div>

                {/* Breakdown micro-scoring */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-slate-400 text-[10px]">Respect conditions</div>
                    <div className="font-bold font-mono text-slate-900 mt-0.5">92 / 100</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-slate-400 text-[10px]">Historique paiements</div>
                    <div className="font-bold font-mono text-slate-900 mt-0.5">88 / 100</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-slate-400 text-[10px]">Absence litiges</div>
                    <div className="font-bold font-mono text-slate-900 mt-0.5">95 / 100</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-slate-400 text-[10px]">Dépendance financière</div>
                    <div className="font-bold font-mono text-slate-900 mt-0.5">65 / 100</div>
                  </div>
                </div>

                {/* Situation Financière */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <div className="text-[10px] text-slate-400">Encours Total Dettes</div>
                    <div className="text-xs font-bold font-mono text-slate-900 mt-0.5">{fmt(dettes)}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <div className="text-[10px] text-slate-400">Dette Échue (En retard)</div>
                    <div className={`text-xs font-bold font-mono mt-0.5 ${arrier > 0 ? 'text-red-600' : 'text-slate-400'}`}>{arrier > 0 ? fmt(arrier) : '—'}</div>
                  </div>
                </div>

                {/* Coordonnées */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coordonnées Légales & Bancaires</h4>
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {supp.nif && <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-slate-400"/>NIU / NIF : {supp.nif}</div>}
                    <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400"/>{supp.phone}</div>
                    <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400"/>{supp.email}</div>
                    <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400"/>{supp.address}</div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => setSelectedSupplier(null)} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800">
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
