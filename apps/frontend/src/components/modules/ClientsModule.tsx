import React, { useState } from 'react';
import { Users, Plus, Phone, Mail, MapPin, CreditCard, ShieldAlert } from 'lucide-react';
import { Customer } from '@financepro/shared';

export const ClientsModule: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([
    { id: 'cust-1', code: '411001', name: 'AFRIQUE BTP SARL', nif: 'M20231920', phone: '+242 06 612 34 56', email: 'contact@afriquebtp.cg', address: 'Avenue Foch, Centre-Ville, Brazzaville', balance: 14500000, creditLimit: 25000000 },
    { id: 'cust-2', code: '411002', name: 'DISTRIB LOGISTIQUE SA', nif: 'M20234411', phone: '+242 05 520 88 99', email: 'finance@distriblog.cg', address: 'Zone Industrielle Mpila', balance: 8200000, creditLimit: 15000000 },
    { id: 'cust-3', code: '411003', name: 'PHARMACIE DE LA PAIX', nif: 'M20228834', phone: '+242 06 444 11 22', email: 'commandes@pharmaciepaix.cg', address: 'Bacongo, Brazzaville', balance: 3400000, creditLimit: 5000000 }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [nif, setNif] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('10000000');

  const totalCreances = customers.reduce((sum, c) => sum + c.balance, 0);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const code = `411${String(customers.length + 1).padStart(3, '0')}`;
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      code,
      name,
      nif: nif || 'M-NON-RESEIGNE',
      phone: phone || '+242 06 000 00 00',
      email: email || 'contact@entreprise.cg',
      address: address || 'Brazzaville, Congo',
      balance: 0,
      creditLimit: Number(creditLimit) || 10000000
    };

    setCustomers([...customers, newCust]);
    setShowModal(false);
    setName('');
    setNif('');
    setPhone('');
    setEmail('');
    setAddress('');
  };

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-card rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Gestion des Clients & Créances (Compte 411 SYSCOHADA)</h2>
          <div className="text-3xl font-extrabold text-amber-400 mt-1">{formatMoney(totalCreances)}</div>
          <div className="text-xs text-slate-400 mt-1">{customers.length} comptes clients auxiliaires enregistrés</div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Client Auxiliaire</span>
        </button>
      </div>

      {/* Customers List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((cust) => {
          const usagePercent = Math.round((cust.balance / cust.creditLimit) * 100);
          return (
            <div key={cust.id} className="glass-card rounded-xl p-5 space-y-4 relative">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                    {cust.code}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1.5">{cust.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Solde Débiteur</div>
                  <div className="text-base font-extrabold text-amber-300 font-mono">{formatMoney(cust.balance)}</div>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cust.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cust.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{cust.address}</span>
                </div>
              </div>

              {/* Credit Limit Usage Bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Plafond de Crédit:</span>
                  <span className="font-mono text-slate-200">{formatMoney(cust.creditLimit)}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${usagePercent > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal New Customer */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md space-y-4 border border-slate-700">
            <h3 className="text-base font-bold text-white">Nouveau Client Auxiliaire (411)</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Raison Sociale / Nom du Client</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: CONGO TELECOM SA"
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
                  placeholder="Ex: M202600129"
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
                    placeholder="contact@..."
                    className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Plafond d'encours de crédit (XAF)</label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono"
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
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                >
                  Créer la Fiche Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
