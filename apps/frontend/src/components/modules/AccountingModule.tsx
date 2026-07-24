import React, { useState, useEffect } from 'react';
import { 
  BookOpen, PlusCircle, CheckCircle2, AlertTriangle, 
  Search, FileSpreadsheet, Layers, Filter, Scale, Download, Printer 
} from 'lucide-react';
import { AccountSYSCOHADA, JournalEntry, JournalLine, SYSCOHADA_PLAN_COMPTABLE } from '@financepro/shared';
import { api } from '../../services/api';

export const AccountingModule: React.FC = () => {
  const [tab, setTab] = useState<'saisie' | 'journal' | 'grand-livre' | 'balance' | 'plan'>('saisie');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<AccountSYSCOHADA[]>(SYSCOHADA_PLAN_COMPTABLE);
  
  // Saisie state
  const [journalType, setJournalType] = useState<'ACHATS' | 'VENTES' | 'BANQUE' | 'CAISSE' | 'OD'>('VENTES');
  const [date, setDate] = useState('2026-07-24');
  const [wording, setWording] = useState('');
  const [pieceNumber, setPieceNumber] = useState('');
  const [lines, setLines] = useState<JournalLine[]>([
    { id: '1', accountCode: '411', accountLabel: 'Clients, Ventes de biens', debit: 0, credit: 0 },
    { id: '2', accountCode: '701', accountLabel: 'Ventes de marchandises', debit: 0, credit: 0 },
    { id: '3', accountCode: '443', accountLabel: 'État, TVA facturée sur ventes', debit: 0, credit: 0 }
  ]);

  // Grand Livre & Plan Search Filter State
  const [searchAccount, setSearchAccount] = useState('');
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [grandLivreFilter, setGrandLivreFilter] = useState('411');

  useEffect(() => {
    api.getEntries().then(setEntries);
  }, []);

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleAddLine = () => {
    setLines([...lines, { id: String(Date.now()), accountCode: '601', accountLabel: 'Achats de marchandises', debit: 0, credit: 0 }]);
  };

  const handleLineChange = (index: number, field: keyof JournalLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    if (field === 'accountCode') {
      const acc = accounts.find(a => a.code === value);
      if (acc) newLines[index].accountLabel = acc.label;
    }
    setLines(newLines);
  };

  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;

    const newEntry: JournalEntry = {
      id: `entry-${Date.now()}`,
      entryNumber: `${journalType.substring(0, 2)}-2026-${String(entries.length + 1).padStart(4, '0')}`,
      date,
      journalType,
      wording: wording || 'Écriture comptable libre',
      pieceNumber: pieceNumber || 'PIECE-001',
      lines: lines.map(l => ({ ...l, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })),
      isValidated: true,
      createdBy: 'Utilisateur Courant',
      createdAt: new Date().toISOString().substring(0, 16)
    };

    setEntries([newEntry, ...entries]);
    setWording('');
    setPieceNumber('');
    alert('Écriture comptable validée et inscrite au journal avec succès !');
    setTab('journal');
  };

  // Grand Livre extraction
  const grandLivreLines: any[] = [];
  entries.forEach(entry => {
    entry.lines.forEach(l => {
      if (!grandLivreFilter || l.accountCode.startsWith(grandLivreFilter)) {
        grandLivreLines.push({
          date: entry.date,
          entryNumber: entry.entryNumber,
          journalType: entry.journalType,
          pieceNumber: entry.pieceNumber,
          accountCode: l.accountCode,
          accountLabel: l.accountLabel,
          wording: entry.wording,
          debit: l.debit,
          credit: l.credit
        });
      }
    });
  });

  // Balance Générale extraction
  const balanceMap = new Map<string, { code: string; label: string; debit: number; credit: number }>();
  entries.forEach(entry => {
    entry.lines.forEach(l => {
      const existing = balanceMap.get(l.accountCode) || { code: l.accountCode, label: l.accountLabel, debit: 0, credit: 0 };
      existing.debit += l.debit;
      existing.credit += l.credit;
      balanceMap.set(l.accountCode, existing);
    });
  });

  const balanceRows = Array.from(balanceMap.values()).map(acc => {
    const solde = acc.debit - acc.credit;
    return {
      ...acc,
      soldeDebiteur: solde > 0 ? solde : 0,
      soldeCrediteur: solde < 0 ? Math.abs(solde) : 0
    };
  });

  const totalBalanceDebit = balanceRows.reduce((s, r) => s + r.debit, 0);
  const totalBalanceCredit = balanceRows.reduce((s, r) => s + r.credit, 0);

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.code.includes(searchAccount) || acc.label.toLowerCase().includes(searchAccount.toLowerCase());
    const matchesClass = selectedClass === null || acc.classNum === selectedClass;
    return matchesSearch && matchesClass;
  });

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setTab('saisie')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === 'saisie'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Saisie Écriture Double Entrée</span>
        </button>

        <button
          onClick={() => setTab('journal')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === 'journal'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Journal Général ({entries.length})</span>
        </button>

        <button
          onClick={() => setTab('grand-livre')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === 'grand-livre'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Grand Livre des Comptes</span>
        </button>

        <button
          onClick={() => setTab('balance')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === 'balance'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Balance Générale</span>
        </button>

        <button
          onClick={() => setTab('plan')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            tab === 'plan'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Plan Comptable SYSCOHADA</span>
        </button>
      </div>

      {/* TAB 1: SAISIE D'ÉCRITURE */}
      {tab === 'saisie' && (
        <form onSubmit={handleSubmitEntry} className="glass-card rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Nouvelle Écriture Comptable SYSCOHADA</h3>
              <p className="text-xs text-slate-400">Le système vérifie automatiquement le principe d'équivalence Débit = Crédit</p>
            </div>

            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-bold font-mono ${
              isBalanced 
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' 
                : 'bg-rose-950/80 text-rose-400 border-rose-800'
            }`}>
              {isBalanced ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
              <span>
                {isBalanced ? 'ÉCRITURE ÉQUILIBRÉE' : `DÉSÉQUILIBRE: ${formatMoney(Math.abs(totalDebit - totalCredit))}`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Journal Comptable</label>
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
              <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-3 w-36">Code Compte SYSCOHADA</th>
                  <th className="p-3">Intitulé du Compte</th>
                  <th className="p-3 w-40 text-right">Débit (XAF)</th>
                  <th className="p-3 w-40 text-right">Crédit (XAF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {lines.map((line, idx) => (
                  <tr key={line.id}>
                    <td className="p-2">
                      <select
                        value={line.accountCode}
                        onChange={(e) => handleLineChange(idx, 'accountCode', e.target.value)}
                        className="w-full glass-input rounded px-2 py-1 text-xs font-mono"
                      >
                        {accounts.map(acc => (
                          <option key={acc.code} value={acc.code}>
                            {acc.code} - {acc.label.substring(0, 25)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 text-slate-300 font-medium">{line.accountLabel}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        value={line.debit || ''}
                        onChange={(e) => handleLineChange(idx, 'debit', Number(e.target.value))}
                        placeholder="0"
                        className="w-full glass-input rounded px-2 py-1 text-xs text-right font-mono text-emerald-400 font-bold"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        value={line.credit || ''}
                        onChange={(e) => handleLineChange(idx, 'credit', Number(e.target.value))}
                        placeholder="0"
                        className="w-full glass-input rounded px-2 py-1 text-xs text-right font-mono text-rose-400 font-bold"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 border-t border-slate-700 font-bold text-xs">
                <tr>
                  <td colSpan={2} className="p-3 text-right text-slate-300">TOTAL ÉCRITURE :</td>
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
              className="px-3 py-1.5 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg text-xs font-medium"
            >
              + Ajouter une ligne de compte
            </button>

            <button
              type="submit"
              disabled={!isBalanced}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all shadow-lg ${
                isBalanced
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Valider & Inscrire au Journal
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: CONSULTATION DU JOURNAL */}
      {tab === 'journal' && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Journal Général des Écritures Validées</h3>
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-emerald-400">{entry.entryNumber}</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold">{entry.journalType}</span>
                    <span className="text-slate-400">Pièce: {entry.pieceNumber}</span>
                  </div>
                  <div className="text-slate-400 mt-1 sm:mt-0">Date: {entry.date} | Saisi par {entry.createdBy}</div>
                </div>

                <div className="text-xs font-semibold text-white">{entry.wording}</div>

                <table className="w-full text-left text-xs font-mono">
                  <tbody className="divide-y divide-slate-800/40">
                    {entry.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="py-1 text-slate-400 w-24">{l.accountCode}</td>
                        <td className="py-1 text-slate-200">{l.accountLabel}</td>
                        <td className="py-1 text-right text-emerald-400 w-32">{l.debit > 0 ? formatMoney(l.debit) : '-'}</td>
                        <td className="py-1 text-right text-rose-400 w-32">{l.credit > 0 ? formatMoney(l.credit) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GRAND LIVRE DES COMPTES */}
      {tab === 'grand-livre' && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Grand Livre Général des Comptes</h3>
              <p className="text-xs text-slate-400">Historique chronologique et mouvements par compte comptable</p>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs text-slate-300">Filtre Compte:</label>
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
              <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">N° Écriture</th>
                  <th className="p-3">Compte</th>
                  <th className="p-3">Intitulé</th>
                  <th className="p-3">Libellé d'Opération</th>
                  <th className="p-3 text-right">Débit</th>
                  <th className="p-3 text-right">Crédit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {grandLivreLines.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 font-mono">
                    <td className="p-3 text-slate-300">{row.date}</td>
                    <td className="p-3 text-emerald-400">{row.entryNumber}</td>
                    <td className="p-3 font-bold text-white">{row.accountCode}</td>
                    <td className="p-3 text-slate-300">{row.accountLabel}</td>
                    <td className="p-3 text-slate-200">{row.wording}</td>
                    <td className="p-3 text-right text-emerald-400">{row.debit > 0 ? formatMoney(row.debit) : '-'}</td>
                    <td className="p-3 text-right text-rose-400">{row.credit > 0 ? formatMoney(row.credit) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BALANCE GÉNÉRALE */}
      {tab === 'balance' && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Balance Générale des Comptes (6 Colonnes)</h3>
              <p className="text-xs text-slate-400">Vérification de l'égalité globale Débits = Crédits</p>
            </div>
            <button
              onClick={() => alert('Export de la Balance Générale au format Excel/PDF effectué !')}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter Balance</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-3">N° Compte</th>
                  <th className="p-3">Intitulé du Compte</th>
                  <th className="p-3 text-right">Cumul Débit</th>
                  <th className="p-3 text-right">Cumul Crédit</th>
                  <th className="p-3 text-right">Solde Débiteur</th>
                  <th className="p-3 text-right">Solde Créditeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {balanceRows.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-emerald-400">{row.code}</td>
                    <td className="p-3 font-sans text-slate-200">{row.label}</td>
                    <td className="p-3 text-right text-slate-300">{formatMoney(row.debit)}</td>
                    <td className="p-3 text-right text-slate-300">{formatMoney(row.credit)}</td>
                    <td className="p-3 text-right font-bold text-emerald-400">{row.soldeDebiteur > 0 ? formatMoney(row.soldeDebiteur) : '-'}</td>
                    <td className="p-3 text-right font-bold text-rose-400">{row.soldeCrediteur > 0 ? formatMoney(row.soldeCrediteur) : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 font-extrabold border-t-2 border-slate-700">
                <tr>
                  <td colSpan={2} className="p-3 text-right text-white font-sans">TOTAUX BALANCE GÉNÉRALE :</td>
                  <td className="p-3 text-right text-emerald-400">{formatMoney(totalBalanceDebit)}</td>
                  <td className="p-3 text-right text-rose-400">{formatMoney(totalBalanceCredit)}</td>
                  <td className="p-3 text-right text-emerald-400">{formatMoney(totalBalanceDebit - totalBalanceCredit > 0 ? totalBalanceDebit - totalBalanceCredit : 0)}</td>
                  <td className="p-3 text-right text-rose-400">{formatMoney(totalBalanceCredit - totalBalanceDebit > 0 ? totalBalanceCredit - totalBalanceDebit : 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PLAN COMPTABLE SYSCOHADA */}
      {tab === 'plan' && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Référentiel des Comptes SYSCOHADA Révisé</h3>
              <p className="text-xs text-slate-400">Structure normalisée par classe de compte (Classes 1 à 8)</p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
              <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-3 w-28">N° Compte</th>
                  <th className="p-3">Intitulé SYSCOHADA</th>
                  <th className="p-3">Catégorie</th>
                  <th className="p-3 text-right">Sens Normal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredAccounts.map((acc) => (
                  <tr key={acc.code} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-emerald-400">{acc.code}</td>
                    <td className="p-3 font-medium text-white">{acc.label}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                        {acc.category}
                      </span>
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
