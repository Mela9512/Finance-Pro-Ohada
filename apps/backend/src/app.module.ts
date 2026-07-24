import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { dataSourceOptions } from './database/data-source';

import { AccountEntity } from './entities/account.entity';
import { CompanyEntity } from './entities/company.entity';
import { UserEntity } from './entities/user.entity';
import { JournalEntryEntity } from './entities/journal-entry.entity';
import { JournalLineEntity } from './entities/journal-line.entity';
import { CustomerEntity } from './entities/customer.entity';
import { SupplierEntity } from './entities/supplier.entity';
import { InvoiceEntity } from './entities/invoice.entity';
import { InvoiceItemEntity } from './entities/invoice-item.entity';
import { TreasuryAccountEntity } from './entities/treasury-account.entity';
import { TreasuryTransactionEntity } from './entities/treasury-transaction.entity';
import { SequenceEntity } from './entities/sequence.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { BudgetEntity } from './entities/budget.entity';

import { SequenceService } from './common/services/sequence.service';
import { AuditLogService } from './common/services/audit-log.service';

import { DashboardController } from './modules/dashboard/dashboard.controller';
import { DashboardService } from './modules/dashboard/dashboard.service';
import { AccountingController } from './modules/accounting/accounting.controller';
import { AccountingService } from './modules/accounting/accounting.service';
import { TreasuryController } from './modules/treasury/treasury.controller';
import { TreasuryService } from './modules/treasury/treasury.service';
import { ClientsController } from './modules/clients/clients.controller';
import { ClientsService } from './modules/clients/clients.service';
import { SuppliersController } from './modules/suppliers/suppliers.controller';
import { SuppliersService } from './modules/suppliers/suppliers.service';
import { InvoicingController } from './modules/invoicing/invoicing.controller';
import { InvoicingService } from './modules/invoicing/invoicing.service';
import { ReportsController } from './modules/reports/reports.controller';
import { ReportsService } from './modules/reports/reports.service';
import { AdminController } from './modules/admin/admin.controller';
import { AdminService } from './modules/admin/admin.service';
import { BudgetController } from './modules/budget/budget.controller';
import { BudgetService } from './modules/budget/budget.service';
import { SupabaseService } from './supabase.service';

const dbUrl = process.env.DATABASE_URL || '';
const isDirectPg = dbUrl.startsWith('postgresql://') && !dbUrl.includes('db.lacapogzijbmabzwxexl.supabase.co');

const ormConfig = isDirectPg
  ? {
      ...dataSourceOptions,
      retryAttempts: 1,
      retryDelay: 500,
    }
  : {
      type: 'sqlite' as const,
      database: ':memory:',
      entities: dataSourceOptions.entities,
      synchronize: true,
    };

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(ormConfig),
    TypeOrmModule.forFeature([
      AccountEntity,
      CompanyEntity,
      UserEntity,
      JournalEntryEntity,
      JournalLineEntity,
      CustomerEntity,
      SupplierEntity,
      InvoiceEntity,
      InvoiceItemEntity,
      TreasuryAccountEntity,
      TreasuryTransactionEntity,
      SequenceEntity,
      AuditLogEntity,
      BudgetEntity,
    ]),
    AuthModule,
  ],
  controllers: [
    DashboardController,
    AccountingController,
    TreasuryController,
    ClientsController,
    SuppliersController,
    InvoicingController,
    ReportsController,
    AdminController,
    BudgetController,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    SequenceService,
    AuditLogService,
    DashboardService,
    AccountingService,
    TreasuryService,
    ClientsService,
    SuppliersService,
    InvoicingService,
    ReportsService,
    AdminService,
    BudgetService,
    SupabaseService,
  ],
})
export class AppModule {}
