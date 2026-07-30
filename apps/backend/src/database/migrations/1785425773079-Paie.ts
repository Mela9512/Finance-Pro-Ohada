import { MigrationInterface, QueryRunner } from "typeorm";

export class Paie1785425773079 implements MigrationInterface {
    name = 'Paie1785425773079'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."employees_statut_enum" AS ENUM('ACTIF', 'INACTIF')`);
        await queryRunner.query(`CREATE TABLE "employees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" character varying NOT NULL, "matricule" character varying NOT NULL, "nom" character varying NOT NULL, "poste" character varying NOT NULL, "dateEmbauche" date NOT NULL, "salaireBase" numeric(15,2) NOT NULL, "numeroCNSS" character varying, "statut" "public"."employees_statut_enum" NOT NULL DEFAULT 'ACTIF', "createdBy" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8d8d779ba6a373c810b28123f90" UNIQUE ("companyId", "matricule"), CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."bulletins_paie_status_enum" AS ENUM('BROUILLON', 'VALIDE')`);
        await queryRunner.query(`CREATE TABLE "bulletins_paie" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" character varying NOT NULL, "employeeId" character varying NOT NULL, "employeeName" character varying NOT NULL, "periodYear" integer NOT NULL, "periodMonth" integer NOT NULL, "salaireBase" numeric(15,2) NOT NULL, "primesImposables" numeric(15,2) NOT NULL DEFAULT '0', "primesNonImposables" numeric(15,2) NOT NULL DEFAULT '0', "brut" numeric(15,2) NOT NULL, "detailCotisationsSalariales" text NOT NULL, "totalCotisationsSalariales" numeric(15,2) NOT NULL, "detailCotisationsPatronales" text NOT NULL, "totalCotisationsPatronales" numeric(15,2) NOT NULL, "salaireImposable" numeric(15,2) NOT NULL, "irpp" numeric(15,2) NOT NULL, "net" numeric(15,2) NOT NULL, "status" "public"."bulletins_paie_status_enum" NOT NULL DEFAULT 'BROUILLON', "journalEntryId" character varying, "createdBy" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_09c7e46ec7f50f9b99af060750c" UNIQUE ("companyId", "employeeId", "periodYear", "periodMonth"), CONSTRAINT "PK_473b8b4009358202b818c648c5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "payrollSmig" double precision`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "payrollTaxBrackets" text`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "payrollEmployeeContributions" text`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "payrollEmployerContributions" text`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearStart" SET DEFAULT to_char(now(), 'YYYY') || '-01-01'`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearEnd" SET DEFAULT to_char(now(), 'YYYY') || '-12-31'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearEnd" SET DEFAULT (to_char(now(), 'YYYY') || '-12-31')`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearStart" SET DEFAULT (to_char(now(), 'YYYY') || '-01-01')`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "payrollEmployerContributions"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "payrollEmployeeContributions"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "payrollTaxBrackets"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "payrollSmig"`);
        await queryRunner.query(`DROP TABLE "bulletins_paie"`);
        await queryRunner.query(`DROP TYPE "public"."bulletins_paie_status_enum"`);
        await queryRunner.query(`DROP TABLE "employees"`);
        await queryRunner.query(`DROP TYPE "public"."employees_statut_enum"`);
    }

}
