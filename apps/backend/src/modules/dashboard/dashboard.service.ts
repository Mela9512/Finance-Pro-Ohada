import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardMetrics } from '@financepro/shared';
import { CustomerEntity } from '../../entities/customer.entity';
import { SupplierEntity } from '../../entities/supplier.entity';
import { TreasuryAccountEntity } from '../../entities/treasury-account.entity';
import { TreasuryTransactionEntity } from '../../entities/treasury-transaction.entity';
import { JournalEntryEntity } from '../../entities/journal-entry.entity';
import { JournalLineEntity } from '../../entities/journal-line.entity';
import { ReportsService } from '../reports/reports.service';

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(CustomerEntity) private readonly customerRepo: Repository<CustomerEntity>,
    @InjectRepository(SupplierEntity) private readonly supplierRepo: Repository<SupplierEntity>,
    @InjectRepository(TreasuryAccountEntity) private readonly treasuryAccountRepo: Repository<TreasuryAccountEntity>,
    @InjectRepository(TreasuryTransactionEntity) private readonly txRepo: Repository<TreasuryTransactionEntity>,
    @InjectRepository(JournalEntryEntity) private readonly entryRepo: Repository<JournalEntryEntity>,
    @InjectRepository(JournalLineEntity) private readonly lineRepo: Repository<JournalLineEntity>,
    private readonly reportsService: ReportsService,
  ) {}

  private async salesForMonth(companyId: string, key: string): Promise<number> {
    const rows = await this.lineRepo
      .createQueryBuilder('line')
      .innerJoin('line.entry', 'entry')
      .select('SUM(line.credit)', 'total')
      .where('entry.companyId = :companyId', { companyId })
      .andWhere('entry.date LIKE :key', { key: `${key}%` })
      .andWhere("line.accountCode LIKE '70%'")
      .getRawOne<{ total: string }>();
    return Number(rows?.total) || 0;
  }

  async getMetrics(companyId: string): Promise<DashboardMetrics> {
    const [customers, suppliers, treasuryAccounts, recentEntries] = await Promise.all([
      this.customerRepo.find({ where: { companyId } }),
      this.supplierRepo.find({ where: { companyId } }),
      this.treasuryAccountRepo.find({ where: { companyId } }),
      this.entryRepo.find({ where: { companyId }, relations: ['lines'], order: { createdAt: 'DESC' }, take: 5 }),
    ]);

    const totalTresorerie = treasuryAccounts.reduce((s, a) => s + Number(a.balance), 0);
    const totalCreances = customers.reduce((s, c) => s + Number(c.balance), 0);
    const totalDettes = suppliers.reduce((s, sup) => s + Number(sup.balance), 0);

    const bilan = await this.reportsService.getBilan(companyId);
    const sumNet = (items: { net: number }[]) => items.reduce((s, i) => s + i.net, 0);
    const bfr = sumNet(bilan.actif.circulant) - sumNet(bilan.passif.passifCirculant);
    const fdr = sumNet(bilan.passif.capitauxPropres) + sumNet(bilan.passif.dettesFinancieres) - sumNet(bilan.actif.immobilise);
    const cr = await this.reportsService.getCompteDeResultat(companyId);

    const now = new Date();
    const currentKey = monthKey(now);
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousKey = monthKey(previousMonthDate);

    const [chiffreAffairesMois, chiffreAffairesPrecedent] = await Promise.all([
      this.salesForMonth(companyId, currentKey),
      this.salesForMonth(companyId, previousKey),
    ]);
    const chiffreAffairesVariation =
      chiffreAffairesPrecedent > 0 ? ((chiffreAffairesMois - chiffreAffairesPrecedent) / chiffreAffairesPrecedent) * 100 : 0;

    const fluxTrésorerieGraph: { month: string; encaissements: number; decaissements: number }[] = [];
    const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      const txs = await this.txRepo
        .createQueryBuilder('tx')
        .where('tx.companyId = :companyId', { companyId })
        .andWhere('tx.date LIKE :key', { key: `${key}%` })
        .getMany();
      fluxTrésorerieGraph.push({
        month: monthLabels[d.getMonth()],
        encaissements: txs.filter((t) => t.type === 'ENCAISSEMENT').reduce((s, t) => s + Number(t.amount), 0),
        decaissements: txs.filter((t) => t.type === 'DECAISSEMENT').reduce((s, t) => s + Number(t.amount), 0),
      });
    }

    return {
      chiffreAffairesMois,
      chiffreAffairesVariation,
      tresorerieNetteTotal: totalTresorerie,
      creancesClientsTotal: totalCreances,
      dettesFournisseursTotal: totalDettes,
      bfr,
      fdr,
      excédentBrutExploitation: cr.ebe,
      fluxTrésorerieGraph,
      ecrituresRecent: recentEntries as any,
    };
  }
}
