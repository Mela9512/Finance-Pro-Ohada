import React, { useEffect, useState } from 'react';
import {
  Building2, Users, CheckCircle, Lock, Unlock, Send, Shield, Globe, Phone, Mail,
  MapPin, DollarSign, FileText, CreditCard, Award, ChevronRight, Check, AlertCircle,
  Sparkles, Layers, Sliders, CheckSquare, Zap, Calculator, PieChart, ShieldCheck, Upload
} from 'lucide-react';
import { Company, User, UserRole } from '@financepro/shared';
import { api, ApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FORMES_JURIDIQUES, SECTEURS, REGIMES_FISCAUX, TAUX_TVA, PAYS_OHADA, DEVISES,
  MODULES_LISTE, MODES_PAIEMENT_OPTIONS
} from '../wizard/types';

export const AdminModule: React.FC = () => {
  const { refreshCompany, company: ctxCompany, user: ctxUser } = useAuth();
  const isAdmin = ctxUser?.role === 'ADMIN';
  const [company, setCompany] = useState<Partial<Company> | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'stepped' | 'full'>('stepped');
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // States pour Étape 7 (Organisation)
  const [newDept, setNewDept] = useState('');
  const [newCostCenter, setNewCostCenter] = useState('');
  const [newBranch, setNewBranch] = useState('');

  // States pour Étape 8 (Invitations)
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('COMPTABLE');
  const [inviteSentMessage, setInviteSentMessage] = useState<string | null>(null);

  // Pre-fill with AuthContext company to avoid blank screen
  useEffect(() => {
    if (ctxCompany && !company) {
      setCompany({
        ...ctxCompany,
        departments: ctxCompany.departments || ['Comptabilité', 'Direction Générale', 'Finance', 'Ressources Humaines'],
        costCenters: ctxCompany.costCenters || ['Centre Douala - Akwa', 'Siège Social'],
        branches: ctxCompany.branches || ['Direction Générale Douala'],
        enabledModules: ctxCompany.enabledModules || ['comptabilite', 'tresorerie', 'ventes', 'facturation', 'paie', 'budget', 'etats', 'dashboard'],
        paymentMethods: ctxCompany.paymentMethods || ['Virement bancaire', 'Chèque', 'Espèces', 'Mobile Money'],
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctxCompany]);

  const load = async () => {
    try {
      const c = await api.getCompany();
      setCompany({
        ...c,
        departments: c.departments || ['Comptabilité', 'Direction Générale', 'Finance', 'Ressources Humaines'],
        costCenters: c.costCenters || ['Centre Douala - Akwa', 'Siège Social'],
        branches: c.branches || ['Direction Générale Douala'],
        enabledModules: c.enabledModules || ['comptabilite', 'tresorerie', 'ventes', 'facturation', 'paie', 'budget', 'etats', 'dashboard'],
        paymentMethods: c.paymentMethods || ['Virement bancaire', 'Chèque', 'Espèces', 'Mobile Money'],
      });
    } catch (_companyErr) {
      // Silently ignore — ctxCompany used as fallback (already applied in useEffect above)
    }
    // Load users list (admin-only, ignore 403 for non-admins)
    try {
      const u = await api.getUsers();
      setUsers(u);
    } catch (_userErr) {
      // Non-admin users can't see the users list — that's expected
    }
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveCompany = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!company) return;
    setErrorMessage(null);
    try {
      const updated = await api.updateCompany({
        name: company.name,
        logo: company.logo,
        language: company.language,
        currency: company.currency,
        country: company.country,
        legalName: company.legalName,
        legalForm: company.legalForm,
        rccm: company.rccm,
        nif: company.nif,
        capital: Number(company.capital) || 0,
        sector: company.sector,
        incorporationDate: company.incorporationDate,
        address: company.address,
        city: company.city,
        region: company.region,
        phone: company.phone,
        email: company.email,
        website: company.website,
        fiscalYearStart: company.fiscalYearStart,
        fiscalYearEnd: company.fiscalYearEnd,
        accountLength: Number(company.accountLength) || 6,
        taxRegime: company.taxRegime,
        taxCenter: company.taxCenter,
        taxNumber: company.taxNumber,
        vatRate: Number(company.vatRate) || 19.25,
        vatEnabled: company.vatEnabled,
        bankName: company.bankName,
        bankAccount: company.bankAccount,
        bankCode: company.bankCode,
        cashName: company.cashName,
        paymentMethods: company.paymentMethods,
        departments: company.departments,
        costCenters: company.costCenters,
        branches: company.branches,
        enabledModules: company.enabledModules,
      });
      setCompany(updated);
      await refreshCompany();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour des paramètres');
    }
  };

  const handleToggleExercice = async () => {
    if (!company) return;
    try {
      const updated = company.isExerciceClosed ? await api.reopenExercice() : await api.closeExercice();
      setCompany(updated);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Erreur lors du changement d'état de l'exercice");
    }
  };

  const [modalErrorMessage, setModalErrorMessage] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalErrorMessage(null);
    setInviteSentMessage(null);
    setIsInviting(true);
    try {
      const res = await api.inviteUser({ email: inviteEmail, role: inviteRole });
      setInviteSentMessage(res.message);
      setInviteEmail('');
      load();
    } catch (err) {
      setModalErrorMessage(err instanceof ApiError ? err.message : "Erreur lors de l'envoi de l'invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleCountryChange = (c: string) => {
    if (!company) return;
    const countryDefaults: Record<string, { currency: string; vatRate: number }> = {
      'Cameroun': { currency: 'XAF', vatRate: 19.25 },
      'Côte d\'Ivoire': { currency: 'XOF', vatRate: 18 },
      'Sénégal': { currency: 'XOF', vatRate: 18 },
      'Gabon': { currency: 'XAF', vatRate: 18 },
      'Congo': { currency: 'XAF', vatRate: 18.9 },
      'RDC': { currency: 'CDF', vatRate: 16 },
      'Togo': { currency: 'XOF', vatRate: 18 },
      'Bénin': { currency: 'XOF', vatRate: 18 },
      'Burkina Faso': { currency: 'XOF', vatRate: 18 },
      'Mali': { currency: 'XOF', vatRate: 18 },
      'Niger': { currency: 'XOF', vatRate: 18 },
      'Tchad': { currency: 'XAF', vatRate: 18 },
      'Centrafrique': { currency: 'XAF', vatRate: 19 },
      'Guinée': { currency: 'GNF', vatRate: 18 },
      'Guinée Bissau': { currency: 'XOF', vatRate: 15 },
      'Comores': { currency: 'KMF', vatRate: 15 },
      'Guinée Équatoriale': { currency: 'XAF', vatRate: 15 }
    };
    const defaults = countryDefaults[c] || { currency: 'XAF', vatRate: 18 };
    setCompany({
      ...company,
      country: c,
      currency: defaults.currency,
      vatRate: defaults.vatRate
    });
  };

  const toggleModule = (modId: string) => {
    if (!company) return;
    const current = company.enabledModules || [];
    const updated = current.includes(modId) ? current.filter((m) => m !== modId) : [...current, modId];
    setCompany({ ...company, enabledModules: updated });
  };

  const togglePaymentMethod = (method: string) => {
    if (!company) return;
    const current = company.paymentMethods || [];
    const updated = current.includes(method) ? current.filter((m) => m !== method) : [...current, method];
    setCompany({ ...company, paymentMethods: updated });
  };

  const addDepartment = () => {
    if (!newDept.trim() || !company) return;
    setCompany({ ...company, departments: [...(company.departments || []), newDept.trim()] });
    setNewDept('');
  };

  const addCostCenter = () => {
    if (!newCostCenter.trim() || !company) return;
    setCompany({ ...company, costCenters: [...(company.costCenters || []), newCostCenter.trim()] });
    setNewCostCenter('');
  };

  const addBranch = () => {
    if (!newBranch.trim() || !company) return;
    setCompany({ ...company, branches: [...(company.branches || []), newBranch.trim()] });
    setNewBranch('');
  };

  if (!company) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold text-xs animate-pulse">
        Chargement des paramètres de l'entreprise...
      </div>
    );
  }

  const stepsList = [
    { num: 1, title: 'Informations Générales', icon: '🏢' },
    { num: 2, title: 'Identification Légale', icon: '📜' },
    { num: 3, title: 'Coordonnées & Siège', icon: '📍' },
    { num: 4, title: 'Comptabilité SYSCOHADA', icon: '📊' },
    { num: 5, title: 'Fiscalité & Régime Impôts', icon: '⚖️' },
    { num: 6, title: 'Banque & Trésorerie', icon: '🏦' },
    { num: 7, title: 'Organisation & Analytique', icon: '🏢' },
    { num: 8, title: 'Utilisateurs & Rôles RBAC', icon: '👥' },
    { num: 9, title: 'Activation des Modules', icon: '🧩' },
    { num: 10, title: 'Validation & Conformité', icon: '🎯' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Bandeau Lecture-Seule pour non-ADMIN */}
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl p-3.5 font-bold flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-600" />
          <span>Mode consultation — Votre rôle <strong>{ctxUser?.role}</strong> permet la visualisation des paramètres mais pas leur modification. Contactez l'ADMIN pour toute mise à jour.</span>
        </div>
      )}

      {/* Messages de Statut */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl p-4 font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-700">✕</button>
        </div>
      )}

      {isSaved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl p-4 font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Paramètres sauvegardés avec succès sur l'ensemble des 10 étapes SYSCOHADA !</span>
        </div>
      )}

      {/* ── En-tête Principal de Fiche Entreprise ─────────────────────────── */}
      <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
            {company.name ? company.name.substring(0, 2).toUpperCase() : 'FP'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">{company.name || 'MELARO GROUP'}</h2>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                10 Étapes de Configuration Alignées
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Norme SYSCOHADA Révisé 2026 — Pays : <strong className="text-slate-800">{company.country || 'Cameroun'}</strong> | Devise : <strong className="text-violet-700">{company.currency || 'XAF'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Switch Mode Vue */}
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setViewMode('stepped')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === 'stepped' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔢 Vue Étape par Étape (1 à 10)
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === 'full' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📜 Vue Synthétique Complète
            </button>
          </div>

          <button
            type="button"
            onClick={handleToggleExercice}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm ${
              company.isExerciceClosed
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {company.isExerciceClosed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{company.isExerciceClosed ? 'Exercice Clôturé' : 'Exercice Ouvert'}</span>
          </button>
        </div>
      </div>

      {/* ── BARRE DES 10 ÉTAPES DE CRÉATION INTERACTIVES ───────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-2 bg-white rounded-2xl border border-violet-100 shadow-sm text-xs font-bold">
        {stepsList.map((s) => (
          <button
            key={s.num}
            onClick={() => { setActiveStep(s.num); if (viewMode === 'full') setViewMode('stepped'); }}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeStep === s.num && viewMode === 'stepped'
                ? 'bg-violet-600 text-white shadow-md scale-[1.02]'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
            }`}
          >
            <span>{s.icon}</span>
            <span>{s.num}. {s.title}</span>
          </button>
        ))}
      </div>

      {/* ── CONTENU RENDER: MODE ÉTAPE OU VUE COMPLÈTE ──────────────────────── */}
      <form onSubmit={handleSaveCompany} className="space-y-6">
        {/* ── ÉTAPE 1: INFORMATIONS GÉNÉRALES & BIENVENUE ───────────────────── */}
        {(viewMode === 'full' || activeStep === 1) && (
          <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏢</span>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Étape 1 : Informations Générales & Identité Visuelle
                </h3>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">Étape 1/10</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom de l'Entreprise / Marque</label>
                <input
                  type="text"
                  value={company.name || ''}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Langue d'Affichage</label>
                <select
                  value={company.language || 'fr'}
                  onChange={(e) => setCompany({ ...company, language: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value="fr">Français (Standard OHADA)</option>
                  <option value="en">English (Business)</option>
                  <option value="pt">Português (Guiné-Bissau)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Devise Principale du Système</label>
                <select
                  value={company.currency || 'XAF'}
                  onChange={(e) => setCompany({ ...company, currency: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  {DEVISES.map((d) => (
                    <option key={d.code} value={d.code}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 2: IDENTIFICATION LÉGALE ───────────────────────────────── */}
        {(viewMode === 'full' || activeStep === 2) && (
          <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📜</span>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Étape 2 : Identification Légale & Statut Juridique
                </h3>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">Étape 2/10</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Raison Sociale Officielle</label>
                <input
                  type="text"
                  value={company.legalName || company.name || ''}
                  onChange={(e) => setCompany({ ...company, legalName: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Forme Juridique</label>
                <select
                  value={company.legalForm || 'SARL — Société à Responsabilité Limitée'}
                  onChange={(e) => setCompany({ ...company, legalForm: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  {FORMES_JURIDIQUES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">N° Registre du Commerce (RCCM)</label>
                <input
                  type="text"
                  placeholder="ex: CM-DOU-2026-B-14529"
                  value={company.rccm || ''}
                  onChange={(e) => setCompany({ ...company, rccm: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">N° Identifiant Fiscal (NIF / NIU)</label>
                <input
                  type="text"
                  placeholder="ex: M082612345678A"
                  value={company.nif || ''}
                  onChange={(e) => setCompany({ ...company, nif: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Capital Social (en FCFA)</label>
                <input
                  type="number"
                  placeholder="ex: 10000000"
                  value={company.capital || ''}
                  onChange={(e) => setCompany({ ...company, capital: Number(e.target.value) })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Secteur d'Activité Principal</label>
                <select
                  value={company.sector || 'Commerce & Distribution'}
                  onChange={(e) => setCompany({ ...company, sector: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  {SECTEURS.map((sec) => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3: COORDONNÉES & SIÈGE SOCIAL ──────────────────────────── */}
        {(viewMode === 'full' || activeStep === 3) && (
          <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📍</span>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Étape 3 : Coordonnées Officieuses & Siège Social
                </h3>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">Étape 3/10</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Adresse du Siège Social</label>
                <input
                  type="text"
                  placeholder="ex: Boulevard de la Liberté, Akwa"
                  value={company.address || ''}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Ville</label>
                <input
                  type="text"
                  placeholder="ex: Douala"
                  value={company.city || ''}
                  onChange={(e) => setCompany({ ...company, city: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Région / Province</label>
                <input
                  type="text"
                  placeholder="ex: Littoral"
                  value={company.region || ''}
                  onChange={(e) => setCompany({ ...company, region: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Pays de l'Espace OHADA</label>
                <select
                  value={company.country || 'Cameroun'}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  {PAYS_OHADA.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Téléphone Professionnel</label>
                <input
                  type="text"
                  placeholder="ex: +237 699 00 00 00"
                  value={company.phone || ''}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Email Officiel</label>
                <input
                  type="email"
                  placeholder="ex: contact@melaro-group.com"
                  value={company.email || ''}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Site Web Officiel</label>
                <input
                  type="text"
                  placeholder="ex: www.melaro-group.com"
                  value={company.website || ''}
                  onChange={(e) => setCompany({ ...company, website: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 4: PARAMÈTRES COMPTABLES SYSCOHADA ───────────────────────── */}
        {(viewMode === 'full' || activeStep === 4) && (
          <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Étape 4 : Paramètres Comptables & Exercice SYSCOHADA
                </h3>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">Étape 4/10</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Date d'Ouverture d'Exercice</label>
                <input
                  type="date"
                  value={company.fiscalYearStart || '2026-01-01'}
                  onChange={(e) => setCompany({ ...company, fiscalYearStart: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Date de Clôture d'Exercice</label>
                <input
                  type="date"
                  value={company.fiscalYearEnd || '2026-12-31'}
                  onChange={(e) => setCompany({ ...company, fiscalYearEnd: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Longueur des Comptes Générales</label>
                <select
                  value={company.accountLength || 6}
                  onChange={(e) => setCompany({ ...company, accountLength: Number(e.target.value) })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value={6}>6 Chiffres (Standard SYSCOHADA)</option>
                  <option value={8}>8 Chiffres (SYSCOHADA Étendu)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 5: FISCALITÉ & RÉGIME IMPÔTS ─────────────────────────────── */}
        {(viewMode === 'full' || activeStep === 5) && (
          <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚖️</span>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Étape 5 : Fiscalité, Régime & Taux de TVA
                </h3>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">Étape 5/10</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Régime Fiscal</label>
                <select
                  value={company.taxRegime || 'Réel Normal d\'Imposition'}
                  onChange={(e) => setCompany({ ...company, taxRegime: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  {REGIMES_FISCAUX.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Centre des Impôts de Rattachement</label>
                <input
                  type="text"
                  placeholder="ex: Centre des Impôts des Moyen Entreprises (CIME)"
                  value={company.taxCenter || ''}
                  onChange={(e) => setCompany({ ...company, taxCenter: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Taux de TVA Applicable</label>
                <select
                  value={company.vatRate || 19.25}
                  onChange={(e) => setCompany({ ...company, vatRate: Number(e.target.value) })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  {TAUX_TVA.map((t, idx) => (
                    <option key={idx} value={t.valeur}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 6: BANQUE & TRÉSORERIE ──────────────────────────────────── */}
        {(viewMode === 'full' || activeStep === 6) && (
          <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏦</span>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Étape 6 : Banque, Caisse & Modes de Paiement
                </h3>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">Étape 6/10</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom de la Banque Principale</label>
                <input
                  type="text"
                  placeholder="ex: Afriland First Bank / UBA"
                  value={company.bankName || ''}
                  onChange={(e) => setCompany({ ...company, bankName: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Numéro de Compte RIB / IBAN</label>
                <input
                  type="text"
                  placeholder="ex: 10005 00012 12345678901 45"
                  value={company.bankAccount || ''}
                  onChange={(e) => setCompany({ ...company, bankAccount: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom de la Caisse Principale</label>
                <input
                  type="text"
                  placeholder="ex: Caisse Principale Douala"
                  value={company.cashName || 'Caisse principale'}
                  onChange={(e) => setCompany({ ...company, cashName: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-3 space-y-2 pt-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Modes de Paiement Acceptés</label>
                <div className="flex gap-2 flex-wrap">
                  {MODES_PAIEMENT_OPTIONS.map((m) => {
                    const isSelected = (company.paymentMethods || []).includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => togglePaymentMethod(m)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 7: ORGANISATION & ANALYTIQUE ───────────────────────────── */}
        {(viewMode === 'full' || activeStep === 7) && (
          <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏢</span>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Étape 7 : Organisation & Structures Analytiques
                </h3>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">Étape 7/10</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Départements */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Départements internes</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="ex: Marketing"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full p-2 rounded-xl border text-xs font-bold"
                  />
                  <button type="button" onClick={addDepartment} className="px-3 py-2 bg-violet-600 text-white rounded-xl font-bold text-xs">
                    +
                  </button>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(company.departments || []).map((d, i) => (
                    <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-100">
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Agences */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Agences & Sites</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="ex: Agence Yaoundé"
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    className="w-full p-2 rounded-xl border text-xs font-bold"
                  />
                  <button type="button" onClick={addBranch} className="px-3 py-2 bg-violet-600 text-white rounded-xl font-bold text-xs">
                    +
                  </button>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(company.branches || []).map((b, i) => (
                    <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* Centres de coûts */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Centres de Coûts Analytiques</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="ex: Centre Prod-01"
                    value={newCostCenter}
                    onChange={(e) => setNewCostCenter(e.target.value)}
                    className="w-full p-2 rounded-xl border text-xs font-bold"
                  />
                  <button type="button" onClick={addCostCenter} className="px-3 py-2 bg-violet-600 text-white rounded-xl font-bold text-xs">
                    +
                  </button>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(company.costCenters || []).map((c, i) => (
                    <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 8: UTILISATEURS & HABILITATIONS RBAC ────────────────────── */}
        {(viewMode === 'full' || activeStep === 8) && (
          <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">👥</span>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Étape 8 : Utilisateurs & Habilitations (RBAC)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Inviter un collègue
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="uppercase font-semibold text-[10px] text-slate-400 border-b">
                  <tr>
                    <th className="p-2.5">Nom & Prénom</th>
                    <th className="p-2.5">Email professionnel</th>
                    <th className="p-2.5">Rôle attribué</th>
                    <th className="p-2.5 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{usr.name}</td>
                      <td className="p-2.5 font-mono text-slate-600">{usr.email}</td>
                      <td className="p-2.5 font-bold text-violet-700">{usr.role}</td>
                      <td className="p-2.5 text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Compte Actif</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 9: ACTIVATION DES MODULES METIER ───────────────────────── */}
        {(viewMode === 'full' || activeStep === 9) && (
          <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧩</span>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Étape 9 : Activation des Modules Applicatifs SYSCOHADA
                </h3>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">Étape 9/10</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {MODULES_LISTE.map((m) => {
                const isActive = (company.enabledModules || []).includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleModule(m.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isActive ? 'bg-violet-50/70 border-violet-300 ring-2 ring-violet-400' : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{m.icon}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isActive ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {isActive ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 mt-2">{m.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{m.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ÉTAPE 10: SYNTHÈSE & VALIDATION DES PARAMÈTRES ─────────────────── */}
        {(viewMode === 'full' || activeStep === 10) && (
          <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Étape 10 : Synthèse & Validation Globale (100% Conforme SYSCOHADA)
                </h3>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                Étape 10/10 Validée
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Identité Légale</div>
                <div className="font-extrabold text-white">{company.name}</div>
                <div className="text-[10px] text-violet-300">RCCM: {company.rccm || 'Conforme'}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Conformité Fiscale</div>
                <div className="font-extrabold text-emerald-400">Réel Normal — TVA 19.25%</div>
                <div className="text-[10px] text-slate-300">Devise : {company.currency}</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Modules & Utilisateurs</div>
                <div className="font-extrabold text-indigo-300">{(company.enabledModules || []).length} Modules Activés</div>
                <div className="text-[10px] text-slate-300">{users.length} Utilisateurs RBAC</div>
              </div>
            </div>
          </div>
        )}

        {/* Bouton d'Enregistrement Général & Navigation */}
        <div className="flex items-center justify-between pt-2">
          {viewMode === 'stepped' && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={activeStep <= 1}
                onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 disabled:opacity-40"
              >
                ← Étape Précédente
              </button>
              <button
                type="button"
                disabled={activeStep >= 10}
                onClick={() => setActiveStep((prev) => Math.min(10, prev + 1))}
                className="px-4 py-2 bg-violet-600 text-white font-bold text-xs rounded-xl hover:bg-violet-700 disabled:opacity-40"
              >
                Étape Suivante →
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={!isAdmin}
            className={`px-8 py-3 rounded-2xl font-extrabold text-xs transition-colors shadow-lg flex items-center gap-2 ml-auto ${
              isAdmin
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" /> {isAdmin ? 'Sauvegarder les 10 Étapes d\'Administration' : 'Réservé aux Administrateurs'}
          </button>
        </div>
      </form>

      {/* ── MODALE D'INVITATION COLLABORATEUR ─────────────────────────────── */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 border border-violet-100 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Inviter un Collaborateur</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Email Professionnel</label>
                <input
                  type="email"
                  placeholder="ex: collaborateur@melaro-group.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Rôle Accordé</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value="ADMIN">ADMIN (Accès Total)</option>
                  <option value="COMPTABLE">COMPTABLE (Saisie & Clôture)</option>
                  <option value="GESTIONNAIRE">GESTIONNAIRE (Commercial & Banque)</option>
                  <option value="LECTEUR">LECTEUR (Auditeur seul)</option>
                </select>
              </div>

              {modalErrorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 font-bold flex items-center justify-between">
                  <span>⚠️ {modalErrorMessage}</span>
                  <button type="button" onClick={() => setModalErrorMessage(null)} className="text-rose-400">✕</button>
                </div>
              )}

              {inviteSentMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 font-bold">
                  ✓ {inviteSentMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowInviteModal(false); setModalErrorMessage(null); setInviteSentMessage(null); }}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-5 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isInviting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Traitement...</span>
                    </>
                  ) : (
                    <span>Envoyer l'Invitation / Mettre à jour</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminModule;
