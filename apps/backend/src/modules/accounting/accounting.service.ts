import { Injectable, BadRequestException } from '@nestjs/common';
import { JournalEntry, AccountSYSCOHADA } from '@financepro/shared';
import { MockDatabase } from '../../mock-db';

@Injectable()
export class AccountingService {
  getAccounts(): AccountSYSCOHADA[] {
    return MockDatabase.accounts;
  }

  getJournalEntries(): JournalEntry[] {
    return MockDatabase.journalEntries;
  }

  createJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'entryNumber' | 'isValidated'>): JournalEntry {
    const totalDebit = entry.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = entry.lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(`L'écriture doit être équilibrée (Débit: ${totalDebit} XAF, Crédit: ${totalCredit} XAF)`);
    }

    const count = MockDatabase.journalEntries.length + 1;
    const entryNumber = `${entry.journalType.substring(0, 2)}-2026-${String(count).padStart(4, '0')}`;
    
    const newEntry: JournalEntry = {
      ...entry,
      id: `entry-${Date.now()}`,
      entryNumber,
      isValidated: true,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    MockDatabase.journalEntries.unshift(newEntry);
    return newEntry;
  }

  getGrandLivre(accountCode?: string) {
    const lines: any[] = [];
    MockDatabase.journalEntries.forEach(entry => {
      entry.lines.forEach(l => {
        if (!accountCode || l.accountCode.startsWith(accountCode)) {
          lines.push({
            date: entry.date,
            pieceNumber: entry.pieceNumber,
            journalType: entry.journalType,
            accountCode: l.accountCode,
            accountLabel: l.accountLabel,
            wording: entry.wording,
            debit: l.debit,
            credit: l.credit
          });
        }
      });
    });
    return lines;
  }

  getBalanceGenerale() {
    const map = new Map<string, { code: string; label: string; debit: number; credit: number }>();

    MockDatabase.journalEntries.forEach(entry => {
      entry.lines.forEach(l => {
        const existing = map.get(l.accountCode) || { code: l.accountCode, label: l.accountLabel, debit: 0, credit: 0 };
        existing.debit += l.debit;
        existing.credit += l.credit;
        map.set(l.accountCode, existing);
      });
    });

    return Array.from(map.values()).map(acc => {
      const solde = acc.debit - acc.credit;
      return {
        ...acc,
        soldeDebiteur: solde > 0 ? solde : 0,
        soldeCrediteur: solde < 0 ? Math.abs(solde) : 0
      };
    });
  }
}
