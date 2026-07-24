import React, { useState } from 'react';
import { ShieldCheck, Key, Lock, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { UserRole } from '@financepro/shared';

interface AuthModuleProps {
  currentUser: { name: string; email: string; role: UserRole };
  onSwitchUserRole: (role: UserRole) => void;
}

export const AuthModule: React.FC<AuthModuleProps> = ({ currentUser, onSwitchUserRole }) => {
  const [email, setEmail] = useState('admin@financpro.ci');
  const [pass, setPass] = useState('••••••••••••');
  const [token, setToken] = useState<string | null>(`jwt_token_ohada_session_${Date.now()}`);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const newToken = `jwt_token_session_${Date.now()}`;
    setToken(newToken);
    alert('Authentification JWT réussie ! Token de session renouvelé.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Active Session Card */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">État de l'Authentification JWT & Session Active</h3>
            <p className="text-xs text-slate-400">Jeton sécurisé avec algorithme HMAC SHA-256</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400">Utilisateur Connecté:</span>
            <div className="text-emerald-400 font-bold text-sm">{currentUser.name} ({currentUser.email})</div>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400">Rôle Actuel (RBAC):</span>
            <div className="text-indigo-400 font-bold text-sm">{currentUser.role}</div>
          </div>
        </div>

        {token && (
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 font-mono">Bearer JWT Token:</span>
            <div className="text-[11px] font-mono text-slate-300 truncate">{token}</div>
          </div>
        )}
      </div>

      {/* Permissions Matrix */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Matrice des Permissions par Rôle (RBAC)</h3>
        <p className="text-xs text-slate-400">Sécurité et étanchéité de la comptabilité OHADA</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3">Module / Action</th>
                <th className="p-3">ADMIN</th>
                <th className="p-3">COMPTABLE</th>
                <th className="p-3">GESTIONNAIRE</th>
                <th className="p-3">LECTEUR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="p-3 text-slate-200 font-medium">Saisie Écritures Journal</td>
                <td className="p-3 text-emerald-400">Oui</td>
                <td className="p-3 text-emerald-400">Oui</td>
                <td className="p-3 text-rose-400">Non</td>
                <td className="p-3 text-rose-400">Non</td>
              </tr>
              <tr>
                <td className="p-3 text-slate-200 font-medium">Validation & Clôture Exercice</td>
                <td className="p-3 text-emerald-400">Oui</td>
                <td className="p-3 text-rose-400">Non</td>
                <td className="p-3 text-rose-400">Non</td>
                <td className="p-3 text-rose-400">Non</td>
              </tr>
              <tr>
                <td className="p-3 text-slate-200 font-medium">Facturation Client</td>
                <td className="p-3 text-emerald-400">Oui</td>
                <td className="p-3 text-emerald-400">Oui</td>
                <td className="p-3 text-emerald-400">Oui</td>
                <td className="p-3 text-rose-400">Non</td>
              </tr>
              <tr>
                <td className="p-3 text-slate-200 font-medium">Consultation Bilan & Compte de Résultat</td>
                <td className="p-3 text-emerald-400">Oui</td>
                <td className="p-3 text-emerald-400">Oui</td>
                <td className="p-3 text-emerald-400">Oui</td>
                <td className="p-3 text-emerald-400">Oui (Lecture seule)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
