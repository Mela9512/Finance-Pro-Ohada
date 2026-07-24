import React, { useEffect, useState } from 'react';
import { Wallet, Landmark, Smartphone, Plus, CheckCircle } from 'lucide-react';
import { TreasuryAccount, TreasuryTransaction } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

export const TreasuryModule: React.FC = () => {
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [txType, setTxType] = useState<'ENCAISSEMENT' | 'DECAISSEMENT'>('ENCAISSEMENT');
  const [selectedAccId, setSelectedAccId] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [tierName, setTierName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = () => {
    api.getTreasuryAccounts().then((accs) => {
      setAccounts(accs);
      if (accs.length > 0 && !selectedAccId) setSelectedAccId(accs[0].id);
    });
    api.getTreasuryTransactions().then(setTransactions);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalTresorerie = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0 || !selectedAccId) return;
    setErrorMessage(null);

    const targetAcc = accounts.find((a) => a.id === selectedAccId);
    try {
      await api.createTreasuryTransaction({
        treasuryAccountId: selectedAccId,
        treasuryAccountName: targetAcc?.name || 'Compte',
        date: new Date().toISOString().substring(0, 10),
        type: txType,
        category: txType === 'ENCAISSEMENT' ? 'Encaissement Manuel' : 'Décaissement Manuel',
        amount: val,
        reference: reference || 'REF-TR-001',
        tierName: tierName || 'Tiers Divers',
        description: description || 'Mouvement de trésorerie',
      });
      loadData();
      setShowModal(false);
      setAmount('');
      setReference('');
      setTierName('');
      setDescription('');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement du mouvement");
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Trésorerie Globale (Comptes 521, 541, 571)</h2>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">{formatMoney(totalTresorerie)}</div>
          <div className="text-xs text-slate-400 mt-1">{accounts.length} comptes actifs (Banques locales, Caisse principale, Mobile Money)</div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Saisir Mouvement de Trésorerie</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map((acc) => (
          <div key={acc.id} className="glass-card rounded-xl p-5 relative">
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-lg bg-slate-800 text-emerald-400">
                {acc.type === 'BANQUE' ? <Landmark className="w-5 h-5" /> : acc.type === 'CAISSE' ? <Wallet className="w-5 h-5" /> : <Smartphone className="w-5 h-5 text-indigo-400" />}
              </div>
              <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-bold">{acc.code}</span>
            </div>

            <h3 className="mt-3 text-sm font-bold text-white">{acc.name}</h3>
            {acc.accountNumber && <div className="text-[11px] text-slate-400 font-mono mt-0.5">{acc.accountNumber}</div>}

            <div className="mt-4 text-xl font-extrabold text-white font-mono">{formatMoney(Number(acc.balance))}</div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Derniers Mouvements & Flux de Trésorerie</h3>
          <span className="text-xs text-slate-400">Comptabilité auxiliaire de trésorerie</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Compte de Trésorerie</th>
                <th className="p-3">Tiers Associé</th>
                <th className="p-3">Référence / Pièce</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Montant</th>
                <th className="p-3 text-right">Rapprochement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono text-slate-300">{tx.date}</td>
                  <td className="p-3 font-semibold text-white">{tx.treasuryAccountName}</td>
                  <td className="p-3 text-slate-200">{tx.tierName}</td>
                  <td className="p-3 font-mono text-slate-400">{tx.reference}</td>
                  <td className="p-3 text-slate-300">{tx.description}</td>
                  <td className="p-3 text-right font-mono font-bold">
                    <span className={tx.type === 'ENCAISSEMENT' ? 'text-emerald-400' : 'text-rose-400'}>
                      {tx.type === 'ENCAISSEMENT' ? '+' : '-'}{formatMoney(Number(tx.amount))}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {tx.status === 'RAPPROCHE' ? 'RAPPROCHÉ' : 'EN ATTENTE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md space-y-4 border border-slate-700">
            <h3 className="text-base font-bold text-white">Nouveau Mouvement de Trésorerie</h3>
            {errorMessage && <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">{errorMessage}</div>}
            <form onSubmit={handleCreateTx} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Type d'opération</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType('ENCAISSEMENT')}
                    className={`py-2 rounded-lg text-xs font-bold ${txType === 'ENCAISSEMENT' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    + ENCAISSEMENT
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('DECAISSEMENT')}
                    className={`py-2 rounded-lg text-xs font-bold ${txType === 'DECAISSEMENT' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                  >
                    - DÉCAISSEMENT
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Compte de Trésorerie</label>
                <select
                  value={selectedAccId}
                  onChange={(e) => setSelectedAccId(e.target.value)}
                  className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.code}) - Solde: {formatMoney(Number(a.balance))}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Montant (XAF)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex: 5000000"
                  className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nom du Tiers (Client / Fournisseur)</label>
                <input
                  type="text"
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  placeholder="Ex: AFRIQUE BTP SA"
                  className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Référence du Paiement / Chèque</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: VIR-BGFI-99182"
                  className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Annuler
                </button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
