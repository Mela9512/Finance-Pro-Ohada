import React, { useEffect, useState } from 'react';
import { Truck, Plus, Phone, Mail, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Supplier, SupplierAlert } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

const RISK_STYLES: Record<string, string> = {
  ELEVE: 'bg-rose-950 text-rose-400 border-rose-800',
  MOYEN: 'bg-amber-950 text-amber-300 border-amber-800',
  FAIBLE: 'bg-yellow-950 text-yellow-300 border-yellow-800',
  AUCUN: 'bg-emerald-950 text-emerald-400 border-emerald-800',
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
    <div className="space-y-6 bg-[#f4f7fc] min-h-screen p-4 sm:p-6 text-slate-900 rounded-2xl">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">Gestion des Fournisseurs & Dettes (Compte 401 SYSCOHADA)</h2>
          <div className="text-3xl font-extrabold text-red-600 mt-1">{formatMoney(totalDettes)}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">{suppliers.length} comptes fournisseurs auxiliaires</div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#0f2d5e] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition-all shadow-md"
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
          <div key={supp.id} className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  {supp.code}
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">{supp.name}</h3>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Dette Réelle</div>
                <div className="text-base font-extrabold text-rose-300 font-mono">{formatMoney(alert?.outstandingTotal ?? 0)}</div>
              </div>
            </div>

            {alert && alert.riskLevel !== 'AUCUN' && (
              <div className={`flex items-center justify-between text-[10px] font-bold px-2.5 py-1.5 rounded border ${RISK_STYLES[alert.riskLevel]}`}>
                <span>RETARD {alert.riskLevel} — {alert.overdueInvoiceCount} facture(s)</span>
                <span>{formatMoney(alert.overdueTotal)}</span>
              </div>
            )}

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
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md space-y-4 border border-slate-700">
            <h3 className="text-base font-bold text-white">Nouveau Fournisseur Auxiliaire (401)</h3>
            {errorMessage && <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">{errorMessage}</div>}
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
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
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
