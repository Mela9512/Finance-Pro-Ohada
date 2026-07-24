import React, { useState } from 'react';
import { Settings, Building2, Users, Lock, ShieldCheck, Plus, CheckCircle } from 'lucide-react';
import { Company, User } from '@financepro/shared';

export const AdminModule: React.FC = () => {
  const [company, setCompany] = useState<Company>({
    id: 'comp-1',
    name: 'SOCIÉTÉ CONGO TRADING SA',
    rccm: 'CG-BZV-01-2024-B14-00129',
    nif: 'M08241198234A',
    address: '142 Avenue de l\'Indépendance, Poto-Poto',
    city: 'Brazzaville',
    country: 'Congo',
    currency: 'XAF',
    fiscalYearStart: '2026-01-01',
    fiscalYearEnd: '2026-12-31'
  });

  const [users, setUsers] = useState<User[]>([
    { id: 'usr-1', email: 'admin@financpro.ci', name: 'Alain KOUASSI', role: 'ADMIN', companyId: 'comp-1', createdAt: '2026-01-10' },
    { id: 'usr-2', email: 'comptable@financpro.ci', name: 'Fatou DIOP', role: 'COMPTABLE', companyId: 'comp-1', createdAt: '2026-01-15' },
    { id: 'usr-3', email: 'gestionnaire@financpro.ci', name: 'Marc BIKOKO', role: 'GESTIONNAIRE', companyId: 'comp-1', createdAt: '2026-02-01' }
  ]);

  const [isSaved, setIsSaved] = useState(false);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Company Config Card */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
          <Building2 className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Paramètres de l'Entreprise (Multi-Sociétés SYSCOHADA)</h3>
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
                value={company.rccm}
                onChange={(e) => setCompany({ ...company, rccm: e.target.value })}
                className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono text-emerald-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">NIF (Numéro d'Identification Fiscale)</label>
              <input
                type="text"
                value={company.nif}
                onChange={(e) => setCompany({ ...company, nif: e.target.value })}
                className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono text-emerald-400"
                required
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

            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg"
            >
              Enregistrer les Modifications
            </button>
          </div>
        </form>
      </div>

      {/* Users & RBAC Roles */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gestion des Utilisateurs & Rôles (RBAC)</h3>
          </div>
          <span className="text-xs text-slate-400">Contrôle d'accès strict par profil</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3">Nom & Prénom</th>
                <th className="p-3">Email professionnel</th>
                <th className="p-3">Rôle attribué</th>
                <th className="p-3">Date de création</th>
                <th className="p-3 text-right">Statut</th>
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
                  <td className="p-3 text-slate-400 font-mono">{usr.createdAt}</td>
                  <td className="p-3 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      ACTIF
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
