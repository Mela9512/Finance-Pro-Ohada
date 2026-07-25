import React, { useEffect, useState } from 'react';
import { Building2, Users, CheckCircle, Lock, Unlock, Send } from 'lucide-react';
import { Company, User, UserRole } from '@financepro/shared';
import { api, ApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const AdminModule: React.FC = () => {
  const { refreshCompany } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('COMPTABLE');
  const [inviteSentMessage, setInviteSentMessage] = useState<string | null>(null);

  const load = () => {
    api.getCompany().then(setCompany);
    api.getUsers().then(setUsers);
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
        rccm: company.rccm,
        nif: company.nif,
        address: company.address,
        city: company.city,
        country: company.country,
        currency: company.currency,
      });
      setCompany(updated);
      await refreshCompany();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour');
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
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Erreur lors de l'envoi de l'invitation");
    }
  };

  if (!company) {
    return <div className="p-8 text-center text-slate-400">Chargement des paramètres de l'entreprise...</div>;
  }

  return (
    <div className="space-y-6">
      {errorMessage && <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">{errorMessage}</div>}

      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Paramètres de l'Entreprise</h3>
          </div>
          <button
            onClick={handleToggleExercice}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${
              company.isExerciceClosed
                ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
            }`}
          >
            {company.isExerciceClosed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{company.isExerciceClosed ? 'Exercice Clôturé' : 'Exercice Ouvert'}</span>
          </button>
        </div>

        <form onSubmit={handleSaveCompany} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Raison Sociale de la Société</label>
              <input
                type="text"
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className="w-full glass-input rounded-lg px-3 py-2 text-xs font-bold text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">RCCM (Registre du Commerce)</label>
              <input
                type="text"
                value={company.rccm || ''}
                onChange={(e) => setCompany({ ...company, rccm: e.target.value })}
                placeholder="Ex: CG-BZV-01-2026-B14-00001"
                className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">NIF (Numéro d'Identification Fiscale)</label>
              <input
                type="text"
                value={company.nif || ''}
                onChange={(e) => setCompany({ ...company, nif: e.target.value })}
                placeholder="Ex: M20260000001"
                className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Devise de Tenue de Compte</label>
              <select
                value={company.currency}
                onChange={(e) => setCompany({ ...company, currency: e.target.value })}
                className="w-full glass-input rounded-lg px-3 py-2 text-xs"
              >
                <option value="XAF">XAF - Franc CFA (Afrique Centrale / CEMAC)</option>
                <option value="XOF">XOF - Franc CFA (Afrique de l'Ouest / UEMOA)</option>
                <option value="EUR">EUR - Euro</option>
                <option value="USD">USD - Dollar Américain</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            {isSaved ? (
              <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>Paramètres enregistrés avec succès !</span>
              </span>
            ) : (
              <span></span>
            )}

            <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg">
              Enregistrer les Modifications
            </button>
          </div>
        </form>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gestion des Utilisateurs & Rôles (RBAC)</h3>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Inviter un collègue</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3">Nom & Prénom</th>
                <th className="p-3">Email professionnel</th>
                <th className="p-3">Rôle attribué</th>
                <th className="p-3">Date de création</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((usr) => (
                <tr key={usr.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-bold text-white">{usr.name}</td>
                  <td className="p-3 text-slate-300 font-mono">{usr.email}</td>
                  <td className="p-3 font-semibold">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      usr.role === 'ADMIN' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {usr.role}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 font-mono">{String(usr.createdAt).substring(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md space-y-4 border border-slate-700">
            <h3 className="text-base font-bold text-white">Inviter un collègue</h3>
            <p className="text-xs text-slate-400">
              Un email d'invitation lui sera envoyé. Il définira lui-même son mot de passe en acceptant l'invitation.
            </p>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email professionnel</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Rôle</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as UserRole)} className="w-full glass-input rounded-lg px-3 py-2 text-xs">
                  <option value="ADMIN">ADMIN</option>
                  <option value="COMPTABLE">COMPTABLE</option>
                  <option value="GESTIONNAIRE">GESTIONNAIRE</option>
                  <option value="LECTEUR">LECTEUR</option>
                </select>
              </div>

              {errorMessage && <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">{errorMessage}</div>}
              {inviteSentMessage && <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-lg p-3">{inviteSentMessage}</div>}

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold">
                  Fermer
                </button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">
                  Envoyer l'invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
