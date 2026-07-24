import { Injectable } from '@nestjs/common';
import { User, Company } from '@financepro/shared';
import { MockDatabase } from '../../mock-db';

@Injectable()
export class AdminService {
  getCompany(): Company {
    return MockDatabase.company;
  }

  updateCompany(company: Partial<Company>): Company {
    MockDatabase.company = { ...MockDatabase.company, ...company };
    return MockDatabase.company;
  }

  getUsers(): User[] {
    return MockDatabase.users;
  }

  createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString().substring(0, 10)
    };
    MockDatabase.users.push(newUser);
    return newUser;
  }
}
