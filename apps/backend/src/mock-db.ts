import { 
  User, Company, JournalEntry, AccountSYSCOHADA, SYSCOHADA_PLAN_COMPTABLE, 
  Customer, Supplier, Invoice, TreasuryAccount, TreasuryTransaction, FinancialReportBilan, CompteDeResultat, DashboardMetrics 
} from '@financepro/shared';

export class MockDatabase {
  public static company: Company = {
    id: 'comp-1',
    name: 'SOCIÉTÉ CONGO TRADING SA',
    rccm: 'CG-BZV-01-2024-B14-00129',
    nif: 'M08241198234A',
    address: '142 Avenue de l\'Indépendance, Poto-Poto',
    city: 'Brazzaville',
    country: 'Congo',
    currency: 'XAF',
    fiscalYearStart: '2026-01-01',
    fiscalYearEnd: '2026-12-31'
  };

  public static users: User[] = [
    { id: 'usr-1', email: 'admin@financpro.ci', name: 'Alain KOUASSI', role: 'ADMIN', companyId: 'comp-1', createdAt: '2026-01-10' },
    { id: 'usr-2', email: 'comptable@financpro.ci', name: 'Fatou DIOP', role: 'COMPTABLE', companyId: 'comp-1', createdAt: '2026-01-15' },
    { id: 'usr-3', email: 'gestionnaire@financpro.ci', name: 'Marc BIKOKO', role: 'GESTIONNAIRE', companyId: 'comp-1', createdAt: '2026-02-01' }
  ];

  public static accounts: AccountSYSCOHADA[] = [...SYSCOHADA_PLAN_COMPTABLE];

  public static customers: Customer[] = [
    { id: 'cust-1', code: '411001', name: 'AFRIQUE BTP SARL', nif: 'M20231920', phone: '+242 06 612 34 56', email: 'contact@afriquebtp.cg', address: 'Avenue Foch, Centre-Ville', balance: 14500000, creditLimit: 25000000 },
    { id: 'cust-2', code: '411002', name: 'DISTRIB LOGISTIQUE SA', nif: 'M20234411', phone: '+242 05 520 88 99', email: 'finance@distriblog.cg', address: 'Zone Industrielle Mpila', balance: 8200000, creditLimit: 15000000 },
    { id: 'cust-3', code: '411003', name: 'PHARMACIE DE LA PAIX', nif: 'M20228834', phone: '+242 06 444 11 22', email: 'commandes@pharmaciepaix.cg', address: 'Bacongo', balance: 3400000, creditLimit: 5000000 }
  ];

  public static suppliers: Supplier[] = [
    { id: 'supp-1', code: '401001', name: 'TOTAL ENERGIES MARKETING', nif: 'M20201010', phone: '+242 06 800 00 00', email: 'pro@totalenergies.cg', address: 'Pointe-Noire', balance: 6800000 },
    { id: 'supp-2', code: '401002', name: 'TELECOM AFRIQUE (MTN)', nif: 'M20212233', phone: '+242 06 600 11 22', email: 'corporate@mtn.cg', address: 'Brazzaville', balance: 1250000 },
    { id: 'supp-3', code: '401003', name: 'CABINET FIDUCIAIRE OHADA', nif: 'M20229900', phone: '+242 05 555 44 33', email: 'audit@fiduciaireohada.cg', address: 'Centre-Ville', balance: 2500000 }
  ];

  public static treasuryAccounts: TreasuryAccount[] = [
    { id: 'tr-1', code: '521001', name: 'BGFI Bank Congo', type: 'BANQUE', accountNumber: '10004 00129 982341-89', rib: 'BGFI-CG-01-9823', currency: 'XAF', balance: 48500000 },
    { id: 'tr-2', code: '521002', name: 'Ecobank Congo', type: 'BANQUE', accountNumber: '10012 00045 119842-12', rib: 'ECO-CG-02-1198', currency: 'XAF', balance: 22100000 },
    { id: 'tr-3', code: '541001', name: 'Caisse Principale Siège', type: 'CAISSE', currency: 'XAF', balance: 3450000 },
    { id: 'tr-4', code: '571001', name: 'MTN Mobile Money Pro', type: 'MOBILE_MONEY', accountNumber: '+242066123456', currency: 'XAF', balance: 1850000 }
  ];

  public static invoices: Invoice[] = [
    {
      id: 'inv-101',
      invoiceNumber: 'FAC-2026-001',
      type: 'VENTE',
      tierId: 'cust-1',
      tierName: 'AFRIQUE BTP SARL',
      date: '2026-06-15',
      dueDate: '2026-07-15',
      items: [
        { id: 'item-1', description: 'Fourniture de matériaux de construction de génie civil', quantity: 100, unitPrice: 100000, tvaRate: 18, totalHT: 10000000, totalTVA: 1800000, totalTTC: 11800000, accountCode: '701' }
      ],
      subtotalHT: 10000000,
      totalTVA: 1800000,
      airRate: 2,
      totalAIR: 200000,
      totalTTC: 11800000,
      amountPaid: 5000000,
      status: 'PARTIEL'
    },
    {
      id: 'inv-102',
      invoiceNumber: 'FAC-2026-002',
      type: 'VENTE',
      tierId: 'cust-2',
      tierName: 'DISTRIB LOGISTIQUE SA',
      date: '2026-07-02',
      dueDate: '2026-08-02',
      items: [
        { id: 'item-2', description: 'Prestation de conseil logistique & audit financier', quantity: 1, unitPrice: 7500000, tvaRate: 18, totalHT: 7500000, totalTVA: 1350000, totalTTC: 8850000, accountCode: '706' }
      ],
      subtotalHT: 7500000,
      totalTVA: 1350000,
      airRate: 5,
      totalAIR: 375000,
      totalTTC: 8850000,
      amountPaid: 8850000,
      status: 'PAYE'
    }
  ];

  public static journalEntries: JournalEntry[] = [
    {
      id: 'entry-1',
      entryNumber: 'VT-2026-0001',
      date: '2026-06-15',
      journalType: 'VENTES',
      wording: 'Facture Vente N° FAC-2026-001 - AFRIQUE BTP',
      pieceNumber: 'FAC-2026-001',
      lines: [
        { id: 'l1', accountCode: '411', accountLabel: 'Clients, Ventes de biens', debit: 11800000, credit: 0 },
        { id: 'l2', accountCode: '701', accountLabel: 'Ventes de marchandises', debit: 0, credit: 10000000 },
        { id: 'l3', accountCode: '443', accountLabel: 'État, TVA facturée sur ventes', debit: 0, credit: 1800000 }
      ],
      isValidated: true,
      createdBy: 'Alain KOUASSI',
      createdAt: '2026-06-15 10:30'
    },
    {
      id: 'entry-2',
      entryNumber: 'BQ-2026-0012',
      date: '2026-06-20',
      journalType: 'BANQUE',
      wording: 'Règlement partiel client AFRIQUE BTP par virement BGFI',
      pieceNumber: 'VIR-98234',
      lines: [
        { id: 'l4', accountCode: '521', accountLabel: 'Banques locales (BGFI)', debit: 5000000, credit: 0 },
        { id: 'l5', accountCode: '411', accountLabel: 'Clients, Ventes de biens', debit: 0, credit: 5000000 }
      ],
      isValidated: true,
      createdBy: 'Fatou DIOP',
      createdAt: '2026-06-20 14:15'
    },
    {
      id: 'entry-3',
      entryNumber: 'AC-2026-0045',
      date: '2026-07-05',
      journalType: 'ACHATS',
      wording: 'Facture Achat Honoraires Audit - CABINET FIDUCIAIRE',
      pieceNumber: 'FAC-FID-99',
      lines: [
        { id: 'l6', accountCode: '632', accountLabel: 'Honoraires des professionnels', debit: 2500000, credit: 0 },
        { id: 'l7', accountCode: '445', accountLabel: 'État, TVA récupérable', debit: 450000, credit: 0 },
        { id: 'l8', accountCode: '401', accountLabel: 'Fournisseurs de dettes', debit: 0, credit: 2950000 }
      ],
      isValidated: true,
      createdBy: 'Fatou DIOP',
      createdAt: '2026-07-05 11:00'
    }
  ];

  public static treasuryTransactions: TreasuryTransaction[] = [
    {
      id: 'tx-1',
      treasuryAccountId: 'tr-1',
      treasuryAccountName: 'BGFI Bank Congo',
      date: '2026-06-20',
      type: 'ENCAISSEMENT',
      category: 'Règlement Client',
      amount: 5000000,
      reference: 'VIR-BGFI-9823',
      tierName: 'AFRIQUE BTP SARL',
      status: 'RAPPROCHE',
      description: 'Acompte facture FAC-2026-001'
    },
    {
      id: 'tx-2',
      treasuryAccountId: 'tr-1',
      treasuryAccountName: 'BGFI Bank Congo',
      date: '2026-07-01',
      type: 'DECAISSEMENT',
      category: 'Paiement Fournisseur',
      amount: 2500000,
      reference: 'CHQ-001923',
      tierName: 'TOTAL ENERGIES MARKETING',
      status: 'RAPPROCHE',
      description: 'Règlement carburant flotte véhicules'
    }
  ];
}
