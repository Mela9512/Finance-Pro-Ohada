import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Sidebar, ModuleId } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { DashboardModule } from './components/modules/DashboardModule';
import { AccountingModule } from './components/modules/AccountingModule';
import { TreasuryModule } from './components/modules/TreasuryModule';
import { ClientsModule } from './components/modules/ClientsModule';
import { SuppliersModule } from './components/modules/SuppliersModule';
import { InvoicingModule } from './components/modules/InvoicingModule';
import { ReportsModule } from './components/modules/ReportsModule';
import { BudgetModule } from './components/modules/BudgetModule';
import { AdminModule } from './components/modules/AdminModule';
import { AuthModule } from './components/modules/AuthModule';
import { LandingPage } from './components/LandingPage';
import { useAuth } from './context/AuthContext';

export const App: React.FC = () => {
  const { user, company, isLoading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');

  const getModuleTitle = (id: ModuleId) => {
    switch (id) {
      case 'dashboard': return 'Tableau de bord financier & KPIs';
      case 'accounting': return 'Comptabilité générale SYSCOHADA';
      case 'treasury': return 'Trésorerie, Banques & Caisses';
      case 'clients': return 'Gestion des clients & créances';
      case 'suppliers': return 'Gestion des fournisseurs & dettes';
      case 'invoicing': return 'Facturation & retenues fiscales (TVA/AIR)';
      case 'reports': return 'États financiers OHADA (Bilan & Compte de Résultat)';
      case 'budget': return 'Budget prévisionnel & suivi des écarts';
      case 'admin': return 'Administration & paramètres d\'entreprise';
      case 'auth': return 'Authentification JWT & sécurité RBAC';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // If view is landing page, show Landing Page
  if (currentView === 'landing') {
    return <LandingPage onLaunchApp={() => setCurrentView('app')} />;
  }

  // If not logged in when entering app view, prompt login
  if (!user || !company) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-2 bg-slate-900/90 border-b border-slate-800 text-xs">
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
          >
            <span>← Voir la Landing Page</span>
          </button>
          <span className="text-slate-400 font-medium">Session SaaS FinancePro OHADA Active</span>
        </div>

        <Navbar
          currentModule={getModuleTitle(activeModule)}
          user={user}
          company={company}
          onLogout={logout}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          {activeModule === 'dashboard' && <DashboardModule />}
          {activeModule === 'accounting' && <AccountingModule />}
          {activeModule === 'treasury' && <TreasuryModule />}
          {activeModule === 'clients' && <ClientsModule />}
          {activeModule === 'suppliers' && <SuppliersModule />}
          {activeModule === 'invoicing' && <InvoicingModule />}
          {activeModule === 'reports' && <ReportsModule />}
          {activeModule === 'budget' && <BudgetModule />}
          {activeModule === 'admin' && <AdminModule />}
          {activeModule === 'auth' && <AuthModule currentUser={user} />}
        </main>
      </div>
    </div>
  );
};

export default App;
