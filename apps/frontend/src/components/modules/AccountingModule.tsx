import React, { useState, useEffect } from 'react';
import {
  BookOpen, PlusCircle, CheckCircle2, AlertTriangle,
  Search, FileSpreadsheet, Layers, Filter, Scale, Download, Printer, Sparkles
} from 'lucide-react';
import { AccountSYSCOHADA, JournalEntry, JournalLine, AccountSuggestion } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

interface BalanceRow {
  code: string;
  label: string;
  debit: number;
  credit: number;
  soldeDebiteur: number;
  soldeCrediteur: number;
}

interface GrandLivreRow {
  date: string;
  pieceNumber: string;
  journalType: string;
  accountCode: string;
  accountLabel: string;
  wording: string;
  debit: number;
  credit: number;
}

export const AccountingModule: React.FC = () => {
  const [tab, setTab] = useState<'saisie' | 'journal' | 'grand-livre' | 'balance' | 'plan'>('saisie');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<AccountSYSCOHADA[]>([]);
  const [balanceRows, setBalanceRows] = useState<BalanceRow[]>([]);
  const [grandLivreLines, setGrandLivreLines] = useState<GrandLivreRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [journalType, setJournalType] = useState<'ACHATS' | 'VENTES' | 'BANQUE' | 'CAISSE' | 'OD'>('VENTES');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [wording, setWording] = useState('');
  const [pieceNumber, setPieceNumber] = useState('');
  const [lines, setLines] = useState<Array<Pick<JournalLine, 'accountCode' | 'accountLabel' | 'debit' | 'credit'>>>([
    { accountCode: '411', accountLabel: 'Clients, Ventes de biens et services', debit: 0, credit: 0 },
    { accountCode: '701', accountLabel: 'Ventes de marchandises', debit: 0, credit: 0 },
    { accountCode: '443', accountLabel: 'État, TVA facturée sur ventes', debit: 0, credit: 0 },
  ]);

  const [searchAccount, setSearchAccount] = useState('');
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [grandLivreFilter, setGrandLivreFilter] = useState('411');

  const [accountSuggestion, setAccountSuggestion] = useState<AccountSuggestion | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  const loadEntries = () => api.getEntries().then(setEntries);

  useEffect(() => {
    api.getAccounts().then(setAccounts);
    loadEntries();
  }, []);

  useEffect(() => {
    setAccountSuggestion(null);
    if (wording.trim().length < 5) return;
    const timeout = setTimeout(() => {
      setSuggestionLoading(true);
      api.aiSuggestAccount(wording.trim())
        .then(setAccountSuggestion)
        .catch(() => setAccountSuggestion(null))
        .finally(() => setSuggestionLoading(false));
    }, 800);
    return () => clearTimeout(timeout);
  }, [wording]);

  const applySuggestion = () => {
    if (!accountSuggestion) return;
    handleLineChange(0, 'accountCode', accountSuggestion.accountCode);
  };

  useEffect(() => {
    if (tab === 'grand-livre') {
      api.getGrandLivre(grandLivreFilter || undefined).then(setGrandLivreLines);
    }
    if (tab === 'balance') {
      api.getBalance().then(setBalanceRows);
    }
  }, [tab, grandLivreFilter]);

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleAddLine = () => {
    setLines([...lines, { accountCode: '601', accountLabel: 'Achats de marchandises', debit: 0, credit: 0 }]);
  };

  const handleLineChange = (index: number, field: 'accountCode' | 'debit' | 'credit', value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    if (field === 'accountCode') {
      const acc = accounts.find((a) => a.code === value);
      if (acc) newLines[index].accountLabel = acc.label;
    }
    setLines(newLines);
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;
    setErrorMessage(null);

    try {
      await api.createEntry({
        date,
        journalType,
        wording: wording || 'Écriture comptable libre',
        pieceNumber: pieceNumber || 'PIECE-001',
        lines: lines.map((l) => ({ ...l, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })) as JournalLine[],
      });
      await loadEntries();
      setWording('');
      setPieceNumber('');
      setTab('journal');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement de l'écriture");
    }
  };

  const totalBalanceDebit = balanceRows.reduce((s, r) => s + r.debit, 0);
  const totalBalanceCredit = balanceRows.reduce((s, r) => s + r.credit, 0);

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch = acc.code.includes(searchAccount) || acc.label.toLowerCase().includes(searchAccount.toLowerCase());
    const matchesClass = selectedClass === null || acc.classNum === selectedClass;
    return matchesSearch && matchesClass;
  });

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 bg-white p-4 rounded-2xl" style={{ border: '1.5px solid #EDE9FE', boxShadow: '0 1px 6px rgba(107,78,255,0.05)' }}>
        <button
          onClick={() => setTab('saisie')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'saisie' ? 'text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'
          }`}
          style={tab === 'saisie' ? { background: '#6B4EFF' } : {}}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Saisie Écriture Double Entrée</span>
        </button>

        <button
          onClick={() => setTab('journal')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'journal' ? 'text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'
          }`}
          style={tab === 'journal' ? { background: '#6B4EFF' } : {}}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Journal Général ({entries.length})</span>
        </button>

        <button
          onClick={() => setTab('grand-livre')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'grand-livre' ? 'text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'
          }`}
          style={tab === 'grand-livre' ? { background: '#6B4EFF' } : {}}
        >
          <Layers className="w-4 h-4" />
          <span>Grand Livre des Comptes</span>
        </button>

        <button
          onClick={() => setTab('balance')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'balance' ? 'text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'
          }`}
          style={tab === 'balance' ? { background: '#6B4EFF' } : {}}
        >
          <Scale className="w-4 h-4" />
          <span>Balance Générale</span>
        </button>

        <button
          onClick={() => setTab('plan')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'plan' ? 'text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'
          }`}
          style={tab === 'plan' ? { background: '#6B4EFF' } : {}}
        >
          <BookOpen className="w-4 h-4" />
          <span>Plan Comptable SYSCOHADA</span>
        </button>
      </div>

      {tab === 'saisie' && (
        <form onSubmit={handleSubmitEntry} className="bg-white rounded-2xl p-6 space-y-6" style={{ border: '1.5px solid #EDE9FE', boxShadow: '0 2px 12px rgba(107,78,255,0.05)' }}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-extrabold" style={{ color: '#1E1060' }}>Nouvelle Écriture Comptable SYSCOHADA</h3>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Le système vérifie automatiquement le principe d'équivalence Débit = Crédit</p>
            </div>

            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-bold font-mono ${
              isBalanced ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {isBalanced ? <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} /> : <AlertTriangle className="w-4 h-4" style={{ color: '#EF4444' }} />}
              <span>{isBalanced ? 'ÉCRITURE ÉQUILIBRÉE' : `DÉSÉQUILIBRE: ${formatMoney(Math.abs(totalDebit - totalCredit))}`}</span>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3">{errorMessage}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Journal Comptable</label>
              <select
                value={journalType}
                onChange={(e) => setJournalType(e.target.value as any)}
                className="w-full glass-input rounded-lg px-3 py-2 text-xs"
              >
                <option value="VENTES">Journal des VENTES (VT)</option>
                <option value="ACHATS">Journal des ACHATS (AC)</option>
                <option value="BANQUE">Journal de BANQUE (BQ)</option>
                <option value="CAISSE">Journal de CAISSE (CA)</option>
                <option value="OD">Opérations Diverses (OD)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Date d'opération</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Libellé de l'écriture</label>
              <input
                type="text"
                value={wording}
                onChange={(e) => setWording(e.target.value)}
                placeholder="Ex: Facture vente client X..."
                className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                required
              />
              {suggestionLoading && <div className="text-[10px] text-slate-500 italic mt-1">Suggestion IA en cours...</div>}
              {accountSuggestion && (
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="mt-1 flex items-center gap-1 text-[10px] text-indigo-300 hover:text-indigo-200"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Compte suggéré : {accountSuggestion.accountCode} - {accountSuggestion.label} (appliquer à la 1ère ligne)</span>
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">N° Pièce justificative</label>
              <input
                type="text"
                value={pieceNumber}
                onChange={(e) => setPieceNumber(e.target.value)}
                placeholder="Ex: FAC-2026-098"
                className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                required
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-white uppercase font-semibold text-[10px]" style={{ background: 'linear-gradient(90deg, #6B4EFF 0%, #8B72FF 100%)' }}>
                <tr>
                  <th className="p-3 w-36">Code Compte SYSCOHADA</th>
                  <th className="p-3">Intitulé du Compte</th>
                  <th className="p-3 w-40 text-right">Débit (XAF)</th>
                  <th className="p-3 w-40 text-right">Crédit (XAF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {lines.map((line, idx) => (
                  <tr key={idx}>
                    <td className="p-2">
                      <select
                        value={line.accountCode}
                        onChange={(e) => handleLineChange(idx, 'accountCode', e.target.value)}
                        className="w-full glass-input rounded px-2 py-1 text-xs font-mono"
                      >
                        {accounts.map((acc) => (
                          <option key={acc.code} value={acc.code}>
                            {acc.code} - {acc.label.substring(0, 25)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2" style={{ color: '#374151' }}>{line.accountLabel}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        value={line.debit || ''}
                        onChange={(e) => handleLineChange(idx, 'debit', Number(e.target.value))}
                        placeholder="0"
                        className="w-full glass-input rounded px-2 py-1 text-xs text-right font-mono font-bold" style={{ color: '#10B981' }}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        value={line.credit || ''}
                        onChange={(e) => handleLineChange(idx, 'credit', Number(e.target.value))}
                        placeholder="0"
                        className="w-full glass-input rounded px-2 py-1 text-xs text-right font-mono font-bold" style={{ color: '#EF4444' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="font-bold text-xs" style={{ background: '#F3F0FF', borderTop: '1.5px solid #DDD6FE' }}>
                <tr>
                  <td colSpan={2} className="p-3 text-right font-sans" style={{ color: '#1E1060' }}>TOTAL ÉCRITURE :</td>
                  <td className="p-3 text-right font-mono text-emerald-400">{formatMoney(totalDebit)}</td>
                  <td className="p-3 text-right font-mono text-rose-400">{formatMoney(totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleAddLine}
              className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: '#F3F0FF', color: '#6B4EFF', border: '1px solid #DDD6FE' }}
            >
              + Ajouter une ligne de compte
            </button>

            <button
              type="submit"
              disabled={!isBalanced}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg ${
                isBalanced ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Valider & Inscrire au Journal
            </button>
          </div>
        </form>
      )}

      {tab === 'journal' && (
        <div className="rounded-xl p-6 space-y-4" style={{ background: '#fff', border: '1.5px solid #EDE9FE', boxShadow: '0 2px 12px rgba(107,78,255,0.05)' }}>
          <h3 className="text-sm font-bold" style={{ color: '#1E1060' }}>Journal Général des Écritures Validées</h3>
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-xl p-4 space-y-3" style={{ background: '#F8F7FF', border: '1.5px solid #EDE9FE' }}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs border-b pb-2" style={{ borderColor: '#EDE9FE' }}>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold" style={{ color: '#6B4EFF' }}>{entry.entryNumber}</span>
                    <span className="px-2 py-0.5 rounded font-semibold" style={{ background: '#F3F0FF', color: '#5B21B6' }}>{entry.journalType}</span>
                    <span style={{ color: '#9CA3AF' }}>Pièce: {entry.pieceNumber}</span>
                  </div>
                  <div style={{ color: '#9CA3AF' }}>Date: {entry.date}</div>
                </div>

                <div className="text-xs font-semibold" style={{ color: '#1E1060' }}>{entry.wording}</div>

                <table className="w-full text-left text-xs font-mono">
                  <tbody className="divide-y" style={{ borderColor: '#EDE9FE' }}>
                    {entry.lines.map((l, i) => (
                      <tr key={l.id || i}>
                        <td className="py-1" style={{ color: '#9CA3AF', width: '6rem' }}>{l.accountCode}</td>
                        <td className="py-1" style={{ color: '#374151' }}>{l.accountLabel}</td>
                        <td className="py-1 text-right w-32" style={{ color: '#10B981' }}>{l.debit > 0 ? formatMoney(l.debit) : '-'}</td>
                        <td className="py-1 text-right w-32" style={{ color: '#EF4444' }}>{l.credit > 0 ? formatMoney(l.credit) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'grand-livre' && (
        <div className="rounded-xl p-6 space-y-4" style={{ background: '#fff', border: '1.5px solid #EDE9FE', boxShadow: '0 2px 12px rgba(107,78,255,0.05)' }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#1E1060' }}>Grand Livre Général des Comptes</h3>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Historique chronologique et mouvements par compte comptable</p>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs" style={{ color: '#6B7280' }}>Filtre Compte :</label>
              <select
                value={grandLivreFilter}
                onChange={(e) => setGrandLivreFilter(e.target.value)}
                className="glass-input rounded-lg px-3 py-1.5 text-xs font-mono"
              >
                <option value="">Tous les comptes (1 à 8)</option>
                <option value="411">411 - Clients</option>
                <option value="401">401 - Fournisseurs</option>
                <option value="521">521 - Banques locales</option>
                <option value="701">701 - Ventes de marchandises</option>
                <option value="601">601 - Achats de marchandises</option>
                <option value="443">443 - TVA Facturée</option>
                <option value="445">445 - TVA Récupérable</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-white uppercase font-semibold text-[10px]" style={{ background: 'linear-gradient(90deg, #6B4EFF 0%, #8B72FF 100%)' }}>
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">N° Pièce</th>
                  <th className="p-3">Compte</th>
                  <th className="p-3">Intitulé</th>
                  <th className="p-3">Libellé d'Opération</th>
                  <th className="p-3 text-right">Débit</th>
                  <th className="p-3 text-right">Crédit</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#EDE9FE' }}>
                {grandLivreLines.map((row, i) => (
                  <tr key={i} className="hover:bg-purple-50 font-mono transition-colors">
                    <td className="p-3" style={{ color: '#6B7280' }}>{row.date}</td>
                    <td className="p-3" style={{ color: '#6B4EFF' }}>{row.pieceNumber}</td>
                    <td className="p-3 font-bold" style={{ color: '#1E1060' }}>{row.accountCode}</td>
                    <td className="p-3" style={{ color: '#374151' }}>{row.accountLabel}</td>
                    <td className="p-3" style={{ color: '#374151' }}>{row.wording}</td>
                    <td className="p-3 text-right" style={{ color: '#10B981' }}>{Number(row.debit) > 0 ? formatMoney(Number(row.debit)) : '-'}</td>
                    <td className="p-3 text-right" style={{ color: '#EF4444' }}>{Number(row.credit) > 0 ? formatMoney(Number(row.credit)) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'balance' && (
        <div className="rounded-xl p-6 space-y-4" style={{ background: '#fff', border: '1.5px solid #EDE9FE', boxShadow: '0 2px 12px rgba(107,78,255,0.05)' }}>
          <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: '#EDE9FE' }}>
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#1E1060' }}>Balance Générale des Comptes</h3>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Vérification de l'égalité globale Débits = Crédits</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-white uppercase font-semibold text-[10px]" style={{ background: 'linear-gradient(90deg, #6B4EFF 0%, #8B72FF 100%)' }}>
                <tr>
                  <th className="p-3">N° Compte</th>
                  <th className="p-3">Intitulé du Compte</th>
                  <th className="p-3 text-right">Cumul Débit</th>
                  <th className="p-3 text-right">Cumul Crédit</th>
                  <th className="p-3 text-right">Solde Débiteur</th>
                  <th className="p-3 text-right">Solde Créditeur</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#EDE9FE' }}>
                {balanceRows.map((row) => (
                  <tr key={row.code} className="hover:bg-purple-50 transition-colors">
                    <td className="p-3 font-bold font-mono" style={{ color: '#6B4EFF' }}>{row.code}</td>
                    <td className="p-3 font-sans" style={{ color: '#374151' }}>{row.label}</td>
                    <td className="p-3 text-right" style={{ color: '#6B7280' }}>{formatMoney(row.debit)}</td>
                    <td className="p-3 text-right" style={{ color: '#6B7280' }}>{formatMoney(row.credit)}</td>
                    <td className="p-3 text-right font-bold" style={{ color: '#10B981' }}>{row.soldeDebiteur > 0 ? formatMoney(row.soldeDebiteur) : '-'}</td>
                    <td className="p-3 text-right font-bold" style={{ color: '#EF4444' }}>{row.soldeCrediteur > 0 ? formatMoney(row.soldeCrediteur) : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="font-extrabold" style={{ background: '#F3F0FF', borderTop: '2px solid #DDD6FE' }}>
                <tr>
                  <td colSpan={2} className="p-3 text-right font-sans" style={{ color: '#1E1060' }}>TOTAUX BALANCE GÉNÉRALE :</td>
                  <td className="p-3 text-right text-emerald-400">{formatMoney(totalBalanceDebit)}</td>
                  <td className="p-3 text-right text-rose-400">{formatMoney(totalBalanceCredit)}</td>
                  <td className="p-3 text-right text-emerald-400">{formatMoney(Math.max(totalBalanceDebit - totalBalanceCredit, 0))}</td>
                  <td className="p-3 text-right text-rose-400">{formatMoney(Math.max(totalBalanceCredit - totalBalanceDebit, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {tab === 'plan' && (
        <div className="rounded-xl p-6 space-y-4" style={{ background: '#fff', border: '1.5px solid #EDE9FE', boxShadow: '0 2px 12px rgba(107,78,255,0.05)' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#1E1060' }}>Référentiel des Comptes SYSCOHADA Révisé</h3>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Structure normalisée par classe de compte (Classes 1 à 8)</p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                <input
                  type="text"
                  placeholder="Rechercher code ou libellé..."
                  value={searchAccount}
                  onChange={(e) => setSearchAccount(e.target.value)}
                  className="glass-input rounded-lg pl-8 pr-3 py-1.5 text-xs w-64"
                />
              </div>

              <select
                value={selectedClass === null ? '' : selectedClass}
                onChange={(e) => setSelectedClass(e.target.value ? Number(e.target.value) : null)}
                className="glass-input rounded-lg px-3 py-1.5 text-xs"
              >
                <option value="">Toutes les classes (1 à 8)</option>
                <option value="1">Classe 1: Capitaux Propres & Ressources</option>
                <option value="2">Classe 2: Actif Immobilisé</option>
                <option value="3">Classe 3: Stocks</option>
                <option value="4">Classe 4: Tiers (Clients, Fournisseurs, État)</option>
                <option value="5">Classe 5: Trésorerie (Banque, Caisse)</option>
                <option value="6">Classe 6: Charges d'exploitation</option>
                <option value="7">Classe 7: Produits d'exploitation</option>
                <option value="8">Classe 8: H.A.O. (Hors Activité Ordinaire)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-white uppercase font-semibold text-[10px]" style={{ background: 'linear-gradient(90deg, #6B4EFF 0%, #8B72FF 100%)' }}>
                <tr>
                  <th className="p-3 w-28">N° Compte</th>
                  <th className="p-3">Intitulé SYSCOHADA</th>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3 text-right">Sens Normal</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#EDE9FE' }}>
                {filteredAccounts.map((acc) => (
                  <tr key={acc.code} className="hover:bg-purple-50 transition-colors">
                    <td className="p-3 font-mono font-bold" style={{ color: '#6B4EFF' }}>{acc.code}</td>
                    <td className="p-3 font-medium" style={{ color: '#1E1060' }}>{acc.label}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold" style={{ background: '#F3F0FF', color: '#5B21B6' }}>{acc.category}</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        acc.type === 'debit' ? 'badge-debit' : acc.type === 'credit' ? 'badge-credit' : 'bg-indigo-950 text-indigo-300'
                      }`}>
                        {acc.type.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
