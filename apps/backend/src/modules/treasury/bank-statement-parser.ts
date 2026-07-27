export interface ParsedBankLine {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // signé : + crédit, - débit
  reference?: string;
}

const DATE_COLUMNS = ['date'];
const DESCRIPTION_COLUMNS = ['description', 'libelle', 'libellé', 'label', 'intitule', 'intitulé'];
const AMOUNT_COLUMNS = ['montant', 'amount'];
const DEBIT_COLUMNS = ['debit', 'débit'];
const CREDIT_COLUMNS = ['credit', 'crédit'];
const REFERENCE_COLUMNS = ['reference', 'référence', 'ref'];

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase();
}

function detectDelimiter(headerLine: string): string {
  const semicolons = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  return semicolons >= commas ? ';' : ',';
}

function parseDate(raw: string): string {
  const value = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const frMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (frMatch) {
    const [, d, m, y] = frMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  throw new Error(`Date invalide : "${raw}" (formats acceptés : AAAA-MM-JJ ou JJ/MM/AAAA)`);
}

function parseAmount(raw: string): number {
  const cleaned = raw.trim().replace(/\s/g, '').replace(/,/g, '.');
  const value = Number(cleaned);
  if (Number.isNaN(value)) {
    throw new Error(`Montant invalide : "${raw}"`);
  }
  return value;
}

/**
 * Parse un relevé bancaire CSV. Deux formats de colonnes supportés :
 * - date;description;montant;reference        (montant signé, + crédit / - débit)
 * - date;description;debit;credit;reference    (deux colonnes séparées)
 * L'en-tête est obligatoire (insensible à la casse, tolère les accents pour les libellés attendus).
 */
export function parseBankStatementCsv(csvText: string): ParsedBankLine[] {
  const rawLines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (rawLines.length < 1) {
    throw new Error('Fichier CSV vide');
  }

  const delimiter = detectDelimiter(rawLines[0]);
  const headers = rawLines[0].split(delimiter).map(normalizeHeader);

  const dateIdx = headers.findIndex((h) => DATE_COLUMNS.includes(h));
  const descIdx = headers.findIndex((h) => DESCRIPTION_COLUMNS.includes(h));
  const amountIdx = headers.findIndex((h) => AMOUNT_COLUMNS.includes(h));
  const debitIdx = headers.findIndex((h) => DEBIT_COLUMNS.includes(h));
  const creditIdx = headers.findIndex((h) => CREDIT_COLUMNS.includes(h));
  const refIdx = headers.findIndex((h) => REFERENCE_COLUMNS.includes(h));

  if (dateIdx === -1 || descIdx === -1) {
    throw new Error("En-tête CSV invalide : colonnes 'date' et 'description'/'libelle' obligatoires");
  }
  if (amountIdx === -1 && (debitIdx === -1 || creditIdx === -1)) {
    throw new Error("En-tête CSV invalide : colonne 'montant' (signé) ou colonnes 'debit'+'credit' obligatoires");
  }

  const result: ParsedBankLine[] = [];
  for (let i = 1; i < rawLines.length; i++) {
    const cols = rawLines[i].split(delimiter);
    const lineNo = i + 1;
    try {
      const date = parseDate(cols[dateIdx] ?? '');
      const description = (cols[descIdx] ?? '').trim();

      let amount: number;
      if (amountIdx !== -1) {
        amount = parseAmount(cols[amountIdx] ?? '0');
      } else {
        const debit = parseAmount(cols[debitIdx] || '0');
        const credit = parseAmount(cols[creditIdx] || '0');
        amount = credit - debit;
      }

      const reference = refIdx !== -1 ? (cols[refIdx] ?? '').trim() || undefined : undefined;
      result.push({ date, description, amount, reference });
    } catch (err) {
      throw new Error(`Ligne ${lineNo} : ${(err as Error).message}`);
    }
  }

  return result;
}
