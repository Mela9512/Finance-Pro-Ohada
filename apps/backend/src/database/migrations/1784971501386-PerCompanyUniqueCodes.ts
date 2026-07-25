import { MigrationInterface, QueryRunner } from "typeorm";

export class PerCompanyUniqueCodes1784971501386 implements MigrationInterface {
    name = 'PerCompanyUniqueCodes1784971501386'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearStart" SET DEFAULT to_char(now(), 'YYYY') || '-01-01'`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearEnd" SET DEFAULT to_char(now(), 'YYYY') || '-12-31'`);
        await queryRunner.query(`ALTER TABLE "journal_entries" DROP CONSTRAINT "UQ_4b3b30432878ce7cc7882e919be"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_f2eee14aa1fe3e956fe193c142f"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT "UQ_6f01a03dcb1aa33822e19534cd6"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "UQ_bf8e0f9dd4558ef209ec111782d"`);
        await queryRunner.query(`ALTER TABLE "treasury_accounts" DROP CONSTRAINT "UQ_ee39d49e884376c0213c8faff38"`);
        await queryRunner.query(`ALTER TABLE "journal_entries" ADD CONSTRAINT "UQ_96c3891bb5bf64df54791d0a000" UNIQUE ("companyId", "entryNumber")`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_b8f614c7168c02c9e58a433e187" UNIQUE ("companyId", "code")`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD CONSTRAINT "UQ_654459b7e7668b885f047f4e153" UNIQUE ("companyId", "code")`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "UQ_5306b1cb7e79346085c73c04805" UNIQUE ("companyId", "invoiceNumber")`);
        await queryRunner.query(`ALTER TABLE "treasury_accounts" ADD CONSTRAINT "UQ_f485b20eaa56252038332798b34" UNIQUE ("companyId", "code")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "treasury_accounts" DROP CONSTRAINT "UQ_f485b20eaa56252038332798b34"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "UQ_5306b1cb7e79346085c73c04805"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT "UQ_654459b7e7668b885f047f4e153"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "UQ_b8f614c7168c02c9e58a433e187"`);
        await queryRunner.query(`ALTER TABLE "journal_entries" DROP CONSTRAINT "UQ_96c3891bb5bf64df54791d0a000"`);
        await queryRunner.query(`ALTER TABLE "treasury_accounts" ADD CONSTRAINT "UQ_ee39d49e884376c0213c8faff38" UNIQUE ("code")`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "UQ_bf8e0f9dd4558ef209ec111782d" UNIQUE ("invoiceNumber")`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD CONSTRAINT "UQ_6f01a03dcb1aa33822e19534cd6" UNIQUE ("code")`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "UQ_f2eee14aa1fe3e956fe193c142f" UNIQUE ("code")`);
        await queryRunner.query(`ALTER TABLE "journal_entries" ADD CONSTRAINT "UQ_4b3b30432878ce7cc7882e919be" UNIQUE ("entryNumber")`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearEnd" SET DEFAULT (to_char(now(), 'YYYY') || '-12-31')`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearStart" SET DEFAULT (to_char(now(), 'YYYY') || '-01-01')`);
    }

}
