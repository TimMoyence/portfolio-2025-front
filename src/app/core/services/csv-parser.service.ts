import { Injectable } from "@angular/core";
import {
  parseCsv as parseCsvUtil,
  toTransactions as toTransactionsUtil,
  type BudgetTransaction,
} from "../../features/common-budget-tm/utils/budget-csv-parser.utils";

/** Ligne CSV indexee par nom de colonne. */
export type CsvRow = Record<string, string>;

/**
 * Service injectable encapsulant le parsing CSV et la conversion en transactions.
 * Delegue aux fonctions utilitaires pures de budget-csv-parser.utils.
 */
@Injectable({ providedIn: "root" })
export class CsvParserService {
  /**
   * Parse un texte CSV en tableau de lignes cle-valeur.
   *
   * @param csvText - Le contenu brut du fichier CSV.
   * @returns Un tableau d'objets indexes par les en-tetes du CSV.
   */
  parseCsv(csvText: string): CsvRow[] {
    return parseCsvUtil(csvText);
  }

  /**
   * Convertit des lignes CSV parsees en transactions budgetaires.
   *
   * @param rows - Les lignes CSV deja parsees.
   * @returns Un tableau de transactions budgetaires.
   */
  toTransactions(rows: CsvRow[]): BudgetTransaction[] {
    return toTransactionsUtil(rows);
  }
}
