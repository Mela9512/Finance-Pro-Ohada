import React, { useEffect, useState } from 'react';
import { Download, Sparkles } from 'lucide-react';
import { FinancialReportBilan, CompteDeResultat, FiscalDeclaration, FinancialVariationExplanation } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

const now = new Date();

export const ReportsModule: React.FC = () => {
  const [reportType, setReportType] = useState<'bilan' | 'compte-resultat' | 'fiscal'>('bilan');
  const [bilanData, setBilanData] = useState<FinancialReportBilan | null>(null);
  const [crData, setCrData] = useState<CompteDeResultat | null>(null);
  const [fiscalYear, setFiscalYear] = useState(now.getFullYear());
  const [fiscalMonth, setFiscalMonth] = useState(now.getMonth() + 1);
  const [fiscalData, setFiscalData] = useState<FiscalDeclaration | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [variation, setVariation] = useState<FinancialVariationExplanation | null>(null);
  const [variationLoading, setVariationLoading] = useState(false);

  useEffect(() => {
    api.getBilan().then(setBilanData);
    api.getCompteResultat().then(setCrData);
  }, []);

  const handleExplainVariation = () => {
    setVariationLoading(true);
    api.aiExplainVariation()
      .then(setVariation)
      .finally(() => setVariationLoading(false));
  };

  useEffect(() => {
    if (reportType === 'fiscal') {
      api.getFiscalDeclaration(fiscalYear, fiscalMonth).then(setFiscalData);
    }
  }, [reportType, fiscalYear, fiscalMonth]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  const handleDownload = async (fn: () => Promise<void>) => {
    setDownloadError(null);
    try {
      await fn();
    } catch (err) {
      setDownloadError(err instanceof ApiError ? err.message : 'Erreur lors du téléchargement du PDF');
    }
  };

  if (!bilanData || !crData) {
    return <div className="p-8 text-center text-slate-400">Chargement des états financiers depuis le Grand Livre...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#EDE9FE] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-extrabold uppercase tracking-wider text-[#1E1060]">États Financiers Annuels (Système Normal SYSCOHADA)</h2>
          <div className="text-xs text-slate-500 font-medium mt-1">Calculés en temps réel à partir des écritures validées du Grand Livre</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-[#EDE9FE] shadow-sm">
        <button
          onClick={() => setReportType('bilan')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            reportType === 'bilan' ? 'bg-[#6B4EFF] text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Bilan Synthétique (Actif / Passif)
        </button>

        <button
          onClick={() => setReportType('compte-resultat')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            reportType === 'compte-resultat' ? 'bg-[#6B4EFF] text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Compte de Résultat (SIG)
        </button>

        <button
          onClick={() => setReportType('fiscal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            reportType === 'fiscal' ? 'bg-[#6B4EFF] text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Déclaration Fiscale (TVA / AIR)
        </button>

        <div className="flex-1" />

        {reportType === 'bilan' && (
          <button
            onClick={() => handleDownload(() => api.downloadBilanPdf())}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger PDF</span>
          </button>
        )}
        {reportType === 'compte-resultat' && (
          <button
            onClick={() => handleDownload(() => api.downloadCompteResultatPdf())}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger PDF</span>
          </button>
        )}
        {reportType === 'fiscal' && (
          <button
            onClick={() => handleDownload(() => api.downloadFiscalDeclarationPdf(fiscalYear, fiscalMonth))}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger PDF</span>
          </button>
        )}
      </div>

      {downloadError && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg p-3">{downloadError}</div>}

      {reportType === 'bilan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 space-y-4 border border-[#EDE9FE] shadow-sm">
            <div className="flex justify-between items-center border-b border-[#EDE9FE] pb-3">
              <h3 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider">ACTIF</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-[#EDE9FE] pb-1">I. ACTIF IMMOBILISÉ</div>
              {bilanData.actif.immobilise.length === 0 && <div className="text-slate-500 italic">Aucun mouvement</div>}
              {bilanData.actif.immobilise.map((item) => (
                <div key={item.codeRef} className="flex justify-between items-center font-mono">
                  <span className="text-slate-300">{item.codeRef} - {item.label}</span>
                  <span className="font-bold text-white">{formatMoney(item.net)}</span>
                </div>
              ))}

              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-[#EDE9FE] pb-1 pt-2">II. ACTIF CIRCULANT</div>
              {bilanData.actif.circulant.length === 0 && <div className="text-slate-500 italic">Aucun mouvement</div>}
              {bilanData.actif.circulant.map((item) => (
                <div key={item.codeRef} className="flex justify-between items-center font-mono">
                  <span className="text-slate-300">{item.codeRef} - {item.label}</span>
                  <span className="font-bold text-white">{formatMoney(item.net)}</span>
                </div>
              ))}

              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-[#EDE9FE] pb-1 pt-2">III. TRÉSORERIE ACTIF</div>
              {bilanData.actif.tresorerie.length === 0 && <div className="text-slate-500 italic">Aucun mouvement</div>}
              {bilanData.actif.tresorerie.map((item) => (
                <div key={item.codeRef} className="flex justify-between items-center font-mono">
                  <span className="text-slate-300">{item.codeRef} - {item.label}</span>
                  <span className="font-bold text-emerald-400">{formatMoney(item.net)}</span>
                </div>
              ))}

              <div className="flex justify-between items-center border-t-2 border-slate-700 pt-3 text-sm font-extrabold font-mono text-white">
                <span>TOTAL GENERAL ACTIF:</span>
                <span className="text-emerald-400">{formatMoney(bilanData.actif.totalActif)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 space-y-4 border border-[#EDE9FE] shadow-sm">
            <div className="flex justify-between items-center border-b border-[#EDE9FE] pb-3">
              <h3 className="text-sm font-extrabold text-indigo-400 uppercase tracking-wider">PASSIF</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-[#EDE9FE] pb-1">I. CAPITAUX PROPRES & RESSOURCES</div>
              {bilanData.passif.capitauxPropres.map((item) => (
                <div key={item.codeRef} className="flex justify-between items-center font-mono">
                  <span className="text-slate-300">{item.codeRef} - {item.label}</span>
                  <span className="font-bold text-white">{formatMoney(item.net)}</span>
                </div>
              ))}

              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-[#EDE9FE] pb-1 pt-2">II. DETTES FINANCIÈRES</div>
              {bilanData.passif.dettesFinancieres.length === 0 && <div className="text-slate-500 italic">Aucune dette financière</div>}
              {bilanData.passif.dettesFinancieres.map((item) => (
                <div key={item.codeRef} className="flex justify-between items-center font-mono">
                  <span className="text-slate-300">{item.codeRef} - {item.label}</span>
                  <span className="font-bold text-white">{formatMoney(item.net)}</span>
                </div>
              ))}

              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-[#EDE9FE] pb-1 pt-2">III. PASSIF CIRCULANT (Dettes Tiers)</div>
              {bilanData.passif.passifCirculant.length === 0 && <div className="text-slate-500 italic">Aucune dette d'exploitation</div>}
              {bilanData.passif.passifCirculant.map((item) => (
                <div key={item.codeRef} className="flex justify-between items-center font-mono">
                  <span className="text-slate-300">{item.codeRef} - {item.label}</span>
                  <span className="font-bold text-rose-300">{formatMoney(item.net)}</span>
                </div>
              ))}

              <div className="flex justify-between items-center border-t-2 border-slate-700 pt-3 text-sm font-extrabold font-mono text-white">
                <span>TOTAL GENERAL PASSIF:</span>
                <span className="text-indigo-400">{formatMoney(bilanData.passif.totalPassif)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'compte-resultat' && (
        <div className="bg-white rounded-xl p-6 space-y-4 border border-[#EDE9FE] shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold text-[#1E1060] uppercase tracking-wider">Soldes Intermédiaires de Gestion (SIG) - Compte de Résultat</h3>
            <button
              onClick={handleExplainVariation}
              disabled={variationLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {variationLoading ? 'Analyse...' : `Expliquer vs ${now.getFullYear() - 1} (IA)`}
            </button>
          </div>

          {variation && (
            <div className="bg-indigo-950/40 border border-indigo-900 rounded-xl p-4 space-y-2 text-xs">
              {variation.analyseIA ? (
                <p className="text-indigo-200">{variation.analyseIA}</p>
              ) : (
                <p className="text-slate-400 italic">Analyse indisponible pour le moment.</p>
              )}
              <div className="grid grid-cols-2 gap-3 font-mono text-[11px] pt-2 border-t border-indigo-900">
                <div className="text-slate-300">
                  <div className="font-bold text-white mb-1">{variation.previousYear}</div>
                  <div>CA : {formatMoney(variation.previous.chiffreAffaires)}</div>
                  <div>Résultat net : {formatMoney(variation.previous.resultatNet)}</div>
                </div>
                <div className="text-slate-300">
                  <div className="font-bold text-white mb-1">{variation.currentYear}</div>
                  <div>CA : {formatMoney(variation.current.chiffreAffaires)}</div>
                  <div>Résultat net : {formatMoney(variation.current.resultatNet)}</div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 font-mono text-xs max-w-3xl">
            <div className="flex justify-between p-2.5 bg-slate-900 rounded border border-[#EDE9FE]">
              <span className="text-slate-300 font-bold">Chiffre d'Affaires (Ventes)</span>
              <span className="font-bold text-emerald-400">{formatMoney(crData.chiffreAffaires)}</span>
            </div>

            <div className="flex justify-between p-2.5 bg-slate-900/60 rounded">
              <span className="text-slate-400">- Achats de marchandises et matières</span>
              <span className="text-rose-400">-{formatMoney(crData.achatsMarchandises)}</span>
            </div>

            <div className="flex justify-between p-2.5 bg-emerald-950/60 rounded border border-emerald-800/60 font-bold">
              <span className="text-emerald-300">= MARGE BRUTE</span>
              <span className="text-emerald-300">{formatMoney(crData.margeBrute)}</span>
            </div>

            <div className="flex justify-between p-2.5 bg-slate-900/60 rounded">
              <span className="text-slate-400">- Consommations en provenance des tiers</span>
              <span className="text-rose-400">-{formatMoney(crData.consommationsIntermediaires)}</span>
            </div>

            <div className="flex justify-between p-2.5 bg-slate-900/60 rounded border border-[#EDE9FE] font-bold">
              <span className="text-slate-200">= VALEUR AJOUTÉE</span>
              <span className="text-slate-200">{formatMoney(crData.valeurAjoutee)}</span>
            </div>

            <div className="flex justify-between p-2.5 bg-slate-900/60 rounded">
              <span className="text-slate-400">- Charges de personnel</span>
              <span className="text-rose-400">-{formatMoney(crData.chargesPersonnel)}</span>
            </div>

            <div className="flex justify-between p-2.5 bg-indigo-950/60 rounded border border-indigo-800/60 font-bold text-sm">
              <span className="text-indigo-200">= EXCÉDENT BRUT D'EXPLOITATION (EBE)</span>
              <span className="text-indigo-200">{formatMoney(crData.ebe)}</span>
            </div>

            <div className="flex justify-between p-2.5 bg-slate-900/60 rounded">
              <span className="text-slate-400">- Dotations aux amortissements</span>
              <span className="text-rose-400">-{formatMoney(crData.dotationsAmortissements)}</span>
            </div>

            <div className="flex justify-between p-2.5 bg-slate-900/60 rounded border border-[#EDE9FE] font-bold">
              <span className="text-slate-200">= RÉSULTAT D'EXPLOITATION</span>
              <span className="text-slate-200">{formatMoney(crData.resultatExploitation)}</span>
            </div>

            <div className="flex justify-between p-2.5 bg-slate-900/60 rounded">
              <span className="text-slate-400">Résultat financier (produits - charges financières)</span>
              <span className={crData.resultatFinancier >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatMoney(crData.resultatFinancier)}</span>
            </div>

            <div className="flex justify-between p-2.5 bg-slate-900/60 rounded">
              <span className="text-slate-400">- Impôts sur les bénéfices</span>
              <span className="text-rose-400">-{formatMoney(crData.impotSurBenefices)}</span>
            </div>

            <div className="flex justify-between p-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg text-white font-extrabold text-base shadow-lg">
              <span>= RÉSULTAT NET DE L'EXERCICE</span>
              <span>{formatMoney(crData.resultatNet)}</span>
            </div>
          </div>
        </div>
      )}

      {reportType === 'fiscal' && (
        <div className="bg-white rounded-xl p-6 space-y-4 border border-[#EDE9FE] shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-sm font-bold text-[#1E1060] uppercase tracking-wider">Déclaration Fiscale Mensuelle Indicative</h3>
            <div className="flex items-center space-x-2">
              <select
                value={fiscalMonth}
                onChange={(e) => setFiscalMonth(Number(e.target.value))}
                className="glass-input rounded-lg px-3 py-1.5 text-xs"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long' })}
                  </option>
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
            </div>
          </div>

          {!fiscalData ? (
            <div className="text-slate-400 text-xs italic">Chargement...</div>
          ) : (
            <div className="space-y-4 max-w-2xl">
              <div>
                <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-[#EDE9FE] pb-1 mb-2">
                  TVA — {fiscalData.periodLabel}
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between"><span className="text-slate-400">TVA collectée (compte 443)</span><span className="text-white font-bold">{formatMoney(fiscalData.tvaCollectee)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">TVA récupérable (compte 445)</span><span className="text-white font-bold">{formatMoney(fiscalData.tvaRecuperable)}</span></div>
                  <div className={`flex justify-between p-2.5 rounded border font-bold ${fiscalData.tvaAPayer >= 0 ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'}`}>
                    <span>{fiscalData.tvaAPayer >= 0 ? 'TVA à reverser' : 'Crédit de TVA à reporter'}</span>
                    <span>{formatMoney(Math.abs(fiscalData.tvaAPayer))}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-[#EDE9FE] pb-1 mb-2">
                  AIR (Retenue à la Source)
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between"><span className="text-slate-400">Retenues subies sur ventes (à valoir sur l'IS)</span><span className="text-white font-bold">{formatMoney(fiscalData.airSurVentes)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Retenues opérées sur achats</span><span className="text-white font-bold">{formatMoney(fiscalData.airSurAchats)}</span></div>
                  <div className="flex justify-between p-2.5 rounded border bg-indigo-950/60 border-indigo-800 text-indigo-300 font-bold">
                    <span>AIR à reverser au Trésor</span>
                    <span>{formatMoney(fiscalData.airTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 italic">
                Déclaration indicative générée à partir du Grand Livre et des factures validées — à vérifier avant transmission à l'administration fiscale.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
