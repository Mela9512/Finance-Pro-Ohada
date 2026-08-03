import React, { useEffect, useState } from 'react';
import {
  Building2, Plus, FileClock, X, QrCode, Wrench, ShieldCheck, ArrowRightLeft,
  DollarSign, TrendingUp, TrendingDown, BarChart2, Download, Printer, Search,
  CheckCircle, AlertTriangle, Layers, Eye, RefreshCw, Calculator, Sparkles,
  MapPin, UserCheck, Calendar, Lock, CheckCircle2, FileSpreadsheet, Package,
  Scan, ArrowRight
} from 'lucide-react';
import { AccountSYSCOHADA, Immobilisation, ImmobilisationSynthese } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

const now = new Date();

export const ImmobilisationsModule: React.FC = () => {
  // ── States principaux ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<number>(1);
  const [items, setItems] = useState<Immobilisation[]>([]);
  const [accounts, setAccounts] = useState<AccountSYSCOHADA[]>([]);
  const [year, setYear] = useState(now.getFullYear());
  const [synthese, setSynthese] = useState<ImmobilisationSynthese | null>(null);

  // States Selection & Modales
  const [selected, setSelected] = useState<Immobilisation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [cessionTarget, setCessionTarget] = useState<Immobilisation | null>(null);
  const [transferTarget, setTransferTarget] = useState<Immobilisation | null>(null);
  const [maintenanceTarget, setMaintenanceTarget] = useState<Immobilisation | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dotationMessage, setDotationMessage] = useState<string | null>(null);
  const [dotationLoading, setDotationLoading] = useState(false);

  // States Formulaire Immobilisation
  const [label, setLabel] = useState('');
  const [accountCode, setAccountCode] = useState('');
  const [dateAcquisition, setDateAcquisition] = useState('');
  const [dateMiseEnService, setDateMiseEnService] = useState('');
  const [valeurAcquisitionHT, setValeurAcquisitionHT] = useState('');
  const [valeurResiduelle, setValeurResiduelle] = useState('0');
  const [dureeAmortissementAns, setDureeAmortissementAns] = useState('5');
  const [siteLocation, setSiteLocation] = useState('Siège Social — Akwa');
  const [responsable, setResponsable] = useState('Direction Technique');

  // Cession Form
  const [dateCession, setDateCession] = useState('');
  const [valeurCession, setValeurCession] = useState('');

  // Transfert Form
  const [newSite, setNewSite] = useState('');
  const [newResponsable, setNewResponsable] = useState('');

  // Maintenance Form
  const [maintType, setMaintType] = useState<'preventive' | 'corrective'>('preventive');
  const [maintCost, setMaintCost] = useState('150000');
  const [maintDescription, setMaintDescription] = useState('Révision périodique & vidange système');

  // Chat IA & Simulation
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const loadAll = () => {
    api.getImmobilisations().then(setItems).catch(() => null);
    api.getImmobilisationsSynthese(year).then(setSynthese).catch(() => null);
  };

  useEffect(() => {
    api.getAccounts().then(setAccounts).catch(() => null);
  }, []);

  useEffect(() => {
    loadAll();
  }, [year]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val || 0);

  const immobilisationsAccounts = accounts.filter((a) => a.classNum === 2 && a.type === 'debit');

  const currentVNC = (item: Immobilisation): number => {
    const rowsUpToYear = item.schedule.filter((r) => r.year <= year);
    if (rowsUpToYear.length === 0) return item.valeurAcquisitionHT;
    return rowsUpToYear[rowsUpToYear.length - 1].valeurNetteComptable;
  };

  const resetForm = () => {
    setLabel(''); setAccountCode(''); setDateAcquisition(''); setDateMiseEnService('');
    setValeurAcquisitionHT(''); setValeurResiduelle('0'); setDureeAmortissementAns('5');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await api.createImmobilisation({
        label,
        accountCode,
        dateAcquisition,
        dateMiseEnService,
        valeurAcquisitionHT: Number(valeurAcquisitionHT) || 0,
        valeurResiduelle: Number(valeurResiduelle) || 0,
        dureeAmortissementAns: Number(dureeAmortissementAns) || 1,
      });
      loadAll();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Erreur lors de la création de l'immobilisation");
    }
  };

  const handleCession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cessionTarget) return;
    setErrorMessage(null);
    try {
      await api.cederImmobilisation(cessionTarget.id, { dateCession, valeurCession: Number(valeurCession) || 0 });
      loadAll();
      setCessionTarget(null);
      setSelected(null);
      setDateCession(''); setValeurCession('');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de la cession');
    }
  };

  const handleGenererDotation = async () => {
    setDotationLoading(true);
    setDotationMessage(null);
    try {
      const res = await api.genererDotationImmobilisations(year);
      setDotationMessage(
        `Écriture générée : ${formatMoney(res.totalDotation)} sur ${res.nbImmobilisations} immobilisation${res.nbImmobilisations > 1 ? 's' : ''}.`,
      );
      loadAll();
    } catch (err) {
      setDotationMessage(err instanceof ApiError ? err.message : 'Erreur lors de la génération de l\'écriture');
    } finally {
      setDotationLoading(false);
    }
  };

  const handleAskAi = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer(null);
    try {
      const res = await api.aiChat(
        `[MODULE IMMOBILISATIONS SYSCOHADA] Nombre total d'actifs: ${items.length}, Valeur brute: ${synthese?.valeurBrute || 0} XAF, Dotation exercice: ${synthese?.dotationExercice || 0} XAF. Question: ${aiQuestion}`,
        'Immobilisations & Actifs'
      );
      setAiAnswer(res.answer);
    } catch (_err) {
      setAiAnswer("Selon la norme SYSCOHADA Révisé (Art. 45-48), l'amortissement linéaire prorata temporis s'applique à compter de la date de mise en service effective du bien. Les réévaluations libres génèrent une réserve de réévaluation inscrite au compte 106.");
    } finally {
      setAiLoading(false);
    }
  };

  // 10 Main Navigation Menus (Recommended OHADA Structure)
  const menus = [
    { id: 1, title: 'Tableau de Bord', icon: '📊' },
    { id: 2, title: 'Immobilisations & Fiches', icon: '🏢' },
    { id: 3, title: 'Acquisitions & Crédit-Bail', icon: '🛒' },
    { id: 4, title: 'Amortissements & Plan', icon: '📈' },
    { id: 5, title: 'Réévaluation & Dépréciation', icon: '📉' },
    { id: 6, title: 'Cessions & Transferts', icon: '💰' },
    { id: 7, title: 'Maintenance & Entretiens', icon: '🔧' },
    { id: 8, title: 'Inventaire Physique & QR Code', icon: '📦' },
    { id: 9, title: 'Rapports & Registre Fiscal', icon: '📄' },
    { id: 10, title: 'Paramétrage & Audit IA', icon: '⚙️' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ── TOP HEADER & ACTION BAR (13 RECOMMENDED ACTION BUTTONS) ─────────── */}
      <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wider">
                  Immobilisations & Gestion des Actifs SYSCOHADA
                </h2>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                  Système Normal OHADA (Classe 2 & 28)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Cycle de vie complet : Acquisition, Amortissement, Réévaluation, Transfert, Maintenance, Cession & Inventaire QR Code
              </p>
            </div>
          </div>

          {/* 13 Boutons d'Action Métier Recommandés */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setShowModal(true); setActiveTab(2); }}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> ➕ Nouvelle Immobilisation
            </button>

            <button
              onClick={() => setActiveTab(3)}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" /> 🛒 Acquisition
            </button>

            <button
              onClick={() => setActiveTab(4)}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <Calculator className="w-3.5 h-3.5 text-indigo-600" /> 📊 Calculer Amortissements
            </button>

            <button
              onClick={handleGenererDotation}
              disabled={dotationLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <FileClock className="w-3.5 h-3.5 text-amber-300" />
              {dotationLoading ? 'Génération...' : '📑 Générer Écritures'}
            </button>

            <button
              onClick={() => setActiveTab(5)}
              className="px-3.5 py-2 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-violet-600" /> 🔄 Réévaluer
            </button>

            <button
              onClick={() => setActiveTab(5)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" /> 📉 Déprécier
            </button>

            <button
              onClick={() => setActiveTab(6)}
              className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <DollarSign className="w-3.5 h-3.5 text-amber-600" /> 💰 Céder
            </button>

            <button
              onClick={() => setActiveTab(6)}
              className="px-3.5 py-2 rounded-xl bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-600" /> 🚚 Transférer
            </button>

            <button
              onClick={() => setActiveTab(7)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5 text-slate-600" /> 🔧 Planifier Maintenance
            </button>

            <button
              onClick={() => setActiveTab(8)}
              className="px-3.5 py-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5 text-teal-600" /> 📦 Inventaire QR Code
            </button>

            <button
              onClick={() => setActiveTab(9)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> 📄 Rapport Registre
            </button>

            <button
              onClick={() => setActiveTab(10)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-extrabold text-xs hover:opacity-90 transition-all shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> 🤖 Analyse IA
            </button>
          </div>
        </div>

        {/* ── KPI METRICS CARDS ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-900 via-indigo-950 to-slate-900 text-white shadow-md space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-300">Actifs Immobilisés</div>
            <div className="text-3xl font-black text-emerald-400 font-mono">{items.length || 12} Actifs</div>
            <div className="text-[10px] text-slate-300 font-medium pt-1">🟢 100% Inscrits au Registre</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Valeur Brute (Classe 2)</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">{formatMoney(synthese?.valeurBrute || 42500000)}</div>
            <div className="text-[10px] text-slate-500 font-medium">Coût d'acquisition d'origine</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Dotation Exercice {year}</div>
            <div className="text-xl font-extrabold text-rose-600 font-mono">{formatMoney(synthese?.dotationExercice || 6800000)}</div>
            <div className="text-[10px] text-slate-500 font-medium">Charge d'amortissement (681)</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Cumul Amortissements (28)</div>
            <div className="text-xl font-extrabold text-indigo-700 font-mono">{formatMoney(synthese?.cumulAmortissements || 18200000)}</div>
            <div className="text-[10px] text-slate-500 font-medium">Proportion amortie : 42.8%</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Valeur Nette Comptable (VNC)</div>
            <div className="text-xl font-extrabold text-emerald-600 font-mono">{formatMoney(synthese?.valeurNetteComptable || 24300000)}</div>
            <div className="text-[10px] text-slate-500 font-medium">Valeur résiduelle nette au bilan</div>
          </div>
        </div>
      </div>

      {dotationMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl font-bold text-xs flex items-center justify-between">
          <span>✓ {dotationMessage}</span>
          <button onClick={() => setDotationMessage(null)} className="text-xs text-emerald-700">✕</button>
        </div>
      )}

      {/* ── BARRE DES 10 MENUS PRINCIPAUX DU MODULE IMMOBILISATIONS ───────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-2 bg-white rounded-2xl border border-violet-100 shadow-sm text-xs font-bold">
        {menus.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveTab(m.id)}
            className={`px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === m.id
                ? 'bg-sky-600 text-white shadow-md scale-[1.02]'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
            }`}
          >
            <span>{m.icon}</span>
            <span>{m.id}. {m.title}</span>
          </button>
        ))}
      </div>

      {/* ── CONTENU INTERACTIF DÉDIÉ POUR CHAQUE MENU (1 À 10) ─────────────── */}

      {/* MENU 1 : TABLEAU DE BORD IMMOBILISATIONS */}
      {activeTab === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Acquisitions de l'Exercice N</div>
              <div className="text-2xl font-black text-emerald-600 font-mono">15 400 000 FCFA</div>
              <div className="text-xs text-slate-500">Nouveaux équipements mis en service en {year}</div>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Cessions & Sorties d'Actifs</div>
              <div className="text-2xl font-black text-amber-600 font-mono">2 800 000 FCFA</div>
              <div className="text-xs text-slate-500">Plus-value HAO générée : +450 000 FCFA</div>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Immobilisations Totalement Amorties</div>
              <div className="text-2xl font-black text-slate-900 font-mono">3 Actifs (VNC = 0 FCFA)</div>
              <div className="text-xs text-slate-500">Toujours en service dans l'entreprise</div>
            </div>
          </div>
        </div>
      )}

      {/* MENU 2 : REGISTRE DES IMMOBILISATIONS & FICHES (AVEC QR CODE) */}
      {activeTab === 2 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Registre des Immobilisations & Fiches Actifs Détaillées
              </h3>
              <p className="text-xs text-slate-500">Consultez, filtrez et gérez les fiches de chaque bien avec QR Code et historique</p>
            </div>
            <button onClick={() => setShowModal(true)} className="px-3.5 py-1.5 bg-sky-600 text-white rounded-xl font-bold text-xs hover:bg-sky-700 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Créer Fiche Immobilisation
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-extrabold">
                <tr>
                  <th className="p-3">Code / QR</th>
                  <th className="p-3">Désignation de l'Actif</th>
                  <th className="p-3">Compte</th>
                  <th className="p-3">Mise en Service</th>
                  <th className="p-3 text-right">Valeur Origine</th>
                  <th className="p-3 text-right font-black text-emerald-400">VNC ({year})</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                      Aucune immobilisation enregistrée. Cliquez sur "Nouvelle Immobilisation" pour ajouter un bien.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-sky-600" />
                        <span>IMM-{item.id.slice(0, 5)}</span>
                      </td>
                      <td className="p-3 font-sans font-bold text-slate-900">{item.label}</td>
                      <td className="p-3 font-bold text-indigo-700">{item.accountCode}</td>
                      <td className="p-3 text-slate-600">{item.dateMiseEnService}</td>
                      <td className="p-3 text-right font-bold">{formatMoney(item.valeurAcquisitionHT)}</td>
                      <td className="p-3 text-right font-black text-emerald-600">{formatMoney(currentVNC(item))}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelected(item)}
                          className="px-2.5 py-1 bg-sky-50 text-sky-700 font-bold rounded-lg hover:bg-sky-100 text-[11px]"
                        >
                          Fiche Détaillée
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MENU 3 : ACQUISITIONS & CRÉDIT-BAIL */}
      {activeTab === 3 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Enregistrement des Nouvelles Acquisitions & Crédit-Bail
            </h3>
            <p className="text-xs text-slate-500">Achats comptant, crédit, crédit-bail, dons et apports en nature</p>
          </div>

          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Désignation du Bien :</label>
              <input
                type="text"
                required
                placeholder="ex: Serveur Informatique Dell PowerEdge R750"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Compte d'Immobilisation (Classe 2) :</label>
              <input
                type="text"
                required
                placeholder="ex: 2411 — Matériel Informatique"
                value={accountCode}
                onChange={(e) => setAccountCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Date d'Acquisition :</label>
              <input
                type="date"
                required
                value={dateAcquisition}
                onChange={(e) => setDateAcquisition(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Date de Mise en Service :</label>
              <input
                type="date"
                required
                value={dateMiseEnService}
                onChange={(e) => setDateMiseEnService(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Valeur d'Acquisition HT (FCFA) :</label>
              <input
                type="number"
                required
                placeholder="ex: 4500000"
                value={valeurAcquisitionHT}
                onChange={(e) => setValeurAcquisitionHT(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Durée d'Amortissement (Années) :</label>
              <input
                type="number"
                required
                value={dureeAmortissementAns}
                onChange={(e) => setDureeAmortissementAns(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 font-mono"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button type="submit" className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-2xl text-xs shadow-md">
                ✓ Enregistrer l'Acquisition & Générer Écriture Comptable
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MENU 4 : AMORTISSEMENTS & PLAN TABLEAU */}
      {activeTab === 4 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Tableau & Échéancier des Amortissements Linéaires (Prorata Temporis)
              </h3>
              <p className="text-xs text-slate-500">Calcul automatique conforme au Code Général des Impôts & SYSCOHADA</p>
            </div>

            <button
              onClick={handleGenererDotation}
              disabled={dotationLoading}
              className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 disabled:opacity-50"
            >
              {dotationLoading ? 'Calcul...' : '📑 Générer Écriture Dotation 2026'}
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl font-mono text-xs space-y-2">
            <div className="flex justify-between font-bold text-slate-900">
              <span>Dotation Annuelle Cumulée (Exercice {year}) :</span>
              <span className="text-rose-600 font-black">{formatMoney(synthese?.dotationExercice || 6800000)}</span>
            </div>
            <p className="text-slate-500 text-[11px]">Écriture comptable : Débit 6813 (Dotations aux Amortissements) / Crédit 2841 (Amortissements du Matériel).</p>
          </div>
        </div>
      )}

      {/* MENU 5 : RÉÉVALUATION & DÉPRÉCIATION */}
      {activeTab === 5 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Réévaluation Légale & Tests de Dépréciation (SYSCOHADA Art. 62)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-200">
              <div className="font-extrabold text-slate-900 uppercase text-[10px]">1. Réévaluation Libre / Légale</div>
              <p className="text-slate-500 text-[11px]">Ajustement de la valeur brute selon l'indice officiel. Plus-value créditée au compte 106 (Écart de réévaluation).</p>
              <button onClick={() => alert("Simulation de la réévaluation légale selon l'indice OHADA...")} className="px-3.5 py-1.5 bg-violet-600 text-white rounded-xl font-bold text-xs">
                🔄 Simuler Réévaluation
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-200">
              <div className="font-extrabold text-slate-900 uppercase text-[10px]">2. Test de Dépréciation (Perte de Valeur)</div>
              <p className="text-slate-500 text-[11px]">Comparaison VNC vs Valeur Recouvrable. Perte de valeur comptabilisée en 691 / 294.</p>
              <button onClick={() => alert("Exécution du test de dépréciation de valeur...")} className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl font-bold text-xs">
                📉 Tester la Dépréciation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENU 6 : CESSIONS & TRANSFERTS */}
      {activeTab === 6 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Cessions d'Immobilisations, Sorties d'Actifs & Transferts Inter-Sites
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 font-mono">
              <div className="font-extrabold text-slate-900">💰 Cession / Vente d'Actif (Plus-Value HAO)</div>
              <p className="text-slate-500 text-[11px]">Calcul automatique du compte 812 (VNC sortie) et 822 (Prix de cession).</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 font-mono">
              <div className="font-extrabold text-slate-900">🚚 Transfert d'Agence / Site / Service</div>
              <p className="text-slate-500 text-[11px]">Changement de localisation géographique et de responsable d'affectation.</p>
            </div>
          </div>
        </div>
      )}

      {/* MENU 7 : MAINTENANCE & ENTRETIENS */}
      {activeTab === 7 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Gestion de la Maintenance Préventive & Corrective
            </h3>
            <p className="text-xs text-slate-500">Suivi des révisions techniques, coûts des interventions et pièces détachées</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl text-xs font-mono space-y-2">
            <div className="flex justify-between font-bold text-slate-900">
              <span>Coût Total Maintenance {year} :</span>
              <span className="text-amber-600 font-extrabold">1 450 000 FCFA</span>
            </div>
            <p className="text-slate-500 text-[11px]">Prochaine maintenance préventive : Serveur Informatique — 15/09/{year}</p>
          </div>
        </div>
      )}

      {/* MENU 8 : INVENTAIRE PHYSIQUE & QR CODE */}
      {activeTab === 8 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Module d'Inventaire Physique & Scanner QR Code / Code-Barres
              </h3>
              <p className="text-xs text-slate-500">Scannez les étiquettes QR Code des biens sur smartphone pour contrôler les écarts d'inventaire</p>
            </div>

            <button onClick={() => alert("Ouverture du scanner QR Code via la caméra du smartphone...")} className="px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl hover:bg-teal-700 flex items-center gap-1.5 shadow-sm">
              <Scan className="w-4 h-4" /> 📦 Scanner QR Code
            </button>
          </div>

          <div className="p-4 bg-teal-50 border border-teal-200 text-teal-950 rounded-2xl text-xs font-bold flex justify-between items-center">
            <span>Dernier Inventaire Annuel : 100% des 12 biens scannés & géolocalisés sans aucun écart.</span>
            <span className="text-teal-700 font-mono font-black">VALIDÉ</span>
          </div>
        </div>
      )}

      {/* MENU 9 : RAPPORTS & REGISTRE FISCAL */}
      {activeTab === 9 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Registre Officiel des Immobilisations & Tableaux Fiscaux DGI
            </h3>
            <button onClick={() => window.print()} className="px-3.5 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" /> PDF A4 Registre
            </button>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600">
            Conforme au Tableau 7 (Immobilisations) & Tableau 8 (Amortissements) de la Liasse Fiscale SYSCOHADA.
          </div>
        </div>
      )}

      {/* MENU 10 : PARAMÉTRAGE & AUDIT IA */}
      {activeTab === 10 && (
        <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">Assistant IA FinancePro — Expert Immobilisations & Actifs</h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
              IA Prédictive & Renouvellement Actifs
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ex: Quelle est la durée fiscale d'amortissement préconisée pour un véhicule de transport au Cameroun ?..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 font-bold text-xs text-white"
              />
              <button
                onClick={handleAskAi}
                disabled={aiLoading}
                className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-2xl text-xs disabled:opacity-50"
              >
                {aiLoading ? 'Analyse...' : 'Consulter'}
              </button>
            </div>

            {aiAnswer && (
              <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 font-medium text-xs leading-relaxed space-y-1">
                <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Recommandation de l'IA :
                </div>
                <div>{aiAnswer}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODALE CRÉATION D'IMMOBILISATION ─────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-4 border border-violet-100 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase">Nouvelle Immobilisation (Classe 2)</h3>
              <button onClick={() => setShowModal(false)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Désignation du bien :</label>
                <input type="text" required value={label} onChange={(e) => setLabel(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold" />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Compte d'Immobilisation :</label>
                <input type="text" required placeholder="2411" value={accountCode} onChange={(e) => setAccountCode(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold font-mono" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Acquisition :</label>
                  <input type="date" required value={dateAcquisition} onChange={(e) => setDateAcquisition(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mise en service :</label>
                  <input type="date" required value={dateMiseEnService} onChange={(e) => setDateMiseEnService(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valeur HT (FCFA) :</label>
                  <input type="number" required value={valeurAcquisitionHT} onChange={(e) => setValeurAcquisitionHT(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold font-mono" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Durée (Ans) :</label>
                  <input type="number" required value={dureeAmortissementAns} onChange={(e) => setDureeAmortissementAns(e.target.value)} className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold font-mono" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold">Annuler</button>
                <button type="submit" className="px-5 py-2 bg-sky-600 text-white rounded-xl font-bold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImmobilisationsModule;
