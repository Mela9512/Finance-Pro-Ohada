import { Injectable } from '@nestjs/common';
import { Invoice } from '@financepro/shared';
import { MockDatabase } from '../../mock-db';

@Injectable()
export class InvoicingService {
  getInvoices(): Invoice[] {
    return MockDatabase.invoices;
  }

  createInvoice(inv: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'amountPaid'>): Invoice {
    const num = `FAC-2026-${String(MockDatabase.invoices.length + 1).padStart(3, '0')}`;
    const newInvoice: Invoice = {
      ...inv,
      id: `inv-${Date.now()}`,
      invoiceNumber: num,
      status: 'BROUILLON',
      amountPaid: 0
    };
    MockDatabase.invoices.unshift(newInvoice);
    return newInvoice;
  }

  validateInvoice(id: string): Invoice {
    const inv = MockDatabase.invoices.find(i => i.id === id);
    if (inv) {
      inv.status = 'VALIDE';
      // Auto-generate journal entry for sales invoice
      const debitAccount = inv.type === 'VENTE' ? '411' : '401';
      const creditAccount = inv.type === 'VENTE' ? '701' : '601';

      MockDatabase.journalEntries.unshift({
        id: `entry-${Date.now()}`,
        entryNumber: `VT-2026-${String(MockDatabase.journalEntries.length + 1).padStart(4, '0')}`,
        date: inv.date,
        journalType: inv.type === 'VENTE' ? 'VENTES' : 'ACHATS',
        wording: `Facture ${inv.invoiceNumber} - ${inv.tierName}`,
        pieceNumber: inv.invoiceNumber,
        lines: [
          { id: `l-${Date.now()}-1`, accountCode: debitAccount, accountLabel: inv.tierName, debit: inv.totalTTC, credit: 0 },
          { id: `l-${Date.now()}-2`, accountCode: creditAccount, accountLabel: 'Chiffre d\'affaires / Charges', debit: 0, credit: inv.subtotalHT },
          { id: `l-${Date.now()}-3`, accountCode: inv.type === 'VENTE' ? '443' : '445', accountLabel: 'TVA Facturée/Récupérable', debit: 0, credit: inv.totalTVA }
        ],
        isValidated: true,
        createdBy: 'Système Facturation',
        createdAt: new Date().toISOString().substring(0, 16)
      });
    }
    return inv;
  }
}
