import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../../entities/employee.entity';
import { BulletinPaieEntity } from '../../entities/bulletin-paie.entity';
import { CompanyEntity } from '../../entities/company.entity';
import { SequenceService } from '../../common/services/sequence.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { AccountingService } from '../accounting/accounting.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateBulletinDto } from './dto/create-bulletin.dto';
import { computeBulletin } from './payroll-calculations';

const REMUNERATIONS_ACCOUNT = '661'; // Rémunérations directes versées au personnel
const CHARGES_SOCIALES_ACCOUNT = '664'; // Charges sociales (cotisations patronales)
const PERSONNEL_ACCOUNT = '421'; // Personnel, rémunérations dues (net à payer)
const SECURITE_SOCIALE_ACCOUNT = '431'; // Sécurité Sociale (CNSS/CNPS)
const RETENUE_SOURCE_ACCOUNT = '447'; // État, Retenues à la source (réutilisé pour l'IRPP/IUTS sur salaires)

@Injectable()
export class PaieService {
  constructor(
    @InjectRepository(EmployeeEntity) private readonly employeeRepo: Repository<EmployeeEntity>,
    @InjectRepository(BulletinPaieEntity) private readonly bulletinRepo: Repository<BulletinPaieEntity>,
    @InjectRepository(CompanyEntity) private readonly companyRepo: Repository<CompanyEntity>,
    private readonly sequenceService: SequenceService,
    private readonly auditLogService: AuditLogService,
    private readonly accountingService: AccountingService,
  ) {}

  getEmployees(companyId: string): Promise<EmployeeEntity[]> {
    return this.employeeRepo.find({ where: { companyId }, order: { nom: 'ASC' } });
  }

  async createEmployee(companyId: string, userId: string, dto: CreateEmployeeDto): Promise<EmployeeEntity> {
    const year = new Date().getFullYear();
    const seqNumber = await this.sequenceService.next(companyId, `EMPLOYEE-${year}`);
    const matricule = `EMP-${year}-${String(seqNumber).padStart(4, '0')}`;

    const employee = this.employeeRepo.create({
      companyId,
      matricule,
      nom: dto.nom,
      poste: dto.poste,
      dateEmbauche: dto.dateEmbauche,
      salaireBase: dto.salaireBase,
      numeroCNSS: dto.numeroCNSS,
      statut: 'ACTIF',
      createdBy: userId,
    });
    const saved = await this.employeeRepo.save(employee);

    await this.auditLogService.log({
      companyId,
      userId,
      action: 'EMPLOYEE_CREATED',
      entityType: 'Employee',
      entityId: saved.id,
      metadata: { matricule: saved.matricule, nom: saved.nom },
    });

    return saved;
  }

  getBulletins(companyId: string): Promise<BulletinPaieEntity[]> {
    return this.bulletinRepo.find({ where: { companyId }, order: { createdAt: 'DESC' } });
  }

  async createBulletin(companyId: string, userId: string, dto: CreateBulletinDto): Promise<BulletinPaieEntity> {
    const employee = await this.employeeRepo.findOne({ where: { id: dto.employeeId, companyId } });
    if (!employee) throw new NotFoundException('Employé introuvable');

    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company?.payrollTaxBrackets?.length || !company?.payrollEmployeeContributions || !company?.payrollEmployerContributions) {
      throw new BadRequestException(
        "Les paramètres de paie de l'entreprise (tranches d'impôt, cotisations salariales/patronales) ne sont pas encore configurés. Renseignez-les dans Administration avant de générer un bulletin.",
      );
    }

    const existing = await this.bulletinRepo.findOne({
      where: { companyId, employeeId: dto.employeeId, periodYear: dto.periodYear, periodMonth: dto.periodMonth },
    });
    if (existing) {
      throw new BadRequestException('Un bulletin existe déjà pour cet employé sur cette période.');
    }

    const result = computeBulletin({
      salaireBase: Number(employee.salaireBase),
      primesImposables: dto.primesImposables ?? 0,
      primesNonImposables: dto.primesNonImposables ?? 0,
      employeeContributions: company.payrollEmployeeContributions,
      employerContributions: company.payrollEmployerContributions,
      taxBrackets: company.payrollTaxBrackets,
    });

    const bulletin = this.bulletinRepo.create({
      companyId,
      employeeId: employee.id,
      employeeName: employee.nom,
      periodYear: dto.periodYear,
      periodMonth: dto.periodMonth,
      salaireBase: Number(employee.salaireBase),
      primesImposables: dto.primesImposables ?? 0,
      primesNonImposables: dto.primesNonImposables ?? 0,
      brut: result.brut,
      detailCotisationsSalariales: result.detailCotisationsSalariales,
      totalCotisationsSalariales: result.totalCotisationsSalariales,
      detailCotisationsPatronales: result.detailCotisationsPatronales,
      totalCotisationsPatronales: result.totalCotisationsPatronales,
      salaireImposable: result.salaireImposable,
      irpp: result.irpp,
      net: result.net,
      status: 'BROUILLON',
      createdBy: userId,
    });
    const saved = await this.bulletinRepo.save(bulletin);

    await this.auditLogService.log({
      companyId,
      userId,
      action: 'BULLETIN_PAIE_CREATED',
      entityType: 'BulletinPaie',
      entityId: saved.id,
      metadata: { employeeName: employee.nom, periodYear: dto.periodYear, periodMonth: dto.periodMonth },
    });

    return saved;
  }

  /**
   * Valide le bulletin et génère l'écriture comptable correspondante :
   * débit 661 (brut) + 664 (charges patronales) = crédit 421 (net) + 431 (cotisations
   * salariales+patronales à reverser à la CNSS) + 447 (IRPP retenu à la source).
   */
  async validateBulletin(companyId: string, userId: string, id: string): Promise<BulletinPaieEntity> {
    const bulletin = await this.bulletinRepo.findOne({ where: { id, companyId } });
    if (!bulletin) throw new NotFoundException('Bulletin introuvable');
    if (bulletin.status === 'VALIDE') {
      throw new BadRequestException('Ce bulletin est déjà validé.');
    }

    const periodLabel = `${String(bulletin.periodMonth).padStart(2, '0')}/${bulletin.periodYear}`;
    const cotisationsAReverser =
      Math.round((Number(bulletin.totalCotisationsSalariales) + Number(bulletin.totalCotisationsPatronales)) * 100) / 100;

    const entry = await this.accountingService.createJournalEntry(companyId, userId, {
      date: `${bulletin.periodYear}-${String(bulletin.periodMonth).padStart(2, '0')}-28`,
      journalType: 'OD',
      wording: `Paie ${bulletin.employeeName} — ${periodLabel}`,
      pieceNumber: `PAIE-${bulletin.periodYear}${String(bulletin.periodMonth).padStart(2, '0')}-${bulletin.employeeName.slice(0, 6)}`,
      lines: [
        { accountCode: REMUNERATIONS_ACCOUNT, accountLabel: 'Rémunérations directes', debit: Number(bulletin.brut), credit: 0 },
        { accountCode: CHARGES_SOCIALES_ACCOUNT, accountLabel: 'Charges sociales patronales', debit: Number(bulletin.totalCotisationsPatronales), credit: 0 },
        { accountCode: PERSONNEL_ACCOUNT, accountLabel: bulletin.employeeName, debit: 0, credit: Number(bulletin.net) },
        { accountCode: SECURITE_SOCIALE_ACCOUNT, accountLabel: 'Sécurité sociale (CNSS/CNPS)', debit: 0, credit: cotisationsAReverser },
        { accountCode: RETENUE_SOURCE_ACCOUNT, accountLabel: 'IRPP retenu à la source', debit: 0, credit: Number(bulletin.irpp) },
      ],
    });

    bulletin.status = 'VALIDE';
    bulletin.journalEntryId = entry.id;
    const saved = await this.bulletinRepo.save(bulletin);

    await this.auditLogService.log({
      companyId,
      userId,
      action: 'BULLETIN_PAIE_VALIDE',
      entityType: 'BulletinPaie',
      entityId: saved.id,
      metadata: { employeeName: bulletin.employeeName, periodLabel, net: bulletin.net },
    });

    return saved;
  }
}
