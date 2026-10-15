import type { EcranDeroule } from '../../../../cours/content/types';

export interface CorrectionAffichee {
  readonly enonce: string;
  readonly bonneReponse: string;
}

const CORRIGE_DANS_LA_BRIQUE: ReadonlySet<string> = new Set([
  'questionnaire',
  'fp-vote',
  'fp-recall',
  'fp-numeric',
]);

export function correctionsAffichees(
  ecran: EcranDeroule | undefined,
): readonly CorrectionAffichee[] {
  if (ecran === undefined || CORRIGE_DANS_LA_BRIQUE.has(ecran.type)) {
    return [];
  }
  return ecran.corriges.map((corrige) => ({
    enonce: ecran.questions.find(({ id }) => id === corrige.questionId)?.enonce ?? '',
    bonneReponse: corrige.bonneReponse,
  }));
}
