import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Banknote } from 'lucide-react';
import { StepProps, BANQUES_CEMAC, MODES_PAIEMENT_OPTIONS, DEVISES } from './types';

export const Step6Banque: React.FC<StepProps> = ({ data, onChange, onNext, onPrev }) => {
  const { step6 } = data;
  const [errors, setErrors] = useState<Partial<Record<keyof typeof step6, string>>>({});

  const update = (field: keyof typeof step6, value: string | string[]) => {
    onChange('step6', { ...step6, [field]: value });
    if (errors[field as string]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const toggleModePaiement = (mode: string) => {
    const current = step6.modesPaiement;
    const updated = current.includes(mode)
      ? current.filter(m => m !== mode)
      : [...current, mode];
    update('modesPaiement', updated);
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const inputCls = (hasError?: boolean) =>
    `w-full bg-[#f8fafc] border ${hasError ? 'border-red-300 bg-red-50' : 'border-slate-200'} focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-4 py-3 text-sm text-slate-900 font-bold outline-none transition-all`;

  const Field = ({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) => (
    <div>
      <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1 font-semibold">{error}</p>}
    </div>
  );

  return (
    <form onSubmit={handleNext} className="space-y-7">
      <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/25">
          <Banknote className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Banque & Trésorerie</h2>
          <p className="text-xs text-slate-500 mt-1">Configurez votre banque principale et vos caisses. FinancePro OHADA importera automatiquement vos relevés pour le rapprochement bancaire.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Banque principale">
          <select value={step6.banquePrincipale} onChange={e => update('banquePrincipale', e.target.value)}
            className={`${inputCls()} cursor-pointer`}>
            <option value="">— Sélectionner une banque —</option>
            {BANQUES_CEMAC.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>

        <Field label="Devise du compte bancaire">
          <select value={step6.deviseCompte} onChange={e => update('deviseCompte', e.target.value)}
            className={`${inputCls()} cursor-pointer`}>
            {DEVISES.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
          </select>
        </Field>

        <Field label="Numéro de compte bancaire">
          <input type="text" value={step6.numCompte} onChange={e => update('numCompte', e.target.value)}
            placeholder="Ex: 01234567890 01"
            className={`${inputCls()} font-mono`} />
        </Field>

        <Field label="Code banque / Agence">
          <input type="text" value={step6.codeBanque} onChange={e => update('codeBanque', e.target.value)}
            placeholder="Ex: 00023 / Code BIC/SWIFT"
            className={`${inputCls()} font-mono`} />
        </Field>

        <div className="md:col-span-2">
          <Field label="Nom de la caisse principale">
            <input type="text" value={step6.caissePrincipale} onChange={e => update('caissePrincipale', e.target.value)}
              placeholder="Ex: Caisse principale siège"
              className={inputCls()} />
          </Field>
        </div>

        {/* Modes de paiement */}
        <div className="md:col-span-2">
          <label className="block text-xs font-extrabold text-slate-700 mb-3 uppercase tracking-wider">Modes de paiement acceptés</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MODES_PAIEMENT_OPTIONS.map(mode => {
              const isSelected = step6.modesPaiement.includes(mode);
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => toggleModePaiement(mode)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all border-2 ${
                    isSelected
                      ? 'border-[#2563eb] bg-blue-50 text-[#1e40af]'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-[#2563eb] bg-[#2563eb]' : 'border-slate-300'}`}>
                    {isSelected && <span className="text-white text-[10px] font-extrabold">✓</span>}
                  </span>
                  {mode}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-xs text-teal-800">
        <span className="font-extrabold">🏦 Import automatique :</span> Une fois configuré, FinancePro OHADA importera vos relevés bancaires (format OFX/CSV) pour effectuer le rapprochement bancaire automatiquement.
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

export default Step6Banque;
