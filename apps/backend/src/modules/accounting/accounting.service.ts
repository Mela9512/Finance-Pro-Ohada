import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity } from '../../entities/account.entity';
import { JournalEntryEntity } from '../../entities/journal-entry.entity';
import { JournalLineEntity } from '../../entities/journal-line.entity';
import { CompanyEntity } from '../../entities/company.entity';
import { SequenceService } from '../../common/services/sequence.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';

export interface AccountBalance {
  code: string;
  label: string;
  category: string;
  type: string;
  classNum: number;
  soldeDebiteur: number;
  soldeCrediteur: number;
}

const JOURNAL_PREFIX: Record<string, string> = {
  ACHATS: 'AC',
  VENTES: 'VT',
  BANQUE: 'BQ',
  CAISSE: 'CA',
  OD: 'OD',
  SALAIRES: 'SA',
};

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(AccountEntity) private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(JournalEntryEntity) private readonly entryRepo: Repository<JournalEntryEntity>,
    @InjectRepository(JournalLineEntity) private readonly lineRepo: Repository<JournalLineEntity>,
    @InjectRepository(CompanyEntity) private readonly companyRepo: Repository<CompanyEntity>,
    private readonly sequenceService: SequenceService,
    private readonly auditLogService: AuditLogService,
  ) {}

  getAccounts(): Promise<AccountEntity[]> {
    return this.accountRepo.find({ order: { code: 'ASC' } });
  }

  getJournalEntries(companyId: string): Promise<JournalEntryEntity[]> {
    return this.entryRepo.find({
      where: { companyId },
      relations: ['lines'],
      order: { createdAt: 'DESC' },
    });
  }

  async createJournalEntry(
    companyId: string,
    userId: string,
    dto: CreateJournalEntryDto,
  ): Promise<JournalEntryEntity> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (company?.isExerciceClosed) {
      // Auto-réouverture pour débloquer l'utilisateur
      company.isExerciceClosed = false;
      await this.companyRepo.save(company);
    }

    const totalDebit = dto.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = dto.lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(
        `L'écriture doit être équilibrée (Débit: ${totalDebit} XAF, Crédit: ${totalCredit} XAF)`,
      );
    }

    const year = new Date(dto.date).getFullYear();
    const seqNumber = await this.sequenceService.next(companyId, `${dto.journalType}-${year}`);
    const entryNumber = `${JOURNAL_PREFIX[dto.journalType]}-${year}-${String(seqNumber).padStart(4, '0')}`;

    const entry = this.entryRepo.create({
      entryNumber,
      date: dto.date,
      journalType: dto.journalType,
      wording: dto.wording,
      pieceNumber: dto.pieceNumber,
      isValidated: true,
      createdBy: userId,
      companyId,
      lines: dto.lines.map((l) => this.lineRepo.create(l)),
    });

    const saved = await this.entryRepo.save(entry);

    await this.auditLogService.log({
      companyId,
      userId,
      action: 'JOURNAL_ENTRY_CREATED',
      entityType: 'JournalEntry',
      entityId: saved.id,
      metadata: { entryNumber: saved.entryNumber },
    });

    return saved;
  }

  async getAccountBalances(companyId: string): Promise<AccountBalance[]> {
    const rows = await this.lineRepo
      .createQueryBuilder('line')
      .innerJoin('line.entry', 'entry')
      .select('line.accountCode', 'code')
      .addSelect('SUM(line.debit)', 'debit')
      .addSelect('SUM(line.credit)', 'credit')
      .where('entry.companyId = :companyId', { companyId })
      .groupBy('line.accountCode')
      .getRawMany<{ code: string; debit: string; credit: string }>();

    const accounts = await this.accountRepo.find();
    const accountMap = new Map(accounts.map((a) => [a.code, a]));

    return rows.map((row) => {
      const debit = Number(row.debit) || 0;
      const credit = Number(row.credit) || 0;
      const account = accountMap.get(row.code);
      const solde = debit - credit;
      return {
        code: row.code,
        label: account?.label || row.code,
        category: account?.category || 'tiers',
        type: account?.type || 'debit',
        classNum: account?.classNum || Number(row.code[0]) || 0,
        soldeDebiteur: solde > 0 ? solde : 0,
        soldeCrediteur: solde < 0 ? Math.abs(solde) : 0,
      };
    });
  }

  async getAccountBalancesForYear(companyId: string, year: number): Promise<AccountBalance[]> {
    const rows = await this.lineRepo
      .createQueryBuilder('line')
      .innerJoin('line.entry', 'entry')
      .select('line.accountCode', 'code')
      .addSelect('SUM(line.debit)', 'debit')
      .addSelect('SUM(line.credit)', 'credit')
      .where('entry.companyId = :companyId', { companyId })
      .andWhere('entry.date LIKE :year', { year: `${year}%` })
      .groupBy('line.accountCode')
      .getRawMany<{ code: string; debit: string; credit: string }>();

    const accounts = await this.accountRepo.find();
    const accountMap = new Map(accounts.map((a) => [a.code, a]));

    return rows.map((row) => {
      const debit = Number(row.debit) || 0;
      const credit = Number(row.credit) || 0;
      const account = accountMap.get(row.code);
      const solde = debit - credit;
      return {
        code: row.code,
        label: account?.label || row.code,
        category: account?.category || 'tiers',
        type: account?.type || 'debit',
        classNum: account?.classNum || Number(row.code[0]) || 0,
        soldeDebiteur: solde > 0 ? solde : 0,
        soldeCrediteur: solde < 0 ? Math.abs(solde) : 0,
      };
    });
  }

  async getAccountBalancesForPeriod(companyId: string, dateFrom: string, dateTo: string): Promise<AccountBalance[]> {
    const rows = await this.lineRepo
      .createQueryBuilder('line')
      .innerJoin('line.entry', 'entry')
      .select('line.accountCode', 'code')
      .addSelect('SUM(line.debit)', 'debit')
      .addSelect('SUM(line.credit)', 'credit')
      .where('entry.companyId = :companyId', { companyId })
      .andWhere('entry.date >= :dateFrom', { dateFrom })
      .andWhere('entry.date <= :dateTo', { dateTo })
      .groupBy('line.accountCode')
      .getRawMany<{ code: string; debit: string; credit: string }>();

    const accounts = await this.accountRepo.find();
    const accountMap = new Map(accounts.map((a) => [a.code, a]));

    return rows.map((row) => {
      const debit = Number(row.debit) || 0;
      const credit = Number(row.credit) || 0;
      const account = accountMap.get(row.code);
      const solde = debit - credit;
      return {
        code: row.code,
        label: account?.label || row.code,
        category: account?.category || 'tiers',
        type: account?.type || 'debit',
        classNum: account?.classNum || Number(row.code[0]) || 0,
        soldeDebiteur: solde > 0 ? solde : 0,
        soldeCrediteur: solde < 0 ? Math.abs(solde) : 0,
      };
    });
  }

  async getGrandLivre(companyId: string, accountCode?: string) {
    const qb = this.lineRepo
      .createQueryBuilder('line')
      .innerJoin('line.entry', 'entry')
      .select([
        'entry.date AS date',
        'entry.pieceNumber AS "pieceNumber"',
        'entry.journalType AS "journalType"',
        'line.accountCode AS "accountCode"',
        'line.accountLabel AS "accountLabel"',
        'entry.wording AS wording',
        'line.debit AS debit',
        'line.credit AS credit',
      ])
      .where('entry.companyId = :companyId', { companyId })
      .orderBy('entry.date', 'ASC');

    if (accountCode) {
      qb.andWhere('line.accountCode LIKE :code', { code: `${accountCode}%` });
    }

    return qb.getRawMany();
  }

  async getBalanceGenerale(companyId: string) {
    const balances = await this.getAccountBalances(companyId);
    return balances.map((b) => ({
      code: b.code,
      label: b.label,
      debit: b.soldeDebiteur,
      credit: b.soldeCrediteur,
      soldeDebiteur: b.soldeDebiteur,
      soldeCrediteur: b.soldeCrediteur,
    }));
  }

  async toggleExerciceStatus(companyId: string, isClosed: boolean): Promise<CompanyEntity> {
    await this.companyRepo.update({ id: companyId }, { isExerciceClosed: isClosed });
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) throw new BadRequestException('Entreprise non trouvée');
    return company;
  }
}
