export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

export interface Contribution {
  label: string;
  rate: number;
  ceiling?: number;
}

export interface ContributionLine {
  label: string;
  montant: number;
}

export interface BulletinInput {
  salaireBase: number;
  primesImposables: number;
  primesNonImposables: number;
  employeeContributions: Contribution[];
  employerContributions: Contribution[];
  taxBrackets: TaxBracket[];
}

export interface BulletinResult {
  brut: number;
  assietteCotisations: number;
  detailCotisationsSalariales: ContributionLine[];
  totalCotisationsSalariales: number;
  detailCotisationsPatronales: ContributionLine[];
  totalCotisationsPatronales: number;
  salaireImposable: number;
  irpp: number;
  net: number;
}

/**
 * Calcule l'impôt selon un barème progressif par tranches (IRPP/IUTS typique en zone
 * OHADA) : chaque tranche de revenu n'est taxée qu'au taux qui lui correspond, jamais
 * le taux marginal appliqué à la totalité du revenu.
 */
export function computeProgressiveTax(taxableAmount: number, brackets: TaxBracket[]): number {
  if (taxableAmount <= 0 || brackets.length === 0) return 0;

  let tax = 0;
  for (const bracket of brackets) {
    const upper = bracket.max ?? Infinity;
    const taxablePortion = Math.max(0, Math.min(taxableAmount, upper) - bracket.min);
    if (taxablePortion <= 0) continue;
    tax += (taxablePortion * bracket.rate) / 100;
  }
  return Math.round(tax * 100) / 100;
}

/** Calcule chaque ligne de cotisation sur une assiette éventuellement plafonnée. */
export function computeContributions(baseAmount: number, contributions: Contribution[]): { lines: ContributionLine[]; total: number } {
  const lines = contributions.map((c) => {
    const base = c.ceiling !== undefined ? Math.min(baseAmount, c.ceiling) : baseAmount;
    const montant = Math.round(((base * c.rate) / 100) * 100) / 100;
    return { label: c.label, montant };
  });
  const total = Math.round(lines.reduce((s, l) => s + l.montant, 0) * 100) / 100;
  return { lines, total };
}

/**
 * Calcule un bulletin de paie complet à partir des paramètres réels de l'entreprise
 * (taux et tranches saisis dans les paramètres, jamais une valeur par défaut supposée).
 * Les primes non imposables sont incluses dans le brut versé mais exclues de l'assiette
 * des cotisations sociales et de l'impôt, comme c'est l'usage pour les indemnités de
 * transport/logement dans la plupart des régimes OHADA.
 */
export function computeBulletin(input: BulletinInput): BulletinResult {
  const brut = input.salaireBase + input.primesImposables + input.primesNonImposables;
  const assietteCotisations = input.salaireBase + input.primesImposables;

  const salariales = computeContributions(assietteCotisations, input.employeeContributions);
  const patronales = computeContributions(assietteCotisations, input.employerContributions);

  const salaireImposable = Math.max(0, Math.round((assietteCotisations - salariales.total) * 100) / 100);
  const irpp = computeProgressiveTax(salaireImposable, input.taxBrackets);

  const net = Math.round((brut - salariales.total - irpp) * 100) / 100;

  return {
    brut: Math.round(brut * 100) / 100,
    assietteCotisations: Math.round(assietteCotisations * 100) / 100,
    detailCotisationsSalariales: salariales.lines,
    totalCotisationsSalariales: salariales.total,
    detailCotisationsPatronales: patronales.lines,
    totalCotisationsPatronales: patronales.total,
    salaireImposable,
    irpp,
    net,
  };
}
