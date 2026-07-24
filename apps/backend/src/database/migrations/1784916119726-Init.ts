import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1784916119726 implements MigrationInterface {
    name = 'Init1784916119726'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'COMPTABLE', 'GESTIONNAIRE', 'LECTEUR')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "name" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'COMPTABLE', "companyId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "rccm" character varying NOT NULL, "nif" character varying NOT NULL, "address" character varying NOT NULL, "city" character varying NOT NULL, "country" character varying NOT NULL, "currency" character varying NOT NULL DEFAULT 'XAF', "fiscalYearStart" character varying NOT NULL, "fiscalYearEnd" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_79c89d983c3e8464f9238324235" UNIQUE ("rccm"), CONSTRAINT "UQ_cd6d422496e98344a685c5689b3" UNIQUE ("nif"), CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "label" character varying NOT NULL, "category" character varying NOT NULL, "type" character varying NOT NULL, "classNum" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_490319656e54a7957dc1fed027c" UNIQUE ("code"), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "journal_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountCode" character varying NOT NULL, "accountLabel" character varying NOT NULL, "debit" numeric(15,2) NOT NULL DEFAULT '0', "credit" numeric(15,2) NOT NULL DEFAULT '0', "description" character varying, "entryId" uuid, CONSTRAINT "PK_70cba2da4588cee8921f73ef136" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "journal_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entryNumber" character varying NOT NULL, "date" character varying NOT NULL, "journalType" character varying NOT NULL, "wording" character varying NOT NULL, "pieceNumber" character varying NOT NULL, "isValidated" boolean NOT NULL DEFAULT true, "createdBy" character varying NOT NULL, "companyId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4b3b30432878ce7cc7882e919be" UNIQUE ("entryNumber"), CONSTRAINT "PK_a70368e64230434457c8d007ab3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "journal_lines" ADD CONSTRAINT "FK_500988f9309b9e8eb1e526158e4" FOREIGN KEY ("entryId") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "journal_lines" DROP CONSTRAINT "FK_500988f9309b9e8eb1e526158e4"`);
        await queryRunner.query(`DROP TABLE "journal_entries"`);
        await queryRunner.query(`DROP TABLE "journal_lines"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
