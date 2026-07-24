import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Invoice, Customer } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

export const InvoicingModule: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [tierId, setTierId] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [tvaRate, setTvaRate] = useState('18');
  const [airRate, setAirRate] = useState('2');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadInvoices = () => api.getInvoices().then(setInvoices);

  useEffect(() => {
    loadInvoices();
    api.getClients().then((cs) => {
      setCustomers(cs);
      if (cs.length > 0) setTierId(cs[0].id);
    });
  }, []);

  const qty = Number(quantity) || 1;
  const price = Number(unitPrice) || 0;
  const subtotalHT = qty * price;
  const tvaVal = (subtotalHT * (Number(tvaRate) || 0)) / 100;
  const airVal = (subtotalHT * (Number(airRate) || 0)) / 100;
  const totalTTC = subtotalHT + tvaVal;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subtotalHT <= 0 || !tierId) return;
    setErrorMessage(null);

    const tier = customers.find((c) => c.id === tierId);
    const today = new Date();
    const dueDate = new Date(today.getTime() + 30 * 86400000);

    try {
      await api.createInvoice({
        type: 'VENTE',
        tierId,
        tierName: tier?.name || 'CLIENT DIVERS',
        date: today.toISOString().substring(0, 10),
        dueDate: dueDate.toISOString().substring(0, 10),
        items: [
          {
            id: '',
            description: itemDesc || 'Vente de marchandises',
            quantity: qty,
            unitPrice: price,
            tvaRate: Number(tvaRate),
            totalHT: subtotalHT,
            totalTVA: tvaVal,
            totalTTC,
            accountCode: '701',
          },
        ],
        subtotalHT,
        totalTVA: tvaVal,
        airRate: Number(airRate),
        totalAIR: airVal,
        totalTTC,
      });
      await loadInvoices();
      setShowModal(false);
      setItemDesc('');
      setUnitPrice('');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de la création de la facture');
    }
  };

  const handleValidate = async (id: string) => {
    try {
      await api.validateInvoice(id);
      await loadInvoices();
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de la validation de la facture');
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Module de Facturation & Retenues Fiscales (TVA 18% & AIR)</h2>
          <div className="text-xs text-slate-400 mt-1">Conforme aux obligations fiscales des États membres OHADA</div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          disabled={customers.length === 0}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Émettre une Facture de Vente</span>
        </button>
      </div>

      {errorMessage && <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">{errorMessage}</div>}

      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Registre des Factures Émises</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3">N° Facture</th>
                <th className="p-3">Date</th>
                <th className="p-3">Client / Tiers</th>
                <th className="p-3 text-right">Total HT</th>
                <th className="p-3 text-right">TVA</th>
                <th className="p-3 text-right">AIR</th>
                <th className="p-3 text-right">Net à Payer TTC</th>
                <th className="p-3 text-right">Statut</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-emerald-400">{inv.invoiceNumber}</td>
                  <td className="p-3 text-slate-300">{inv.date}</td>
                  <td className="p-3 font-semibold text-white">{inv.tierName}</td>
                  <td className="p-3 text-right font-mono text-slate-200">{formatMoney(Number(inv.subtotalHT))}</td>
                  <td className="p-3 text-right font-mono text-emerald-400">+{formatMoney(Number(inv.totalTVA))}</td>
                  <td className="p-3 text-right font-mono text-amber-400">-{formatMoney(Number(inv.totalAIR))} ({inv.airRate}%)</td>
                  <td className="p-3 text-right font-mono font-extrabold text-white">{formatMoney(Number(inv.totalTTC))}</td>
                  <td className="p-3 text-right">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      inv.status === 'PAYE' || inv.status === 'VALIDE'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {inv.status === 'BROUILLON' && (
                      <button
                        onClick={() => handleValidate(inv.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                      >
                        Valider
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-lg space-y-4 border border-slate-700">
            <h3 className="text-base font-bold text-white">Émettre Facture Normalisée OHADA</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Client</label>
                <select
                  value={tierId}
                  onChange={(e) => setTierId(e.target.value)}
                  className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Désignation de la prestation / marchandise</label>
                <input
                  type="text"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Ex: Vente et livraison de matériel..."
                  className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Prix Unitaire HT (XAF)</label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="Ex: 500000"
                    className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Taux TVA (%)</label>
                  <select value={tvaRate} onChange={(e) => setTvaRate(e.target.value)} className="w-full glass-input rounded-lg px-3 py-2 text-xs">
                    <option value="18">18% (Taux Standard SYSCOHADA)</option>
                    <option value="0">0% (Exonéré / Export)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Retenue AIR / BNC (%)</label>
                  <select value={airRate} onChange={(e) => setAirRate(e.target.value)} className="w-full glass-input rounded-lg px-3 py-2 text-xs">
                    <option value="2">2% (Vente Biens)</option>
                    <option value="5">5% (Prestations de services)</option>
                    <option value="0">0% (Aucune retenue)</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-300"><span>Montant Total HT:</span><span>{formatMoney(subtotalHT)}</span></div>
                <div className="flex justify-between text-emerald-400"><span>TVA:</span><span>+{formatMoney(tvaVal)}</span></div>
                <div className="flex justify-between text-amber-400"><span>Acompte Impôt (AIR):</span><span>-{formatMoney(airVal)}</span></div>
                <div className="flex justify-between text-white font-extrabold border-t border-slate-800 pt-1 text-sm">
                  <span>Net à Payer (TTC):</span><span>{formatMoney(totalTTC)}</span>
                </div>
              </div>

              {errorMessage && <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">{errorMessage}</div>}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-600/30"
                >
                  Créer la Facture (Brouillon)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
