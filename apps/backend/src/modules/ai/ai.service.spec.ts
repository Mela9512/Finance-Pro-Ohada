import { AiService } from './ai.service';

function makeQueryBuilderMock(rawManyResult: any[] = [], rawOneResult: any = null) {
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rawManyResult),
    getRawOne: jest.fn().mockResolvedValue(rawOneResult),
  };
  return qb;
}

function makeRepoMock(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    createQueryBuilder: jest.fn(),
    ...overrides,
  };
}

describe('AiService', () => {
  let aiProvider: { generateText: jest.Mock; generateJson: jest.Mock; generateJsonFromFile: jest.Mock };
  let accountRepo: ReturnType<typeof makeRepoMock>;
  let lineRepo: ReturnType<typeof makeRepoMock>;
  let invoiceRepo: ReturnType<typeof makeRepoMock>;
  let customerRepo: ReturnType<typeof makeRepoMock>;
  let supplierRepo: ReturnType<typeof makeRepoMock>;
  let treasuryAccountRepo: ReturnType<typeof makeRepoMock>;
  let accountingService: { getBalanceGenerale: jest.Mock; getAccountBalancesForYear: jest.Mock };
  let reportsService: { getBilan: jest.Mock; getCompteDeResultat: jest.Mock; getCompteDeResultatForYear: jest.Mock };
  let budgetService: { getComparison: jest.Mock };
  let service: AiService;

  beforeEach(() => {
    aiProvider = { generateText: jest.fn().mockResolvedValue('analyse IA'), generateJson: jest.fn(), generateJsonFromFile: jest.fn() };
    accountRepo = makeRepoMock();
    lineRepo = makeRepoMock();
    invoiceRepo = makeRepoMock();
    customerRepo = makeRepoMock();
    supplierRepo = makeRepoMock();
    treasuryAccountRepo = makeRepoMock();
    accountingService = { getBalanceGenerale: jest.fn(), getAccountBalancesForYear: jest.fn().mockResolvedValue([]) };
    reportsService = { getBilan: jest.fn(), getCompteDeResultat: jest.fn(), getCompteDeResultatForYear: jest.fn() };
    budgetService = { getComparison: jest.fn().mockResolvedValue([]) };

    service = new AiService(
      aiProvider as any,
      accountRepo as any,
      lineRepo as any,
      invoiceRepo as any,
      customerRepo as any,
      supplierRepo as any,
      treasuryAccountRepo as any,
      accountingService as any,
      reportsService as any,
      budgetService as any,
    );
  });

  describe('detectAnomalies', () => {
    it('signale des factures en double détectées par la requête groupée', async () => {
      invoiceRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilderMock([
          { tierName: 'CLIENT X', totalTTC: '100000', date: '2026-07-01', invoiceNumbers: 'VT-2026-0001, VT-2026-0002' },
        ]),
      );
      customerRepo.find.mockResolvedValue([]);

      const { anomalies } = await service.detectAnomalies('company-1');

      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].type).toBe('DUPLICATE_INVOICE');
      expect(anomalies[0].message).toContain('CLIENT X');
    });

    it("signale un dépassement de limite de crédit calculé depuis l'encours réel des factures non soldées", async () => {
      invoiceRepo.createQueryBuilder.mockImplementation(() => {
        // Premier appel (doublons) : liste vide. Deuxième appel (encours client) : total renvoyé.
        const calls = invoiceRepo.createQueryBuilder.mock.calls.length;
        return calls === 1 ? makeQueryBuilderMock([]) : makeQueryBuilderMock([], { total: '6000000' });
      });
      customerRepo.find.mockResolvedValue([{ id: 'c1', name: 'CLIENT Y', creditLimit: 5000000 }]);

      const { anomalies } = await service.detectAnomalies('company-1');

      expect(anomalies.some((a) => a.type === 'CREDIT_LIMIT_EXCEEDED' && a.message.includes('CLIENT Y'))).toBe(true);
    });

    it('ne signale rien quand la limite de crédit est à 0 (non définie)', async () => {
      invoiceRepo.createQueryBuilder.mockReturnValue(makeQueryBuilderMock([]));
      customerRepo.find.mockResolvedValue([{ id: 'c1', name: 'CLIENT Z', creditLimit: 0 }]);

      const { anomalies } = await service.detectAnomalies('company-1');

      expect(anomalies.filter((a) => a.type === 'CREDIT_LIMIT_EXCEEDED')).toHaveLength(0);
    });

    it("signale un écart budgétaire supérieur au seuil de 20%", async () => {
      invoiceRepo.createQueryBuilder.mockReturnValue(makeQueryBuilderMock([]));
      customerRepo.find.mockResolvedValue([]);
      budgetService.getComparison.mockResolvedValue([
        { accountCode: '601', label: 'Achats', budgeted: 1000000, actual: 1500000, variance: 500000, variancePercent: 50 },
        { accountCode: '622', label: 'Loyers', budgeted: 200000, actual: 210000, variance: 10000, variancePercent: 5 },
      ]);

      const { anomalies } = await service.detectAnomalies('company-1');

      expect(anomalies.filter((a) => a.type === 'BUDGET_VARIANCE')).toHaveLength(1);
      expect(anomalies[0].message).toContain('601');
    });

    it("ne génère pas de synthèse IA quand aucune anomalie n'est détectée (évite un appel inutile)", async () => {
      invoiceRepo.createQueryBuilder.mockReturnValue(makeQueryBuilderMock([]));
      customerRepo.find.mockResolvedValue([]);

      const { anomalies, analyseIA } = await service.detectAnomalies('company-1');

      expect(anomalies).toHaveLength(0);
      expect(analyseIA).toBeNull();
      expect(aiProvider.generateText).not.toHaveBeenCalled();
    });
  });

  describe('getCashflowForecast', () => {
    const baseInvoice = (overrides: Partial<any>) => ({
      type: 'VENTE',
      status: 'VALIDE',
      totalTTC: 0,
      amountPaid: 0,
      dueDate: '2026-01-01',
      ...overrides,
    });

    it('classe les créances clients (VENTE) en entrées et les dettes fournisseurs (ACHAT) en sorties', async () => {
      treasuryAccountRepo.find.mockResolvedValue([{ balance: 1000000 }]);
      const today = new Date();
      const in15days = new Date(today.getTime() + 15 * 86400000).toISOString().substring(0, 10);

      invoiceRepo.find.mockResolvedValue([
        baseInvoice({ type: 'VENTE', totalTTC: 500000, amountPaid: 0, dueDate: in15days }),
        baseInvoice({ type: 'ACHAT', totalTTC: 200000, amountPaid: 0, dueDate: in15days }),
      ]);

      const forecast = await service.getCashflowForecast('company-1');

      expect(forecast.soldeActuel).toBe(1000000);
      expect(forecast.horizon30.entrees).toBe(500000);
      expect(forecast.horizon30.sorties).toBe(200000);
      expect(forecast.horizon30.soldeProjete).toBe(1000000 + 500000 - 200000);
    });

    it('ignore les factures déjà entièrement soldées (totalTTC - amountPaid <= 0)', async () => {
      treasuryAccountRepo.find.mockResolvedValue([{ balance: 0 }]);
      const today = new Date();
      const in10days = new Date(today.getTime() + 10 * 86400000).toISOString().substring(0, 10);

      invoiceRepo.find.mockResolvedValue([baseInvoice({ totalTTC: 100000, amountPaid: 100000, dueDate: in10days })]);

      const forecast = await service.getCashflowForecast('company-1');

      expect(forecast.horizon30.entrees).toBe(0);
    });

    it('place une échéance à 45 jours dans le bucket 60 jours et pas dans le bucket 30 jours', async () => {
      treasuryAccountRepo.find.mockResolvedValue([{ balance: 0 }]);
      const today = new Date();
      const in45days = new Date(today.getTime() + 45 * 86400000).toISOString().substring(0, 10);

      invoiceRepo.find.mockResolvedValue([baseInvoice({ totalTTC: 300000, amountPaid: 0, dueDate: in45days })]);

      const forecast = await service.getCashflowForecast('company-1');

      expect(forecast.horizon30.entrees).toBe(0);
      expect(forecast.horizon60.entrees).toBe(300000);
    });

    it('ignore les échéances au-delà de 90 jours (hors horizon de prévision)', async () => {
      treasuryAccountRepo.find.mockResolvedValue([{ balance: 0 }]);
      const today = new Date();
      const in120days = new Date(today.getTime() + 120 * 86400000).toISOString().substring(0, 10);

      invoiceRepo.find.mockResolvedValue([baseInvoice({ totalTTC: 999999, amountPaid: 0, dueDate: in120days })]);

      const forecast = await service.getCashflowForecast('company-1');

      expect(forecast.horizon30.entrees + forecast.horizon60.entrees + forecast.horizon90.entrees).toBe(0);
    });
  });

  describe('getClientsRiskAnalysis', () => {
    it('calcule le risque à partir des factures VENTE réellement échues (pas du champ balance jamais mis à jour)', async () => {
      customerRepo.find.mockResolvedValue([
        { id: 'c1', name: 'CLIENT A', creditLimit: 1000000 },
        { id: 'c2', name: 'CLIENT B', creditLimit: 0 },
      ]);
      invoiceRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilderMock([{ tierId: 'c1', outstanding: '1500000', overdue: '1200000', overdueCount: '3' }]),
      );

      const { clients } = await service.getClientsRiskAnalysis('company-1');

      const clientA = clients.find((c) => c.customerId === 'c1')!;
      expect(clientA.outstandingTotal).toBe(1500000);
      expect(clientA.overdueTotal).toBe(1200000);
      expect(clientA.riskLevel).toBe('ELEVE'); // ratio > 1 et >= 3 factures

      const clientB = clients.find((c) => c.customerId === 'c2')!;
      expect(clientB.riskLevel).toBe('AUCUN');
    });

    it("ne génère pas de synthèse IA quand aucun client n'est à risque", async () => {
      customerRepo.find.mockResolvedValue([{ id: 'c1', name: 'CLIENT A', creditLimit: 1000000 }]);
      invoiceRepo.createQueryBuilder.mockReturnValue(makeQueryBuilderMock([]));

      const { analyseIA } = await service.getClientsRiskAnalysis('company-1');

      expect(analyseIA).toBeNull();
      expect(aiProvider.generateText).not.toHaveBeenCalled();
    });
  });

  describe('getSuppliersOverdueAnalysis', () => {
    it('calcule les dettes fournisseurs réellement en retard depuis les factures ACHAT', async () => {
      supplierRepo.find.mockResolvedValue([{ id: 's1', name: 'FOURNISSEUR X' }]);
      invoiceRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilderMock([{ tierId: 's1', outstanding: '500000', overdue: '500000', overdueCount: '2' }]),
      );

      const { suppliers } = await service.getSuppliersOverdueAnalysis('company-1');

      expect(suppliers[0].overdueTotal).toBe(500000);
      expect(suppliers[0].riskLevel).toBe('MOYEN'); // >= 2 factures, pas de limite de crédit fournisseur
    });
  });

  describe('explainFinancialVariation', () => {
    it('compare deux exercices réels distincts (année courante vs année précédente)', async () => {
      const year = new Date().getFullYear();
      reportsService.getCompteDeResultatForYear.mockImplementation((_companyId: string, y: number) =>
        Promise.resolve(y === year ? { chiffreAffaires: 2000000, resultatNet: 300000 } : { chiffreAffaires: 1000000, resultatNet: 100000 }),
      );

      const result = await service.explainFinancialVariation('company-1');

      expect(result.currentYear).toBe(year);
      expect(result.previousYear).toBe(year - 1);
      expect(result.current.chiffreAffaires).toBe(2000000);
      expect(result.previous.chiffreAffaires).toBe(1000000);
      expect(reportsService.getCompteDeResultatForYear).toHaveBeenCalledWith('company-1', year);
      expect(reportsService.getCompteDeResultatForYear).toHaveBeenCalledWith('company-1', year - 1);
    });
  });

  describe('suggestBudgetAmount', () => {
    it("suggère un montant basé sur le solde réel de l'exercice précédent pour un compte de charge (sens débiteur)", async () => {
      accountingService.getAccountBalancesForYear.mockResolvedValue([
        { code: '601', type: 'debit', soldeDebiteur: 4000000, soldeCrediteur: 0 },
      ]);

      const result = await service.suggestBudgetAmount('company-1', '601', 2027);

      expect(result.basedOnYear).toBe(2026);
      expect(result.suggestedAmount).toBe(4000000);
      expect(accountingService.getAccountBalancesForYear).toHaveBeenCalledWith('company-1', 2026);
    });

    it("suggère un montant basé sur le solde créditeur pour un compte de produit", async () => {
      accountingService.getAccountBalancesForYear.mockResolvedValue([
        { code: '701', type: 'credit', soldeDebiteur: 0, soldeCrediteur: 8000000 },
      ]);

      const result = await service.suggestBudgetAmount('company-1', '701', 2027);

      expect(result.suggestedAmount).toBe(8000000);
    });

    it("renvoie 0 quand aucune donnée n'existe pour ce compte l'année précédente (pas d'invention)", async () => {
      accountingService.getAccountBalancesForYear.mockResolvedValue([]);

      const result = await service.suggestBudgetAmount('company-1', '601', 2027);

      expect(result.suggestedAmount).toBe(0);
    });
  });
});
