import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UserEntity } from '../../entities/user.entity';
import { CompanyEntity } from '../../entities/company.entity';
import { PasswordResetTokenEntity } from '../../entities/password-reset-token.entity';
import { InviteTokenEntity } from '../../entities/invite-token.entity';
import { EmailService } from '../../common/services/email.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { RegisterDto } from './dto/register.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(CompanyEntity) private readonly companies: Repository<CompanyEntity>,
    @InjectRepository(PasswordResetTokenEntity) private readonly resetTokens: Repository<PasswordResetTokenEntity>,
    @InjectRepository(InviteTokenEntity) private readonly inviteTokens: Repository<InviteTokenEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private async issueSession(user: UserEntity, company: CompanyEntity | null) {
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
    await this.auditLogService.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
    });
    return this.issueSession(user, company);
  }

  async register(dto: RegisterDto) {
    const existing = await this.users.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const { user, company } = await this.dataSource.transaction(async (manager) => {
      const company = await manager.save(
        CompanyEntity,
        manager.create(CompanyEntity, { name: dto.companyName }),
      );
      const user = await manager.save(
        UserEntity,
        manager.create(UserEntity, {
          email: dto.email.toLowerCase(),
          passwordHash,
          name: dto.name,
          role: 'ADMIN',
          companyId: company.id,
        }),
      );
      return { user, company };
    });

    await this.auditLogService.log({
      companyId: company.id,
      userId: user.id,
      action: 'COMPANY_REGISTERED',
      entityType: 'Company',
      entityId: company.id,
      metadata: { companyName: company.name, adminEmail: user.email },
    });

    return this.issueSession(user, company);
  }

  async getProfile(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    const company = user.companyId ? await this.companies.findOne({ where: { id: user.companyId } }) : null;
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId },
      company,
    };
  }

  async forgotPassword(email: string, appUrl: string): Promise<void> {
    const user = await this.users.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Ne pas révéler si l'email existe ou non
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    await this.resetTokens.save(
      this.resetTokens.create({
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      }),
    );

    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
    await this.emailService.sendPasswordReset(user.email, resetUrl);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const resetToken = await this.resetTokens.findOne({ where: { tokenHash } });
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Lien de réinitialisation invalide ou expiré');
    }

    const user = await this.users.findOne({ where: { id: resetToken.userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.users.save(user);

    resetToken.usedAt = new Date();
    await this.resetTokens.save(resetToken);

    await this.auditLogService.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: user.id,
    });
  }

  async validateInvite(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const invite = await this.inviteTokens.findOne({ where: { tokenHash } });
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new UnauthorizedException('Invitation invalide ou expirée');
    }
    const company = await this.companies.findOne({ where: { id: invite.companyId } });
    return { email: invite.email, role: invite.role, companyName: company?.name };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const tokenHash = hashToken(dto.token);
    const invite = await this.inviteTokens.findOne({ where: { tokenHash } });
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      throw new UnauthorizedException('Invitation invalide ou expirée');
    }

    const existing = await this.users.findOne({ where: { email: invite.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.save(
      this.users.create({
        email: invite.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        role: invite.role,
        companyId: invite.companyId,
      }),
    );

    invite.acceptedAt = new Date();
    await this.inviteTokens.save(invite);

    const company = await this.companies.findOne({ where: { id: invite.companyId } });
    await this.auditLogService.log({
      companyId: invite.companyId,
      userId: user.id,
      action: 'INVITE_ACCEPTED',
      entityType: 'User',
      entityId: user.id,
      metadata: { role: invite.role },
    });
    return this.issueSession(user, company);
  }
}
