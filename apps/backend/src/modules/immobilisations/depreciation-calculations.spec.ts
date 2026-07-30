import { computeLinearSchedule, getDotationForYear } from './depreciation-calculations';

describe('computeLinearSchedule', () => {
  it('produit exactement N annuités égales quand la mise en service est au 1er janvier', () => {
    const schedule = computeLinearSchedule({
      valeurAcquisitionHT: 10_000_000,
      valeurResiduelle: 0,
      dureeAmortissementAns: 5,
      dateMiseEnService: '2026-01-01',
    });

    expect(schedule).toHaveLength(5);
    schedule.forEach((row) => expect(row.dotation).toBeCloseTo(2_000_000, 2));
    expect(schedule[4].cumulAmortissements).toBeCloseTo(10_000_000, 2);
    expect(schedule[4].valeurNetteComptable).toBeCloseTo(0, 2);
  });

  it('applique un prorata temporis la première année et une annuité complémentaire la dernière', () => {
    const schedule = computeLinearSchedule({
      valeurAcquisitionHT: 3_650_000,
      valeurResiduelle: 0,
      dureeAmortissementAns: 5,
      dateMiseEnService: '2026-07-01',
    });

    // Base = 3 650 000, annuité pleine = 730 000/an. Mise en service le 1er juillet :
    // ~184 jours restants sur 365 => 1ère annuité ≈ 730 000 * (184/365).
    expect(schedule[0].year).toBe(2026);
    expect(schedule[0].dotation).toBeCloseTo(730_000 * (184 / 365), 0);

    // Le cumul final doit égaler exactement la base amortissable, sans écart résiduel.
    const last = schedule[schedule.length - 1];
    expect(last.cumulAmortissements).toBeCloseTo(3_650_000, 2);
    expect(last.valeurNetteComptable).toBeCloseTo(0, 2);

    // Le prorata décale la fin de l'étalement sur une année supplémentaire partielle.
    expect(schedule).toHaveLength(6);
  });

  it('respecte une valeur résiduelle non nulle', () => {
    const schedule = computeLinearSchedule({
      valeurAcquisitionHT: 5_000_000,
      valeurResiduelle: 500_000,
      dureeAmortissementAns: 3,
      dateMiseEnService: '2026-01-01',
    });

    const last = schedule[schedule.length - 1];
    expect(last.valeurNetteComptable).toBeCloseTo(500_000, 2);
    expect(last.cumulAmortissements).toBeCloseTo(4_500_000, 2);
  });

  it('getDotationForYear retrouve la ligne correspondant à un exercice donné', () => {
    const schedule = computeLinearSchedule({
      valeurAcquisitionHT: 1_000_000,
      valeurResiduelle: 0,
      dureeAmortissementAns: 4,
      dateMiseEnService: '2026-01-01',
    });

    expect(getDotationForYear(schedule, 2027)?.dotation).toBeCloseTo(250_000, 2);
    expect(getDotationForYear(schedule, 2099)).toBeNull();
  });
});
