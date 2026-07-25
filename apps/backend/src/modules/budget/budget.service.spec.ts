import { BudgetService } from './budget.service';

describe('BudgetService', () => {
  let budgetRepo: any;
  let accountRepo: any;
  let accountingService: { getAccountBalancesForYear: jest.Mock };
  let service: BudgetService;

  beforeEach(() => {
    budgetRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
      delete: jest.fn(),
    };
    accountRepo = { find: jest.fn().mockResolvedValue([]) };
    accountingService = { getAccountBalancesForYear: jest.fn() };
    service = new BudgetService(budgetRepo, accountRepo, accountingService as any);
  });

  describe('getComparison', () => {
    it('calcule un écart négatif quand le réel dépasse le budget (charge)', async () => {
      budgetRepo.find.mockResolvedValue([{ accountCode: '601', amountBudgeted: 1000000 }]);
      accountingService.getAccountBalancesForYear.mockResolvedValue([
        { code: '601', label: 'Achats', classNum: 6, type: 'debit', soldeDebiteur: 1500000, soldeCrediteur: 0, category: 'charges' },
      ]);
      accountRepo.find.mockResolvedValue([{ code: '601', label: 'Achats de marchandises', type: 'debit' }]);

      const rows = await service.getComparison('company-1', 2026);
      const row = rows.find((r) => r.accountCode === '601')!;

      expect(row.budgeted).toBe(1000000);
      expect(row.actual).toBe(1500000);
      expect(row.variance).toBe(500000); // dépassement
      expect(row.variancePercent).toBeCloseTo(50, 5);
    });

    it('calcule le réel correctement pour un compte de produit (sens crédit)', async () => {
      budgetRepo.find.mockResolvedValue([{ accountCode: '701', amountBudgeted: 5000000 }]);
      accountingService.getAccountBalancesForYear.mockResolvedValue([
        { code: '701', label: 'Ventes', classNum: 7, type: 'credit', soldeDebiteur: 0, soldeCrediteur: 4000000, category: 'produits' },
      ]);
      accountRepo.find.mockResolvedValue([{ code: '701', label: 'Ventes de marchandises', type: 'credit' }]);

      const rows = await service.getComparison('company-1', 2026);
      const row = rows.find((r) => r.accountCode === '701')!;

      expect(row.actual).toBe(4000000);
      expect(row.variance).toBe(-1000000); // en retrait par rapport au budget
    });

    it('retourne variancePercent = null quand aucun budget n\'a été saisi (division par zéro évitée)', async () => {
      budgetRepo.find.mockResolvedValue([]);
      accountingService.getAccountBalancesForYear.mockResolvedValue([
        { code: '626', label: 'Télécom', classNum: 6, type: 'debit', soldeDebiteur: 300000, soldeCrediteur: 0, category: 'charges' },
      ]);
      accountRepo.find.mockResolvedValue([{ code: '626', label: 'Frais de télécommunications', type: 'debit' }]);

      const rows = await service.getComparison('company-1', 2026);
      const row = rows.find((r) => r.accountCode === '626')!;

      expect(row.budgeted).toBe(0);
      expect(row.variancePercent).toBeNull();
    });

    it('cumule plusieurs lignes budgétaires mensuelles pour le même compte sur l\'exercice', async () => {
      budgetRepo.find.mockResolvedValue([
        { accountCode: '601', amountBudgeted: 100000 },
        { accountCode: '601', amountBudgeted: 200000 },
      ]);
      accountingService.getAccountBalancesForYear.mockResolvedValue([]);
      accountRepo.find.mockResolvedValue([{ code: '601', label: 'Achats', type: 'debit' }]);

      const rows = await service.getComparison('company-1', 2026);
      const row = rows.find((r) => r.accountCode === '601')!;

      expect(row.budgeted).toBe(300000);
    });
  });
});
