import React, { useState } from 'react';
import { FileSpreadsheet, Plus, CheckCircle, Clock, Percent, Printer, FileText } from 'lucide-react';
import { Invoice } from '@financepro/shared';

export const InvoicingModule: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'inv-101',
      invoiceNumber: 'FAC-2026-001',
      type: 'VENTE',
      tierId: 'cust-1',
      tierName: 'AFRIQUE BTP SARL',
      date: '2026-06-15',
      dueDate: '2026-07-15',
      items: [
        { id: 'item-1', description: 'Fourniture de matériaux de construction de génie civil', quantity: 100, unitPrice: 100000, tvaRate: 18, totalHT: 10000000, totalTVA: 1800000, totalTTC: 11800000, accountCode: '701' }
      ],
      subtotalHT: 10000000,
      totalTVA: 1800000,
      airRate: 2,
      totalAIR: 200000,
      totalTTC: 11800000,
      amountPaid: 5000000,
      status: 'PARTIEL'
    },
    {
      id: 'inv-102',
      invoiceNumber: 'FAC-2026-002',
      type: 'VENTE',
      tierId: 'cust-2',
      tierName: 'DISTRIB LOGISTIQUE SA',
      date: '2026-07-02',
      dueDate: '2026-08-02',
      items: [
        { id: 'item-2', description: 'Prestation de conseil logistique & audit financier', quantity: 1, unitPrice: 7500000, tvaRate: 18, totalHT: 7500000, totalTVA: 1350000, totalTTC: 8850000, accountCode: '706' }
      ],
      subtotalHT: 7500000,
      totalTVA: 1350000,
      airRate: 5,
      totalAIR: 375000,
      totalTTC: 8850000,
      amountPaid: 8850000,
      status: 'PAYE'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [tierName, setTierName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [tvaRate, setTvaRate] = useState('18');
  const [airRate, setAirRate] = useState('2');

  const qty = Number(quantity) || 1;
  const price = Number(unitPrice) || 0;
  const subtotalHT = qty * price;
  const tvaVal = (subtotalHT * (Number(tvaRate) || 0)) / 100;
  const airVal = (subtotalHT * (Number(airRate) || 0)) / 100;
  const totalTTC = subtotalHT + tvaVal;

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (subtotalHT <= 0) return;

    const num = `FAC-2026-${String(invoices.length + 1).padStart(3, '0')}`;
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: num,
      type: 'VENTE',
      tierId: `cust-${Date.now()}`,
      tierName: tierName || 'CLIENT DIVERS',
      date: new Date().toISOString().substring(0, 10),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10),
      items: [
        {
          id: `item-${Date.now()}`,
          description: itemDesc || 'Vente de marchandises',
          quantity: qty,
          unitPrice: price,
          tvaRate: Number(tvaRate),
          totalHT: subtotalHT,
          totalTVA: tvaVal,
          totalTTC,
          accountCode: '701'
        }
      ],
      subtotalHT,
      totalTVA: tvaVal,
      airRate: Number(airRate),
      totalAIR: airVal,
      totalTTC,
      amountPaid: 0,
      status: 'VALIDE'
    };

    setInvoices([newInvoice, ...invoices]);
    setShowModal(false);
    setTierName('');
    setItemDesc('');
    setUnitPrice('');
    alert(`Facture N° ${num} créée et validée ! Écriture automatique générée dans le journal des ventes.`);
  };

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Top Card */}
      <div className="glass-card rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Module de Facturation & Retenues Fiscables (TVA 18% & AIR)</h2>
          <div className="text-xs text-slate-400 mt-1">Conforme aux obligations fiscales des États membres OHADA</div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Émettre une Facture de Vente</span>
        </button>
      </div>

      {/* Invoices List */}
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
                <th className="p-3 text-right">TVA (18%)</th>
                <th className="p-3 text-right">AIR (Acompte Impôt)</th>
                <th className="p-3 text-right">Net à Payer TTC</th>
                <th className="p-3 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-emerald-400">{inv.invoiceNumber}</td>
                  <td className="p-3 text-slate-300">{inv.date}</td>
                  <td className="p-3 font-semibold text-white">{inv.tierName}</td>
                  <td className="p-3 text-right font-mono text-slate-200">{formatMoney(inv.subtotalHT)}</td>
                  <td className="p-3 text-right font-mono text-emerald-400">+{formatMoney(inv.totalTVA)}</td>
                  <td className="p-3 text-right font-mono text-amber-400">-{formatMoney(inv.totalAIR)} ({inv.airRate}%)</td>
                  <td className="p-3 text-right font-mono font-extrabold text-white">{formatMoney(inv.totalTTC)}</td>
                  <td className="p-3 text-right">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      inv.status === 'PAYE' 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal New Invoice */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-lg space-y-4 border border-slate-700">
            <h3 className="text-base font-bold text-white">Émettre Facture Normalisée OHADA</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nom du Client</label>
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
                  <select
                    value={tvaRate}
                    onChange={(e) => setTvaRate(e.target.value)}
                    className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="18">18% (Taux Standard SYSCOHADA)</option>
                    <option value="0">0% (Exonéré / Export)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Retenue AIR / BNC (%)</label>
                  <select
                    value={airRate}
                    onChange={(e) => setAirRate(e.target.value)}
                    className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="2">2% (Vente Biens)</option>
                    <option value="5">5% (Prestations de services)</option>
                    <option value="0">0% (Aucune retenue)</option>
                  </select>
                </div>
              </div>

              {/* Summary calculations */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-300"><span>Montant Total HT:</span><span>{formatMoney(subtotalHT)}</span></div>
                <div className="flex justify-between text-emerald-400"><span>TVA (18%):</span><span>+{formatMoney(tvaVal)}</span></div>
                <div className="flex justify-between text-amber-400"><span>Acompte Impôt (AIR):</span><span>-{formatMoney(airVal)}</span></div>
                <div className="flex justify-between text-white font-extrabold border-t border-slate-800 pt-1 text-sm">
                  <span>Net à Payer (TTC):</span><span>{formatMoney(totalTTC)}</span>
                </div>
              </div>

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
                  Valider & Générer Écriture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
