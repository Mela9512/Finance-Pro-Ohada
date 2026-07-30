import React from 'react';
import {
  LayoutDashboard, BookOpenCheck, Wallet, Users, Truck,
  FileSpreadsheet, BarChart3, Settings, ShieldCheck, Target,
  Bot, Rocket, ChevronRight, Landmark, FileClock, Building2, Package, ClipboardList
} from 'lucide-react';
import { UserRole } from '@financepro/shared';

export type ModuleId =
  | 'dashboard'
  | 'accounting'
  | 'treasury'
  | 'clients'
  | 'suppliers'
  | 'commandes'
  | 'invoicing'
  | 'reports'
  | 'fiscalite'
  | 'immobilisations'
  | 'stocks'
  | 'budget'
  | 'ai'
  | 'business-plan'
  | 'admin'
  | 'auth'
  | 'audit';

interface SidebarProps {
  activeModule: ModuleId;
  onSelectModule: (module: ModuleId) => void;
  userRole: UserRole;
}

const menuGroups = [
  {
    label: 'PRINCIPAL',
    items: [
      { id: 'dashboard' as ModuleId, label: 'Tableau de bord', icon: LayoutDashboard, badge: '' },
    ],
  },
  {
    label: 'COMPTABILITÉ',
    items: [
      { id: 'accounting' as ModuleId, label: 'Comptabilité SYSCOHADA', icon: BookOpenCheck },
      { id: 'treasury' as ModuleId, label: 'Trésorerie & Banque', icon: Wallet },
      { id: 'reports' as ModuleId, label: 'États Financiers OHADA', icon: BarChart3 },
      { id: 'fiscalite' as ModuleId, label: 'Fiscalité (TVA / AIR)', icon: Landmark },
      { id: 'immobilisations' as ModuleId, label: 'Immobilisations', icon: Building2 },
      { id: 'stocks' as ModuleId, label: 'Stocks & Inventaire', icon: Package },
      { id: 'budget' as ModuleId, label: 'Budget Prévisionnel', icon: Target },
    ],
  },
  {
    label: 'GESTION',
    items: [
      { id: 'clients' as ModuleId, label: 'Clients & Créances', icon: Users },
      { id: 'suppliers' as ModuleId, label: 'Fournisseurs & Dettes', icon: Truck },
      { id: 'commandes' as ModuleId, label: 'Commandes & Livraisons', icon: ClipboardList },
      { id: 'invoicing' as ModuleId, label: 'Facturation & Taxes', icon: FileSpreadsheet },
    ],
  },
  {
    label: 'OUTILS IA',
    items: [
      { id: 'ai' as ModuleId, label: 'Assistant IA (Gemini)', icon: Bot },
      { id: 'business-plan' as ModuleId, label: 'Business Plan', icon: Rocket },
    ],
  },
  {
    label: 'SYSTÈME',
    items: [
      { id: 'admin' as ModuleId, label: 'Administration & Rôles', icon: Settings },
      { id: 'auth' as ModuleId, label: 'Sécurité & Accès', icon: ShieldCheck },
      { id: 'audit' as ModuleId, label: "Piste d'audit", icon: FileClock, roles: ['ADMIN', 'COMPTABLE'] as UserRole[] },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onSelectModule, userRole }) => {
  const visibleGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !('roles' in item) || (item as { roles: UserRole[] }).roles.includes(userRole)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className="w-64 flex flex-col select-none shadow-2xl relative z-20"
      style={{ background: 'linear-gradient(180deg, #1E1060 0%, #150B4A 100%)', minHeight: '100vh' }}
    >
      {/* Logo Header */}
      <div className="h-20 flex items-center px-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6B4EFF 0%, #8B72FF 100%)' }}
          >
            <span className="font-extrabold text-white text-base">FP</span>
          </div>
          <div>
            <div className="font-extrabold text-white text-sm tracking-wide leading-tight">FinancePro</div>
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#A78BFA' }}>
              SYSCOHADA
            </div>
          </div>
        </div>
      </div>

      {/* Navigation groupée */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <div
              className="text-[9px] font-bold tracking-widest px-3 mb-2"
              style={{ color: 'rgba(167,139,250,0.55)' }}
            >
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectModule(item.id)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all"
                    style={
                      isActive
                        ? {
                            background: 'rgba(255,255,255,0.13)',
                            color: '#ffffff',
                            fontWeight: 700,
                            boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.15)',
                          }
                        : {
                            color: 'rgba(196,181,253,0.75)',
                            background: 'transparent',
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                        (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(196,181,253,0.75)';
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: isActive ? '#A78BFA' : 'rgba(167,139,250,0.6)' }}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 opacity-60 flex-shrink-0" style={{ color: '#A78BFA' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — Exercice comptable */}
      <div className="p-4 border-t border-white/10">
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: 'rgba(107,78,255,0.18)', border: '1px solid rgba(107,78,255,0.3)' }}
        >
          <div className="text-[11px] font-bold text-white">Exercice Comptable 2026</div>
          <div className="text-[10px] font-mono mt-0.5" style={{ color: '#A78BFA' }}>
            Clôture : 31/12/2026
          </div>
          <div className="w-full rounded-full h-1.5 mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: '58%', background: 'linear-gradient(90deg, #6B4EFF, #8B72FF)' }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
