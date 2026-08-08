import type { InteractionProfile } from '../../core/models/interaction-profile.model';

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
