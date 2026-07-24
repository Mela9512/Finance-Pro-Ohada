import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { SYSCOHADA_PLAN_COMPTABLE } from '@financepro/shared';
import dataSource from './data-source';
import { CompanyEntity } from '../entities/company.entity';
import { AccountEntity } from '../entities/account.entity';
import { UserEntity } from '../entities/user.entity';
import { CustomerEntity } from '../entities/customer.entity';
import { SupplierEntity } from '../entities/supplier.entity';
import { TreasuryAccountEntity } from '../entities/treasury-account.entity';
import { JournalEntryEntity } from '../entities/journal-entry.entity';
import { SequenceEntity } from '../entities/sequence.entity';

const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';

async function seed() {
  await dataSource.initialize();

  const companyRepo = dataSource.getRepository(CompanyEntity);
  const accountRepo = dataSource.getRepository(AccountEntity);
  const userRepo = dataSource.getRepository(UserEntity);

  let company = await companyRepo.findOne({ where: { rccm: 'CG-BZV-01-2024-B14-00129' } });
  if (!company) {
    company = await companyRepo.save(
      companyRepo.create({
        name: 'SOCIÉTÉ CONGO TRADING SA',
        rccm: 'CG-BZV-01-2024-B14-00129',
        nif: 'M08241198234A',
        address: "142 Avenue de l'Indépendance, Poto-Poto",
        city: 'Brazzaville',
        country: 'Congo',
        currency: 'XAF',
        fiscalYearStart: '2026-01-01',
        fiscalYearEnd: '2026-12-31',
      }),
    );
    console.log('Société créée :', company.name);
  } else {
    console.log('Société déjà existante, non recréée.');
  }

  const existingAccountsCount = await accountRepo.count();
  if (existingAccountsCount === 0) {
    const accounts = SYSCOHADA_PLAN_COMPTABLE.map((acc) =>
      accountRepo.create({
        code: acc.code,
        label: acc.label,
        category: acc.category,
        type: acc.type,
        classNum: acc.classNum,
      }),
    );
    await accountRepo.save(accounts);
    console.log(`Plan comptable SYSCOHADA inséré : ${accounts.length} comptes.`);
  } else {
    console.log('Plan comptable déjà présent, non réinséré.');
  }

  const demoUsers: Array<{ email: string; name: string; role: 'ADMIN' | 'COMPTABLE' | 'GESTIONNAIRE' | 'LECTEUR' }> = [
    { email: 'admin@financepro.ci', name: 'Alain KOUASSI', role: 'ADMIN' },
    { email: 'comptable@financepro.ci', name: 'Fatou DIOP', role: 'COMPTABLE' },
    { email: 'gestionnaire@financepro.ci', name: 'Marc BIKOKO', role: 'GESTIONNAIRE' },
  ];

  for (const demoUser of demoUsers) {
    const exists = await userRepo.findOne({ where: { email: demoUser.email } });
    if (!exists) {
      const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);
      await userRepo.save(
        userRepo.create({
          email: demoUser.email,
          passwordHash,
          name: demoUser.name,
          role: demoUser.role,
          companyId: company.id,
        }),
      );
      console.log(`Utilisateur ${demoUser.role} créé : ${demoUser.email}`);
    } else {
      console.log(`Utilisateur ${demoUser.email} déjà existant, non recréé.`);
    }
  }
  console.log(`Mot de passe (tous les comptes de démo) : ${SEED_ADMIN_PASSWORD} (à changer après premier login)`);

  const customerRepo = dataSource.getRepository(CustomerEntity);
  const existingCustomers = await customerRepo.count({ where: { companyId: company.id } });
  if (existingCustomers === 0) {
    await customerRepo.save([
      customerRepo.create({
        code: '411001',
        name: 'AFRIQUE BTP SARL',
        nif: 'M20231920',
        phone: '+242 06 612 34 56',
        email: 'contact@afriquebtp.cg',
        address: 'Avenue Foch, Centre-Ville, Brazzaville',
        balance: 0,
        creditLimit: 25000000,
        companyId: company.id,
      }),
      customerRepo.create({
        code: '411002',
        name: 'DISTRIB LOGISTIQUE SA',
        nif: 'M20234411',
        phone: '+242 05 520 88 99',
        email: 'finance@distriblog.cg',
        address: 'Zone Industrielle Mpila',
        balance: 0,
        creditLimit: 15000000,
        companyId: company.id,
      }),
      customerRepo.create({
        code: '411003',
        name: 'PHARMACIE DE LA PAIX',
        nif: 'M20228834',
        phone: '+242 06 444 11 22',
        email: 'commandes@pharmaciepaix.cg',
        address: 'Bacongo',
        balance: 0,
        creditLimit: 5000000,
        companyId: company.id,
      }),
    ]);
    console.log('3 clients de démonstration créés.');
  } else {
    console.log('Clients déjà existants, non recréés.');
  }

  const supplierRepo = dataSource.getRepository(SupplierEntity);
  const existingSuppliers = await supplierRepo.count({ where: { companyId: company.id } });
  if (existingSuppliers === 0) {
    await supplierRepo.save([
      supplierRepo.create({
        code: '401001',
        name: 'TOTAL ENERGIES MARKETING',
        nif: 'M20201010',
        phone: '+242 06 800 00 00',
        email: 'pro@totalenergies.cg',
        address: 'Pointe-Noire',
        balance: 0,
        companyId: company.id,
      }),
      supplierRepo.create({
        code: '401002',
        name: 'TELECOM AFRIQUE (MTN)',
        nif: 'M20212233',
        phone: '+242 06 600 11 22',
        email: 'corporate@mtn.cg',
        address: 'Brazzaville',
        balance: 0,
        companyId: company.id,
      }),
      supplierRepo.create({
        code: '401003',
        name: 'CABINET FIDUCIAIRE OHADA',
        nif: 'M20229900',
        phone: '+242 05 555 44 33',
        email: 'audit@fiduciaireohada.cg',
        address: 'Centre-Ville',
        balance: 0,
        companyId: company.id,
      }),
    ]);
    console.log('3 fournisseurs de démonstration créés.');
  } else {
    console.log('Fournisseurs déjà existants, non recréés.');
  }

  const treasuryRepo = dataSource.getRepository(TreasuryAccountEntity);
  const existingTreasury = await treasuryRepo.count({ where: { companyId: company.id } });
  if (existingTreasury === 0) {
    await treasuryRepo.save([
      treasuryRepo.create({
        code: '521001',
        name: 'BGFI Bank Congo',
        type: 'BANQUE',
        accountNumber: '10004 00129 982341-89',
        rib: 'BGFI-CG-01-9823',
        currency: 'XAF',
        balance: 43500000,
        companyId: company.id,
      }),
      treasuryRepo.create({
        code: '521002',
        name: 'Ecobank Congo',
        type: 'BANQUE',
        accountNumber: '10012 00045 119842-12',
        rib: 'ECO-CG-02-1198',
        currency: 'XAF',
        balance: 22100000,
        companyId: company.id,
      }),
      treasuryRepo.create({
        code: '541001',
        name: 'Caisse Principale Siège',
        type: 'CAISSE',
        currency: 'XAF',
        balance: 3450000,
        companyId: company.id,
      }),
      treasuryRepo.create({
        code: '571001',
        name: 'MTN Mobile Money Pro',
        type: 'MOBILE_MONEY',
        accountNumber: '+242066123456',
        currency: 'XAF',
        balance: 1850000,
        companyId: company.id,
      }),
    ]);
    console.log('4 comptes de trésorerie de démonstration créés.');
  } else {
    console.log('Comptes de trésorerie déjà existants, non recréés.');
  }

  const entryRepo = dataSource.getRepository(JournalEntryEntity);
  const sequenceRepo = dataSource.getRepository(SequenceEntity);
  const existingEntries = await entryRepo.count({ where: { companyId: company.id } });
  if (existingEntries === 0) {
    await entryRepo.save([
      entryRepo.create({
        entryNumber: 'VT-2026-0001',
        date: '2026-06-15',
        journalType: 'VENTES',
        wording: 'Facture Vente N° FAC-2026-001 - AFRIQUE BTP',
        pieceNumber: 'FAC-2026-001',
        isValidated: true,
        createdBy: 'seed',
        companyId: company.id,
        lines: [
          { accountCode: '411', accountLabel: 'Clients, Ventes de biens', debit: 11800000, credit: 0 } as any,
          { accountCode: '701', accountLabel: 'Ventes de marchandises', debit: 0, credit: 10000000 } as any,
          { accountCode: '443', accountLabel: 'État, TVA facturée sur ventes', debit: 0, credit: 1800000 } as any,
        ],
      }),
      entryRepo.create({
        entryNumber: 'BQ-2026-0001',
        date: '2026-06-20',
        journalType: 'BANQUE',
        wording: 'Règlement partiel client AFRIQUE BTP par virement BGFI',
        pieceNumber: 'VIR-98234',
        isValidated: true,
        createdBy: 'seed',
        companyId: company.id,
        lines: [
          { accountCode: '521', accountLabel: 'Banques locales (BGFI)', debit: 5000000, credit: 0 } as any,
          { accountCode: '411', accountLabel: 'Clients, Ventes de biens', debit: 0, credit: 5000000 } as any,
        ],
      }),
      entryRepo.create({
        entryNumber: 'AC-2026-0001',
        date: '2026-07-05',
        journalType: 'ACHATS',
        wording: 'Facture Achat Honoraires Audit - CABINET FIDUCIAIRE',
        pieceNumber: 'FAC-FID-99',
        isValidated: true,
        createdBy: 'seed',
        companyId: company.id,
        lines: [
          { accountCode: '632', accountLabel: 'Honoraires des professionnels', debit: 2500000, credit: 0 } as any,
          { accountCode: '445', accountLabel: 'État, TVA récupérable', debit: 450000, credit: 0 } as any,
          { accountCode: '401', accountLabel: 'Fournisseurs de dettes', debit: 0, credit: 2950000 } as any,
        ],
      }),
    ]);
    await sequenceRepo.save([
      sequenceRepo.create({ companyId: company.id, key: 'VENTES-2026', lastNumber: 1 }),
      sequenceRepo.create({ companyId: company.id, key: 'BANQUE-2026', lastNumber: 1 }),
      sequenceRepo.create({ companyId: company.id, key: 'ACHATS-2026', lastNumber: 1 }),
    ]);
    console.log('3 écritures comptables de démonstration créées.');
  } else {
    console.log('Écritures comptables déjà existantes, non recréées.');
  }

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Erreur de seed :', err);
  process.exit(1);
});
