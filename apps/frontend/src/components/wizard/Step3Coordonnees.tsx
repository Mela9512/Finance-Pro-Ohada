import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { StepProps, PAYS_OHADA } from './types';

export const Step3Coordonnees: React.FC<StepProps> = ({ data, onChange, onNext, onPrev }) => {
  const { step3 } = data;
  const [errors, setErrors] = useState<Partial<Record<keyof typeof step3, string>>>({});

  const update = (field: keyof typeof step3, value: string) => {
    onChange('step3', { ...step3, [field]: value });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Partial<Record<keyof typeof step3, string>> = {};
    if (!step3.adresse.trim()) err.adresse = 'L\'adresse est requise';
    if (!step3.ville.trim()) err.ville = 'La ville est requise';
    if (!step3.telephone.trim()) err.telephone = 'Le téléphone est requis';
    if (Object.keys(err).length > 0) { setErrors(err); return; }
    onNext();
  };

  const inputCls = (hasError?: boolean) =>
    `w-full bg-[#f8fafc] border ${hasError ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3 text-sm text-slate-900 font-bold outline-none transition-all placeholder:text-slate-400 placeholder:font-normal`;

  const Field = ({ label, required, children, error }: { label: string; required?: boolean; children: React.ReactNode; error?: string }) => (
    <div>
      <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
        {required && <span className="text-red-500 mr-1">*</span>}{label}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1 font-semibold">{error}</p>}
    </div>
  );

  return (
    <form onSubmit={handleNext} className="space-y-7">
      <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/25">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Coordonnées de l'entreprise</h2>
          <p className="text-xs text-slate-500 mt-1">Adresse du siège social et informations de contact. Ces données apparaîtront sur vos factures et états officiels.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <Field label="Adresse du siège social" required error={errors.adresse}>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="text" value={step3.adresse} onChange={e => update('adresse', e.target.value)}
                placeholder="Ex: 142 Avenue de l'Indépendance, Zone Industrielle"
                className={`${inputCls(!!errors.adresse)} pl-10`} />
            </div>
          </Field>
        </div>

        <Field label="Ville" required error={errors.ville}>
          <input type="text" value={step3.ville} onChange={e => update('ville', e.target.value)}
            placeholder="Ex: Brazzaville" className={inputCls(!!errors.ville)} />
        </Field>

        <Field label="Région / Département">
          <input type="text" value={step3.region} onChange={e => update('region', e.target.value)}
            placeholder="Ex: Pool, Kouilou, Niari..." className={inputCls()} />
        </Field>

        <Field label="Pays">
          <select value={step3.pays} onChange={e => update('pays', e.target.value)}
            className={`${inputCls()} cursor-pointer`}>
            {PAYS_OHADA.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>

        <Field label="Téléphone principal" required error={errors.telephone}>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input type="tel" value={step3.telephone} onChange={e => update('telephone', e.target.value)}
              placeholder="Ex: +242 06 123 45 67"
              className={`${inputCls(!!errors.telephone)} pl-10`} />
          </div>
        </Field>

        <Field label="Adresse e-mail professionnelle">
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input type="email" value={step3.email} onChange={e => update('email', e.target.value)}
              placeholder="Ex: contact@entreprise.cg"
              className={`${inputCls()} pl-10`} />
          </div>
        </Field>

        <div className="md:col-span-2">
          <Field label="Site web">
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="url" value={step3.siteWeb} onChange={e => update('siteWeb', e.target.value)}
                placeholder="Ex: https://www.entreprise.cg"
                className={`${inputCls()} pl-10`} />
            </div>
          </Field>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-slate-100">
        <button type="button" onClick={onPrev}
          className="flex items-center gap-2 px-6 py-3 rounded-full border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all">
          <ArrowLeft className="w-4 h-4" /> Précédent
        </button>
        <button type="submit"
          className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white font-extrabold text-sm shadow-lg shadow-blue-500/30 transition-all active:scale-[0.99]">
          Suivant <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

export default Step3Coordonnees;
