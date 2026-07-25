import React from 'react';
import { Building2, User, ShieldCheck, Bell, Search, Globe, LogOut, Calendar, ChevronRight } from 'lucide-react';
import { UserRole } from '@financepro/shared';

interface NavbarProps {
  currentModule: string;
  user: { name: string; email: string; role: UserRole };
  company: { name: string; rccm?: string; nif?: string; currency: string };
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentModule,
  user,
  company,
  onLogout,
}) => {
  return (
    <header className="h-20 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 capitalize tracking-tight">
          {currentModule}
        </h1>
        <div className="text-xs text-slate-500 font-medium">
          Analytics & métriques comptables SYSCOHADA Révisé — <span className="text-blue-900 font-semibold">{company.name}</span>
        </div>
      </div>

      {/* Center Search / Parameter Pill */}
      <div className="hidden lg:flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5 text-xs text-slate-700 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Exercice 2026 : 01.01.2026</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5 text-xs text-slate-700 font-medium">
          <span>Sélection des paramètres</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Right User Controls */}
      <div className="flex items-center space-x-4">
        {/* Real Time Clock Display matching image */}
        <div className="hidden sm:block text-sm font-bold text-slate-900 font-mono bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
          09 : 55
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full"></span>
        </button>

        {/* User Role Profile Badge */}
        <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
          <div className="w-9 h-9 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs shadow-md border border-blue-800">
            {user.name.charAt(0)}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-900">{user.name}</div>
            <div className="flex items-center space-x-1 text-[10px] text-blue-700 font-bold">
              <ShieldCheck className="w-3 h-3 text-blue-700" />
              <span>{user.role}</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center space-x-1 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs border border-slate-200 hover:border-red-200 rounded-lg px-3 py-1.5 transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sortir</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
