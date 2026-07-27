import React, { useEffect, useRef, useState } from 'react';
import { Plus, Download, ScanLine, Loader2 } from 'lucide-react';
import { Invoice, Customer, Supplier } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.substring(result.indexOf(',') + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const InvoicingModule: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'VENTE' | 'ACHAT'>('VENTE');
  const [tierId, setTierId] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [tvaRate, setTvaRate] = useState('18');
  const [airRate, setAirRate] = useState('2');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrSupplierHint, setOcrSupplierHint] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadInvoices = () => api.getInvoices().then(setInvoices);

  useEffect(() => {
    loadInvoices();
    api.getClients().then((cs) => {
      setCustomers(cs);
      if (cs.length > 0) setTierId((prev) => prev || cs[0].id);
    });
    api.getSuppliers().then(setSuppliers);
  }, []);

  useEffect(() => {
    const tiers = invoiceType === 'VENTE' ? customers : suppliers;
    if (tiers.length > 0) setTierId(tiers[0].id);
    else setTierId('');
  }, [invoiceType, customers, suppliers]);

  const qty = Number(quantity) || 1;
  const price = Number(unitPrice) || 0;
  const subtotalHT = qty * price;
  const tvaVal = (subtotalHT * (Number(tvaRate) || 0)) / 100;
  const airVal = (subtotalHT * (Number(airRate) || 0)) / 100;
  const totalTTC = subtotalHT + tvaVal;

  const handleScanInvoice = async (file: File) => {
    setOcrLoading(true);
    setOcrError(null);
    setOcrSupplierHint(null);
    try {
      const base64 = await fileToBase64(file);
      const draft = await api.aiExtractInvoice(base64, file.type);
      const firstItem = draft.lineItems?.[0];
      setItemDesc(firstItem?.description || `Facture fournisseur ${draft.supplierName || ''}`.trim());
      if (firstItem && firstItem.quantity > 0) {
        setQuantity(String(firstItem.quantity));
        setUnitPrice(String(firstItem.unitPrice));
      } else {
        setQuantity('1');
        setUnitPrice(String(draft.subtotalHT || 0));
      }
      if (draft.subtotalHT > 0 && draft.totalTVA >= 0) {
        const impliedRate = Math.round((draft.totalTVA / draft.subtotalHT) * 100);
        if ([0, 18].includes(impliedRate)) setTvaRate(String(impliedRate));
      }
      if (draft.supplierName) {
        setOcrSupplierHint(
          `Fournisseur détecté : "${draft.supplierName}" — sélectionnez-le ci-dessous s'il existe déjà, sinon créez-le d'abord dans le module Fournisseurs.`,
        );
      }
    } catch (err) {
      setOcrError(err instanceof ApiError ? err.message : "Erreur lors de l'extraction de la facture");
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subtotalHT <= 0 || !tierId) return;
    setErrorMessage(null);

    const tiers = invoiceType === 'VENTE' ? customers : suppliers;
    const tier = tiers.find((t) => t.id === tierId);
    const today = new Date();
    const dueDate = new Date(today.getTime() + 30 * 86400000);

    try {
      await api.createInvoice({
        type: invoiceType,
        tierId,
        tierName: tier?.name || (invoiceType === 'VENTE' ? 'CLIENT DIVERS' : 'FOURNISSEUR DIVERS'),
        date: today.toISOString().substring(0, 10),
        dueDate: dueDate.toISOString().substring(0, 10),
        items: [
          {
            id: '',
            description: itemDesc || (invoiceType === 'VENTE' ? 'Vente de marchandises' : 'Achat de marchandises'),
            quantity: qty,
            unitPrice: price,
            tvaRate: Number(tvaRate),
            totalHT: subtotalHT,
            totalTVA: tvaVal,
            totalTTC,
            accountCode: invoiceType === 'VENTE' ? '701' : '601',
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
      setOcrSupplierHint(null);
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

  const handleDownloadPdf = async (inv: Invoice) => {
    try {
      await api.downloadInvoicePdf(inv.id, inv.invoiceNumber);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors du téléchargement du PDF');
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  const currentTiers = invoiceType === 'VENTE' ? customers : suppliers;

  return (
    <div className="space-y-6 bg-[#f4f7fc] min-h-screen p-4 sm:p-6 text-slate-900 rounded-2xl">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">Facturation & Fiscalité (TVA 18% & AIR)</h2>
          <div className="text-xs text-slate-500 font-medium mt-1">Conforme aux obligations fiscales des États membres OHADA</div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          disabled={customers.length === 0 && suppliers.length === 0}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#0f2d5e] hover:bg-blue-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Émettre une Facture</span>
        </button>
      </div>

      {errorMessage && <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">{errorMessage}</div>}

      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Registre des Factures</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3">N° Facture</th>
                <th className="p-3">Type</th>
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
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.type === 'VENTE' ? 'bg-emerald-950 text-emerald-400' : 'bg-indigo-950 text-indigo-300'}`}>
                      {inv.type}
                    </span>
                  </td>
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
                    <div className="flex items-center justify-end gap-2">
                      {inv.status === 'BROUILLON' && (
                        <button
                          onClick={() => handleValidate(inv.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                        >
                          Valider
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadPdf(inv)}
                        title="Télécharger en PDF"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-lg space-y-4 border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white">Émettre Facture Normalisée OHADA</h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInvoiceType('VENTE')}
                className={`py-2 rounded-lg text-xs font-bold ${invoiceType === 'VENTE' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                Vente (Client)
              </button>
              <button
                type="button"
                onClick={() => setInvoiceType('ACHAT')}
                className={`py-2 rounded-lg text-xs font-bold ${invoiceType === 'ACHAT' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                Achat (Fournisseur)
              </button>
            </div>

            {invoiceType === 'ACHAT' && (
              <div className="bg-indigo-950/40 border border-indigo-900 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                    <ScanLine className="w-3.5 h-3.5" /> Scanner une facture (IA)
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  disabled={ocrLoading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScanInvoice(file);
                  }}
                  className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                />
                {ocrLoading && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Extraction en cours...
                  </div>
                )}
                {ocrError && <div className="text-[11px] text-rose-300">{ocrError}</div>}
                {ocrSupplierHint && <div className="text-[11px] text-indigo-300">{ocrSupplierHint}</div>}
                <div className="text-[10px] text-slate-500">Les champs ci-dessous sont pré-remplis — vérifiez avant de créer la facture.</div>
              </div>
            )}

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{invoiceType === 'VENTE' ? 'Client' : 'Fournisseur'}</label>
                <select
                  value={tierId}
                  onChange={(e) => setTierId(e.target.value)}
                  className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                  required
                >
                  {currentTiers.length === 0 && <option value="">Aucun {invoiceType === 'VENTE' ? 'client' : 'fournisseur'} enregistré</option>}
                  {currentTiers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
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
                  disabled={!tierId}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-600/30"
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
