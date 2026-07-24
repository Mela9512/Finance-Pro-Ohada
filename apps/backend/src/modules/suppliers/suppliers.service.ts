import { Injectable } from '@nestjs/common';
import { Supplier } from '@financepro/shared';
import { MockDatabase } from '../../mock-db';

@Injectable()
export class SuppliersService {
  getSuppliers(): Supplier[] {
    return MockDatabase.suppliers;
  }

  createSupplier(supp: Omit<Supplier, 'id' | 'balance'>): Supplier {
    const code = `401${String(MockDatabase.suppliers.length + 1).padStart(3, '0')}`;
    const newSupp: Supplier = {
      ...supp,
      id: `supp-${Date.now()}`,
      code,
      balance: 0
    };
    MockDatabase.suppliers.push(newSupp);
    return newSupp;
  }
}
