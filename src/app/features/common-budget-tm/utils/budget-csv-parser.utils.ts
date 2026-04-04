/** Ligne CSV indexee par nom de colonne. */
type CsvRow = Record<string, string>;

/** Transaction budgetaire issue du parsing CSV. */
export type BudgetTransaction = {
  id: string;
  startedDate: string;
  completedDate: string;
  description: string;
  type: string;
  state: string;
  amount: number;
  category: string;
};

/**
 * Parse un texte CSV complet en un tableau de lignes,
 * en gerant les guillemets, les virgules echappees et les sauts de ligne CRLF/LF.
 *
 * @param csvText - Le contenu brut du fichier CSV.
 * @returns Un tableau d'objets cle-valeur indexes par les en-tetes du CSV.
 */
export function parseCsv(csvText: string): CsvRow[] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const next = csvText[index + 1];

    if (character === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && next === "\n") {
        index += 1;
      }
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += character;
  }

  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }

  const [headers = [], ...dataRows] = rows.filter((entry) =>
    entry.some((cell) => cell !== ""),
  );

  return dataRows.map((dataRow) => {
    const mappedRow: CsvRow = {};
    headers.forEach((header, index) => {
      mappedRow[header] = dataRow[index] ?? "";
    });
    return mappedRow;
  });
}

/**
 * Convertit des lignes CSV parsees en transactions budgetaires.
 * Mappe les colonnes standard (Description, Started Date, Amount, etc.)
 * vers le format BudgetTransaction avec la categorie "Autres" par defaut.
 *
 * @param rows - Les lignes CSV deja parsees sous forme d'objets cle-valeur.
 * @returns Un tableau de transactions budgetaires.
 */
export function toTransactions(rows: CsvRow[]): BudgetTransaction[] {
  return rows.map((row) => {
    const description = (row["Description"] ?? "").trim();
    const startedDate = row["Started Date"] ?? "";
    const amount = Number.parseFloat(row["Amount"] ?? "0");
    return {
      id: `${startedDate}|${description}|${row["Amount"]}|${row["Type"]}`,
      startedDate,
      completedDate: row["Completed Date"] ?? "",
      description,
      type: row["Type"] ?? "",
      state: row["State"] ?? "",
      amount,
      category: "Autres",
    };
  });
}
