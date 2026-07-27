import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, TrendingUp, Sparkles, CheckCircle2, Lock } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showNavToggle?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  showNavToggle = true,
}) => {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#f1f5f9] p-3 sm:p-6 font-sans select-none">
      <div className="bg-white rounded-[36px] border border-slate-200/80 shadow-[0_20px_70px_-10px_rgba(37,99,235,0.12)] w-full max-w-6xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
        
        {/* Left Column — Realistic UI Showcase Panel */}
        <div className="hidden lg:flex lg:col-span-6 p-4">
          <div className="w-full bg-gradient-to-br from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] rounded-[28px] p-8 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-blue-500/20">
            
            {/* Background Ambient Glow Effects */}
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-blue-400/25 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar inside Showcase */}
            <div className="flex items-center justify-between relative z-20">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-bold text-white shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Norme SYSCOHADA Révisé</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[11px] font-semibold text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Espace Sécurisé SSL</span>
              </div>
            </div>

            {/* Realistic Dashboard Screenshot with Floating UI Widgets */}
            <div className="relative z-10 my-auto py-6">
              
              {/* Floating Widget 1 — Top Left Card */}
              <div className="absolute -top-2 left-2 z-20 bg-white/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.15)] border border-white/60 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center font-extrabold text-xs">
                    XAF
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Total Recettes</div>
                    <div className="text-sm font-extrabold text-slate-900 font-mono">17 500 000 XAF</div>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <TrendingUp className="w-3 h-3" />
                  <span>+18.4% ce mois</span>
                </div>
              </div>

              {/* Floating Widget 2 — Bottom Right Card */}
              <div className="absolute -bottom-4 right-2 z-20 bg-white/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.15)] border border-white/60 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Trésorerie Nette</div>
                <div className="text-sm font-extrabold text-[#2563eb] font-mono mt-0.5">20 000 000 XAF</div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mt-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Solde Banques &amp; Caisse</span>
                </div>
              </div>

              {/* Central Screenshot Showcase Image */}
              <div className="relative rounded-2xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] border-2 border-white/30 group">
                <img
                  src="/dashboard_preview.png"
                  alt="Aperçu Tableau de Bord FinancePro OHADA"
                  className="w-full object-cover rounded-2xl transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1d4ed8]/40 via-transparent to-transparent opacity-60" />
              </div>
            </div>

            {/* Bottom Hero Typography & Slider Dots */}
            <div className="relative z-20 pt-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
                Gérez vos finances. <br />Pilotez plus intelligemment.
              </h2>
              <p className="text-xs text-blue-100/90 font-medium leading-relaxed mt-2 max-w-md">
                FinancePro OHADA automatise la tenue de vos comptes, le suivi de trésorerie et la conformité SYSCOHADA sans aucun stress.
              </p>

              {/* Slider Dots */}
              <div className="flex items-center space-x-2 mt-5">
                <span className="w-7 h-2 bg-white rounded-full transition-all" />
                <span className="w-2 h-2 bg-white/40 rounded-full hover:bg-white/80 transition-all cursor-pointer" />
                <span className="w-2 h-2 bg-white/40 rounded-full hover:bg-white/80 transition-all cursor-pointer" />
              </div>
            </div>

          </div>
        </div>

        {/* Right Column — High UX/UI Form Area */}
        <div className="lg:col-span-6 p-6 sm:p-12 flex flex-col justify-between space-y-6">
          <div>
            {/* Header Greeting & Floating Segment Nav */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  {title} <span className="text-2xl">👋</span>
                </h1>
                {subtitle && <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>}
              </div>

              {showNavToggle && (
                <div className="inline-flex bg-slate-100 p-1 rounded-full border border-slate-200/80 shadow-inner self-start sm:self-auto">
                  <Link
                    to="/login"
                    className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all duration-200 ${
                      isLogin
                        ? 'bg-white text-slate-900 shadow-md shadow-slate-200'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Se connecter
                  </Link>
                  <Link
                    to="/register"
                    className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all duration-200 ${
                      !isLogin
                        ? 'bg-white text-slate-900 shadow-md shadow-slate-200'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    S'inscrire
                  </Link>
                </div>
              )}
            </div>

            {/* Form Children Content */}
            {children}
          </div>

          {/* Footer Navigation */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
            <Link to="/" className="hover:text-slate-700 transition-colors">
              Politique de confidentialité
            </Link>
            <span>© FinancePro OHADA 2026</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;
