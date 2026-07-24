import React, { useState } from 'react';
import { BarChart3, Download, Printer, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { FinancialReportBilan, CompteDeResultat } from '@financepro/shared';

export const ReportsModule: React.FC = () => {
  const [reportType, setReportType] = useState<'bilan' | 'compte-resultat' | 'tft'>('bilan');

  const bilanData: FinancialReportBilan = {
    actif: {
      immobilise: [
        { codeRef: 'AD', label: 'Immobilisations Incorporelles (Logiciels, Brevets)', gross: 5000000, depreciation: 1000000, net: 4000000, netPrevious: 3500000 },
        { codeRef: 'AF', label: 'Immobilisations Corporelles (Bâtiments, Matériels)', gross: 40000000, depreciation: 9000000, net: 31000000, netPrevious: 28000000 }
      ],
      circulant: [
        { codeRef: 'BH', label: 'Stocks de marchandises (Compte 311)', gross: 14500000, depreciation: 0, net: 14500000, netPrevious: 12000000 },
        { codeRef: 'BI', label: 'Clients et comptes rattachés (Compte 411)', gross: 26100000, depreciation: 0, net: 26100000, netPrevious: 21500000 }
      ],
      tresorerie: [
        { codeRef: 'BQ', label: 'Banques, Chèques et Caisses (Comptes 521, 541)', gross: 75900000, depreciation: 0, net: 75900000, netPrevious: 60000000 }
      ],
      totalActif: 151500000
    },
    passif: {
      capitauxPropres: [
        { codeRef: 'CA', label: 'Capital Social (Compte 101)', gross: 50000000, depreciation: 0, net: 50000000, netPrevious: 50000000 },
        { codeRef: 'CB', label: 'Réserves et Report à nouveau (Compte 111, 121)', gross: 35000000, depreciation: 0, net: 35000000, netPrevious: 20000000 },
        { codeRef: 'CJ', label: 'Résultat net de l\'exercice (Bénéfice)', gross: 30950000, depreciation: 0, net: 30950000, netPrevious: 15000000 }
      ],
      dettesFinancieres: [
        { codeRef: 'DA', label: 'Emprunts et dettes financières (Compte 162)', gross: 25000000, depreciation: 0, net: 25000000, netPrevious: 30000000 }
      ],
      passifCirculant: [
        { codeRef: 'DH', label: 'Fournisseurs et dettes d\'exploitation (Compte 401)', gross: 10550000, depreciation: 0, net: 10550000, netPrevious: 9800000 }
      ],
      tresoreriePassif: [],
      totalPassif: 151500000
    }
  };

  const crData: CompteDeResultat = {
    chiffreAffaires: 148500000,
    achatsMarchandises: 54000000,
    margeBrute: 94500000,
    consommationsIntermediaires: 22000000,
    valeurAjoutee: 72500000,
    chargesPersonnel: 28000000,
    ebe: 44500000,
    dotationsAmortissements: 5000000,
    resultatExploitation: 39500000,
    chargesFinancieres: 3200000,
    produitsFinanciers: 800000,
    resultatFinancier: -2400000,
    resultatHAO: 0,
    impotSurBenefices: 6150000,
    resultatNet: 30950000
  };

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-card rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">États Financiers Annuels (Système Normal SYSCOHADA)</h2>
          <div className="text-xs text-slate-400 mt-1">Conformes aux modèles officiels de la Liasse Fiscale de la zone OHADA</div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => alert('Export PDF officiel généré avec succès !')}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer / PDF</span>
          </button>

          <button
            onClick={() => alert('Export Excel / Liasse Fiscale généré avec succès !')}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
          >
            <Download className="w-4 h-4" />
            <span>Exporter Liasse Excel</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setReportType('bilan')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            reportType === 'bilan' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          BILAN SYSCOHADA (Actif / Passif)
        </button>
        <button
          onClick={() => setReportType('compte-resultat')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            reportType === 'compte-resultat' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          COMPTE DE RÉSULTAT (SIG)
        </button>
      </div>

      {/* REPORT 1: BILAN */}
      {reportType === 'bilan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ACTIF */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider">ACTIF</h3>
              <span className="text-xs font-mono font-bold text-white">Exercice 2026</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1">I. ACTIF IMMOBILISÉ</div>
              {bilanData.actif.immobilise.map(item => (
                <div key={item.codeRef} className="flex justify-between items-center font-mono">
                  <span className="text-slate-300">{item.codeRef} - {item.label}</span>
                  <span className="font-bold text-white">{formatMoney(item.net)}</span>
                </div>
              ))}

              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1 pt-2">II. ACTIF CIRCULANT</div>
              {bilanData.actif.circulant.map(item => (
                <div key={item.codeRef} className="flex justify-between items-center font-mono">
                  <span className="text-slate-300">{item.codeRef} - {item.label}</span>
                  <span className="font-bold text-white">{formatMoney(item.net)}</span>
                </div>
              ))}

              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1 pt-2">III. TRÉSORERIE ACTIF</div>
              {bilanData.actif.tresorerie.map(item => (
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

          {/* PASSIF */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-indigo-400 uppercase tracking-wider">PASSIF</h3>
              <span className="text-xs font-mono font-bold text-white">Exercice 2026</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1">I. CAPITAUX PROPRES & RESSOURCES</div>
              {bilanData.passif.capitauxPropres.map(item => (
                <div key={item.codeRef} className="flex justify-between items-center font-mono">
                  <span className="text-slate-300">{item.codeRef} - {item.label}</span>
                  <span className="font-bold text-white">{formatMoney(item.net)}</span>
                </div>
              ))}

              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1 pt-2">II. DETTES FINANCIÈRES</div>
              {bilanData.passif.dettesFinancieres.map(item => (
                <div key={item.codeRef} className="flex justify-between items-center font-mono">
                  <span className="text-slate-300">{item.codeRef} - {item.label}</span>
                  <span className="font-bold text-white">{formatMoney(item.net)}</span>
                </div>
              ))}

              <div className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1 pt-2">III. PASSIF CIRCULANT (Dettes Tiers)</div>
              {bilanData.passif.passifCirculant.map(item => (
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

      {/* REPORT 2: COMPTE DE RÉSULTAT */}
      {reportType === 'compte-resultat' && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Soldes Intermédiaires de Gestion (SIG) - Compte de Résultat</h3>

          <div className="space-y-3 font-mono text-xs max-w-3xl">
            <div className="flex justify-between p-2.5 bg-slate-900 rounded border border-slate-800">
              <span className="text-slate-300 font-bold">Chiffre d'Affaires (Ventes + Prestations)</span>
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
              <span className="text-slate-400">- Charges de personnel (Salaires & Cotisations CNSS)</span>
              <span className="text-rose-400">-{formatMoney(crData.chargesPersonnel)}</span>
            </div>

            <div className="flex justify-between p-2.5 bg-indigo-950/60 rounded border border-indigo-800/60 font-bold text-sm">
              <span className="text-indigo-200">= EXCÉDENT BRUT D'EXPLOITATION (EBE)</span>
              <span className="text-indigo-200">{formatMoney(crData.ebe)}</span>
            </div>

            <div className="flex justify-between p-2.5 bg-slate-900/60 rounded">
              <span className="text-slate-400">- Impôts sur les bénéfices</span>
              <span className="text-rose-400">-{formatMoney(crData.impotSurBenefices)}</span>
            </div>

            <div className="flex justify-between p-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg text-white font-extrabold text-base shadow-lg">
              <span>= RÉSULTAT NET DE L'EXERCICE (BÉNÉFICE)</span>
              <span>{formatMoney(crData.resultatNet)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
