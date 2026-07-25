import React, { useState } from 'react';
import { 
  Building2, 
  Shield, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  FileText, 
  Receipt, 
  Wallet, 
  PieChart, 
  Users, 
  Lock, 
  TrendingUp, 
  Globe2, 
  Award,
  Sparkles,
  ChevronRight,
  Download,
  Database,
  Layers,
  BarChart3
} from 'lucide-react';

interface LandingPageProps {
  onLaunchApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  const [activeTab, setActiveTab] = useState<'syscohada' | 'rbac' | 'invoicing'>('syscohada');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      {/* Background Decorative Gradient Orbs */}
      <div className="fixed top-0 left-1/4 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-1/3 right-10 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onLaunchApp}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                FinancePro
              </span>
              <span className="ml-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                OHADA
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Fonctionnalités</a>
            <a href="#syscohada" className="hover:text-emerald-400 transition-colors">SYSCOHADA Révisé</a>
            <a href="#security" className="hover:text-emerald-400 transition-colors">Sécurité & RBAC</a>
            <a href="#stats" className="hover:text-emerald-400 transition-colors">Conformité</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={onLaunchApp}
              className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-xl transition-colors hidden sm:block"
            >
              Connexion
            </button>
            <button
              onClick={onLaunchApp}
              className="relative group px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 flex items-center gap-2"
            >
              <span>Accéder au SaaS</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Logiciel SaaS de Gestion Financière Conforme OHADA</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            La comptabilité <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">SYSCOHADA</span>, enfin numérique et fiable
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Solution complète SaaS conçue pour les PME et cabinets comptables de la zone OHADA.
            Saisie double entrée avec validation d'équilibre en temps réel, facturation avec retenues fiscales (TVA & AIR), et génération automatisée du Bilan et du Compte de Résultat.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onLaunchApp}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all duration-200 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 group"
            >
              <span>Essai gratuit 14 jours</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onLaunchApp}
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-base text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Voir la démo interactive</span>
            </button>
          </div>
        </div>

        {/* Hero Glassmorphic App Interface Preview */}
        <div className="mt-16 relative mx-auto max-w-5xl">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
          <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
            {/* Mock Top Window Controls */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-medium text-slate-400">FinancePro OHADA — Aperçu Saisie & États Financiers</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Exercice 2026 Ouvert (XAF)</span>
              </div>
            </div>

            {/* Mock Dashboard Hero Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium">Chiffre d'Affaires Mensuel</div>
                <div className="text-2xl font-bold text-white mt-1">42 500 000 XAF</div>
                <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> +14.8% vs mois dernier
                </div>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium">Trésorerie Nette Disponible</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">75 900 000 XAF</div>
                <div className="text-xs text-slate-400 mt-1">Comptes 521 (BGFI) & 541 (Caisse)</div>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium">Équilibre Saisie Débit = Crédit</div>
                <div className="text-2xl font-bold text-teal-300 mt-1">100% Équilibré</div>
                <div className="text-xs text-emerald-400 mt-1">Écart Débit/Crédit = 0 XAF</div>
              </div>
            </div>

            {/* Mock Table Journal Preview */}
            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs font-mono overflow-x-auto">
              <div className="text-slate-400 font-sans font-semibold mb-3 flex items-center justify-between">
                <span>Dernières écritures au Journal Général SYSCOHADA</span>
                <span className="text-emerald-400 text-xs">Conforme Arrêté 2017</span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800 pb-2">
                    <th className="pb-2">N° Pièce</th>
                    <th className="pb-2">Compte</th>
                    <th className="pb-2">Libellé du Compte</th>
                    <th className="pb-2 text-right">Débit (XAF)</th>
                    <th className="pb-2 text-right">Crédit (XAF)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  <tr>
                    <td className="py-2 text-emerald-400">VT-2026-001</td>
                    <td>411100</td>
                    <td>Clients, Ventes de biens</td>
                    <td className="text-right text-emerald-400 font-bold">11 800 000</td>
                    <td className="text-right text-slate-600">0</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-emerald-400">VT-2026-001</td>
                    <td>701100</td>
                    <td>Ventes de marchandises</td>
                    <td className="text-right text-slate-600">0</td>
                    <td className="text-right text-emerald-400 font-bold">10 000 000</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-emerald-400">VT-2026-001</td>
                    <td>443100</td>
                    <td>État, TVA facturée sur ventes (18%)</td>
                    <td className="text-right text-slate-600">0</td>
                    <td className="text-right text-emerald-400 font-bold">1 800 000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Key Metrics Band (Inspired by User Image Section 2) */}
      <section id="stats" className="border-y border-slate-800 bg-slate-900/40 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Confiance & Performance</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">Conçu spécifiquement pour les exigences comptables de la zone OHADA</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 transition-colors">
              <div className="text-4xl font-extrabold text-white tracking-tight">17+</div>
              <div className="text-sm font-semibold text-emerald-400 mt-2">Pays membres OHADA</div>
              <div className="text-xs text-slate-400 mt-1">UEMOA, CEMAC & Comores</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 transition-colors">
              <div className="text-4xl font-extrabold text-emerald-400 tracking-tight">100%</div>
              <div className="text-sm font-semibold text-slate-200 mt-2">Conforme SYSCOHADA Révisé</div>
              <div className="text-xs text-slate-400 mt-1">Classes 1 à 8 respectées</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 transition-colors">
              <div className="text-4xl font-extrabold text-white tracking-tight">50 000+</div>
              <div className="text-sm font-semibold text-emerald-400 mt-2">Écritures sans erreur</div>
              <div className="text-xs text-slate-400 mt-1">Contrôle Débit = Crédit en temps réel</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 transition-colors">
              <div className="text-4xl font-extrabold text-emerald-400 tracking-tight">4 Rôles</div>
              <div className="text-sm font-semibold text-slate-200 mt-2">Sécurité RBAC Granulaire</div>
              <div className="text-xs text-slate-400 mt-1">Admin, Comptable, Gestionnaire, Lecteur</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Feature Cards Grid (Matching the exact 4 vertical card pattern from User Image) */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Architecture Modulaire</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Une suite comptable & financière complète pour votre entreprise</h2>
          <p className="text-slate-400 text-base">
            Profitez de modules interconnectés pour gérer la saisie, les déclarations fiscales et l'analyse de gestion sans rupture de données.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="group relative rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between hover:border-emerald-500/50 hover:bg-slate-900 transition-all duration-300 shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Comptabilité Générale SYSCOHADA</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Saisie double entrée guidée, Journal Général séquentiel, Grand Livre filtrable par compte et Balance Générale à 6 colonnes.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bilan Actif & Passif automatisé</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Compte de Résultat (SIG)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tableau des Flux de Trésorerie (TFT)</span>
              </li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="group relative rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between hover:border-emerald-500/50 hover:bg-slate-900 transition-all duration-300 shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Receipt className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Facturation & Fiscalité TVA/AIR</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Émission de factures de vente et d'achat aux normes locales avec calcul instantané de la TVA (18%) et précomptes AIR.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Calcul automatique des AIR (2% & 5%)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Génération automatique des journaux</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Suivi des échéances de règlement</span>
              </li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="group relative rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between hover:border-emerald-500/50 hover:bg-slate-900 transition-all duration-300 shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Trésorerie Multi-Comptes</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Pilotage centralisé des comptes Banques (521), Caisses (541) et Mobile Money (571) avec suivi du besoin en fonds de roulement (BFR).
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Rapprochement bancaire simplifié</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Mouvements d'encaissement/décaissement</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Indicateurs FDR & BFR temps réel</span>
              </li>
            </ul>
          </div>

          {/* Card 4 */}
          <div className="group relative rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between hover:border-emerald-500/50 hover:bg-slate-900 transition-all duration-300 shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PieChart className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Budget & Suivi des Écarts</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Élaboration des budgets prévisionnels par poste comptable et suivi automatique des variances pour anticiper les dépassements.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Comparatif Réalisé vs Prévisionnel</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Calcul automatique des écarts (%)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Rapports décisionnels exportables</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SYSCOHADA Interactive Section */}
      <section id="syscohada" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Plan Comptable Général</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Toutes les classes SYSCOHADA (1 à 8) pré-paramétrées
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Ne perdez plus de temps à configurer votre plan comptable. FinancePro OHADA intègre la nomenclature officielle révisée avec recherche rapide et affectation automatique des comptes auxiliaires.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h4 className="text-sm font-bold text-white">Capitaux Propres & Ressources Durables (Classe 1)</h4>
                  <p className="text-xs text-slate-400">Capital 101, Réserves 111, Report à nouveau 121, Emprunts 162</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0">4</div>
                <div>
                  <h4 className="text-sm font-bold text-white">Comptes de Tiers (Classe 4)</h4>
                  <p className="text-xs text-slate-400">Fournisseurs 401, Clients 411, Personnel 422, État TVA 443/445, AIR 447</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold shrink-0">5</div>
                <div>
                  <h4 className="text-sm font-bold text-white">Comptes de Trésorerie (Classe 5)</h4>
                  <p className="text-xs text-slate-400">Banques locales 521, Caisses 541, Mobile Money 571, Régies d'avances 585</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <span className="text-sm font-bold text-white">Nomenclature SYSCOHADA Révisée</span>
                <span className="text-xs text-emerald-400 font-mono">100% Officiel</span>
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="text-emerald-400 font-bold">101000</span>
                  <span className="text-slate-300">Capital Social Souscrit</span>
                  <span className="text-slate-500">Classe 1</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="text-emerald-400 font-bold">411100</span>
                  <span className="text-slate-300">Clients, Ventes de Biens & Services</span>
                  <span className="text-slate-500">Classe 4</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="text-emerald-400 font-bold">443100</span>
                  <span className="text-slate-300">État, TVA Facturée sur Ventes (18%)</span>
                  <span className="text-slate-500">Classe 4</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="text-emerald-400 font-bold">521100</span>
                  <span className="text-slate-300">Banques Locales (BGFI / Ecobank)</span>
                  <span className="text-slate-500">Classe 5</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="text-emerald-400 font-bold">601100</span>
                  <span className="text-slate-300">Achats de Marchandises</span>
                  <span className="text-slate-500">Classe 6</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="text-emerald-400 font-bold">701100</span>
                  <span className="text-slate-300">Ventes de Marchandises</span>
                  <span className="text-slate-500">Classe 7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & RBAC Section (Inspired by Section 4 in Image) */}
      <section id="security" className="py-24 bg-slate-900/50 border-t border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Contrôle d'Accès & Piste d'Audit</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Gestion des Rôles (RBAC) & Sécurité Multi-Collaborateurs</h2>
            <p className="text-slate-400 text-base">
              Protéger vos données financières est notre priorité. Attribuez les permissions exactes à vos collaborateurs et auditeurs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                ADMIN
              </div>
              <h3 className="text-lg font-bold text-white">Administrateur</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Accès complet à la configuration entreprise (RCCM/NIF), clôture des exercices, création d'utilisateurs et piste d'audit.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                COMPT
              </div>
              <h3 className="text-lg font-bold text-white">Comptable</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Saisie des écritures, génération du Grand Livre et de la Balance, validation des états financiers et clôture mensuelle.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                GEST
              </div>
              <h3 className="text-lg font-bold text-white">Gestionnaire</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Émission des factures clients, saisie des règlements de trésorerie courante et suivi des budgets de fonctionnement.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                LECT
              </div>
              <h3 className="text-lg font-bold text-white">Lecteur / Auditeur</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Accès strict en lecture seule pour commissaires aux comptes, direction générale et associés. Export PDF/Excel sécurisé.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 p-8 sm:p-12 text-center overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Prêt à moderniser la comptabilité de votre entreprise ?
            </h2>
            <p className="text-slate-300 text-base">
              Rejoignez les PME et cabinets qui font confiance à FinancePro OHADA pour piloter leur gestion financière avec rigueur et conformité.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onLaunchApp}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <span>Accéder à l'application SaaS</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="font-bold text-white text-sm">FinancePro OHADA</span>
            <span>— Logiciel de Comptabilité & Gestion SaaS</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-slate-300 transition-colors">Fonctionnalités</a>
            <a href="#syscohada" className="hover:text-slate-300 transition-colors">SYSCOHADA</a>
            <a href="#security" className="hover:text-slate-300 transition-colors">Sécurité</a>
            <button onClick={onLaunchApp} className="hover:text-emerald-400 transition-colors">Application</button>
          </div>

          <div>
            © {new Date().getFullYear()} FinancePro OHADA. Conforme aux normes de l'Arrêté Ministériel OHADA.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
