import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetEntity } from '../../entities/budget.entity';
import { AccountEntity } from '../../entities/account.entity';
import { AccountingService } from '../accounting/accounting.service';
import { CreateBudgetDto } from './dto/create-budget.dto';

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(BudgetEntity) private readonly budgetRepo: Repository<BudgetEntity>,
    @InjectRepository(AccountEntity) private readonly accountRepo: Repository<AccountEntity>,
    private readonly accountingService: AccountingService,
  ) {}

  getBudgets(companyId: string, exercice: number): Promise<BudgetEntity[]> {
    return this.budgetRepo.find({ where: { companyId, exercice }, order: { accountCode: 'ASC' } });
  }

  async upsertBudget(companyId: string, userId: string, dto: CreateBudgetDto): Promise<BudgetEntity> {
    const period = dto.period ?? null;
    const existing = await this.budgetRepo.findOne({
      where: { companyId, accountCode: dto.accountCode, exercice: dto.exercice, period },
    });

    if (existing) {
      existing.amountBudgeted = dto.amountBudgeted;
      existing.createdBy = userId;
      return this.budgetRepo.save(existing);
    }

    return this.budgetRepo.save(
      this.budgetRepo.create({
        companyId,
        accountCode: dto.accountCode,
        exercice: dto.exercice,
        period,
        amountBudgeted: dto.amountBudgeted,
        createdBy: userId,
      }),
    );
  }

  async deleteBudget(companyId: string, id: string): Promise<void> {
    const result = await this.budgetRepo.delete({ id, companyId });
    if (!result.affected) {
      throw new NotFoundException('Ligne budgétaire introuvable');
    }
  }

  async getComparison(companyId: string, exercice: number) {
    const budgets = await this.budgetRepo.find({ where: { companyId, exercice } });
    const budgetedByAccount = new Map<string, number>();
    for (const b of budgets) {
      budgetedByAccount.set(b.accountCode, (budgetedByAccount.get(b.accountCode) || 0) + Number(b.amountBudgeted));
    }

    const balances = await this.accountingService.getAccountBalancesForYear(companyId, exercice);
    const balanceByAccount = new Map(balances.map((b) => [b.code, b]));

    const accounts = await this.accountRepo.find();
    const accountMap = new Map(accounts.map((a) => [a.code, a]));

    const accountCodes = new Set<string>([...budgetedByAccount.keys(), ...balanceByAccount.keys()]);

    return Array.from(accountCodes)
      .sort()
      .map((code) => {
        const budgeted = budgetedByAccount.get(code) || 0;
        const balance = balanceByAccount.get(code);
        const account = accountMap.get(code);
        const type = account?.type || balance?.type || 'debit';
        const actual = balance ? (type === 'credit' ? balance.soldeCrediteur - balance.soldeDebiteur : balance.soldeDebiteur - balance.soldeCrediteur) : 0;
        const variance = actual - budgeted;
        return {
          accountCode: code,
          label: account?.label || balance?.label || code,
          budgeted,
          actual,
          variance,
          variancePercent: budgeted !== 0 ? (variance / budgeted) * 100 : null,
        };
      });
  }
}
