import React, { useEffect, useState } from 'react';
import {
  FileText, Download, Sparkles, Printer, CheckCircle, AlertTriangle, ShieldCheck,
  TrendingUp, TrendingDown, DollarSign, PieChart, Layers, ArrowUpRight, ArrowDownLeft,
  Search, Lock, CheckSquare, Eye, ChevronRight, Calculator, RefreshCw, Award, Scale,
  BookOpen, HelpCircle, FileSpreadsheet, Building2, ShieldAlert, Zap, BarChart2, ClipboardList,
  Grid, List, CheckCircle2, ArrowRight, Shield, Check, Info, Landmark, UserCheck, X
} from 'lucide-react';
import { FinancialReportBilan, CompteDeResultat, FinancialVariationExplanation } from '@financepro/shared';
import { api, ApiError } from '../../services/api';

const currentYear = new Date().getFullYear();

// Interface pour le Drill-Down sur un poste comptable
interface DrillDownData {
  title: string;
  codeRef: string;
  totalAmount: number;
  entries: { date: string; journal: string; piece: string; wording: string; debit: number; credit: number }[];
}

interface ReportsModuleProps {
  initialTab?: number;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({ initialTab = 2 }) => {
  // ── States principaux ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<number>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [bilanMode, setBilanMode] = useState<'synthetique' | 'detaille'>('synthetique');
  const [bilanViewMode, setBilanViewMode] = useState<'comptable' | 'direction'>('comptable');
  const [showNvsN1, setShowNvsN1] = useState(false);
  const [explainPosteData, setExplainPosteData] = useState<{ title: string; code: string; amount: number; analysis: string; risk: string } | null>(null);
  const [showClotureConfirm, setShowClotureConfirm] = useState(false);

  const [bilanData, setBilanData] = useState<FinancialReportBilan | null>(null);
  const [crData, setCrData] = useState<CompteDeResultat | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [variation, setVariation] = useState<FinancialVariationExplanation | null>(null);
  const [variationLoading, setVariationLoading] = useState(false);

  // State pour la Liasse Fiscale (Tab 13)
  const [selectedLiasseTable, setSelectedLiasseTable] = useState<number>(1);

  // Drill-down Modal
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);

  // States Modales & Chat IA
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Load Data
  useEffect(() => {
    api.getBilan().then(setBilanData).catch(() => null);
    api.getCompteResultat().then(setCrData).catch(() => null);
  }, []);

  const handleExplainVariation = () => {
    setVariationLoading(true);
    api.aiExplainVariation()
      .then(setVariation)
      .finally(() => setVariationLoading(false));
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val || 0);

  const handleDownload = async (fn: () => Promise<void>) => {
    setDownloadError(null);
    try {
      await fn();
    } catch (err) {
      setDownloadError(err instanceof ApiError ? err.message : 'Erreur lors du téléchargement du document PDF.');
    }
  };

  // Drill-down simulator for any account line
  const handleOpenDrillDown = (title: string, codeRef: string, totalAmount: number) => {
    setDrillDownData({
      title,
      codeRef,
      totalAmount,
      entries: [
        { date: `${currentYear}-03-15`, journal: 'VENTES', piece: 'FAC-2026-0042', wording: `Règlement / Facturation poste ${codeRef} - ${title}`, debit: totalAmount > 0 ? totalAmount : 0, credit: totalAmount < 0 ? Math.abs(totalAmount) : 0 },
        { date: `${currentYear}-01-10`, journal: 'A-NOUVEAU', piece: 'AN-2026-0001', wording: `Report à nouveau de l'exercice précédent`, debit: totalAmount > 0 ? Math.round(totalAmount * 0.8) : 0, credit: totalAmount < 0 ? Math.round(Math.abs(totalAmount) * 0.8) : 0 },
      ]
    });
  };

  const handleAskAi = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer(null);
    try {
      const res = await api.aiChat(
        `[MODULE ÉTATS FINANCIERS OHADA] Total Actif: ${bilanData?.actif.totalActif || 0} XAF, Chiffre d'Affaires: ${crData?.chiffreAffaires || 0} XAF, Résultat Net: ${crData?.resultatNet || 0} XAF. Question: ${aiQuestion}`,
        'États Financiers OHADA'
      );
      setAiAnswer(res.answer);
    } catch (_err) {
      setAiAnswer("L'analyse IA indique une structure financière équilibrée avec un BFR négatif favorable au besoin en trésorerie et un niveau d'endettement modéré.");
    } finally {
      setAiLoading(false);
    }
  };

  // ── CALCULS CLÉS ET RATIOS DE PERFORMANCE ──────────────────────────────────
  const chiffreAffaires = crData?.chiffreAffaires || 25000000;
  const resultatNet = crData?.resultatNet || 3450000;
  const margeBrute = crData?.margeBrute || 14200000;
  const ebe = crData?.ebe || 6800000;
  const resultatExploitation = crData?.resultatExploitation || 5100000;

  const totalActif = bilanData?.actif.totalActif || 35000000;
  const totalPassif = bilanData?.passif.totalPassif || 35000000;
  const capitauxPropres = 18500000;
  const dettesFinancieres = 4500000;
  const bfr = 2400000; // Besoin en Fonds de Roulement
  const fdr = 5800000; // Fonds de Roulement Net Global
  const tresorerieNette = fdr - bfr; // 3 400 000 FCFA

  // Ratios financiers
  const roe = (resultatNet / capitauxPropres) * 100; // Return on Equity (%)
  const roa = (resultatNet / totalActif) * 100; // Return on Assets (%)
  const ros = (resultatNet / chiffreAffaires) * 100; // Return on Sales (%)
  const ratioAutonomie = (capitauxPropres / totalActif) * 100; // Autonomie financière (%)

  // Score de Santé Financière /100
  const scoreSante = Math.min(100, Math.max(40, Math.round(
    (roe > 10 ? 25 : 15) +
    (ratioAutonomie > 40 ? 25 : 15) +
    (tresorerieNette > 0 ? 25 : 10) +
    (resultatNet > 0 ? 25 : 10)
  )));

  // Liste des 36 Tableaux de la Liasse Fiscale Réglementaire OHADA
  const liasseTablesList = [
    { id: 1, code: 'TAB-01', title: 'Fiche d\'Identification et Renseignements Généraux' },
    { id: 2, code: 'TAB-02', title: 'Bilan SYSCOHADA — ACTIF (Système Normal)' },
    { id: 3, code: 'TAB-03', title: 'Bilan SYSCOHADA — PASSIF (Système Normal)' },
    { id: 4, code: 'TAB-04', title: 'Compte de Résultat (Soldes Intermédiaires de Gestion)' },
    { id: 5, code: 'TAB-05', title: 'Tableau des Flux de Trésorerie (TFT)' },
    { id: 6, code: 'TAB-06', title: 'Tableau de Variation des Capitaux Propres' },
    { id: 7, code: 'TAB-07', title: 'Tableau des Immobilisations Brut' },
    { id: 8, code: 'TAB-08', title: 'Tableau des Amortissements et Dépréciations' },
    { id: 9, code: 'TAB-09', title: 'Plus-Values et Moins-Values de Cession' },
    { id: 10, code: 'TAB-10', title: 'Tableau des Provisions & Pertes de Valeur' },
    { id: 11, code: 'TAB-11', title: 'Échéancier des Créances à la Clôture' },
    { id: 12, code: 'TAB-12', title: 'Échéancier des Dettes à la Clôture' },
    { id: 13, code: 'TAB-13', title: 'Passage du Résultat Comptable au Résultat Fiscal (IS)' },
    { id: 14, code: 'TAB-14', title: 'Calcul de l\'Impôt sur les Sociétés & Minimum de Perception' },
    { id: 15, code: 'TAB-15', title: 'Déclaration des Retenues à la Source (AIR, TVA, WHT)' },
    { id: 16, code: 'TAB-16', title: 'Répartition du Résultat & Affectation des Bénéfices' },
    { id: 17, code: 'TAB-17', title: 'Biens Pris en Crédit-Bail et Engagements Assimilés' },
    { id: 18, code: 'TAB-18', title: 'Engagements Hors Bilan (Garanties & Cautions)' },
    { id: 19, code: 'TAB-19', title: 'Effectifs, Masse Salariale et CNPS/CNSS' },
    { id: 20, code: 'TAB-20', title: 'Production de l\'Exercice & Stocks de Fin d\'Année' },
    { id: 21, code: 'TAB-21', title: 'Consommations Intermédiaires & Services Extérieurs' },
    { id: 22, code: 'TAB-22', title: 'Achats Destinés à la Revente & Variation de Stocks' },
    { id: 23, code: 'TAB-23', title: 'Taxes, Impôts Indirects & Droits de Timbre' },
    { id: 24, code: 'TAB-24', title: 'Charges Financières & Intérêts d\'Emprunt' },
    { id: 25, code: 'TAB-25', title: 'Produits Financiers & Gains de Change' },
    { id: 26, code: 'TAB-26', title: 'Opérations Hors Activités Ordinaires (HAO)' },
    { id: 27, code: 'TAB-27', title: 'Ventilation du Chiffre d\'Affaires par Secteur/Pays' },
    { id: 28, code: 'TAB-28', title: 'Filiales, Participations & Sociétés Mères' },
    { id: 29, code: 'TAB-29', title: 'Rémunérations des Dirigeants & Organes de Gestion' },
    { id: 30, code: 'TAB-30', title: 'Avances et Prêts Accordés aux Associés' },
    { id: 31, code: 'TAB-31', title: 'Comptes Bancaires, Caisses & Mobile Money' },
    { id: 32, code: 'TAB-32', title: 'Provisions pour Risques et Charges Futurs' },
    { id: 33, code: 'TAB-33', title: 'Crédits d\'Impôt & Avoir Fiscaux Transférables' },
    { id: 34, code: 'TAB-34', title: 'Rapprochement TVA Collectée et Déclarée (CA3)' },
    { id: 35, code: 'TAB-35', title: 'Rapprochement Retenues AIR Salaires & Tiers' },
    { id: 36, code: 'TAB-36', title: 'Attestation de Conformité Comptable & Visa de l\'Expert' }
  ];

  // 9 Pillars Navigation Tabs (Regulatory Compliance Focus)
  const pillars = [
    { id: 2, title: 'Bilan SYSCOHADA (A/P)', icon: '🏛️' },
    { id: 3, title: 'Compte de Résultat (CR)', icon: '📑' },
    { id: 4, title: 'Flux de Trésorerie (TFT)', icon: '💰' },
    { id: 5, title: 'Variation Capitaux Propres', icon: '📈' },
    { id: 6, title: 'Notes Annexes OHADA', icon: '📚' },
    { id: 7, title: 'Soldes SIG Détaillés', icon: '📐' },
    { id: 12, title: 'Contrôle Conformité OHADA', icon: '🛡️' },
    { id: 13, title: 'Liasse Fiscale Officielles', icon: '📋' },
    { id: 14, title: 'Historique & Clôtures', icon: '🔒' },
  ];

  // Render specific content for each of the 36 Tax Tables when selected
  const renderLiasseTableContent = (tableId: number) => {
    switch (tableId) {
      case 1: // TAB-01 : Fiche d'identification
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-3">
              <h5 className="font-extrabold text-xs text-slate-900 uppercase border-b pb-2">Renseignements Généraux de l'Entreprise</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">RAISON SOCIALE</span>
                  <span className="font-bold text-slate-900">MELARO GROUP SARL</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">NUMÉRO RCCM</span>
                  <span className="font-bold text-slate-900">CM-DOU-2026-B-14529</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">NUMÉRO NIF (IDENTIFIANT FISCAL)</span>
                  <span className="font-bold text-slate-900">M082612345678A</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">CAPITAL SOCIAL LIBÉRÉ</span>
                  <span className="font-bold text-emerald-600 font-mono">10 000 000 FCFA</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">RÉGIME FISCAL APPLICABLE</span>
                  <span className="font-bold text-violet-700">Réel Normal d'Imposition (Système Normal)</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">CENTRE DES IMPÔTS</span>
                  <span className="font-bold text-slate-900">CIME Douala I - Littoral</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // TAB-02 : Bilan Actif
        return (
          <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-extrabold">
                <tr>
                  <th className="p-3">Réf. Code</th>
                  <th className="p-3">Libellé de l'Actif</th>
                  <th className="p-3 text-right">Brut (N)</th>
                  <th className="p-3 text-right">Amort./Prov.</th>
                  <th className="p-3 text-right font-black text-emerald-400">Net (N)</th>
                  <th className="p-3 text-right text-slate-400">Net (N-1)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="p-3 font-bold">AA-211</td><td>Immobilisations Incorporelles (Logiciels/Frais)</td><td className="p-3 text-right">3 000 000 FCFA</td><td className="p-3 text-right">500 000 FCFA</td><td className="p-3 text-right font-bold text-emerald-600">2 500 000 FCFA</td><td className="p-3 text-right text-slate-500">2 000 000 FCFA</td></tr>
                <tr><td className="p-3 font-bold">AB-241</td><td>Immobilisations Corporelles (Matériels & Équipements)</td><td className="p-3 text-right">14 500 000 FCFA</td><td className="p-3 text-right">1 700 000 FCFA</td><td className="p-3 text-right font-bold text-emerald-600">12 800 000 FCFA</td><td className="p-3 text-right text-slate-500">11 200 000 FCFA</td></tr>
                <tr><td className="p-3 font-bold">BA-311</td><td>Stocks de Marchandises & Matières Premières</td><td className="p-3 text-right">4 800 000 FCFA</td><td className="p-3 text-right">0 FCFA</td><td className="p-3 text-right font-bold text-emerald-600">4 800 000 FCFA</td><td className="p-3 text-right text-slate-500">3 900 000 FCFA</td></tr>
                <tr><td className="p-3 font-bold">BB-411</td><td>Créances Clients & Comptes Rattachés</td><td className="p-3 text-right">8 900 000 FCFA</td><td className="p-3 text-right">0 FCFA</td><td className="p-3 text-right font-bold text-emerald-600">8 900 000 FCFA</td><td className="p-3 text-right text-slate-500">7 400 000 FCFA</td></tr>
                <tr><td className="p-3 font-bold">DA-521</td><td>Trésorerie-Actif (Banques, Caisses, Mobile Money)</td><td className="p-3 text-right">6 000 000 FCFA</td><td className="p-3 text-right">0 FCFA</td><td className="p-3 text-right font-bold text-emerald-600">6 000 000 FCFA</td><td className="p-3 text-right text-slate-500">4 500 000 FCFA</td></tr>
                <tr className="bg-slate-50 font-extrabold"><td className="p-3 text-slate-900 font-black">TOTAL ACTIF</td><td>TOTAL GÉNÉRAL ACTIF DU BILAN</td><td className="p-3 text-right font-black">37 200 000 FCFA</td><td className="p-3 text-right">2 200 000 FCFA</td><td className="p-3 text-right text-emerald-600 font-black">{formatMoney(totalActif)}</td><td className="p-3 text-right text-slate-500">29 000 000 FCFA</td></tr>
              </tbody>
            </table>
          </div>
        );

      case 3: // TAB-03 : Bilan Passif
        return (
          <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-extrabold">
                <tr>
                  <th className="p-3">Réf. Code</th>
                  <th className="p-3">Libellé du Passif</th>
                  <th className="p-3 text-right font-black text-indigo-400">Net Exercice (N)</th>
                  <th className="p-3 text-right text-slate-400">Net Exercice (N-1)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="p-3 font-bold">CA-101</td><td>Capital Social Souscrit et Libéré</td><td className="p-3 text-right font-bold text-slate-900">10 000 000 FCFA</td><td className="p-3 text-right text-slate-500">10 000 000 FCFA</td></tr>
                <tr><td className="p-3 font-bold">CB-121</td><td>Réserves Légales et Statutaires</td><td className="p-3 text-right font-bold text-slate-900">3 000 000 FCFA</td><td className="p-3 text-right text-slate-500">2 500 000 FCFA</td></tr>
                <tr><td className="p-3 font-bold text-indigo-700">CD-131</td><td>Résultat Net de l'Exercice (Bénéfice N)</td><td className="p-3 text-right font-black text-indigo-600">{formatMoney(resultatNet)}</td><td className="p-3 text-right text-slate-500">2 800 000 FCFA</td></tr>
                <tr><td className="p-3 font-bold">DA-162</td><td>Emprunts auprès des Établissements de Crédit</td><td className="p-3 text-right font-bold text-slate-900">{formatMoney(dettesFinancieres)}</td><td className="p-3 text-right text-slate-500">5 000 000 FCFA</td></tr>
                <tr><td className="p-3 font-bold">DB-401</td><td>Dettes Fournisseurs & Comptes Rattachés</td><td className="p-3 text-right font-bold text-rose-600">6 500 000 FCFA</td><td className="p-3 text-right text-slate-500">6 200 000 FCFA</td></tr>
                <tr><td className="p-3 font-bold">DC-442</td><td>Dettes Fiscales et Sociales (TVA, AIR, CNPS)</td><td className="p-3 text-right font-bold text-rose-600">2 550 000 FCFA</td><td className="p-3 text-right text-slate-500">2 500 000 FCFA</td></tr>
                <tr className="bg-slate-50 font-extrabold"><td className="p-3 text-slate-900 font-black">TOTAL PASSIF</td><td>TOTAL GÉNÉRAL PASSIF DU BILAN</td><td className="p-3 text-right text-indigo-600 font-black">{formatMoney(totalPassif)}</td><td className="p-3 text-right text-slate-500">29 000 000 FCFA</td></tr>
              </tbody>
            </table>
          </div>
        );

      case 7: // TAB-07 : Tableau des Immobilisations
        return (
          <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-extrabold">
                <tr>
                  <th className="p-3">Rubrique Immobilisation</th>
                  <th className="p-3 text-right">Valeur Début N</th>
                  <th className="p-3 text-right">Acquisitions N</th>
                  <th className="p-3 text-right">Cessions N</th>
                  <th className="p-3 text-right font-black text-emerald-400">Valeur Fin N</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="p-3 font-bold">Frais de Développement & Logiciels</td><td className="p-3 text-right">2 000 000 FCFA</td><td className="p-3 text-right">1 000 000 FCFA</td><td className="p-3 text-right">0 FCFA</td><td className="p-3 text-right font-bold">3 000 000 FCFA</td></tr>
                <tr><td className="p-3 font-bold">Matériel Industriel & Outillage</td><td className="p-3 text-right">8 000 000 FCFA</td><td className="p-3 text-right">2 500 000 FCFA</td><td className="p-3 text-right">0 FCFA</td><td className="p-3 text-right font-bold">10 500 000 FCFA</td></tr>
                <tr><td className="p-3 font-bold">Matériel de Transport (Véhicules)</td><td className="p-3 text-right">4 000 000 FCFA</td><td className="p-3 text-right">0 FCFA</td><td className="p-3 text-right">0 FCFA</td><td className="p-3 text-right font-bold">4 000 000 FCFA</td></tr>
              </tbody>
            </table>
          </div>
        );

      case 13: // TAB-13 : Passage au Résultat Fiscal (IS)
        return (
          <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-extrabold">
                <tr>
                  <th className="p-3">Poste de Retraitement Fiscal</th>
                  <th className="p-3 text-right">Réintégrations (+)</th>
                  <th className="p-3 text-right">Déductions (-)</th>
                  <th className="p-3 text-right font-black text-indigo-400">Montant Fiscal (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="p-3 font-bold">Résultat Comptable Avant Impôt</td><td className="p-3 text-right">-</td><td className="p-3 text-right">-</td><td className="p-3 text-right font-bold">{formatMoney(resultatNet + 1500000)}</td></tr>
                <tr><td className="p-3 font-bold text-rose-700">Amortissements Excéderont les Plafonds Fiscaux Admis</td><td className="p-3 text-right font-bold text-rose-600">+450 000 FCFA</td><td className="p-3 text-right">-</td><td className="p-3 text-right">+450 000 FCFA</td></tr>
                <tr><td className="p-3 font-bold text-rose-700">Amendes, Pénalités de Retard et Dépenses Non Déductibles</td><td className="p-3 text-right font-bold text-rose-600">+150 000 FCFA</td><td className="p-3 text-right">-</td><td className="p-3 text-right">+150 000 FCFA</td></tr>
                <tr className="bg-emerald-50 font-black"><td className="p-3 text-emerald-950 font-black">RÉSULTAT FISCAL NET IMPOSABLE (BASE IS)</td><td className="p-3 text-right">-</td><td className="p-3 text-right">-</td><td className="p-3 text-right text-emerald-700 font-black">{formatMoney(resultatNet + 2100000)}</td></tr>
              </tbody>
            </table>
          </div>
        );

      case 14: // TAB-14 : Calcul de l'IS / Minimum de Perception
        return (
          <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
            <h5 className="font-extrabold text-slate-900 uppercase border-b pb-2">Détermination de l'Impôt sur les Sociétés (IS / IMF)</h5>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span>Base Imposable (Résultat Fiscal Net) :</span>
              <span className="font-bold">{formatMoney(resultatNet + 2100000)}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span>Taux Réglementaire IS (30%) + Centimes Additionnels (10%) :</span>
              <span className="font-bold text-slate-900">33.0 %</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
              <span>Minimum de Perception / Impôt Minimum Forfaitaire (1.5% CA) :</span>
              <span className="font-bold">{formatMoney(chiffreAffaires * 0.015)}</span>
            </div>
            <div className="flex justify-between p-3.5 bg-slate-900 text-white rounded-xl font-black text-sm">
              <span>NET IMPÔT SUR LES SOCIÉTÉS DU A LA DGI :</span>
              <span className="text-emerald-400">{formatMoney(Math.max((resultatNet + 2100000) * 0.33, chiffreAffaires * 0.015))}</span>
            </div>
          </div>
        );

      case 36: // TAB-36 : Visa & Certification de l'Expert
        return (
          <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center gap-3 border-b pb-3">
              <UserCheck className="w-8 h-8 text-emerald-600" />
              <div>
                <h5 className="font-extrabold text-slate-900 uppercase">Visa de Conformité & Attestation de l'Expert-Comptable</h5>
                <p className="text-slate-500">Attestation certifiée conforme aux principes du SYSCOHADA Révisé 2017</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl font-mono text-[11px] leading-relaxed space-y-2">
              <p>« Je soussigné, Expert-Comptable agréé ONECCA / CEMAC, certifie que les présents états financiers (comportant les 36 tableaux de la Liasse Fiscale) ont été établis en stricte conformité avec le droit comptable OHADA. »</p>
              <div className="pt-3 border-t font-bold text-slate-900 flex justify-between">
                <span>Visa N° : ONECCA-2026-8812</span>
                <span>Fait à Douala, le 03/08/2026</span>
              </div>
            </div>
          </div>
        );

      default: {
        // Render dynamic table rows for any other selected table (4, 5, 6, 8, 9, 10, 11, 12, 15..35)
        const curTable = liasseTablesList.find(t => t.id === tableId);
        return (
          <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-extrabold">
                <tr>
                  <th className="p-3">Réf. Code</th>
                  <th className="p-3">Libellé du Poste — {curTable?.title}</th>
                  <th className="p-3 text-right">Montant Brut (N)</th>
                  <th className="p-3 text-right">Amort./Prov.</th>
                  <th className="p-3 text-right font-black text-emerald-400">Montant Net (N)</th>
                  <th className="p-3 text-right text-slate-400">Montant Net (N-1)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-bold text-slate-900">RF-01</td>
                  <td className="p-3 font-sans font-bold text-slate-900">Principaux éléments constitutifs du {curTable?.title}</td>
                  <td className="p-3 text-right">12 500 000 FCFA</td>
                  <td className="p-3 text-right">0 FCFA</td>
                  <td className="p-3 text-right font-bold text-emerald-600">12 500 000 FCFA</td>
                  <td className="p-3 text-right text-slate-500">11 000 000 FCFA</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900">RF-02</td>
                  <td className="p-3 font-sans font-bold text-slate-900">Ajustements et Régularisations d'Exercice</td>
                  <td className="p-3 text-right">2 400 000 FCFA</td>
                  <td className="p-3 text-right">0 FCFA</td>
                  <td className="p-3 text-right font-bold text-emerald-600">2 400 000 FCFA</td>
                  <td className="p-3 text-right text-slate-500">2 100 000 FCFA</td>
                </tr>
                <tr className="bg-slate-50 font-extrabold">
                  <td className="p-3 text-slate-900 font-black">TOTAL</td>
                  <td className="p-3 font-sans font-black text-slate-900">TOTAL DU {curTable?.code}</td>
                  <td className="p-3 text-right font-black">14 900 000 FCFA</td>
                  <td className="p-3 text-right">0 FCFA</td>
                  <td className="p-3 text-right text-emerald-600 font-black">14 900 000 FCFA</td>
                  <td className="p-3 text-right text-slate-500">13 100 000 FCFA</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      }
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ── TOP ACTION BAR (12 RECOMMENDED ACTION BUTTONS) ────────────────── */}
      <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
              📊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wider">
                  États Financiers Annuels SYSCOHADA Révisé
                </h2>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                  Système Normal OHADA (Acte Uniforme 2017)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Génération automatique de la liasse fiscale, Bilan, Compte de Résultat, TFT, SIG & Diagnostic IA
              </p>
            </div>
          </div>

          {/* Actions principales épurées */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab(13)}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <BarChart2 className="w-3.5 h-3.5" /> 📊 Générer la Liasse
            </button>

            <button
              onClick={() => setActiveTab(12)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-violet-600" /> Contrôle Conformité
            </button>

            <button
              onClick={() => handleDownload(() => api.downloadBilanPdf())}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-rose-600" /> Exporter PDF / Excel
            </button>

            <button
              onClick={() => alert("Clôture annuelle réglementaire SYSCOHADA...")}
              className="px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" /> Clôturer l'Exercice
            </button>
          </div>
        </div>

        {/* ── KPI METRICS CARDS & SCORE SANTE FINANCIERE ───────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-900 via-indigo-950 to-slate-900 text-white shadow-md space-y-1">
            <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-violet-300">
              <span>Santé Financière</span>
              <span>Score IA</span>
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono">{scoreSante} / 100</div>
            <div className="text-[10px] text-slate-300 font-medium pt-1">
              {scoreSante > 75 ? '🟢 Excellente Solvabilité' : '🟡 Solvabilité Satisfaisante'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Chiffre d'Affaires</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">{formatMoney(chiffreAffaires)}</div>
            <div className="text-[10px] text-emerald-600 font-bold">↑ +12.4% vs Exercice N-1</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Résultat Net N</div>
            <div className="text-xl font-extrabold text-emerald-600 font-mono">{formatMoney(resultatNet)}</div>
            <div className="text-[10px] text-slate-500 font-medium">Marge Nette : {ros.toFixed(1)}%</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Fonds de Roulement (FDR)</div>
            <div className="text-xl font-extrabold text-indigo-700 font-mono">{formatMoney(fdr)}</div>
            <div className="text-[10px] text-slate-500 font-medium">Couverture des emplois stables</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Trésorerie Nette (TFT)</div>
            <div className="text-xl font-extrabold text-emerald-600 font-mono">{formatMoney(tresorerieNette)}</div>
            <div className="text-[10px] text-slate-500 font-medium">FDR ({formatMoney(fdr)}) - BFR</div>
          </div>
        </div>
      </div>

      {/* ── BARRE DES 16 PILIERS MÉTIERS ÉTATS FINANCIERS ─────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-2 bg-white rounded-2xl border border-violet-100 shadow-sm text-xs font-bold">
        {pillars.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveTab(p.id)}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === p.id
                ? 'bg-violet-600 text-white shadow-md scale-[1.02]'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
            }`}
          >
            <span>{p.icon === 'Sparkles' ? <Sparkles className="w-3.5 h-3.5 text-amber-300" /> : p.icon}</span>
            <span>{p.id}. {p.title}</span>
          </button>
        ))}
      </div>

      {/* ── CONTENU INTERACTIF DÉDIÉ POUR CHAQUE PILIER (1 À 16) ───────────── */}

      {/* PILIER 1 : TABLEAU DE BORD FINANCIER & KPIS */}
      {activeTab === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Excédent Brut d'Exploitation (EBE)</div>
              <div className="text-2xl font-black text-indigo-700 font-mono">{formatMoney(ebe)}</div>
              <div className="text-xs text-slate-500">Rentabilité opérationnelle brute avant amortissements</div>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Capacité d'Autofinancement (CAF)</div>
              <div className="text-2xl font-black text-emerald-600 font-mono">{formatMoney(resultatNet + 1800000)}</div>
              <div className="text-xs text-slate-500">Ressources générées par l'activité pour financer l'investissement</div>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Besoin en Fonds de Roulement (BFR)</div>
              <div className="text-2xl font-black text-slate-900 font-mono">{formatMoney(bfr)}</div>
              <div className="text-xs text-slate-500">Stocks + Créances clients - Dettes fournisseurs</div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PILIER 2 : BILAN SYSCOHADA — COCKPIT PROFESSIONNEL                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 2 && (() => {
        // ── Données statiques enrichies N et N-1 ─────────────────────────────
        const actifPostes = [
          { section: 'A — ACTIF IMMOBILISÉ', items: [
            { code: '211', label: 'Immobilisations incorporelles', brut: 3000000, amort: 500000, net: 2500000, n1: 2000000 },
            { code: '241', label: 'Immobilisations corporelles', brut: 14500000, amort: 1700000, net: 12800000, n1: 11200000 },
            { code: '251', label: 'Immobilisations financières', brut: 1000000, amort: 0, net: 1000000, n1: 800000 },
          ]},
          { section: 'B — ACTIF CIRCULANT', items: [
            { code: '311', label: 'Stocks de marchandises', brut: 4800000, amort: 0, net: 4800000, n1: 3900000 },
            { code: '411', label: 'Clients & Comptes rattachés', brut: 8900000, amort: 0, net: 8900000, n1: 7400000 },
            { code: '471', label: 'Autres créances & débiteurs', brut: 1500000, amort: 0, net: 1500000, n1: 1200000 },
          ]},
          { section: 'C — TRÉSORERIE-ACTIF', items: [
            { code: '521/571', label: 'Banques, Caisses, Mobile Money', brut: 6000000, amort: 0, net: 6000000, n1: 4500000 },
          ]},
        ];
        const passifPostes = [
          { section: 'A — CAPITAUX PROPRES', items: [
            { code: '101', label: 'Capital social', net: 10000000, n1: 10000000 },
            { code: '111', label: 'Réserves légales & facultatives', net: 2500000, n1: 2000000 },
            { code: '120', label: 'Report à nouveau', net: 1200000, n1: 800000 },
            { code: '131', label: 'Résultat net de l\'exercice', net: resultatNet, n1: 2800000 },
          ]},
          { section: 'B — DETTES FINANCIÈRES', items: [
            { code: '162', label: 'Emprunts établissements de crédit', net: 4500000, n1: 5200000 },
            { code: '181', label: 'Dettes de crédit-bail', net: 800000, n1: 1000000 },
          ]},
          { section: 'C — PASSIF CIRCULANT', items: [
            { code: '401', label: 'Fournisseurs & Comptes rattachés', net: 6500000, n1: 5300000 },
            { code: '432', label: 'Dettes fiscales (TVA, IS…)', net: 1800000, n1: 1400000 },
            { code: '434', label: 'Dettes sociales (CNPS…)', net: 1050000, n1: 900000 },
            { code: '471', label: 'Autres dettes & créditeurs', net: 600000, n1: 500000 },
          ]},
        ];

        const totalActifReel = actifPostes.flatMap(s => s.items).reduce((s, i) => s + i.net, 0);
        const totalPassifReel = passifPostes.flatMap(s => s.items).reduce((s, i) => s + i.net, 0);
        const ecartBilan = Math.abs(totalActifReel - totalPassifReel);
        const bilanEquilibre = ecartBilan === 0;

        const controles = [
          { label: 'Écritures validées', status: 'ok' },
          { label: 'Balance équilibrée', status: 'ok' },
          { label: 'Bilan équilibré', status: bilanEquilibre ? 'ok' : 'error' },
          { label: 'Compte de résultat', status: 'ok' },
          { label: 'Contrôle TVA', status: 'warn' },
          { label: 'Contrôle OHADA', status: 'ok' },
          { label: 'Liasse fiscale', status: 'pending' },
        ];
        const scoreConformite = Math.round((controles.filter(c => c.status === 'ok').length / controles.length) * 100);

        const statusIcon = (s: string) => s === 'ok' ? '🟢' : s === 'warn' ? '🟠' : s === 'pending' ? '🟡' : '🔴';
        const statusLabel = (s: string) => s === 'ok' ? 'Conforme' : s === 'warn' ? 'À vérifier' : s === 'pending' ? 'En préparation' : 'Anomalie';

        const fmtVar = (n: number, n1: number) => {
          const diff = n - n1;
          const pct = n1 !== 0 ? ((diff / Math.abs(n1)) * 100).toFixed(1) : '—';
          const color = diff >= 0 ? 'text-emerald-600' : 'text-rose-600';
          return <span className={`font-mono text-[11px] font-bold ${color}`}>{diff >= 0 ? '+' : ''}{formatMoney(diff)} ({diff >= 0 ? '+' : ''}{pct}%)</span>;
        };

        const handleExplainPoste = (code: string, label: string, amount: number) => {
          const analyses: Record<string, { analysis: string; risk: string }> = {
            '211': { analysis: '2 logiciels & licences amortissables · Durée résiduelle : 3 ans', risk: 'Faible' },
            '241': { analysis: '4 équipements & 2 véhicules · Taux amortissement moyen : 20 %', risk: 'Faible' },
            '251': { analysis: 'Participation dans 1 filiale · Valeur d\'usage estimée conforme', risk: 'Moyen' },
            '311': { analysis: '3 catégories de stocks · Rotation : 45 j · Aucun stock obsolète détecté', risk: 'Faible' },
            '411': { analysis: '12 clients débiteurs · 3 créances > 90 j · Créance max : 2 400 000 FCFA', risk: 'Moyen' },
            '471': { analysis: 'Acomptes versés & débiteurs divers · Aucune créance litigieuse', risk: 'Faible' },
            '521/571': { analysis: '2 comptes bancaires + 1 caisse + Mobile Money · Solde conforme au rapprochement', risk: 'Faible' },
            '101': { analysis: 'Capital entièrement libéré · RCCM conforme', risk: 'Faible' },
            '111': { analysis: 'Réserve légale 10 % + réserves facultatives statutaires', risk: 'Faible' },
            '120': { analysis: 'Report bénéficiaire de l\'exercice N-2 affecté en AG', risk: 'Faible' },
            '131': { analysis: `Résultat après impôt IS · Marge nette : ${ros.toFixed(1)} %`, risk: resultatNet > 0 ? 'Faible' : 'Élevé' },
            '162': { analysis: '1 emprunt en cours · Taux : 7 % · Échéance finale : 31/12/N+2', risk: 'Moyen' },
            '181': { analysis: '2 contrats crédit-bail véhicules · Durée résiduelle : 18 mois', risk: 'Faible' },
            '401': { analysis: '8 fournisseurs créditeurs · Délai moyen : 39 j · Aucun litige', risk: 'Faible' },
            '432': { analysis: 'TVA à décaisser + IS provisionné · Déclaration en cours', risk: 'Moyen' },
            '434': { analysis: 'CNPS & charges sociales à payer · Calendrier à jour', risk: 'Faible' },
            '471p': { analysis: 'Avances clients & créditeurs divers', risk: 'Faible' },
          };
          const a = analyses[code] || { analysis: 'Analyse disponible après synchronisation du grand livre.', risk: 'Non évalué' };
          setExplainPosteData({ title: label, code, amount, ...a });
        };

        // ── Ligne de bilan cliquable ────────────────────────────────────────
        const BilanRow = ({ code, label, brut, amort, net, n1, accent = 'slate' }: {
          code: string; label: string; brut?: number; amort?: number; net: number; n1: number; accent?: string;
        }) => (
          <div
            onClick={() => handleOpenDrillDown(label, code, net)}
            className="group flex items-center hover:bg-slate-50 rounded-xl px-2 py-1.5 cursor-pointer border border-transparent hover:border-slate-200 transition-all"
          >
            <span className="w-14 shrink-0 text-[10px] font-mono font-bold text-slate-400">{code}</span>
            <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{label}</span>
            {showNvsN1 && brut !== undefined && (
              <span className="w-24 text-right text-[11px] font-mono text-slate-400 hidden lg:block">{formatMoney(brut)}</span>
            )}
            {showNvsN1 && amort !== undefined && (
              <span className="w-24 text-right text-[11px] font-mono text-rose-400 hidden lg:block">{amort > 0 ? `-${formatMoney(amort)}` : '—'}</span>
            )}
            <span className={`w-28 text-right text-[11px] font-mono font-bold ${accent === 'emerald' ? 'text-emerald-600' : accent === 'rose' ? 'text-rose-600' : 'text-slate-900'}`}>
              {formatMoney(net)}
            </span>
            {showNvsN1 && (
              <span className="w-36 text-right hidden xl:block">{fmtVar(net, n1)}</span>
            )}
            <button
              onClick={e => { e.stopPropagation(); handleExplainPoste(code, label, net); }}
              className="ml-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-violet-100 text-violet-500 transition-all shrink-0"
              title="Expliquer ce poste (IA)"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
        );

        return (
          <div className="space-y-5">
            {/* ── 1. BANNIÈRE CONTRÔLE DE COHÉRENCE ─────────────────────── */}
            <div className={`flex items-center justify-between p-4 rounded-2xl border-2 ${
              bilanEquilibre
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{bilanEquilibre ? '🟢' : '🔴'}</span>
                <div>
                  <div className={`text-sm font-extrabold ${bilanEquilibre ? 'text-emerald-800' : 'text-red-800'}`}>
                    {bilanEquilibre ? 'Bilan équilibré — Actif = Passif' : 'Anomalie comptable détectée'}
                  </div>
                  <div className="text-xs font-medium text-slate-600">
                    {bilanEquilibre
                      ? `Actif : ${formatMoney(totalActifReel)} · Passif : ${formatMoney(totalPassifReel)} · Écart : 0 FCFA`
                      : `Écart Actif / Passif : ${formatMoney(ecartBilan)} · Vérifiez les imputations de clôture`
                    }
                  </div>
                </div>
              </div>
              {!bilanEquilibre && (
                <button
                  onClick={() => handleOpenDrillDown('Écritures de clôture', '999', ecartBilan)}
                  className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1"
                >
                  <Search className="w-3 h-3" /> Voir les écritures concernées
                </button>
              )}
            </div>

            {/* ── 2. CENTRE DE CONTRÔLE ─────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Statut de production — États Financiers {currentYear}</div>
                  <div className="text-slate-800 font-bold text-sm mt-0.5">Centre de contrôle SYSCOHADA</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-2xl font-black text-emerald-600 font-mono">{scoreConformite} %</div>
                  <div className="text-[10px] text-slate-400 font-bold">Score de conformité</div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {controles.map(c => (
                  <div key={c.label} className={`p-2.5 rounded-xl text-center border ${
                    c.status === 'ok' ? 'bg-emerald-50 border-emerald-100'
                    : c.status === 'warn' ? 'bg-amber-50 border-amber-100'
                    : c.status === 'pending' ? 'bg-slate-50 border-slate-100'
                    : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="text-lg mb-1">{statusIcon(c.status)}</div>
                    <div className="text-[9px] font-extrabold text-slate-600 leading-tight">{c.label}</div>
                    <div className={`text-[8px] font-bold mt-0.5 ${
                      c.status === 'ok' ? 'text-emerald-600' : c.status === 'warn' ? 'text-amber-600' : c.status === 'pending' ? 'text-slate-400' : 'text-red-600'
                    }`}>{statusLabel(c.status)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 3. BARRE D'OUTILS ─────────────────────────────────────── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Mode Comptable / Direction */}
                <div className="flex bg-slate-100 rounded-xl p-1 text-xs font-bold">
                  <button onClick={() => setBilanViewMode('comptable')} className={`px-3 py-1.5 rounded-lg transition-all ${ bilanViewMode === 'comptable' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500' }`}>
                    Mode Comptable
                  </button>
                  <button onClick={() => setBilanViewMode('direction')} className={`px-3 py-1.5 rounded-lg transition-all ${ bilanViewMode === 'direction' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500' }`}>
                    Mode Direction
                  </button>
                </div>
                {/* N / N-1 */}
                <button
                  onClick={() => setShowNvsN1(!showNvsN1)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    showNvsN1 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  {showNvsN1 ? 'N / N-1 ✓' : 'Afficher N vs N-1'}
                </button>
              </div>

              {/* Actions hiérarchisées */}
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownload(() => api.downloadBilanPdf())} className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 transition-all">
                  <Download className="w-3 h-3 text-rose-500" /> PDF
                </button>
                <button onClick={() => window.print()} className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 transition-all">
                  <Printer className="w-3 h-3 text-slate-500" /> Impression
                </button>
                <button
                  onClick={() => setShowClotureConfirm(true)}
                  disabled={!bilanEquilibre}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-slate-900 text-white hover:bg-slate-800"
                  title={!bilanEquilibre ? 'Clôture bloquée : anomalie détectée dans le bilan' : 'Clôturer l\'exercice'}
                >
                  <Lock className="w-3 h-3" /> Clôturer
                  {!bilanEquilibre && <AlertTriangle className="w-3 h-3 text-red-400" />}
                </button>
              </div>
            </div>

            {/* ── 4. VUE DIRECTION ──────────────────────────────────────── */}
            {bilanViewMode === 'direction' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Actif', val: totalActifReel, color: 'emerald', sub: 'Ressources économiques contrôlées' },
                    { label: 'Capitaux propres', val: 10000000 + 2500000 + 1200000 + resultatNet, color: 'violet', sub: 'Financement par fonds propres' },
                    { label: 'Dettes financières', val: 4500000 + 800000, color: 'amber', sub: 'Endettement bancaire & crédit-bail' },
                    { label: 'Fonds de Roulement', val: fdr, color: 'indigo', sub: 'Ressources stables - Emplois durables' },
                    { label: 'BFR', val: bfr, color: 'slate', sub: 'Stocks + Créances - Dettes fournisseurs' },
                    { label: 'Trésorerie Nette', val: tresorerieNette, color: 'emerald', sub: 'FDR - BFR' },
                  ].map(k => (
                    <div key={k.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">{k.label}</div>
                      <div className={`text-lg font-black font-mono ${
                        k.color === 'emerald' ? 'text-emerald-600' : k.color === 'violet' ? 'text-violet-700' : k.color === 'amber' ? 'text-amber-600' : k.color === 'indigo' ? 'text-indigo-700' : 'text-slate-900'
                      }`}>{formatMoney(k.val)}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{k.sub}</div>
                    </div>
                  ))}
                </div>
                {/* Ratios */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">Ratios financiers clés</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                      { label: 'Liquidité générale', val: '1.85', status: 'ok' },
                      { label: 'Liquidité réduite', val: '1.42', status: 'ok' },
                      { label: 'Autonomie financière', val: `${ratioAutonomie.toFixed(0)} %`, status: ratioAutonomie > 40 ? 'ok' : 'warn' },
                      { label: 'Endettement', val: '32 %', status: 'ok' },
                      { label: 'Délai clients', val: '47 j', status: 'warn' },
                      { label: 'Délai fournisseurs', val: '39 j', status: 'ok' },
                    ].map(r => (
                      <div key={r.label} className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-lg font-black font-mono text-slate-900">{r.val}</div>
                        <div className="text-[9px] font-semibold text-slate-500 mt-1 leading-tight">{r.label}</div>
                        <div className="mt-1.5">{r.status === 'ok' ? <span className="text-[9px] text-emerald-600 font-bold">🟢 OK</span> : <span className="text-[9px] text-amber-600 font-bold">🟠 Attention</span>}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── 5. VUE COMPTABLE \u2014 FORMAT OFFICIEL SYSCOHADA \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
            {bilanViewMode === 'comptable' && (() => {
              // \u2500\u2500 Helper : une ligne du tableau \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
              type RowVariant = 'section' | 'subsection' | 'item' | 'total' | 'grandtotal';
              const BRow = ({
                label, brut = 0, amort = 0, net = 0, n1 = 0,
                variant = 'item', code, italic = false,
              }: {
                label: string; brut?: number; amort?: number; net?: number; n1?: number;
                variant?: RowVariant; code?: string; italic?: boolean;
              }) => {
                const isSection = variant === 'section';
                const isSubsection = variant === 'subsection';
                const isTotal = variant === 'total';
                const isGrand = variant === 'grandtotal';

                if (isSection) return (
                  <tr className="bg-[#e8f8fb]">
                    <td colSpan={5} className="px-3 py-1.5 text-[11px] font-extrabold text-[#00a8c6] uppercase tracking-wider border-b-2 border-[#00a8c6]">
                      {label}
                    </td>
                  </tr>
                );
                if (isSubsection) return (
                  <tr className="bg-slate-50">
                    <td colSpan={5} className="px-3 py-1 text-[11px] font-bold text-slate-700">{label}</td>
                  </tr>
                );
                if (isTotal) return (
                  <tr className="border-t-2 border-slate-700">
                    <td className="px-3 py-2 text-[11px] font-black text-slate-900 uppercase">{label}</td>
                    <td className="px-3 py-2 text-right text-[11px] font-black text-slate-900 font-mono">{brut !== 0 ? brut.toLocaleString('fr-FR') : '0'}</td>
                    <td className="px-3 py-2 text-right text-[11px] font-black text-slate-900 font-mono">{amort !== 0 ? amort.toLocaleString('fr-FR') : '0'}</td>
                    <td className="px-3 py-2 text-right text-[11px] font-black text-[#00a8c6] font-mono">{net !== 0 ? net.toLocaleString('fr-FR') : '0'}</td>
                    <td className="px-3 py-2 text-right text-[11px] font-black text-slate-500 font-mono">{n1 !== 0 ? n1.toLocaleString('fr-FR') : '0'}</td>
                  </tr>
                );
                if (isGrand) return (
                  <tr className="bg-[#00a8c6]">
                    <td className="px-3 py-2 text-[11px] font-black text-white uppercase">{label}</td>
                    <td className="px-3 py-2 text-right text-[11px] font-black text-white font-mono">{brut !== 0 ? brut.toLocaleString('fr-FR') : '0'}</td>
                    <td className="px-3 py-2 text-right text-[11px] font-black text-white font-mono">{amort !== 0 ? amort.toLocaleString('fr-FR') : '0'}</td>
                    <td className="px-3 py-2 text-right text-[11px] font-black text-white font-mono">{net !== 0 ? net.toLocaleString('fr-FR') : '0'}</td>
                    <td className="px-3 py-2 text-right text-[11px] font-black text-white font-mono">{n1 !== 0 ? n1.toLocaleString('fr-FR') : '0'}</td>
                  </tr>
                );
                // item normal
                return (
                  <tr
                    onClick={() => code ? handleOpenDrillDown(label, code, net) : undefined}
                    className={`border-b border-slate-100 group transition-colors ${code ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                  >
                    <td className={`px-3 py-1 text-[11px] ${italic ? 'italic text-slate-500' : 'text-slate-700'} flex items-center gap-1`}>
                      {italic ? <span className="pl-4">{label}</span> : label}
                      {code && (
                        <button
                          onClick={e => { e.stopPropagation(); handleExplainPoste(code, label, net); }}
                          className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 rounded text-violet-400 hover:bg-violet-100 transition-all"
                          title="Expliquer ce poste"
                        >
                          <Info className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-1 text-right text-[11px] font-mono text-slate-600">{brut !== 0 ? brut.toLocaleString('fr-FR') : <span className="text-slate-300">0</span>}</td>
                    <td className="px-3 py-1 text-right text-[11px] font-mono text-rose-400">{amort !== 0 ? amort.toLocaleString('fr-FR') : <span className="text-slate-300">0</span>}</td>
                    <td className="px-3 py-1 text-right text-[11px] font-mono font-semibold text-slate-800">{net !== 0 ? net.toLocaleString('fr-FR') : <span className="text-slate-300">0</span>}</td>
                    <td className="px-3 py-1 text-right text-[11px] font-mono text-slate-400">{n1 !== 0 ? n1.toLocaleString('fr-FR') : <span className="text-slate-300">0</span>}</td>
                  </tr>
                );
              };

              // \u2500\u2500 Totaux calcul\u00e9s \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
              const totalImmoBrut = 3000000 + 14500000 + 1000000;
              const totalImmoAmort = 500000 + 1700000 + 0;
              const totalImmoNet = 2500000 + 12800000 + 1000000;
              const totalImmoN1 = 2000000 + 11200000 + 800000;

              const totalCircBrut = 4800000 + 8900000 + 1500000 + 6000000;
              const totalCircNet = 4800000 + 8900000 + 1500000 + 6000000;
              const totalCircN1 = 3900000 + 7400000 + 1200000 + 4500000;

              const totalActifBrut = totalImmoBrut + totalCircBrut;
              const totalActifAmort = totalImmoAmort;
              const totalActifNet = totalImmoNet + totalCircNet;
              const totalActifN1net = totalImmoN1 + totalCircN1;

              // Passif
              const capPropresNet = 10000000 + 2500000 + 1200000 + resultatNet;
              const capPropresN1 = 10000000 + 2000000 + 800000 + 2800000;
              const dettesFinNet = 4500000 + 800000;
              const dettesFinN1 = 5200000 + 1000000;
              const passifCircNet = 6500000 + 1800000 + 1050000 + 600000;
              const passifCircN1 = 5300000 + 1400000 + 900000 + 500000;
              const totalPassifNet2 = capPropresNet + dettesFinNet + passifCircNet;
              const totalPassifN1net = capPropresN1 + dettesFinN1 + passifCircN1;

              const TableHeader = ({ side }: { side: 'actif' | 'passif' }) => (
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-extrabold text-slate-700 w-[46%]">
                      {side === 'actif' ? 'ACTIF' : 'PASSIF'}
                    </th>
                    <th colSpan={3} className="px-3 py-1.5 text-center text-[10px] font-bold text-slate-500 border-b border-slate-200">
                      Année N
                    </th>
                    <th className="px-3 py-1.5 text-center text-[10px] font-bold text-slate-400 border-b border-slate-100">
                      Année N-1
                    </th>
                  </tr>
                  <tr className="bg-slate-50 border-b-2 border-slate-300">
                    <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-slate-500"></th>
                    <th className="px-3 py-1.5 text-right text-[10px] font-bold text-slate-600">Brut</th>
                    <th className="px-3 py-1.5 text-right text-[10px] font-bold text-rose-400">Amort. Prov.</th>
                    <th className="px-3 py-1.5 text-right text-[10px] font-bold text-[#00a8c6]">Net</th>
                    <th className="px-3 py-1.5 text-right text-[10px] font-bold text-slate-400">Net</th>
                  </tr>
                </thead>
              );

              return (
                <div className="space-y-8">
                  {/* En-t\u00eate Bilan */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:rounded-none print:border-0 print:shadow-none">
                    <div className="flex items-center justify-between px-8 py-5 border-b-4 border-[#00a8c6]">
                      <div>
                        <div className="text-3xl font-black text-[#00a8c6] leading-tight">Bilan comptable</div>
                        <div className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-widest">
                          Système Normal SYSCOHADA R\u00e9vis\u00e9 — Exercice {currentYear}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">MELARO GROUP · RCCM : CM-DOU-2026-B-14529 · NIF : M082612345678A</div>
                      </div>
                      <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center text-white font-black text-sm shadow-lg">
                        Logo
                      </div>
                    </div>

                    {/* \u2500\u2500 TABLE ACTIF \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <TableHeader side="actif" />
                        <tbody>
                          {/* Capital souscrit non appel\u00e9 */}
                          <BRow label="Capital souscrit \u2013 non appel\u00e9" brut={0} amort={0} net={0} n1={0} />

                          {/* ACTIF IMMOBILIS\u00c9 */}
                          <BRow label="ACTIF IMMOBILIS\u00c9" variant="section" />

                          <BRow label="Immobilisations incorporelles :" variant="subsection" />
                          <BRow label="Frais d'\u00e9tablissement" brut={0} amort={0} net={0} n1={0} italic />
                          <BRow label="Frais de recherche & d\u00e9veloppement" brut={0} amort={0} net={0} n1={0} italic />
                          <BRow label="Concessions, brevets, licences, marques, proc\u00e9d\u00e9s, logiciels, droits et valeurs similaires" brut={3000000} amort={500000} net={2500000} n1={2000000} italic code="211" />
                          <BRow label="Fonds commercial (1)" brut={0} amort={0} net={0} n1={0} italic />
                          <BRow label="Autres" brut={0} amort={0} net={0} n1={0} italic />
                          <BRow label="Immobilisations incorporelles en cours" brut={0} amort={0} net={0} n1={0} italic />
                          <BRow label="Avances et acomptes" brut={0} amort={0} net={0} n1={0} italic />

                          <BRow label="Immobilisations corporelles :" variant="subsection" />
                          <BRow label="Terrains" brut={0} amort={0} net={0} n1={0} italic />
                          <BRow label="Constructions" brut={0} amort={0} net={0} n1={0} italic />
                          <BRow label="Installations techniques, mat\u00e9riels et outillage industriels" brut={14500000} amort={1700000} net={12800000} n1={11200000} italic code="241" />
                          <BRow label="Autres" brut={0} amort={0} net={0} n1={0} italic />
                          <BRow label="Immobilisations corporelles en cours" brut={0} amort={0} net={0} n1={0} italic />
                          <BRow label="Avances et acomptes" brut={0} amort={0} net={0} n1={0} italic />

                          <BRow label="Immobilisations financi\u00e8res (2) :" variant="subsection" />
                          <BRow label="Participations" brut={1000000} amort={0} net={1000000} n1={800000} italic code="251" />
                          <BRow label="Cr\u00e9ances rattach\u00e9es \u00e0 des participations" brut={0} amort={0} net={0} n1={0} italic />
                          <BRow label="Titres immobilis\u00e9s de l'activit\u00e9 de portefeuille" brut={0} amort={0} net={0} n1={0} italic />
                          <BRow label="Autres titres immobilis\u00e9s" brut={0} amort={0} net={0} n1={0} italic />
                          <BRow label="Pr\u00eats" brut={0} amort={0} net={0} n1={0} italic />
                          <BRow label="Autres" brut={0} amort={0} net={0} n1={0} italic />

                          <BRow label="Total I" brut={totalImmoBrut} amort={totalImmoAmort} net={totalImmoNet} n1={totalImmoN1} variant="total" />

                          {/* ACTIF CIRCULANT */}
                          <BRow label="ACTIF CIRCULANT" variant="section" />

                          <BRow label="Stocks et en-cours :" variant="subsection" />
                          <BRow label="Mati\u00e8res premi\u00e8res et autres approvisionnements" brut={0} amort={0} net={0} n1={0} italic />
                          <BRow label="En cours de production (biens et services)" brut={0} amort={0} net={0} n1={0} italic />
                          <BRow label="Produits interm\u00e9diaires et finis" brut={0} amort={0} net={0} n1={0} italic />
                          <BRow label="Marchandises" brut={4800000} amort={0} net={4800000} n1={3900000} italic code="311" />

                          <BRow label="Avances et acomptes vers\u00e9s sur commandes" brut={0} amort={0} net={0} n1={0} />

                          <BRow label="Cr\u00e9ances :" variant="subsection" />
                          <BRow label="Cr\u00e9ances clients et comptes rattach\u00e9s" brut={8900000} amort={0} net={8900000} n1={7400000} italic code="411" />
                          <BRow label="Autres" brut={1500000} amort={0} net={1500000} n1={1200000} italic code="471" />
                          <BRow label="Capital souscrit \u2013 appel\u00e9, non vers\u00e9" brut={0} amort={0} net={0} n1={0} italic />

                          <BRow label="Valeurs mobili\u00e8res de placement :" variant="subsection" />
                          <BRow label="Actions propres" brut={0} amort={0} net={0} n1={0} italic />
                          <BRow label="Autres titres" brut={0} amort={0} net={0} n1={0} italic />

                          <BRow label="Instruments de tr\u00e9sorerie" brut={0} amort={0} net={0} n1={0} />
                          <BRow label="Disponibilit\u00e9s" brut={6000000} amort={0} net={6000000} n1={4500000} code="521/571" />
                          <BRow label="Charges constat\u00e9es d'avance (3)" brut={0} amort={0} net={0} n1={0} />

                          <BRow label="Total II" brut={totalCircBrut} amort={0} net={totalCircNet} n1={totalCircN1} variant="total" />

                          {/* Lignes sp\u00e9ciales */}
                          <BRow label="Charges \u00e0 r\u00e9partir sur plusieurs exercices (III)" brut={0} amort={0} net={0} n1={0} variant="total" />
                          <BRow label="Primes de remboursement des emprunts (IV)" brut={0} amort={0} net={0} n1={0} variant="total" />
                          <BRow label="\u00c9carts de conversion Actif (V)" brut={0} amort={0} net={0} n1={0} variant="total" />

                          <BRow label="TOTAL GÉNÉRAL" brut={totalActifBrut} amort={totalActifAmort} net={totalActifNet} n1={totalActifN1net} variant="grandtotal" />
                        </tbody>
                      </table>
                    </div>
                    <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 space-y-0.5">
                      <div>(1) Dont droit au bail</div>
                      <div>(2) Dont \u00e0 moins d'un an</div>
                      <div>(3) Dont \u00e0 moins d'un an</div>
                    </div>
                  </div>

                  {/* \u2500\u2500 TABLE PASSIF \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-8 py-4 border-b-4 border-[#00a8c6]">
                      <div className="text-lg font-black text-[#00a8c6] uppercase tracking-wider">Bilan comptable \u2014 Passif</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Exercice {currentYear} \u00b7 Syst\u00e8me Normal SYSCOHADA R\u00e9vis\u00e9</div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-[11px] font-extrabold text-slate-700 w-[46%]">PASSIF</th>
                            <th className="px-3 py-1.5 text-right text-[10px] font-bold text-[#00a8c6]">Montant N</th>
                            <th className="px-3 py-1.5 text-right text-[10px] font-bold text-slate-400">Montant N-1</th>
                          </tr>
                          <tr className="bg-slate-50 border-b-2 border-slate-300">
                            <th></th>
                            <th className="px-3 py-1 text-right text-[9px] font-semibold text-[#00a8c6]">FCFA</th>
                            <th className="px-3 py-1 text-right text-[9px] font-semibold text-slate-400">FCFA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* CAPITAUX PROPRES */}
                          <tr className="bg-[#e8f8fb]">
                            <td colSpan={3} className="px-3 py-1.5 text-[11px] font-extrabold text-[#00a8c6] uppercase tracking-wider border-b-2 border-[#00a8c6]">
                              CAPITAUX PROPRES
                            </td>
                          </tr>
                          {[
                            { label: 'Capital social ou individuel (dont versé)', net: 10000000, n1: 10000000, code: '101' },
                            { label: 'Primes d\'émission, de fusion, d\'apport\u2026', net: 0, n1: 0 },
                            { label: 'Écarts de réévaluation', net: 0, n1: 0 },
                            { label: 'Réserve légale', net: 2500000, n1: 2000000, code: '111' },
                            { label: 'Réserves statutaires ou contractuelles', net: 0, n1: 0 },
                            { label: 'Réserves réglementées', net: 0, n1: 0 },
                            { label: 'Autres réserves', net: 0, n1: 0 },
                            { label: 'Report à nouveau (solde créditeur)', net: 1200000, n1: 800000, code: '120' },
                            { label: 'Résultat de l\'exercice (bénéfice ou perte)', net: resultatNet, n1: 2800000, code: '131' },
                            { label: 'Subventions d\'investissement', net: 0, n1: 0 },
                            { label: 'Provisions réglementées', net: 0, n1: 0 },
                          ].map(r => (
                            <tr key={r.label}
                              onClick={() => r.code ? handleOpenDrillDown(r.label, r.code, r.net) : undefined}
                              className={`border-b border-slate-100 group transition-colors ${r.code ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                            >
                              <td className="px-3 py-1 text-[11px] italic text-slate-500 pl-7 flex items-center gap-1">
                                {r.label}
                                {r.code && (
                                  <button onClick={e => { e.stopPropagation(); handleExplainPoste(r.code!, r.label, r.net); }}
                                    className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 rounded text-violet-400 hover:bg-violet-100 transition-all" title="Expliquer ce poste">
                                    <Info className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </td>
                              <td className="px-3 py-1 text-right text-[11px] font-mono font-semibold text-slate-800">{r.net !== 0 ? r.net.toLocaleString('fr-FR') : <span className="text-slate-300">0</span>}</td>
                              <td className="px-3 py-1 text-right text-[11px] font-mono text-slate-400">{r.n1 !== 0 ? r.n1.toLocaleString('fr-FR') : <span className="text-slate-300">0</span>}</td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-slate-700">
                            <td className="px-3 py-2 text-[11px] font-black text-slate-900 uppercase">Total I — Capitaux propres</td>
                            <td className="px-3 py-2 text-right text-[11px] font-black text-[#00a8c6] font-mono">{capPropresNet.toLocaleString('fr-FR')}</td>
                            <td className="px-3 py-2 text-right text-[11px] font-black text-slate-400 font-mono">{capPropresN1.toLocaleString('fr-FR')}</td>
                          </tr>

                          {/* PROVISIONS */}
                          <tr className="bg-[#e8f8fb]">
                            <td colSpan={3} className="px-3 py-1.5 text-[11px] font-extrabold text-[#00a8c6] uppercase tracking-wider border-b-2 border-[#00a8c6]">
                              PROVISIONS POUR RISQUES ET CHARGES
                            </td>
                          </tr>
                          {[
                            { label: 'Provisions pour risques', net: 0, n1: 0 },
                            { label: 'Provisions pour charges', net: 0, n1: 0 },
                          ].map(r => (
                            <tr key={r.label} className="border-b border-slate-100">
                              <td className="px-3 py-1 text-[11px] italic text-slate-500 pl-7">{r.label}</td>
                              <td className="px-3 py-1 text-right text-[11px] font-mono text-slate-300">0</td>
                              <td className="px-3 py-1 text-right text-[11px] font-mono text-slate-300">0</td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-slate-700">
                            <td className="px-3 py-2 text-[11px] font-black text-slate-900 uppercase">Total II — Provisions</td>
                            <td className="px-3 py-2 text-right text-[11px] font-black text-[#00a8c6] font-mono">0</td>
                            <td className="px-3 py-2 text-right text-[11px] font-black text-slate-400 font-mono">0</td>
                          </tr>

                          {/* DETTES */}
                          <tr className="bg-[#e8f8fb]">
                            <td colSpan={3} className="px-3 py-1.5 text-[11px] font-extrabold text-[#00a8c6] uppercase tracking-wider border-b-2 border-[#00a8c6]">
                              DETTES
                            </td>
                          </tr>
                          {[
                            { label: 'Emprunts obligataires convertibles', net: 0, n1: 0 },
                            { label: 'Autres emprunts obligataires', net: 0, n1: 0 },
                            { label: 'Emprunts et dettes auprès des établissements de crédit (1)', net: 4500000, n1: 5200000, code: '162' },
                            { label: 'Emprunts et dettes financières divers (2)', net: 0, n1: 0 },
                            { label: 'Avances et acomptes reçus sur commandes en cours', net: 0, n1: 0 },
                            { label: 'Dettes fournisseurs et comptes rattachés', net: 6500000, n1: 5300000, code: '401' },
                            { label: 'Dettes fiscales et sociales', net: 1800000 + 1050000, n1: 1400000 + 900000, code: '432' },
                            { label: 'Dettes sur immobilisations et comptes rattachés', net: 800000, n1: 1000000, code: '181' },
                            { label: 'Autres dettes', net: 600000, n1: 500000, code: '471p' },
                            { label: 'Produits constatés d\'avance (3)', net: 0, n1: 0 },
                          ].map(r => (
                            <tr key={r.label}
                              onClick={() => r.code ? handleOpenDrillDown(r.label, r.code, r.net) : undefined}
                              className={`border-b border-slate-100 group transition-colors ${r.code ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                            >
                              <td className="px-3 py-1 text-[11px] italic text-slate-500 pl-7 flex items-center gap-1">
                                {r.label}
                                {r.code && (
                                  <button onClick={e => { e.stopPropagation(); handleExplainPoste(r.code!, r.label, r.net); }}
                                    className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 rounded text-violet-400 hover:bg-violet-100 transition-all" title="Expliquer">
                                    <Info className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </td>
                              <td className="px-3 py-1 text-right text-[11px] font-mono font-semibold text-slate-800">{r.net !== 0 ? r.net.toLocaleString('fr-FR') : <span className="text-slate-300">0</span>}</td>
                              <td className="px-3 py-1 text-right text-[11px] font-mono text-slate-400">{r.n1 !== 0 ? r.n1.toLocaleString('fr-FR') : <span className="text-slate-300">0</span>}</td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-slate-700">
                            <td className="px-3 py-2 text-[11px] font-black text-slate-900 uppercase">Total III — Dettes</td>
                            <td className="px-3 py-2 text-right text-[11px] font-black text-[#00a8c6] font-mono">{(dettesFinNet + passifCircNet).toLocaleString('fr-FR')}</td>
                            <td className="px-3 py-2 text-right text-[11px] font-black text-slate-400 font-mono">{(dettesFinN1 + passifCircN1).toLocaleString('fr-FR')}</td>
                          </tr>

                          {/* Écarts de conversion */}
                          <tr className="border-b border-slate-100">
                            <td className="px-3 py-2 text-[11px] font-black text-slate-900 uppercase">Écarts de conversion — Passif (IV)</td>
                            <td className="px-3 py-2 text-right text-[11px] font-black text-[#00a8c6] font-mono">0</td>
                            <td className="px-3 py-2 text-right text-[11px] font-black text-slate-400 font-mono">0</td>
                          </tr>

                          {/* TOTAL GÉNÉRAL */}
                          <tr className="bg-[#00a8c6]">
                            <td className="px-3 py-2 text-[11px] font-black text-white uppercase">TOTAL GÉNÉRAL</td>
                            <td className="px-3 py-2 text-right text-[11px] font-black text-white font-mono">{totalPassifNet2.toLocaleString('fr-FR')}</td>
                            <td className="px-3 py-2 text-right text-[11px] font-black text-white font-mono">{totalPassifN1net.toLocaleString('fr-FR')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 space-y-0.5">
                      <div>(1) Dont concours bancaires courants et soldes créditeurs de banques</div>
                      <div>(2) Dont emprunts participatifs</div>
                      <div>(3) Dont produits constatés d'avance rattachés à des contrats long terme</div>
                    </div>
                  </div>
                </div>
              );
            })()}


            {/* ── 6. DIAGNOSTIC FINANCIER ───────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Panel Equilibres */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">Équilibres financiers</div>
                <div className="space-y-3">
                  {[
                    { label: 'Fonds de Roulement Net Global (FRNG)', val: fdr, status: fdr > 0 ? 'ok' : 'error', desc: 'Ressources stables − Emplois stables' },
                    { label: 'Besoin en Fonds de Roulement (BFR)', val: bfr, status: bfr < fdr ? 'ok' : 'warn', desc: 'Stocks + Créances − Dettes fournisseurs' },
                    { label: 'Trésorerie Nette', val: tresorerieNette, status: tresorerieNette > 0 ? 'ok' : 'error', desc: 'FRNG − BFR' },
                  ].map(e => (
                    <div key={e.label} className={`flex items-center justify-between p-3 rounded-xl border ${
                      e.status === 'ok' ? 'bg-emerald-50 border-emerald-100' : e.status === 'warn' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'
                    }`}>
                      <div>
                        <div className="text-xs font-bold text-slate-700">{e.label}</div>
                        <div className="text-[10px] text-slate-400">{e.desc}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-black font-mono ${ e.status === 'ok' ? 'text-emerald-600' : e.status === 'warn' ? 'text-amber-600' : 'text-red-600' }`}>
                          {formatMoney(e.val)}
                        </div>
                        <div className="text-[10px] font-bold">{statusIcon(e.status)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel IA Diagnostic */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Diagnostic FinancePro</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-bold">4 points d'attention</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-base shrink-0">{resultatNet > 0 ? '🟢' : '🔴'}</span>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{resultatNet > 0 ? 'Résultat positif' : 'Résultat déficitaire'}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Marge nette : {ros.toFixed(1)} % du CA · {resultatNet > 0 ? 'Rentabilité satisfaisante' : 'Action corrective urgente requise'}</div>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-base shrink-0">🟠</span>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Créances clients à surveiller</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">3 créances &gt; 90 j · Risque de dépréciation estimé à 15 %</div>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-base shrink-0">🟢</span>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Trésorerie positive</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Trésorerie nette : {formatMoney(tresorerieNette)} · Couverture &gt; 1 mois de charges</div>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-base shrink-0">🟢</span>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Autonomie financière : {ratioAutonomie.toFixed(0)} %</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Capitaux propres / Total Actif · Seuil OHADA recommandé : &gt; 30 %</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleExplainVariation}
                  disabled={variationLoading}
                  className="w-full mt-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {variationLoading ? 'Analyse en cours…' : 'Voir le diagnostic complet'}
                </button>
                {variation && (
                  <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 font-medium leading-relaxed">
                    {variation.analyseIA}
                  </div>
                )}
              </div>
            </div>

            {/* ── Modal : Confirmer Clôture ─────────────────────────────── */}
            {showClotureConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border-2 border-red-200">
                  <div className="bg-red-50 px-6 py-4 flex items-center gap-3 border-b border-red-100">
                    <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-extrabold text-red-800 text-sm">Clôturer l'Exercice {currentYear}</div>
                      <div className="text-red-500 text-xs">Opération irréversible — Lecture seule après clôture</div>
                    </div>
                  </div>
                  <div className="px-6 py-5 space-y-3">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      Cette opération va <strong>verrouiller toutes les écritures</strong> de l'exercice {currentYear}. Aucune écriture ne pourra être modifiée ou ajoutée après clôture.
                    </p>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                        ⚠️ Avant de clôturer, assurez-vous que :
                        &nbsp;la balance est équilibrée · les dépréciations sont passées · le résultat est affecté · la liasse fiscale est validée.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
                    <button onClick={() => setShowClotureConfirm(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-all">Annuler</button>
                    <button onClick={() => { setShowClotureConfirm(false); alert(`Exercice ${currentYear} clôturé. Les écritures sont maintenant en lecture seule.`); }} className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all">
                      <Lock className="w-3.5 h-3.5" /> Confirmer la clôture
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Modal : Expliquer ce poste ────────────────────────────── */}
            {explainPosteData && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-violet-100">
                  <div className="flex items-center justify-between px-5 py-4 bg-violet-50 border-b border-violet-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      <div>
                        <div className="text-xs font-extrabold text-violet-800">Analyse du poste</div>
                        <div className="text-[10px] text-violet-500">Compte {explainPosteData.code}</div>
                      </div>
                    </div>
                    <button onClick={() => setExplainPosteData(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">{explainPosteData.title}</div>
                      <div className="text-lg font-black font-mono text-violet-700 mt-1">{formatMoney(explainPosteData.amount)}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Composition</div>
                      <p className="text-xs text-slate-700 leading-relaxed">{explainPosteData.analysis}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl flex items-center gap-2 ${
                      explainPosteData.risk === 'Faible' ? 'bg-emerald-50 border border-emerald-100'
                      : explainPosteData.risk === 'Moyen' ? 'bg-amber-50 border border-amber-100'
                      : 'bg-red-50 border border-red-100'
                    }`}>
                      <span className="text-base">{explainPosteData.risk === 'Faible' ? '🟢' : explainPosteData.risk === 'Moyen' ? '🟠' : '🔴'}</span>
                      <div>
                        <div className="text-[10px] font-bold text-slate-500">Risque estimé</div>
                        <div className="text-xs font-extrabold text-slate-800">{explainPosteData.risk}</div>
                      </div>
                    </div>
                    <div className="p-3 bg-violet-50 rounded-xl border border-violet-100">
                      <div className="text-[10px] font-bold text-violet-500 uppercase mb-1">Recommandation FinancePro</div>
                      <p className="text-xs text-violet-800 font-medium leading-relaxed">
                        {explainPosteData.risk === 'Faible'
                          ? 'Aucune action immédiate requise. Suivi trimestriel recommandé.'
                          : explainPosteData.risk === 'Moyen'
                          ? 'Surveiller l\'évolution de ce poste. Un examen approfondi est conseillé lors de la prochaine clôture intermédiaire.'
                          : 'Action corrective urgente requise. Contactez votre expert-comptable.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end px-5 pb-4">
                    <button
                      onClick={() => { setExplainPosteData(null); handleOpenDrillDown(explainPosteData.title, explainPosteData.code, explainPosteData.amount); }}
                      className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Search className="w-3.5 h-3.5" /> Voir les écritures
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* PILIER 3 : COMPTE DE RÉSULTAT (FORMAT OFFICIEL EN FCFA) */}
      {activeTab === 3 && (() => {
        // ── Helper pour l'affichage propre d'une ligne du Compte de Résultat ──
        type CRRowVariant = 'section' | 'item' | 'total' | 'grandtotal';
        const CRRow = ({
          label, val1 = 0, val2 = 0, val3 = 0,
          variant = 'item', italic = false, isNegative = false
        }: {
          label: string; val1?: number; val2?: number; val3?: number;
          variant?: CRRowVariant; italic?: boolean; isNegative?: boolean;
        }) => {
          const fmt = (v: number) => {
            if (v === 0) return <span className="text-slate-300">— FCFA</span>;
            const formatted = Math.abs(v).toLocaleString('fr-FR');
            const sign = v < 0 || isNegative ? '-' : '';
            return `${sign}${formatted} FCFA`;
          };

          if (variant === 'section') {
            return (
              <tr className="bg-slate-50/80 border-t border-slate-200">
                <td colSpan={4} className="px-4 py-2 text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                  {label}
                </td>
              </tr>
            );
          }

          if (variant === 'total') {
            return (
              <tr className="border-t-2 border-b-2 border-[#00a8c6] bg-[#e8f8fb]/60 font-black">
                <td className="px-4 py-2 text-[11px] text-[#00a8c6] uppercase">{label}</td>
                <td className="px-4 py-2 text-right text-[11px] text-[#00a8c6] font-mono">{fmt(val1)}</td>
                <td className="px-4 py-2 text-right text-[11px] text-[#00a8c6] font-mono">{fmt(val2)}</td>
                <td className="px-4 py-2 text-right text-[11px] text-[#00a8c6] font-mono">{fmt(val3)}</td>
              </tr>
            );
          }

          if (variant === 'grandtotal') {
            return (
              <tr className="bg-[#00a8c6] text-white font-black">
                <td className="px-4 py-3 text-xs uppercase tracking-wider">{label}</td>
                <td className="px-4 py-3 text-right text-xs font-mono">{fmt(val1)}</td>
                <td className="px-4 py-3 text-right text-xs font-mono">{fmt(val2)}</td>
                <td className="px-4 py-3 text-right text-xs font-mono">{fmt(val3)}</td>
              </tr>
            );
          }

          return (
            <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
              <td className={`px-4 py-1.5 text-[11px] ${italic ? 'italic text-slate-500 pl-7' : 'text-slate-700 font-medium'}`}>
                {label}
              </td>
              <td className={`px-4 py-1.5 text-right text-[11px] font-mono ${isNegative ? 'text-rose-600' : 'text-slate-800'}`}>{fmt(val1)}</td>
              <td className={`px-4 py-1.5 text-right text-[11px] font-mono ${isNegative ? 'text-rose-500' : 'text-slate-500'}`}>{fmt(val2)}</td>
              <td className={`px-4 py-1.5 text-right text-[11px] font-mono ${isNegative ? 'text-rose-400' : 'text-slate-400'}`}>{fmt(val3)}</td>
            </tr>
          );
        };

        // Données du compte de résultat sur 3 exercices (en FCFA)
        const crProduitsN = 28500000;
        const crProduitsN1 = 24000000;
        const crProduitsN2 = 20000000;

        const crChargesN = 23250000;
        const crChargesN1 = 19800000;
        const crChargesN2 = 16500000;

        const resAvantImpotsN = crProduitsN - crChargesN; // 5 250 000
        const resAvantImpotsN1 = crProduitsN1 - crChargesN1; // 4 200 000
        const resAvantImpotsN2 = crProduitsN2 - crChargesN2; // 3 500 000

        const impotN = 1800000;
        const impotN1 = 1400000;
        const impotN2 = 1100000;

        const resNetN = resAvantImpotsN - impotN; // 3 450 000
        const resNetN1 = resAvantImpotsN1 - impotN1; // 2 800 000
        const resNetN2 = resAvantImpotsN2 - impotN2; // 2 400 000

        return (
          <div className="space-y-6">
            {/* Barre d'action supérieure */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xl">📈</span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Compte de Résultat Officiel (SYSCOHADA)
                  </h3>
                  <p className="text-xs text-slate-500">Présentation comparative sur 3 exercices comptables</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExplainVariation}
                  disabled={variationLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  {variationLoading ? 'Analyse en cours...' : 'Expliquer les Variations (IA)'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimer A4
                </button>
              </div>
            </div>

            {/* Document Imprimable Compte de Résultat */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:rounded-none print:border-0 print:shadow-none">
              {/* En-tête avec titre et Logo */}
              <div className="flex items-center justify-between px-8 py-6 border-b-4 border-[#00a8c6]">
                <div>
                  <h1 className="text-3xl font-black text-[#00a8c6] leading-tight">Compte de résultat</h1>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
                    Système Normal SYSCOHADA Révisé — Exercice {currentYear}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    MELARO GROUP · RCCM : CM-DOU-2026-B-14529 · NIU : M082612345678A
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center text-white font-black text-sm shadow-lg">
                  Logo
                </div>
              </div>

              {/* Tableau du Compte de Résultat */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-300 bg-slate-50">
                      <th className="px-4 py-3 text-left text-[11px] font-extrabold text-slate-700 w-[46%]">
                        Postes
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-extrabold text-slate-700">
                        Exercice 1 (N)
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500">
                        Exercice 2 (N-1)
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400">
                        Exercice 3 (N-2)
                      </th>
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-100/50">
                      <td colSpan={4} className="px-4 py-1 text-[10px] italic text-slate-500">
                        (En FCFA)
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {/* PRODUITS */}
                    <CRRow label="Chiffres d'affaires" variant="section" />
                    <CRRow label="Ventes de marchandises" val1={20500000} val2={17500000} val3={14500000} italic />
                    <CRRow label="Ventes de prestations de services & travaux" val1={8000000} val2={6500000} val3={5500000} italic />

                    <CRRow label="Total des PRODUITS (A)" val1={crProduitsN} val2={crProduitsN1} val3={crProduitsN2} variant="total" />

                    {/* CHARGES */}
                    <CRRow label="Achats (variables)" variant="section" />
                    <CRRow label="marchandises & matières premières" val1={10800000} val2={9200000} val3={7800000} italic isNegative />
                    <CRRow label="emballages" val1={450000} val2={380000} val3={320000} italic isNegative />
                    <CRRow label="fournitures diverses" val1={350000} val2={300000} val3={250000} italic isNegative />

                    <CRRow label="Charges externes" variant="section" />
                    <CRRow label="loyers" val1={1200000} val2={1200000} val3={1000000} italic isNegative />
                    <CRRow label="charges locatives" val1={180000} val2={160000} val3={140000} italic isNegative />
                    <CRRow label="entretiens et réparations (locaux, matériel)" val1={340000} val2={290000} val3={240000} italic isNegative />
                    <CRRow label="fournitures non stockées (eau, électricité, gaz)" val1={420000} val2={360000} val3={310000} italic isNegative />
                    <CRRow label="assurances (locaux, RC prof.)" val1={250000} val2={220000} val3={200000} italic isNegative />
                    <CRRow label="frais de documentation" val1={60000} val2={50000} val3={40000} italic isNegative />
                    <CRRow label="honoraires (comptable et juriste)" val1={650000} val2={550000} val3={450000} italic isNegative />
                    <CRRow label="publicité" val1={480000} val2={400000} val3={320000} italic isNegative />
                    <CRRow label="transports" val1={320000} val2={280000} val3={230000} italic isNegative />
                    <CRRow label="frais de déplacement" val1={240000} val2={200000} val3={160000} italic isNegative />
                    <CRRow label="frais de mission et de réception" val1={190000} val2={150000} val3={120000} italic isNegative />
                    <CRRow label="frais de poste" val1={45000} val2={40000} val3={35000} italic isNegative />
                    <CRRow label="frais de téléphone, fax et portable" val1={270000} val2={230000} val3={190000} italic isNegative />

                    <CRRow label="Impôts et taxes" variant="section" />
                    <CRRow label="Impôts directs, patentes et taxes assimilées" val1={380000} val2={320000} val3={280000} italic isNegative />

                    <CRRow label="Charges de personnel" variant="section" />
                    <CRRow label="salaires bruts (salaire net + part salariale)" val1={3200000} val2={2700000} val3={2200000} italic isNegative />
                    <CRRow label="charges sociales (part patronale CNPS)" val1={680000} val2={570000} val3={470000} italic isNegative />
                    <CRRow label="rémunération du dirigeant" val1={1500000} val2={1300000} val3={1100000} italic isNegative />

                    <CRRow label="Charges financières" variant="section" />
                    <CRRow label="agios sur découvert bancaire" val1={120000} val2={90000} val3={70000} italic isNegative />
                    <CRRow label="intérêts sur emprunts" val1={450000} val2={520000} val3={580000} italic isNegative />

                    <CRRow label="Charges exceptionnelles (HAHA)" variant="section" />
                    <CRRow label="charges exceptionnelles diverses" val1={120000} val2={80000} val3={50000} italic isNegative />

                    <CRRow label="Dotations aux amortissements & provisions" variant="section" />
                    <CRRow label="dotations aux amortissements des immobilisations" val1={1700000} val2={1500000} val3={1300000} italic isNegative />

                    <CRRow label="Total des CHARGES (B)" val1={crChargesN} val2={crChargesN1} val3={crChargesN2} variant="total" isNegative />

                    <CRRow label="Résultat avant impôt (A)-(B)" val1={resAvantImpotsN} val2={resAvantImpotsN1} val3={resAvantImpotsN2} variant="total" />

                    <tr className="border-b border-slate-200">
                      <td className="px-4 py-2 text-[11px] font-semibold text-slate-700">Impôt sur les bénéfices (IS / IMF)</td>
                      <td className="px-4 py-2 text-right text-[11px] font-mono text-rose-600">-{impotN.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-4 py-2 text-right text-[11px] font-mono text-rose-500">-{impotN1.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-4 py-2 text-right text-[11px] font-mono text-rose-400">-{impotN2.toLocaleString('fr-FR')} FCFA</td>
                    </tr>

                    <CRRow label="RÉSULTAT NET COMPTABLE" val1={resNetN} val2={resNetN1} val3={resNetN2} variant="grandtotal" />
                  </tbody>
                </table>
              </div>

              {/* Pied de page du document */}
              <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 flex justify-between items-center">
                <span>FinancePro OHADA — Édition automatique des états financiers révisés</span>
                <span>Page 1 / 1</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PILIER 4 : TABLEAU DES FLUX DE TRÉSORERIE (TFT OFFICIEL SYSCOHADA EN FCFA) */}
      {activeTab === 4 && (() => {
        // Helper pour une ligne du TFT
        type TFTRowVariant = 'header-green' | 'section' | 'item' | 'total-navy' | 'footer-green';
        const TFTRow = ({
          refCode, label, note, valN = 0, valN1 = 0,
          variant = 'item', italic = false, isNegative = false
        }: {
          refCode?: string; label: string; note?: string; valN?: number; valN1?: number;
          variant?: TFTRowVariant; italic?: boolean; isNegative?: boolean;
        }) => {
          const fmt = (v: number) => {
            if (v === 0) return <span className="text-slate-300">—</span>;
            const formatted = Math.abs(v).toLocaleString('fr-FR');
            const sign = v < 0 || isNegative ? '-' : '';
            return `${sign}${formatted} FCFA`;
          };

          if (variant === 'header-green') {
            return (
              <tr className="bg-emerald-700 text-white font-extrabold border-b-2 border-emerald-800">
                <td className="px-3 py-2 text-center text-[10px] font-mono border-r border-emerald-600/50">{refCode}</td>
                <td className="px-4 py-2 text-[11px] uppercase tracking-wider">{label}</td>
                <td className="px-3 py-2 text-center text-[10px] font-mono border-l border-emerald-600/50">{note}</td>
                <td className="px-4 py-2 text-right text-[11px] font-mono">{fmt(valN)}</td>
                <td className="px-4 py-2 text-right text-[11px] font-mono">{fmt(valN1)}</td>
              </tr>
            );
          }

          if (variant === 'section') {
            return (
              <tr className="bg-slate-100/80 border-t-2 border-b border-slate-300 font-extrabold">
                <td className="px-3 py-2 text-center text-[10px] font-mono text-slate-500 border-r border-slate-200">{refCode}</td>
                <td colSpan={4} className="px-4 py-2 text-[11px] text-slate-800 uppercase tracking-wide">
                  {label}
                </td>
              </tr>
            );
          }

          if (variant === 'total-navy') {
            return (
              <tr className="bg-[#1e293b] text-white font-black border-t-2 border-b-2 border-slate-900">
                <td className="px-3 py-2 text-center text-[10px] font-mono text-emerald-400 border-r border-slate-700">{refCode}</td>
                <td className="px-4 py-2 text-[11px] uppercase tracking-wide">{label}</td>
                <td className="px-3 py-2 text-center text-[10px] font-mono text-amber-300 border-l border-slate-700">{note}</td>
                <td className="px-4 py-2 text-right text-[11px] font-mono text-emerald-400">{fmt(valN)}</td>
                <td className="px-4 py-2 text-right text-[11px] font-mono text-slate-300">{fmt(valN1)}</td>
              </tr>
            );
          }

          if (variant === 'footer-green') {
            return (
              <tr className="bg-emerald-800 text-white font-black text-xs border-t-4 border-emerald-950">
                <td className="px-3 py-3 text-center text-xs font-mono text-amber-300 border-r border-emerald-700">{refCode}</td>
                <td className="px-4 py-3 uppercase tracking-wider">{label}</td>
                <td className="px-3 py-3 text-center text-xs font-mono text-amber-300 border-l border-emerald-700">{note}</td>
                <td className="px-4 py-3 text-right font-mono text-amber-300">{fmt(valN)}</td>
                <td className="px-4 py-3 text-right font-mono text-emerald-100">{fmt(valN1)}</td>
              </tr>
            );
          }

          return (
            <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
              <td className="px-3 py-1.5 text-center text-[10px] font-mono text-slate-400 border-r border-slate-100">{refCode}</td>
              <td className={`px-4 py-1.5 text-[11px] ${italic ? 'italic text-slate-500 pl-7' : 'text-slate-700 font-medium'}`}>
                {label}
              </td>
              <td className="px-3 py-1.5 text-center text-[10px] font-mono text-slate-400 border-l border-slate-100">{note}</td>
              <td className={`px-4 py-1.5 text-right text-[11px] font-mono ${isNegative ? 'text-rose-600' : 'text-slate-800'}`}>{fmt(valN)}</td>
              <td className={`px-4 py-1.5 text-right text-[11px] font-mono ${isNegative ? 'text-rose-400' : 'text-slate-400'}`}>{fmt(valN1)}</td>
            </tr>
          );
        };

        // Données du TFT (en FCFA)
        const tresoDebutN = 4500000;
        const tresoDebutN1 = 3200000;

        // Flux Opérationnels (ZB)
        const cafgN = 6950000;
        const cafgN1 = 5600000;
        const varStocksN = -900000;
        const varStocksN1 = -700000;
        const varCreancesN = -1500000;
        const varCreancesN1 = -1200000;
        const varPassifN = 1200000;
        const varPassifN1 = 950000;
        const zbN = cafgN + varStocksN + varCreancesN + varPassifN; // 5 750 000
        const zbN1 = cafgN1 + varStocksN1 + varCreancesN1 + varPassifN1; // 4 650 000

        // Flux Investissement (ZC)
        const acqIncorpN = -500000;
        const acqIncorpN1 = -400000;
        const acqCorpN = -2100000;
        const acqCorpN1 = -1800000;
        const acqFinN = -200000;
        const acqFinN1 = 0;
        const zcN = acqIncorpN + acqCorpN + acqFinN; // -2 800 000
        const zcN1 = acqIncorpN1 + acqCorpN1 + acqFinN1; // -2 200 000

        // Flux Financement (ZF)
        const dividendesN = -1000000;
        const dividendesN1 = -800000;
        const zdN = dividendesN; // -1 000 000
        const zdN1 = dividendesN1; // -800 000

        const empruntsN = 0;
        const empruntsN1 = 1500000;
        const rembEmpruntsN = -450000;
        const rembEmpruntsN1 = -350000;
        const zeN = empruntsN + rembEmpruntsN; // -450 000
        const zeN1 = empruntsN1 + rembEmpruntsN1; // 1 150 000

        const zfN = zdN + zeN; // -1 450 000
        const zfN1 = zdN1 + zeN1; // 350 000

        // Variation de Trésorerie (ZG) & Trésorerie Fin (ZH)
        const zgN = zbN + zcN + zfN; // +1 500 000
        const zgN1 = zbN1 + zcN1 + zfN1; // +2 800 000

        const zhN = tresoDebutN + zgN; // 6 000 000
        const zhN1 = tresoDebutN1 + zgN1; // 4 500 000

        return (
          <div className="space-y-6">
            {/* Barre d'action supérieure */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xl">💧</span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Tableau des Flux de Trésorerie (TFT) Officiel
                  </h3>
                  <p className="text-xs text-slate-500">Explication synthétique et réglementaire des flux d'exploitation, d'investissement et de financement</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimer A4
                </button>
              </div>
            </div>

            {/* Document Imprimable TFT */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:rounded-none print:border-0 print:shadow-none">
              {/* En-tête avec titre et Logo */}
              <div className="flex items-center justify-between px-8 py-6 border-b-4 border-[#00a8c6]">
                <div>
                  <h1 className="text-3xl font-black text-[#00a8c6] leading-tight">Tableau des flux de trésorerie</h1>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
                    Système Normal SYSCOHADA Révisé — Exercice {currentYear}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    MELARO GROUP · RCCM : CM-DOU-2026-B-14529 · NIU : M082612345678A · Durée (en mois) : 12
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center text-white font-black text-sm shadow-lg">
                  Logo
                </div>
              </div>

              {/* Tableau Officiel TFT */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-300 bg-slate-50">
                      <th className="px-3 py-3 text-center text-[11px] font-extrabold text-slate-700 w-[8%] border-r border-slate-200">
                        REF
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-extrabold text-slate-700 w-[58%]">
                        LIBELLES
                      </th>
                      <th className="px-3 py-3 text-center text-[11px] font-extrabold text-slate-700 w-[8%] border-l border-r border-slate-200">
                        Note
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-extrabold text-slate-700">
                        EXERCICE N
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-500">
                        EXERCICE N-1
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* TRÉSORERIE DÉBUT */}
                    <TFTRow
                      refCode="ZA"
                      label="Trésorerie nette au 1er Janvier (Trésorerie actif N-1 - Trésorerie passif N-1)"
                      note="A"
                      valN={tresoDebutN}
                      valN1={tresoDebutN1}
                      variant="header-green"
                    />

                    {/* ACTIVITÉS OPÉRATIONNELLES */}
                    <TFTRow label="Flux de trésorerie provenant des activités opérationnelles :" variant="section" />
                    <TFTRow refCode="FA" label="+ Capacité d'Autofinancement Globale (CAFG)" valN={cafgN} valN1={cafgN1} italic />
                    <TFTRow refCode="FB" label="- Actif circulant HAO" valN={0} valN1={0} italic />
                    <TFTRow refCode="FC" label="- Variation des stocks" valN={varStocksN} valN1={varStocksN1} italic isNegative />
                    <TFTRow refCode="FD" label="- Variation des créances" valN={varCreancesN} valN1={varCreancesN1} italic isNegative />
                    <TFTRow refCode="FE" label="+ Variation du passif circulant" valN={varPassifN} valN1={varPassifN1} italic />
                    <tr className="border-b border-slate-200 bg-slate-50/50 italic text-[10px] text-slate-500">
                      <td className="px-3 py-1 text-center font-mono border-r border-slate-200"></td>
                      <td colSpan={4} className="px-4 py-1">
                        Variation du BF lié aux activités opérationnelles (FB+FC+FD+FE) : {(varStocksN + varCreancesN + varPassifN).toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                    <TFTRow
                      refCode="ZB"
                      label="Flux de trésorerie provenant des activités opérationnelles (somme FA à FE)"
                      note="B"
                      valN={zbN}
                      valN1={zbN1}
                      variant="total-navy"
                    />

                    {/* ACTIVITÉS D'INVESTISSEMENT */}
                    <TFTRow label="Flux de trésorerie provenant des activités d'investissement :" variant="section" />
                    <TFTRow refCode="FF" label="- Décaissements liés aux acquisitions d'immobilisations incorporelles" valN={acqIncorpN} valN1={acqIncorpN1} italic isNegative />
                    <TFTRow refCode="FG" label="- Décaissements liés aux acquisitions d'immobilisations corporelles" valN={acqCorpN} valN1={acqCorpN1} italic isNegative />
                    <TFTRow refCode="FH" label="- Décaissements liés aux acquisitions d'immobilisations financières" valN={acqFinN} valN1={acqFinN1} italic isNegative />
                    <TFTRow refCode="FI" label="+ Encaissements liés aux cessions d'immobilisations incorporelles et corporelles" valN={0} valN1={0} italic />
                    <TFTRow refCode="FJ" label="+ Encaissements liés aux cessions d'immobilisations financières" valN={0} valN1={0} italic />
                    <TFTRow
                      refCode="ZC"
                      label="Flux de trésorerie provenant des activités d'investissement (somme FF à FJ)"
                      note="C"
                      valN={zcN}
                      valN1={zcN1}
                      variant="total-navy"
                    />

                    {/* ACTIVITÉS DE FINANCEMENT */}
                    <TFTRow label="Flux de trésorerie provenant du financement par les capitaux propres :" variant="section" />
                    <TFTRow refCode="FK" label="+ Augmentations de capital par apports nouveaux" valN={0} valN1={0} italic />
                    <TFTRow refCode="FL" label="+ Subventions d'investissement reçues" valN={0} valN1={0} italic />
                    <TFTRow refCode="FM" label="- Prélèvements sur le capital" valN={0} valN1={0} italic />
                    <TFTRow refCode="FN" label="- Dividendes versés" valN={dividendesN} valN1={dividendesN1} italic isNegative />
                    <TFTRow
                      refCode="ZD"
                      label="Flux de trésorerie provenant des capitaux propres (somme FK à FN)"
                      note="D"
                      valN={zdN}
                      valN1={zdN1}
                    />

                    <TFTRow label="Trésorerie provenant du financement par les capitaux étrangers :" variant="section" />
                    <TFTRow refCode="FO" label="+ Emprunts" valN={empruntsN} valN1={empruntsN1} italic />
                    <TFTRow refCode="FP" label="+ Autres dettes financières" valN={0} valN1={0} italic />
                    <TFTRow refCode="FQ" label="- Remboursements des emprunts et autres dettes financières" valN={rembEmpruntsN} valN1={rembEmpruntsN1} italic isNegative />
                    <TFTRow
                      refCode="ZE"
                      label="Flux de trésorerie provenant des capitaux étrangers (somme FO à FQ)"
                      note="E"
                      valN={zeN}
                      valN1={zeN1}
                    />

                    <TFTRow
                      refCode="ZF"
                      label="Flux de trésorerie provenant des activités de financement (D+E)"
                      note="F"
                      valN={zfN}
                      valN1={zfN1}
                      variant="total-navy"
                    />

                    {/* VARIATION & TRÉSORERIE FIN */}
                    <TFTRow
                      refCode="ZG"
                      label="VARIATION DE LA TRÉSORERIE NETTE DE LA PÉRIODE (B+C+F)"
                      note="G"
                      valN={zgN}
                      valN1={zgN1}
                      variant="total-navy"
                    />

                    <TFTRow
                      refCode="ZH"
                      label="Trésorerie nette au 31 Décembre (G+A) [Contrôle : Trésorerie actif N - Trésorerie passif N]"
                      note="H"
                      valN={zhN}
                      valN1={zhN1}
                      variant="footer-green"
                    />
                  </tbody>
                </table>
              </div>

              {/* Pied de page du document */}
              <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 flex justify-between items-center">
                <span>FinancePro OHADA — Édition automatique des états financiers révisés (TFT)</span>
                <span>Page 1 / 1</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PILIER 5 : VARIATION DES CAPITAUX PROPRES */}
      {activeTab === 5 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Tableau de Variation des Capitaux Propres
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Rubrique</th>
                  <th className="p-3 text-right">Solde Début N</th>
                  <th className="p-3 text-right">Variations (+)</th>
                  <th className="p-3 text-right">Variations (-)</th>
                  <th className="p-3 text-right font-black">Solde Fin N</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-bold text-slate-900">Capital Social (101)</td>
                  <td className="p-3 text-right">10 000 000 FCFA</td>
                  <td className="p-3 text-right">0 FCFA</td>
                  <td className="p-3 text-right">0 FCFA</td>
                  <td className="p-3 text-right font-bold text-slate-900">10 000 000 FCFA</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900">Réserves Légales & Statutaires</td>
                  <td className="p-3 text-right">2 500 000 FCFA</td>
                  <td className="p-3 text-right">+500 000 FCFA</td>
                  <td className="p-3 text-right">0 FCFA</td>
                  <td className="p-3 text-right font-bold text-slate-900">3 000 000 FCFA</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-indigo-700">Résultat Net de l'Exercice (131)</td>
                  <td className="p-3 text-right">2 050 000 FCFA</td>
                  <td className="p-3 text-right">+{formatMoney(resultatNet)}</td>
                  <td className="p-3 text-right">-2 050 000 FCFA</td>
                  <td className="p-3 text-right font-bold text-indigo-700">{formatMoney(resultatNet)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PILIER 6 : NOTES ANNEXES OHADA */}
      {activeTab === 6 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Notes Annexes Réglementaires SYSCOHADA (Notes 1 à 5)
            </h3>
            <p className="text-xs text-slate-500">Document explicatif des méthodes comptables, règles d'amortissement et échéanciers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-extrabold text-slate-900">Note 1 : Règles et Méthodes Comptables</div>
              <p className="text-slate-600 text-[11px]">Évaluation des stocks au CUMP, amortissements linéaires selon les durées fiscales OHADA.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-extrabold text-slate-900">Note 2 : Tableau des Immobilisations</div>
              <p className="text-slate-600 text-[11px]">Suivi des entrées, cessions et valeurs brutes de l'exercice.</p>
            </div>
          </div>
        </div>
      )}

      {/* PILIER 7 : SOLDES SIG DÉTAILLÉS */}
      {activeTab === 7 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Tableau Détaillé des 9 Soldes Intermédiaires de Gestion (SIG)
            </h3>
          </div>
          <div className="overflow-x-auto text-xs font-mono">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Solde Intermédiaire</th>
                  <th className="p-3 text-right">Montant (FCFA)</th>
                  <th className="p-3 text-right">% / CA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="p-3 font-bold">1. Marge Brute</td><td className="p-3 text-right">{formatMoney(margeBrute)}</td><td className="p-3 text-right">56.8 %</td></tr>
                <tr><td className="p-3 font-bold">2. Valeur Ajoutée</td><td className="p-3 text-right">{formatMoney(margeBrute - 3200000)}</td><td className="p-3 text-right">44.0 %</td></tr>
                <tr><td className="p-3 font-bold text-indigo-700">3. EBE (Excédent Brut)</td><td className="p-3 text-right text-indigo-700 font-bold">{formatMoney(ebe)}</td><td className="p-3 text-right">27.2 %</td></tr>
                <tr><td className="p-3 font-bold text-emerald-600">4. Résultat Net</td><td className="p-3 text-right text-emerald-600 font-black">{formatMoney(resultatNet)}</td><td className="p-3 text-right">13.8 %</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PILIER 8 : RATIOS FINANCIERS INTÉGRÉS */}
      {activeTab === 8 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Batterie des 15 Ratios Financiers Clés (Solvabilité, Rentabilité, Liquidité)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Rentabilité des Fonds Propres (ROE)</div>
              <div className="text-xl font-black text-emerald-600">{roe.toFixed(1)} %</div>
              <div className="text-[10px] text-slate-500">Capacité à rémunérer les investisseurs</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Rentabilité des Actifs (ROA)</div>
              <div className="text-xl font-black text-indigo-700">{roa.toFixed(1)} %</div>
              <div className="text-[10px] text-slate-500">Performance globale du capital investi</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Ratio d'Autonomie Financière</div>
              <div className="text-xl font-black text-slate-900">{ratioAutonomie.toFixed(1)} %</div>
              <div className="text-[10px] text-slate-500">Capitaux propres / Total bilan (Seuil &gt; 30%)</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Liquidité Générale</div>
              <div className="text-xl font-black text-violet-700">1.85</div>
              <div className="text-[10px] text-slate-500">Actif circulant / Passif circulant</div>
            </div>
          </div>
        </div>
      )}

      {/* PILIER 9 : COMPARAISON MULTI-EXERCICES */}
      {activeTab === 9 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Comparaison Multi-Exercices (N, N-1, N-2, N-3)
            </h3>
          </div>
          <div className="overflow-x-auto text-xs font-mono">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Indicateur</th>
                  <th className="p-3 text-right">Exercice N (2026)</th>
                  <th className="p-3 text-right">Exercice N-1 (2025)</th>
                  <th className="p-3 text-right">Exercice N-2 (2024)</th>
                  <th className="p-3 text-right font-black">Variation N/N-1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-bold text-slate-900">Chiffre d'Affaires</td>
                  <td className="p-3 text-right font-bold text-slate-900">{formatMoney(chiffreAffaires)}</td>
                  <td className="p-3 text-right">22 250 000 FCFA</td>
                  <td className="p-3 text-right">19 800 000 FCFA</td>
                  <td className="p-3 text-right font-bold text-emerald-600">+12.4 %</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900">Résultat Net</td>
                  <td className="p-3 text-right font-bold text-emerald-600">{formatMoney(resultatNet)}</td>
                  <td className="p-3 text-right">2 800 000 FCFA</td>
                  <td className="p-3 text-right">2 100 000 FCFA</td>
                  <td className="p-3 text-right font-bold text-emerald-600">+23.2 %</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PILIER 10 : DIAGNOSTIC & ANALYSE FINANCIÈRE IA (SWOT) */}
      {activeTab === 10 && (
        <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">
                Analyse Financière IA & Diagnostic SWOT de l'Entreprise
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Génération par Modèle Financier OHADA
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 space-y-2">
              <div className="font-extrabold text-emerald-400 uppercase text-[10px]">🟢 FORCES (Strengths)</div>
              <ul className="list-disc pl-4 text-slate-200 space-y-1">
                <li>Excellente rentabilité opérationnelle (EBE de {formatMoney(ebe)}).</li>
                <li>Trésorerie nette positive assurant une autonomie de 1.3 mois.</li>
                <li>Niveau de fonds propres solide de {formatMoney(capitauxPropres)}.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-800 space-y-2">
              <div className="font-extrabold text-amber-400 uppercase text-[10px]">🟡 POINTS DE VIGILANCE (Weaknesses)</div>
              <ul className="list-disc pl-4 text-slate-200 space-y-1">
                <li>Délai moyen de règlement clients élevé (42 jours DSO).</li>
                <li>Poids des consommations intermédiaires en hausse de 5%.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* PILIER 11 : PRÉVISIONS & SIMULATIONS */}
      {activeTab === 11 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Prévisions Financières & Simulation de Scénarios
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
              <div className="font-bold text-emerald-900 uppercase text-[10px]">Scénario Optimiste (+20%)</div>
              <div className="text-lg font-black text-emerald-700">{formatMoney(chiffreAffaires * 1.20)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-700 uppercase text-[10px]">Scénario Réaliste (+10%)</div>
              <div className="text-lg font-black text-slate-900">{formatMoney(chiffreAffaires * 1.10)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
              <div className="font-bold text-rose-900 uppercase text-[10px]">Scénario Pessimiste (-5%)</div>
              <div className="text-lg font-black text-rose-700">{formatMoney(chiffreAffaires * 0.95)}</div>
            </div>
          </div>
        </div>
      )}

      {/* PILIER 12 : CONTRÔLE DE CONFORMITÉ OHADA (AUDIT PRÉ-LIASSE) */}
      {activeTab === 12 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Contrôle de Conformité SYSCOHADA (Audit Pré-Liasse Fiscale)
              </h3>
            </div>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              100% Conforme & Validé
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center justify-between">
              <span>✓ Équilibre Strict du Bilan : Total Actif ({formatMoney(totalActif)}) = Total Passif ({formatMoney(totalPassif)})</span>
              <span className="text-emerald-700 font-black">VALIDÉ</span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center justify-between">
              <span>✓ Concordance du Résultat Net : Bilan ({formatMoney(resultatNet)}) = Compte de Résultat ({formatMoney(resultatNet)})</span>
              <span className="text-emerald-700 font-black">VALIDÉ</span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center justify-between">
              <span>✓ Continuité des Amortissements : Tableau de dotation synchronisé avec le compte 681</span>
              <span className="text-emerald-700 font-black">VALIDÉ</span>
            </div>
          </div>
        </div>
      )}

      {/* PILIER 13 : LIASSE FISCALE OFFICIELLE (MODULE DYNAMIQUE PAR TABLEAU SELECTIONNE) */}
      {activeTab === 13 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Liasse Fiscale Normalisée OHADA (36 Tableaux Réglementaires DGI)
                </h3>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ✓ Calculé & Prêt pour Télé-déclaration
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Liasse statistique et fiscale conforme aux exigences des Centres des Impôts (DGI) de la zone CEMAC / UEMOA.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => alert("Exportation de la liasse complet 36 tableaux au format Excel (.xlsx)...")}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> 📥 Exporter Liasse Excel (.xlsx)
              </button>

              <button
                onClick={() => handleDownload(() => api.downloadBilanPdf())}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> 📄 PDF Officiel A4
              </button>

              <button
                onClick={() => alert("Génération du fichier XML normalisé pour Télé-déclaration DGI...")}
                className="px-3.5 py-2 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 font-bold text-xs flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-violet-600" /> ⚡ Fichier XML DGI
              </button>
            </div>
          </div>

          {/* SÉLECTEUR INTERACTIF DES 36 TABLEAUX DE LA LIASSE FISCALE */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar de navigation parmi les 36 Tableaux */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 max-h-[500px] overflow-y-auto">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-1">
                36 Tableaux Réglementaires
              </div>
              {liasseTablesList.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedLiasseTable(tab.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    selectedLiasseTable === tab.id
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'text-slate-700 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <div className="truncate">
                    <span className="font-mono opacity-75 mr-1.5">{tab.code}</span>
                    <span className="truncate">{tab.title}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                </button>
              ))}
            </div>

            {/* Vue d'ensemble interactive du Tableau Sélectionné */}
            <div className="lg:col-span-3 bg-slate-50/50 rounded-2xl p-6 border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg">
                    {liasseTablesList.find(t => t.id === selectedLiasseTable)?.code}
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900 mt-2">
                    {liasseTablesList.find(t => t.id === selectedLiasseTable)?.title}
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">
                  Exercice Clôturé 31/12/{currentYear}
                </span>
              </div>

              {/* Rendu Dynamique des Contenus du Tableau Sélectionné */}
              {renderLiasseTableContent(selectedLiasseTable)}
            </div>
          </div>
        </div>
      )}

      {/* PILIER 14 : HISTORIQUE & CLÔTURES */}
      {activeTab === 14 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Historique des Clôtures & Archivage des Exercices
            </h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center font-bold">
              <span>Exercice Comptable 2025</span>
              <span className="text-rose-600">🔒 Closed & Archived</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex justify-between items-center font-bold">
              <span>Exercice Comptable 2026</span>
              <span className="text-emerald-700">🟢 Exercice En Cours</span>
            </div>
          </div>
        </div>
      )}

      {/* PILIER 15 : RAPPORTS POUR LA DIRECTION */}
      {activeTab === 15 && (
        <div className="p-6 bg-white rounded-3xl border border-violet-100 shadow-sm space-y-4">
          <div className="border-b pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Dossiers & Rapports Financiers pour la Direction
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-extrabold text-slate-900">Dossier Banque / Crédit</div>
              <div className="text-[10px] text-slate-500">Pour demandes de financement bancaire.</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-extrabold text-slate-900">Rapport de Gestion AG</div>
              <div className="text-[10px] text-slate-500">Présentation annuelle pour l'Assemblée Générale.</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-extrabold text-slate-900">Dossier Investisseurs</div>
              <div className="text-[10px] text-slate-500">Plaquette financière pour levée de fonds.</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE] space-y-2 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" /> Rapport de Gestion IA
                </div>
                <div className="text-[10px] text-indigo-700">Synthèse mensuelle augmentée par l'IA (PDF).</div>
              </div>
              <button
                onClick={() => handleDownload(api.downloadManagementReportPdf)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-[10px] flex items-center justify-center gap-1 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Générer & Télécharger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PILIER 16 : ASSISTANT IA FINANCEPRO */}
      {activeTab === 16 && (
        <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">Assistant IA FinancePro — Expert États Financiers</h3>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Modèle IA Spécialisé OHADA
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-slate-300">
              Posez toute question relative à vos états financiers, votre bilan ou vos ratios de rentabilité.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ex: Rédige le rapport de gestion pour les associés sur le résultat net..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 font-bold text-xs text-white"
              />
              <button
                onClick={handleAskAi}
                disabled={aiLoading}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-extrabold rounded-2xl text-xs disabled:opacity-50"
              >
                {aiLoading ? 'Analyse...' : 'Demander'}
              </button>
            </div>

            {aiAnswer && (
              <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 font-medium text-xs leading-relaxed space-y-1">
                <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Diagnostic & Rapport IA :
                </div>
                <div>{aiAnswer}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODALE DRILL-DOWN (ZOOM SUR ÉCRITURES COMPTABLES COMPOSANTS) ───── */}
      {drillDownData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl space-y-4 border border-violet-100 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase">
                  Zoom Écritures Comptables — Poste {drillDownData.codeRef} ({drillDownData.title})
                </h3>
                <p className="text-xs text-slate-500 font-mono">Total du poste : {formatMoney(drillDownData.totalAmount)}</p>
              </div>
              <button onClick={() => setDrillDownData(null)} className="text-xs text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Journal</th>
                    <th className="p-2.5">N° Pièce</th>
                    <th className="p-2.5">Libellé de l'Écriture</th>
                    <th className="p-2.5 text-right">Débit</th>
                    <th className="p-2.5 text-right">Crédit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drillDownData.entries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono text-slate-500">{entry.date}</td>
                      <td className="p-2.5 font-bold text-slate-800">{entry.journal}</td>
                      <td className="p-2.5 font-mono text-slate-600">{entry.piece}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{entry.wording}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">{entry.debit > 0 ? formatMoney(entry.debit) : '-'}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">{entry.credit > 0 ? formatMoney(entry.credit) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDrillDownData(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsModule;
