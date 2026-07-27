import { MigrationInterface, QueryRunner } from "typeorm";

export class BankStatementLines1785075668785 implements MigrationInterface {
    name = 'BankStatementLines1785075668785'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "bank_statement_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treasuryAccountId" character varying NOT NULL, "date" character varying NOT NULL, "description" character varying NOT NULL, "amount" numeric(15,2) NOT NULL, "reference" character varying, "matchedTransactionId" character varying, "companyId" character varying NOT NULL, "importedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f22e7c99c4dca5224741e09f7ae" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearStart" SET DEFAULT to_char(now(), 'YYYY') || '-01-01'`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearEnd" SET DEFAULT to_char(now(), 'YYYY') || '-12-31'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearEnd" SET DEFAULT (to_char(now(), 'YYYY') || '-12-31')`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearStart" SET DEFAULT (to_char(now(), 'YYYY') || '-01-01')`);
        await queryRunner.query(`DROP TABLE "bank_statement_lines"`);
    }

}
