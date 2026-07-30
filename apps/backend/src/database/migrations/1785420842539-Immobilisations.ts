import { MigrationInterface, QueryRunner } from "typeorm";

export class Immobilisations1785420842539 implements MigrationInterface {
    name = 'Immobilisations1785420842539'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."immobilisations_status_enum" AS ENUM('EN_SERVICE', 'CEDE', 'REFORME')`);
        await queryRunner.query(`CREATE TABLE "immobilisations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" character varying NOT NULL, "code" character varying NOT NULL, "label" character varying NOT NULL, "accountCode" character varying NOT NULL, "dateAcquisition" date NOT NULL, "dateMiseEnService" date NOT NULL, "valeurAcquisitionHT" numeric(15,2) NOT NULL, "valeurResiduelle" numeric(15,2) NOT NULL DEFAULT '0', "dureeAmortissementAns" integer NOT NULL, "status" "public"."immobilisations_status_enum" NOT NULL DEFAULT 'EN_SERVICE', "dateCession" date, "valeurCession" numeric(15,2), "exercicesDotationGeneres" text, "createdBy" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dd17e4ef469a009a24efae9deb9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearStart" SET DEFAULT to_char(now(), 'YYYY') || '-01-01'`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearEnd" SET DEFAULT to_char(now(), 'YYYY') || '-12-31'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearEnd" SET DEFAULT (to_char(now(), 'YYYY') || '-12-31')`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearStart" SET DEFAULT (to_char(now(), 'YYYY') || '-01-01')`);
        await queryRunner.query(`DROP TABLE "immobilisations"`);
        await queryRunner.query(`DROP TYPE "public"."immobilisations_status_enum"`);
    }

}
