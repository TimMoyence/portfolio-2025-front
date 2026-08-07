import type { InteractionProfile } from '../../core/models/interaction-profile.model';

/**
 * Tranche budgetaire telle que persistee dans `InteractionProfile`.
 * Reprise stricte du type domaine : valeurs en euros/mois, `null` quand
 * inconnu.
 */
export type BudgetTier = NonNullable<InteractionProfile['budgetTier']>;

export function selfRatingToBudgetTier(value: number): BudgetTier {
  if (value <= 2) return '0';
  if (value <= 3) return '60';
  return '120';
}

export function quizValueToBudgetTier(value: string): BudgetTier {
  if (value === 'zero' || value === 'small') return '0';
  if (value === 'medium') return '60';
  return '120';
}
