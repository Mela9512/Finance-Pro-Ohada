import {
  computeProjections,
  computeVAN,
  computeTRI,
  computeSeuilRentabilite,
  computeCreditScore,
  BusinessPlanHypotheses,
} from './financial-calculations';

describe('computeProjections', () => {
  const baseHypotheses: BusinessPlanHypotheses = {
    investmentAmount: 10000000,
    projectionYears: 3,
    year1Revenue: 5000000,
    revenueGrowthRatePercent: 10,
    variableCostPercent: 40,
    fixedCostsAnnual: 1000000,
    discountRatePercent: 10,
  };

  it('applique la croissance composée année après année', () => {
    const projections = computeProjections(baseHypotheses);

    expect(projections).toHaveLength(3);
    expect(projections[0].revenue).toBe(5000000);
    expect(projections[1].revenue).toBeCloseTo(5500000, 0);
    expect(projections[2].revenue).toBeCloseTo(6050000, 0);
  });

  it('calcule les charges variables comme un pourcentage exact du chiffre d\'affaires', () => {
    const projections = computeProjections(baseHypotheses);
    expect(projections[0].variableCosts).toBe(2000000); // 40% de 5 000 000
  });

  it('calcule le flux net = CA - charges variables - charges fixes', () => {
    const projections = computeProjections(baseHypotheses);
    expect(projections[0].netCashFlow).toBe(5000000 - 2000000 - 1000000);
  });

  it('sans croissance (0%), le chiffre d\'affaires reste constant', () => {
    const projections = computeProjections({ ...baseHypotheses, revenueGrowthRatePercent: 0 });
    expect(projections.every((p) => p.revenue === 5000000)).toBe(true);
  });
});

describe('computeVAN', () => {
  it('retourne une VAN positive quand les flux actualisés dépassent l\'investissement', () => {
    const van = computeVAN(1000000, [600000, 600000, 600000], 10);
    expect(van).toBeGreaterThan(0);
  });

  it('retourne une VAN négative quand l\'investissement dépasse les flux actualisés', () => {
    const van = computeVAN(5000000, [600000, 600000, 600000], 10);
    expect(van).toBeLessThan(0);
  });

  it('sans actualisation (taux 0%), la VAN est simplement la somme des flux moins l\'investissement', () => {
    const van = computeVAN(1000000, [500000, 500000, 500000], 0);
    expect(van).toBeCloseTo(500000, 6);
  });
});

describe('computeTRI', () => {
  it('trouve un TRI cohérent : la VAN calculée à ce taux doit être proche de 0', () => {
    const investment = 1000000;
    const flows = [400000, 400000, 400000, 400000];
    const tri = computeTRI(investment, flows);

    expect(tri).not.toBeNull();
    const vanAtTri = computeVAN(investment, flows, tri as number);
    expect(Math.abs(vanAtTri)).toBeLessThan(0.01);
    expect(tri).toBeCloseTo(21.86, 1);
  });

  it('retourne null quand tous les flux sont négatifs (aucune racine possible)', () => {
    const tri = computeTRI(1000000, [-100000, -100000, -100000]);
    expect(tri).toBeNull();
  });
});

describe('computeSeuilRentabilite', () => {
  it('calcule le chiffre d\'affaires critique avec la formule standard charges fixes / taux de marge sur coût variable', () => {
    const seuil = computeSeuilRentabilite(1000000, 40); // taux marge = 60%
    expect(seuil).toBeCloseTo(1000000 / 0.6, 6);
  });

  it('retourne Infinity quand les charges variables représentent 100% ou plus du CA (seuil jamais atteignable)', () => {
    expect(computeSeuilRentabilite(1000000, 100)).toBe(Infinity);
    expect(computeSeuilRentabilite(1000000, 120)).toBe(Infinity);
  });
});

describe('computeCreditScore', () => {
  it('attribue le score maximum à une entreprise historiquement rentable, sans retard de paiement, avec une hypothèse de croissance raisonnable et une première année viable', () => {
    const score = computeCreditScore({
      historicalResultatNet: 5000000,
      overdueRatio: 0,
      revenueGrowthRatePercent: 10,
      year1NetCashFlow: 2000000,
    });
    expect(score).toBe(100);
  });

  it('pénalise un historique déficitaire par rapport à un historique bénéficiaire', () => {
    const scoreDeficit = computeCreditScore({
      historicalResultatNet: -500000,
      overdueRatio: 0,
      revenueGrowthRatePercent: 10,
      year1NetCashFlow: 2000000,
    });
    const scoreBenefice = computeCreditScore({
      historicalResultatNet: 500000,
      overdueRatio: 0,
      revenueGrowthRatePercent: 10,
      year1NetCashFlow: 2000000,
    });
    expect(scoreDeficit).toBeLessThan(scoreBenefice);
  });

  it('pénalise un taux de retard de paiement élevé', () => {
    const scoreRetard = computeCreditScore({
      historicalResultatNet: null,
      overdueRatio: 0.8,
      revenueGrowthRatePercent: 10,
      year1NetCashFlow: 2000000,
    });
    const scoreSansRetard = computeCreditScore({
      historicalResultatNet: null,
      overdueRatio: 0,
      revenueGrowthRatePercent: 10,
      year1NetCashFlow: 2000000,
    });
    expect(scoreRetard).toBeLessThan(scoreSansRetard);
  });

  it('pénalise une hypothèse de croissance jugée irréaliste (>50%/an)', () => {
    const scoreRaisonnable = computeCreditScore({
      historicalResultatNet: null,
      overdueRatio: 0,
      revenueGrowthRatePercent: 20,
      year1NetCashFlow: 2000000,
    });
    const scoreIrrealiste = computeCreditScore({
      historicalResultatNet: null,
      overdueRatio: 0,
      revenueGrowthRatePercent: 200,
      year1NetCashFlow: 2000000,
    });
    expect(scoreIrrealiste).toBeLessThan(scoreRaisonnable);
  });

  it('pénalise une première année projetée déficitaire', () => {
    const scoreViable = computeCreditScore({
      historicalResultatNet: null,
      overdueRatio: 0,
      revenueGrowthRatePercent: 10,
      year1NetCashFlow: 2000000,
    });
    const scoreDeficitaire = computeCreditScore({
      historicalResultatNet: null,
      overdueRatio: 0,
      revenueGrowthRatePercent: 10,
      year1NetCashFlow: -100000,
    });
    expect(scoreDeficitaire).toBeLessThan(scoreViable);
  });

  it('reste toujours dans les bornes [0, 100]', () => {
    const score = computeCreditScore({
      historicalResultatNet: -99999999,
      overdueRatio: 1,
      revenueGrowthRatePercent: 1000,
      year1NetCashFlow: -99999999,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
