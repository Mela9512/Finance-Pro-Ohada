import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Network, Plus, X } from 'lucide-react';
import { StepProps } from './types';

// Reusable TagInput component for dynamic lists
const TagInput: React.FC<{
  label: string;
  placeholder: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  suggestions?: string[];
  color?: string;
}> = ({ label, placeholder, tags, onAdd, onRemove, suggestions, color = 'blue' }) => {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
      setInput('');
    }
  };

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    violet: 'bg-violet-50 text-violet-800 border-violet-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    rose: 'bg-rose-50 text-rose-800 border-rose-200',
    teal: 'bg-teal-50 text-teal-800 border-teal-200',
  };

  return (
    <div>
      <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 bg-[#f8fafc] border border-slate-200 focus:bg-white focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold outline-none transition-all"
        />
        <button type="button" onClick={add}
          className="px-3 py-2 rounded-xl bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {suggestions && suggestions.length > 0 && tags.length === 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {suggestions.map(s => (
            <button key={s} type="button" onClick={() => onAdd(s)}
              className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold transition-colors">
              + {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {tags.map(tag => (
          <span key={tag} className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${colorClasses[color]}`}>
            {tag}
            <button type="button" onClick={() => onRemove(tag)} className="hover:opacity-70 transition-opacity">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-[11px] text-slate-400 italic">Aucun élément ajouté</span>}
      </div>
    </div>
  );
};

export const Step7Organisation: React.FC<StepProps> = ({ data, onChange, onNext, onPrev }) => {
  const { step7 } = data;

  const updateList = (field: keyof typeof step7, action: 'add' | 'remove', value: string) => {
    const current = step7[field] as string[];
    const updated = action === 'add'
      ? [...current, value]
      : current.filter(v => v !== value);
    onChange('step7', { ...step7, [field]: updated });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleNext} className="space-y-7">
      <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/25">
          <Network className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Organisation de l'entreprise</h2>
          <p className="text-xs text-slate-500 mt-1">Structurez votre entreprise en unités organisationnelles. Ces entités permettront la comptabilité analytique et le suivi par centre de coûts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TagInput
          label="Départements"
          placeholder="Ex: Comptabilité... (Entrée)"
          tags={step7.departements}
          onAdd={v => updateList('departements', 'add', v)}
          onRemove={v => updateList('departements', 'remove', v)}
          suggestions={['Comptabilité', 'Direction Générale', 'Commercial', 'RH', 'Logistique', 'IT']}
          color="blue"
        />

        <TagInput
          label="Directions"
          placeholder="Ex: Direction Financière..."
          tags={step7.directions}
          onAdd={v => updateList('directions', 'add', v)}
          onRemove={v => updateList('directions', 'remove', v)}
          suggestions={['Direction Financière', 'Direction Commerciale', 'Direction Générale', 'Direction Technique']}
          color="violet"
        />

        <TagInput
          label="Agences / Sites"
          placeholder="Ex: Agence Pointe-Noire..."
          tags={step7.agences}
          onAdd={v => updateList('agences', 'add', v)}
          onRemove={v => updateList('agences', 'remove', v)}
          suggestions={['Siège Social', 'Agence Pointe-Noire', 'Agence Kinshasa', 'Entrepôt principal']}
          color="teal"
        />

        <TagInput
          label="Centres de coûts"
          placeholder="Ex: CC-ADM-001..."
          tags={step7.centresCouts}
          onAdd={v => updateList('centresCouts', 'add', v)}
          onRemove={v => updateList('centresCouts', 'remove', v)}
          suggestions={['CC-Administration', 'CC-Production', 'CC-Commercial', 'CC-Logistique']}
          color="amber"
        />

        <TagInput
          label="Centres de profits"
          placeholder="Ex: CP-VENTES-001..."
          tags={step7.centresProfits}
          onAdd={v => updateList('centresProfits', 'add', v)}
          onRemove={v => updateList('centresProfits', 'remove', v)}
          suggestions={['CP-Ventes', 'CP-Services', 'CP-Export']}
          color="emerald"
        />

        <TagInput
          label="Projets"
          placeholder="Ex: Projet Expansion 2026..."
          tags={step7.projets}
          onAdd={v => updateList('projets', 'add', v)}
          onRemove={v => updateList('projets', 'remove', v)}
          suggestions={['Extension réseau', 'Projet ISO', 'Formation équipe']}
          color="rose"
        />
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-xs text-indigo-800">
        <span className="font-extrabold">📊 Conseil analytique :</span> Les centres de coûts et de profits permettent d'imputer automatiquement les écritures et de générer des rapports par entité. Cliquez sur les suggestions pour les ajouter rapidement.
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

export default Step7Organisation;
