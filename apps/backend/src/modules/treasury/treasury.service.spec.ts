import { TreasuryService } from './treasury.service';

function makeRepoMock(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: x.id || 'generated-id', ...x })),
    ...overrides,
  };
}

describe('TreasuryService', () => {
  let accountRepo: ReturnType<typeof makeRepoMock>;
  let txRepo: ReturnType<typeof makeRepoMock>;
  let bankLineRepo: ReturnType<typeof makeRepoMock>;
  let service: TreasuryService;

  beforeEach(() => {
    accountRepo = makeRepoMock();
    txRepo = makeRepoMock();
    bankLineRepo = makeRepoMock();
    service = new TreasuryService(accountRepo as any, txRepo as any, bankLineRepo as any);
  });

  describe('createTransaction', () => {
    it("marque un mouvement sur un compte BANQUE comme EN_ATTENTE (non rapproché tant qu'aucun relevé ne l'a confirmé)", async () => {
      accountRepo.findOne.mockResolvedValue({ id: 'acc-1', type: 'BANQUE', balance: 0 });

      const tx = await service.createTransaction('company-1', {
        treasuryAccountId: 'acc-1',
        treasuryAccountName: 'BGFI',
        date: '2026-07-01',
        type: 'ENCAISSEMENT',
        category: 'Test',
        amount: 1000,
        reference: 'REF-1',
        description: 'Test',
      } as any);

      expect(tx.status).toBe('EN_ATTENTE');
    });

    it('marque un mouvement de caisse ou mobile money comme RAPPROCHE immédiatement (pas de relevé externe à confronter)', async () => {
      accountRepo.findOne.mockResolvedValue({ id: 'acc-2', type: 'CAISSE', balance: 0 });

      const tx = await service.createTransaction('company-1', {
        treasuryAccountId: 'acc-2',
        treasuryAccountName: 'Caisse',
        date: '2026-07-01',
        type: 'ENCAISSEMENT',
        category: 'Test',
        amount: 1000,
        reference: 'REF-1',
        description: 'Test',
      } as any);

      expect(tx.status).toBe('RAPPROCHE');
    });
  });

  describe('importBankStatement', () => {
    const account = { id: 'acc-1', name: 'BGFI', type: 'BANQUE', balance: 100000 };

    it('rapproche une ligne de relevé avec un mouvement EN_ATTENTE existant (même montant, même sens, dates proches)', async () => {
      accountRepo.findOne.mockResolvedValue({ ...account });
      const pendingTx = { id: 'tx-1', type: 'ENCAISSEMENT', amount: 50000, date: '2026-07-02' };
      txRepo.find.mockResolvedValue([pendingTx]);

      const csv = 'date;description;montant;reference\n2026-07-03;Virement reçu;50000;VIR-1';
      const result = await service.importBankStatement('company-1', 'acc-1', csv);

      expect(result).toEqual({ imported: 1, matched: 1, created: 0 });
      expect(txRepo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'tx-1', status: 'RAPPROCHE' }));
    });

    it("crée un nouveau mouvement quand aucune saisie existante ne correspond, et met à jour le solde du compte", async () => {
      const acc = { ...account };
      accountRepo.findOne.mockResolvedValue(acc);
      txRepo.find.mockResolvedValue([]);

      const csv = 'date;description;montant;reference\n2026-07-03;Frais bancaires;-3000;FRAIS-1';
      const result = await service.importBankStatement('company-1', 'acc-1', csv);

      expect(result).toEqual({ imported: 1, matched: 0, created: 1 });
      expect(acc.balance).toBe(100000 - 3000);
    });

    it('ne rapproche pas deux lignes de relevé avec le même mouvement EN_ATTENTE (une seule ligne peut le consommer)', async () => {
      accountRepo.findOne.mockResolvedValue({ ...account });
      const pendingTx = { id: 'tx-1', type: 'ENCAISSEMENT', amount: 50000, date: '2026-07-02' };
      txRepo.find.mockResolvedValue([pendingTx]);

      const csv =
        'date;description;montant;reference\n2026-07-03;Virement A;50000;VIR-A\n2026-07-03;Virement B;50000;VIR-B';
      const result = await service.importBankStatement('company-1', 'acc-1', csv);

      expect(result).toEqual({ imported: 2, matched: 1, created: 1 });
    });

    it('ne rapproche pas un mouvement EN_ATTENTE dont le sens (type) ne correspond pas au signe du montant bancaire', async () => {
      accountRepo.findOne.mockResolvedValue({ ...account });
      const pendingTx = { id: 'tx-1', type: 'DECAISSEMENT', amount: 50000, date: '2026-07-02' };
      txRepo.find.mockResolvedValue([pendingTx]);

      const csv = 'date;description;montant\n2026-07-03;Virement reçu;50000';
      const result = await service.importBankStatement('company-1', 'acc-1', csv);

      expect(result).toEqual({ imported: 1, matched: 0, created: 1 });
    });

    it("ne rapproche pas un mouvement EN_ATTENTE trop éloigné dans le temps (> 5 jours)", async () => {
      accountRepo.findOne.mockResolvedValue({ ...account });
      const pendingTx = { id: 'tx-1', type: 'ENCAISSEMENT', amount: 50000, date: '2026-06-20' };
      txRepo.find.mockResolvedValue([pendingTx]);

      const csv = 'date;description;montant\n2026-07-03;Virement reçu;50000';
      const result = await service.importBankStatement('company-1', 'acc-1', csv);

      expect(result).toEqual({ imported: 1, matched: 0, created: 1 });
    });
  });
});
