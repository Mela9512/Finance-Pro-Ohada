import { MigrationInterface, QueryRunner } from "typeorm";

export class Stocks1785422738165 implements MigrationInterface {
    name = 'Stocks1785422738165'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "stock_articles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" character varying NOT NULL, "code" character varying NOT NULL, "label" character varying NOT NULL, "unite" character varying NOT NULL, "accountCodeStock" character varying NOT NULL, "seuilAlerte" numeric(15,3), "createdBy" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_47b2b36b9b50f40b874805d2a7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."stock_mouvements_type_enum" AS ENUM('ENTREE', 'SORTIE')`);
        await queryRunner.query(`CREATE TABLE "stock_mouvements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" character varying NOT NULL, "articleId" character varying NOT NULL, "date" date NOT NULL, "type" "public"."stock_mouvements_type_enum" NOT NULL, "quantite" numeric(15,3) NOT NULL, "coutUnitaire" numeric(15,2) NOT NULL, "valeurTotale" numeric(15,2) NOT NULL, "reference" character varying, "createdBy" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_becb4d0c69fa0d6d6e42717f326" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearStart" SET DEFAULT to_char(now(), 'YYYY') || '-01-01'`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearEnd" SET DEFAULT to_char(now(), 'YYYY') || '-12-31'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearEnd" SET DEFAULT (to_char(now(), 'YYYY') || '-12-31')`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearStart" SET DEFAULT (to_char(now(), 'YYYY') || '-01-01')`);
        await queryRunner.query(`DROP TABLE "stock_mouvements"`);
        await queryRunner.query(`DROP TYPE "public"."stock_mouvements_type_enum"`);
        await queryRunner.query(`DROP TABLE "stock_articles"`);
    }

}
