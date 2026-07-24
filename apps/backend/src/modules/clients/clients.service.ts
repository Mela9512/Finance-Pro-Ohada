import { Injectable } from '@nestjs/common';
import { Customer } from '@financepro/shared';
import { MockDatabase } from '../../mock-db';

@Injectable()
export class ClientsService {
  getClients(): Customer[] {
    return MockDatabase.customers;
  }

  createClient(client: Omit<Customer, 'id' | 'balance'>): Customer {
    const code = `411${String(MockDatabase.customers.length + 1).padStart(3, '0')}`;
    const newCust: Customer = {
      ...client,
      id: `cust-${Date.now()}`,
      code,
      balance: 0
    };
    MockDatabase.customers.push(newCust);
    return newCust;
  }
}
