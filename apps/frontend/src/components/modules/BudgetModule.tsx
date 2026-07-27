import React, { useEffect, useState } from 'react';
import { Target, Plus, TrendingUp, TrendingDown, Sparkles, AlertTriangle } from 'lucide-react';
import { AccountSYSCOHADA, BudgetComparisonRow } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

const VARIANCE_ALERT_THRESHOLD = 15;

export const BudgetModule: React.FC = () => {
  const [exercice, setExercice] = useState(new Date().getFullYear());
  const [comparison, setComparison] = useState<BudgetComparisonRow[]>([]);
  const [accounts, setAccounts] = useState<AccountSYSCOHADA[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [accountCode, setAccountCode] = useState('601');
  const [period, setPeriod] = useState('');
  const [amountBudgeted, setAmountBudgeted] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [budgetAnalyseIA, setBudgetAnalyseIA] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<{ basedOnYear: number; suggestedAmount: number } | null>(null);

  const loadComparison = () => api.getBudgetComparison(exercice).then(setComparison);

  useEffect(() => {
    api.getAccounts().then(setAccounts);
    api.aiGetAnomalies().then((report) => {
      const hasBudgetAnomaly = report.anomalies.some((a) => a.type === 'BUDGET_VARIANCE');
      setBudgetAnalyseIA(hasBudgetAnomaly ? report.analyseIA : null);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadComparison();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercice]);

  useEffect(() => {
    if (!showModal || !accountCode) {
      setSuggestion(null);
      return;
    }
    api.aiSuggestBudget(accountCode, exercice)
      .then((res) => setSuggestion(res.suggestedAmount > 0 ? { basedOnYear: res.basedOnYear, suggestedAmount: res.suggestedAmount } : null))
      .catch(() => setSuggestion(null));
  }, [showModal, accountCode, exercice]);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await api.upsertBudget({
        accountCode,
        exercice,
        period: period ? Number(period) : undefined,
        amountBudgeted: Number(amountBudgeted) || 0,
      });
      await loadComparison();
      setShowModal(false);
      setAmountBudgeted('');
      setPeriod('');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de la création de la ligne budgétaire');
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  const chargesAccounts = accounts.filter((a) => a.classNum === 6 || a.classNum === 7);
  const totalBudgeted = comparison.reduce((s, r) => s + r.budgeted, 0);
  const totalActual = comparison.reduce((s, r) => s + r.actual, 0);

  return (
    <div className="space-y-6 bg-[#f4f7fc] min-h-screen p-4 sm:p-6 text-slate-900 rounded-2xl">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">Budget prévisionnel vs Réel</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-blue-900 font-bold font-mono">Budget: {formatMoney(totalBudgeted)}</span>
            <span className="text-xs text-slate-500 font-medium font-mono">Réalisé: {formatMoney(totalActual)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={exercice}
            onChange={(e) => setExercice(Number(e.target.value))}
            className="glass-input rounded-lg px-3 py-2 text-xs"
          >
            {[exercice - 1, exercice, exercice + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#0f2d5e] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle ligne budgétaire</span>
          </button>
        </div>
      </div>

      {errorMessage && <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">{errorMessage}</div>}

      {budgetAnalyseIA && (
        <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs rounded-xl p-4">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-indigo-500" />
          <span>{budgetAnalyseIA}</span>
        </div>
      )}

      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Comparatif Budget / Réalisé par Compte</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3">Compte</th>
                <th className="p-3 font-sans">Intitulé</th>
                <th className="p-3 text-right">Budget</th>
                <th className="p-3 text-right">Réel</th>
                <th className="p-3 text-right">Écart</th>
                <th className="p-3 text-right">Écart %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {comparison.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-center text-slate-500 italic font-sans">Aucune donnée budgétaire pour {exercice}</td></tr>
              )}
              {comparison.map((row) => {
                const isAlert = row.variancePercent !== null && Math.abs(row.variancePercent) > VARIANCE_ALERT_THRESHOLD;
                return (
                  <tr key={row.accountCode} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-emerald-400">{row.accountCode}</td>
                    <td className="p-3 font-sans text-slate-200">{row.label}</td>
                    <td className="p-3 text-right text-slate-300">{formatMoney(row.budgeted)}</td>
                    <td className="p-3 text-right text-white font-bold">{formatMoney(row.actual)}</td>
                    <td className={`p-3 text-right font-bold ${row.variance >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      <span className="inline-flex items-center gap-1">
                        {row.variance >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {formatMoney(Math.abs(row.variance))}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {row.variancePercent !== null ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isAlert ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {row.variancePercent >= 0 ? '+' : ''}{row.variancePercent.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md space-y-4 border border-slate-700">
            <h3 className="text-base font-bold text-white">Nouvelle Ligne Budgétaire ({exercice})</h3>
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Compte SYSCOHADA (Charge ou Produit)</label>
                <select value={accountCode} onChange={(e) => setAccountCode(e.target.value)} className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono">
                  {chargesAccounts.map((a) => (
                    <option key={a.code} value={a.code}>{a.code} - {a.label}</option>
                  ))}
                </select>
                {suggestion && (
                  <button
                    type="button"
                    onClick={() => setAmountBudgeted(String(suggestion.suggestedAmount))}
                    className="mt-1 flex items-center gap-1 text-[10px] text-indigo-300 hover:text-indigo-200"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Suggestion basée sur le réel {suggestion.basedOnYear} : {formatMoney(suggestion.suggestedAmount)} (appliquer)</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mois (optionnel — vide = budget annuel)</label>
                <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full glass-input rounded-lg px-3 py-2 text-xs">
                  <option value="">Annuel</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Montant Budgété (XAF)</label>
                <input
                  type="number"
                  value={amountBudgeted}
                  onChange={(e) => setAmountBudgeted(e.target.value)}
                  className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-400"
                  required
                />
              </div>

              {errorMessage && <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg p-3">{errorMessage}</div>}

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold">
                  Annuler
                </button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
