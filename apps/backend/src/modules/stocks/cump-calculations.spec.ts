import { replayStockMovements, currentCump, currentStockQuantity } from './cump-calculations';

describe('replayStockMovements (CUMP)', () => {
  it('calcule le CUMP après une seule entrée', () => {
    const state = replayStockMovements([{ type: 'ENTREE', quantite: 100, coutUnitaire: 500 }]);
    expect(state.quantite).toBe(100);
    expect(state.valeur).toBe(50_000);
    expect(state.cump).toBe(500);
  });

  it('recalcule le CUMP pondéré après une deuxième entrée à un coût différent', () => {
    // 100 unités à 500 (valeur 50 000) + 50 unités à 800 (valeur 40 000) = 150 unités, valeur 90 000
    // CUMP = 90 000 / 150 = 600
    const state = replayStockMovements([
      { type: 'ENTREE', quantite: 100, coutUnitaire: 500 },
      { type: 'ENTREE', quantite: 50, coutUnitaire: 800 },
    ]);
    expect(state.quantite).toBe(150);
    expect(state.valeur).toBe(90_000);
    expect(state.cump).toBe(600);
  });

  it('valorise une sortie au CUMP courant, pas à un coût saisi', () => {
    const state = replayStockMovements([
      { type: 'ENTREE', quantite: 100, coutUnitaire: 500 },
      { type: 'ENTREE', quantite: 50, coutUnitaire: 800 },
      { type: 'SORTIE', quantite: 60 },
    ]);
    // Après les 2 entrées : 150 unités @ CUMP 600. Sortie de 60 => valeur sortie = 36 000.
    // Stock restant : 90 unités, valeur 90 000 - 36 000 = 54 000, CUMP toujours 600.
    expect(state.quantite).toBe(90);
    expect(state.valeur).toBe(54_000);
    expect(state.cump).toBe(600);
  });

  it('ne laisse jamais la quantité descendre sous zéro même si la sortie demandée dépasse le stock', () => {
    const state = replayStockMovements([
      { type: 'ENTREE', quantite: 10, coutUnitaire: 100 },
      { type: 'SORTIE', quantite: 999 },
    ]);
    expect(state.quantite).toBe(0);
    expect(state.valeur).toBe(0);
  });

  it('currentCump et currentStockQuantity reflètent le dernier état', () => {
    const movements = [
      { type: 'ENTREE' as const, quantite: 20, coutUnitaire: 1000 },
      { type: 'SORTIE' as const, quantite: 5 },
    ];
    expect(currentStockQuantity(movements)).toBe(15);
    expect(currentCump(movements)).toBe(1000);
  });
});
