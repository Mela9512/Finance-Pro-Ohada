import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreasuryAccountEntity } from '../../entities/treasury-account.entity';
import { TreasuryTransactionEntity } from '../../entities/treasury-transaction.entity';
import { BankStatementLineEntity } from '../../entities/bank-statement-line.entity';
import { CreateTreasuryTransactionDto } from './dto/create-transaction.dto';
import { parseBankStatementCsv } from './bank-statement-parser';

const RECONCILIATION_WINDOW_DAYS = 5;
const AMOUNT_EPSILON = 0.01;

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.abs(a - b) / (1000 * 60 * 60 * 24);
}

export interface ImportBankStatementResult {
  imported: number;
  matched: number;
  created: number;
}

@Injectable()
export class TreasuryService {
  constructor(
    @InjectRepository(TreasuryAccountEntity) private readonly accountRepo: Repository<TreasuryAccountEntity>,
    @InjectRepository(TreasuryTransactionEntity) private readonly txRepo: Repository<TreasuryTransactionEntity>,
    @InjectRepository(BankStatementLineEntity) private readonly bankLineRepo: Repository<BankStatementLineEntity>,
  ) {}

  getAccounts(companyId: string): Promise<TreasuryAccountEntity[]> {
    return this.accountRepo.find({ where: { companyId }, order: { code: 'ASC' } });
  }

  getTransactions(companyId: string): Promise<TreasuryTransactionEntity[]> {
    return this.txRepo.find({ where: { companyId }, order: { date: 'DESC' } });
  }

  async createTransaction(companyId: string, dto: CreateTreasuryTransactionDto): Promise<TreasuryTransactionEntity> {
    const account = await this.accountRepo.findOne({ where: { id: dto.treasuryAccountId, companyId } });
    if (!account) {
      throw new NotFoundException('Compte de trésorerie introuvable');
    }

    // Un mouvement saisi manuellement sur un compte BANQUE n'est réellement "rapproché" qu'une
    // fois confronté au relevé bancaire réel ; pour la caisse/mobile money, la saisie fait foi.
    const initialStatus = account.type === 'BANQUE' ? 'EN_ATTENTE' : 'RAPPROCHE';

    const tx = this.txRepo.create({ ...dto, status: initialStatus, companyId });
    const saved = await this.txRepo.save(tx);

    if (dto.type === 'ENCAISSEMENT') {
      account.balance = Number(account.balance) + dto.amount;
    } else if (dto.type === 'DECAISSEMENT') {
      account.balance = Number(account.balance) - dto.amount;
    }
    await this.accountRepo.save(account);

    return saved;
  }

  async importBankStatement(companyId: string, treasuryAccountId: string, csvContent: string): Promise<ImportBankStatementResult> {
    const account = await this.accountRepo.findOne({ where: { id: treasuryAccountId, companyId } });
    if (!account) {
      throw new NotFoundException('Compte de trésorerie introuvable');
    }

    const lines = parseBankStatementCsv(csvContent);
    const pendingTransactions = await this.txRepo.find({
      where: { companyId, treasuryAccountId, status: 'EN_ATTENTE' },
    });
    const consumedIds = new Set<string>();

    let matched = 0;
    let created = 0;

    for (const line of lines) {
      const expectedType = line.amount >= 0 ? 'ENCAISSEMENT' : 'DECAISSEMENT';

      const candidate = pendingTransactions.find(
        (tx) =>
          !consumedIds.has(tx.id) &&
          tx.type === expectedType &&
          Math.abs(Number(tx.amount) - Math.abs(line.amount)) < AMOUNT_EPSILON &&
          daysBetween(tx.date, line.date) <= RECONCILIATION_WINDOW_DAYS,
      );

      const bankLine = this.bankLineRepo.create({
        companyId,
        treasuryAccountId,
        date: line.date,
        description: line.description,
        amount: line.amount,
        reference: line.reference,
      });

      if (candidate) {
        consumedIds.add(candidate.id);
        candidate.status = 'RAPPROCHE';
        await this.txRepo.save(candidate);
        bankLine.matchedTransactionId = candidate.id;
        matched++;
      } else {
        const newTx = await this.txRepo.save(
          this.txRepo.create({
            treasuryAccountId,
            treasuryAccountName: account.name,
            date: line.date,
            type: expectedType,
            category: 'Import relevé bancaire',
            amount: Math.abs(line.amount),
            reference: line.reference || 'IMPORT',
            tierName: line.description,
            status: 'RAPPROCHE',
            description: line.description,
            companyId,
          }),
        );
        account.balance = Number(account.balance) + line.amount;
        bankLine.matchedTransactionId = newTx.id;
        created++;
      }

      await this.bankLineRepo.save(bankLine);
    }

    await this.accountRepo.save(account);

    return { imported: lines.length, matched, created };
  }
}
