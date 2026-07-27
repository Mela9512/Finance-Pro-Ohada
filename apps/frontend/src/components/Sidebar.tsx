import React from 'react';
import {
  LayoutDashboard, BookOpenCheck, Wallet, Users, Truck,
  FileSpreadsheet, BarChart3, Settings, ShieldCheck, Target,
  RefreshCw, MessageSquare, Trash2, FolderCheck, ChevronRight, Bot
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
  | 'ai'
  | 'admin'
  | 'auth';

interface SidebarProps {
  activeModule: ModuleId;
  onSelectModule: (module: ModuleId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onSelectModule }) => {
  const menuItems = [
    { id: 'dashboard' as ModuleId, label: 'Tableau de bord', icon: LayoutDashboard, badge: '99' },
    { id: 'accounting' as ModuleId, label: 'Comptabilité SYSCOHADA', icon: BookOpenCheck },
    { id: 'treasury' as ModuleId, label: 'Trésorerie & Banque', icon: Wallet },
    { id: 'clients' as ModuleId, label: 'Clients & Créances', icon: Users },
    { id: 'suppliers' as ModuleId, label: 'Fournisseurs & Dettes', icon: Truck },
    { id: 'invoicing' as ModuleId, label: 'Facturation & Taxes', icon: FileSpreadsheet },
    { id: 'reports' as ModuleId, label: 'États Financiers OHADA', icon: BarChart3 },
    { id: 'budget' as ModuleId, label: 'Budget Prévisionnel', icon: Target },
    { id: 'ai' as ModuleId, label: 'Assistant IA (Gemini)', icon: Bot },
    { id: 'admin' as ModuleId, label: 'Administration & Rôles', icon: Settings },
    { id: 'auth' as ModuleId, label: 'Authentification & Accès', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 bg-[#0f2d5e] text-white flex flex-col justify-between select-none shadow-2xl relative z-20 border-r border-blue-900/40">
      <div>
        {/* Brand Pocket Red Wallet Header */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-blue-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-white text-base tracking-wide">FinancePro</div>
              <div className="text-[10px] text-blue-200 font-semibold tracking-wider uppercase">SYSCOHADA</div>
            </div>
          </div>
          <span className="text-xs text-blue-200/70 font-mono">NAV ◄</span>
        </div>

        {/* Navigation Section Title */}
        <div className="px-5 pt-4 pb-2 text-[10px] font-bold tracking-widest text-blue-300/60 uppercase">
          NAVIGATION & MODULES
        </div>

        {/* Navigation Menu (Curved Pill Active Item matching image) */}
        <nav className="px-3 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 font-bold shadow-lg shadow-blue-950/40'
                    : 'text-blue-100/80 hover:text-white hover:bg-blue-900/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-blue-200'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-red-600 text-white' : 'bg-blue-900 text-blue-200 border border-blue-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Badge */}
      <div className="p-4 border-t border-blue-800/40 bg-blue-950/60">
        <div className="bg-blue-900/50 border border-blue-800 rounded-xl p-3 text-center">
          <div className="text-[11px] font-bold text-white">Exercice Comptable 2026</div>
          <div className="text-[10px] text-blue-200 font-mono mt-0.5">Clôture : 31/12/2026</div>
          <div className="w-full bg-blue-950 rounded-full h-1.5 mt-2 overflow-hidden border border-blue-800">
            <div className="bg-red-500 h-full w-8/12 rounded-full"></div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
