import type { InteractionProfile } from "../../core/models/interaction-profile.model";

/**
 * Tranche budgetaire telle que persistee dans `InteractionProfile`.
 * Reprise stricte du type domaine : valeurs en euros/mois, `null` quand
 * inconnu.
 */
export type BudgetTier = NonNullable<InteractionProfile["budgetTier"]>;

/**
 * Convertit une valeur d'echelle self-rating (1-5) en tranche budgetaire.
 * Seuils alignes sur le parcours IA Solopreneurs : debutants (1-2) sur
 * le tier gratuit, intermediaires (3) sur le tier moyen, avances (4-5)
 * sur le tier premium.
 */
export function selfRatingToBudgetTier(value: number): BudgetTier {
  if (value <= 2) return "0";
  if (value <= 3) return "60";
  return "120";
}

/**
 * Convertit une valeur de quiz single-choice budget en tranche.
 * Mapping stable aligne avec les options standard proposees par les
 * configs formations :
 *  - "zero" / "small" → gratuit / jusqu'a 200 euros/mois
 *  - "medium" → 200 a 500 euros/mois
 *  - "large" / autre → 500+ euros/mois
 */
export function quizValueToBudgetTier(value: string): BudgetTier {
  if (value === "zero" || value === "small") return "0";
  if (value === "medium") return "60";
  return "120";
}
