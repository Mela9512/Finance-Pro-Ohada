import React from 'react';
import { Bell, Search, LogOut, Filter, RefreshCw, ChevronDown } from 'lucide-react';
import { UserRole } from '@financepro/shared';

interface NavbarProps {
  currentModule: string;
  user: { name: string; email: string; role: UserRole };
  company: { name: string; rccm?: string; nif?: string; currency: string };
  onLogout: () => void;
}

const roleLabel: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  COMPTABLE: 'Comptable',
  GESTIONNAIRE: 'Gestionnaire',
  LECTEUR: 'Lecteur',
};

const roleColor: Record<UserRole, string> = {
  ADMIN: '#6B4EFF',
  COMPTABLE: '#10B981',
  GESTIONNAIRE: '#F59E0B',
  LECTEUR: '#6B7280',
};

export const Navbar: React.FC<NavbarProps> = ({ currentModule, user, company, onLogout }) => {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header
      className="h-16 flex items-center justify-between px-6 sticky top-0 z-30"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #EDE9FE',
        boxShadow: '0 1px 8px rgba(107,78,255,0.06)',
      }}
    >
      {/* Gauche : Titre + fil d'Ariane */}
      <div className="flex flex-col justify-center">
        <h1 className="text-lg font-extrabold leading-tight" style={{ color: '#1E1060' }}>
          {currentModule}
        </h1>
        <div className="text-[11px] font-medium" style={{ color: '#9CA3AF' }}>
          <span style={{ color: '#6B4EFF', fontWeight: 600 }}>{company.name}</span>
          {' · '}Norme SYSCOHADA Révisé
          {company.currency && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: '#F3F0FF', color: '#6B4EFF' }}>
              {company.currency}
            </span>
          )}
        </div>
      </div>

      {/* Centre : Barre de recherche */}
      <div className="hidden lg:flex items-center gap-2 mx-8 flex-1 max-w-xs">
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: '#9CA3AF' }}
          />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-none transition-all"
            style={{
              background: '#F8F7FF',
              border: '1.5px solid #EDE9FE',
              color: '#1E1060',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#6B4EFF')}
            onBlur={(e) => (e.target.style.borderColor = '#EDE9FE')}
          />
        </div>
        <button
          className="p-2 rounded-xl border transition-colors"
          style={{ background: '#F8F7FF', border: '1.5px solid #EDE9FE', color: '#6B4EFF' }}
          title="Filtrer"
        >
          <Filter className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Droite : Actions + Profil */}
      <div className="flex items-center gap-3">
        {/* Bouton actualiser */}
        <button
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: '#EDE9FE', color: '#6B4EFF', border: '1.5px solid #DDD6FE' }}
          title="Actualiser"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Actualiser</span>
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-xl transition-colors"
          style={{ background: '#F8F7FF', border: '1.5px solid #EDE9FE' }}
          title="Notifications"
        >
          <Bell className="w-4 h-4" style={{ color: '#6B4EFF' }} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-ping"
            style={{ background: '#EF4444' }}
          />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: '#EF4444' }}
          />
        </button>

        {/* Séparateur */}
        <div className="h-8 w-px" style={{ background: '#EDE9FE' }} />

        {/* Profil utilisateur */}
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs text-white shadow-md"
            style={{ background: 'linear-gradient(135deg, #6B4EFF 0%, #8B72FF 100%)' }}
          >
            {initials}
          </div>
          {/* Nom + rôle */}
          <div className="hidden sm:block">
            <div className="text-xs font-bold leading-tight" style={{ color: '#1E1060' }}>
              {user.name}
            </div>
            <div
              className="text-[10px] font-semibold"
              style={{ color: roleColor[user.role] }}
            >
              {roleLabel[user.role]}
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 hidden sm:block" style={{ color: '#9CA3AF' }} />
        </div>

        {/* Bouton déconnexion */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: '#FEF2F2', color: '#EF4444', border: '1.5px solid #FECACA' }}
          title="Se déconnecter"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
