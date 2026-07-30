export interface AmortissementRow {
  year: number;
  dotation: number;
  cumulAmortissements: number;
  valeurNetteComptable: number;
}

const JOURS_PAR_AN = 365;

/**
 * Amortissement linéaire prorata temporis (méthode SYSCOHADA la plus courante pour
 * les biens à usage courant). La première annuité est calculée au prorata du nombre
 * de jours restants dans l'année civile de mise en service ; le reliquat est absorbé
 * par une dernière annuité partielle, de sorte que le cumul final égale exactement la
 * base amortissable (aucun écart d'arrondi résiduel).
 */
export function computeLinearSchedule(params: {
  valeurAcquisitionHT: number;
  valeurResiduelle: number;
  dureeAmortissementAns: number;
  dateMiseEnService: string;
}): AmortissementRow[] {
  const { valeurAcquisitionHT, valeurResiduelle, dureeAmortissementAns, dateMiseEnService } = params;
  const baseAmortissable = valeurAcquisitionHT - valeurResiduelle;
  const annuitePleine = baseAmortissable / dureeAmortissementAns;

  const miseEnService = new Date(dateMiseEnService);
  const finExerciceMES = new Date(miseEnService.getFullYear(), 11, 31);
  const joursRestants = Math.max(
    0,
    Math.round((finExerciceMES.getTime() - miseEnService.getTime()) / 86400000) + 1,
  );
  const prorataAnnee1 = joursRestants / JOURS_PAR_AN;

  const rows: AmortissementRow[] = [];
  let cumul = 0;
  const totalAnnees = dureeAmortissementAns + 1;

  for (let i = 0; i < totalAnnees; i++) {
    const year = miseEnService.getFullYear() + i;
    let dotation: number;
    if (i === totalAnnees - 1) {
      dotation = baseAmortissable - cumul;
    } else if (i === 0) {
      dotation = annuitePleine * prorataAnnee1;
    } else {
      dotation = annuitePleine;
    }
    dotation = Math.max(0, Math.round(dotation * 100) / 100);

    if (dotation <= 0 && i > 0) break;

    cumul = Math.round((cumul + dotation) * 100) / 100;
    rows.push({
      year,
      dotation,
      cumulAmortissements: cumul,
      valeurNetteComptable: Math.round((valeurAcquisitionHT - cumul) * 100) / 100,
    });
  }
  return rows;
}

export function getDotationForYear(schedule: AmortissementRow[], year: number): AmortissementRow | null {
  return schedule.find((r) => r.year === year) ?? null;
}
