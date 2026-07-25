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
  Globe,
  Calculator,
  Grid,
  Award,
  ChevronRight,
  Sparkles,
  Phone,
  Mail,
  Check
} from 'lucide-react';

interface LandingPageProps {
  onLaunchApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      
      {/* SECTION 1: Deep Royal Blue Hero Header Banner (Identical to Image 1 Banner) */}
      <section className="relative bg-gradient-to-b from-[#0a1b3a] via-[#0d234b] to-[#0f2d5e] text-white pt-6 pb-24 lg:pb-36 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle Fluid Wave Pattern Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400 via-indigo-600 to-transparent" />
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Top Navbar */}
          <header className="flex items-center justify-between py-4 border-b border-blue-800/40">
            <div className="flex items-center gap-3 cursor-pointer" onClick={onLaunchApp}>
              <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
                <Building2 className="w-5 h-5 text-blue-200" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">FinancePro <span className="text-blue-300 font-normal">OHADA</span></span>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-blue-100/90">
              <a href="#about" className="hover:text-white transition-colors">Accueil</a>
              <a href="#about" className="hover:text-white transition-colors">À Propos</a>
              <a href="#services" className="hover:text-white transition-colors">Services & Modules</a>
              <a href="#security" className="hover:text-white transition-colors">Rôles & Sécurité</a>
              <a href="#excellence" className="hover:text-white transition-colors">Excellence</a>
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={onLaunchApp}
                className="text-xs font-semibold text-blue-100 hover:text-white px-4 py-2 rounded-lg transition-colors hidden sm:block"
              >
                Se connecter
              </button>
              <button
                onClick={onLaunchApp}
                className="px-5 py-2.5 rounded-full font-semibold text-xs text-slate-900 bg-white hover:bg-blue-50 transition-all shadow-md flex items-center gap-2 group"
              >
                <span>Accéder au SaaS</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-900 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </header>

          {/* Hero Content (Identical to Image 1 Hero Title & Button Layout) */}
          <div className="pt-16 lg:pt-24 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-medium backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Logiciel comptable & financier conforme SYSCOHADA Révisé</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-normal tracking-tight text-white leading-[1.12]">
              Professional accounting support and tax planning for your business
            </h1>

            <p className="text-base sm:text-lg text-blue-100/80 max-w-2xl font-light leading-relaxed">
              Une plateforme SaaS complète de comptabilité générale, de facturation avec TVA & AIR, de suivi de trésorerie et de contrôle budgétaire pour les PME et cabinets de la zone OHADA.
            </p>

            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={onLaunchApp}
                className="px-6 py-3.5 rounded-full font-semibold text-xs text-slate-950 bg-white hover:bg-blue-50 transition-all shadow-xl flex items-center gap-2 group"
              >
                <span>Demander une démo</span>
                <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onLaunchApp}
                className="px-6 py-3.5 rounded-full font-medium text-xs text-white border border-white/20 hover:bg-white/10 transition-colors backdrop-blur-sm"
              >
                Essai gratuit 14 jours
              </button>
            </div>

            <div className="pt-8 flex items-center justify-between text-xs text-blue-300/70 border-t border-blue-800/40">
              <span>Depuis 2026</span>
              <span>Défiler vers le bas ↓</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: About / White Corporate Section with Stats & Photo Card (Identical to Image 2 Section) */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">À PROPOS</span>
          </div>
          <button onClick={onLaunchApp} className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1">
            Voir plus <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-950 leading-tight">
              We don't just handle accounting – we help your business grow!
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              FinancePro OHADA est conçu par des experts comptables et financiers de la zone OHADA. Notre logiciel SaaS automatise les tâches complexes (validation Débit/Crédit, calculs de précomptes fiscaux, génération du Bilan et du Compte de résultat) pour permettre aux dirigeants et cabinets de se concentrer sur l'essentiel : la croissance de leur activité.
            </p>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-6 pt-2">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-950">17+</div>
              <div className="text-xs text-slate-500 font-medium mt-1">pays membres OHADA couverts</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-950">99,8%</div>
              <div className="text-xs text-slate-500 font-medium mt-1">rapports sans erreur & conformes</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-950">500+</div>
              <div className="text-xs text-slate-500 font-medium mt-1">entreprises & cabinets utilisateurs</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-950">100%</div>
              <div className="text-xs text-slate-500 font-medium mt-1">états financiers en temps réel</div>
            </div>
          </div>
        </div>

        {/* Featured Image Card (Matching Calculator & Laptop Photo Card in Image) */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-200">
          <div className="relative h-72 sm:h-96 w-full bg-gradient-to-r from-blue-900 via-slate-800 to-indigo-950 flex items-center justify-between p-8 sm:p-12 text-white">
            <div className="max-w-xl space-y-4 relative z-10">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-semibold border border-blue-400/30">SYSCOHADA Révisé 2026</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                Saisie comptable guidée et équilibre Débit = Crédit instantané
              </h3>
              <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
                Toutes les écritures au Journal Général, au Grand Livre et à la Balance à 6 colonnes sont contrôlées pour garantir des états financiers irréprochables.
              </p>
              <button onClick={onLaunchApp} className="px-5 py-2.5 rounded-lg bg-white text-slate-950 font-semibold text-xs hover:bg-blue-50 transition-colors">
                Tester la saisie comptable →
              </button>
            </div>

            {/* Graphic Calculator Badge Overlay */}
            <div className="hidden md:flex flex-col items-center justify-center p-6 rounded-xl bg-blue-800/90 border border-blue-700/80 backdrop-blur-md shadow-2xl font-mono text-center space-y-2">
              <Calculator className="w-8 h-8 text-blue-200" />
              <div className="text-lg font-bold text-white">SYSCOHADA</div>
              <div className="text-xs text-blue-200">Classes 1 à 8</div>
              <div className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded">Équilibré 0 XAF</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Services / 4-Card Vertical Grid (Matching Image 3 Cards Pattern) */}
      <section id="services" className="py-20 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">SERVICES & MODULES</span>
            </div>
            <button onClick={onLaunchApp} className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1">
              Voir tous les modules <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <h2 className="text-3xl sm:text-4xl font-semibold text-slate-950 mb-12 max-w-2xl">
            Provide comprehensive accounting support for businesses of any scale
          </h2>

          {/* 4 Cards Grid with Alternating Deep Blue and Soft Ice Blue Styling (Matching Image 3 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Deep Blue Card */}
            <div className="rounded-2xl bg-[#0f2d5e] text-white p-6 shadow-xl flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-800/80 border border-blue-700 flex items-center justify-center mb-6">
                  <FileText className="w-5 h-5 text-blue-200" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Comptabilité Général / SYSCOHADA</h3>
                <p className="text-xs text-blue-100/80 leading-relaxed mb-6">
                  Saisie à double entrée, Journal Général, Grand Livre filtrable, Balance 6 colonnes et Bilan/Compte de résultat automatisés.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-blue-200 border-t border-blue-800/80 pt-4 font-light">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-300" /> Saisie double entrée réactive</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-300" /> Bilan Actif/Passif équilibré</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-300" /> Compte de résultat (SIG)</li>
              </ul>
            </div>

            {/* Card 2: Soft Ice Blue Card */}
            <div className="rounded-2xl bg-blue-50/80 text-slate-900 border border-blue-100 p-6 shadow-md flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-10 h-10 rounded-lg bg-white border border-blue-200 flex items-center justify-center mb-6 shadow-sm">
                  <Receipt className="w-5 h-5 text-blue-700" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 mb-2">Facturation & TVA / Retenues AIR</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  Gestion des factures Ventes & Achats avec calcul automatique de la TVA 18% et des retenues fiscales AIR (2% et 5%).
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 border-t border-blue-200/60 pt-4 font-light">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-600" /> Calcul automatique TVA 18%</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-600" /> Retenues AIR (2% & 5%)</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-600" /> Écritures comptables auto</li>
              </ul>
            </div>

            {/* Card 3: Deep Blue Card */}
            <div className="rounded-2xl bg-[#0f2d5e] text-white p-6 shadow-xl flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-800/80 border border-blue-700 flex items-center justify-center mb-6">
                  <Wallet className="w-5 h-5 text-blue-200" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Trésorerie / Banques & Caisses</h3>
                <p className="text-xs text-blue-100/80 leading-relaxed mb-6">
                  Pilotage en temps réel des comptes Banques (521), Caisses (541) et Mobile Money (571) avec suivi du besoin en fonds de roulement.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-blue-200 border-t border-blue-800/80 pt-4 font-light">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-300" /> Comptes 521, 541, 571</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-300" /> Rapprochement bancaire</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-300" /> Indicateurs BFR & FDR</li>
              </ul>
            </div>

            {/* Card 4: Soft Ice Blue Card */}
            <div className="rounded-2xl bg-blue-50/80 text-slate-900 border border-blue-100 p-6 shadow-md flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-10 h-10 rounded-lg bg-white border border-blue-200 flex items-center justify-center mb-6 shadow-sm">
                  <PieChart className="w-5 h-5 text-blue-700" />
                </div>
                <h3 className="text-lg font-bold text-slate-950 mb-2">Budget & Sécurité RBAC</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  Élaboration des budgets prévisionnels, contrôle des écarts et matrice de rôles (Admin, Comptable, Gestionnaire, Lecteur).
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 border-t border-blue-200/60 pt-4 font-light">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-600" /> Suivi des écarts budgétaires</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-600" /> Rôles RBAC personnalisés</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-600" /> Piste d'audit & journal des logs</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 4: Excellence / Office Environment Photo with Floating Badges (Identical to Image 4 Section) */}
      <section id="excellence" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">EXCELLENCE & SÉCURITÉ</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-semibold text-slate-950 mb-10 max-w-2xl">
          Une plateforme SaaS moderne taillée pour la rigueur des cabinets comptables
        </h2>

        {/* Photo Card with Floating Info Badges (Matching Image 4) */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-8 sm:p-14 min-h-[420px] flex items-center justify-center">
          
          {/* Subtle Background Office Image Accent */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950/80 to-slate-950" />

          {/* Floating Info Badges Grid (Identical Layout to Badges in Image 4) */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl w-full">
            
            {/* Badge 1 */}
            <div className="bg-white/95 text-slate-900 p-5 rounded-2xl shadow-xl backdrop-blur-md border border-white/20 hover:scale-[1.02] transition-transform">
              <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Automatisation OHADA</div>
              <p className="text-xs sm:text-sm font-medium text-slate-800">
                "Nous utilisons un système comptable automatisé et sécurisé pour un échange rapide et fiable de tous vos documents financiers."
              </p>
            </div>

            {/* Badge 2 */}
            <div className="bg-white/95 text-slate-900 p-5 rounded-2xl shadow-xl backdrop-blur-md border border-white/20 hover:scale-[1.02] transition-transform">
              <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Optimisation Fiscale</div>
              <p className="text-xs sm:text-sm font-medium text-slate-800">
                "Nous analysons les spécificités de votre activité et proposons des solutions financières optimales pour réduire les coûts et les taxes."
              </p>
            </div>

            {/* Badge 3 */}
            <div className="bg-white/95 text-slate-900 p-5 rounded-2xl shadow-xl backdrop-blur-md border border-white/20 hover:scale-[1.02] transition-transform">
              <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Protection des Données</div>
              <p className="text-xs sm:text-sm font-medium text-slate-800">
                "Vos données financières sont protégées conformément aux normes internationales de sécurité informatique et d'audit."
              </p>
            </div>

            {/* Badge 4 */}
            <div className="bg-white/95 text-slate-900 p-5 rounded-2xl shadow-xl backdrop-blur-md border border-white/20 hover:scale-[1.02] transition-transform">
              <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Support Dédié 24/7</div>
              <p className="text-xs sm:text-sm font-medium text-slate-800">
                "Disponible 24h/24 et 7j/7, notre équipe d'experts répond rapidement à vos demandes et fournit des conseils comptables professionnels."
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 5: Call to Action Banner & Footer */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Prêt à tester la puissance de FinancePro OHADA ?
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Créez votre compte en quelques secondes et accédez à tous les modules de comptabilité générale, facturation, trésorerie et budget.
          </p>
          <div className="pt-2">
            <button
              onClick={onLaunchApp}
              className="px-8 py-3.5 rounded-full font-bold text-xs text-slate-950 bg-white hover:bg-blue-50 transition-all shadow-xl inline-flex items-center gap-2"
            >
              <span>Démarrer maintenant</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-10 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-900 flex items-center justify-center text-white font-bold">
              FP
            </div>
            <span className="font-bold text-white text-sm">FinancePro OHADA</span>
            <span>— Solution Comptable & Financière SaaS</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <a href="#about" className="hover:text-white transition-colors">À propos</a>
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#excellence" className="hover:text-white transition-colors">Sécurité</a>
            <button onClick={onLaunchApp} className="hover:text-white transition-colors">Connexion SaaS</button>
          </div>

          <div>
            © {new Date().getFullYear()} FinancePro OHADA. Tous droits réservés. Conforme SYSCOHADA Révisé.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
