import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { AI_TIPS } from './types';

const STEP_LABELS = [
  'Bienvenue',
  'Identification',
  'Coordonnées',
  'Comptabilité',
  'Fiscalité',
  'Banque & Trésorerie',
  'Organisation',
  'Utilisateurs',
  'Modules',
  'Validation',
];

interface WizardLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  completedSteps: Set<number>;
}

export const WizardLayout: React.FC<WizardLayoutProps> = ({ children, currentStep, completedSteps }) => {
  const tip = AI_TIPS[currentStep];
  const progress = Math.round((currentStep / 10) * 100);

  return (
    <div className="min-h-screen w-screen bg-[#f1f5f9] flex items-start justify-center p-4 font-sans">
      <div className="w-full max-w-6xl min-h-[calc(100vh-2rem)] flex flex-col">

        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2563eb] flex items-center justify-center shadow-md shadow-blue-500/25">
              <span className="text-white font-extrabold text-sm">FP</span>
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900">FinancePro OHADA</span>
              <div className="text-[10px] text-slate-500 font-semibold">Assistant de création d'entreprise</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-semibold">Étape {currentStep} / 10</span>
            <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-slate-200 shadow-sm">
              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[11px] font-extrabold text-[#2563eb]">{progress}%</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 pb-6">

          {/* Left Sidebar — Steps Navigation */}
          <aside className="lg:col-span-3 flex flex-col gap-4">
            {/* Steps List */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-1">
              {STEP_LABELS.map((label, idx) => {
                const step = idx + 1;
                const isActive = step === currentStep;
                const isDone = completedSteps.has(step);
                const isPending = !isActive && !isDone;

                return (
                  <div
                    key={step}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-[#eff6ff] border border-[#bfdbfe]'
                        : isDone
                        ? 'hover:bg-slate-50'
                        : 'opacity-60'
                    }`}
                  >
                    {/* Step Number / Check Indicator */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-extrabold transition-all duration-300 ${
                        isDone
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                          : isActive
                          ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/30'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : step}
                    </div>

                    {/* Step Label */}
                    <div>
                      <div
                        className={`text-xs font-bold leading-tight ${
                          isActive ? 'text-[#1e40af]' : isDone ? 'text-slate-700' : 'text-slate-400'
                        }`}
                      >
                        {label}
                      </div>
                      {isActive && (
                        <div className="text-[10px] text-blue-500 font-semibold mt-0.5">En cours</div>
                      )}
                      {isDone && (
                        <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Complété ✓</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Tip Panel */}
            {tip && (
              <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  </div>
                  <span className="text-[11px] font-extrabold text-violet-800 uppercase tracking-wide">IA Conseil</span>
                </div>
                <p className="text-[11px] text-violet-700 font-semibold leading-snug">
                  💡 {tip.conseil}
                </p>
              </div>
            )}

            {/* Security Badge */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm">🔒</span>
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wide">Données Sécurisées</div>
                <div className="text-[10px] text-emerald-600 leading-snug">Chiffrement SSL + Sauvegarde Cloud auto</div>
              </div>
            </div>
          </aside>

          {/* Right Content Area */}
          <main className="lg:col-span-9">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm min-h-full p-6 sm:p-8">
              {children}
            </div>
          </main>

        </div>
      </div>
    </div>
  );
};

export default WizardLayout;
