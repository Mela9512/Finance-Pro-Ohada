import React from 'react';
import {
  LayoutDashboard, BookOpenCheck, Wallet, Users, Truck,
  FileSpreadsheet, BarChart3, Settings, ShieldCheck, LogOut, Target
} from 'lucide-react';

export type ModuleId =
  | 'dashboard'
  | 'accounting'
  | 'treasury'
  | 'clients'
  | 'suppliers'
  | 'invoicing'
  | 'reports'
  | 'budget'
  | 'admin'
  | 'auth';

interface SidebarProps {
  activeModule: ModuleId;
  onSelectModule: (module: ModuleId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onSelectModule }) => {
  const menuItems = [
    { id: 'dashboard' as ModuleId, label: 'Tableau de bord', icon: LayoutDashboard, badge: 'Live' },
    { id: 'accounting' as ModuleId, label: 'Comptabilité SYSCOHADA', icon: BookOpenCheck },
    { id: 'treasury' as ModuleId, label: 'Trésorerie & Banque', icon: Wallet },
    { id: 'clients' as ModuleId, label: 'Clients & Créances', icon: Users },
    { id: 'suppliers' as ModuleId, label: 'Fournisseurs & Dettes', icon: Truck },
    { id: 'invoicing' as ModuleId, label: 'Facturation & Taxes', icon: FileSpreadsheet },
    { id: 'reports' as ModuleId, label: 'États Financiers OHADA', icon: BarChart3 },
    { id: 'budget' as ModuleId, label: 'Budget Prévisionnel', icon: Target },
    { id: 'admin' as ModuleId, label: 'Administration & Rôles', icon: Settings },
    { id: 'auth' as ModuleId, label: 'Authentification & Accès', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="font-extrabold text-slate-950 text-base tracking-wider">FP</span>
          </div>
          <div>
            <div className="font-extrabold text-white text-sm tracking-wide">FinancePro</div>
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Norme SYSCOHADA</div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-600/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="bg-slate-850 border border-slate-800 rounded-lg p-3 text-center">
          <div className="text-[11px] font-semibold text-slate-300">Exercice Comptable 2026</div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Clôture : 31/12/2026</div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full w-7/12 rounded-full"></div>
          </div>
        </div>
      </div>
    </aside>
  );
};
