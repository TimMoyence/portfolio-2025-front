export const STATUT_LIMITE_DE_DEBIT = 429;

const STATUTS_DE_SESSION_REFUSEE: readonly number[] = [401, 403];

export function refuseLaSession(statut: number | null): boolean {
  return statut !== null && STATUTS_DE_SESSION_REFUSEE.includes(statut);
}
