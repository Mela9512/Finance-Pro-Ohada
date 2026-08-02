import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardMetrics, DashboardAlert, DashboardForecast } from '@financepro/shared';
import { TreasuryAccountEntity } from '../../entities/treasury-account.entity';
import { TreasuryTransactionEntity } from '../../entities/treasury-transaction.entity';
import { JournalEntryEntity } from '../../entities/journal-entry.entity';
import { JournalLineEntity } from '../../entities/journal-line.entity';
import { InvoiceEntity } from '../../entities/invoice.entity';
import { CustomerEntity } from '../../entities/customer.entity';
import { SupplierEntity } from '../../entities/supplier.entity';
import { ReportsService } from '../reports/reports.service';

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(TreasuryAccountEntity) private readonly treasuryAccountRepo: Repository<TreasuryAccountEntity>,
    @InjectRepository(TreasuryTransactionEntity) private readonly txRepo: Repository<TreasuryTransactionEntity>,
    @InjectRepository(JournalEntryEntity) private readonly entryRepo: Repository<JournalEntryEntity>,
    @InjectRepository(JournalLineEntity) private readonly lineRepo: Repository<JournalLineEntity>,
    @InjectRepository(InvoiceEntity) private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(CustomerEntity) private readonly customerRepo: Repository<CustomerEntity>,
    @InjectRepository(SupplierEntity) private readonly supplierRepo: Repository<SupplierEntity>,
    private readonly reportsService: ReportsService,
  ) {}

  /** Encours réel (factures VALIDE/PARTIEL non soldées) */
  private async outstandingTotal(companyId: string, type: 'VENTE' | 'ACHAT'): Promise<number> {
    const { total } = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .select('COALESCE(SUM(invoice.totalTTC - invoice.amountPaid), 0)', 'total')
      .where('invoice.companyId = :companyId', { companyId })
      .andWhere('invoice.type = :type', { type })
      .andWhere("invoice.status IN ('VALIDE', 'PARTIEL')")
      .getRawOne<{ total: string }>();
    return Number(total) || 0;
  }

  /** Somme d'un compte comptable sur une période */
  private async sumAccountByMonth(
    companyId: string,
    fromKey: string,
    accountPrefix: string,
    side: 'credit' | 'debit',
  ): Promise<Map<string, number>> {
    const rows = await this.lineRepo
      .createQueryBuilder('line')
      .innerJoin('line.entry', 'entry')
      .select("SUBSTRING(entry.date, 1, 7)", 'month')
      .addSelect(`SUM(line.${side})`, 'total')
      .where('entry.companyId = :companyId', { companyId })
      .andWhere('entry.date >= :fromDate', { fromDate: `${fromKey}-01` })
      .andWhere(`line.accountCode LIKE :prefix`, { prefix: `${accountPrefix}%` })
      .groupBy('month')
      .getRawMany<{ month: string; total: string }>();
    return new Map(rows.map((r) => [r.month, Number(r.total) || 0]));
  }

  /** CA mensuel (compte 70x — crédit) */
  private async salesByMonth(companyId: string, fromKey: string): Promise<Map<string, number>> {
    return this.sumAccountByMonth(companyId, fromKey, '70', 'credit');
  }

  /** Charges totales mensuelles (compte 6x — débit) */
  private async chargesByMonth(companyId: string, fromKey: string): Promise<Map<string, number>> {
    return this.sumAccountByMonth(companyId, fromKey, '6', 'debit');
  }

  /** Flux de trésorerie par mois (transactions réelles) */
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

  /** Top clients par encours de créances */
  private async topClientsByCreances(companyId: string, limit = 5): Promise<{ nom: string; montant: number }[]> {
    const rows = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .select('invoice.tierName', 'nom')
      .addSelect('SUM(invoice.totalTTC - invoice.amountPaid)', 'montant')
      .where('invoice.companyId = :companyId', { companyId })
      .andWhere('invoice.type = :type', { type: 'VENTE' })
      .andWhere("invoice.status IN ('VALIDE', 'PARTIEL')")
      .groupBy('invoice.tierName')
      .orderBy('montant', 'DESC')
      .limit(limit)
      .getRawMany<{ nom: string; montant: string }>();
    return rows.map((r) => ({ nom: r.nom || 'Inconnu', montant: Number(r.montant) || 0 }));
  }

  /** Top fournisseurs par dettes */
  private async topFournisseursByDettes(companyId: string, limit = 5): Promise<{ nom: string; montant: number }[]> {
    const rows = await this.invoiceRepo
      .createQueryBuilder('invoice')
      .select('invoice.tierName', 'nom')
      .addSelect('SUM(invoice.totalTTC - invoice.amountPaid)', 'montant')
      .where('invoice.companyId = :companyId', { companyId })
      .andWhere('invoice.type = :type', { type: 'ACHAT' })
      .andWhere("invoice.status IN ('VALIDE', 'PARTIEL')")
      .groupBy('invoice.tierName')
      .orderBy('montant', 'DESC')
      .limit(limit)
      .getRawMany<{ nom: string; montant: string }>();
    return rows.map((r) => ({ nom: r.nom || 'Inconnu', montant: Number(r.montant) || 0 }));
  }

  /** Calcul du score de santé financière sur 100 */
  private computeScoreFinancier(params: {
    tresorerie: number;
    bfr: number;
    fdr: number;
    ratioLiquidite: number;
    margeNette: number;
    ratioAutonomie: number;
    ebe: number;
  }): number {
    let score = 50;
    if (params.tresorerie > 0) score += 10;
    if (params.fdr > 0) score += 10;
    if (params.bfr < params.fdr) score += 10;
    if (params.ratioLiquidite >= 1.5) score += 10;
    else if (params.ratioLiquidite >= 1) score += 5;
    if (params.margeNette > 10) score += 5;
    else if (params.margeNette > 0) score += 3;
    if (params.ratioAutonomie > 0.5) score += 5;
    if (params.ebe > 0) score += 5;
    if (params.tresorerie < 0) score -= 20;
    if (params.bfr < 0) score -= 5;
    return Math.max(0, Math.min(100, score));
  }

  /** Génère des alertes automatiques basées sur les métriques */
  private computeAlertes(params: {
    tresorerie: number;
    facturesEchues: number;
    bfr: number;
    fdr: number;
  }): DashboardAlert[] {
    const alertes: DashboardAlert[] = [];
    const now = new Date();
    const dayOfMonth = now.getDate();

    // Découvert bancaire
    if (params.tresorerie < 0) {
      alertes.push({
        type: 'DECOUVERT',
        label: 'Découvert bancaire',
        detail: `Solde négatif détecté sur vos comptes de trésorerie`,
        severity: 'HIGH',
      });
    }

    // Factures échues
    if (params.facturesEchues > 0) {
      alertes.push({
        type: 'FACTURE_ECHUE',
        label: `${params.facturesEchues} facture${params.facturesEchues > 1 ? 's' : ''} échue${params.facturesEchues > 1 ? 's' : ''}`,
        detail: 'Des factures dépassent leur date d\'échéance — Action de recouvrement recommandée',
        severity: params.facturesEchues > 5 ? 'HIGH' : 'MEDIUM',
      });
    }

    // TVA mensuelle (déclaration vers le 15 du mois)
    const daysToTVA = 15 - dayOfMonth;
    if (daysToTVA <= 10 && daysToTVA >= 0) {
      alertes.push({
        type: 'TVA',
        label: 'Déclaration TVA',
        detail: `Échéance dans ${daysToTVA} jour${daysToTVA > 1 ? 's' : ''} — Vérifiez vos déclarations`,
        severity: daysToTVA <= 3 ? 'HIGH' : 'MEDIUM',
        daysLeft: daysToTVA,
      });
    }

    // Salaires (en fin de mois)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysToSalaires = daysInMonth - dayOfMonth;
    if (daysToSalaires <= 5) {
      alertes.push({
        type: 'SALAIRES',
        label: 'Paiement des salaires',
        detail: `Fin de mois dans ${daysToSalaires} jour${daysToSalaires > 1 ? 's' : ''} — Préparez la paie`,
        severity: daysToSalaires <= 2 ? 'HIGH' : 'LOW',
        daysLeft: daysToSalaires,
      });
    }

    // BFR négatif
    if (params.bfr > params.fdr && params.fdr > 0) {
      alertes.push({
        type: 'CREDIT',
        label: 'BFR supérieur au FDR',
        detail: 'Risque de tension de trésorerie à court terme',
        severity: 'MEDIUM',
      });
    }

    // CNPS trimestrielle (approximation : mois 3, 6, 9, 12)
    const currentMonth = now.getMonth() + 1;
    if ([3, 6, 9, 12].includes(currentMonth) && dayOfMonth >= 20) {
      alertes.push({
        type: 'CNPS',
        label: 'Déclaration CNPS trimestrielle',
        detail: `Échéance de fin de trimestre — Vérifiez vos cotisations sociales`,
        severity: 'MEDIUM',
      });
    }

    return alertes;
  }

  /** Génère des prévisions IA basées sur la tendance moyenne */
  private computePrevisions(
    tresorerie: number,
    avgMensuelCA: number,
    avgMensuelCharges: number,
  ): DashboardForecast[] {
    const moisNet = avgMensuelCA - avgMensuelCharges;
    return [
      {
        horizon: '30j',
        label: '30 jours',
        tresoreriePrevisionnelle: tresorerie + moisNet,
        caPrevisionnelCumulé: avgMensuelCA,
        probability: 88,
      },
      {
        horizon: '60j',
        label: '60 jours',
        tresoreriePrevisionnelle: tresorerie + moisNet * 2,
        caPrevisionnelCumulé: avgMensuelCA * 2,
        probability: 78,
      },
      {
        horizon: '90j',
        label: '90 jours',
        tresoreriePrevisionnelle: tresorerie + moisNet * 3,
        caPrevisionnelCumulé: avgMensuelCA * 3,
        probability: 70,
      },
      {
        horizon: '6m',
        label: '6 mois',
        tresoreriePrevisionnelle: tresorerie + moisNet * 6,
        caPrevisionnelCumulé: avgMensuelCA * 6,
        probability: 60,
      },
      {
        horizon: '12m',
        label: '12 mois',
        tresoreriePrevisionnelle: tresorerie + moisNet * 12,
        caPrevisionnelCumulé: avgMensuelCA * 12,
        probability: 48,
      },
    ];
  }

  async getMetrics(companyId: string): Promise<DashboardMetrics> {
    const now = new Date();
    const currentKey = monthKey(now);
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousKey = monthKey(previousMonthDate);
    const sixMonthsAgoDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const sixMonthsAgoKey = monthKey(sixMonthsAgoDate);
    const twelveMonthsAgoDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const twelveMonthsAgoKey = monthKey(twelveMonthsAgoDate);
    const todayStr = now.toISOString().split('T')[0];

    // Requêtes parallèles pour les performances
    const [
      treasuryAccounts,
      recentEntries,
      { bilan, compteDeResultat },
      salesMap,
      salesMap12,
      chargesMap,
      treasuryMap,
      totalCreances,
      totalDettes,
      clientsActifs,
      fournisseursActifs,
      topClients,
      topFournisseurs,
      recentInvoices,
    ] = await Promise.all([
      this.treasuryAccountRepo.find({ where: { companyId } }),
      this.entryRepo.find({ where: { companyId }, relations: ['lines'], order: { createdAt: 'DESC' }, take: 8 }),
      this.reportsService.getBilanAndCompteDeResultat(companyId),
      this.salesByMonth(companyId, previousKey),
      this.salesByMonth(companyId, twelveMonthsAgoKey),
      this.chargesByMonth(companyId, sixMonthsAgoKey),
      this.treasuryFlowsByMonth(companyId, sixMonthsAgoKey),
      this.outstandingTotal(companyId, 'VENTE'),
      this.outstandingTotal(companyId, 'ACHAT'),
      this.customerRepo.count({ where: { companyId } }),
      this.supplierRepo.count({ where: { companyId } }),
      this.topClientsByCreances(companyId),
      this.topFournisseursByDettes(companyId),
      this.invoiceRepo.find({ where: { companyId }, order: { createdAt: 'DESC' }, take: 8 }),
    ]);

    // ── Trésorerie ────────────────────────────────────────────────────────────
    const totalTresorerie = treasuryAccounts.reduce((s, a) => s + Number(a.balance), 0);
    const disponibilites = totalTresorerie;

    // ── Bilan SYSCOHADA ───────────────────────────────────────────────────────
    const sumNet = (items: { net: number }[]) => items.reduce((s, i) => s + i.net, 0);
    const actifImmobilise = sumNet(bilan.actif.immobilise);
    const actifCirculant = sumNet(bilan.actif.circulant);
    const capitauxPropres = sumNet(bilan.passif.capitauxPropres);
    const dettesFinancieres = sumNet(bilan.passif.dettesFinancieres);
    const passifCirculant = sumNet(bilan.passif.passifCirculant);
    const totalActif = actifImmobilise + actifCirculant;
    const totalPassif = capitauxPropres + dettesFinancieres + passifCirculant;

    // ── Ratios ────────────────────────────────────────────────────────────────
    const bfr = actifCirculant - passifCirculant;
    const fdr = capitauxPropres + dettesFinancieres - actifImmobilise;
    const ratioLiquidite = passifCirculant > 0 ? actifCirculant / passifCirculant : 0;
    const ratioAutonomieFinanciere = totalPassif > 0 ? capitauxPropres / totalPassif : 0;
    const endettement = capitauxPropres > 0 ? dettesFinancieres / capitauxPropres : 0;

    // ── Compte de résultat ────────────────────────────────────────────────────
    const resultatNet = compteDeResultat.resultatNet || 0;
    const resultatExploitation = compteDeResultat.resultatExploitation || 0;
    const margeBrute = compteDeResultat.margeBrute || 0;
    const ca = compteDeResultat.chiffreAffaires || 0;
    const margeNette = ca > 0 ? (resultatNet / ca) * 100 : 0;
    const valeurAjoutee = compteDeResultat.valeurAjoutee || 0;
    const resultatFinancier = compteDeResultat.resultatFinancier || 0;
    const resultatExceptionnel = compteDeResultat.resultatHAO || 0;
    const ebe = compteDeResultat.ebe || 0;
    const roe = capitauxPropres > 0 ? (resultatNet / capitauxPropres) * 100 : 0;
    const roa = totalActif > 0 ? (resultatNet / totalActif) * 100 : 0;

    // ── CA & Variation ────────────────────────────────────────────────────────
    const chiffreAffairesMois = salesMap.get(currentKey) || 0;
    const chiffreAffairesPrecedent = salesMap.get(previousKey) || 0;
    const chiffreAffairesVariation =
      chiffreAffairesPrecedent > 0 ? ((chiffreAffairesMois - chiffreAffairesPrecedent) / chiffreAffairesPrecedent) * 100 : 0;

    // ── Graphiques ────────────────────────────────────────────────────────────
    const fluxTrésorerieGraph: { month: string; encaissements: number; decaissements: number }[] = [];
    const chargesParMoisGraph: { month: string; charges: number }[] = [];
    const resultatMensuelGraph: { month: string; resultat: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      const label = MONTH_LABELS[d.getMonth()];
      const flow = treasuryMap.get(key) || { encaissements: 0, decaissements: 0 };
      const charges = chargesMap.get(key) || 0;
      const caM = salesMap12.get(key) || 0;
      fluxTrésorerieGraph.push({ month: label, ...flow });
      chargesParMoisGraph.push({ month: label, charges });
      resultatMensuelGraph.push({ month: label, resultat: caM - charges });
    }

    const caParMoisGraph: { month: string; ca: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      caParMoisGraph.push({ month: MONTH_LABELS[d.getMonth()], ca: salesMap12.get(key) || 0 });
    }

    // ── Activité opérationnelle ───────────────────────────────────────────────
    const [facturesEmises, facturesEnAttente, facturesEchues, paiementsReçusAujourdhui, paiementsEffectuesAujourdhui] = await Promise.all([
      this.invoiceRepo.count({ where: { companyId, type: 'VENTE' as any } }),
      this.invoiceRepo.count({ where: { companyId, status: 'BROUILLON' as any } }),
      this.invoiceRepo.createQueryBuilder('invoice')
        .where('invoice.companyId = :companyId', { companyId })
        .andWhere("invoice.status IN ('VALIDE', 'PARTIEL')")
        .andWhere('invoice.dueDate < :today', { today: todayStr })
        .getCount(),
      this.txRepo.createQueryBuilder('tx')
        .select('COALESCE(SUM(tx.amount), 0)', 'total')
        .where('tx.companyId = :companyId', { companyId })
        .andWhere("tx.type = 'ENCAISSEMENT'")
        .andWhere('tx.date = :today', { today: todayStr })
        .getRawOne<{ total: string }>().then(r => Number(r?.total) || 0),
      this.txRepo.createQueryBuilder('tx')
        .select('COALESCE(SUM(tx.amount), 0)', 'total')
        .where('tx.companyId = :companyId', { companyId })
        .andWhere("tx.type = 'DECAISSEMENT'")
        .andWhere('tx.date = :today', { today: todayStr })
        .getRawOne<{ total: string }>().then(r => Number(r?.total) || 0),
    ]);

    // ── Score et alertes ──────────────────────────────────────────────────────
    const scoreFinancier = this.computeScoreFinancier({
      tresorerie: totalTresorerie,
      bfr,
      fdr,
      ratioLiquidite,
      margeNette,
      ratioAutonomie: ratioAutonomieFinanciere,
      ebe,
    });

    const alertes = this.computeAlertes({
      tresorerie: totalTresorerie,
      facturesEchues,
      bfr,
      fdr,
    });

    // ── Prévisions ────────────────────────────────────────────────────────────
    const nonZeroCA = Array.from(salesMap12.values()).filter((v) => v > 0);
    const avgMensuelCA = nonZeroCA.length > 0 ? nonZeroCA.reduce((a, b) => a + b, 0) / nonZeroCA.length : 0;
    const nonZeroCharges = Array.from(chargesMap.values()).filter((v) => v > 0);
    const avgMensuelCharges = nonZeroCharges.length > 0 ? nonZeroCharges.reduce((a, b) => a + b, 0) / nonZeroCharges.length : 0;
    const previsions = this.computePrevisions(totalTresorerie, avgMensuelCA, avgMensuelCharges);

    // ── Factures récentes ──────────────────────────────────────────────────────
    const facturessRecent = recentInvoices.map((inv) => ({
      id: inv.id,
      numero: inv.invoiceNumber,
      client: inv.tierName || '',
      montant: inv.totalTTC,
      statut: inv.status,
      date: inv.date,
    }));

    return {
      chiffreAffairesMois,
      chiffreAffairesVariation,
      tresorerieNetteTotal: totalTresorerie,
      creancesClientsTotal: totalCreances,
      dettesFournisseursTotal: totalDettes,

      resultatNet,
      resultatExploitation,
      margeBrute,
      margeNette,

      bfr,
      fdr,
      excédentBrutExploitation: ebe,
      ratioLiquidite,
      ratioAutonomieFinanciere,
      roe,
      roa,
      endettement,

      capitauxPropres,
      totalActif,
      totalPassif,
      actifImmobilise,
      actifCirculant,
      passifCirculant,
      dettesFinancieres,
      disponibilites,
      valeurAjoutee,
      resultatFinancier,
      resultatExceptionnel,

      scoreFinancier,

      facturesEmises,
      facturesEnAttente,
      facturesEchues,
      clientsActifs,
      fournisseursActifs,
      paiementsReçusAujourdhui,
      paiementsEffectuesAujourdhui,

      fluxTrésorerieGraph,
      caParMoisGraph,
      chargesParMoisGraph,
      resultatMensuelGraph,

      topClients,
      topFournisseurs,

      alertes,
      previsions,

      ecrituresRecent: recentEntries as any,
      facturessRecent,
    };
  }
}
