import { parseBankStatementCsv } from './bank-statement-parser';

describe('parseBankStatementCsv', () => {
  it('parse un CSV avec colonne montant signée (délimiteur point-virgule)', () => {
    const csv = 'date;description;montant;reference\n2026-07-01;Virement client;150000;VIR-001\n2026-07-02;Frais bancaires;-2500;FRAIS-01';

    const lines = parseBankStatementCsv(csv);

    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({ date: '2026-07-01', description: 'Virement client', amount: 150000, reference: 'VIR-001' });
    expect(lines[1]).toEqual({ date: '2026-07-02', description: 'Frais bancaires', amount: -2500, reference: 'FRAIS-01' });
  });

  it('parse un CSV avec colonnes debit/credit séparées', () => {
    const csv = 'date,description,debit,credit\n2026-07-01,Achat fournitures,5000,0\n2026-07-02,Encaissement vente,0,20000';

    const lines = parseBankStatementCsv(csv);

    expect(lines[0].amount).toBe(-5000);
    expect(lines[1].amount).toBe(20000);
  });

  it('convertit les dates au format JJ/MM/AAAA en AAAA-MM-JJ', () => {
    const csv = 'date;description;montant\n01/07/2026;Test;1000';
    const lines = parseBankStatementCsv(csv);
    expect(lines[0].date).toBe('2026-07-01');
  });

  it('accepte les montants à virgule décimale française', () => {
    const csv = 'date;description;montant\n2026-07-01;Test;1234,56';
    const lines = parseBankStatementCsv(csv);
    expect(lines[0].amount).toBe(1234.56);
  });

  it("rejette un CSV sans colonne date ou description", () => {
    const csv = 'montant;reference\n1000;REF';
    expect(() => parseBankStatementCsv(csv)).toThrow(/date.*description/i);
  });

  it("rejette un CSV sans colonne montant ni debit/credit", () => {
    const csv = 'date;description\n2026-07-01;Test';
    expect(() => parseBankStatementCsv(csv)).toThrow(/montant/i);
  });

  it('rejette une ligne avec une date invalide en identifiant le numéro de ligne', () => {
    const csv = 'date;description;montant\nnot-a-date;Test;1000';
    expect(() => parseBankStatementCsv(csv)).toThrow(/Ligne 2/);
  });

  it('rejette un fichier vide', () => {
    expect(() => parseBankStatementCsv('')).toThrow(/vide/i);
  });
});
