import React, { useEffect, useState } from 'react';
import { Package, Plus, X, Info, AlertTriangle } from 'lucide-react';
import { AccountSYSCOHADA, StockArticle, StockArticleDetail, StockSynthese } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

export const StocksModule: React.FC = () => {
  const [articles, setArticles] = useState<StockArticle[]>([]);
  const [accounts, setAccounts] = useState<AccountSYSCOHADA[]>([]);
  const [synthese, setSynthese] = useState<StockSynthese | null>(null);
  const [selected, setSelected] = useState<StockArticleDetail | null>(null);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showMouvementModal, setShowMouvementModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [label, setLabel] = useState('');
  const [unite, setUnite] = useState('unité');
  const [accountCodeStock, setAccountCodeStock] = useState('');
  const [seuilAlerte, setSeuilAlerte] = useState('');

  const [mvtType, setMvtType] = useState<'ENTREE' | 'SORTIE'>('ENTREE');
  const [mvtDate, setMvtDate] = useState(new Date().toISOString().slice(0, 10));
  const [mvtQuantite, setMvtQuantite] = useState('');
  const [mvtCoutUnitaire, setMvtCoutUnitaire] = useState('');
  const [mvtReference, setMvtReference] = useState('');

  const loadAll = () => {
    api.getStockArticles().then(setArticles);
    api.getStockSynthese().then(setSynthese);
  };

  useEffect(() => {
    api.getAccounts().then(setAccounts);
    loadAll();
  }, []);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  const stockAccounts = accounts.filter((a) => a.classNum === 3);

  const openDetail = (article: StockArticle) => {
    api.getStockArticle(article.id).then(setSelected);
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await api.createStockArticle({
        label,
        unite,
        accountCodeStock,
        seuilAlerte: seuilAlerte ? Number(seuilAlerte) : undefined,
      });
      loadAll();
      setShowArticleModal(false);
      setLabel(''); setUnite('unité'); setAccountCodeStock(''); setSeuilAlerte('');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : "Erreur lors de la création de l'article");
    }
  };

  const handleCreateMouvement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setErrorMessage(null);
    try {
      await api.createStockMouvement({
        articleId: selected.id,
        date: mvtDate,
        type: mvtType,
        quantite: Number(mvtQuantite) || 0,
        coutUnitaire: mvtType === 'ENTREE' ? Number(mvtCoutUnitaire) || 0 : undefined,
        reference: mvtReference || undefined,
      });
      loadAll();
      const refreshed = await api.getStockArticle(selected.id);
      setSelected(refreshed);
      setShowMouvementModal(false);
      setMvtQuantite(''); setMvtCoutUnitaire(''); setMvtReference('');
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Erreur lors de l\'enregistrement du mouvement');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#EDE9FE] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wider text-[#1E1060]">Stocks &amp; Inventaire</h2>
            <div className="text-xs text-slate-500 font-medium mt-1">Valorisation au Coût Unitaire Moyen Pondéré (CUMP)</div>
          </div>
        </div>
        <button
          onClick={() => setShowArticleModal(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#6B4EFF] hover:bg-[#5538E0] text-white rounded-xl text-xs font-bold transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel article</span>
        </button>
      </div>

      {synthese && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-[#EDE9FE] shadow-sm">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Valeur totale du stock</div>
            <div className="text-sm font-extrabold text-emerald-600 mt-1">{formatMoney(synthese.valeurTotale)}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#EDE9FE] shadow-sm">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Articles suivis</div>
            <div className="text-sm font-extrabold text-slate-800 mt-1">{synthese.nbArticles}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#EDE9FE] shadow-sm md:col-span-1 col-span-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Par compte SYSCOHADA</div>
            {synthese.parCompte.length === 0 ? (
              <div className="text-xs text-slate-400 italic">—</div>
            ) : (
              synthese.parCompte.map((p) => (
                <div key={p.accountCode} className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-500">{p.accountCode}</span>
                  <span className="font-bold text-slate-700">{formatMoney(p.valeur)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          La variation de stock n'est pas comptabilisée automatiquement. Utilisez les valeurs par compte ci-dessus pour saisir
          manuellement l'écriture d'inventaire (débit/crédit 60 selon variation) dans le module Comptabilité, comme le
          fait votre expert-comptable en fin de période.
        </span>
      </div>

      {errorMessage && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg p-3">{errorMessage}</div>}

      <div className="bg-white rounded-xl border border-[#EDE9FE] shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-[#EDE9FE] text-left text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Article</th>
              <th className="px-4 py-3">Compte</th>
              <th className="px-4 py-3 text-right">Quantité</th>
              <th className="px-4 py-3 text-right">CUMP</th>
              <th className="px-4 py-3 text-right">Valeur</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">Aucun article enregistré.</td></tr>
            )}
            {articles.map((a) => {
              const enAlerte = a.seuilAlerte !== undefined && a.etat.quantite <= a.seuilAlerte;
              return (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50/60 cursor-pointer" onClick={() => openDetail(a)}>
                  <td className="px-4 py-3 font-mono text-slate-500">{a.code}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{a.label}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono">{a.accountCodeStock}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className="inline-flex items-center gap-1">
                      {enAlerte && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                      {a.etat.quantite} {a.unite}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">{formatMoney(a.etat.cump)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">{formatMoney(a.etat.valeur)}</td>
                  <td className="px-4 py-3 text-right text-[10px] font-bold text-violet-600">Détail →</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl space-y-4 border border-slate-200 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#1E1060]">{selected.label} — {selected.code}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-slate-400 uppercase text-[10px] font-bold">Quantité</div>
                <div className="font-extrabold text-slate-800 mt-1">{selected.etat.quantite} {selected.unite}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-slate-400 uppercase text-[10px] font-bold">CUMP</div>
                <div className="font-extrabold text-slate-800 mt-1">{formatMoney(selected.etat.cump)}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-slate-400 uppercase text-[10px] font-bold">Valeur</div>
                <div className="font-extrabold text-emerald-600 mt-1">{formatMoney(selected.etat.valeur)}</div>
              </div>
            </div>

            <button
              onClick={() => setShowMouvementModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> Nouveau mouvement
            </button>

            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#EDE9FE] text-left text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4 text-right">Quantité</th>
                  <th className="py-2 pr-4 text-right">Coût unitaire</th>
                  <th className="py-2 pr-4 text-right">Valeur</th>
                  <th className="py-2">Référence</th>
                </tr>
              </thead>
              <tbody>
                {selected.mouvements.length === 0 && (
                  <tr><td colSpan={6} className="py-4 text-center text-slate-400 italic">Aucun mouvement</td></tr>
                )}
                {selected.mouvements.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 text-slate-600">{new Date(m.date).toLocaleDateString('fr-FR')}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${m.type === 'ENTREE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {m.type === 'ENTREE' ? 'Entrée' : 'Sortie'}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono">{m.quantite}</td>
                    <td className="py-2 pr-4 text-right font-mono">{formatMoney(m.coutUnitaire)}</td>
                    <td className="py-2 pr-4 text-right font-mono font-bold">{formatMoney(m.valeurTotale)}</td>
                    <td className="py-2 text-slate-500">{m.reference ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showMouvementModal && selected && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-800">Nouveau mouvement — {selected.label}</h3>
            <form onSubmit={handleCreateMouvement} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setMvtType('ENTREE')} className={`py-2 rounded-lg text-xs font-bold ${mvtType === 'ENTREE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Entrée</button>
                <button type="button" onClick={() => setMvtType('SORTIE')} className={`py-2 rounded-lg text-xs font-bold ${mvtType === 'SORTIE' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Sortie</button>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Date</label>
                <input type="date" value={mvtDate} onChange={(e) => setMvtDate(e.target.value)} required className="w-full glass-input rounded-lg px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Quantité ({selected.unite})</label>
                <input type="number" step="0.001" value={mvtQuantite} onChange={(e) => setMvtQuantite(e.target.value)} required min="0.001" className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
              </div>
              {mvtType === 'ENTREE' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Coût unitaire (XAF)</label>
                  <input type="number" value={mvtCoutUnitaire} onChange={(e) => setMvtCoutUnitaire(e.target.value)} required min="0" className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
                </div>
              )}
              {mvtType === 'SORTIE' && (
                <div className="text-[11px] text-slate-500 bg-slate-50 rounded-lg p-2.5">
                  Valorisée automatiquement au CUMP courant : {formatMoney(selected.etat.cump)} / {selected.unite}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Référence (optionnel)</label>
                <input type="text" value={mvtReference} onChange={(e) => setMvtReference(e.target.value)} className="w-full glass-input rounded-lg px-3 py-2 text-xs" placeholder="Ex: BL-2026-014" />
              </div>

              {errorMessage && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg p-3">{errorMessage}</div>}

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowMouvementModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">Annuler</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showArticleModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-800">Nouvel article de stock</h3>
            <form onSubmit={handleCreateArticle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Libellé</label>
                <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} required className="w-full glass-input rounded-lg px-3 py-2 text-xs" placeholder="Ex: Sac de ciment 50kg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Unité</label>
                  <input type="text" value={unite} onChange={(e) => setUnite(e.target.value)} required className="w-full glass-input rounded-lg px-3 py-2 text-xs" placeholder="unité, kg, litre..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Seuil d'alerte (optionnel)</label>
                  <input type="number" value={seuilAlerte} onChange={(e) => setSeuilAlerte(e.target.value)} min="0" className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Compte SYSCOHADA (classe 3 — Stocks)</label>
                <select value={accountCodeStock} onChange={(e) => setAccountCodeStock(e.target.value)} required className="w-full glass-input rounded-lg px-3 py-2 text-xs font-mono">
                  <option value="">— Sélectionner —</option>
                  {stockAccounts.map((a) => <option key={a.code} value={a.code}>{a.code} - {a.label}</option>)}
                </select>
              </div>

              {errorMessage && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg p-3">{errorMessage}</div>}

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowArticleModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">Annuler</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StocksModule;
