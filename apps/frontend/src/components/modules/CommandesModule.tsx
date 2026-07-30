import React, { useEffect, useState } from 'react';
import { ClipboardList, Plus, Truck, FileText } from 'lucide-react';
import { Commande, BonLivraison, Customer, Supplier } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

const STATUS_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  CONFIRMEE: 'Confirmée',
  LIVREE: 'Livrée',
  FACTUREE: 'Facturée',
  ANNULEE: 'Annulée',
  CONFIRME: 'Confirmé',
  FACTURE: 'Facturé',
};

const STATUS_COLORS: Record<string, string> = {
  BROUILLON: 'bg-slate-100 text-slate-600',
  CONFIRMEE: 'bg-blue-50 text-blue-700',
  LIVREE: 'bg-violet-50 text-violet-700',
  FACTUREE: 'bg-emerald-50 text-emerald-700',
  ANNULEE: 'bg-rose-50 text-rose-700',
  CONFIRME: 'bg-blue-50 text-blue-700',
  FACTURE: 'bg-emerald-50 text-emerald-700',
};

export const CommandesModule: React.FC = () => {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [bonsLivraison, setBonsLivraison] = useState<BonLivraison[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [type, setType] = useState<'VENTE' | 'ACHAT'>('VENTE');
  const [tierId, setTierId] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [tvaRate, setTvaRate] = useState('18');

  const loadAll = () => {
    api.getCommandes().then(setCommandes);
    api.getBonsLivraison().then(setBonsLivraison);
  };

  useEffect(() => {
    loadAll();
    api.getClients().then(setCustomers);
    api.getSuppliers().then(setSuppliers);
  }, []);

  useEffect(() => {
    const tiers = type === 'VENTE' ? customers : suppliers;
    setTierId(tiers.length > 0 ? tiers[0].id : '');
  }, [type, customers, suppliers]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  const qty = Number(quantity) || 1;
  const price = Number(unitPrice) || 0;
  const subtotalHT = qty * price;
  const tvaVal = (subtotalHT * (Number(tvaRate) || 0)) / 100;
  const totalTTC = subtotalHT + tvaVal;
  const currentTiers = type === 'VENTE' ? customers : suppliers;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierId || subtotalHT <= 0) return;
    setErrorMessage(null);
    const tier = currentTiers.find((t) => t.id === tierId);
    try {
      await api.createCommande({
        type,
        tierId,
        tierName: tier?.name || 'Tiers',
        date: new Date().toISOString().slice(0, 10),
        items: [
          {
            description: itemDesc || (type === 'VENTE' ? 'Vente de marchandises' : 'Achat de marchandises'),
            quantity: qty,
            unitPrice: price,
            tvaRate: Number(tvaRate),
            totalHT: subtotalHT,
            totalTVA: tvaVal,
            totalTTC,
            accountCode: type === 'VENTE' ? '701' : '601',
          },
        ],
        subtotalHT,
        totalTVA: tvaVal,
        totalTTC,
      });
      loadAll();
      setShowModal(false);
      setItemDesc(''); setUnitPrice('');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de la création de la commande');
    }
  };

  const handleConfirmer = async (id: string) => {
    try { await api.confirmerCommande(id); loadAll(); }
    catch (err) { setErrorMessage(err instanceof ApiError ? err.message : 'Erreur'); }
  };

  const handleAnnuler = async (id: string) => {
    try { await api.annulerCommande(id); loadAll(); }
    catch (err) { setErrorMessage(err instanceof ApiError ? err.message : 'Erreur'); }
  };

  const handleLivrer = async (id: string) => {
    try { await api.livrerCommande(id); loadAll(); }
    catch (err) { setErrorMessage(err instanceof ApiError ? err.message : 'Erreur'); }
  };

  const handleFacturer = async (id: string) => {
    const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    try { await api.facturerBonLivraison(id, dueDate); loadAll(); }
    catch (err) { setErrorMessage(err instanceof ApiError ? err.message : 'Erreur'); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#EDE9FE] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center flex-shrink-0 shadow-lg">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wider text-[#1E1060]">Commandes &amp; Livraisons</h2>
            <div className="text-xs text-slate-500 font-medium mt-1">Commande → Bon de livraison → Facture</div>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#6B4EFF] hover:bg-[#5538E0] text-white rounded-xl text-xs font-bold transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle commande</span>
        </button>
      </div>

      {errorMessage && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg p-3">{errorMessage}</div>}

      <div className="bg-white rounded-xl border border-[#EDE9FE] shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[#EDE9FE] text-sm font-bold text-[#1E1060]">Commandes</div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-[#EDE9FE] text-left text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="px-4 py-3">N°</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Tiers</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Total TTC</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {commandes.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">Aucune commande enregistrée.</td></tr>
            )}
            {commandes.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                <td className="px-4 py-3 font-mono text-slate-500">{c.numero}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${c.type === 'VENTE' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                    {c.type === 'VENTE' ? 'Vente' : 'Achat'}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-slate-800">{c.tierName}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(c.date).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 text-right font-mono font-bold">{formatMoney(c.totalTTC)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full font-bold text-[10px] ${STATUS_COLORS[c.status]}`}>{STATUS_LABELS[c.status]}</span>
                </td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  {c.status === 'BROUILLON' && (
                    <>
                      <button onClick={() => handleConfirmer(c.id)} className="text-[10px] font-bold text-blue-600 hover:underline">Confirmer</button>
                      <button onClick={() => handleAnnuler(c.id)} className="text-[10px] font-bold text-rose-600 hover:underline">Annuler</button>
                    </>
                  )}
                  {c.status === 'CONFIRMEE' && (
                    <button onClick={() => handleLivrer(c.id)} className="flex items-center gap-1 text-[10px] font-bold text-violet-600 hover:underline ml-auto">
                      <Truck className="w-3 h-3" /> Livrer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-[#EDE9FE] shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-[#EDE9FE] text-sm font-bold text-[#1E1060]">Bons de livraison</div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-[#EDE9FE] text-left text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="px-4 py-3">N°</th>
              <th className="px-4 py-3">Tiers</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {bonsLivraison.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">Aucun bon de livraison.</td></tr>
            )}
            {bonsLivraison.map((bl) => (
              <tr key={bl.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                <td className="px-4 py-3 font-mono text-slate-500">{bl.numero}</td>
                <td className="px-4 py-3 font-bold text-slate-800">{bl.tierName}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(bl.date).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full font-bold text-[10px] ${STATUS_COLORS[bl.status]}`}>{STATUS_LABELS[bl.status]}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {bl.status === 'CONFIRME' && (
                    <button onClick={() => handleFacturer(bl.id)} className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline ml-auto">
                      <FileText className="w-3 h-3" /> Facturer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 border border-slate-200 max-h-[85vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-800">Nouvelle commande</h3>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setType('VENTE')} className={`py-2 rounded-lg text-xs font-bold ${type === 'VENTE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Vente (Client)</button>
              <button type="button" onClick={() => setType('ACHAT')} className={`py-2 rounded-lg text-xs font-bold ${type === 'ACHAT' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Achat (Fournisseur)</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{type === 'VENTE' ? 'Client' : 'Fournisseur'}</label>
                <select value={tierId} onChange={(e) => setTierId(e.target.value)} required className="w-full glass-input rounded-lg px-3 py-2 text-xs">
                  {currentTiers.length === 0 && <option value="">Aucun {type === 'VENTE' ? 'client' : 'fournisseur'} enregistré</option>}
                  {currentTiers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Désignation</label>
                <input type="text" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} required className="w-full glass-input rounded-lg px-3 py-2 text-xs" placeholder="Ex: Fourniture de matériel de bureau" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Quantité</label>
                  <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Prix unitaire HT (XAF)</label>
                  <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required min="0" className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Taux TVA (%)</label>
                <select value={tvaRate} onChange={(e) => setTvaRate(e.target.value)} className="w-full glass-input rounded-lg px-3 py-2 text-xs">
                  <option value="18">18% (Taux Standard)</option>
                  <option value="0">0% (Exonéré / Export)</option>
                </select>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-600"><span>Total HT:</span><span>{formatMoney(subtotalHT)}</span></div>
                <div className="flex justify-between text-emerald-600"><span>TVA:</span><span>+{formatMoney(tvaVal)}</span></div>
                <div className="flex justify-between text-slate-900 font-extrabold border-t border-slate-200 pt-1"><span>Total TTC:</span><span>{formatMoney(totalTTC)}</span></div>
              </div>

              {errorMessage && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg p-3">{errorMessage}</div>}

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">Annuler</button>
                <button type="submit" disabled={!tierId} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold">Créer la commande</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandesModule;
