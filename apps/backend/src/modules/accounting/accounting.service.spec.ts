import { BadRequestException } from '@nestjs/common';
import { AccountingService } from './accounting.service';

function makeRepoMock(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: 'generated-id', ...x })),
    createQueryBuilder: jest.fn(),
    ...overrides,
  };
}

describe('AccountingService', () => {
  let accountRepo: ReturnType<typeof makeRepoMock>;
  let entryRepo: ReturnType<typeof makeRepoMock>;
  let lineRepo: ReturnType<typeof makeRepoMock>;
  let companyRepo: ReturnType<typeof makeRepoMock>;
  let sequenceService: { next: jest.Mock };
  let auditLogService: { log: jest.Mock };
  let service: AccountingService;

  beforeEach(() => {
    accountRepo = makeRepoMock();
    entryRepo = makeRepoMock();
    lineRepo = makeRepoMock({ create: jest.fn((x) => x) });
    companyRepo = makeRepoMock({ findOne: jest.fn().mockResolvedValue({ isExerciceClosed: false }) });
    sequenceService = { next: jest.fn().mockResolvedValue(1) };
    auditLogService = { log: jest.fn().mockResolvedValue(undefined) };

    service = new AccountingService(
      accountRepo as any,
      entryRepo as any,
      lineRepo as any,
      companyRepo as any,
      sequenceService as any,
      auditLogService as any,
    );
  });

  describe('createJournalEntry', () => {
    const balancedDto = {
      date: '2026-01-15',
      journalType: 'VENTES' as const,
      wording: 'Vente test',
      pieceNumber: 'FAC-001',
      lines: [
        { accountCode: '411', accountLabel: 'Clients', debit: 118000, credit: 0 },
        { accountCode: '701', accountLabel: 'Ventes', debit: 0, credit: 100000 },
        { accountCode: '443', accountLabel: 'TVA', debit: 0, credit: 18000 },
      ],
    };

    it('rejette une écriture déséquilibrée', async () => {
      const unbalancedDto = {
        ...balancedDto,
        lines: [
          { accountCode: '411', accountLabel: 'Clients', debit: 100000, credit: 0 },
          { accountCode: '701', accountLabel: 'Ventes', debit: 0, credit: 90000 },
        ],
      };

      await expect(service.createJournalEntry('company-1', 'user-1', unbalancedDto)).rejects.toThrow(BadRequestException);
      expect(entryRepo.save).not.toHaveBeenCalled();
    });

    it('rejette toute écriture si l\'exercice est clôturé', async () => {
      companyRepo.findOne.mockResolvedValue({ isExerciceClosed: true });

      await expect(service.createJournalEntry('company-1', 'user-1', balancedDto)).rejects.toThrow(BadRequestException);
      expect(entryRepo.save).not.toHaveBeenCalled();
    });

    it('accepte une écriture équilibrée et génère un numéro via la séquence', async () => {
      const result = await service.createJournalEntry('company-1', 'user-1', balancedDto);

      expect(sequenceService.next).toHaveBeenCalledWith('company-1', 'VENTES-2026');
      expect(entryRepo.save).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'JOURNAL_ENTRY_CREATED', companyId: 'company-1', userId: 'user-1' }),
      );
      expect(result.entryNumber).toBe('VT-2026-0001');
    });

    it('tolère un écart d\'arrondi négligeable (<= 0.01)', async () => {
      const almostBalanced = {
        ...balancedDto,
        lines: [
          { accountCode: '411', accountLabel: 'Clients', debit: 100000.005, credit: 0 },
          { accountCode: '701', accountLabel: 'Ventes', debit: 0, credit: 100000 },
        ],
      };

      await expect(service.createJournalEntry('company-1', 'user-1', almostBalanced)).resolves.toBeDefined();
    });
  });
});
