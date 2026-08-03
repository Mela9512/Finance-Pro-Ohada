import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../services/api';
import { WizardLayout } from './wizard/WizardLayout';
import { Step1Welcome } from './wizard/Step1Welcome';
import { Step2Identification } from './wizard/Step2Identification';
import { Step3Coordonnees } from './wizard/Step3Coordonnees';
import { Step4Comptabilite } from './wizard/Step4Comptabilite';
import { Step5Fiscalite } from './wizard/Step5Fiscalite';
import { Step6Banque } from './wizard/Step6Banque';
import { Step7Organisation } from './wizard/Step7Organisation';
import { Step8Utilisateurs } from './wizard/Step8Utilisateurs';
import { Step9Modules } from './wizard/Step9Modules';
import { Step10Validation } from './wizard/Step10Validation';
import { WizardData, DEFAULT_WIZARD_DATA, compressBase64Image } from './wizard/types';

const STORAGE_KEY = 'financepro_wizard_data';
const STORAGE_STEP_KEY = 'financepro_wizard_step';

export const OnboardingWizard: React.FC = () => {
  const { company, refreshCompany } = useAuth();

  // Restore from localStorage if available
  const loadSaved = (): WizardData => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WizardData;
        return { ...DEFAULT_WIZARD_DATA, ...parsed };
      }
    } catch { /* ignore */ }
    // Pre-fill companyName from existing company data
    return {
      ...DEFAULT_WIZARD_DATA,
      step1: {
        ...DEFAULT_WIZARD_DATA.step1,
        companyName: company?.name || '',
      },
    };
  };

  const loadSavedStep = (): number => {
    try {
      const saved = localStorage.getItem(STORAGE_STEP_KEY);
      if (saved) return Math.max(1, Math.min(10, parseInt(saved, 10)));
    } catch { /* ignore */ }
    return 1;
  };

  const [currentStep, setCurrentStep] = useState<number>(loadSavedStep);
  const [wizardData, setWizardData] = useState<WizardData>(loadSaved);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-save to localStorage (debounced to avoid main thread lag on keypress)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wizardData));
        localStorage.setItem(STORAGE_STEP_KEY, String(currentStep));
      } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [wizardData, currentStep]);

  // Clean legacy large logo from localStorage/state if any exists
  useEffect(() => {
    if (wizardData.step1.logo && wizardData.step1.logo.length > 40000) {
      compressBase64Image(wizardData.step1.logo, 300, 300, 0.75).then((compressed) => {
        if (compressed !== wizardData.step1.logo) {
          handleChange('step1', { logo: compressed });
        }
      });
    }
  }, []);

  const handleChange = useCallback(<K extends keyof WizardData>(
    key: K,
    value: Partial<WizardData[K]>
  ) => {
    setWizardData(prev => ({
      ...prev,
      [key]: { ...prev[key], ...value },
    }));
  }, []);

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < 10) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Final submission — map wizard data to Company fields for API
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { step1, step2, step3, step4, step5, step6, step7, step9 } = wizardData;

      // Compress logo if it's base64 to ensure payload stays under 50KB
      const logoCompressed = step1.logo ? await compressBase64Image(step1.logo, 300, 300, 0.75) : undefined;

      const payload = {
        // Basic info
        name: step1.companyName || company?.name,
        logo: logoCompressed,
        country: step1.pays,
        currency: step1.devise,
        language: step1.langue,

        // Identification
        legalName: step2.raisonSociale || step1.companyName,
        legalForm: step2.formeJuridique,
        rccm: step2.rccm || undefined,
        nif: step2.nif || undefined,
        capital: step2.capital ? Number(step2.capital) : undefined,
        sector: step2.secteur || undefined,
        incorporationDate: step2.dateCreation || undefined,

        // Address
        address: step3.adresse || undefined,
        city: step3.ville || undefined,
        region: step3.region || undefined,
        phone: step3.telephone || undefined,
        email: step3.email || undefined,
        website: step3.siteWeb || undefined,

        // Accounting
        fiscalYear: step4.exercice ? Number(step4.exercice) : new Date().getFullYear(),
        fiscalYearStart: step4.dateOuverture || undefined,
        fiscalYearEnd: step4.dateCloture || undefined,
        accountLength: step4.longueurComptes,
        decimals: step4.decimales,

        // Tax
        taxRegime: step5.regimeFiscal || undefined,
        taxCenter: step5.centreImpots || undefined,
        taxNumber: step5.numContribuable || undefined,
        vatEnabled: step5.assujettTVA,
        vatRate: step5.assujettTVA ? Number(step5.tauxTVA) : undefined,
        withholdingTax: step5.retenueSource,
        corporateTax: step5.is,

        // Bank
        bankName: step6.banquePrincipale || undefined,
        bankAccount: step6.numCompte || undefined,
        bankCode: step6.codeBanque || undefined,
        cashName: step6.caissePrincipale || undefined,
        paymentMethods: step6.modesPaiement,
        bankCurrency: step6.deviseCompte || step1.devise,

        // Org
        departments: step7.departements,
        directions: step7.directions,
        branches: step7.agences,
        costCenters: step7.centresCouts,
        profitCenters: step7.centresProfits,
        projects: step7.projets,

        // Modules
        enabledModules: step9.modules,
      };

      await api.completeOnboarding(payload);

      // Clear localStorage after successful submission
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_STEP_KEY);

      await refreshCompany();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Erreur lors de la création de l\'entreprise. Veuillez réessayer.');
      setIsSubmitting(false);
    }
  };

  const stepProps = {
    data: wizardData,
    onChange: handleChange,
    onNext: handleNext,
    onPrev: handlePrev,
  };

  return (
    <WizardLayout currentStep={currentStep} completedSteps={completedSteps}>
      {submitError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold">
          ⚠️ {submitError}
        </div>
      )}

      {currentStep === 1 && <Step1Welcome {...stepProps} isFirst />}
      {currentStep === 2 && <Step2Identification {...stepProps} />}
      {currentStep === 3 && <Step3Coordonnees {...stepProps} />}
      {currentStep === 4 && <Step4Comptabilite {...stepProps} />}
      {currentStep === 5 && <Step5Fiscalite {...stepProps} />}
      {currentStep === 6 && <Step6Banque {...stepProps} />}
      {currentStep === 7 && <Step7Organisation {...stepProps} />}
      {currentStep === 8 && <Step8Utilisateurs {...stepProps} />}
      {currentStep === 9 && <Step9Modules {...stepProps} />}
      {currentStep === 10 && (
        <Step10Validation
          {...stepProps}
          onGoToStep={goToStep}
          onNext={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </WizardLayout>
  );
};

export default OnboardingWizard;
