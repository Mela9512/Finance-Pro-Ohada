import React, { useEffect, useState } from 'react';
import { Download, Landmark, Info } from 'lucide-react';
import { FiscalDeclaration } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

const now = new Date();

export const FiscaliteModule: React.FC = () => {
  const [fiscalYear, setFiscalYear] = useState(now.getFullYear());
  const [fiscalMonth, setFiscalMonth] = useState(now.getMonth() + 1);
  const [fiscalData, setFiscalData] = useState<FiscalDeclaration | null>(null);
  const [yearOverview, setYearOverview] = useState<FiscalDeclaration[] | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  useEffect(() => {
    api.getFiscalDeclaration(fiscalYear, fiscalMonth).then(setFiscalData);
  }, [fiscalYear, fiscalMonth]);

  useEffect(() => {
    setOverviewLoading(true);
    Promise.all(Array.from({ length: 12 }, (_, i) => api.getFiscalDeclaration(fiscalYear, i + 1)))
      .then(setYearOverview)
      .finally(() => setOverviewLoading(false));
  }, [fiscalYear]);

  const handleDownload = async () => {
    setDownloadError(null);
    try {
      await api.downloadFiscalDeclarationPdf(fiscalYear, fiscalMonth);
    } catch (err) {
      setDownloadError(err instanceof ApiError ? err.message : 'Erreur lors du téléchargement du PDF');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#EDE9FE] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Landmark className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold uppercase tracking-wider text-[#1E1060]">Fiscalité — TVA &amp; AIR</h2>
            <div className="text-xs text-slate-500 font-medium mt-1">Calculée en temps réel depuis le Grand Livre et vos factures validées</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-[#EDE9FE] shadow-sm">
        <select
          value={fiscalMonth}
          onChange={(e) => setFiscalMonth(Number(e.target.value))}
          className="glass-input rounded-lg px-3 py-1.5 text-xs"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long' })}</option>
          ))}
        </select>
        <select
          value={fiscalYear}
          onChange={(e) => setFiscalYear(Number(e.target.value))}
          className="glass-input rounded-lg px-3 py-1.5 text-xs"
        >
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Télécharger PDF</span>
        </button>
      </div>

      {downloadError && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg p-3">{downloadError}</div>}

      <div className="bg-white rounded-xl p-6 space-y-4 border border-[#EDE9FE] shadow-sm">
        {!fiscalData ? (
          <div className="text-slate-400 text-xs italic">Chargement...</div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            <div>
              <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#EDE9FE] pb-1 mb-2">
                TVA — {fiscalData.periodLabel}
              </div>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between"><span className="text-slate-500">TVA collectée (compte 443)</span><span className="text-slate-800 font-bold">{formatMoney(fiscalData.tvaCollectee)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">TVA récupérable (compte 445)</span><span className="text-slate-800 font-bold">{formatMoney(fiscalData.tvaRecuperable)}</span></div>
                <div className={`flex justify-between p-2.5 rounded border font-bold ${fiscalData.tvaAPayer >= 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                  <span>{fiscalData.tvaAPayer >= 0 ? 'TVA à reverser' : 'Crédit de TVA à reporter'}</span>
                  <span>{formatMoney(Math.abs(fiscalData.tvaAPayer))}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#EDE9FE] pb-1 mb-2">
                AIR (Retenue à la Source)
              </div>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Retenues subies sur ventes (à valoir sur l'IS)</span><span className="text-slate-800 font-bold">{formatMoney(fiscalData.airSurVentes)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Retenues opérées sur achats</span><span className="text-slate-800 font-bold">{formatMoney(fiscalData.airSurAchats)}</span></div>
                <div className="flex justify-between p-2.5 rounded border bg-indigo-50 border-indigo-200 text-indigo-700 font-bold">
                  <span>AIR à reverser au Trésor</span>
                  <span>{formatMoney(fiscalData.airTotal)}</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 italic">
              Déclaration indicative générée à partir du Grand Livre et des factures validées — à vérifier avant transmission à l'administration fiscale.
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 space-y-3 border border-[#EDE9FE] shadow-sm">
        <h3 className="text-sm font-bold text-[#1E1060] uppercase tracking-wider">Vue annuelle {fiscalYear}</h3>
        {overviewLoading || !yearOverview ? (
          <div className="text-slate-400 text-xs italic">Calcul en cours pour les 12 mois...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#EDE9FE] text-left text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-2 pr-4">Mois</th>
                  <th className="py-2 pr-4 text-right">TVA à reverser / crédit</th>
                  <th className="py-2 text-right">AIR à reverser</th>
                </tr>
              </thead>
              <tbody>
                {yearOverview.map((d) => (
                  <tr
                    key={d.month}
                    onClick={() => setFiscalMonth(d.month)}
                    className={`border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${d.month === fiscalMonth ? 'bg-violet-50' : ''}`}
                  >
                    <td className="py-2 pr-4 font-bold text-slate-700">{d.periodLabel}</td>
                    <td className={`py-2 pr-4 text-right font-mono ${d.tvaAPayer >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {d.tvaAPayer >= 0 ? formatMoney(d.tvaAPayer) : `(${formatMoney(Math.abs(d.tvaAPayer))})`}
                    </td>
                    <td className="py-2 text-right font-mono text-indigo-600">{formatMoney(d.airTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-extrabold text-slate-800">
                  <td className="py-2 pr-4">Total {fiscalYear}</td>
                  <td className="py-2 pr-4 text-right font-mono">{formatMoney(yearOverview.reduce((s, d) => s + d.tvaAPayer, 0))}</td>
                  <td className="py-2 text-right font-mono">{formatMoney(yearOverview.reduce((s, d) => s + d.airTotal, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Rappels informatifs généraux (zone OHADA/CEMAC) : la déclaration de TVA est habituellement à souscrire avant le 15 du mois suivant,
          et les retenues à la source (AIR) sont à reverser selon le calendrier propre à votre pays d'immatriculation. Ces échéances varient
          selon la législation fiscale nationale exacte — vérifiez-les auprès de votre centre des impôts.
        </span>
      </div>
    </div>
  );
};

export default FiscaliteModule;
