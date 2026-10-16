export interface LimiteDeDebit {
  readonly minutes: number | null;
}

const TROP_DE_TENTATIVES = $localize`:@@formulaireRefusTropDeTentatives:Trop de tentatives en peu de temps : réessayez plus tard.`;

export function laPlusLongue(limites: readonly (LimiteDeDebit | null)[]): LimiteDeDebit | null {
  const connues = limites.filter((limite): limite is LimiteDeDebit => limite !== null);
  if (connues.length === 0) {
    return null;
  }
  return connues.some(({ minutes }) => minutes === null)
    ? { minutes: null }
    : { minutes: Math.max(...connues.map(({ minutes }) => minutes ?? 0)) };
}

export function messageDeLaLimite({ minutes }: LimiteDeDebit): string {
  return minutes === null
    ? TROP_DE_TENTATIVES
    : $localize`:@@formulaireRefusTropDeTentativesDelai:Trop de tentatives en peu de temps : réessayez dans ${minutes}:minutes: min.`;
}
