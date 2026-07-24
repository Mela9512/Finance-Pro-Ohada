import { Injectable } from '@nestjs/common';
import { FinancialReportBilan, CompteDeResultat } from '@financepro/shared';
import { MockDatabase } from '../../mock-db';

@Injectable()
export class ReportsService {
  getBilan(): FinancialReportBilan {
    const totalImmo = 35000000;
    const totalStocks = 14500000;
    const totalCreances = 26100000;
    const totalTresorerieActif = 75900000;

    const totalActif = totalImmo + totalStocks + totalCreances + totalTresorerieActif;

    const capitauxPropres = 85000000;
    const dettesFinancieres = 25000000;
    const passifCirculant = 10550000;
    const resultatNet = 30950000;
    const totalPassif = capitauxPropres + dettesFinancieres + passifCirculant + resultatNet;

    return {
      actif: {
        immobilise: [
          { codeRef: 'AD', label: 'Immobilisations Incorporelles (Logiciels, Brevets)', gross: 5000000, depreciation: 1000000, net: 4000000, netPrevious: 3500000 },
          { codeRef: 'AF', label: 'Immobilisations Corporelles (Bâtiments, Matériels)', gross: 40000000, depreciation: 9000000, net: 31000000, netPrevious: 28000000 }
        ],
        circulant: [
          { codeRef: 'BH', label: 'Stocks de marchandises et matières premières', gross: 14500000, depreciation: 0, net: 14500000, netPrevious: 12000000 },
          { codeRef: 'BI', label: 'Clients et comptes rattachés (Compte 411)', gross: 26100000, depreciation: 0, net: 26100000, netPrevious: 21500000 }
        ],
        tresorerie: [
          { codeRef: 'BQ', label: 'Banques, Chèques et Caisses (Comptes 521, 541)', gross: 75900000, depreciation: 0, net: 75900000, netPrevious: 60000000 }
        ],
        totalActif
      },
      passif: {
        capitauxPropres: [
          { codeRef: 'CA', label: 'Capital Social (Compte 101)', gross: 50000000, depreciation: 0, net: 50000000, netPrevious: 50000000 },
          { codeRef: 'CB', label: 'Réserves et Report à nouveau (Compte 111, 121)', gross: 35000000, depreciation: 0, net: 35000000, netPrevious: 20000000 }
        ],
        dettesFinancieres: [
          { codeRef: 'DA', label: 'Emprunts et dettes financières (Compte 162)', gross: 25000000, depreciation: 0, net: 25000000, netPrevious: 30000000 }
        ],
        passifCirculant: [
          { codeRef: 'DH', label: 'Fournisseurs et dettes d\'exploitation (Compte 401)', gross: 10550000, depreciation: 0, net: 10550000, netPrevious: 9800000 }
        ],
        tresoreriePassif: [],
        totalPassif
      }
    };
  }

  getCompteDeResultat(): CompteDeResultat {
    return {
      chiffreAffaires: 148500000,
      achatsMarchandises: 54000000,
      margeBrute: 94500000,
      consommationsIntermediaires: 22000000,
      valeurAjoutee: 72500000,
      chargesPersonnel: 28000000,
      ebe: 44500000,
      dotationsAmortissements: 5000000,
      resultatExploitation: 39500000,
      chargesFinancieres: 3200000,
      produitsFinanciers: 800000,
      resultatFinancier: -2400000,
      resultatHAO: 0,
      impotSurBenefices: 6150000,
      resultatNet: 30950000
    };
  }

  getTFT() {
    return {
      fluxExploitation: 38400000,
      fluxInvestissement: -12500000,
      fluxFinancement: -5000000,
      variationTresorerie: 20900000,
      tresorerieDebut: 55000000,
      tresorerieFin: 75900000
    };
  }
}
