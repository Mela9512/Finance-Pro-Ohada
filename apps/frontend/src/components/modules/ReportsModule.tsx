import React, { useEffect, useState } from 'react';
import { FinancialReportBilan, CompteDeResultat } from '@financepro/shared';
import { api } from '../../services/api';

export const ReportsModule: React.FC = () => {
  const [reportType, setReportType] = useState<'bilan' | 'compte-resultat'>('bilan');
  const [bilanData, setBilanData] = useState<FinancialReportBilan | null>(null);
  const [crData, setCrData] = useState<CompteDeResultat | null>(null);

  useEffect(() => {
    api.getBilan().then(setBilanData);
    api.getCompteResultat().then(setCrData);
  }, []);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  if (!bilanData || !crData) {
    return <div className="p-8 text-center text-slate-400">Chargement des états financiers depuis le Grand Livre...</div>;
  }

  return (
    <div className="space-y-6 bg-[#f4f7fc] min-h-screen p-4 sm:p-6 text-slate-900 rounded-2xl">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">États Financiers Annuels (Système Normal SYSCOHADA)</h2>
          <div className="text-xs text-slate-500 font-medium mt-1">Calculés en temps réel à partir des écritures validées du Grand Livre</div>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setReportType('bilan')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            reportType === 'bilan' ? 'bg-[#0f2d5e] text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Bilan Synthétique (Actif / Passif)
        </button>

        <button
          onClick={() => setReportType('compte-resultat')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            reportType === 'compte-resultat' ? 'bg-[#0f2d5e] text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Compte de Résultat (SIG)
        </button>
      </div>

      {reportType === 'bilan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider">ACTIF</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1">I. ACTIF IMMOBILISÉ</div>
              {bilanData.actif.immobilise.length === 0 && <div className="text-slate-500 italic">Aucun mouvement</div>}
              {bilanData.actif.immobilise.map((item) => (
                <div key={item.codeRef} className="flex justify-between items-center font-mono">
                  <span className="text-slate-300">{item.codeRef} - {item.label}</span>
                  <span className="font-bold text-white">{formatMoney(item.net)}</span>
                </div>
              ))}

              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1 pt-2">II. ACTIF CIRCULANT</div>
              {bilanData.actif.circulant.length === 0 && <div className="text-slate-500 italic">Aucun mouvement</div>}
              {bilanData.actif.circulant.map((item) => (
                <div key={item.codeRef} className="flex justify-between items-center font-mono">
                  <span className="text-slate-300">{item.codeRef} - {item.label}</span>
                  <span className="font-bold text-white">{formatMoney(item.net)}</span>
                </div>
              ))}

              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1 pt-2">III. TRÉSORERIE ACTIF</div>
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

          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-indigo-400 uppercase tracking-wider">PASSIF</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1">I. CAPITAUX PROPRES & RESSOURCES</div>
              {bilanData.passif.capitauxPropres.map((item) => (
                <div key={item.codeRef} className="flex justify-between items-center font-mono">
                  <span className="text-slate-300">{item.codeRef} - {item.label}</span>
                  <span className="font-bold text-white">{formatMoney(item.net)}</span>
                </div>
              ))}

              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1 pt-2">II. DETTES FINANCIÈRES</div>
              {bilanData.passif.dettesFinancieres.length === 0 && <div className="text-slate-500 italic">Aucune dette financière</div>}
              {bilanData.passif.dettesFinancieres.map((item) => (
                <div key={item.codeRef} className="flex justify-between items-center font-mono">
                  <span className="text-slate-300">{item.codeRef} - {item.label}</span>
                  <span className="font-bold text-white">{formatMoney(item.net)}</span>
                </div>
              ))}

              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1 pt-2">III. PASSIF CIRCULANT (Dettes Tiers)</div>
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
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Soldes Intermédiaires de Gestion (SIG) - Compte de Résultat</h3>

          <div className="space-y-3 font-mono text-xs max-w-3xl">
            <div className="flex justify-between p-2.5 bg-slate-900 rounded border border-slate-800">
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

            <div className="flex justify-between p-2.5 bg-slate-900/60 rounded border border-slate-800 font-bold">
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

            <div className="flex justify-between p-2.5 bg-slate-900/60 rounded border border-slate-800 font-bold">
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
    </div>
  );
};
