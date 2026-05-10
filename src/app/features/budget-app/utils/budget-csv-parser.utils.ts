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

const CATEGORY_RULES: Array<{ keywords: string[]; categoryName: string }> = [
  { keywords: ["loick babin", "les voutes"], categoryName: "Loyer" },
  { keywords: ["edf"], categoryName: "Electricité & Internet" },
  {
    keywords: ["free telecom", "mobile partage"],
    categoryName: "Forfait telephone partage",
  },
  {
    keywords: ["internet", "bbox", "orange", "sfr", "bouygues"],
    categoryName: "Electricité & Internet",
  },
  { keywords: ["maif"], categoryName: "Assur. Habitation" },
  {
    keywords: ["citiz", "uber", "kmlocal"],
    categoryName: "Voiture utilisation",
  },
  {
    keywords: ["amazon", "netflix", "ororo"],
    categoryName: "Netflix & Amazon & Ororo",
  },
  {
    keywords: [
      "carrefour",
      "e.leclerc",
      "picard",
      "lidl",
      "bio coop",
      "casado primeurs",
      "le destin fromager",
      "bigazzi",
      "babel bread",
      "ly kim hak",
      "qu4tre qu4rts",
      "anom cafe club",
      "boucherie",
      "origines",
    ],
    categoryName: "Courses",
  },
  { keywords: ["pharmacie"], categoryName: "Achat pour la beauté" },
  {
    keywords: [
      "pub",
      "kitchen",
      "restaurant",
      "darwi",
      "cassonade",
      "arlu",
      "magasin general",
      "les brocs",
      "del arte",
    ],
    categoryName: "Restaurant",
  },
  { keywords: ["fleurs", "garcia aurore"], categoryName: "Gifts" },
  { keywords: ["art'tick"], categoryName: "Entertainment" },
  {
    keywords: ["salle de sport", "fitness", "gym", "basic fit"],
    categoryName: "Salle de sport",
  },
];

/**
 * Parse un texte CSV complet en un tableau de lignes,
 * en gerant les guillemets, les virgules echappees et les sauts de ligne CRLF/LF.
 *
 * @param csvText - Le contenu brut du fichier CSV.
 * @returns Un tableau d'objets cle-valeur indexes par les en-tetes du CSV.
 */
export function parseCsv(csvText: string): CsvRow[] {
  const delimiter = detectDelimiter(csvText);
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

    if (character === delimiter && !inQuotes) {
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

  const [rawHeaders = [], ...dataRows] = rows.filter((entry) =>
    entry.some((cell) => cell !== ""),
  );
  const headers = rawHeaders.map((header) => normalizeHeader(header));

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
  return rows
    .map((row) => {
      const description = readRowValue(row, ["Description"]).trim();
      const startedDate = readRowValue(row, ["Started Date", "Date"]);
      const completedDate = readRowValue(row, ["Completed Date"]);
      const type = readRowValue(row, ["Type"]);
      const state = readRowValue(row, ["State"]);
      const amount = parseCsvAmount(readRowValue(row, ["Amount", "Montant"]));

      return {
        id: `${startedDate}|${description}|${amount}|${type}`,
        startedDate,
        completedDate,
        description,
        type,
        state,
        amount,
        category: inferCategoryName(description, type, amount),
      };
    })
    .filter(
      (transaction) =>
        transaction.description !== "" ||
        transaction.startedDate !== "" ||
        transaction.amount !== 0,
    );
}

function inferCategoryName(
  description: string,
  type: string,
  amount: number,
): string {
  const normalizedDescription = normalizeText(description);
  const normalizedType = normalizeText(type);

  if (amount > 0) {
    if (
      normalizedDescription.startsWith("transfer from") ||
      normalizedDescription.startsWith("payment from")
    ) {
      return "Contribution";
    }

    if (normalizedDescription.includes("pocket withdrawal")) {
      return "Pockets";
    }
  }

  for (const rule of CATEGORY_RULES) {
    if (
      rule.keywords.some((keyword) => normalizedDescription.includes(keyword))
    ) {
      return rule.categoryName;
    }
  }

  const exactCategoryMatch = CATEGORY_RULES.find(
    (rule) => normalizeText(rule.categoryName) === normalizedDescription,
  );
  if (exactCategoryMatch) {
    return exactCategoryMatch.categoryName;
  }

  if (
    normalizedType.includes("transfer") &&
    normalizedDescription.includes("pocket")
  ) {
    return "Pockets";
  }

  return "Autres";
}

function detectDelimiter(csvText: string): string {
  const firstLine = csvText.split(/\r?\n/, 1)[0] ?? "";
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const semicolonCount = (firstLine.match(/;/g) ?? []).length;
  const tabCount = (firstLine.match(/\t/g) ?? []).length;

  if (semicolonCount > commaCount && semicolonCount >= tabCount) {
    return ";";
  }

  if (tabCount > commaCount && tabCount > semicolonCount) {
    return "\t";
  }

  return ",";
}

function normalizeHeader(value: string): string {
  return value.replace(/^\uFEFF/, "").trim();
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function readRowValue(row: CsvRow, keys: string[]): string {
  for (const key of keys) {
    const exactMatch = row[key];
    if (exactMatch !== undefined) {
      return exactMatch;
    }
  }

  const normalizedEntries = Object.entries(row).map(
    ([key, value]) => [normalizeText(key), value] as const,
  );

  for (const key of keys) {
    const found = normalizedEntries.find(
      ([normalizedKey]) => normalizedKey === normalizeText(key),
    );
    if (found) {
      return found[1];
    }
  }

  return "";
}

function parseCsvAmount(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const normalized = trimmed
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(?:[,.]|$))/g, "")
    .replace(",", ".");

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
