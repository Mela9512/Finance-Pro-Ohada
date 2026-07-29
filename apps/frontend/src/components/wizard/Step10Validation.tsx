import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Edit3, Download, PlayCircle } from 'lucide-react';
import { StepProps, MODULES_LISTE, ROLES_UTILISATEURS, FORMES_JURIDIQUES } from './types';

interface Step10ValidationProps extends StepProps {
  onGoToStep: (step: number) => void;
  isSubmitting: boolean;
}

const SummarySection: React.FC<{
  title: string;
  icon: string;
  stepNumber: number;
  onEdit: () => void;
  children: React.ReactNode;
}> = ({ title, icon, stepNumber, onEdit, children }) => (
  <div className="border border-slate-200 rounded-2xl overflow-hidden">
    <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-200">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">{title}</span>
        <span className="text-[10px] font-bold text-slate-400">— Étape {stepNumber}</span>
      </div>
      <button type="button" onClick={onEdit}
        className="flex items-center gap-1.5 text-[11px] font-bold text-[#2563eb] hover:text-[#1d4ed8] transition-colors px-2.5 py-1 rounded-lg hover:bg-blue-50">
        <Edit3 className="w-3.5 h-3.5" /> Modifier
      </button>
    </div>
    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
      {children}
    </div>
  </div>
);

const Field: React.FC<{ label: string; value?: string | boolean | number | null }> = ({ label, value }) => {
  const display = value === true ? '✓ Oui' : value === false ? '✗ Non' : (value || '—');
  return (
    <div>
      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-xs font-bold text-slate-900 truncate">{String(display)}</div>
    </div>
  );
};

export const Step10Validation: React.FC<Step10ValidationProps> = ({
  data, onPrev, onGoToStep, onNext, isSubmitting
}) => {
  const { step1, step2, step3, step4, step5, step6, step7, step8, step9 } = data;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const handlePrint = () => {
    window.print();
  };

  const activeModules = step9.modules
    .map(id => MODULES_LISTE.find(m => m.id === id))
    .filter(Boolean);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/25">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Récapitulatif & Validation</h2>
          <p className="text-xs text-slate-500 mt-1">Vérifiez toutes les informations avant de créer votre entreprise. Cliquez sur "Modifier" pour corriger une section.</p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        <span className="text-xs font-extrabold text-emerald-800">9 étapes complétées — Votre entreprise est prête à être créée</span>
      </div>

      {/* Summary Sections */}
      <div className="space-y-4">
        <SummarySection title="Informations générales" icon="🏢" stepNumber={1} onEdit={() => onGoToStep(1)}>
          <Field label="Nom commercial" value={step1.companyName} />
          <Field label="Devise" value={step1.devise} />
          <Field label="Pays" value={step1.pays} />
          <Field label="Langue" value={step1.langue === 'fr' ? 'Français' : step1.langue} />
          {step1.logo && (
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Logo</div>
              <img src={step1.logo} alt="Logo" className="h-8 w-auto object-contain rounded border border-slate-200" />
            </div>
          )}
        </SummarySection>

        <SummarySection title="Identification légale" icon="📋" stepNumber={2} onEdit={() => onGoToStep(2)}>
          <Field label="Raison sociale" value={step2.raisonSociale} />
          <Field label="Sigle" value={step2.sigle} />
          <Field label="Forme juridique" value={step2.formeJuridique.split(' — ')[0]} />
          <Field label="RCCM" value={step2.rccm} />
          <Field label="NIU / NIF" value={step2.nif} />
          <Field label="Capital" value={step2.capital ? `${Number(step2.capital).toLocaleString('fr-FR')} ${step1.devise}` : undefined} />
          <Field label="Secteur" value={step2.secteur} />
          <Field label="Date création" value={step2.dateCreation} />
        </SummarySection>

        <SummarySection title="Coordonnées" icon="📍" stepNumber={3} onEdit={() => onGoToStep(3)}>
          <Field label="Adresse" value={step3.adresse} />
          <Field label="Ville" value={step3.ville} />
          <Field label="Région" value={step3.region} />
          <Field label="Téléphone" value={step3.telephone} />
          <Field label="E-mail" value={step3.email} />
          <Field label="Site web" value={step3.siteWeb} />
        </SummarySection>

        <SummarySection title="Comptabilité" icon="📒" stepNumber={4} onEdit={() => onGoToStep(4)}>
          <Field label="Référentiel" value="SYSCOHADA Révisé" />
          <Field label="Exercice" value={step4.exercice} />
          <Field label="Date ouverture" value={step4.dateOuverture} />
          <Field label="Date clôture" value={step4.dateCloture} />
          <Field label="Longueur comptes" value={`${step4.longueurComptes} chiffres`} />
          <Field label="Décimales" value={`${step4.decimales}`} />
        </SummarySection>

        <SummarySection title="Fiscalité" icon="🏛️" stepNumber={5} onEdit={() => onGoToStep(5)}>
          <Field label="Régime fiscal" value={step5.regimeFiscal} />
          <Field label="Centre impôts" value={step5.centreImpots} />
          <Field label="N° Contribuable" value={step5.numContribuable} />
          <Field label="TVA" value={step5.assujettTVA} />
          {step5.assujettTVA && <Field label="Taux TVA" value={`${step5.tauxTVA}%`} />}
          <Field label="Retenue source" value={step5.retenueSource} />
          <Field label="IS" value={step5.is} />
        </SummarySection>

        <SummarySection title="Banque & Trésorerie" icon="🏦" stepNumber={6} onEdit={() => onGoToStep(6)}>
          <Field label="Banque" value={step6.banquePrincipale} />
          <Field label="N° Compte" value={step6.numCompte} />
          <Field label="Devise compte" value={step6.deviseCompte} />
          <Field label="Caisse" value={step6.caissePrincipale} />
          <div className="col-span-2">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">Modes de paiement</div>
            <div className="flex flex-wrap gap-1">
              {step6.modesPaiement.map(m => (
                <span key={m} className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-md">{m}</span>
              ))}
            </div>
          </div>
        </SummarySection>

        {/* Organisation summary */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏗️</span>
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Organisation</span>
              <span className="text-[10px] font-bold text-slate-400">— Étape 7</span>
            </div>
            <button type="button" onClick={() => onGoToStep(7)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-[#2563eb] hover:text-[#1d4ed8] transition-colors px-2.5 py-1 rounded-lg hover:bg-blue-50">
              <Edit3 className="w-3.5 h-3.5" /> Modifier
            </button>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Départements', items: step7.departements },
              { label: 'Directions', items: step7.directions },
              { label: 'Agences', items: step7.agences },
              { label: 'Centres coûts', items: step7.centresCouts },
              { label: 'Centres profits', items: step7.centresProfits },
              { label: 'Projets', items: step7.projets },
            ].map(g => (
              <div key={g.label}>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-1">{g.label}</div>
                {g.items.length > 0
                  ? <div className="flex flex-wrap gap-1">{g.items.map(i => <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded">{i}</span>)}</div>
                  : <span className="text-[10px] text-slate-400">—</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Modules summary */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧩</span>
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Modules activés ({activeModules.length})</span>
            </div>
            <button type="button" onClick={() => onGoToStep(9)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-[#2563eb] hover:text-[#1d4ed8] transition-colors px-2.5 py-1 rounded-lg hover:bg-blue-50">
              <Edit3 className="w-3.5 h-3.5" /> Modifier
            </button>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {activeModules.map(mod => mod && (
              <span key={mod.id} className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
                mod.obligatoire ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                {mod.icon} {mod.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <Download className="w-4 h-4" />
          Télécharger la fiche
        </button>

        <button
          type="button"
          onClick={onPrev}
          className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Précédent
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.99] disabled:opacity-60"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Création en cours...</>
          ) : (
            <><PlayCircle className="w-4 h-4" /> Créer l'entreprise</>
          )}
        </button>
      </div>
    </form>
  );
};

export default Step10Validation;
