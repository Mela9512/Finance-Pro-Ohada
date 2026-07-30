import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Sidebar, ModuleId } from './components/Sidebar';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { ForgotPasswordScreen } from './components/ForgotPasswordScreen';
import { ResetPasswordScreen } from './components/ResetPasswordScreen';
import { AcceptInviteScreen } from './components/AcceptInviteScreen';
import { OnboardingWizard } from './components/OnboardingWizard';
import { DashboardModule } from './components/modules/DashboardModule';
import { AccountingModule } from './components/modules/AccountingModule';
import { TreasuryModule } from './components/modules/TreasuryModule';
import { ClientsModule } from './components/modules/ClientsModule';
import { SuppliersModule } from './components/modules/SuppliersModule';
import { InvoicingModule } from './components/modules/InvoicingModule';
import { ReportsModule } from './components/modules/ReportsModule';
import { FiscaliteModule } from './components/modules/FiscaliteModule';
import { ImmobilisationsModule } from './components/modules/ImmobilisationsModule';
import { StocksModule } from './components/modules/StocksModule';
import { BudgetModule } from './components/modules/BudgetModule';
import { AIModule } from './components/modules/AIModule';
import { BusinessPlanModule } from './components/modules/BusinessPlanModule';
import { AdminModule } from './components/modules/AdminModule';
import { AuthModule } from './components/modules/AuthModule';
import { AuditModule } from './components/modules/AuditModule';
import { LandingPage } from './components/LandingPage';
import { useAuth } from './context/AuthContext';

const FullScreenLoader: React.FC = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-[#F8F7FF]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-[#6B4EFF] border-t-transparent animate-spin" />
      <span className="text-[#6B4EFF] text-xs font-bold tracking-wider">FinancePro OHADA</span>
    </div>
  </div>
);

const LandingRoute: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return <FullScreenLoader />;
  if (user) return <Navigate to="/app" replace />;

  return <LandingPage onLogin={() => navigate('/login')} onSignup={() => navigate('/register')} />;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullScreenLoader />;
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
};

const AppShell: React.FC = () => {
  const { user, company, isLoading, logout } = useAuth();
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
      case 'fiscalite': return 'Fiscalité — Déclarations TVA & AIR';
      case 'immobilisations': return 'Immobilisations & amortissements';
      case 'stocks': return 'Stocks & inventaire — valorisation CUMP';
      case 'budget': return 'Budget prévisionnel & suivi des écarts';
      case 'ai': return 'Assistant IA — analyses basées sur vos données réelles';
      case 'business-plan': return 'Business Plan & levée de fonds';
      case 'admin': return 'Administration & paramètres d\'entreprise';
      case 'auth': return 'Authentification JWT & sécurité RBAC';
      case 'audit': return "Piste d'audit — historique des actions sensibles";
    }
  };

  if (isLoading) return <FullScreenLoader />;
  if (!user || !company) return <Navigate to="/login" replace />;
  if (!company.isOnboarded) return <OnboardingWizard />;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F7FF] text-slate-900">
      <Sidebar activeModule={activeModule} onSelectModule={setActiveModule} userRole={user.role} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar
          currentModule={getModuleTitle(activeModule)}
          user={user}
          company={company}
          onLogout={logout}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-[#F8F7FF]">
          {activeModule === 'dashboard' && <DashboardModule />}
          {activeModule === 'accounting' && <AccountingModule />}
          {activeModule === 'treasury' && <TreasuryModule />}
          {activeModule === 'clients' && <ClientsModule />}
          {activeModule === 'suppliers' && <SuppliersModule />}
          {activeModule === 'invoicing' && <InvoicingModule />}
          {activeModule === 'reports' && <ReportsModule />}
          {activeModule === 'fiscalite' && <FiscaliteModule />}
          {activeModule === 'immobilisations' && <ImmobilisationsModule />}
          {activeModule === 'stocks' && <StocksModule />}
          {activeModule === 'budget' && <BudgetModule />}
          {activeModule === 'ai' && <AIModule />}
          {activeModule === 'business-plan' && <BusinessPlanModule />}
          {activeModule === 'admin' && <AdminModule />}
          {activeModule === 'auth' && <AuthModule currentUser={user} />}
          {activeModule === 'audit' && (user.role === 'ADMIN' || user.role === 'COMPTABLE') && <AuditModule />}
        </main>
      </div>

      <AIAssistantWidget currentScreen={getModuleTitle(activeModule) || ''} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/login" element={<PublicOnlyRoute><LoginScreen /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterScreen /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordScreen /></PublicOnlyRoute>} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />
        <Route path="/accept-invite" element={<AcceptInviteScreen />} />
        <Route path="/app" element={<AppShell />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
