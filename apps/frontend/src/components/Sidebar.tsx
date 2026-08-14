import React, { useState } from 'react';
import {
  LayoutDashboard, BookOpenCheck, Wallet, Users, Truck,
  FileSpreadsheet, BarChart3, Settings, ShieldCheck, Target,
  Bot, ChevronRight, Landmark, FileClock, Building2, Package,
  Users2, FolderOpen, Bell, ChevronDown, Calendar, RefreshCw,
  TrendingUp, ChevronLeft, Menu, Lock, Sparkles, Trash2, Plus, X, AlertTriangle
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
  | 'financial-analysis'
  | 'fiscalite'
  | 'immobilisations'
  | 'stocks'
  | 'paie'
  | 'budget'
  | 'ai'
  | 'business-plan'
  | 'admin'
  | 'auth'
  | 'audit'
  | 'documents';

interface SidebarProps {
  activeModule: ModuleId;
  activeSubTab?: any;
  onSelectModule: (module: ModuleId, subTab?: any) => void;
  userRole: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  activeSubTab,
  onSelectModule,
  userRole
}) => {
  // Toggle states
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [comptaMenuExpanded, setComptaMenuExpanded] = useState(false);

  // Selector states
  const [currentCompany, setCurrentCompany] = useState('MELARO GROUP');
  const [currentYear, setCurrentYear] = useState('2026');
  const [companies, setCompanies] = useState(['MELARO GROUP', 'RONAX INVEST SARL', 'BEDARA CONSULTING SARL']);
  const years = ['2026', '2025', '2024'];

  // Modal states
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyType, setNewCompanyType] = useState('SARL');
  const [hoveredCompany, setHoveredCompany] = useState<string | null>(null);

  const handleAddCompany = () => {
    const name = newCompanyName.trim().toUpperCase();
    if (!name || companies.includes(name)) return;
    const fullName = `${name} ${newCompanyType}`;
    setCompanies(prev => [...prev, fullName]);
    setCurrentCompany(fullName);
    setNewCompanyName('');
    setShowAddCompanyModal(false);
    setCompanyDropdownOpen(false);
  };

  const handleDeleteCompany = (company: string) => {
    const updated = companies.filter(c => c !== company);
    setCompanies(updated);
    if (currentCompany === company) {
      setCurrentCompany(updated[0] ?? '');
    }
    setShowDeleteConfirm(null);
    setCompanyDropdownOpen(false);
  };

  const notifications = [
    { text: '3 alertes critiques', type: 'error' },
    { text: '5 tâches à effectuer', type: 'warning' },
    { text: '2 échéances fiscales', type: 'info' },
    { text: '4 anomalies comptables', type: 'error' }
  ];

  // Define sidebar menu categories and items based on the requested architecture
  const menuCategories = [
    {
      label: 'PILOTAGE',
      items: [
        { id: 'dashboard' as ModuleId, label: 'Tableau de bord', icon: LayoutDashboard },
        { id: 'financial-analysis' as ModuleId, label: 'Analyse financière', icon: BarChart3 },
        { id: 'budget' as ModuleId, label: 'Budgets & Prévisions', icon: Target },
      ]
    },
    {
      label: 'COMPTABILITÉ',
      items: [
        {
          id: 'accounting' as ModuleId,
          label: 'Comptabilité SYSCOHADA',
          icon: BookOpenCheck,
          isSubmenuParent: true,
          submenuItems: [
            { label: "Vue d'ensemble", subTab: 'dashboard' },
            { label: 'Saisie comptable', subTab: 'saisie' },
            { label: 'Journaux', subTab: 'journaux' },
            { label: 'Plan comptable', subTab: 'plan' },
            { label: 'Comptes tiers', subTab: 'auxiliaires' },
            { label: 'Grand livre', subTab: 'grand-livre' },
            { label: 'Balance', subTab: 'balance' },
            { label: 'Lettrage', subTab: 'lettrage' },
            { label: 'Rapprochement bancaire', subTab: 'rapprochement-bancaire' },
            { label: 'Fin de période', subTab: 'fin-periode' },
            { label: 'États financiers OHADA', moduleId: 'reports', subTab: 2 },
            { label: 'Clôture', subTab: 'cloture' },
            { label: 'Contrôles', subTab: 'controles' },
            { label: 'Analyse & SIG', subTab: 'analyse' },
            { label: 'Rapports', subTab: 'rapports' },
            { label: 'Paramétrage', subTab: 'parametrages' },
            { label: "Piste d'audit", subTab: 'audit' }
          ]
        }
      ]
    },
    {
      label: 'TRÉSORERIE',
      items: [
        { id: 'treasury' as ModuleId, label: 'Banques & Caisses', icon: Landmark, subTab: 2 },
        { id: 'treasury' as ModuleId, label: 'Rapprochements', icon: RefreshCw, subTab: 8 },
        { id: 'treasury' as ModuleId, label: 'Prévisions', icon: TrendingUp, subTab: 9 },
      ]
    },
    {
      label: 'FISCALITÉ',
      items: [
        { id: 'fiscalite' as ModuleId, label: 'Déclarations', icon: FileClock, subTab: 1, badge: '!', badgeVariant: 'red' },
        { id: 'fiscalite' as ModuleId, label: 'TVA', icon: FileSpreadsheet, subTab: 3 },
        { id: 'fiscalite' as ModuleId, label: 'Calendrier fiscal', icon: Calendar, subTab: 10 },
      ]
    },
    {
      label: 'GESTION',
      items: [
        { id: 'clients' as ModuleId, label: 'Clients & Créances', icon: Users, badge: '3', badgeVariant: 'orange' },
        { id: 'suppliers' as ModuleId, label: 'Fournisseurs & Dettes', icon: Truck, badge: '2', badgeVariant: 'purple' },
        { id: 'invoicing' as ModuleId, label: 'Facturation', icon: FileSpreadsheet },
        { id: 'stocks' as ModuleId, label: 'Stocks', icon: Package },
        { id: 'immobilisations' as ModuleId, label: 'Immobilisations', icon: Building2 },
        { id: 'paie' as ModuleId, label: 'Paie', icon: Users2 },
      ]
    },
    {
      label: 'DOCUMENTS',
      items: [
        { id: 'documents' as ModuleId, label: 'GED & Justificatifs', icon: FolderOpen },
      ]
    },
    {
      label: 'INTELLIGENCE',
      items: [
        { id: 'ai' as ModuleId, label: 'FinancePro Intelligence', icon: Bot, badge: '5', badgeVariant: 'purple' },
      ]
    },
    {
      label: 'CONFORMITÉ',
      items: [
        { id: 'audit' as ModuleId, label: 'Contrôles & Audit', icon: ShieldCheck, roles: ['ADMIN', 'COMPTABLE'] as UserRole[] },
      ]
    }
  ];

  const adminCategory = {
    label: 'ADMINISTRATION',
    items: [
      { id: 'admin' as ModuleId, label: 'Paramètres', icon: Settings },
      { id: 'auth' as ModuleId, label: 'Utilisateurs & Rôles', icon: Users },
      { id: 'auth' as ModuleId, label: 'Sécurité', icon: ShieldCheck }
    ]
  };

  // Filter items based on user role
  const filterByRole = (items: any[]) => {
    return items.filter(item => !item.roles || item.roles.includes(userRole));
  };

  const getBadgeClass = (variant?: string) => {
    switch (variant) {
      case 'red':
        return 'bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full text-[9px] min-w-[16px] text-center';
      case 'orange':
        return 'bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full text-[9px] min-w-[16px] text-center';
      case 'purple':
      default:
        return 'bg-violet-600/80 text-violet-100 font-bold px-1.5 py-0.5 rounded-full text-[9px] min-w-[16px] text-center';
    }
  };

  return (
    <>
    <aside
      className={`flex flex-col select-none shadow-2xl relative z-20 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      style={{ backgroundColor: '#0B0625', minHeight: '100vh', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-6 -right-3 w-6 h-6 rounded-full bg-violet-600 text-white border border-white/20 flex items-center justify-center hover:bg-violet-500 transition-colors shadow-lg z-30"
      >
        {isCollapsed ? <Menu className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Header Info */}
      <div className="p-4 border-b border-white/5 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
            style={{ background: 'linear-gradient(135deg, #6B4EFF 0%, #8B72FF 100%)' }}
          >
            <span className="font-extrabold text-white text-base">FP</span>
          </div>
          {!isCollapsed && (
            <div>
              <div className="font-black text-white text-sm tracking-wide leading-tight">FinancePro</div>
              <div className="text-[10px] font-extrabold tracking-widest uppercase" style={{ color: '#A78BFA' }}>
                SYSCOHADA
              </div>
            </div>
          )}
        </div>

        {/* Company Dropdown */}
        {!isCollapsed && (
          <div className="relative">
            <button
              onClick={() => {
                setCompanyDropdownOpen(!companyDropdownOpen);
                setYearDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all text-xs font-semibold"
            >
              <span className="truncate">{currentCompany}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {companyDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#120C35] border border-white/10 rounded-xl shadow-2xl p-1 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
                {companies.map(c => (
                  <div
                    key={c}
                    className="relative group"
                    onMouseEnter={() => setHoveredCompany(c)}
                    onMouseLeave={() => setHoveredCompany(null)}
                  >
                    <button
                      onClick={() => {
                        setCurrentCompany(c);
                        setCompanyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 pr-8 rounded-lg text-xs hover:bg-white/10 transition-colors ${
                        currentCompany === c ? 'text-violet-400 font-bold bg-white/5' : 'text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        {c}
                      </span>
                    </button>
                    {/* Delete button — always visible on hover, hidden if only 1 company remains */}
                    {companies.length > 1 && hoveredCompany === c && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(c); }}
                        title="Supprimer cette entreprise"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => { setShowAddCompanyModal(true); setCompanyDropdownOpen(false); }}
                  className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-violet-400 hover:bg-white/10 font-bold transition-colors border-t border-white/5 mt-1"
                >
                  <Plus className="w-3 h-3" />
                  Ajouter une entreprise
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {menuCategories.map((cat) => {
          const visibleItems = filterByRole(cat.items);
          if (visibleItems.length === 0) return null;

          return (
            <div key={cat.label} className="space-y-1">
              {!isCollapsed && (
                <div className="text-[9px] font-extrabold tracking-widest text-slate-500 px-3 mb-1">
                  {cat.label}
                </div>
              )}

              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isSelectedModule = activeModule === item.id;
                const isSelectedSubTab = item.subTab !== undefined ? activeSubTab === item.subTab : true;
                const isActive = isSelectedModule && isSelectedSubTab;

                // For SYSCOHADA accounting submenu
                if (item.isSubmenuParent) {
                  return (
                    <div key={item.label} className="space-y-0.5">
                      <button
                        onClick={() => {
                          if (isCollapsed) {
                            setIsCollapsed(false);
                          }
                          setComptaMenuExpanded(!comptaMenuExpanded);
                          onSelectModule(item.id, 'dashboard');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative ${
                          isSelectedModule ? 'bg-violet-600/25 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 shrink-0 ${isSelectedModule ? 'text-violet-400' : 'text-slate-500'}`} />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>
                        {!isCollapsed && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                              comptaMenuExpanded ? 'rotate-180 text-white' : 'text-slate-500'
                            }`}
                          />
                        )}

                        {/* Collapsed Tooltip */}
                        {isCollapsed && (
                          <div className="absolute left-16 bg-slate-900 border border-white/15 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-xl hidden group-hover:block whitespace-nowrap z-40">
                            {item.label}
                          </div>
                        )}
                      </button>

                      {/* Expandable Submenu list */}
                      {!isCollapsed && comptaMenuExpanded && (
                        <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-white/5 ml-5 animate-in slide-in-from-top-1 duration-150">
                          {item.submenuItems.map((sub: any) => {
                            const isSubActive = (sub.moduleId ? activeModule === sub.moduleId : isSelectedModule) && activeSubTab === sub.subTab;
                            return (
                              <button
                                key={sub.label}
                                onClick={() => onSelectModule(sub.moduleId || item.id, sub.subTab)}
                                className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                                  isSubActive ? 'text-violet-400 font-bold bg-white/5' : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {sub.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={item.label}
                    onClick={() => onSelectModule(item.id, item.subTab)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                      isActive
                        ? 'bg-violet-600/35 text-white font-bold shadow-[inset_0_0_0_1.5px_rgba(139,92,246,0.3)]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span className={getBadgeClass(item.badgeVariant)}>{item.badge}</span>
                    )}

                    {/* Collapsed Tooltip */}
                    {isCollapsed && (
                      <div className="absolute left-16 bg-slate-900 border border-white/15 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-xl hidden group-hover:block whitespace-nowrap z-40">
                        {item.label} {item.badge && `(${item.badge})`}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Administration category */}
        <div className="pt-2 border-t border-white/5 space-y-1">
          {!isCollapsed && (
            <div className="text-[9px] font-extrabold tracking-widest text-slate-500 px-3 mb-1">
              {adminCategory.label}
            </div>
          )}
          {adminCategory.items.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.label}
                onClick={() => onSelectModule(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                  isActive
                    ? 'bg-violet-600/35 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {isCollapsed && (
                  <div className="absolute left-16 bg-slate-900 border border-white/15 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-xl hidden group-hover:block whitespace-nowrap z-40">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Notifications Popover Trigger & Badges */}
      <div className="px-3 py-1 relative">
        <button
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all relative ${
            notificationsOpen ? 'bg-white/5 text-white' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-amber-500 shrink-0" />
            {!isCollapsed && <span>Notifications</span>}
          </div>
          <span className="bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full text-[9px] min-w-[16px] text-center">
            5
          </span>
        </button>

        {/* Notifications Panel */}
        {notificationsOpen && (
          <div
            className={`absolute bottom-full left-4 bg-[#120C35] border border-white/10 rounded-2xl shadow-2xl p-4 w-64 z-35 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-150`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="font-extrabold text-white text-xs">🔔 Centre d'Alertes</span>
              <span className="text-[9px] text-slate-400 uppercase font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">5 actives</span>
            </div>
            <div className="space-y-2">
              {notifications.map((n, idx) => (
                <div key={idx} className="flex gap-2 text-[11px] text-slate-300 leading-snug">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                    n.type === 'error' ? 'bg-red-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-400'
                  }`} />
                  <span>{n.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Exercice Selector */}
      <div className="p-4 border-t border-white/5">
        {isCollapsed ? (
          <div className="flex justify-center text-slate-500">
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => {
                setYearDropdownOpen(!yearDropdownOpen);
                setCompanyDropdownOpen(false);
              }}
              className="w-full rounded-xl p-3 text-center bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all cursor-pointer block"
            >
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold">
                <span>EXERCICE ACTIF : {currentYear}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center justify-center gap-1">
                <span>Ouvert</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="mx-1">•</span>
                <span>Clôture 31/12</span>
              </div>
            </button>

            {yearDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#120C35] border border-white/10 rounded-xl shadow-2xl p-1 z-30 animate-in fade-in slide-in-from-bottom-1 duration-150">
                {years.map(y => (
                  <button
                    key={y}
                    onClick={() => {
                      setCurrentYear(y);
                      setYearDropdownOpen(false);
                    }}
                    className={`w-full text-center px-3 py-2 rounded-lg text-xs hover:bg-white/10 transition-colors ${
                      currentYear === y ? 'text-violet-400 font-bold bg-white/5' : 'text-slate-300'
                    }`}
                  >
                    Exercice {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>

      {/* ── Modal : Ajouter une entreprise ── */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0F0A2E] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10"
              style={{ background: 'linear-gradient(135deg, #6B4EFF22 0%, #8B72FF11 100%)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6B4EFF 0%, #8B72FF 100%)' }}>
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Nouvelle Entreprise</div>
                  <div className="text-slate-400 text-xs">Ajouter une entité à votre portefeuille</div>
                </div>
              </div>
              <button onClick={() => { setShowAddCompanyModal(false); setNewCompanyName(''); }}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nom de l'entreprise</label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={e => setNewCompanyName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddCompany(); }}
                  placeholder="ex: ACACIA HOLDING"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Forme juridique</label>
                <select
                  value={newCompanyType}
                  onChange={e => setNewCompanyType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all appearance-none cursor-pointer"
                  style={{ backgroundColor: '#1a1040' }}
                >
                  <option value="SARL">SARL — Société à Responsabilité Limitée</option>
                  <option value="SA">SA — Société Anonyme</option>
                  <option value="SAS">SAS — Société par Actions Simplifiée</option>
                  <option value="GROUP">GROUP — Groupe / Holding</option>
                  <option value="INVEST">INVEST — Société d'Investissement</option>
                  <option value="ONG">ONG — Organisation Non Gouvernementale</option>
                  <option value="">— Aucune (nom complet)</option>
                </select>
              </div>

              {/* Preview */}
              {newCompanyName.trim() && (
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
                  <div className="text-xs text-slate-400 mb-1">Aperçu</div>
                  <div className="text-violet-300 font-bold text-sm">
                    {newCompanyName.trim().toUpperCase()}{newCompanyType ? ` ${newCompanyType}` : ''}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
              <button
                onClick={() => { setShowAddCompanyModal(false); setNewCompanyName(''); }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleAddCompany}
                disabled={!newCompanyName.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                style={{ background: 'linear-gradient(135deg, #6B4EFF 0%, #8B72FF 100%)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : Confirmer suppression ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0F0A2E] border border-red-500/20 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-red-500/10">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">Supprimer l'entreprise</div>
                <div className="text-red-300 text-xs">Cette action est irréversible</div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-slate-300 text-sm leading-relaxed">
                Vous êtes sur le point de supprimer{' '}
                <span className="font-bold text-white">« {showDeleteConfirm} »</span>{' '}
                de votre portefeuille d'entreprises.
              </p>
              <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-amber-300 text-xs leading-relaxed">
                  ⚠️ Les données comptables de cette entité ne seront pas effacées du serveur.
                  Seul l'accès rapide depuis la sidebar sera retiré.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteCompany(showDeleteConfirm)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
  </>
  );
};

export default Sidebar;
