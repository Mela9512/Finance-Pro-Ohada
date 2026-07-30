export interface StockMovementInput {
  type: 'ENTREE' | 'SORTIE';
  quantite: number;
  coutUnitaire?: number;
}

export interface StockState {
  quantite: number;
  valeur: number;
  cump: number;
}

/**
 * Rejoue une séquence de mouvements dans l'ordre chronologique de SAISIE (et non de
 * rétro-datation) et retourne l'état courant du stock. Pour une SORTIE, le coût
 * unitaire n'est jamais saisi par l'utilisateur : c'est toujours le Coût Unitaire
 * Moyen Pondéré (CUMP) recalculé après chaque entrée, au moment du mouvement.
 */
export function replayStockMovements(movements: StockMovementInput[]): StockState {
  let quantite = 0;
  let valeur = 0;

  for (const m of movements) {
    if (m.type === 'ENTREE') {
      const cout = m.coutUnitaire ?? 0;
      valeur += m.quantite * cout;
      quantite += m.quantite;
    } else {
      const cump = quantite > 0 ? valeur / quantite : 0;
      const sortieQty = Math.min(m.quantite, quantite);
      valeur -= sortieQty * cump;
      quantite -= sortieQty;
    }
  }

  quantite = Math.round(quantite * 1000) / 1000;
  valeur = Math.round(valeur * 100) / 100;
  return { quantite, valeur, cump: quantite > 0 ? Math.round((valeur / quantite) * 100) / 100 : 0 };
}

/** CUMP courant avant un nouveau mouvement de sortie, pour valoriser ce mouvement au moment de sa saisie. */
export function currentCump(existingMovements: StockMovementInput[]): number {
  return replayStockMovements(existingMovements).cump;
}

export function currentStockQuantity(existingMovements: StockMovementInput[]): number {
  return replayStockMovements(existingMovements).quantite;
}
