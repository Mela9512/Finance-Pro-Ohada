import React from 'react';
import { ArrowRight, ArrowLeft, Puzzle, Lock } from 'lucide-react';
import { StepProps, MODULES_LISTE } from './types';

export const Step9Modules: React.FC<StepProps> = ({ data, onChange, onNext, onPrev }) => {
  const { step9 } = data;

  const toggleModule = (id: string) => {
    const mod = MODULES_LISTE.find(m => m.id === id);
    if (mod?.obligatoire) return; // Cannot deactivate mandatory modules
    const current = step9.modules;
    const updated = current.includes(id)
      ? current.filter(m => m !== id)
      : [...current, id];
    onChange('step9', { modules: updated });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const activeCount = step9.modules.length;
  const totalCount = MODULES_LISTE.length;

  return (
    <form onSubmit={handleNext} className="space-y-7">
      <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/25">
          <Puzzle className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">Modules à activer</h2>
            <div className="text-xs font-extrabold text-[#2563eb] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
              {activeCount} / {totalCount} modules
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">Sélectionnez les modules adaptés à votre activité. Les modules obligatoires sont toujours activés. Vous pouvez modifier ces paramètres à tout moment.</p>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MODULES_LISTE.map(mod => {
          const isActive = step9.modules.includes(mod.id);
          const isObligatoire = mod.obligatoire;

          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => toggleModule(mod.id)}
              className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                isActive
                  ? isObligatoire
                    ? 'border-emerald-300 bg-emerald-50 cursor-not-allowed'
                    : 'border-[#2563eb] bg-blue-50'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              {/* Checkbox */}
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                isActive
                  ? isObligatoire
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-[#2563eb] bg-[#2563eb]'
                  : 'border-slate-300 bg-white'
              }`}>
                {isActive && <span className="text-white text-[10px] font-extrabold">✓</span>}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base">{mod.icon}</span>
                  <span className={`text-xs font-extrabold ${isActive ? isObligatoire ? 'text-emerald-800' : 'text-[#1e40af]' : 'text-slate-700'}`}>
                    {mod.label}
                  </span>
                  {isObligatoire && (
                    <span className="flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                      <Lock className="w-2.5 h-2.5" /> OBLIGATOIRE
                    </span>
                  )}
                </div>
                <p className={`text-[10px] mt-0.5 leading-snug ${isActive ? isObligatoire ? 'text-emerald-700' : 'text-blue-600' : 'text-slate-500'}`}>
                  {mod.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary Bar */}
      <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-extrabold text-violet-800">Modules sélectionnés</span>
          <span className="text-xs font-extrabold text-violet-600">{activeCount} modules</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {step9.modules.map(id => {
            const mod = MODULES_LISTE.find(m => m.id === id);
            return mod ? (
              <span key={id} className="text-[10px] font-bold px-2 py-0.5 bg-white border border-violet-200 text-violet-800 rounded-lg">
                {mod.icon} {mod.label}
              </span>
            ) : null;
          })}
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-slate-100">
        <button type="button" onClick={onPrev}
          className="flex items-center gap-2 px-6 py-3 rounded-full border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all">
          <ArrowLeft className="w-4 h-4" /> Précédent
        </button>
        <button type="submit"
          className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white font-extrabold text-sm shadow-lg shadow-blue-500/30 transition-all active:scale-[0.99]">
          Récapitulatif <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

export default Step9Modules;
