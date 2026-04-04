import type { BudgetCategoryModel } from "../../../core/models/budget.model";
import type { BudgetTransaction } from "./budget-csv-parser.utils";

/**
 * Retourne le type de budget (FIXED ou VARIABLE) pour une categorie donnee.
 * Si la categorie est introuvable, retourne "VARIABLE" par defaut.
 *
 * @param categoryName - Le nom de la categorie.
 * @param categories - La liste des categories disponibles.
 * @returns "FIXED" ou "VARIABLE".
 */
export function getBudgetType(
  categoryName: string,
  categories: BudgetCategoryModel[],
): "FIXED" | "VARIABLE" {
  const cat = categories.find((c) => c.name === categoryName);
  return (cat?.budgetType as "FIXED" | "VARIABLE") ?? "VARIABLE";
}

/**
 * Retourne la limite budgetaire planifiee pour une categorie.
 * Retourne 0 si la categorie est introuvable.
 *
 * @param categoryName - Le nom de la categorie.
 * @param categories - La liste des categories disponibles.
 * @returns Le montant de la limite budgetaire.
 */
export function getPlanValue(
  categoryName: string,
  categories: BudgetCategoryModel[],
): number {
  const cat = categories.find((c) => c.name === categoryName);
  return cat ? Number(cat.budgetLimit) : 0;
}

/**
 * Retourne l'ensemble des categories ayant des depenses effectives,
 * en excluant les contributions et les transferts entrants.
 * Ajoute aussi les categories avec une limite budgetaire definie
 * et la categorie "Pockets" systematiquement.
 *
 * @param transactions - Les transactions du mois courant.
 * @param categories - La liste des categories disponibles (pour les limites budgetaires).
 * @returns Un tableau de noms de categories.
 */
export function getCategoryFacts(
  transactions: BudgetTransaction[],
  categories: BudgetCategoryModel[],
): string[] {
  const result = new Set<string>();

  transactions.forEach((transaction) => {
    if (transaction.category === "Contribution") {
      return;
    }

    if (
      transaction.category === "Transfer / Savings" &&
      transaction.amount >= 0
    ) {
      return;
    }

    if (
      transaction.amount < 0 &&
      transaction.category !== "Transfer / Savings"
    ) {
      result.add(transaction.category);
    }
  });

  // Ajouter les categories avec une limite budgetaire depuis l'API
  categories.forEach((cat) => {
    if (cat.budgetLimit > 0) {
      result.add(cat.name);
    }
  });

  result.add("Pockets");

  return Array.from(result);
}

/**
 * Calcule le total des depenses (montants negatifs) pour une categorie donnee.
 * Les montants positifs sont ignores.
 *
 * @param category - Le nom de la categorie a filtrer.
 * @param transactions - Les transactions a analyser.
 * @returns La somme absolue des depenses pour cette categorie.
 */
export function getCategoryFact(
  category: string,
  transactions: BudgetTransaction[],
): number {
  return transactions.reduce((sum, transaction) => {
    if (transaction.category !== category || transaction.amount >= 0) {
      return sum;
    }

    return sum + Math.abs(transaction.amount);
  }, 0);
}
