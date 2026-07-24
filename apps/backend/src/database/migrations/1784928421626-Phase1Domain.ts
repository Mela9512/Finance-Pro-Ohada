import { MigrationInterface, QueryRunner } from "typeorm";

export class Phase1Domain1784928421626 implements MigrationInterface {
    name = 'Phase1Domain1784928421626'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "name" character varying NOT NULL, "nif" character varying, "phone" character varying NOT NULL, "email" character varying NOT NULL, "address" character varying NOT NULL, "balance" numeric(15,2) NOT NULL DEFAULT '0', "creditLimit" numeric(15,2) NOT NULL DEFAULT '0', "companyId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f2eee14aa1fe3e956fe193c142f" UNIQUE ("code"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "suppliers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "name" character varying NOT NULL, "nif" character varying, "phone" character varying NOT NULL, "email" character varying NOT NULL, "address" character varying NOT NULL, "balance" numeric(15,2) NOT NULL DEFAULT '0', "companyId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6f01a03dcb1aa33822e19534cd6" UNIQUE ("code"), CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "invoice_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying NOT NULL, "quantity" numeric(15,2) NOT NULL, "unitPrice" numeric(15,2) NOT NULL, "tvaRate" numeric(5,2) NOT NULL, "totalHT" numeric(15,2) NOT NULL, "totalTVA" numeric(15,2) NOT NULL, "totalTTC" numeric(15,2) NOT NULL, "accountCode" character varying NOT NULL, "invoiceId" uuid, CONSTRAINT "PK_53b99f9e0e2945e69de1a12b75a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."invoices_type_enum" AS ENUM('VENTE', 'ACHAT', 'AVOIR')`);
        await queryRunner.query(`CREATE TYPE "public"."invoices_status_enum" AS ENUM('BROUILLON', 'VALIDE', 'PAYE', 'ANNULE', 'PARTIEL')`);
        await queryRunner.query(`CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoiceNumber" character varying NOT NULL, "type" "public"."invoices_type_enum" NOT NULL, "tierId" character varying NOT NULL, "tierName" character varying NOT NULL, "date" character varying NOT NULL, "dueDate" character varying NOT NULL, "subtotalHT" numeric(15,2) NOT NULL, "totalTVA" numeric(15,2) NOT NULL, "airRate" numeric(5,2) NOT NULL DEFAULT '0', "totalAIR" numeric(15,2) NOT NULL DEFAULT '0', "totalTTC" numeric(15,2) NOT NULL, "amountPaid" numeric(15,2) NOT NULL DEFAULT '0', "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'BROUILLON', "notes" character varying, "companyId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_bf8e0f9dd4558ef209ec111782d" UNIQUE ("invoiceNumber"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."treasury_accounts_type_enum" AS ENUM('BANQUE', 'CAISSE', 'MOBILE_MONEY')`);
        await queryRunner.query(`CREATE TABLE "treasury_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "name" character varying NOT NULL, "type" "public"."treasury_accounts_type_enum" NOT NULL, "accountNumber" character varying, "rib" character varying, "currency" character varying NOT NULL DEFAULT 'XAF', "balance" numeric(15,2) NOT NULL DEFAULT '0', "companyId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ee39d49e884376c0213c8faff38" UNIQUE ("code"), CONSTRAINT "PK_519a76c46e7ea4655a5bfb7fc30" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."treasury_transactions_type_enum" AS ENUM('ENCAISSEMENT', 'DECAISSEMENT', 'VIREMENT_INTERNE')`);
        await queryRunner.query(`CREATE TYPE "public"."treasury_transactions_status_enum" AS ENUM('RAPPROCHE', 'EN_ATTENTE')`);
        await queryRunner.query(`CREATE TABLE "treasury_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treasuryAccountId" character varying NOT NULL, "treasuryAccountName" character varying NOT NULL, "date" character varying NOT NULL, "type" "public"."treasury_transactions_type_enum" NOT NULL, "category" character varying NOT NULL, "amount" numeric(15,2) NOT NULL, "reference" character varying NOT NULL, "tierName" character varying, "status" "public"."treasury_transactions_status_enum" NOT NULL DEFAULT 'EN_ATTENTE', "description" character varying NOT NULL, "companyId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9fd927d87e6f9125b418a991bc9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sequences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" character varying NOT NULL, "key" character varying NOT NULL, "lastNumber" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_c747378b15ecf1d61c58430c0f5" UNIQUE ("companyId", "key"), CONSTRAINT "PK_7c7f5d8c822411196242b89bc76" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" character varying NOT NULL, "userId" character varying NOT NULL, "action" character varying NOT NULL, "entityType" character varying, "entityId" character varying, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "isExerciceClosed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "invoice_items" ADD CONSTRAINT "FK_7fb6895fc8fad9f5200e91abb59" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoice_items" DROP CONSTRAINT "FK_7fb6895fc8fad9f5200e91abb59"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "isExerciceClosed"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "sequences"`);
        await queryRunner.query(`DROP TABLE "treasury_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."treasury_transactions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."treasury_transactions_type_enum"`);
        await queryRunner.query(`DROP TABLE "treasury_accounts"`);
        await queryRunner.query(`DROP TYPE "public"."treasury_accounts_type_enum"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
        await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."invoices_type_enum"`);
        await queryRunner.query(`DROP TABLE "invoice_items"`);
        await queryRunner.query(`DROP TABLE "suppliers"`);
        await queryRunner.query(`DROP TABLE "customers"`);
    }

}
