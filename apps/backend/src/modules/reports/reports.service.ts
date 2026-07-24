import { Injectable } from '@nestjs/common';
import { FinancialReportBilan, CompteDeResultat, BilanItem } from '@financepro/shared';
import { AccountingService, AccountBalance } from '../accounting/accounting.service';

const AMORTISSEMENT_PREFIXES = ['28', '29', '39', '49', '59'];
const EMPRUNT_PREFIXES = ['161', '162'];

function toBilanItem(b: AccountBalance, net: number): BilanItem {
  const isContra = AMORTISSEMENT_PREFIXES.some((p) => b.code.startsWith(p));
  return {
    codeRef: b.code,
    label: b.label,
    gross: isContra ? 0 : Math.abs(net),
    depreciation: isContra ? Math.abs(net) : 0,
    net,
    netPrevious: 0,
  };
}

@Injectable()
export class ReportsService {
  constructor(private readonly accountingService: AccountingService) {}

  private async computeCompteDeResultat(companyId: string): Promise<CompteDeResultat> {
    const balances = await this.accountingService.getAccountBalances(companyId);

    const sumCharges = (predicate: (b: AccountBalance) => boolean) =>
      balances.filter((b) => b.classNum === 6 && predicate(b)).reduce((s, b) => s + (b.soldeDebiteur - b.soldeCrediteur), 0);

    const sumProduits = (predicate: (b: AccountBalance) => boolean) =>
      balances.filter((b) => b.classNum === 7 && predicate(b)).reduce((s, b) => s + (b.soldeCrediteur - b.soldeDebiteur), 0);

    const chiffreAffaires = sumProduits((b) => b.code.startsWith('70'));
    const achatsMarchandises = sumCharges((b) => b.code.startsWith('60'));
    const margeBrute = chiffreAffaires - achatsMarchandises;

    const consommationsIntermediaires = sumCharges(
      (b) => !b.code.startsWith('60') && !b.code.startsWith('64') && !b.code.startsWith('66') && !b.code.startsWith('67') && !b.code.startsWith('68'),
    );
    const valeurAjoutee = margeBrute - consommationsIntermediaires;

    const chargesPersonnel = sumCharges((b) => b.code.startsWith('66'));
    const ebe = valeurAjoutee - chargesPersonnel;

    const dotationsAmortissements = sumCharges((b) => b.code.startsWith('68'));
    const resultatExploitation = ebe - dotationsAmortissements;

    const chargesFinancieres = sumCharges((b) => b.code.startsWith('67'));
    const produitsFinanciers = sumProduits((b) => b.code.startsWith('77'));
    const resultatFinancier = produitsFinanciers - chargesFinancieres;

    const produitsHAO = balances.filter((b) => b.classNum === 8 && b.type === 'credit').reduce((s, b) => s + (b.soldeCrediteur - b.soldeDebiteur), 0);
    const chargesHAO = balances.filter((b) => b.classNum === 8 && b.type === 'debit').reduce((s, b) => s + (b.soldeDebiteur - b.soldeCrediteur), 0);
    const resultatHAO = produitsHAO - chargesHAO;

    const impotSurBenefices = sumCharges((b) => b.code.startsWith('891'));

    const resultatNet = resultatExploitation + resultatFinancier + resultatHAO - impotSurBenefices;

    return {
      chiffreAffaires,
      achatsMarchandises,
      margeBrute,
      consommationsIntermediaires,
      valeurAjoutee,
      chargesPersonnel,
      ebe,
      dotationsAmortissements,
      resultatExploitation,
      chargesFinancieres,
      produitsFinanciers,
      resultatFinancier,
      resultatHAO,
      impotSurBenefices,
      resultatNet,
    };
  }

  async getBilan(companyId: string): Promise<FinancialReportBilan> {
    const balances = await this.accountingService.getAccountBalances(companyId);
    const compteDeResultat = await this.computeCompteDeResultat(companyId);

    const immobilise: BilanItem[] = [];
    const circulant: BilanItem[] = [];
    const tresorerie: BilanItem[] = [];
    const capitauxPropres: BilanItem[] = [];
    const dettesFinancieres: BilanItem[] = [];
    const passifCirculant: BilanItem[] = [];
    const tresoreriePassif: BilanItem[] = [];

    for (const b of balances) {
      const solde = b.soldeDebiteur - b.soldeCrediteur;
      if (b.classNum === 2) {
        immobilise.push(toBilanItem(b, solde));
      } else if (b.classNum === 3) {
        circulant.push(toBilanItem(b, solde));
      } else if (b.classNum === 4) {
        if (b.type === 'debit') {
          circulant.push(toBilanItem(b, solde));
        } else {
          passifCirculant.push(toBilanItem(b, -solde));
        }
      } else if (b.classNum === 5) {
        if (solde >= 0) {
          tresorerie.push(toBilanItem(b, solde));
        } else {
          tresoreriePassif.push(toBilanItem(b, -solde));
        }
      } else if (b.classNum === 1) {
        if (EMPRUNT_PREFIXES.some((p) => b.code.startsWith(p))) {
          dettesFinancieres.push(toBilanItem(b, -solde));
        } else {
          capitauxPropres.push(toBilanItem(b, -solde));
        }
      }
    }

    capitauxPropres.push({
      codeRef: 'RN',
      label: compteDeResultat.resultatNet >= 0 ? "Résultat net de l'exercice (Bénéfice)" : "Résultat net de l'exercice (Perte)",
      gross: Math.abs(compteDeResultat.resultatNet),
      depreciation: 0,
      net: compteDeResultat.resultatNet,
      netPrevious: 0,
    });

    const sum = (items: BilanItem[]) => items.reduce((s, i) => s + i.net, 0);
    const totalActif = sum(immobilise) + sum(circulant) + sum(tresorerie);
    const totalPassif = sum(capitauxPropres) + sum(dettesFinancieres) + sum(passifCirculant) + sum(tresoreriePassif);

    return {
      actif: { immobilise, circulant, tresorerie, totalActif },
      passif: { capitauxPropres, dettesFinancieres, passifCirculant, tresoreriePassif, totalPassif },
    };
  }

  getCompteDeResultat(companyId: string): Promise<CompteDeResultat> {
    return this.computeCompteDeResultat(companyId);
  }

  async getTFT(companyId: string) {
    const balances = await this.accountingService.getAccountBalances(companyId);
    const tresorerieFin = balances
      .filter((b) => b.classNum === 5)
      .reduce((s, b) => s + (b.soldeDebiteur - b.soldeCrediteur), 0);

    const compteDeResultat = await this.computeCompteDeResultat(companyId);

    return {
      fluxExploitation: compteDeResultat.resultatExploitation + compteDeResultat.dotationsAmortissements,
      fluxInvestissement: 0,
      fluxFinancement: 0,
      variationTresorerie: tresorerieFin,
      tresorerieDebut: 0,
      tresorerieFin,
    };
  }
}
