import React, { useState } from 'react';
import { Building2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../services/api';

const COUNTRIES = [
  'Bénin', 'Burkina Faso', 'Cameroun', 'Congo', 'Côte d\'Ivoire', 'Gabon',
  'Guinée', 'Guinée-Bissau', 'Guinée Équatoriale', 'Mali', 'Niger', 'RDC',
  'Sénégal', 'Tchad', 'Togo', 'Comores',
];

export const OnboardingWizard: React.FC = () => {
  const { company, refreshCompany } = useAuth();
  const [rccm, setRccm] = useState('');
  const [nif, setNif] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Congo');
  const [currency, setCurrency] = useState('XAF');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.completeOnboarding({ rccm, nif, address, city, country, currency });
      await refreshCompany();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-950 text-slate-100 py-10">
      <div className="glass-card rounded-2xl p-8 w-full max-w-lg space-y-6 border border-slate-800">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Building2 className="w-5 h-5 text-slate-950" />
          </div>
          <h1 className="text-lg font-bold text-white">Bienvenue{company ? `, ${company.name}` : ''} !</h1>
          <p className="text-xs text-slate-400 text-center">
            Complétez les informations légales de votre entreprise pour finaliser la configuration de votre exercice comptable SYSCOHADA.
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">RCCM</label>
              <input
                type="text"
                value={rccm}
                onChange={(e) => setRccm(e.target.value)}
                placeholder="Ex: CG-BZV-01-2026-B14-00001"
                className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">NIF</label>
              <input
                type="text"
                value={nif}
                onChange={(e) => setNif(e.target.value)}
                placeholder="Ex: M20260000001"
                className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Adresse</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: 142 Avenue de l'Indépendance"
              className="w-full glass-input rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Ville</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Brazzaville"
                className="w-full glass-input rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Pays</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full glass-input rounded-lg px-3 py-2 text-sm">
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Devise de tenue de compte</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full glass-input rounded-lg px-3 py-2 text-sm">
              <option value="XAF">XAF - Franc CFA (CEMAC)</option>
              <option value="XOF">XOF - Franc CFA (UEMOA)</option>
              <option value="EUR">EUR - Euro</option>
              <option value="USD">USD - Dollar Américain</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-600/20"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span>Accéder à mon espace comptable</span>
          </button>
        </form>
      </div>
    </div>
  );
};
