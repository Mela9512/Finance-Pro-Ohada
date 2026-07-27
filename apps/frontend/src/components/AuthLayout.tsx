import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, TrendingUp, Wallet, CheckCircle2 } from 'lucide-react';

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
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#f3f4f6] p-4 font-sans select-none">
      <div className="bg-white rounded-[32px] border border-slate-200/80 shadow-2xl shadow-slate-300/40 w-full max-w-5xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Left Column — Hero Illustration Panel */}
        <div className="hidden lg:flex lg:col-span-6 p-4">
          <div className="w-full bg-gradient-to-br from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] rounded-[24px] p-8 text-white flex flex-col justify-between relative overflow-hidden shadow-inner">
            
            {/* Top Mockup Floating Cards */}
            <div className="space-y-4 relative z-10 pt-2">
              {/* Card 1 */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 text-slate-900 shadow-xl border border-white/40 max-w-[260px]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trésorerie Nette</div>
                <div className="text-xl font-extrabold text-[#2563eb] font-mono mt-0.5">17 500 000 XAF</div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+12.4% vs mois dernier</span>
                </div>
              </div>

              {/* Card 2 - Dashboard Mock Preview */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 text-slate-900 shadow-xl border border-white/40 ml-8 max-w-[300px]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#2563eb] text-white flex items-center justify-center font-bold text-[10px]">FP</div>
                    <span className="text-xs font-extrabold text-slate-900">FinancePro OHADA</span>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">SYSCOHADA</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <div className="text-slate-400 font-semibold">Chiffre d'Affaires</div>
                    <div className="font-mono font-extrabold text-slate-900 mt-0.5">20 000 000 XAF</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <div className="text-slate-400 font-semibold">Conformité</div>
                    <div className="font-mono font-extrabold text-emerald-600 mt-0.5">98% Conforme</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Decorative Circles */}
            <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-1/2 -left-12 w-48 h-48 bg-blue-400/20 rounded-full blur-xl pointer-events-none" />

            {/* Bottom Hero Text */}
            <div className="relative z-10 pt-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
                Gérez vos finances. <br />Pilotez plus intelligemment.
              </h2>
              <p className="text-xs text-blue-100/90 font-medium leading-relaxed mt-2 max-w-sm">
                FinancePro OHADA automatise la tenue de vos comptes, le suivi de trésorerie et la conformité SYSCOHADA sans aucun stress.
              </p>

              {/* Pagination Dots */}
              <div className="flex items-center space-x-1.5 mt-6">
                <span className="w-6 h-2 bg-white rounded-full transition-all" />
                <span className="w-2 h-2 bg-white/40 rounded-full hover:bg-white/70 transition-all cursor-pointer" />
                <span className="w-2 h-2 bg-white/40 rounded-full hover:bg-white/70 transition-all cursor-pointer" />
              </div>
            </div>

          </div>
        </div>

        {/* Right Column — Form Area */}
        <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between space-y-6">
          <div>
            {/* Top Greeting & Segmented Pill Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  {title} <span className="text-xl">👋</span>
                </h1>
                {subtitle && <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>}
              </div>

              {showNavToggle && (
                <div className="inline-flex bg-slate-100 p-1 rounded-full border border-slate-200 self-start sm:self-auto">
                  <Link
                    to="/login"
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isLogin
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Se connecter
                  </Link>
                  <Link
                    to="/register"
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      !isLogin
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    S'inscrire
                  </Link>
                </div>
              )}
            </div>

            {/* Main Form Content */}
            {children}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
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
