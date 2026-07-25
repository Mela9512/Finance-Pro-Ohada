import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { UserEntity } from '../entities/user.entity';
import { CompanyEntity } from '../entities/company.entity';
import { AccountEntity } from '../entities/account.entity';
import { JournalEntryEntity } from '../entities/journal-entry.entity';
import { JournalLineEntity } from '../entities/journal-line.entity';
import { CustomerEntity } from '../entities/customer.entity';
import { SupplierEntity } from '../entities/supplier.entity';
import { InvoiceEntity } from '../entities/invoice.entity';
import { InvoiceItemEntity } from '../entities/invoice-item.entity';
import { TreasuryAccountEntity } from '../entities/treasury-account.entity';
import { TreasuryTransactionEntity } from '../entities/treasury-transaction.entity';
import { SequenceEntity } from '../entities/sequence.entity';
import { AuditLogEntity } from '../entities/audit-log.entity';
import { BudgetEntity } from '../entities/budget.entity';

dotenv.config();

const isSupabase = process.env.DATABASE_URL?.includes('supabase');

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: isSupabase || process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  extra: {
    connectionTimeoutMillis: 5000,
  },
  entities: [
    UserEntity,
    CompanyEntity,
    AccountEntity,
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
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
