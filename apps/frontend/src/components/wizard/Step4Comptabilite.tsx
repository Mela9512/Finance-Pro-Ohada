import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, BookOpen, ShieldCheck } from 'lucide-react';
import { StepProps } from './types';

export const Step4Comptabilite: React.FC<StepProps> = ({ data, onChange, onNext, onPrev }) => {
  const { step4 } = data;
  const [errors, setErrors] = useState<Partial<Record<keyof typeof step4, string>>>({});

  const update = (field: keyof typeof step4, value: string | number) => {
    onChange('step4', { ...step4, [field]: value });
    if (errors[field as string]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Partial<Record<keyof typeof step4, string>> = {};
    if (!step4.exercice) err.exercice = 'L\'exercice est requis';
    if (!step4.dateOuverture) err.dateOuverture = 'La date d\'ouverture est requise';
    if (!step4.dateCloture) err.dateCloture = 'La date de clôture est requise';
    if (Object.keys(err).length > 0) { setErrors(err); return; }
    onNext();
  };

  const inputCls = (hasError?: boolean) =>
    `w-full bg-[#f8fafc] border ${hasError ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3 text-sm text-slate-900 font-bold outline-none transition-all`;

  const Field = ({ label, required, sublabel, children, error }: { label: string; required?: boolean; sublabel?: string; children: React.ReactNode; error?: string }) => (
    <div>
      <label className="block text-xs font-extrabold text-slate-700 mb-0.5 uppercase tracking-wider">
        {required && <span className="text-red-500 mr-1">*</span>}{label}
      </label>
      {sublabel && <div className="text-[10px] text-slate-400 font-semibold mb-1.5">{sublabel}</div>}
      {children}
      {error && <p className="text-red-500 text-xs mt-1 font-semibold">{error}</p>}
    </div>
  );

  return (
    <form onSubmit={handleNext} className="space-y-7">
      <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/25">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Paramètres comptables</h2>
          <p className="text-xs text-slate-500 mt-1">Configuration du référentiel comptable SYSCOHADA et des paramètres d'exercice. Ces paramètres structurent toute votre comptabilité.</p>
        </div>
      </div>

      {/* Fixed Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Référentiel comptable</span>
          </div>
          <div className="text-sm font-extrabold text-slate-900">SYSCOHADA Révisé</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Seul référentiel reconnu dans les 17 pays OHADA — Fixe et non modifiable</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Plan comptable</span>
          </div>
          <div className="text-sm font-extrabold text-slate-900">Plan OHADA — 8 classes</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Classe 1 à 8 : Capitaux, Actif, Passif, Charges, Produits... — Fixe</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Field label="Exercice comptable" required sublabel="Année fiscale principale" error={errors.exercice}>
          <input type="number" value={step4.exercice} onChange={e => update('exercice', e.target.value)}
            min="2000" max="2050" placeholder={new Date().getFullYear().toString()}
            className={inputCls(!!errors.exercice)} />
        </Field>

        <Field label="Date d'ouverture" required error={errors.dateOuverture}>
          <input type="date" value={step4.dateOuverture} onChange={e => update('dateOuverture', e.target.value)}
            className={inputCls(!!errors.dateOuverture)} />
        </Field>

        <Field label="Date de clôture" required error={errors.dateCloture}>
          <input type="date" value={step4.dateCloture} onChange={e => update('dateCloture', e.target.value)}
            className={inputCls(!!errors.dateCloture)} />
        </Field>

        <Field label="Longueur des comptes" sublabel="Nombre de chiffres (6 à 8)">
          <select value={step4.longueurComptes} onChange={e => update('longueurComptes', Number(e.target.value))}
            className={`${inputCls()} cursor-pointer`}>
            <option value={6}>6 chiffres (standard OHADA)</option>
            <option value={7}>7 chiffres</option>
            <option value={8}>8 chiffres (analytique avancé)</option>
          </select>
        </Field>

        <Field label="Nombre de décimales" sublabel="Précision des montants">
          <select value={step4.decimales} onChange={e => update('decimales', Number(e.target.value))}
            className={`${inputCls()} cursor-pointer`}>
            <option value={0}>0 décimale (entiers)</option>
            <option value={2}>2 décimales (recommandé)</option>
          </select>
        </Field>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800">
        <span className="font-extrabold">📅 Exercice standard :</span> L'exercice comptable OHADA standard va du 1er janvier au 31 décembre. Tout exercice décalé nécessite une autorisation de l'administration fiscale.
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

export default Step4Comptabilite;
