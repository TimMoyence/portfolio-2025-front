export interface LimiteDeDebit {
  readonly minutes: number | null;
}

const TROP_DE_TENTATIVES = $localize`:@@formulaireRefusTropDeTentatives:Trop de tentatives en peu de temps : réessayez plus tard.`;

export function messageDeLaLimite({ minutes }: LimiteDeDebit): string {
  return minutes === null
    ? TROP_DE_TENTATIVES
    : $localize`:@@formulaireRefusTropDeTentativesDelai:Trop de tentatives en peu de temps : réessayez dans ${minutes}:minutes: min.`;
}
