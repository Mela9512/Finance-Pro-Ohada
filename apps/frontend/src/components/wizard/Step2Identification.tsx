import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, FileText, Hash } from 'lucide-react';
import { StepProps, FORMES_JURIDIQUES, SECTEURS } from './types';

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode; error?: string }> = ({ label, required, children, error }) => (
  <div>
    <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
      {required && <span className="text-red-500 mr-1">*</span>}{label}
    </label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1 font-semibold">{error}</p>}
  </div>
);

export const Step2Identification: React.FC<StepProps> = ({ data, onChange, onNext, onPrev }) => {
  const [form, setForm] = useState(data.step2);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const update = (field: keyof typeof form, value: string) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    onChange('step2', updated);
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Partial<Record<keyof typeof form, string>> = {};
    if (!form.raisonSociale.trim()) err.raisonSociale = 'La raison sociale est requise';
    if (!form.formeJuridique) err.formeJuridique = 'La forme juridique est requise';
    if (!form.secteur) err.secteur = 'Le secteur d\'activité est requis';
    if (Object.keys(err).length > 0) { setErrors(err); return; }
    onNext();
  };

  const inputCls = (hasError?: boolean) =>
    `w-full bg-[#f8fafc] border ${hasError ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3 text-sm text-slate-900 font-bold outline-none transition-all placeholder:text-slate-400 placeholder:font-normal`;

  return (
    <form onSubmit={handleNext} className="space-y-7">
      <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/25">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Identification légale</h2>
          <p className="text-xs text-slate-500 mt-1">Informations juridiques et légales de votre entreprise. Ces données seront utilisées pour vos déclarations administratives et fiscales.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <Field label="Raison sociale" required error={errors.raisonSociale}>
            <input type="text" value={form.raisonSociale} onChange={e => update('raisonSociale', e.target.value)}
              placeholder="Ex: CONGO TRADING SOCIÉTÉ À RESPONSABILITÉ LIMITÉE"
              className={inputCls(!!errors.raisonSociale)} />
          </Field>
        </div>

        <Field label="Sigle / Acronyme">
          <input type="text" value={form.sigle} onChange={e => update('sigle', e.target.value)}
            placeholder="Ex: CT SARL" className={inputCls()} />
        </Field>

        <Field label="Forme juridique" required error={errors.formeJuridique}>
          <select value={form.formeJuridique} onChange={e => update('formeJuridique', e.target.value)}
            className={`${inputCls(!!errors.formeJuridique)} cursor-pointer`}>
            {FORMES_JURIDIQUES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>

        <Field label="RCCM">
          <div className="relative">
            <Hash className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input type="text" value={form.rccm} onChange={e => update('rccm', e.target.value)}
              placeholder="Ex: CG-BZV-01-2026-B14-00001"
              className={`${inputCls()} pl-10 font-mono`} />
          </div>
        </Field>

        <Field label="NIU / NIF (Numéro d'Identification Fiscale)">
          <div className="relative">
            <Hash className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input type="text" value={form.nif} onChange={e => update('nif', e.target.value)}
              placeholder="Ex: M20260000001"
              className={`${inputCls()} pl-10 font-mono`} />
          </div>
        </Field>

        <Field label="Capital social (en devise de référence)">
          <input type="number" value={form.capital} onChange={e => update('capital', e.target.value)}
            placeholder="Ex: 1000000" min="0"
            className={inputCls()} />
        </Field>

        <Field label="Secteur d'activité" required error={errors.secteur}>
          <select value={form.secteur} onChange={e => update('secteur', e.target.value)}
            className={`${inputCls(!!errors.secteur)} cursor-pointer`}>
            <option value="">— Sélectionner un secteur —</option>
            {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        <Field label="Date de création">
          <input type="date" value={form.dateCreation} onChange={e => update('dateCreation', e.target.value)}
            className={inputCls()} />
        </Field>
      </div>

      {/* RCCM Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
        <span className="font-extrabold">ℹ️ Information :</span> Le RCCM et le NIU/NIF sont obligatoires pour l'impression des factures légales, les déclarations TVA et IS. Vous pouvez les renseigner plus tard dans les paramètres.
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

export default Step2Identification;
