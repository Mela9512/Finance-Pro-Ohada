import React, { useRef, useState } from 'react';
import { ArrowRight, Globe, DollarSign, MapPin, Upload, Building2 } from 'lucide-react';
import { StepProps, PAYS_OHADA, DEVISES, LANGUES } from './types';

export const Step1Welcome: React.FC<StepProps> = ({ data, onChange, onNext }) => {
  const { step1 } = data;
  const [errors, setErrors] = useState<Partial<typeof step1>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof typeof step1, value: string) => {
    onChange('step1', { ...step1, [field]: value });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      img.src = src;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/png', 0.85);
          update('logo', compressedBase64);
        } else {
          update('logo', src);
        }
      };
    };

    reader.readAsDataURL(file);
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<typeof step1> = {};
    if (!step1.companyName.trim()) newErrors.companyName = 'Le nom de l\'entreprise est requis';
    if (!step1.pays) newErrors.pays = 'Veuillez sélectionner un pays';
    if (!step1.devise) newErrors.devise = 'Veuillez sélectionner une devise';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    onNext();
  };

  return (
    <form onSubmit={handleNext} className="space-y-8">
      {/* Step Header */}
      <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Bienvenue dans FinancePro OHADA</h2>
          <p className="text-xs text-slate-500 mt-1">Commençons par configurer les informations essentielles de votre entreprise. Ces données seront utilisées sur tous vos documents officiels.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Name */}
        <div className="md:col-span-2">
          <label className="block text-xs font-extrabold text-slate-700 mb-2 uppercase tracking-wider">
            <span className="text-red-500 mr-1">*</span>Nom commercial de l'entreprise
          </label>
          <input
            type="text"
            value={step1.companyName}
            onChange={e => update('companyName', e.target.value)}
            placeholder="Ex: CONGO TRADING SARL"
            className={`w-full bg-[#f8fafc] border ${errors.companyName ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 text-sm text-slate-900 font-bold outline-none transition-all`}
          />
          {errors.companyName && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.companyName}</p>}
        </div>

        {/* Logo Upload */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-2 uppercase tracking-wider">Logo de l'entreprise</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-3 border-2 border-dashed border-slate-200 hover:border-[#2563eb] rounded-2xl p-4 cursor-pointer transition-all group"
          >
            {step1.logo ? (
              <img src={step1.logo} alt="Logo" className="w-12 h-12 object-contain rounded-xl border border-slate-200" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                <Upload className="w-5 h-5 text-slate-400 group-hover:text-[#2563eb]" />
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-slate-700">
                {step1.logo ? 'Changer le logo' : 'Importer votre logo'}
              </div>
              <div className="text-[11px] text-slate-400">PNG, JPG ou SVG — optimisé auto</div>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
        </div>

        {/* Langue */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-2 uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5 inline mr-1" />Langue de travail
          </label>
          <select
            value={step1.langue}
            onChange={e => update('langue', e.target.value)}
            className="w-full bg-[#f8fafc] border border-slate-200 focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 text-sm text-slate-900 font-bold outline-none transition-all cursor-pointer"
          >
            {LANGUES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* Devise */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-2 uppercase tracking-wider">
            <span className="text-red-500 mr-1">*</span>
            <DollarSign className="w-3.5 h-3.5 inline mr-1" />Devise de référence
          </label>
          <select
            value={step1.devise}
            onChange={e => update('devise', e.target.value)}
            className={`w-full bg-[#f8fafc] border ${errors.devise ? 'border-red-300' : 'border-slate-200'} focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 text-sm text-slate-900 font-bold outline-none transition-all cursor-pointer`}
          >
            {DEVISES.map(d => (
              <option key={d.code} value={d.code}>{d.label}</option>
            ))}
          </select>
          {errors.devise && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.devise}</p>}
        </div>

        {/* Pays */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-2 uppercase tracking-wider">
            <span className="text-red-500 mr-1">*</span>
            <MapPin className="w-3.5 h-3.5 inline mr-1" />Pays d'implantation principale
          </label>
          <select
            value={step1.pays}
            onChange={e => update('pays', e.target.value)}
            className={`w-full bg-[#f8fafc] border ${errors.pays ? 'border-red-300' : 'border-slate-200'} focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3.5 text-sm text-slate-900 font-bold outline-none transition-all cursor-pointer`}
          >
            {PAYS_OHADA.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {errors.pays && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.pays}</p>}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800 font-semibold">
        💾 <span className="font-extrabold">Sauvegarde automatique activée</span> — Vos données sont sauvegardées automatiquement à chaque étape. Vous pouvez quitter et reprendre plus tard.
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-4 border-t border-slate-100">
        <button
          type="submit"
          className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white font-extrabold text-sm shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 active:scale-[0.99]"
        >
          <span>Suivant</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

export default Step1Welcome;
