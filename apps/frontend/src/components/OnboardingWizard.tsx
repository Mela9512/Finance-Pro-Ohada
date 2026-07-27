import React, { useState } from 'react';
import { Building2, AlertCircle, Loader2, ArrowRight, ShieldCheck, Globe, MapPin, Hash, DollarSign } from 'lucide-react';
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
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement des informations");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#f3f4f6] p-4 font-sans select-none">
      <div className="bg-white rounded-[32px] border border-slate-200/80 shadow-2xl shadow-slate-300/40 w-full max-w-4xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Info Banner Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#1e40af] p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white px-2.5 py-1 rounded-full border border-white/20">
                Étape Finale 2/2
              </span>
              <h2 className="text-xl font-extrabold text-white mt-3 leading-tight">
                Configuration de votre société
              </h2>
              <p className="text-xs text-blue-100/90 leading-relaxed mt-2">
                Ces informations serviront à générer vos factures, déclarations fiscales et états financiers aux normes SYSCOHADA.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-blue-100">
                <ShieldCheck className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>Conformité juridique &amp; fiscale OHADA</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-blue-100">
                <ShieldCheck className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>Plan comptable 8 classes prêt à l'emploi</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-blue-100">
                <ShieldCheck className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>Multi-devises (XAF, XOF, EUR, USD)</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 text-[11px] text-blue-200/80">
            Besoin d'aide ? Vous pourrez modifier ces paramètres ultérieurement dans l'onglet Administration.
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Bienvenue{company ? `, ${company.name}` : ''} 👋
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Complétez les informations fiscales et administratives de l'entreprise.
              </p>
            </div>

            {error && (
              <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    RCCM <span className="text-slate-400 font-normal">(Registre du Commerce)</span>
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={rccm}
                      onChange={(e) => setRccm(e.target.value)}
                      placeholder="Ex: CG-BZV-01-2026-B14"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#2563eb] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-mono font-semibold outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIF <span className="text-slate-400 font-normal">(Numéro Fiscale)</span>
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={nif}
                      onChange={(e) => setNif(e.target.value)}
                      placeholder="Ex: M20260000001"
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#2563eb] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-mono font-semibold outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adresse du siège social</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: 142 Avenue de l'Indépendance"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#2563eb] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-semibold outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Brazzaville"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#2563eb] rounded-2xl px-4 py-2.5 text-xs text-slate-900 font-semibold outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pays d'implantation</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#2563eb] rounded-2xl px-4 py-2.5 text-xs text-slate-900 font-semibold outline-none transition-all cursor-pointer"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Devise de tenue de compte</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#2563eb] rounded-2xl px-4 py-2.5 text-xs text-slate-900 font-semibold outline-none transition-all cursor-pointer"
                >
                  <option value="XAF">XAF - Franc CFA (Afrique Centrale / CEMAC)</option>
                  <option value="XOF">XOF - Franc CFA (Afrique de l'Ouest / UEMOA)</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - Dollar Américain</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 mt-4 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Accéder à mon espace comptable</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-6 border-t border-slate-100 text-center text-[11px] text-slate-400">
            © FinancePro OHADA 2026 — Plateforme de gestion comptable certifiée
          </div>
        </div>

      </div>
    </div>
  );
};

export default OnboardingWizard;
