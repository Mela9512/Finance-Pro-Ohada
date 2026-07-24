import { Module } from '@nestjs/common';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
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
import { SupabaseService } from './supabase.service';

@Module({
  imports: [],
  controllers: [
    AuthController,
    DashboardController,
    AccountingController,
    TreasuryController,
    ClientsController,
    SuppliersController,
    InvoicingController,
    ReportsController,
    AdminController
  ],
  providers: [
    AuthService,
    DashboardService,
    AccountingService,
    TreasuryService,
    ClientsService,
    SuppliersService,
    InvoicingService,
    ReportsService,
    AdminService,
    SupabaseService
  ],
})
export class AppModule {}
