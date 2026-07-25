import { ReportsService } from './reports.service';
import { AccountBalance } from '../accounting/accounting.service';

function balance(partial: Partial<AccountBalance> & Pick<AccountBalance, 'code' | 'classNum' | 'type'>): AccountBalance {
  return {
    label: partial.code,
    soldeDebiteur: 0,
    soldeCrediteur: 0,
    category: 'tiers',
    ...partial,
  };
}

describe('ReportsService', () => {
  let accountingService: { getAccountBalances: jest.Mock };
  let service: ReportsService;

  beforeEach(() => {
    accountingService = { getAccountBalances: jest.fn() };
    service = new ReportsService(accountingService as any);
  });

  describe('getCompteDeResultat', () => {
    it('calcule correctement la marge brute, la VA, l\'EBE et le résultat net', async () => {
      accountingService.getAccountBalances.mockResolvedValue([
        balance({ code: '701', classNum: 7, type: 'credit', soldeCrediteur: 10000000 }), // CA
        balance({ code: '601', classNum: 6, type: 'debit', soldeDebiteur: 4000000 }), // achats
        balance({ code: '622', classNum: 6, type: 'debit', soldeDebiteur: 1000000 }), // loyer (conso intermédiaire)
        balance({ code: '661', classNum: 6, type: 'debit', soldeDebiteur: 2000000 }), // personnel
        balance({ code: '681', classNum: 6, type: 'debit', soldeDebiteur: 500000 }), // dotations
        balance({ code: '671', classNum: 6, type: 'debit', soldeDebiteur: 200000 }), // charges financières
        balance({ code: '771', classNum: 7, type: 'credit', soldeCrediteur: 50000 }), // produits financiers
      ] as AccountBalance[]);

      const cr = await service.getCompteDeResultat('company-1');

      expect(cr.chiffreAffaires).toBe(10000000);
      expect(cr.achatsMarchandises).toBe(4000000);
      expect(cr.margeBrute).toBe(6000000);
      expect(cr.consommationsIntermediaires).toBe(1000000);
      expect(cr.valeurAjoutee).toBe(5000000);
      expect(cr.chargesPersonnel).toBe(2000000);
      expect(cr.ebe).toBe(3000000);
      expect(cr.dotationsAmortissements).toBe(500000);
      expect(cr.resultatExploitation).toBe(2500000);
      expect(cr.resultatFinancier).toBe(50000 - 200000);
      expect(cr.resultatNet).toBe(2500000 + (50000 - 200000));
    });

    it('retourne des totaux nuls quand il n\'y a aucune écriture', async () => {
      accountingService.getAccountBalances.mockResolvedValue([]);
      const cr = await service.getCompteDeResultat('company-1');
      expect(cr.chiffreAffaires).toBe(0);
      expect(cr.resultatNet).toBe(0);
    });
  });

  describe('getBilan', () => {
    it('équilibre Total Actif = Total Passif pour une balance réellement équilibrée', async () => {
      // Écriture équivalente à : Achat marchandises 100 000 payé cash, vente 150 000 TTC encaissée,
      // TVA 18% sur la vente. Construit pour être un jeu d'écritures en partie double valide.
      accountingService.getAccountBalances.mockResolvedValue([
        balance({ code: '521', classNum: 5, type: 'both', soldeDebiteur: 50000, category: 'tresorerie' }), // trésorerie nette positive
        balance({ code: '411', classNum: 4, type: 'debit', soldeDebiteur: 118000, category: 'tiers' }), // client à recevoir
        balance({ code: '401', classNum: 4, type: 'credit', soldeCrediteur: 100000, category: 'tiers' }), // fournisseur à payer
        balance({ code: '701', classNum: 7, type: 'credit', soldeCrediteur: 100000, category: 'produits' }),
        balance({ code: '601', classNum: 6, type: 'debit', soldeDebiteur: 100000, category: 'charges' }),
        balance({ code: '443', classNum: 4, type: 'credit', soldeCrediteur: 18000, category: 'tiers' }),
        balance({ code: '101', classNum: 1, type: 'credit', soldeCrediteur: 50000, category: 'capitaux' }),
      ] as AccountBalance[]);

      const bilan = await service.getBilan('company-1');

      expect(bilan.actif.totalActif).toBeCloseTo(bilan.passif.totalPassif, 6);
    });

    it('classe une dette d\'emprunt (16x) en dettes financières et pas en capitaux propres', async () => {
      accountingService.getAccountBalances.mockResolvedValue([
        balance({ code: '162', classNum: 1, type: 'credit', soldeCrediteur: 5000000, category: 'capitaux' }),
      ] as AccountBalance[]);

      const bilan = await service.getBilan('company-1');

      expect(bilan.passif.dettesFinancieres).toHaveLength(1);
      expect(bilan.passif.dettesFinancieres[0].codeRef).toBe('162');
      expect(bilan.passif.capitauxPropres.find((i) => i.codeRef === '162')).toBeUndefined();
    });
  });
});
