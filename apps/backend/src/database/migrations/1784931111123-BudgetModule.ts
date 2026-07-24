import { MigrationInterface, QueryRunner } from "typeorm";

export class BudgetModule1784931111123 implements MigrationInterface {
    name = 'BudgetModule1784931111123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "budgets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" character varying NOT NULL, "accountCode" character varying NOT NULL, "exercice" integer NOT NULL, "period" integer, "amountBudgeted" numeric(15,2) NOT NULL, "createdBy" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_91d33f0ee63f74ad0d23eb8e799" UNIQUE ("companyId", "accountCode", "exercice", "period"), CONSTRAINT "PK_9c8a51748f82387644b773da482" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "budgets"`);
    }

}
