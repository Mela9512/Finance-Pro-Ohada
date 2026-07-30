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
import { PasswordResetTokenEntity } from '../entities/password-reset-token.entity';
import { InviteTokenEntity } from '../entities/invite-token.entity';
import { BankStatementLineEntity } from '../entities/bank-statement-line.entity';
import { BusinessPlanEntity } from '../entities/business-plan.entity';
import { ImmobilisationEntity } from '../entities/immobilisation.entity';
import { StockArticleEntity } from '../entities/stock-article.entity';
import { StockMouvementEntity } from '../entities/stock-mouvement.entity';

dotenv.config();

const isSupabase = process.env.DATABASE_URL?.includes('supabase');

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: isSupabase || process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  extra: {
    max: 10,
    connectionTimeoutMillis: 5000,
    // Sans ces réglages, une connexion coupée côté pooler Supabase (idle) reste
    // "vivante" dans le pool node-pg et toute requête qui la réutilise reste
    // bloquée indéfiniment (pas d'erreur, pas de timeout — juste un hang).
    idleTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    statement_timeout: 15000,
    query_timeout: 15000,
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
    PasswordResetTokenEntity,
    InviteTokenEntity,
    BankStatementLineEntity,
    BusinessPlanEntity,
    ImmobilisationEntity,
    StockArticleEntity,
    StockMouvementEntity,
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
