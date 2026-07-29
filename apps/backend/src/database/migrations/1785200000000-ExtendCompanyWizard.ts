import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ExtendCompanyWizard1785200000000 implements MigrationInterface {
  name = 'ExtendCompanyWizard1785200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── Informations générales ────────────────────────────────────────────────
    await queryRunner.addColumn('companies', new TableColumn({ name: 'logo', type: 'text', isNullable: true }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'language', type: 'varchar', length: '10', isNullable: true, default: "'fr'" }));

    // ─── Identification légale ─────────────────────────────────────────────────
    await queryRunner.addColumn('companies', new TableColumn({ name: 'legalName', type: 'varchar', isNullable: true }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'legalForm', type: 'varchar', isNullable: true }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'capital', type: 'float', isNullable: true }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'sector', type: 'varchar', isNullable: true }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'incorporationDate', type: 'varchar', isNullable: true }));

    // ─── Coordonnées ──────────────────────────────────────────────────────────
    await queryRunner.addColumn('companies', new TableColumn({ name: 'region', type: 'varchar', isNullable: true }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'phone', type: 'varchar', isNullable: true }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'email', type: 'varchar', isNullable: true }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'website', type: 'varchar', isNullable: true }));

    // ─── Paramètres comptables ────────────────────────────────────────────────
    await queryRunner.addColumn('companies', new TableColumn({ name: 'fiscalYear', type: 'integer', isNullable: true }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'accountLength', type: 'integer', isNullable: false, default: 6 }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'decimals', type: 'integer', isNullable: false, default: 2 }));

    // ─── Fiscalité ────────────────────────────────────────────────────────────
    await queryRunner.addColumn('companies', new TableColumn({ name: 'taxRegime', type: 'varchar', isNullable: true }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'taxCenter', type: 'varchar', isNullable: true }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'taxNumber', type: 'varchar', isNullable: true }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'vatEnabled', type: 'boolean', isNullable: false, default: false }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'vatRate', type: 'float', isNullable: true }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'withholdingTax', type: 'boolean', isNullable: false, default: false }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'corporateTax', type: 'boolean', isNullable: false, default: false }));

    // ─── Banque & Trésorerie ──────────────────────────────────────────────────
    await queryRunner.addColumn('companies', new TableColumn({ name: 'bankName', type: 'varchar', isNullable: true }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'bankAccount', type: 'varchar', isNullable: true }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'bankCode', type: 'varchar', isNullable: true }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'cashName', type: 'varchar', isNullable: true }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'paymentMethods', type: 'text', isNullable: false, default: "'[]'" }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'bankCurrency', type: 'varchar', isNullable: true }));

    // ─── Organisation ─────────────────────────────────────────────────────────
    await queryRunner.addColumn('companies', new TableColumn({ name: 'departments', type: 'text', isNullable: false, default: "'[]'" }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'directions', type: 'text', isNullable: false, default: "'[]'" }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'branches', type: 'text', isNullable: false, default: "'[]'" }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'costCenters', type: 'text', isNullable: false, default: "'[]'" }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'profitCenters', type: 'text', isNullable: false, default: "'[]'" }));
    await queryRunner.addColumn('companies', new TableColumn({ name: 'projects', type: 'text', isNullable: false, default: "'[]'" }));

    // ─── Modules ──────────────────────────────────────────────────────────────
    await queryRunner.addColumn('companies', new TableColumn({
      name: 'enabledModules',
      type: 'text',
      isNullable: false,
      default: `'["comptabilite","tresorerie","etats","dashboard"]'`,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const cols = [
      'logo', 'language', 'legalName', 'legalForm', 'capital', 'sector', 'incorporationDate',
      'region', 'phone', 'email', 'website',
      'fiscalYear', 'accountLength', 'decimals',
      'taxRegime', 'taxCenter', 'taxNumber', 'vatEnabled', 'vatRate', 'withholdingTax', 'corporateTax',
      'bankName', 'bankAccount', 'bankCode', 'cashName', 'paymentMethods', 'bankCurrency',
      'departments', 'directions', 'branches', 'costCenters', 'profitCenters', 'projects',
      'enabledModules',
    ];
    for (const col of cols) {
      await queryRunner.dropColumn('companies', col);
    }
  }
}
