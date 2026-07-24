import { 
  User, Company, JournalEntry, AccountSYSCOHADA, Customer, Supplier, Invoice, 
  TreasuryAccount, TreasuryTransaction, FinancialReportBilan, CompteDeResultat, DashboardMetrics, SYSCOHADA_PLAN_COMPTABLE 
} from '@financepro/shared';

// Base API Service with local state fallback
class ApiService {
  private isOnline = false;

  async getMetrics(): Promise<DashboardMetrics> {
    try {
      const res = await fetch('/api/dashboard/metrics');
      if (res.ok) return await res.json();
    } catch (e) {}

    return {
      chiffreAffairesMois: 42500000,
      chiffreAffairesVariation: 14.8,
      tresorerieNetteTotal: 75900000,
      creancesClientsTotal: 26100000,
      dettesFournisseursTotal: 10550000,
      bfr: 12500000,
      fdr: 35000000,
      excédentBrutExploitation: 44500000,
      fluxTrésorerieGraph: [
        { month: 'Jan', encaissements: 28000000, decaissements: 19000000 },
        { month: 'Fév', encaissements: 32000000, decaissements: 21000000 },
        { month: 'Mar', encaissements: 35000000, decaissements: 24000000 },
        { month: 'Avr', encaissements: 31000000, decaissements: 20000000 },
        { month: 'Mai', encaissements: 40000000, decaissements: 27000000 },
        { month: 'Juin', encaissements: 42500000, decaissements: 26000000 }
      ],
      ecrituresRecent: [
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
        }
      ]
    };
  }

  async getAccounts(): Promise<AccountSYSCOHADA[]> {
    try {
      const res = await fetch('/api/accounting/accounts');
      if (res.ok) return await res.json();
    } catch (e) {}
    return SYSCOHADA_PLAN_COMPTABLE;
  }

  async getEntries(): Promise<JournalEntry[]> {
    try {
      const res = await fetch('/api/accounting/entries');
      if (res.ok) return await res.json();
    } catch (e) {}
    return [
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
      }
    ];
  }
}

export const api = new ApiService();
