import React, { useEffect, useState } from 'react';
import {
  Building2, Users, CheckCircle, Lock, Unlock, Send, Shield, Globe, Phone, Mail,
  MapPin, DollarSign, FileText, CreditCard, Award, ChevronRight, Check, AlertCircle
} from 'lucide-react';
import { Company, User, UserRole } from '@financepro/shared';
import { api, ApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const AdminModule: React.FC = () => {
  const { refreshCompany } = useAuth();
  const [company, setCompany] = useState<Partial<Company> | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('COMPTABLE');
  const [inviteSentMessage, setInviteSentMessage] = useState<string | null>(null);

  const load = async () => {
    try {
      const c = await api.getCompany();
      const u = await api.getUsers();
      setCompany(c);
      setUsers(u);
    } catch (err) {
      setErrorMessage("Erreur lors du chargement des données d'administration.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setErrorMessage(null);
    try {
      const updated = await api.updateCompany({
        name: company.name,
        legalName: company.legalName,
        legalForm: company.legalForm,
        rccm: company.rccm,
        nif: company.nif,
        capital: Number(company.capital) || 0,
        sector: company.sector,
        address: company.address,
        city: company.city,
        region: company.region,
        country: company.country,
        phone: company.phone,
        email: company.email,
        website: company.website,
        currency: company.currency,
        taxRegime: company.taxRegime,
        taxCenter: company.taxCenter,
        vatRate: Number(company.vatRate) || 19.25,
        accountLength: Number(company.accountLength) || 6,
        bankName: company.bankName,
        bankAccount: company.bankAccount,
        bankCode: company.bankCode,
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInviteSentMessage(null);
    try {
      const res = await api.inviteUser({ email: inviteEmail, role: inviteRole });
      setInviteSentMessage(res.message);
      setInviteEmail('');
      load();
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Erreur lors de l'envoi de l'invitation");
    }
  };

  if (!company) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold text-xs animate-pulse">
        Chargement des paramètres complets de l'entreprise...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ── Notification Erreur ou Succès ─────────────────────────────────── */}
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
          <span>Paramètres d'entreprise mis à jour avec succès selon les normes SYSCOHADA !</span>
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
                {company.legalForm || 'SARL'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Conforme au Droit Comptable SYSCOHADA Révisé — Devise : <strong className="text-violet-700">{company.currency || 'XAF'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleExercice}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm ${
              company.isExerciceClosed
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {company.isExerciceClosed ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span>{company.isExerciceClosed ? 'Exercice 2026 Clôturé' : 'Exercice 2026 Ouvert'}</span>
          </button>
        </div>
      </div>

      {/* ── Formulaire Complet d'Administration d'Entreprise ───────────────── */}
      <form onSubmit={handleSaveCompany} className="space-y-6">
        {/* SECTION 1: IDENTIFICATION LÉGALE */}
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Building2 className="w-5 h-5 text-violet-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              1. Identification Légale & Raison Sociale (Normes SYSCOHADA)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Raison Sociale (Nom Officiel)</label>
              <input
                type="text"
                value={company.name || ''}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-400"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Sigle / Nom Commercial</label>
              <input
                type="text"
                placeholder="ex: MELARO GROUP"
                value={company.legalName || ''}
                onChange={(e) => setCompany({ ...company, legalName: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Forme Juridique</label>
              <select
                value={company.legalForm || 'SARL'}
                onChange={(e) => setCompany({ ...company, legalForm: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="SARL">SARL (Société à Responsabilité Limitée)</option>
                <option value="SUARL">SUARL (Société Unipersonnelle à Resp. Limitée)</option>
                <option value="SA">SA (Société Anonyme)</option>
                <option value="SAS">SAS (Société par Actions Simplifiée)</option>
                <option value="EI">EI (Entreprise Individuelle)</option>
                <option value="GIE">GIE (Groupement d'Intérêt Économique)</option>
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
              <label className="text-[10px] font-bold text-slate-500 uppercase">Capital Social (FCFA)</label>
              <input
                type="number"
                placeholder="ex: 10000000"
                value={company.capital || ''}
                onChange={(e) => setCompany({ ...company, capital: Number(e.target.value) })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Secteur d'Activité Principal</label>
              <select
                value={company.sector || 'Commerce'}
                onChange={(e) => setCompany({ ...company, sector: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="Commerce">Commerce Général & Distribution</option>
                <option value="Services">Prestations de Services & Ingénierie</option>
                <option value="BTP">BTP, Construction & Immobilier</option>
                <option value="Industrie">Industrie & Transformation</option>
                <option value="Transport">Transport, Logistique & Transit</option>
                <option value="Agro-alimentaire">Agriculture & Agro-alimentaire</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: COORDONNÉES & SIÈGE SOCIAL */}
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              2. Coordonnées Officieuses & Siège Social
            </h3>
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
              <label className="text-[10px] font-bold text-slate-500 uppercase">Pays (Espace OHADA)</label>
              <select
                value={company.country || 'Cameroun'}
                onChange={(e) => setCompany({ ...company, country: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="Cameroun">Cameroun</option>
                <option value="Gabon">Gabon</option>
                <option value="Congo">Congo</option>
                <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                <option value="Sénégal">Sénégal</option>
                <option value="RDC">République Démocratique du Congo (RDC)</option>
                <option value="Tchad">Tchad</option>
                <option value="Centrafrique">République Centrafricaine</option>
                <option value="Togo">Togo</option>
                <option value="Bénin">Bénin</option>
                <option value="Mali">Mali</option>
                <option value="Burkina Faso">Burkina Faso</option>
                <option value="Guinée Équatoriale">Guinée Équatoriale</option>
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
              <label className="text-[10px] font-bold text-slate-500 uppercase">Email Professionnel Officiel</label>
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

        {/* SECTION 3: PARAMÈTRES COMPTABLES & FISCALITÉ */}
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              3. Paramètres Comptables & Régime Fiscal SYSCOHADA
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Devise Principale</label>
              <select
                value={company.currency || 'XAF'}
                onChange={(e) => setCompany({ ...company, currency: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="XAF">FCFA (XAF - Afrique Centrale / CEMAC)</option>
                <option value="XOF">FCFA (XOF - Afrique de l'Ouest / UEMOA)</option>
                <option value="EUR">Euro (€ - EUR)</option>
                <option value="USD">Dollar ($ - USD)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Régime Fiscal Impôts</label>
              <select
                value={company.taxRegime || 'Réel Normal'}
                onChange={(e) => setCompany({ ...company, taxRegime: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="Réel Normal">Régime du Réel Normal (AUDCIF)</option>
                <option value="Réel Simplifié">Régime du Réel Simplifié</option>
                <option value="Système Minimal de Trésorerie (SMT)">Système Minimal de Trésorerie (SMT)</option>
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
              <label className="text-[10px] font-bold text-slate-500 uppercase">Taux de TVA Standard (%)</label>
              <select
                value={company.vatRate || 19.25}
                onChange={(e) => setCompany({ ...company, vatRate: Number(e.target.value) })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value={19.25}>19,25 % (Standard CEMAC/OHADA)</option>
                <option value={18}>18,00 % (Standard UEMOA)</option>
                <option value={0}>0,00 % (Exonéré de TVA)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Longueur des Comptes Généraux</label>
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

        {/* SECTION 4: COORDONNÉES BANCAIRES */}
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              4. Coordonnées Bancaires & Trésorerie
            </h3>
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
              <label className="text-[10px] font-bold text-slate-500 uppercase">Numéro de Compte / RIB</label>
              <input
                type="text"
                placeholder="ex: 10005 00012 12345678901 45"
                value={company.bankAccount || ''}
                onChange={(e) => setCompany({ ...company, bankAccount: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Code Banque / Guichet</label>
              <input
                type="text"
                placeholder="ex: 10005-00012"
                value={company.bankCode || ''}
                onChange={(e) => setCompany({ ...company, bankCode: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Bouton d'Enregistrement Général */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-8 py-3 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 transition-colors shadow-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> Enregistrer Toutes les Modifications d'Entreprise
          </button>
        </div>
      </form>

      {/* ── SECTION 5: GESTION DES UTILISATEURS & RÔLES (RBAC) ─────────────── */}
      <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              5. Gestion des Utilisateurs & Habilitations (RBAC)
            </h3>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" /> Inviter un collègue
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="uppercase font-semibold text-[10px] text-slate-400 border-b">
              <tr>
                <th className="p-3">Utilisateur</th>
                <th className="p-3">Email professionnel</th>
                <th className="p-3">Rôle attribué</th>
                <th className="p-3">Date d'inscription</th>
                <th className="p-3 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((usr) => (
                <tr key={usr.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 font-extrabold flex items-center justify-center text-xs">
                      {usr.name ? usr.name.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                    <span>{usr.name}</span>
                  </td>
                  <td className="p-3 font-mono text-slate-600">{usr.email}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      usr.role === 'ADMIN' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {usr.role}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-500">{String(usr.createdAt).substring(0, 10)}</td>
                  <td className="p-3 text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      ✓ Compte Actif
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODALE D'INVITATION D'UN COLLÈGUE ─────────────────────────────── */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 border border-violet-100 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Inviter un Collaborateur</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <p className="text-xs text-slate-600">
              Un email d'invitation sécurisé sera transmis. Le collègue définira son mot de passe pour rejoindre <strong>{company.name}</strong>.
            </p>
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
                  <option value="ADMIN">Administrateur (Accès Total)</option>
                  <option value="COMPTABLE">Comptable (Saisie & Clôture)</option>
                  <option value="GESTIONNAIRE">Gestionnaire Commercial</option>
                  <option value="LECTEUR">Auditeur / Lecteur Seul</option>
                </select>
              </div>

              {inviteSentMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3 font-bold">
                  ✓ {inviteSentMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 shadow-sm"
                >
                  Envoyer l'Invitation
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
