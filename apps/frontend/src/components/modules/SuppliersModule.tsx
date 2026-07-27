import React, { useEffect, useState } from 'react';
import { Truck, Plus, Phone, Mail, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Supplier, SupplierAlert } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

const RISK_STYLES: Record<string, string> = {
  ELEVE: 'bg-red-50 text-red-700 border-red-200',
  MOYEN: 'bg-amber-50 text-amber-700 border-amber-200',
  FAIBLE: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  AUCUN: 'bg-green-50 text-green-700 border-green-200',
};

export const SuppliersModule: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [alerts, setAlerts] = useState<Map<string, SupplierAlert>>(new Map());
  const [alertAnalyseIA, setAlertAnalyseIA] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [nif, setNif] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSuppliers = () => api.getSuppliers().then(setSuppliers);

  useEffect(() => {
    loadSuppliers();
    api.aiGetSuppliersOverdue().then((report) => {
      setAlerts(new Map(report.suppliers.map((s) => [s.supplierId, s])));
      setAlertAnalyseIA(report.analyseIA);
    }).catch(() => {});
  }, []);

  const totalDettes = Array.from(alerts.values()).reduce((sum, a) => sum + a.outstandingTotal, 0);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await api.createSupplier({
        name,
        nif: nif || undefined,
        phone: phone || '+242 06 000 00 00',
        email: email || 'fournisseur@entreprise.cg',
        address: address || 'Brazzaville, Congo',
      });
      await loadSuppliers();
      setShowModal(false);
      setName('');
      setNif('');
      setPhone('');
      setEmail('');
      setAddress('');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de la création du fournisseur');
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4" style={{ border: '1.5px solid #EDE9FE', boxShadow: '0 2px 12px rgba(107,78,255,0.05)' }}>
        <div>
          <h2 className="text-base font-extrabold uppercase tracking-wider" style={{ color: '#1E1060' }}>Gestion des Fournisseurs & Dettes (Compte 401 SYSCOHADA)</h2>
          <div className="text-3xl font-extrabold mt-1" style={{ color: '#EF4444' }}>{formatMoney(totalDettes)}</div>
          <div className="text-xs font-medium mt-1" style={{ color: '#9CA3AF' }}>{suppliers.length} comptes fournisseurs auxiliaires</div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-5 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          style={{ background: '#6B4EFF' }}
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Fournisseur (401)</span>
        </button>
      </div>

      {alertAnalyseIA && (
        <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs rounded-xl p-4">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-indigo-500" />
          <span>{alertAnalyseIA}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((supp) => {
          const alert = alerts.get(supp.id);
          return (
          <div key={supp.id} className="rounded-xl p-5 space-y-4" style={{ background: '#fff', border: '1.5px solid #EDE9FE', boxShadow: '0 2px 8px rgba(107,78,255,0.05)' }}>
            <div className="flex justify-between items-start border-b pb-3" style={{ borderColor: '#F3F0FF' }}>
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded" style={{ background: '#F3F0FF', color: '#6B7280', border: '1px solid #EDE9FE' }}>
                  {supp.code}
                </span>
                <h3 className="text-sm font-bold mt-1.5" style={{ color: '#1E1060' }}>{supp.name}</h3>
              </div>
              <div className="text-right">
                <div className="text-xs" style={{ color: '#9CA3AF' }}>Dette Réelle</div>
                <div className="text-base font-extrabold font-mono" style={{ color: '#EF4444' }}>{formatMoney(alert?.outstandingTotal ?? 0)}</div>
              </div>
            </div>

            {alert && alert.riskLevel !== 'AUCUN' && (
              <div className={`flex items-center justify-between text-[10px] font-bold px-2.5 py-1.5 rounded border ${RISK_STYLES[alert.riskLevel]}`}>
                <span>RETARD {alert.riskLevel} — {alert.overdueInvoiceCount} facture(s)</span>
                <span>{formatMoney(alert.overdueTotal)}</span>
              </div>
            )}

            <div className="space-y-1 text-xs" style={{ color: '#6B7280' }}>
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                <span>{supp.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                <span>{supp.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#10B981' }} />
                <span>NIF: {supp.nif}</span>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4" style={{ background: 'rgba(30,16,96,0.5)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md space-y-4" style={{ background: '#fff', border: '1.5px solid #DDD6FE', boxShadow: '0 8px 40px rgba(107,78,255,0.15)' }}>
            <h3 className="text-base font-bold" style={{ color: '#1E1060' }}>Nouveau Fournisseur Auxiliaire (401)</h3>
            {errorMessage && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3">{errorMessage}</div>}
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

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Adresse</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Pointe-Noire"
                  className="w-full glass-input rounded-lg px-3 py-2 text-xs"
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
