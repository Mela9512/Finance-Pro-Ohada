import React, { useEffect, useState } from 'react';
import { Rocket, Plus, Download, Trash2, ArrowLeft, TrendingUp, Gauge, Sparkles } from 'lucide-react';
import { BusinessPlan, CreateBusinessPlanDto } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-bold text-[#1E1060]">{part.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

function renderNarrative(narrative: string) {
  const lines = narrative.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.map((line, i) =>
    line.startsWith('## ') ? (
      <h4 key={i} className="text-sm font-extrabold text-[#1E1060] mt-4 first:mt-0">{line.substring(3)}</h4>
    ) : (
      <p key={i} className="text-xs text-slate-600 leading-relaxed">{renderInlineBold(line)}</p>
    ),
  );
}

const emptyForm: CreateBusinessPlanDto = {
  title: '',
  projectDescription: '',
  investmentAmount: 10000000,
  projectionYears: 3,
  year1Revenue: 8000000,
  revenueGrowthRatePercent: 10,
  variableCostPercent: 40,
  fixedCostsAnnual: 2000000,
  discountRatePercent: 10,
};

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-400 border-emerald-800 bg-emerald-950';
  if (score >= 40) return 'text-amber-300 border-amber-800 bg-amber-950';
  return 'text-rose-400 border-rose-800 bg-rose-950';
}

export const BusinessPlanModule: React.FC = () => {
  const [plans, setPlans] = useState<BusinessPlan[]>([]);
  const [selected, setSelected] = useState<BusinessPlan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateBusinessPlanDto>(emptyForm);
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionRationale, setSuggestionRationale] = useState<string | null>(null);

  const loadPlans = () => api.getBusinessPlans().then(setPlans);

  const handleSuggestHypotheses = async () => {
    if (!form.title.trim() || !form.projectDescription.trim()) return;
    setSuggesting(true);
    setSuggestionRationale(null);
    try {
      const suggestion = await api.suggestBusinessPlanHypotheses(form.title, form.projectDescription);
      setForm({
        ...form,
        investmentAmount: suggestion.investmentAmount,
        projectionYears: suggestion.projectionYears,
        year1Revenue: suggestion.year1Revenue,
        revenueGrowthRatePercent: suggestion.revenueGrowthRatePercent,
        variableCostPercent: suggestion.variableCostPercent,
        fixedCostsAnnual: suggestion.fixedCostsAnnual,
        discountRatePercent: suggestion.discountRatePercent,
      });
      setSuggestionRationale(suggestion.rationale);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de la suggestion IA');
    } finally {
      setSuggesting(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setErrorMessage(null);
    try {
      const plan = await api.createBusinessPlan(form);
      await loadPlans();
      setShowModal(false);
      setForm(emptyForm);
      setSelected(plan);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de la génération du business plan');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteBusinessPlan(id);
      await loadPlans();
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de la suppression');
    }
  };

  const handleDownload = async (id: string) => {
    try {
      await api.downloadBusinessPlanPdf(id);
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors du téléchargement du PDF');
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  if (selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Retour à la liste
          </button>
          <button
            onClick={() => handleDownload(selected.id)}
            className="flex items-center gap-2 px-4 py-2 bg-[#6B4EFF] hover:bg-[#5538E0] text-white rounded-xl text-xs font-bold"
          >
            <Download className="w-4 h-4" /> Télécharger PDF
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#EDE9FE] shadow-sm">
          <h2 className="text-base font-extrabold text-slate-900">{selected.title}</h2>
          <p className="text-xs text-slate-500 mt-1">{selected.projectDescription}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4">
            <div className="text-[10px] text-slate-400 uppercase font-bold">VAN (taux {selected.discountRatePercent}%)</div>
            <div className={`text-lg font-extrabold font-mono mt-1 ${selected.van >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatMoney(selected.van)}</div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-[10px] text-slate-400 uppercase font-bold">TRI</div>
            <div className="text-lg font-extrabold font-mono mt-1 text-white">{selected.tri !== null ? `${selected.tri.toFixed(1)}%` : 'N/A'}</div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Seuil de rentabilité</div>
            <div className="text-lg font-extrabold font-mono mt-1 text-white">
              {Number.isFinite(selected.seuilRentabilite) ? formatMoney(selected.seuilRentabilite) : 'Non atteignable'}
            </div>
          </div>
          <div className={`glass-card rounded-xl p-4 border ${scoreColor(selected.creditScore)}`}>
            <div className="text-[10px] uppercase font-bold flex items-center gap-1"><Gauge className="w-3 h-3" /> Score indicatif</div>
            <div className="text-lg font-extrabold font-mono mt-1">{selected.creditScore}/100</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 space-y-4 border border-[#EDE9FE] shadow-sm">
          <h3 className="text-sm font-bold text-[#1E1060] flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> Projections Financières</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#6B4EFF] text-white uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-3">Année</th>
                  <th className="p-3 text-right">Chiffre d'Affaires</th>
                  <th className="p-3 text-right">Charges Variables</th>
                  <th className="p-3 text-right">Charges Fixes</th>
                  <th className="p-3 text-right">Flux Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE9FE]">
                {selected.projections.map((p) => (
                  <tr key={p.year}>
                    <td className="p-3 font-bold text-emerald-400">An {p.year}</td>
                    <td className="p-3 text-right text-slate-200">{formatMoney(p.revenue)}</td>
                    <td className="p-3 text-right text-rose-400">-{formatMoney(p.variableCosts)}</td>
                    <td className="p-3 text-right text-rose-400">-{formatMoney(p.fixedCosts)}</td>
                    <td className={`p-3 text-right font-bold ${p.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatMoney(p.netCashFlow)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 space-y-2 border border-[#EDE9FE] shadow-sm">
          <h3 className="text-sm font-bold text-[#1E1060] mb-2">Business Plan Détaillé (généré par IA)</h3>
          {renderNarrative(selected.narrative)}
          <p className="text-[10px] text-slate-500 italic pt-2">
            Le score de crédibilité est un indicateur interne calculé à partir de vos données réelles et de vos hypothèses — ce n'est pas une notation bancaire officielle.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#EDE9FE] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-extrabold uppercase tracking-wider text-[#1E1060] flex items-center gap-2">
            <Rocket className="w-5 h-5 text-indigo-600" /> Business Plan & Levée de Fonds
          </h2>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Génère un business plan complet à partir de vos données comptables réelles — prêt à présenter à une banque ou un investisseur.
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#6B4EFF] hover:bg-[#5538E0] text-white rounded-xl text-xs font-bold transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Business Plan</span>
        </button>
      </div>

      {errorMessage && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3">{errorMessage}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.length === 0 && (
          <div className="col-span-full text-center text-slate-500 italic text-xs py-8">Aucun business plan généré pour le moment.</div>
        )}
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-xl p-5 space-y-3 border border-[#EDE9FE] shadow-sm cursor-pointer hover:border-indigo-700 border border-transparent" onClick={() => setSelected(plan)}>
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-bold text-[#1E1060]">{plan.title}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${scoreColor(plan.creditScore)}`}>{plan.creditScore}/100</span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">{plan.projectDescription}</p>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">VAN : <span className={plan.van >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatMoney(plan.van)}</span></span>
              <span className="text-slate-500">{new Date(plan.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleDownload(plan.id); }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
                title="Télécharger PDF"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }}
                className="p-1.5 bg-slate-800 hover:bg-rose-900 text-slate-200 rounded"
                title="Supprimer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-lg space-y-4 border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white">Nouveau Business Plan</h3>
            <p className="text-[11px] text-slate-400">
              Les hypothèses ci-dessous sont vos propres prévisions — l'IA les combine avec vos données comptables réelles
              pour calculer VAN, TRI, seuil de rentabilité et un score de crédibilité indicatif.
            </p>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Titre du projet</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full glass-input rounded-lg px-3 py-2 text-xs" placeholder="Ex: Ouverture d'une boulangerie moderne" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description du projet</label>
                <textarea value={form.projectDescription} onChange={(e) => setForm({ ...form, projectDescription: e.target.value })} required rows={3} className="w-full glass-input rounded-lg px-3 py-2 text-xs" placeholder="Décrivez le projet, le marché visé, la stratégie..." />
              </div>

              <button
                type="button"
                onClick={handleSuggestHypotheses}
                disabled={suggesting || !form.title.trim() || !form.projectDescription.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#F3F0FF] hover:bg-[#EDE9FE] disabled:opacity-50 text-[#6B4EFF] rounded-lg text-xs font-bold border border-[#DDD6FE]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {suggesting ? 'Analyse en cours...' : "Suggérer les hypothèses avec l'IA (depuis le titre et la description)"}
              </button>
              {suggestionRationale && (
                <p className="text-[10px] text-[#6B4EFF] bg-[#F8F7FF] rounded-lg p-2.5 border border-[#EDE9FE]">
                  {suggestionRationale} — Valeurs pré-remplies ci-dessous, à ajuster selon votre connaissance réelle du projet.
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Investissement recherché (XAF)</label>
                  <input type="number" value={form.investmentAmount} onChange={(e) => setForm({ ...form, investmentAmount: Number(e.target.value) })} required min={0} className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Durée du projet (années)</label>
                  <input type="number" value={form.projectionYears} onChange={(e) => setForm({ ...form, projectionYears: Number(e.target.value) })} required min={1} max={10} className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">CA prévisionnel année 1 (XAF)</label>
                  <input type="number" value={form.year1Revenue} onChange={(e) => setForm({ ...form, year1Revenue: Number(e.target.value) })} required min={0} className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Croissance annuelle du CA (%)</label>
                  <input type="number" value={form.revenueGrowthRatePercent} onChange={(e) => setForm({ ...form, revenueGrowthRatePercent: Number(e.target.value) })} required className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Charges variables (% du CA)</label>
                  <input type="number" value={form.variableCostPercent} onChange={(e) => setForm({ ...form, variableCostPercent: Number(e.target.value) })} required min={0} max={99} className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Charges fixes annuelles (XAF)</label>
                  <input type="number" value={form.fixedCostsAnnual} onChange={(e) => setForm({ ...form, fixedCostsAnnual: Number(e.target.value) })} required min={0} className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Taux d'actualisation pour la VAN (%)</label>
                <input type="number" value={form.discountRatePercent} onChange={(e) => setForm({ ...form, discountRatePercent: Number(e.target.value) })} required min={0} max={100} className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
              </div>

              {errorMessage && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3">{errorMessage}</div>}

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-[#F3F0FF] text-[#6B4EFF] rounded-lg text-xs font-semibold border border-[#DDD6FE]">
                  Annuler
                </button>
                <button type="submit" disabled={creating} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold">
                  {creating ? 'Génération en cours...' : 'Générer le Business Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
