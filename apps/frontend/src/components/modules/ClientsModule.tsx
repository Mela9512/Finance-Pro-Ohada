import React, { useEffect, useState } from 'react';
import { Plus, Phone, Mail, MapPin, AlertTriangle } from 'lucide-react';
import { Customer, ClientRisk } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

const RISK_STYLES: Record<string, string> = {
  ELEVE: 'bg-red-50 text-red-700 border-red-200',
  MOYEN: 'bg-amber-50 text-amber-700 border-amber-200',
  FAIBLE: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  AUCUN: 'bg-green-50 text-green-700 border-green-200',
};

export const ClientsModule: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [risks, setRisks] = useState<Map<string, ClientRisk>>(new Map());
  const [riskAnalyseIA, setRiskAnalyseIA] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [nif, setNif] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('10000000');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadClients = () => api.getClients().then(setCustomers);

  useEffect(() => {
    loadClients();
    api.aiGetClientsRisk().then((report) => {
      setRisks(new Map(report.clients.map((c) => [c.customerId, c])));
      setRiskAnalyseIA(report.analyseIA);
    }).catch(() => {});
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await api.createClient({
        name,
        nif: nif || undefined,
        phone: phone || '+242 06 000 00 00',
        email: email || 'contact@entreprise.cg',
        address: address || 'Brazzaville, Congo',
        creditLimit: Number(creditLimit) || 10000000,
      });
      await loadClients();
      setShowModal(false);
      setName('');
      setNif('');
      setPhone('');
      setEmail('');
      setAddress('');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de la création du client');
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4" style={{ border: '1.5px solid #EDE9FE', boxShadow: '0 2px 12px rgba(107,78,255,0.05)' }}>
        <div>
          <h2 className="text-base font-extrabold uppercase tracking-wider" style={{ color: '#1E1060' }}>Portefeuille Clients & Compte 411</h2>
          <div className="text-xs font-medium mt-0.5" style={{ color: '#9CA3AF' }}>{customers.length} tiers enregistrés (Créances et encours)</div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-5 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          style={{ background: '#6B4EFF' }}
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {riskAnalyseIA && (
        <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs rounded-xl p-4">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-indigo-500" />
          <span>{riskAnalyseIA}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((cust) => {
          const risk = risks.get(cust.id);
          const outstandingTotal = risk?.outstandingTotal ?? 0;
          const usagePercent = Number(cust.creditLimit) > 0 ? Math.round((outstandingTotal / Number(cust.creditLimit)) * 100) : 0;
          return (
            <div key={cust.id} className="rounded-xl p-5 space-y-4 relative" style={{ background: '#fff', border: '1.5px solid #EDE9FE', boxShadow: '0 2px 8px rgba(107,78,255,0.05)' }}>
              <div className="flex justify-between items-start border-b pb-3" style={{ borderColor: '#F3F0FF' }}>
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded" style={{ background: '#F3F0FF', color: '#6B4EFF', border: '1px solid #DDD6FE' }}>
                    {cust.code}
                  </span>
                  <h3 className="text-sm font-bold mt-1.5" style={{ color: '#1E1060' }}>{cust.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-xs" style={{ color: '#9CA3AF' }}>Encours Réel</div>
                  <div className="text-base font-extrabold font-mono" style={{ color: '#F59E0B' }}>{formatMoney(outstandingTotal)}</div>
                </div>
              </div>

              {risk && risk.riskLevel !== 'AUCUN' && (
                <div className={`flex items-center justify-between text-[10px] font-bold px-2.5 py-1.5 rounded border ${RISK_STYLES[risk.riskLevel]}`}>
                  <span>RISQUE {risk.riskLevel} — {risk.overdueInvoiceCount} facture(s) en retard</span>
                  <span>{formatMoney(risk.overdueTotal)}</span>
                </div>
              )}

              <div className="space-y-1 text-xs" style={{ color: '#6B7280' }}>
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                  <span>{cust.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                  <span>{cust.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                  <span className="truncate">{cust.address}</span>
                </div>
              </div>

              <div className="rounded-lg p-2.5 space-y-1" style={{ background: '#F8F7FF', border: '1px solid #EDE9FE' }}>
                <div className="flex justify-between text-[11px]">
                  <span style={{ color: '#6B7280' }}>Plafond de Crédit :</span>
                  <span className="font-mono" style={{ color: '#1E1060' }}>{formatMoney(Number(cust.creditLimit))}</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#EDE9FE' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(usagePercent, 100)}%`, background: usagePercent > 80 ? '#EF4444' : '#6B4EFF' }}
                  /></div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,16,96,0.5)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md space-y-4" style={{ background: '#fff', border: '1.5px solid #DDD6FE', boxShadow: '0 8px 40px rgba(107,78,255,0.15)' }}>
            <h3 className="text-base font-bold" style={{ color: '#1E1060' }}>Nouveau Client Auxiliaire (411)</h3>
            {errorMessage && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3">{errorMessage}</div>}
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Raison Sociale / Nom du Client</label>
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Adresse</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Brazzaville"
                  className="w-full glass-input rounded-lg px-3 py-2 text-xs"
                />
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
                  className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: '#F3F0FF', color: '#6B4EFF', border: '1px solid #DDD6FE' }}
                >
                  Annuler
                </button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">
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
