import type { EcranDeroule } from '../../../../cours/content/types';

export interface CorrectionAffichee {
  readonly enonce: string;
  readonly bonneReponse: string;
}

const CORRIGE_SOUS_CHAQUE_QUESTION = 'questionnaire';

export function correctionsAffichees(
  ecran: EcranDeroule | undefined,
): readonly CorrectionAffichee[] {
  if (ecran?.type === CORRIGE_SOUS_CHAQUE_QUESTION) {
    return [];
  }
  return (ecran?.corriges ?? []).map((corrige) => ({
    enonce: ecran?.questions.find(({ id }) => id === corrige.questionId)?.enonce ?? '',
    bonneReponse: corrige.bonneReponse,
  }));
}
