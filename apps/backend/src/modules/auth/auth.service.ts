import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../../entities/user.entity';
import { CompanyEntity } from '../../entities/company.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(CompanyEntity) private readonly companies: Repository<CompanyEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const company = await this.companies.findOne({ where: { id: user.companyId } });

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });

    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId },
      company,
    };
  }

  async getProfile(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    const company = user.companyId 
      ? await this.companies.findOne({ where: { id: user.companyId } })
      : null;
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId },
      company,
    };
  }
}
