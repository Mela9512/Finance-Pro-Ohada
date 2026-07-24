import { Injectable } from '@nestjs/common';
import { DashboardMetrics } from '@financepro/shared';
import { MockDatabase } from '../../mock-db';

@Injectable()
export class DashboardService {
  getMetrics(): DashboardMetrics {
    const totalTresorerie = MockDatabase.treasuryAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalCreances = MockDatabase.customers.reduce((sum, c) => sum + c.balance, 0);
    const totalDettes = MockDatabase.suppliers.reduce((sum, s) => sum + s.balance, 0);

    return {
      chiffreAffairesMois: 42500000,
      chiffreAffairesVariation: 14.8,
      tresorerieNetteTotal: totalTresorerie,
      creancesClientsTotal: totalCreances,
      dettesFournisseursTotal: totalDettes,
      bfr: 12500000,
      fdr: 35000000,
      excédentBrutExploitation: 44500000,
      fluxTrésorerieGraph: [
        { month: 'Jan', encaissements: 28000000, decaissements: 19000000 },
        { month: 'Fév', encaissements: 32000000, decaissements: 21000000 },
        { month: 'Mar', encaissements: 35000000, decaissements: 24000000 },
        { month: 'Avr', encaissements: 31000000, decaissements: 20000000 },
        { month: 'Mai', encaissements: 40000000, decaissements: 27000000 },
        { month: 'Juin', encaissements: 42500000, decaissements: 26000000 }
      ],
      ecrituresRecent: MockDatabase.journalEntries.slice(0, 5)
    };
  }
}
