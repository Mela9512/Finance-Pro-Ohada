import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserEntity } from '../../entities/user.entity';
import { CompanyEntity } from '../../entities/company.entity';
import { PasswordResetTokenEntity } from '../../entities/password-reset-token.entity';
import { InviteTokenEntity } from '../../entities/invite-token.entity';
import { AuditLogEntity } from '../../entities/audit-log.entity';
import { EmailService } from '../../common/services/email.service';
import { AuditLogService } from '../../common/services/audit-log.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, CompanyEntity, PasswordResetTokenEntity, InviteTokenEntity, AuditLogEntity]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '8h') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EmailService, AuditLogService],
  exports: [AuthService],
})
export class AuthModule {}
