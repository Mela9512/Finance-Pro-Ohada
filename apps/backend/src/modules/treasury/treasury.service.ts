import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreasuryAccountEntity } from '../../entities/treasury-account.entity';
import { TreasuryTransactionEntity } from '../../entities/treasury-transaction.entity';
import { CreateTreasuryTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TreasuryService {
  constructor(
    @InjectRepository(TreasuryAccountEntity) private readonly accountRepo: Repository<TreasuryAccountEntity>,
    @InjectRepository(TreasuryTransactionEntity) private readonly txRepo: Repository<TreasuryTransactionEntity>,
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

    const tx = this.txRepo.create({ ...dto, status: 'RAPPROCHE', companyId });
    const saved = await this.txRepo.save(tx);

    if (dto.type === 'ENCAISSEMENT') {
      account.balance = Number(account.balance) + dto.amount;
    } else if (dto.type === 'DECAISSEMENT') {
      account.balance = Number(account.balance) - dto.amount;
    }
    await this.accountRepo.save(account);

    return saved;
  }
}
