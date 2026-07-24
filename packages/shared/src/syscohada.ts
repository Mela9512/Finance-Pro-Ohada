export interface AccountSYSCOHADA {
  code: string;
  label: string;
  category: 'capitaux' | 'immobilisations' | 'stocks' | 'tiers' | 'tresorerie' | 'charges' | 'produits' | 'hao';
  type: 'debit' | 'credit' | 'both';
  classNum: number;
}

export const SYSCOHADA_PLAN_COMPTABLE: AccountSYSCOHADA[] = [
  // CLASSE 1 : COMPTES DE RESSOURCES DURABLES
  { code: '101', label: 'Capital social', category: 'capitaux', type: 'credit', classNum: 1 },
  { code: '102', label: 'Capital individuel', category: 'capitaux', type: 'credit', classNum: 1 },
  { code: '111', label: 'Réserve légale', category: 'capitaux', type: 'credit', classNum: 1 },
  { code: '112', label: 'Réserves statutaires ou contractuelles', category: 'capitaux', type: 'credit', classNum: 1 },
  { code: '118', label: 'Autres réserves', category: 'capitaux', type: 'credit', classNum: 1 },
  { code: '121', label: 'Report à nouveau créditeur', category: 'capitaux', type: 'credit', classNum: 1 },
  { code: '129', label: 'Report à nouveau débiteur', category: 'capitaux', type: 'debit', classNum: 1 },
  { code: '131', label: 'Résultat net de l\'exercice (Bénéfice)', category: 'capitaux', type: 'credit', classNum: 1 },
  { code: '139', label: 'Résultat net de l\'exercice (Perte)', category: 'capitaux', type: 'debit', classNum: 1 },
  { code: '161', label: 'Emprunts obligataires', category: 'capitaux', type: 'credit', classNum: 1 },
  { code: '162', label: 'Emprunts et dettes auprès des établissements de crédit', category: 'capitaux', type: 'credit', classNum: 1 },

  // CLASSE 2 : COMPTES D'ACTIF IMMOBILISÉ
  { code: '211', label: 'Frais de développement', category: 'immobilisations', type: 'debit', classNum: 2 },
  { code: '212', label: 'Brevets, licences, concessions', category: 'immobilisations', type: 'debit', classNum: 2 },
  { code: '213', label: 'Logiciels et droits assimilés', category: 'immobilisations', type: 'debit', classNum: 2 },
  { code: '222', label: 'Terrains nus', category: 'immobilisations', type: 'debit', classNum: 2 },
  { code: '231', label: 'Bâtiments industriels et commerciaux', category: 'immobilisations', type: 'debit', classNum: 2 },
  { code: '241', label: 'Matériel et outillage industriel', category: 'immobilisations', type: 'debit', classNum: 2 },
  { code: '245', label: 'Matériel de transport', category: 'immobilisations', type: 'debit', classNum: 2 },
  { code: '244', label: 'Matériel informatique', category: 'immobilisations', type: 'debit', classNum: 2 },
  { code: '2441', label: 'Matériel de bureau', category: 'immobilisations', type: 'debit', classNum: 2 },
  { code: '271', label: 'Titres de participation', category: 'immobilisations', type: 'debit', classNum: 2 },
  { code: '275', label: 'Dépôts et cautionnements versés', category: 'immobilisations', type: 'debit', classNum: 2 },
  { code: '284', label: 'Amortissements du matériel', category: 'immobilisations', type: 'credit', classNum: 2 },

  // CLASSE 3 : COMPTES DE STOCKS
  { code: '311', label: 'Marchandises A', category: 'stocks', type: 'debit', classNum: 3 },
  { code: '312', label: 'Marchandises B', category: 'stocks', type: 'debit', classNum: 3 },
  { code: '321', label: 'Matières premières', category: 'stocks', type: 'debit', classNum: 3 },
  { code: '335', label: 'Emballages', category: 'stocks', type: 'debit', classNum: 3 },
  { code: '361', label: 'Produits finis', category: 'stocks', type: 'debit', classNum: 3 },
  { code: '371', label: 'Produits en cours', category: 'stocks', type: 'debit', classNum: 3 },
  { code: '391', label: 'Dépréciations des stocks de marchandises', category: 'stocks', type: 'credit', classNum: 3 },

  // CLASSE 4 : COMPTES DE TIERS
  { code: '401', label: 'Fournisseurs de dettes en compte', category: 'tiers', type: 'credit', classNum: 4 },
  { code: '402', label: 'Fournisseurs, Effets à payer', category: 'tiers', type: 'credit', classNum: 4 },
  { code: '408', label: 'Fournisseurs, Factures non parvenues', category: 'tiers', type: 'credit', classNum: 4 },
  { code: '411', label: 'Clients, Ventes de biens et services', category: 'tiers', type: 'debit', classNum: 4 },
  { code: '412', label: 'Clients, Effets à recevoir', category: 'tiers', type: 'debit', classNum: 4 },
  { code: '416', label: 'Clients douteux ou litigieux', category: 'tiers', type: 'debit', classNum: 4 },
  { code: '421', label: 'Personnel, Rémunérations dues', category: 'tiers', type: 'credit', classNum: 4 },
  { code: '431', label: 'Sécurité Sociale (CNSS/CNPS)', category: 'tiers', type: 'credit', classNum: 4 },
  { code: '441', label: 'État, Impôts sur les bénéfices', category: 'tiers', type: 'credit', classNum: 4 },
  { code: '443', label: 'État, TVA facturée sur ventes', category: 'tiers', type: 'credit', classNum: 4 },
  { code: '445', label: 'État, TVA récupérable sur achats', category: 'tiers', type: 'debit', classNum: 4 },
  { code: '447', label: 'État, Retenues à la source (AIR/BNC)', category: 'tiers', type: 'credit', classNum: 4 },

  // CLASSE 5 : COMPTES DE TRÉSORERIE
  { code: '521', label: 'Banques locales en monnaie nationale', category: 'tresorerie', type: 'both', classNum: 5 },
  { code: '522', label: 'Banques locales en devises', category: 'tresorerie', type: 'both', classNum: 5 },
  { code: '531', label: 'Chèques à encaisser', category: 'tresorerie', type: 'debit', classNum: 5 },
  { code: '541', label: 'Caisse centrale', category: 'tresorerie', type: 'debit', classNum: 5 },
  { code: '542', label: 'Caisse secondaire (Petite caisse)', category: 'tresorerie', type: 'debit', classNum: 5 },
  { code: '571', label: 'Mobile Money (Orange / MTN / Moov / Wave)', category: 'tresorerie', type: 'both', classNum: 5 },
  { code: '585', label: 'Virements internes de fonds', category: 'tresorerie', type: 'both', classNum: 5 },

  // CLASSE 6 : COMPTES DE CHARGES
  { code: '601', label: 'Achats de marchandises', category: 'charges', type: 'debit', classNum: 6 },
  { code: '602', label: 'Achats de matières premières', category: 'charges', type: 'debit', classNum: 6 },
  { code: '604', label: 'Achats d\'études et prestations de services', category: 'charges', type: 'debit', classNum: 6 },
  { code: '605', label: 'Achats de matériel, équipements et fournitures', category: 'charges', type: 'debit', classNum: 6 },
  { code: '612', label: 'Transports sur ventes ou sur achats', category: 'charges', type: 'debit', classNum: 6 },
  { code: '622', label: 'Loyer et charges locatives', category: 'charges', type: 'debit', classNum: 6 },
  { code: '624', label: 'Entretien, réparations et maintenance', category: 'charges', type: 'debit', classNum: 6 },
  { code: '625', label: 'Primes d\'assurance', category: 'charges', type: 'debit', classNum: 6 },
  { code: '626', label: 'Frais de télécommunications et Internet', category: 'charges', type: 'debit', classNum: 6 },
  { code: '627', label: 'Services bancaires et assimilés', category: 'charges', type: 'debit', classNum: 6 },
  { code: '632', label: 'Honoraires des professionnels libéraux', category: 'charges', type: 'debit', classNum: 6 },
  { code: '641', label: 'Impôts et taxes directs', category: 'charges', type: 'debit', classNum: 6 },
  { code: '661', label: 'Rémunérations directes versées au personnel', category: 'charges', type: 'debit', classNum: 6 },
  { code: '664', label: 'Charges sociales (Cotisations patronales)', category: 'charges', type: 'debit', classNum: 6 },
  { code: '671', label: 'Intérêts des emprunts et dettes', category: 'charges', type: 'debit', classNum: 6 },
  { code: '681', label: 'Dotations aux amortissements d\'exploitation', category: 'charges', type: 'debit', classNum: 6 },

  // CLASSE 7 : COMPTES DE PRODUITS
  { code: '701', label: 'Ventes de marchandises', category: 'produits', type: 'credit', classNum: 7 },
  { code: '702', label: 'Ventes de produits finis', category: 'produits', type: 'credit', classNum: 7 },
  { code: '706', label: 'Services vendus / Prestations de services', category: 'produits', type: 'credit', classNum: 7 },
  { code: '707', label: 'Produits accessoires (Port, emballages)', category: 'produits', type: 'credit', classNum: 7 },
  { code: '754', label: 'Ristournes, rabais et remises obtenus', category: 'produits', type: 'credit', classNum: 7 },
  { code: '771', label: 'Intérêts créditeurs et produits assimilés', category: 'produits', type: 'credit', classNum: 7 },
  { code: '781', label: 'Reprises d\'amortissements et dépréciations', category: 'produits', type: 'credit', classNum: 7 },

  // CLASSE 8 : COMPTES HORS ACTIVITÉ ORDINAIRE (HAO)
  { code: '811', label: 'Valeurs comptables des cessions d\'actifs', category: 'hao', type: 'debit', classNum: 8 },
  { code: '821', label: 'Produits des cessions d\'éléments d\'actif', category: 'hao', type: 'credit', classNum: 8 },
  { code: '831', label: 'Charges H.A.O. constatées', category: 'hao', type: 'debit', classNum: 8 },
  { code: '841', label: 'Produits H.A.O. constatés', category: 'hao', type: 'credit', classNum: 8 },
  { code: '891', label: 'Impôts sur les bénéfices H.A.O.', category: 'hao', type: 'debit', classNum: 8 }
];
