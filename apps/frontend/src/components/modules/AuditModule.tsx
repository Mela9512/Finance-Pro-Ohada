import React, { useEffect, useState } from 'react';
import { ShieldCheck, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { AuditLogEntry, AuditLogPage } from '@financepro/shared';
import { api } from '../../services/api';

const ACTION_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: 'Connexion réussie',
  COMPANY_REGISTERED: "Création de l'entreprise",
  PASSWORD_RESET_COMPLETED: 'Réinitialisation du mot de passe',
  INVITE_ACCEPTED: 'Invitation acceptée',
  JOURNAL_ENTRY_CREATED: 'Écriture comptable créée',
  INVOICE_VALIDATED: 'Facture validée',
  COMPANY_UPDATED: "Paramètres de l'entreprise modifiés",
  ONBOARDING_COMPLETED: "Onboarding terminé",
  EXERCICE_CLOSED: "Clôture de l'exercice comptable",
  EXERCICE_REOPENED: "Réouverture de l'exercice comptable",
  USER_CREATED: 'Utilisateur créé',
  USER_INVITED: 'Utilisateur invité',
};

const actionLabel = (action: string) => ACTION_LABELS[action] ?? action;

const metadataSummary = (metadata: Record<string, unknown> | null): string => {
  if (!metadata) return '—';
  const entries = Object.entries(metadata);
  if (entries.length === 0) return '—';
  return entries.map(([k, v]) => `${k}: ${v}`).join(' · ');
};

export const AuditModule: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [actionFilter, setActionFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<AuditLogPage | null>(null);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditActions().then(setAvailableActions).catch(() => setAvailableActions([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .getAuditLog({ page, limit, action: actionFilter || undefined, from: from || undefined, to: to || undefined, search: searchTerm || undefined })
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, limit, actionFilter, from, to, searchTerm]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setPage(1);
    setter(v);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#EDE9FE] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center flex-shrink-0 shadow-lg">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wider text-[#1E1060]">Piste d'audit</h2>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Historique réel des actions sensibles réalisées sur votre organisation (connexions, validations, modifications).
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-[#EDE9FE] shadow-sm">
        <Filter className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleFilterChange(setSearchTerm)(e.target.value)}
          placeholder="Rechercher (utilisateur, action...)"
          className="glass-input rounded-lg px-3 py-1.5 text-xs w-48"
        />
        <select
          value={actionFilter}
          onChange={(e) => handleFilterChange(setActionFilter)(e.target.value)}
          className="glass-input rounded-lg px-3 py-1.5 text-xs"
        >
          <option value="">Toutes les actions</option>
          {availableActions.map((a) => (
            <option key={a} value={a}>{actionLabel(a)}</option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => handleFilterChange(setFrom)(e.target.value)}
          className="glass-input rounded-lg px-3 py-1.5 text-xs"
          title="Depuis le"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => handleFilterChange(setTo)(e.target.value)}
          className="glass-input rounded-lg px-3 py-1.5 text-xs"
          title="Jusqu'au"
        />
        {(actionFilter || from || to || searchTerm) && (
          <button
            onClick={() => { setActionFilter(''); setFrom(''); setTo(''); setSearchTerm(''); setPage(1); }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#EDE9FE] shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-[#EDE9FE] text-left text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="px-4 py-3">Date &amp; heure</th>
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entité</th>
              <th className="px-4 py-3">Détails</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">Chargement...</td></tr>
            )}
            {!loading && data && data.items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">Aucune action enregistrée pour ces critères.</td></tr>
            )}
            {!loading && data?.items.map((entry: AuditLogEntry) => (
              <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">{formatDateTime(entry.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-800">{entry.userName}</div>
                  <div className="text-[10px] text-slate-400">{entry.userEmail}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded-full bg-violet-50 text-violet-700 font-bold text-[10px]">{actionLabel(entry.action)}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{entry.entityType ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={metadataSummary(entry.metadata)}>
                  {metadataSummary(entry.metadata)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{data.total} action{data.total > 1 ? 's' : ''} enregistrée{data.total > 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold">Page {page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditModule;
