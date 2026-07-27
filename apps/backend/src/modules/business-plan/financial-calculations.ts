export interface YearProjection {
  year: number;
  revenue: number;
  variableCosts: number;
  fixedCosts: number;
  netCashFlow: number;
}

export interface BusinessPlanHypotheses {
  investmentAmount: number;
  projectionYears: number;
  year1Revenue: number;
  revenueGrowthRatePercent: number;
  variableCostPercent: number;
  fixedCostsAnnual: number;
  discountRatePercent: number;
}

/** Projette le chiffre d'affaires et les coûts sur la durée du projet à partir des hypothèses fournies par l'utilisateur. */
export function computeProjections(h: BusinessPlanHypotheses): YearProjection[] {
  const growth = h.revenueGrowthRatePercent / 100;
  const projections: YearProjection[] = [];
  for (let t = 1; t <= h.projectionYears; t++) {
    const revenue = h.year1Revenue * Math.pow(1 + growth, t - 1);
    const variableCosts = revenue * (h.variableCostPercent / 100);
    const netCashFlow = revenue - variableCosts - h.fixedCostsAnnual;
    projections.push({ year: t, revenue, variableCosts, fixedCosts: h.fixedCostsAnnual, netCashFlow });
  }
  return projections;
}

/** Valeur Actuelle Nette : somme des flux de trésorerie actualisés, moins l'investissement initial. */
export function computeVAN(investmentAmount: number, netCashFlows: number[], discountRatePercent: number): number {
  const r = discountRatePercent / 100;
  const presentValue = netCashFlows.reduce((sum, cf, idx) => sum + cf / Math.pow(1 + r, idx + 1), 0);
  return presentValue - investmentAmount;
}

/** Taux de Rentabilité Interne : taux d'actualisation qui annule la VAN, trouvé par dichotomie. Null si aucune solution dans [-99%, 1000%]. */
export function computeTRI(investmentAmount: number, netCashFlows: number[]): number | null {
  const npvAt = (ratePercent: number) => computeVAN(investmentAmount, netCashFlows, ratePercent);

  let low = -99;
  let high = 1000;
  const npvLow = npvAt(low);
  const npvHigh = npvAt(high);
  if (npvLow === 0) return low;
  if (npvHigh === 0) return high;
  if ((npvLow > 0) === (npvHigh > 0)) return null; // pas de changement de signe : pas de racine trouvée dans la plage

  const npvLowSign = npvLow > 0;
  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    const npvMid = npvAt(mid);
    if (npvMid === 0 || high - low < 1e-10) return mid;
    if ((npvMid > 0) === npvLowSign) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

/** Chiffre d'affaires critique (seuil de rentabilité) : CA à partir duquel les charges fixes sont couvertes. */
export function computeSeuilRentabilite(fixedCostsAnnual: number, variableCostPercent: number): number {
  const tauxMargeSurCoutVariable = 1 - variableCostPercent / 100;
  if (tauxMargeSurCoutVariable <= 0) return Infinity;
  return fixedCostsAnnual / tauxMargeSurCoutVariable;
}

export interface CreditScoreInputs {
  /** Résultat net réel du dernier exercice clos, null si l'entreprise n'a pas d'historique comptable. */
  historicalResultatNet: number | null;
  /** Ratio réel encours-en-retard / encours-total (0 à 1), calculé depuis les factures clients réelles. */
  overdueRatio: number;
  revenueGrowthRatePercent: number;
  year1NetCashFlow: number;
}

/**
 * Score indicatif interne (0-100), PAS une notation bancaire certifiée. Combine des faits réels
 * (historique comptable, discipline de paiement) et la cohérence des hypothèses du projet.
 * Pondération volontairement explicite et documentée pour rester auditable.
 */
export function computeCreditScore(inputs: CreditScoreInputs): number {
  let score = 0;

  // Historique réel (40 pts) : entreprise déjà rentable = signal fort ; nouvelle entreprise = neutre.
  if (inputs.historicalResultatNet !== null) {
    score += inputs.historicalResultatNet > 0 ? 40 : 10;
  } else {
    score += 20;
  }

  // Discipline de paiement réelle des clients (25 pts).
  score += Math.max(0, 25 * (1 - inputs.overdueRatio));

  // Réalisme de l'hypothèse de croissance (15 pts) : pénalise une croissance jugée peu réaliste (>50%/an).
  score += inputs.revenueGrowthRatePercent <= 50 ? 15 : Math.max(0, 15 - (inputs.revenueGrowthRatePercent - 50) / 5);

  // Viabilité de la première année projetée (20 pts).
  score += inputs.year1NetCashFlow > 0 ? 20 : 0;

  return Math.round(Math.min(100, Math.max(0, score)));
}
