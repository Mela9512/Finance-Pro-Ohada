import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Landmark } from 'lucide-react';
import { StepProps, REGIMES_FISCAUX, TAUX_TVA } from './types';

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }> = ({ checked, onChange, label, description }) => (
  <div className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${checked ? 'border-[#2563eb] bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
    onClick={() => onChange(!checked)}>
    <div>
      <div className="text-xs font-extrabold text-slate-800">{label}</div>
      {description && <div className="text-[10px] text-slate-500 mt-0.5">{description}</div>}
    </div>
    <div className={`w-10 h-6 rounded-full transition-all flex items-center px-0.5 ${checked ? 'bg-[#2563eb]' : 'bg-slate-300'}`}>
      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </div>
  </div>
);

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode; error?: string }> = ({ label, required, children, error }) => (
  <div>
    <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
      {required && <span className="text-red-500 mr-1">*</span>}{label}
    </label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1 font-semibold">{error}</p>}
  </div>
);

export const Step5Fiscalite: React.FC<StepProps> = ({ data, onChange, onNext, onPrev }) => {
  const [form, setForm] = useState(data.step5);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  const update = (field: keyof typeof form, value: string | boolean) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    onChange('step5', updated);
    if (errors[field as string]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Partial<Record<keyof typeof form, string>> = {};
    if (!form.regimeFiscal) err.regimeFiscal = 'Le régime fiscal est requis';
    if (Object.keys(err).length > 0) { setErrors(err); return; }
    onNext();
  };

  const inputCls = (hasError?: boolean) =>
    `w-full bg-[#f8fafc] border ${hasError ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3 text-sm text-slate-900 font-bold outline-none transition-all`;

  return (
    <form onSubmit={handleNext} className="space-y-7">
      <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/25">
          <Landmark className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Paramètres fiscaux</h2>
          <p className="text-xs text-slate-500 mt-1">Configuration de votre régime fiscal, de la TVA et des retenues à la source. Ces informations sont essentielles pour vos déclarations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Régime fiscal" required error={errors.regimeFiscal}>
          <select value={form.regimeFiscal} onChange={e => update('regimeFiscal', e.target.value)}
            className={`${inputCls(!!errors.regimeFiscal)} cursor-pointer`}>
            {REGIMES_FISCAUX.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>

        <Field label="Centre des impôts compétent">
          <input type="text" value={form.centreImpots} onChange={e => update('centreImpots', e.target.value)}
            placeholder="Ex: Centre des Impôts de Brazzaville Centre"
            className={inputCls()} />
        </Field>

        <div className="md:col-span-2">
          <Field label="Numéro de contribuable">
            <input type="text" value={form.numContribuable} onChange={e => update('numContribuable', e.target.value)}
              placeholder="Ex: CG-BZV-2024-12345 (si différent du NIU)"
              className={`${inputCls()} font-mono`} />
          </Field>
        </div>

        {/* TVA Section */}
        <div className="md:col-span-2">
          <Toggle
            checked={form.assujettTVA}
            onChange={v => update('assujettTVA', v)}
            label="Assujetti à la TVA"
            description="Activez si votre entreprise est redevable de la Taxe sur la Valeur Ajoutée"
          />
        </div>

        {form.assujettTVA && (
          <div className="md:col-span-2">
            <Field label="Taux de TVA applicable">
              <select value={form.tauxTVA} onChange={e => update('tauxTVA', e.target.value)}
                className={`${inputCls()} cursor-pointer`}>
                {TAUX_TVA.map(t => (
                  <option key={t.valeur + t.label} value={t.valeur}>{t.label}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        <Toggle
          checked={form.retenueSource}
          onChange={v => update('retenueSource', v)}
          label="Retenue à la Source (RAS)"
          description="Retenue sur les paiements aux prestataires et fournisseurs"
        />

        <Toggle
          checked={form.is}
          onChange={v => update('is', v)}
          label="Impôt sur les Sociétés (IS)"
          description="Applicable aux sociétés de capitaux (SA, SARL, SAS...)"
        />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
        <span className="font-extrabold">⚖️ Important :</span> Ces paramètres fiscaux doivent correspondre exactement à votre situation légale auprès de l'administration fiscale de votre pays. Consultez votre comptable ou conseiller fiscal si nécessaire.
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

export default Step5Fiscalite;
