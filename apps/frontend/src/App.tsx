import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ModuleId } from './components/Sidebar';
import { DashboardModule } from './components/modules/DashboardModule';
import { AccountingModule } from './components/modules/AccountingModule';
import { TreasuryModule } from './components/modules/TreasuryModule';
import { ClientsModule } from './components/modules/ClientsModule';
import { SuppliersModule } from './components/modules/SuppliersModule';
import { InvoicingModule } from './components/modules/InvoicingModule';
import { ReportsModule } from './components/modules/ReportsModule';
import { AdminModule } from './components/modules/AdminModule';
import { AuthModule } from './components/modules/AuthModule';
import { UserRole } from '@financepro/shared';

export const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [currentUser, setCurrentUser] = useState({
    name: 'Alain KOUASSI',
    email: 'admin@financpro.ci',
    role: 'ADMIN' as UserRole
  });

  const company = {
    name: 'SOCIÉTÉ CONGO TRADING SA',
    rccm: 'CG-BZV-01-2024-B14-00129',
    nif: 'M08241198234A',
    currency: 'XAF'
  };

  const handleSwitchUserRole = (role: UserRole) => {
    setCurrentUser(prev => ({ ...prev, role }));
  };

  const getModuleTitle = (id: ModuleId) => {
    switch (id) {
      case 'dashboard': return 'Tableau de bord financier & KPIs';
      case 'accounting': return 'Comptabilité générale SYSCOHADA';
      case 'treasury': return 'Trésorerie, Banques & Caisses';
      case 'clients': return 'Gestion des clients & créances';
      case 'suppliers': return 'Gestion des fournisseurs & dettes';
      case 'invoicing': return 'Facturation & retenues fiscales (TVA/AIR)';
      case 'reports': return 'États financiers OHADA (Bilan & Compte de Résultat)';
      case 'admin': return 'Administration & paramètres d\'entreprise';
      case 'auth': return 'Authentification JWT & sécurité RBAC';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <Sidebar 
        activeModule={activeModule} 
        onSelectModule={setActiveModule} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Navbar */}
        <Navbar 
          currentModule={getModuleTitle(activeModule)}
          user={currentUser}
          company={company}
          onSwitchUserRole={handleSwitchUserRole}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          {activeModule === 'dashboard' && <DashboardModule />}
          {activeModule === 'accounting' && <AccountingModule />}
          {activeModule === 'treasury' && <TreasuryModule />}
          {activeModule === 'clients' && <ClientsModule />}
          {activeModule === 'suppliers' && <SuppliersModule />}
          {activeModule === 'invoicing' && <InvoicingModule />}
          {activeModule === 'reports' && <ReportsModule />}
          {activeModule === 'admin' && <AdminModule />}
          {activeModule === 'auth' && <AuthModule currentUser={currentUser} onSwitchUserRole={handleSwitchUserRole} />}
        </main>
      </div>
    </div>
  );
};

export default App;
