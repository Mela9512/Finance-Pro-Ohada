import { MigrationInterface, QueryRunner } from "typeorm";

export class SaaSAuth1784960787138 implements MigrationInterface {
    name = 'SaaSAuth1784960787138'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "password_reset_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "tokenHash" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "usedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1143abb8c3fad8b06dd857a8c9c" UNIQUE ("tokenHash"), CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."invite_tokens_role_enum" AS ENUM('ADMIN', 'COMPTABLE', 'GESTIONNAIRE', 'LECTEUR')`);
        await queryRunner.query(`CREATE TABLE "invite_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" character varying NOT NULL, "email" character varying NOT NULL, "role" "public"."invite_tokens_role_enum" NOT NULL, "tokenHash" character varying NOT NULL, "invitedBy" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "acceptedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_906800fcd3eb1875f60b3623e8e" UNIQUE ("tokenHash"), CONSTRAINT "PK_5a05a43816424a1abac69e1f8a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "isOnboarded" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "rccm" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "nif" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "address" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "city" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "country" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearStart" SET DEFAULT to_char(now(), 'YYYY') || '-01-01'`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearEnd" SET DEFAULT to_char(now(), 'YYYY') || '-12-31'`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "metadata" TYPE text USING "metadata"::text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" ALTER COLUMN "metadata" TYPE jsonb USING "metadata"::jsonb`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearEnd" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearStart" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "country" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "city" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "address" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "nif" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "rccm" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "isOnboarded"`);
        await queryRunner.query(`DROP TABLE "invite_tokens"`);
        await queryRunner.query(`DROP TYPE "public"."invite_tokens_role_enum"`);
        await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
    }

}
