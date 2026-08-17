import React, { useState } from 'react';
import { 
  Building2, 
  Shield, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Receipt, 
  Wallet, 
  PieChart, 
  Users, 
  Lock, 
  TrendingUp, 
  Globe,
  Calculator,
  ChevronRight,
  Sparkles,
  Check,
  BarChart3,
  ShieldCheck,
  Zap,
  Layers,
  Cpu,
  Target,
  Briefcase,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  FileCheck2,
  Database,
  CheckCircle,
  Clock,
  Sliders,
  DollarSign,
  Play,
  HelpCircle,
  Star,
  ChevronDown,
  Menu,
  X,
  FileSpreadsheet,
  TrendingDown,
  UserCheck,
  History,
  LockKeyhole,
  Award,
  Layers2
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onSignup }) => {
  // Mobile Navigation Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // State for hero laptop dashboard tab
  const [activeCockpitTab, setActiveCockpitTab] = useState<'dashboard' | 'accounting' | 'treasury' | 'analysis'>('dashboard');

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      
      {/* HEADER NAVIGATION NAVBAR (Sticky Desktop & Responsive Mobile) */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 flex items-center">
              FinancePro<span className="text-blue-600 font-black text-3xl leading-none">.</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-blue-700 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 hidden sm:inline">
              OHADA
            </span>
          </div>

          {/* Nav Links Desktop */}
          <nav className="hidden lg:flex items-center gap-9 text-sm font-semibold text-slate-600">
            <a href="#hero" className="hover:text-blue-600 transition-colors">Produit</a>
            <a href="#ohada" className="hover:text-blue-600 transition-colors">Solutions</a>
            <a href="#modules" className="hover:text-blue-600 transition-colors">Fonctionnalités</a>
            <a href="#tarifs" className="hover:text-blue-600 transition-colors">Tarifs</a>
            <a href="#pourquoi" className="hover:text-blue-600 transition-colors">Ressources</a>
          </nav>

          {/* Header Actions Desktop */}
          <div className="hidden lg:flex items-center gap-5">
            <button
              onClick={onLogin}
              className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Se connecter</span>
            </button>

            <button
              onClick={onSignup}
              className="px-6 py-3 rounded-full font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/25 flex items-center gap-2 group tracking-wider uppercase"
            >
              <span>Commencer gratuitement</span>
              <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-6 space-y-4 shadow-xl text-left">
            <nav className="flex flex-col space-y-3 font-semibold text-sm text-slate-700">
              <a href="#hero" onClick={() => setIsMobileMenuOpen(false)}>Produit</a>
              <a href="#ohada" onClick={() => setIsMobileMenuOpen(false)}>Solutions</a>
              <a href="#modules" onClick={() => setIsMobileMenuOpen(false)}>Fonctionnalités</a>
              <a href="#tarifs" onClick={() => setIsMobileMenuOpen(false)}>Tarifs</a>
              <a href="#pourquoi" onClick={() => setIsMobileMenuOpen(false)}>Ressources</a>
            </nav>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <button onClick={() => { setIsMobileMenuOpen(false); onLogin(); }} className="w-full py-2.5 text-center font-bold text-sm text-slate-700 border border-slate-200 rounded-xl">
                Se connecter
              </button>
              <button onClick={() => { setIsMobileMenuOpen(false); onSignup(); }} className="w-full py-3 text-center font-bold text-xs text-white bg-blue-600 rounded-full shadow-md uppercase tracking-wider">
                Commencer gratuitement
              </button>
            </div>
          </div>
        )}
      </header>

      {/* SECTION 1: HERO (Conteneur Élargi XXL 1400px - Title & Dashboard Star) */}
      <section id="hero" className="relative pt-10 pb-20 lg:pt-16 lg:pb-28 px-4 sm:px-8 lg:px-12 overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-[#fafafa]">
        
        {/* Glow Spheres */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-400/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-[1400px] mx-auto relative z-10 space-y-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: High-Impact Hero Headline & Text */}
            <div className="lg:col-span-5 space-y-6 text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-blue-200/80 text-xs font-semibold text-slate-800 shadow-sm">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold tracking-wider uppercase">NOUVEAU</span>
                <span className="text-slate-700 font-medium">FinancePro OHADA 2.0 est disponible</span>
                <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Pilotez votre <br />
                comptabilité, votre <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                  trésorerie & vos finances
                </span> <br />
                sous OHADA.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                FinancePro centralise la comptabilité SYSCOHADA, la facturation, la fiscalité, la trésorerie, les budgets et l'analyse financière dans une plateforme SaaS conçue pour les entreprises et cabinets comptables de la zone OHADA.
              </p>

              {/* Action Buttons Row */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={onSignup}
                  className="px-8 py-4 rounded-full font-extrabold text-xs text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 group tracking-wider uppercase"
                >
                  <span>Commencer gratuitement</span>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => {
                    const dashboardElem = document.getElementById('dashboard-preview');
                    if (dashboardElem) dashboardElem.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-4 rounded-full font-bold text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                  <span>Voir la démonstration</span>
                </button>
              </div>

              {/* Trust Checkmarks */}
              <div className="pt-3 flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sans carte bancaire</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Configuration rapide</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Données sécurisées</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Conforme SYSCOHADA Révisé</span>
              </div>

            </div>

            {/* Right Column: Dashboard Star XXL (1:1 Exact Match to User Reference Image 1) */}
            <div className="lg:col-span-7" id="dashboard-preview">
              
              {/* Blue Glowing Outer Container */}
              <div className="relative rounded-[32px] bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-5 sm:p-7 lg:p-9 shadow-2xl shadow-blue-600/30 text-left">
                
                {/* Top Outer Pills Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-20">
                  <div className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-blue-200" />
                    <span>Norme SYSCOHADA Révisé</span>
                  </div>

                  <div className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Espace Sécurisé SSL</span>
                  </div>
                </div>

                {/* Floating Top-Left Glass Card */}
                <div className="hidden sm:flex absolute -top-5 left-8 z-30 bg-white rounded-2xl p-4 shadow-2xl border border-slate-100/80 items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-xs">
                    XAF
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">TOTAL RECETTES</div>
                    <div className="text-base font-black text-slate-900 font-mono">17 500 000 XAF</div>
                    <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> +18.4% ce mois
                    </div>
                  </div>
                </div>

                {/* Floating Bottom-Right Glass Card */}
                <div className="hidden sm:flex absolute -bottom-5 right-8 z-30 bg-white rounded-2xl p-4 shadow-2xl border border-slate-100/80 items-center gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">TRÉSORERIE NETTE</div>
                    <div className="text-base font-black text-blue-600 font-mono">20 000 000 XAF</div>
                    <div className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Solde Banques & Caisse
                    </div>
                  </div>
                </div>

                {/* Center Main Mockup Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden p-4 sm:p-6 text-slate-900 space-y-5 text-xs">
                  
                  {/* Top Bar inside App Mockup */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    {/* Logo & Navigation */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-xs">
                          FP
                        </div>
                        <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                          FinancePro <span className="text-[10px] text-slate-400 font-mono">OHADA</span>
                        </span>
                      </div>

                      {/* Nav Items */}
                      <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-slate-500">
                        <span className="text-blue-600 font-bold border-b-2 border-blue-600 pb-1">Dashboard</span>
                        <span>Transactions</span>
                        <span>Reporting</span>
                        <span>Compliance</span>
                        <span>Invoicing</span>
                        <span>Contacts</span>
                      </div>
                    </div>

                    {/* Right User Actions */}
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer">
                        ⚙️
                      </div>
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 relative cursor-pointer">
                        🔔
                        <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500" />
                      </div>
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                        JP
                      </div>
                    </div>
                  </div>

                  {/* Greeting & Org Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-left">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Good Morning, Jean-Pierre! <span className="text-xs text-slate-400 font-normal">(Oct 26, 2023)</span></h3>
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                        <span>Organization: <strong className="text-slate-800">Sarl Ets. Diallo & Fils ▾</strong></span>
                        <span>Active Module: <strong className="text-blue-600">SYSCOHADA Standard ▾</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-700 transition-colors">
                        + Add Transaction
                      </button>
                      <button className="px-3 py-1.5 rounded-lg border border-blue-600 text-blue-600 font-bold text-[11px] hover:bg-blue-50 transition-colors">
                        View Report
                      </button>
                    </div>
                  </div>

                  {/* Top 4 KPI Cards Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left font-mono">
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-1">
                      <div className="text-[10px] text-slate-500 font-sans">Total Revenue</div>
                      <div className="text-sm font-black text-slate-900">14,560,300 <span className="text-[10px]">XAF</span></div>
                      <div className="text-[10px] text-emerald-600 font-bold">+12.4% 📈</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="text-[10px] text-slate-500 font-sans">Total Expenses</div>
                      <div className="text-sm font-black text-slate-900">9,850,750 <span className="text-[10px]">XAF</span></div>
                      <div className="text-[10px] text-rose-500 font-bold">+8.1% 📉</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="text-[10px] text-slate-500 font-sans">Net Profit</div>
                      <div className="text-sm font-black text-emerald-600">4,709,550 <span className="text-[10px]">XAF</span></div>
                      <div className="text-[10px] text-emerald-600 font-bold">+15.2% 📈</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="text-[10px] text-slate-500 font-sans">Cash Flow</div>
                      <div className="text-sm font-black text-slate-900">2,150,000 <span className="text-[10px]">XAF</span></div>
                      <div className="text-[10px] text-emerald-600 font-bold">+5.5% 📈</div>
                    </div>
                  </div>

                  {/* Main Chart & Gauge Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-left">
                    
                    {/* Left 8 Cols: Dual Bar & Line Chart (Revenue & Expenses SYSCOHADA) */}
                    <div className="lg:col-span-8 p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>Revenue & Expenses (SYSCOHADA)</span>
                        <span className="text-[10px] text-slate-500 font-mono">XAF millions ▾</span>
                      </div>

                      <div className="relative pt-4 pb-2">
                        {/* Bars & Line */}
                        <div className="h-32 flex items-end justify-between gap-2 px-2 relative z-10">
                          {[
                            { m: 'Jun', rev: 10.5, exp: 6.0 },
                            { m: 'Jul', rev: 10.0, exp: 8.5 },
                            { m: 'Aug', rev: 9.5, exp: 6.0 },
                            { m: 'Sep', rev: 11.5, exp: 7.5 },
                            { m: 'Oct', rev: 14.5, exp: 9.8, tooltip: true },
                          ].map((item, idx) => (
                            <div key={idx} className="flex-1 flex items-end justify-center gap-1.5 h-full relative">
                              {item.tooltip && (
                                <div className="absolute -top-10 z-30 bg-slate-900 text-white p-1.5 rounded text-[9px] font-mono shadow-lg whitespace-nowrap">
                                  Oct | Rev: 14.5M | Exp: 9.8M
                                </div>
                              )}
                              <div className="w-1/2 bg-blue-600 rounded-t-sm" style={{ height: `${(item.rev / 15) * 100}%` }} />
                              <div className="w-1/2 bg-slate-400 rounded-t-sm" style={{ height: `${(item.exp / 15) * 100}%` }} />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-500 font-mono px-2 border-t border-slate-200 pt-1">
                        <span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span className="font-bold text-blue-600">Oct</span>
                      </div>
                    </div>

                    {/* Right 4 Cols: Radial Gauge (Score de Conformité SYSCOHADA) */}
                    <div className="lg:col-span-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3">
                      <div className="text-xs font-bold text-slate-800">Compliance Score (SYSCOHADA)</div>
                      
                      {/* Radial Ring Gauge */}
                      <div className="flex flex-col items-center justify-center py-2">
                        <div className="w-20 h-20 rounded-full border-4 border-slate-200 border-t-emerald-500 border-r-emerald-500 flex flex-col items-center justify-center font-bold text-slate-900">
                          <span className="text-base font-black">94%</span>
                          <span className="text-[8px] text-emerald-600 font-mono font-bold">High Compliance</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 space-y-1">
                        <div className="flex justify-between font-mono">
                          <span>Active Accounts:</span>
                          <span className="font-bold text-slate-800">Diallo & Fils</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Bottom 3 Widgets Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="text-[11px] font-bold text-slate-800">Key Financial Metrics</div>
                      <div className="h-16 flex items-end justify-around gap-2 pt-2">
                        <div className="w-8 bg-blue-600 rounded-t text-center text-[9px] text-white font-bold" style={{ height: '70%' }}>32%</div>
                        <div className="w-8 bg-blue-400 rounded-t text-center text-[9px] text-white font-bold" style={{ height: '40%' }}>18%</div>
                      </div>
                      <div className="flex justify-around text-[9px] text-slate-500 font-mono">
                        <span>Gross Margin</span>
                        <span>EBITDA</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="text-[11px] font-bold text-slate-800">Top Expense Categories</div>
                      <div className="text-[10px] text-slate-600 space-y-1 font-mono pt-1">
                        <div className="flex justify-between"><span className="text-blue-600 font-bold">● Operating</span><span>40%</span></div>
                        <div className="flex justify-between"><span className="text-blue-400 font-bold">● Payroll</span><span>30%</span></div>
                        <div className="flex justify-between"><span className="text-slate-400 font-bold">● Rent</span><span>30%</span></div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="text-[11px] font-bold text-slate-800">Upcoming Payments</div>
                      <div className="text-[10px] space-y-1 font-mono">
                        <div className="flex justify-between items-center">
                          <span>May 26 (Status)</span>
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold">Status</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>May 17 (Straight)</span>
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold">Status</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 2: SPÉCIALISATION OHADA & PAYS */}
      <section id="ohada" className="py-14 bg-white border-y border-slate-200/80 px-4 sm:px-8 lg:px-12">
        <div className="max-w-[1400px] mx-auto space-y-6 text-center">
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5" /> Le SaaS financier pensé pour la zone OHADA
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Conforme au SYSCOHADA Révisé, conçu pour la Zone Franc (XAF / XOF) et adapté aux réglementations locales.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-mono font-bold text-xs text-slate-700">
            <span className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">🇨🇲 Cameroun</span>
            <span className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">🇨🇮 Côte d'Ivoire</span>
            <span className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">🇸🇳 Sénégal</span>
            <span className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">🇬🇦 Gabon</span>
            <span className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">🇨🇩 RDC</span>
            <span className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">🇧🇯 Bénin</span>
            <span className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">🇹🇬 Togo</span>
            <span className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">🇧🇫 Burkina Faso</span>
          </div>

        </div>
      </section>

      {/* SECTION 3: LES 6 MODULES INTERCONNECTÉS (CARTES XXL 1400px) */}
      <section id="modules" className="py-24 px-4 sm:px-8 lg:px-12 max-w-[1400px] mx-auto">
        <div className="space-y-16 text-center">
          
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider">
              <Layers2 className="w-3.5 h-3.5" /> ÉCOSYSTÈME COMPLET
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Tout votre pilotage financier <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                dans une seule plateforme
              </span>
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              6 modules interconnectés nativement pour éliminer la double saisie et garantir une visibilité totale sur vos opérations.
            </p>
          </div>

          {/* 6 Large Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            
            {/* Card 01 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-md hover:shadow-2xl transition-all duration-300 group space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">01</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Comptabilité SYSCOHADA</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Saisie guidée, journaux aux normes, grand livre filtrable, balance à 6 colonnes, lettrage automatique et clôture d'exercice sécurisée.
                </p>
              </div>
              <button onClick={onSignup} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 group-hover:gap-2.5 transition-all pt-2">
                <span>Découvrir la comptabilité</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 02 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-md hover:shadow-2xl transition-all duration-300 group space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">02</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Trésorerie & Banques</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Suivez vos comptes bancaires (521), caisses (541) et Mobile Money (571), réalisez vos rapprochements et contrôlez vos flux de cash.
                </p>
              </div>
              <button onClick={onSignup} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 group-hover:gap-2.5 transition-all pt-2">
                <span>Découvrir la trésorerie</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 03 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-md hover:shadow-2xl transition-all duration-300 group space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">03</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">États financiers OHADA</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Bilan Actif/Passif, Compte de Résultat, Tableau des Flux de Trésorerie (TFT), SIG et Notes Annexes réglementaires en 1 clic.
                </p>
              </div>
              <button onClick={onSignup} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 group-hover:gap-2.5 transition-all pt-2">
                <span>Découvrir les états financiers</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 04 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-md hover:shadow-2xl transition-all duration-300 group space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">04</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Fiscalité & Precomptes</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Gestion de la TVA (18%), retenues à la source (AIR 2% & 5%), acomptes d'impôt et suivi des déclarations fiscales locales.
                </p>
              </div>
              <button onClick={onSignup} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 group-hover:gap-2.5 transition-all pt-2">
                <span>Découvrir la fiscalité</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 05 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-md hover:shadow-2xl transition-all duration-300 group space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">05</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Analyse financière</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Ratios de solvabilité, rentabilité, EBE, Besoin en Fonds de Roulement (BFR) et Soldes Intermédiaires de Gestion.
                </p>
              </div>
              <button onClick={onSignup} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 group-hover:gap-2.5 transition-all pt-2">
                <span>Découvrir l'analyse</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 06 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-md hover:shadow-2xl transition-all duration-300 group space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">06</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Budgets & Prévisions</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Élaboration des budgets prévisionnels, comparaison du réalisé au budgétisé, contrôle des écarts et alertes.
                </p>
              </div>
              <button onClick={onSignup} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 group-hover:gap-2.5 transition-all pt-2">
                <span>Découvrir les budgets</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 4: SECTION INTERCONNEXION ("Une seule donnée. Toute votre gestion.") */}
      <section className="py-24 bg-gradient-to-b from-blue-50/50 via-white to-slate-50 px-4 sm:px-8 lg:px-12 border-y border-slate-200/80">
        <div className="max-w-[1400px] mx-auto space-y-16 text-center">
          
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100/70 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" /> ARCHITECTURE INTÉGRÉE
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Une seule donnée saisie. <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Plusieurs analyses générées automatiquement.
              </span>
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Saisissez une facture ou une opération bancaire une seule fois. FinancePro se charge d'alimenter immédiatement toute la chaîne comptable, fiscale et décisionnelle.
            </p>
          </div>

          {/* Workflow Chain Visual Graphic */}
          <div className="bg-white p-8 lg:p-12 rounded-3xl border border-slate-200/90 shadow-xl space-y-8 text-left">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 font-mono text-center">
              
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-blue-500 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-xs">01</div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm">Facture</div>
                <div className="text-[10px] text-slate-400">Document Source</div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2 hover:border-blue-500 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-xs">02</div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm">Comptabilité</div>
                <div className="text-[10px] text-blue-600 font-bold">Débit = Crédit</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-blue-500 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-xs">03</div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm">TVA & AIR</div>
                <div className="text-[10px] text-slate-400">Déclarations</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-blue-500 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-xs">04</div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm">Trésorerie</div>
                <div className="text-[10px] text-slate-400">Rapprochements</div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2 hover:border-emerald-500 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto text-xs">05</div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm">États OHADA</div>
                <div className="text-[10px] text-emerald-700 font-bold">Bilan & TFT</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-blue-500 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-xs">06</div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm">Analyse</div>
                <div className="text-[10px] text-slate-400">Ratios & EBE</div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2 hover:border-purple-500 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center mx-auto text-xs">07</div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm">Cockpit DAF</div>
                <div className="text-[10px] text-purple-700 font-bold">Décision</div>
              </div>

            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-slate-200">Zéro resaisie manuelle · Rapprochement en temps réel</span>
              </div>
              <button onClick={onSignup} className="text-xs font-bold text-blue-400 hover:text-white flex items-center gap-1">
                <span>Découvrir le flux opérationnel</span> →
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 5: FINANCEPRO INTELLIGENCE */}
      <section id="intelligence" className="py-24 bg-slate-900 text-white px-4 sm:px-8 lg:px-12">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-900/70 border border-blue-700/60 text-blue-300 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> FINANCEPRO INTELLIGENCE
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Votre assistant financier ne se contente pas de montrer les chiffres. <br />
              <span className="text-blue-400">Il les interprète.</span>
            </h2>

            <p className="text-slate-300 text-base leading-relaxed font-light">
              FinancePro Intelligence analyse chaque écriture enregistrée, surveille l'évolution de votre Besoin en Fonds de Roulement (BFR) et génère des alertes concrètes pour sécuriser votre trésorerie.
            </p>

            <div className="pt-4">
              <button onClick={onSignup} className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-xl shadow-blue-600/30 uppercase tracking-wider">
                Découvrir FinancePro Intelligence →
              </button>
            </div>
          </div>

          {/* Alert Cards Container */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4 shadow-2xl text-left">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-xs font-mono">
                <span className="text-blue-400 font-bold uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Centre d'Alertes Stratégiques
                </span>
                <span className="text-emerald-400 font-bold">● Actif</span>
              </div>

              <div className="space-y-3.5 text-xs font-mono">
                
                {/* Alert 1 */}
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/40 space-y-1">
                  <div className="font-bold text-rose-400 flex items-center gap-2">
                    🔴 Risque de trésorerie prévisionnelle
                  </div>
                  <p className="text-slate-300 text-[11px] font-sans leading-relaxed">
                    Votre solde de trésorerie pourrait devenir négatif dans 18 jours au rythme actuel des décaissements fournisseurs.
                  </p>
                </div>

                {/* Alert 2 */}
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/40 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-2">
                    🟠 Créances clients en retard
                  </div>
                  <p className="text-slate-300 text-[11px] font-sans leading-relaxed">
                    32 % de vos créances dépassent le délai moyen de paiement de 30 jours (Montant à relancer : 14.2M FCFA).
                  </p>
                </div>

                {/* Alert 3 */}
                <div className="p-4 rounded-2xl bg-yellow-950/40 border border-yellow-800/40 space-y-1">
                  <div className="font-bold text-yellow-400 flex items-center gap-2">
                    🟡 Suivi du budget prévisionnel
                  </div>
                  <p className="text-slate-300 text-[11px] font-sans leading-relaxed">
                    Les dépenses administratives de l'exercice dépassent le budget alloué de 14 %.
                  </p>
                </div>

                {/* Alert 4 */}
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-2">
                    🟢 Performance & Marge Brute
                  </div>
                  <p className="text-slate-300 text-[11px] font-sans leading-relaxed">
                    La marge brute globale progresse de 8,4 % par rapport à l'exercice N-1.
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 6: SECTION DASHBOARD ("Votre entreprise en un coup d'œil") */}
      <section className="py-24 bg-white px-4 sm:px-8 lg:px-12 border-b border-slate-200/80">
        <div className="max-w-[1400px] mx-auto space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider">
              <PieChart className="w-3.5 h-3.5" /> COCKPIT DE BORD
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Votre entreprise en un coup d'œil
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Visualisez l'intégralité de votre santé financière en temps réel sans attendre la fin du mois.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chiffre d'Affaires</div>
              <div className="text-2xl font-black text-blue-600 font-mono">48.500.000 FCFA</div>
              <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +12,4% par rapport à M-1
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Résultat Net</div>
              <div className="text-2xl font-black text-slate-900 font-mono">8.250.000 FCFA</div>
              <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +8,7% de rentabilité
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trésorerie Disponible</div>
              <div className="text-2xl font-black text-slate-900 font-mono">15.600.000 FCFA</div>
              <div className="text-xs text-slate-500">Banques (521) & Caisses (541)</div>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Besoin en Fonds (BFR)</div>
              <div className="text-2xl font-black text-emerald-600 font-mono">4.200.000 FCFA</div>
              <div className="text-xs text-emerald-600 font-bold">Fonds de roulement positif</div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 7: MATRICE "POURQUOI FINANCEPRO ?" */}
      <section id="pourquoi" className="py-24 bg-[#fafafa] px-4 sm:px-8 lg:px-12 border-b border-slate-200/80">
        <div className="max-w-[1400px] mx-auto space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider">
              <CheckCircle className="w-3.5 h-3.5" /> POURQUOI CHOISIR FINANCEPRO ?
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Pourquoi choisir FinancePro ?
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Découvrez la différence entre les outils traditionnels dispersés et notre plateforme intégrée.
            </p>
          </div>

          {/* Comparison Matrix Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-900">
                  <th className="p-5 w-1/2">Problème traditionnel</th>
                  <th className="p-5 w-1/2 text-blue-700 bg-blue-50/80">Solution FinancePro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 text-slate-700">
                <tr>
                  <td className="p-5 text-slate-500 font-medium">Données financières dispersées sur plusieurs fichiers Excel.</td>
                  <td className="p-5 font-bold text-slate-900 bg-blue-50/20">Une plateforme SaaS unique et centralisée pour toute l'entreprise.</td>
                </tr>
                <tr>
                  <td className="p-5 text-slate-500 font-medium">Saisie comptable complexe et risques d'erreurs d'imputation.</td>
                  <td className="p-5 font-bold text-slate-900 bg-blue-50/20">Saisie guidée avec validation instantanée Débit = Crédit (Écart 0).</td>
                </tr>
                <tr>
                  <td className="p-5 text-slate-500 font-medium">États financiers longs et pénibles à préparer en fin d'exercice.</td>
                  <td className="p-5 font-bold text-slate-900 bg-blue-50/20">Génération automatisée du Bilan, Compte de Résultat et TFT en 1 clic.</td>
                </tr>
                <tr>
                  <td className="p-5 text-slate-500 font-medium">Difficulté à anticiper les tensions de trésorerie et les trous de cash.</td>
                  <td className="p-5 font-bold text-slate-900 bg-blue-50/20">Suivi en temps réel et alertes préventives sur le BFR.</td>
                </tr>
                <tr>
                  <td className="p-5 text-slate-500 font-medium">Risques et pénalités de retard sur les déclarations fiscales.</td>
                  <td className="p-5 font-bold text-slate-900 bg-blue-50/20">Calculs automatiques de la TVA 18% et des retenues AIR (2% & 5%).</td>
                </tr>
                <tr>
                  <td className="p-5 text-slate-500 font-medium">Décisions stratégiques basées sur l'intuition plutôt que les données.</td>
                  <td className="p-5 font-bold text-slate-900 bg-blue-50/20">Analyse financière rigoureuse et indicateurs clairs pour le DAF.</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* SECTION 8: SÉCURITÉ INSTITUTIONNELLE TRANSPARENTE */}
      <section className="py-24 bg-white px-4 sm:px-8 lg:px-12 border-b border-slate-200/80">
        <div className="max-w-[1400px] mx-auto space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" /> CONFIANCE & RIGUEUR
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Vos données financières méritent une sécurité de niveau professionnel
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Des mécanismes de contrôle et d'accès éprouvés pour protéger la confidentialité de vos informations sensibles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200/80 space-y-4">
              <LockKeyhole className="w-8 h-8 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Contrôle des accès</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Authentification sécurisée et sessions contrôlées pour prévenir tout accès non autorisé à vos comptes d'entreprise.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200/80 space-y-4">
              <UserCheck className="w-8 h-8 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Rôles & permissions</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Gestion fine des droits d'accès pour l'Admin, le Comptable, le Gestionnaire et les Lecteurs autorisés.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200/80 space-y-4">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Piste d'audit</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Traçabilité intégrale des mouvements comptables permettant une révision fluide et sans contestation.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200/80 space-y-4">
              <Database className="w-8 h-8 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Sauvegardes de données</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Archivage régulier de vos fichiers et pièces comptables pour prémunir votre entreprise contre tout risque de perte.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200/80 space-y-4">
              <History className="w-8 h-8 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Historique des modifications</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Journal détaillé retraçant l'ensemble des créations, modifications ou annulations d'écritures.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200/80 space-y-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Protection des données</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Confidentialité absolue de vos informations d'entreprise conformément aux règles d'éthique et de sécurité.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 9: PREUVE SOCIALE AUTHENTIQUE (PERSONAS OHADA) */}
      <section className="py-24 bg-[#fafafa] px-4 sm:px-8 lg:px-12 border-b border-slate-200/80">
        <div className="max-w-[1400px] mx-auto space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" /> ÉCOSYSTÈME OHADA
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Conçu pour les professionnels de la finance de la zone OHADA
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              FinancePro s'adapte aux besoins spécifiques des différents acteurs de l'écosystème financier.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="font-bold text-xs sm:text-sm text-slate-900">Experts-Comptables</div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="font-bold text-xs sm:text-sm text-slate-900">Cabinets Comptables</div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Users className="w-5 h-5" />
              </div>
              <div className="font-bold text-xs sm:text-sm text-slate-900">Petites Entreprises (PME)</div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Layers className="w-5 h-5" />
              </div>
              <div className="font-bold text-xs sm:text-sm text-slate-900">ETI & Filiales</div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <PieChart className="w-5 h-5" />
              </div>
              <div className="font-bold text-xs sm:text-sm text-slate-900">Directions Financières (DAF)</div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Award className="w-5 h-5" />
              </div>
              <div className="font-bold text-xs sm:text-sm text-slate-900">Entrepreneurs</div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 10: TARIFS SAAS TRANSPARENTS EN FCFA */}
      <section id="tarifs" className="py-24 bg-white px-4 sm:px-8 lg:px-12 border-b border-slate-200/80">
        <div className="max-w-[1400px] mx-auto space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5" /> TARIFS TRANSPARENTS
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Des offres adaptées à votre entreprise
            </h2>
            <p className="text-base text-slate-600 font-normal">
              Tarification claire sans engagement de durée. Testez gratuitement pendant 14 jours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Starter Plan */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-8 text-left">
              <div className="space-y-4">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">STARTER</div>
                <h3 className="text-2xl font-bold text-slate-900">Petites Entreprises</h3>
                <p className="text-xs text-slate-500">Pour structurer votre comptabilité SYSCOHADA de base.</p>
                <div className="pt-2 font-mono">
                  <span className="text-3xl font-extrabold text-slate-900">29 900 FCFA</span>
                  <span className="text-xs text-slate-500 font-sans"> / mois</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-700 border-t border-slate-200 pt-4">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 font-bold" /> Comptabilité SYSCOHADA</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 font-bold" /> Facturation clients</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 font-bold" /> Déclarations TVA (18%)</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 font-bold" /> Suivi de trésorerie de base</li>
                </ul>
              </div>
              <button onClick={onSignup} className="w-full py-3.5 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-bold transition-colors uppercase tracking-wider">
                Commencer gratuitement
              </button>
            </div>

            {/* Pro Plan (Highlighted Card) */}
            <div className="bg-[#0b1736] text-white p-8 rounded-3xl border-2 border-blue-500 shadow-2xl flex flex-col justify-between space-y-8 text-left relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-md">
                RECOMMANDÉ PME
              </div>
              <div className="space-y-4">
                <div className="text-xs font-bold text-blue-300 uppercase tracking-wider">PRO</div>
                <h3 className="text-2xl font-bold text-white">PME & ETI</h3>
                <p className="text-xs text-slate-300">Pour un pilotage financier complet, prévisionnel et fiscal.</p>
                <div className="pt-2 font-mono">
                  <span className="text-3xl font-extrabold text-white">59 900 FCFA</span>
                  <span className="text-xs text-slate-400 font-sans"> / mois</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-200 border-t border-slate-800 pt-4">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 font-bold" /> Tout le module STARTER</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 font-bold" /> États financiers OHADA (Bilan & TFT)</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 font-bold" /> Budgets & Suivi des écarts</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 font-bold" /> Analyse financière & Ratios</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 font-bold" /> FinancePro Intelligence</li>
                </ul>
              </div>
              <button onClick={onSignup} className="w-full py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-lg shadow-blue-600/30 transition-colors uppercase tracking-wider">
                Commencer l'essai PRO
              </button>
            </div>

            {/* Cabinet Plan */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-8 text-left">
              <div className="space-y-4">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">CABINET</div>
                <h3 className="text-2xl font-bold text-slate-900">Cabinets Comptables</h3>
                <p className="text-xs text-slate-500">Pour la gestion multi-entreprises et dossiers clients.</p>
                <div className="pt-2 font-mono">
                  <span className="text-3xl font-extrabold text-slate-900">Sur devis</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-700 border-t border-slate-200 pt-4">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 font-bold" /> Multi-entreprises & dossiers clients</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 font-bold" /> Gestion centralisée des collaborateurs</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 font-bold" /> Piste d'audit & Révision</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 font-bold" /> Administration avancée</li>
                </ul>
              </div>
              <button onClick={onSignup} className="w-full py-3.5 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-bold transition-colors uppercase tracking-wider">
                Demander un devis
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 11: CTA FINAL D'IMPACT */}
      <section className="py-24 px-4 sm:px-8 lg:px-12 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            Prêt à reprendre le contrôle <br />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              de vos finances ?
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-light max-w-2xl mx-auto">
            Centralisez votre comptabilité, votre trésorerie, votre fiscalité et vos analyses financières dans une seule plateforme.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onSignup}
              className="w-full sm:w-auto px-9 py-4 rounded-full font-extrabold text-xs text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 group uppercase tracking-wider"
            >
              <span>Commencer gratuitement</span>
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onLogin}
              className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-xs text-slate-300 border border-slate-800 hover:bg-slate-900 transition-colors uppercase tracking-wider"
            >
              Demander une démonstration
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono pt-2">
            Sans carte bancaire · Configuration rapide · Conforme SYSCOHADA Révisé
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-500 py-16 px-4 sm:px-8 lg:px-12 border-t border-slate-900 text-xs">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-base">
              FP
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-white text-base">FinancePro OHADA</span>
              <span className="text-xs text-slate-400">Plateforme SaaS de Pilotage Financier & Comptable</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-slate-400 font-medium">
            <a href="#hero" className="hover:text-white transition-colors">Produit</a>
            <a href="#ohada" className="hover:text-white transition-colors">Solutions</a>
            <a href="#modules" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#tarifs" className="hover:text-white transition-colors">Tarifs</a>
            <a href="#pourquoi" className="hover:text-white transition-colors">Ressources</a>
          </div>

          <div className="text-center md:text-right text-xs text-slate-500">
            © {new Date().getFullYear()} FinancePro OHADA. Tous droits réservés. <br />
            Conforme SYSCOHADA Révisé (CEMAC & UEMOA).
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
