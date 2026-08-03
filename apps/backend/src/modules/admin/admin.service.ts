import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { CompanyEntity } from '../../entities/company.entity';
import { UserEntity } from '../../entities/user.entity';
import { InviteTokenEntity } from '../../entities/invite-token.entity';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { EmailService } from '../../common/services/email.service';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(CompanyEntity) private readonly companyRepo: Repository<CompanyEntity>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(InviteTokenEntity) private readonly inviteRepo: Repository<InviteTokenEntity>,
    private readonly auditLogService: AuditLogService,
    private readonly emailService: EmailService,
  ) {}

  getCompany(companyId: string): Promise<CompanyEntity> {
    return this.companyRepo.findOne({ where: { id: companyId } });
  }

  async updateCompany(companyId: string, userId: string, dto: UpdateCompanyDto): Promise<CompanyEntity> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Entreprise introuvable');
    }

    const cleanDto = { ...dto };
    if (cleanDto.rccm === '') delete cleanDto.rccm;
    if (cleanDto.nif === '') delete cleanDto.nif;

    Object.assign(company, cleanDto);
    const updated = await this.companyRepo.save(company);

    await this.auditLogService.log({
      companyId,
      userId,
      action: 'COMPANY_UPDATED',
      entityType: 'Company',
      entityId: companyId,
      metadata: cleanDto as Record<string, unknown>,
    });
    return updated;
  }

  async completeOnboarding(companyId: string, userId: string, dto: UpdateCompanyDto): Promise<CompanyEntity> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Entreprise introuvable');
    }

    const cleanDto = { ...dto };
    if (cleanDto.rccm === '') delete cleanDto.rccm;
    if (cleanDto.nif === '') delete cleanDto.nif;

    Object.assign(company, cleanDto, { isOnboarded: true });
    const updated = await this.companyRepo.save(company);

    await this.auditLogService.log({
      companyId,
      userId,
      action: 'ONBOARDING_COMPLETED',
      entityType: 'Company',
      entityId: companyId,
    });
    return updated;
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

  async inviteUser(companyId: string, actorUserId: string, dto: InviteUserDto, appUrl: string): Promise<{ message: string }> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      if (existing.companyId === companyId) {
        existing.role = dto.role as any;
        await this.userRepo.save(existing);
        return { message: `Le rôle de ${existing.name || existing.email} a été mis à jour avec succès en [ ${dto.role} ].` };
      }
      throw new ConflictException('Un utilisateur avec cet email existe déjà dans un autre compte.');
    }

    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    const rawToken = crypto.randomBytes(32).toString('hex');

    await this.inviteRepo.save(
      this.inviteRepo.create({
        companyId,
        email: dto.email.toLowerCase(),
        role: dto.role,
        tokenHash: hashToken(rawToken),
        invitedBy: actorUserId,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      }),
    );

    const inviteUrl = `${appUrl}/accept-invite?token=${rawToken}`;
    await this.emailService.sendInvite(dto.email, company?.name || 'FinancePro OHADA', inviteUrl);

    await this.auditLogService.log({
      companyId,
      userId: actorUserId,
      action: 'USER_INVITED',
      entityType: 'InviteToken',
      metadata: { email: dto.email, role: dto.role },
    });

    return { message: `Invitation envoyée à ${dto.email}` };
  }
}
