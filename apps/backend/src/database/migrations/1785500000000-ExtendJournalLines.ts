import { MigrationInterface, QueryRunner } from "typeorm";

export class ExtendJournalLines1785500000000 implements MigrationInterface {
    name = 'ExtendJournalLines1785500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "journal_lines" ADD "costCenter" character varying`);
        await queryRunner.query(`ALTER TABLE "journal_lines" ADD "project" character varying`);
        await queryRunner.query(`ALTER TABLE "journal_lines" ADD "currency" character varying`);
        await queryRunner.query(`ALTER TABLE "journal_lines" ADD "exchangeRate" numeric(10,4) DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE "journal_lines" ADD "reference" character varying`);
        await queryRunner.query(`ALTER TABLE "journal_lines" ADD "dueDate" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "journal_lines" DROP COLUMN "dueDate"`);
        await queryRunner.query(`ALTER TABLE "journal_lines" DROP COLUMN "reference"`);
        await queryRunner.query(`ALTER TABLE "journal_lines" DROP COLUMN "exchangeRate"`);
        await queryRunner.query(`ALTER TABLE "journal_lines" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "journal_lines" DROP COLUMN "project"`);
        await queryRunner.query(`ALTER TABLE "journal_lines" DROP COLUMN "costCenter"`);
    }
}
