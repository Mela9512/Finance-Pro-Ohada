import { MigrationInterface, QueryRunner } from "typeorm";

export class CommandesLivraison1785423910614 implements MigrationInterface {
    name = 'CommandesLivraison1785423910614'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "commande_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying NOT NULL, "quantity" numeric(15,2) NOT NULL, "unitPrice" numeric(15,2) NOT NULL, "tvaRate" numeric(5,2) NOT NULL, "totalHT" numeric(15,2) NOT NULL, "totalTVA" numeric(15,2) NOT NULL, "totalTTC" numeric(15,2) NOT NULL, "accountCode" character varying NOT NULL, "commandeId" uuid, CONSTRAINT "PK_f2678db59ecfd337a0d19889cee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."commandes_type_enum" AS ENUM('VENTE', 'ACHAT')`);
        await queryRunner.query(`CREATE TYPE "public"."commandes_status_enum" AS ENUM('BROUILLON', 'CONFIRMEE', 'LIVREE', 'FACTUREE', 'ANNULEE')`);
        await queryRunner.query(`CREATE TABLE "commandes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" character varying NOT NULL, "numero" character varying NOT NULL, "type" "public"."commandes_type_enum" NOT NULL, "tierId" character varying NOT NULL, "tierName" character varying NOT NULL, "date" character varying NOT NULL, "subtotalHT" numeric(15,2) NOT NULL, "totalTVA" numeric(15,2) NOT NULL, "totalTTC" numeric(15,2) NOT NULL, "status" "public"."commandes_status_enum" NOT NULL DEFAULT 'BROUILLON', "notes" character varying, "createdBy" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4aa54306c3036e48964ce190204" UNIQUE ("companyId", "numero"), CONSTRAINT "PK_048c7aef9a99d4aed24c9054893" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bon_livraison_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying NOT NULL, "quantity" numeric(15,2) NOT NULL, "unitPrice" numeric(15,2) NOT NULL, "tvaRate" numeric(5,2) NOT NULL, "totalHT" numeric(15,2) NOT NULL, "totalTVA" numeric(15,2) NOT NULL, "totalTTC" numeric(15,2) NOT NULL, "accountCode" character varying NOT NULL, "bonLivraisonId" uuid, CONSTRAINT "PK_068e353f7467daa95153cae4ca6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."bons_livraison_type_enum" AS ENUM('VENTE', 'ACHAT')`);
        await queryRunner.query(`CREATE TYPE "public"."bons_livraison_status_enum" AS ENUM('CONFIRME', 'FACTURE')`);
        await queryRunner.query(`CREATE TABLE "bons_livraison" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" character varying NOT NULL, "commandeId" character varying NOT NULL, "numero" character varying NOT NULL, "type" "public"."bons_livraison_type_enum" NOT NULL, "tierId" character varying NOT NULL, "tierName" character varying NOT NULL, "date" character varying NOT NULL, "status" "public"."bons_livraison_status_enum" NOT NULL DEFAULT 'CONFIRME', "invoiceId" character varying, "createdBy" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f88a844e693a96869cf9794e2af" UNIQUE ("companyId", "numero"), CONSTRAINT "PK_a07e251353953acca55e908694c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearStart" SET DEFAULT to_char(now(), 'YYYY') || '-01-01'`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearEnd" SET DEFAULT to_char(now(), 'YYYY') || '-12-31'`);
        await queryRunner.query(`ALTER TABLE "commande_items" ADD CONSTRAINT "FK_a6f5387d97f190ec037bb7d32ea" FOREIGN KEY ("commandeId") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bon_livraison_items" ADD CONSTRAINT "FK_d8d78cc6b0210ec5944fe88606b" FOREIGN KEY ("bonLivraisonId") REFERENCES "bons_livraison"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bon_livraison_items" DROP CONSTRAINT "FK_d8d78cc6b0210ec5944fe88606b"`);
        await queryRunner.query(`ALTER TABLE "commande_items" DROP CONSTRAINT "FK_a6f5387d97f190ec037bb7d32ea"`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearEnd" SET DEFAULT (to_char(now(), 'YYYY') || '-12-31')`);
        await queryRunner.query(`ALTER TABLE "companies" ALTER COLUMN "fiscalYearStart" SET DEFAULT (to_char(now(), 'YYYY') || '-01-01')`);
        await queryRunner.query(`DROP TABLE "bons_livraison"`);
        await queryRunner.query(`DROP TYPE "public"."bons_livraison_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."bons_livraison_type_enum"`);
        await queryRunner.query(`DROP TABLE "bon_livraison_items"`);
        await queryRunner.query(`DROP TABLE "commandes"`);
        await queryRunner.query(`DROP TYPE "public"."commandes_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."commandes_type_enum"`);
        await queryRunner.query(`DROP TABLE "commande_items"`);
    }

}
