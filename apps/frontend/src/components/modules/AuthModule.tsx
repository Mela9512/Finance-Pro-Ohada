import React from 'react';
import { ShieldCheck, UserCheck } from 'lucide-react';
import { User } from '@financepro/shared';

interface AuthModuleProps {
  currentUser: User;
}

export const AuthModule: React.FC<AuthModuleProps> = ({ currentUser }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
          <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">Session Active & Sécurité JWT</h3>
            <p className="text-xs text-slate-500 font-medium">Authentification sécurisée par token signé et protocole RBAC</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400">Utilisateur Connecté:</span>
            <div className="text-emerald-400 font-bold text-sm">{currentUser.name} ({currentUser.email})</div>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400">Rôle Actuel (RBAC):</span>
            <div className="text-indigo-400 font-bold text-sm flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>{currentUser.role}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Matrice des Permissions par Rôle (RBAC)</h3>
        <p className="text-xs text-slate-400">Règles appliquées côté serveur (guards NestJS), pas seulement côté interface</p>

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
                <td className="p-3 text-slate-200 font-medium">Facturation Client</td>
                <td className="p-3 text-emerald-400">Oui</td>
                <td className="p-3 text-emerald-400">Oui</td>
                <td className="p-3 text-emerald-400">Oui</td>
                <td className="p-3 text-rose-400">Non</td>
              </tr>
              <tr>
                <td className="p-3 text-slate-200 font-medium">Validation Facture / Écriture</td>
                <td className="p-3 text-emerald-400">Oui</td>
                <td className="p-3 text-emerald-400">Oui</td>
                <td className="p-3 text-rose-400">Non</td>
                <td className="p-3 text-rose-400">Non</td>
              </tr>
              <tr>
                <td className="p-3 text-slate-200 font-medium">Administration (utilisateurs, société, clôture)</td>
                <td className="p-3 text-emerald-400">Oui</td>
                <td className="p-3 text-rose-400">Non</td>
                <td className="p-3 text-rose-400">Non</td>
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
