import { MigrationInterface, QueryRunner } from "typeorm";

export class BusinessPlan1785159287483 implements MigrationInterface {
    name = 'BusinessPlan1785159287483'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "business_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" character varying NOT NULL, "createdBy" character varying NOT NULL, "title" character varying NOT NULL, "projectDescription" text NOT NULL, "investmentAmount" numeric(15,2) NOT NULL, "projectionYears" integer NOT NULL, "year1Revenue" numeric(15,2) NOT NULL, "revenueGrowthRatePercent" numeric(5,2) NOT NULL, "variableCostPercent" numeric(5,2) NOT NULL, "fixedCostsAnnual" numeric(15,2) NOT NULL, "discountRatePercent" numeric(5,2) NOT NULL, "projections" text NOT NULL, "van" numeric(15,2) NOT NULL, "tri" numeric(8,2), "seuilRentabilite" numeric(15,2) NOT NULL, "creditScore" integer NOT NULL, "narrative" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_461167914444abdd6e3aa36ea2c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearStart" SET DEFAULT to_char(now(), 'YYYY') || '-01-01'`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearEnd" SET DEFAULT to_char(now(), 'YYYY') || '-12-31'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearEnd" SET DEFAULT (to_char(now(), 'YYYY') || '-12-31')`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearStart" SET DEFAULT (to_char(now(), 'YYYY') || '-01-01')`);
        await queryRunner.query(`DROP TABLE "business_plans"`);
    }

}
