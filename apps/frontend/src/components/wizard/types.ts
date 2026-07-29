// =============================================================================
// Types partagés du Wizard de création d'entreprise — FinancePro OHADA
// =============================================================================

export interface Step1Data {
  companyName: string;
  logo: string; // base64 ou URL
  langue: string;
  devise: string;
  pays: string;
}

export function compressBase64Image(
  base64Str: string,
  maxWidth = 300,
  maxHeight = 300,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image')) {
      return resolve(base64Str);
    }
    if (base64Str.length < 40000) {
      return resolve(base64Str);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64Str);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
}

export interface Step2Data {
  raisonSociale: string;
  sigle: string;
  formeJuridique: string;
  rccm: string;
  nif: string;
  capital: string;
  secteur: string;
  dateCreation: string;
}

export interface Step3Data {
  adresse: string;
  ville: string;
  region: string;
  pays: string;
  telephone: string;
  email: string;
  siteWeb: string;
}

export interface Step4Data {
  exercice: string;
  dateOuverture: string;
  dateCloture: string;
  longueurComptes: number;
  decimales: number;
}

export interface Step5Data {
  regimeFiscal: string;
  centreImpots: string;
  numContribuable: string;
  assujettTVA: boolean;
  tauxTVA: string;
  retenueSource: boolean;
  is: boolean;
}

export interface Step6Data {
  banquePrincipale: string;
  numCompte: string;
  codeBanque: string;
  caissePrincipale: string;
  modesPaiement: string[];
  deviseCompte: string;
}

export interface Step7Data {
  departements: string[];
  directions: string[];
  agences: string[];
  centresCouts: string[];
  centresProfits: string[];
  projets: string[];
}

export interface InviteData {
  email: string;
  role: string;
}

export interface Step8Data {
  invites: InviteData[];
}

export interface Step9Data {
  modules: string[];
}

export interface WizardData {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  step5: Step5Data;
  step6: Step6Data;
  step7: Step7Data;
  step8: Step8Data;
  step9: Step9Data;
}

export interface StepProps {
  data: WizardData;
  onChange: (key: keyof WizardData, value: Partial<WizardData[keyof WizardData]>) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  isSubmitting?: boolean;
}

// ===== CONSTANTES OHADA =====

export const PAYS_OHADA = [
  'Bénin', 'Burkina Faso', 'Cameroun', 'Centrafrique', 'Comores', 'Congo',
  'Côte d\'Ivoire', 'Gabon', 'Guinée', 'Guinée-Bissau', 'Guinée Équatoriale',
  'Mali', 'Niger', 'RDC', 'Sénégal', 'Tchad', 'Togo',
];

export const DEVISES = [
  { code: 'XAF', label: 'XAF — Franc CFA (Afrique Centrale / CEMAC)' },
  { code: 'XOF', label: 'XOF — Franc CFA (Afrique de l\'Ouest / UEMOA)' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'USD', label: 'USD — Dollar Américain' },
  { code: 'GNF', label: 'GNF — Franc Guinéen' },
  { code: 'CDF', label: 'CDF — Franc Congolais (RDC)' },
];

export const LANGUES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'Anglais' },
  { code: 'pt', label: 'Portugais' },
];

export const FORMES_JURIDIQUES = [
  'SARL — Société à Responsabilité Limitée',
  'SA — Société Anonyme',
  'SNC — Société en Nom Collectif',
  'SUARL — Société Unipersonnelle à Responsabilité Limitée',
  'GIE — Groupement d\'Intérêt Économique',
  'EI — Entreprise Individuelle',
  'SAS — Société par Actions Simplifiée',
  'SCA — Société en Commandite par Actions',
  'SCS — Société en Commandite Simple',
  'ONG / Association',
];

export const SECTEURS = [
  'Agriculture & Élevage',
  'Mines & Ressources naturelles',
  'Pétrole & Gaz',
  'BTP & Construction',
  'Commerce & Distribution',
  'Services & Consulting',
  'Industrie & Production',
  'Transport & Logistique',
  'Finance & Banque',
  'Santé & Pharmacie',
  'Éducation & Formation',
  'Hôtellerie & Restauration',
  'Technologies & Télécom',
  'Agro-industrie',
  'Import/Export',
  'Autre',
];

export const REGIMES_FISCAUX = [
  'Réel Normal d\'Imposition',
  'Réel Simplifié d\'Imposition',
  'Régime du Forfait',
  'Régime de la Taxe Professionnelle Unique (TPU)',
];

export const TAUX_TVA = [
  { valeur: '18', label: '18% (Congo, Cameroun, Gabon, CI, Sénégal...)' },
  { valeur: '19.25', label: '19.25% (Cameroun IRPP spécifique)' },
  { valeur: '18', label: '18% (Mali, Niger)' },
  { valeur: '16', label: '16% (Tchad)' },
  { valeur: '0', label: '0% — Exonéré' },
];

export const BANQUES_CEMAC = [
  'BGFI Bank', 'Société Générale', 'ECOBANK', 'UBA', 'Orabank',
  'Crédit du Congo (LCB)', 'BICEC', 'Afriland First Bank', 'Banque Postale',
  'BDEAC', 'BNI (Banque Nationale d\'Investissement)', 'Autre',
];

export const MODES_PAIEMENT_OPTIONS = [
  'Virement bancaire', 'Chèque', 'Espèces', 'Mobile Money (MTN, Airtel...)',
  'Carte bancaire', 'Prélèvement automatique', 'Effet de commerce / LCR',
];

export const MODULES_LISTE = [
  { id: 'comptabilite', label: 'Comptabilité générale', description: 'Journal, Grand Livre, Balance', obligatoire: true, icon: '📒' },
  { id: 'analytique', label: 'Comptabilité analytique', description: 'Axes analytiques, imputations', obligatoire: false, icon: '📊' },
  { id: 'tresorerie', label: 'Trésorerie', description: 'Caisses, flux, rapprochement', obligatoire: true, icon: '💰' },
  { id: 'banque', label: 'Banque', description: 'Comptes bancaires, extraits', obligatoire: false, icon: '🏦' },
  { id: 'immobilisations', label: 'Immobilisations', description: 'Actifs, amortissements', obligatoire: false, icon: '🏗️' },
  { id: 'stocks', label: 'Stocks', description: 'Inventaire, valorisation', obligatoire: false, icon: '📦' },
  { id: 'achats', label: 'Achats', description: 'Commandes, réception, fournisseurs', obligatoire: false, icon: '🛒' },
  { id: 'ventes', label: 'Ventes', description: 'Commandes, livraisons, clients', obligatoire: false, icon: '🛍️' },
  { id: 'facturation', label: 'Facturation', description: 'Factures, avoirs, devis', obligatoire: false, icon: '🧾' },
  { id: 'budget', label: 'Budget', description: 'Prévisions, suivi des écarts', obligatoire: false, icon: '📈' },
  { id: 'paie', label: 'Paie', description: 'Bulletins de paie, cotisations', obligatoire: false, icon: '👥' },
  { id: 'fiscalite', label: 'Fiscalité', description: 'Déclarations TVA, IS, retenues', obligatoire: false, icon: '🏛️' },
  { id: 'etats', label: 'États financiers', description: 'Bilan, Compte de résultat, TAFIRE', obligatoire: true, icon: '📋' },
  { id: 'dashboard', label: 'Tableau de bord', description: 'KPIs, graphiques en temps réel', obligatoire: true, icon: '🎯' },
  { id: 'risques', label: 'Gestion des risques', description: 'Alertes, conformité', obligatoire: false, icon: '⚠️' },
  { id: 'ia', label: 'Intelligence artificielle', description: 'Analyses, prédictions, assistant', obligatoire: false, icon: '🤖' },
];

export const ROLES_UTILISATEURS = [
  { role: 'COMPTABLE', label: 'Comptable', description: 'Saisies, journaux, balance SYSCOHADA', color: 'blue' },
  { role: 'GESTIONNAIRE', label: 'Gestionnaire', description: 'Trésorerie, banque, caisse, flux', color: 'emerald' },
  { role: 'LECTEUR', label: 'Lecteur / Auditeur', description: 'Lecture seule, export des états', color: 'amber' },
];

export const AI_TIPS: Record<number, { titre: string; conseil: string }> = {
  1: {
    titre: 'Conseil — Paramétrage initial',
    conseil: 'Choisissez bien votre devise principale : elle sera utilisée pour tous vos états financiers SYSCOHADA et ne peut pas être changée facilement après la création.',
  },
  2: {
    titre: 'Conseil — Identification légale',
    conseil: 'Le RCCM et le NIU/NIF sont obligatoires pour vos déclarations fiscales et vos factures légales. Vérifiez bien leur exactitude auprès du greffe de commerce.',
  },
  3: {
    titre: 'Conseil — Coordonnées',
    conseil: 'L\'adresse de votre siège social doit correspondre exactement à celle enregistrée au RCCM. Elle apparaîtra sur toutes vos factures et états officiels.',
  },
  4: {
    titre: 'Conseil — Comptabilité',
    conseil: 'SYSCOHADA Révisé est le seul référentiel légalement reconnu dans les 17 pays OHADA. L\'exercice standard va du 01/01 au 31/12, sauf agrément spécial.',
  },
  5: {
    titre: 'Conseil — Fiscalité',
    conseil: 'Si votre chiffre d\'affaires dépasse le seuil du Réel Simplifié (varie par pays), vous êtes automatiquement soumis au Réel Normal. Vérifiez avec votre centre des impôts.',
  },
  6: {
    titre: 'Conseil — Banque & Trésorerie',
    conseil: 'Ajoutez tous vos comptes bancaires dès maintenant. FinancePro OHADA importera automatiquement vos relevés bancaires pour le rapprochement.',
  },
  7: {
    titre: 'Conseil — Organisation',
    conseil: 'Les centres de coûts et de profits permettent une comptabilité analytique précise. Définissez au moins vos départements principaux pour activer les analyses par entité.',
  },
  8: {
    titre: 'Conseil — Gestion des accès',
    conseil: 'Appliquez le principe du "moindre privilège" : chaque utilisateur ne doit avoir accès qu\'aux modules dont il a besoin pour ses tâches quotidiennes.',
  },
  9: {
    titre: 'Conseil — Modules',
    conseil: 'Vous pouvez activer ou désactiver des modules à tout moment depuis les paramètres. Commencez avec les modules essentiels et activez progressivement les autres.',
  },
  10: {
    titre: 'Vérification finale',
    conseil: 'Relisez attentivement toutes les informations avant de créer votre entreprise. Certains paramètres comptables (exercice, devise) sont difficiles à modifier après la création.',
  },
};

export const DEFAULT_WIZARD_DATA: WizardData = {
  step1: { companyName: '', logo: '', langue: 'fr', devise: 'XAF', pays: 'Congo' },
  step2: { raisonSociale: '', sigle: '', formeJuridique: 'SARL — Société à Responsabilité Limitée', rccm: '', nif: '', capital: '', secteur: '', dateCreation: '' },
  step3: { adresse: '', ville: '', region: '', pays: 'Congo', telephone: '', email: '', siteWeb: '' },
  step4: { exercice: new Date().getFullYear().toString(), dateOuverture: `${new Date().getFullYear()}-01-01`, dateCloture: `${new Date().getFullYear()}-12-31`, longueurComptes: 6, decimales: 2 },
  step5: { regimeFiscal: 'Réel Normal d\'Imposition', centreImpots: '', numContribuable: '', assujettTVA: true, tauxTVA: '18', retenueSource: true, is: true },
  step6: { banquePrincipale: '', numCompte: '', codeBanque: '', caissePrincipale: 'Caisse principale', modesPaiement: ['Virement bancaire', 'Espèces'], deviseCompte: 'XAF' },
  step7: { departements: ['Comptabilité', 'Direction Générale'], directions: [], agences: [], centresCouts: [], centresProfits: [], projets: [] },
  step8: { invites: [] },
  step9: { modules: ['comptabilite', 'tresorerie', 'etats', 'dashboard'] },
};
