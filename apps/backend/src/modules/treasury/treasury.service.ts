import { Injectable } from '@nestjs/common';
import { TreasuryAccount, TreasuryTransaction } from '@financepro/shared';
import { MockDatabase } from '../../mock-db';

@Injectable()
export class TreasuryService {
  getAccounts(): TreasuryAccount[] {
    return MockDatabase.treasuryAccounts;
  }

  getTransactions(): TreasuryTransaction[] {
    return MockDatabase.treasuryTransactions;
  }

  createTransaction(tx: Omit<TreasuryTransaction, 'id' | 'status'>): TreasuryTransaction {
    const newTx: TreasuryTransaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      status: 'RAPPROCHE'
    };
    MockDatabase.treasuryTransactions.unshift(newTx);
    
    // Update account balance
    const acc = MockDatabase.treasuryAccounts.find(a => a.id === tx.treasuryAccountId);
    if (acc) {
      if (tx.type === 'ENCAISSEMENT') acc.balance += tx.amount;
      if (tx.type === 'DECAISSEMENT') acc.balance -= tx.amount;
    }

    return newTx;
  }
}
