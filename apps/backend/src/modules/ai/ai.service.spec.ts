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
  let treasuryAccountRepo: ReturnType<typeof makeRepoMock>;
  let accountingService: { getBalanceGenerale: jest.Mock };
  let reportsService: { getBilan: jest.Mock; getCompteDeResultat: jest.Mock };
  let budgetService: { getComparison: jest.Mock };
  let service: AiService;

  beforeEach(() => {
    aiProvider = { generateText: jest.fn().mockResolvedValue('analyse IA'), generateJson: jest.fn(), generateJsonFromFile: jest.fn() };
    accountRepo = makeRepoMock();
    lineRepo = makeRepoMock();
    invoiceRepo = makeRepoMock();
    customerRepo = makeRepoMock();
    treasuryAccountRepo = makeRepoMock();
    accountingService = { getBalanceGenerale: jest.fn() };
    reportsService = { getBilan: jest.fn(), getCompteDeResultat: jest.fn() };
    budgetService = { getComparison: jest.fn().mockResolvedValue([]) };

    service = new AiService(
      aiProvider as any,
      accountRepo as any,
      lineRepo as any,
      invoiceRepo as any,
      customerRepo as any,
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
});
