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

  /** Une seule requête groupée par mois au lieu d'une requête par mois de la fenêtre. */
  private async salesByMonth(companyId: string, fromKey: string): Promise<Map<string, number>> {
    const rows = await this.lineRepo
      .createQueryBuilder('line')
      .innerJoin('line.entry', 'entry')
      .select("SUBSTRING(entry.date, 1, 7)", 'month')
      .addSelect('SUM(line.credit)', 'total')
      .where('entry.companyId = :companyId', { companyId })
      .andWhere('entry.date >= :fromDate', { fromDate: `${fromKey}-01` })
      .andWhere("line.accountCode LIKE '70%'")
      .groupBy('month')
      .getRawMany<{ month: string; total: string }>();
    return new Map(rows.map((r) => [r.month, Number(r.total) || 0]));
  }

  /** Une seule requête groupée par mois au lieu d'une requête par mois de la fenêtre. */
  private async treasuryFlowsByMonth(
    companyId: string,
    fromKey: string,
  ): Promise<Map<string, { encaissements: number; decaissements: number }>> {
    const rows = await this.txRepo
      .createQueryBuilder('tx')
      .select('SUBSTRING(tx.date, 1, 7)', 'month')
      .addSelect("SUM(CASE WHEN tx.type = 'ENCAISSEMENT' THEN tx.amount ELSE 0 END)", 'encaissements')
      .addSelect("SUM(CASE WHEN tx.type = 'DECAISSEMENT' THEN tx.amount ELSE 0 END)", 'decaissements')
      .where('tx.companyId = :companyId', { companyId })
      .andWhere('tx.date >= :fromDate', { fromDate: `${fromKey}-01` })
      .groupBy('month')
      .getRawMany<{ month: string; encaissements: string; decaissements: string }>();
    return new Map(rows.map((r) => [r.month, { encaissements: Number(r.encaissements) || 0, decaissements: Number(r.decaissements) || 0 }]));
  }

  async getMetrics(companyId: string): Promise<DashboardMetrics> {
    const now = new Date();
    const currentKey = monthKey(now);
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousKey = monthKey(previousMonthDate);
    const sixMonthsAgoDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const sixMonthsAgoKey = monthKey(sixMonthsAgoDate);

    const [customers, suppliers, treasuryAccounts, recentEntries, { bilan, compteDeResultat }, salesMap, treasuryMap] = await Promise.all([
      this.customerRepo.find({ where: { companyId } }),
      this.supplierRepo.find({ where: { companyId } }),
      this.treasuryAccountRepo.find({ where: { companyId } }),
      this.entryRepo.find({ where: { companyId }, relations: ['lines'], order: { createdAt: 'DESC' }, take: 5 }),
      this.reportsService.getBilanAndCompteDeResultat(companyId),
      this.salesByMonth(companyId, previousKey),
      this.treasuryFlowsByMonth(companyId, sixMonthsAgoKey),
    ]);

    const totalTresorerie = treasuryAccounts.reduce((s, a) => s + Number(a.balance), 0);
    const totalCreances = customers.reduce((s, c) => s + Number(c.balance), 0);
    const totalDettes = suppliers.reduce((s, sup) => s + Number(sup.balance), 0);

    const sumNet = (items: { net: number }[]) => items.reduce((s, i) => s + i.net, 0);
    const bfr = sumNet(bilan.actif.circulant) - sumNet(bilan.passif.passifCirculant);
    const fdr = sumNet(bilan.passif.capitauxPropres) + sumNet(bilan.passif.dettesFinancieres) - sumNet(bilan.actif.immobilise);

    const chiffreAffairesMois = salesMap.get(currentKey) || 0;
    const chiffreAffairesPrecedent = salesMap.get(previousKey) || 0;
    const chiffreAffairesVariation =
      chiffreAffairesPrecedent > 0 ? ((chiffreAffairesMois - chiffreAffairesPrecedent) / chiffreAffairesPrecedent) * 100 : 0;

    const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const fluxTrésorerieGraph: { month: string; encaissements: number; decaissements: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      const flow = treasuryMap.get(key) || { encaissements: 0, decaissements: 0 };
      fluxTrésorerieGraph.push({ month: monthLabels[d.getMonth()], ...flow });
    }

    return {
      chiffreAffairesMois,
      chiffreAffairesVariation,
      tresorerieNetteTotal: totalTresorerie,
      creancesClientsTotal: totalCreances,
      dettesFournisseursTotal: totalDettes,
      bfr,
      fdr,
      excédentBrutExploitation: compteDeResultat.ebe,
      fluxTrésorerieGraph,
      ecrituresRecent: recentEntries as any,
    };
  }
}
