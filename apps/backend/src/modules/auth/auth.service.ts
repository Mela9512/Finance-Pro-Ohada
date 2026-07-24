import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User, Company } from '@financepro/shared';
import { MockDatabase } from '../../mock-db';

@Injectable()
export class AuthService {
  login(email: string, pass: string): { accessToken: string; user: User; company: Company } {
    const user = MockDatabase.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects');
    }
    // Simulation du JWT Token
    const accessToken = `jwt_session_token_${user.id}_${Date.now()}`;
    return {
      accessToken,
      user,
      company: MockDatabase.company
    };
  }

  getProfile(userId: string): { user: User; company: Company } {
    const user = MockDatabase.users.find(u => u.id === userId) || MockDatabase.users[0];
    return {
      user,
      company: MockDatabase.company
    };
  }
}
