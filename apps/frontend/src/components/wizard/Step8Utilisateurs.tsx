import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Users, Send, X, ShieldCheck, Crown } from 'lucide-react';
import { StepProps, ROLES_UTILISATEURS } from './types';
import { api, ApiError } from '../../services/api';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-blue-50 text-blue-800 border-blue-200',
  COMPTABLE: 'bg-blue-50 text-blue-800 border-blue-200',
  GESTIONNAIRE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  LECTEUR: 'bg-amber-50 text-amber-800 border-amber-200',
};

export const Step8Utilisateurs: React.FC<StepProps> = ({ data, onChange, onNext, onPrev }) => {
  const { step8 } = data;
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('accountant');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !inviteRole) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      await api.inviteUser({ email: inviteEmail.trim(), role: inviteRole });
      const roleLabel = ROLES_UTILISATEURS.find(r => r.role === inviteRole)?.label || inviteRole;
      const newInvite = { email: inviteEmail.trim(), role: inviteRole };
      onChange('step8', { invites: [...step8.invites, newInvite] });
      setSuccess(`Invitation envoyée à ${inviteEmail} — Rôle : ${roleLabel}`);
      setInviteEmail('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setSending(false);
    }
  };

  const removeInvite = (email: string) => {
    onChange('step8', { invites: step8.invites.filter(i => i.email !== email) });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleNext} className="space-y-7">
      <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Gestion des utilisateurs</h2>
          <p className="text-xs text-slate-500 mt-1">Invitez les membres de votre équipe avec des rôles spécifiques. Chaque rôle définit les droits d'accès aux modules et aux données.</p>
        </div>
      </div>

      {/* Current Admin */}
      <div>
        <div className="text-xs font-extrabold text-slate-700 mb-3 uppercase tracking-wider">Administrateur (vous)</div>
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center shadow-md shadow-blue-500/25">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-900">Votre compte</div>
            <div className="text-[10px] text-slate-500">Accès complet à tous les modules — Rôle : Administrateur</div>
          </div>
          <span className="ml-auto text-[10px] font-extrabold px-2.5 py-1 bg-[#eff6ff] text-[#1e40af] rounded-lg border border-blue-200">ADMIN</span>
        </div>
      </div>

      {/* Roles Description Grid */}
      <div>
        <div className="text-xs font-extrabold text-slate-700 mb-3 uppercase tracking-wider">Rôles disponibles</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ROLES_UTILISATEURS.map(r => (
            <div key={r.role} className={`p-3 rounded-xl border ${ROLE_COLORS[r.role]} flex items-start gap-2`}>
              <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-extrabold">{r.label}</div>
                <div className="text-[10px] font-semibold opacity-80 mt-0.5">{r.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Form */}
      <div>
        <div className="text-xs font-extrabold text-slate-700 mb-3 uppercase tracking-wider">Inviter un collaborateur</div>
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="email@collaborateur.cg"
            className="flex-1 bg-[#f8fafc] border border-slate-200 focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3 text-xs text-slate-900 font-bold outline-none transition-all"
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className="bg-[#f8fafc] border border-slate-200 focus:bg-white focus:border-[#2563eb] rounded-2xl px-3 py-3 text-xs text-slate-900 font-bold outline-none transition-all cursor-pointer"
          >
            {ROLES_UTILISATEURS.map(r => <option key={r.role} value={r.role}>{r.label}</option>)}
          </select>
          <button
            type="button"
            onClick={sendInvite}
            disabled={sending || !inviteEmail}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-extrabold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {sending ? '...' : 'Inviter'}
          </button>
        </div>

        {error && <p className="text-red-600 text-xs font-semibold mt-2 bg-red-50 border border-red-200 rounded-xl p-2">{error}</p>}
        {success && <p className="text-emerald-700 text-xs font-semibold mt-2 bg-emerald-50 border border-emerald-200 rounded-xl p-2">✓ {success}</p>}
      </div>

      {/* Invitations Sent */}
      {step8.invites.length > 0 && (
        <div>
          <div className="text-xs font-extrabold text-slate-700 mb-3 uppercase tracking-wider">Invitations envoyées ({step8.invites.length})</div>
          <div className="space-y-2">
            {step8.invites.map(inv => {
              const roleInfo = ROLES_UTILISATEURS.find(r => r.role === inv.role);
              return (
                <div key={inv.email} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900">{inv.email}</span>
                    <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${ROLE_COLORS[inv.role]}`}>{roleInfo?.label}</span>
                  </div>
                  <button type="button" onClick={() => removeInvite(inv.email)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800">
        <span className="font-extrabold">📧 Invitation par e-mail :</span> Chaque collaborateur recevra un e-mail avec un lien d'activation sécurisé. Il pourra définir son mot de passe et accéder directement à son espace.
      </div>

      <div className="flex justify-between pt-4 border-t border-slate-100">
        <button type="button" onClick={onPrev}
          className="flex items-center gap-2 px-6 py-3 rounded-full border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all">
          <ArrowLeft className="w-4 h-4" /> Précédent
        </button>
        <button type="submit"
          className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white font-extrabold text-sm shadow-lg shadow-blue-500/30 transition-all active:scale-[0.99]">
          Suivant <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

export default Step8Utilisateurs;
