import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImmobilisationEntity } from '../../entities/immobilisation.entity';
import { SequenceService } from '../../common/services/sequence.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { AccountingService } from '../accounting/accounting.service';
import { CreateImmobilisationDto } from './dto/create-immobilisation.dto';
import { CessionImmobilisationDto } from './dto/cession-immobilisation.dto';
import { computeLinearSchedule, getDotationForYear, AmortissementRow } from './depreciation-calculations';

const DOTATION_ACCOUNT_CODE = '681'; // Dotations aux amortissements d'exploitation
const AMORTISSEMENT_CONTRA_ACCOUNT_CODE = '284'; // Amortissements du matériel (compte de contrepartie)

export interface ImmobilisationWithSchedule extends ImmobilisationEntity {
  schedule: AmortissementRow[];
}

@Injectable()
export class ImmobilisationsService {
  constructor(
    @InjectRepository(ImmobilisationEntity) private readonly repo: Repository<ImmobilisationEntity>,
    private readonly sequenceService: SequenceService,
    private readonly auditLogService: AuditLogService,
    private readonly accountingService: AccountingService,
  ) {}

  private toSchedule(entity: ImmobilisationEntity): AmortissementRow[] {
    return computeLinearSchedule({
      valeurAcquisitionHT: Number(entity.valeurAcquisitionHT),
      valeurResiduelle: Number(entity.valeurResiduelle) || 0,
      dureeAmortissementAns: entity.dureeAmortissementAns,
      dateMiseEnService: entity.dateMiseEnService,
    });
  }

  async create(companyId: string, userId: string, dto: CreateImmobilisationDto): Promise<ImmobilisationWithSchedule> {
    const year = new Date(dto.dateAcquisition).getFullYear();
    const seqNumber = await this.sequenceService.next(companyId, `IMMO-${year}`);
    const code = `IMMO-${year}-${String(seqNumber).padStart(4, '0')}`;

    const entity = this.repo.create({
      companyId,
      code,
      label: dto.label,
      accountCode: dto.accountCode,
      dateAcquisition: dto.dateAcquisition,
      dateMiseEnService: dto.dateMiseEnService,
      valeurAcquisitionHT: dto.valeurAcquisitionHT,
      valeurResiduelle: dto.valeurResiduelle ?? 0,
      dureeAmortissementAns: dto.dureeAmortissementAns,
      status: 'EN_SERVICE',
      exercicesDotationGeneres: [],
      createdBy: userId,
    });
    const saved = await this.repo.save(entity);

    await this.auditLogService.log({
      companyId,
      userId,
      action: 'IMMOBILISATION_CREATED',
      entityType: 'Immobilisation',
      entityId: saved.id,
      metadata: { code: saved.code, label: saved.label },
    });

    return { ...saved, schedule: this.toSchedule(saved) };
  }

  async findAll(companyId: string): Promise<ImmobilisationWithSchedule[]> {
    const entities = await this.repo.find({ where: { companyId }, order: { dateAcquisition: 'DESC' } });
    return entities.map((e) => ({ ...e, schedule: this.toSchedule(e) }));
  }

  async findOne(companyId: string, id: string): Promise<ImmobilisationWithSchedule> {
    const entity = await this.repo.findOne({ where: { id, companyId } });
    if (!entity) throw new NotFoundException('Immobilisation introuvable');
    return { ...entity, schedule: this.toSchedule(entity) };
  }

  async getSyntheseParExercice(companyId: string, year: number) {
    const entities = await this.repo.find({ where: { companyId } });
    let valeurBrute = 0;
    let dotationExercice = 0;
    let cumulAmortissements = 0;
    let valeurNetteComptable = 0;

    for (const e of entities) {
      if (e.status === 'CEDE' || e.status === 'REFORME') continue;
      const schedule = this.toSchedule(e);
      const rowForYear = getDotationForYear(schedule, year);
      const lastRowUpToYear = [...schedule].reverse().find((r) => r.year <= year);
      valeurBrute += Number(e.valeurAcquisitionHT);
      dotationExercice += rowForYear?.dotation ?? 0;
      cumulAmortissements += lastRowUpToYear?.cumulAmortissements ?? 0;
      valeurNetteComptable += lastRowUpToYear?.valeurNetteComptable ?? Number(e.valeurAcquisitionHT);
    }

    return { year, valeurBrute, dotationExercice, cumulAmortissements, valeurNetteComptable };
  }

  async cession(companyId: string, userId: string, id: string, dto: CessionImmobilisationDto): Promise<ImmobilisationWithSchedule> {
    const entity = await this.repo.findOne({ where: { id, companyId } });
    if (!entity) throw new NotFoundException('Immobilisation introuvable');
    if (entity.status !== 'EN_SERVICE') {
      throw new BadRequestException('Cette immobilisation a déjà été cédée ou réformée.');
    }

    entity.status = 'CEDE';
    entity.dateCession = dto.dateCession;
    entity.valeurCession = dto.valeurCession;
    const saved = await this.repo.save(entity);

    await this.auditLogService.log({
      companyId,
      userId,
      action: 'IMMOBILISATION_CEDEE',
      entityType: 'Immobilisation',
      entityId: saved.id,
      metadata: { code: saved.code, valeurCession: dto.valeurCession },
    });

    return { ...saved, schedule: this.toSchedule(saved) };
  }

  /**
   * Génère l'écriture de dotation aux amortissements pour un exercice donné, pour toutes
   * les immobilisations en service ayant une dotation non nulle sur cet exercice et pour
   * lesquelles cette écriture n'a pas déjà été générée (traçabilité via exercicesDotationGeneres).
   */
  async genererEcritureDotation(companyId: string, userId: string, year: number) {
    const entities = await this.repo.find({ where: { companyId, status: 'EN_SERVICE' } });

    const aTraiter = entities.filter((e) => {
      if ((e.exercicesDotationGeneres ?? []).includes(year)) return false;
      const dotation = getDotationForYear(this.toSchedule(e), year)?.dotation ?? 0;
      return dotation > 0;
    });

    if (aTraiter.length === 0) {
      throw new BadRequestException(`Aucune dotation à générer pour l'exercice ${year} (déjà générée ou aucune immobilisation active).`);
    }

    const totalDotation = aTraiter.reduce((s, e) => s + (getDotationForYear(this.toSchedule(e), year)?.dotation ?? 0), 0);
    const totalDotationRounded = Math.round(totalDotation * 100) / 100;

    const entry = await this.accountingService.createJournalEntry(companyId, userId, {
      date: `${year}-12-31`,
      journalType: 'OD',
      wording: `Dotation aux amortissements de l'exercice ${year} (${aTraiter.length} immobilisation${aTraiter.length > 1 ? 's' : ''})`,
      pieceNumber: `DOT-${year}`,
      lines: [
        {
          accountCode: DOTATION_ACCOUNT_CODE,
          accountLabel: "Dotations aux amortissements d'exploitation",
          debit: totalDotationRounded,
          credit: 0,
        },
        {
          accountCode: AMORTISSEMENT_CONTRA_ACCOUNT_CODE,
          accountLabel: 'Amortissements du matériel',
          debit: 0,
          credit: totalDotationRounded,
        },
      ],
    });

    for (const e of aTraiter) {
      e.exercicesDotationGeneres = [...(e.exercicesDotationGeneres ?? []), year];
    }
    await this.repo.save(aTraiter);

    await this.auditLogService.log({
      companyId,
      userId,
      action: 'IMMOBILISATION_DOTATION_GENEREE',
      entityType: 'JournalEntry',
      entityId: entry.id,
      metadata: { year, totalDotation: totalDotationRounded, nbImmobilisations: aTraiter.length },
    });

    return { entry, totalDotation: totalDotationRounded, nbImmobilisations: aTraiter.length };
  }
}
