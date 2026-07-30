import { computeProgressiveTax, computeContributions, computeBulletin } from './payroll-calculations';

describe('computeProgressiveTax', () => {
  const brackets = [
    { min: 0, max: 50_000, rate: 0 },
    { min: 50_000, max: 130_000, rate: 10 },
    { min: 130_000, max: 300_000, rate: 20 },
    { min: 300_000, max: null, rate: 30 },
  ];

  it("ne taxe pas la tranche à 0%", () => {
    expect(computeProgressiveTax(40_000, brackets)).toBe(0);
  });

  it('taxe uniquement la portion dans la tranche supérieure, pas tout le revenu au taux marginal', () => {
    // 100 000 : tranche 1 (0-50k) = 0, tranche 2 (50k-100k, portion de 50k-130k) = 50 000 * 10% = 5 000
    expect(computeProgressiveTax(100_000, brackets)).toBe(5_000);
  });

  it('cumule correctement plusieurs tranches complètes', () => {
    // 200 000 : tranche2 (50k-130k = 80k*10%=8000) + tranche3 (130k-200k = 70k*20%=14000) = 22 000
    expect(computeProgressiveTax(200_000, brackets)).toBe(22_000);
  });

  it('applique le taux le plus élevé uniquement au-delà du dernier seuil', () => {
    // 400 000 : 8000 (tranche2) + 34000 (tranche3, 170k*20%) + 30000 (tranche4, 100k*30%) = 72 000
    expect(computeProgressiveTax(400_000, brackets)).toBe(72_000);
  });

  it('retourne 0 pour un revenu nul ou négatif', () => {
    expect(computeProgressiveTax(0, brackets)).toBe(0);
    expect(computeProgressiveTax(-100, brackets)).toBe(0);
  });
});

describe('computeContributions', () => {
  it('applique le taux simple sans plafond', () => {
    const { lines, total } = computeContributions(500_000, [{ label: 'CNSS salarié', rate: 4 }]);
    expect(lines).toEqual([{ label: 'CNSS salarié', montant: 20_000 }]);
    expect(total).toBe(20_000);
  });

  it("plafonne l'assiette quand un ceiling est défini", () => {
    const { lines, total } = computeContributions(2_000_000, [{ label: 'CNSS salarié', rate: 4, ceiling: 1_000_000 }]);
    expect(lines[0].montant).toBe(40_000); // 4% de 1 000 000, pas de 2 000 000
    expect(total).toBe(40_000);
  });

  it('cumule plusieurs lignes de cotisation', () => {
    const { total } = computeContributions(500_000, [
      { label: 'CNSS salarié', rate: 4 },
      { label: 'Assurance maladie', rate: 1 },
    ]);
    expect(total).toBe(25_000); // 20 000 + 5 000
  });
});

describe('computeBulletin', () => {
  const employeeContributions = [{ label: 'CNSS salarié', rate: 4 }];
  const employerContributions = [
    { label: 'CNSS patronal', rate: 8 },
    { label: 'Allocations familiales', rate: 10 },
  ];
  const taxBrackets = [
    { min: 0, max: 50_000, rate: 0 },
    { min: 50_000, max: 130_000, rate: 10 },
    { min: 130_000, max: null, rate: 20 },
  ];

  it('calcule un bulletin complet et cohérent', () => {
    const result = computeBulletin({
      salaireBase: 300_000,
      primesImposables: 0,
      primesNonImposables: 20_000, // ex: indemnité de transport, hors cotisations/impôt
      employeeContributions,
      employerContributions,
      taxBrackets,
    });

    expect(result.brut).toBe(320_000); // 300 000 + 20 000, la prime non imposable est bien versée
    expect(result.assietteCotisations).toBe(300_000); // la prime non imposable est exclue de l'assiette
    expect(result.totalCotisationsSalariales).toBe(12_000); // 4% de 300 000
    expect(result.totalCotisationsPatronales).toBe(54_000); // 18% de 300 000
    expect(result.salaireImposable).toBe(288_000); // 300 000 - 12 000
    // IRPP : 0 (0-50k) + 8000 (50k-130k à 10%) + 20% * (288000-130000=158000) = 8000+31600=39600
    expect(result.irpp).toBe(39_600);
    // Net = brut - cotisations salariales - irpp = 320 000 - 12 000 - 39 600
    expect(result.net).toBe(268_400);
  });

  it('ne produit jamais un salaire imposable négatif même si les cotisations dépassent le brut', () => {
    const result = computeBulletin({
      salaireBase: 10_000,
      primesImposables: 0,
      primesNonImposables: 0,
      employeeContributions: [{ label: 'CNSS salarié', rate: 150 }],
      employerContributions: [],
      taxBrackets,
    });
    expect(result.salaireImposable).toBe(0);
    expect(result.irpp).toBe(0);
  });
});
