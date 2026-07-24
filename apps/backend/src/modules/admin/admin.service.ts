import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { CompanyEntity } from '../../entities/company.entity';
import { UserEntity } from '../../entities/user.entity';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { AuditLogService } from '../../common/services/audit-log.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(CompanyEntity) private readonly companyRepo: Repository<CompanyEntity>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    private readonly auditLogService: AuditLogService,
  ) {}

  getCompany(companyId: string): Promise<CompanyEntity> {
    return this.companyRepo.findOne({ where: { id: companyId } });
  }

  async updateCompany(companyId: string, userId: string, dto: UpdateCompanyDto): Promise<CompanyEntity> {
    await this.companyRepo.update({ id: companyId }, dto);
    await this.auditLogService.log({
      companyId,
      userId,
      action: 'COMPANY_UPDATED',
      entityType: 'Company',
      entityId: companyId,
      metadata: dto as Record<string, unknown>,
    });
    return this.companyRepo.findOne({ where: { id: companyId } });
  }

  async setExerciceClosed(companyId: string, userId: string, closed: boolean): Promise<CompanyEntity> {
    await this.companyRepo.update({ id: companyId }, { isExerciceClosed: closed });
    await this.auditLogService.log({
      companyId,
      userId,
      action: closed ? 'EXERCICE_CLOSED' : 'EXERCICE_REOPENED',
      entityType: 'Company',
      entityId: companyId,
    });
    return this.companyRepo.findOne({ where: { id: companyId } });
  }

  getUsers(companyId: string): Promise<UserEntity[]> {
    return this.userRepo.find({ where: { companyId }, order: { createdAt: 'ASC' } });
  }

  async createUser(companyId: string, actorUserId: string, dto: CreateUserDto): Promise<Omit<UserEntity, 'passwordHash'>> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepo.save(
      this.userRepo.create({
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        role: dto.role,
        companyId,
      }),
    );

    await this.auditLogService.log({
      companyId,
      userId: actorUserId,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
    });

    const { passwordHash: _omit, ...safeUser } = user;
    return safeUser;
  }
}
