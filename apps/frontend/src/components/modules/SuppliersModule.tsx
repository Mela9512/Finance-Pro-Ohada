import React, { useState } from 'react';
import { Truck, Plus, Phone, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { Supplier } from '@financepro/shared';

export const SuppliersModule: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: 'supp-1', code: '401001', name: 'TOTAL ENERGIES MARKETING', nif: 'M20201010', phone: '+242 06 800 00 00', email: 'pro@totalenergies.cg', address: 'Pointe-Noire', balance: 6800000 },
    { id: 'supp-2', code: '401002', name: 'TELECOM AFRIQUE (MTN)', nif: 'M20212233', phone: '+242 06 600 11 22', email: 'corporate@mtn.cg', address: 'Brazzaville', balance: 1250000 },
    { id: 'supp-3', code: '401003', name: 'CABINET FIDUCIAIRE OHADA', nif: 'M20229900', phone: '+242 05 555 44 33', email: 'audit@fiduciaireohada.cg', address: 'Centre-Ville', balance: 2500000 }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [nif, setNif] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const totalDettes = suppliers.reduce((sum, s) => sum + s.balance, 0);

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    const code = `401${String(suppliers.length + 1).padStart(3, '0')}`;
    const newSupp: Supplier = {
      id: `supp-${Date.now()}`,
      code,
      name,
      nif: nif || 'M-NON-RENSEIGNE',
      phone: phone || '+242 06 000 00 00',
      email: email || 'fournisseur@entreprise.cg',
      address: address || 'Brazzaville, Congo',
      balance: 0
    };

    setSuppliers([...suppliers, newSupp]);
    setShowModal(false);
    setName('');
    setNif('');
    setPhone('');
    setEmail('');
  };

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-card rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Gestion des Fournisseurs & Dettes (Compte 401 SYSCOHADA)</h2>
          <div className="text-3xl font-extrabold text-rose-400 mt-1">{formatMoney(totalDettes)}</div>
          <div className="text-xs text-slate-400 mt-1">{suppliers.length} comptes fournisseurs auxiliaires</div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Fournisseur (401)</span>
        </button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((supp) => (
          <div key={supp.id} className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  {supp.code}
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">{supp.name}</h3>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Solde Créditeur</div>
                <div className="text-base font-extrabold text-rose-300 font-mono">{formatMoney(supp.balance)}</div>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-300">
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{supp.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{supp.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>NIF: {supp.nif}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal New Supplier */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md space-y-4 border border-slate-700">
            <h3 className="text-base font-bold text-white">Nouveau Fournisseur Auxiliaire (401)</h3>
            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Raison Sociale Fournisseur</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: TOTAL ENERGIES"
                  className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">NIF (Numéro d'Identification Fiscale)</label>
                <input
                  type="text"
                  value={nif}
                  onChange={(e) => setNif(e.target.value)}
                  placeholder="Ex: M202611984"
                  className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+242 06..."
                    className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pro@..."
                    className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                  />
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
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                >
                  Créer le Fournisseur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
