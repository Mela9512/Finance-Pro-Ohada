import React from 'react';
import { Building2, User, ShieldCheck, Bell, Search, Globe, LogOut } from 'lucide-react';
import { UserRole } from '@financepro/shared';

interface NavbarProps {
  currentModule: string;
  user: { name: string; email: string; role: UserRole };
  company: { name: string; rccm: string; nif: string; currency: string };
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentModule,
  user,
  company,
  onLogout,
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left Title & Company Pill */}
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-white capitalize tracking-wide">
          {currentModule}
        </h1>
        <div className="hidden md:flex items-center space-x-2 bg-emerald-950/60 border border-emerald-500/30 rounded-full px-3 py-1 text-xs text-emerald-300 font-medium">
          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{company.name}</span>
          <span className="text-emerald-500">|</span>
          <span className="text-slate-400">RCCM: {company.rccm}</span>
        </div>
      </div>

      {/* Center Search */}
      <div className="hidden lg:flex items-center relative w-72">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher écriture, compte 411, facture..."
          className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Right User Controls */}
      <div className="flex items-center space-x-4">
        {/* Currency Pill */}
        <div className="hidden sm:flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md text-xs text-slate-300">
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-white">{company.currency}</span>
          <span className="text-slate-500 text-[10px]">(OHADA)</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
        </button>

        {/* User Role Switcher Dropdown */}
        <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
            {user.name.charAt(0)}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-white">{user.name}</div>
            <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3 h-3" />
              <span>{user.role}</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 text-xs border border-slate-700 hover:border-rose-800 rounded-md px-2.5 py-1.5 transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
};
