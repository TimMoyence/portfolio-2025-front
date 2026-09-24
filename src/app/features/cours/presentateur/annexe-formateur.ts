import type { CorrigeEcranPresentateur, EcranDeroule } from '../../../../cours/content/types';
import type { ReponsesDuQuestionnaire } from '../../../shared/slides/session/lecture-ecran';

function optionDeLaBonneReponse(
  ecran: EcranDeroule,
  questionId: string,
  cible: string,
): string | null {
  const options = ecran.questions.find((question) => question.id === questionId)?.options ?? [];
  return options.find((option) => option.libelle === cible)?.id ?? null;
}

export function annexeFormateurDeLEcran(
  ecran: EcranDeroule,
): CorrigeEcranPresentateur | ReponsesDuQuestionnaire | null {
  if (ecran.corrigeEcran !== null || ecran.corriges.length === 0) {
    return ecran.corrigeEcran;
  }
  return {
    type: 'reponses',
    reponses: Object.fromEntries(
      ecran.corriges.map((corrige) => [
        corrige.questionId,
        {
          cible: corrige.bonneReponse,
          optionId: optionDeLaBonneReponse(ecran, corrige.questionId, corrige.bonneReponse),
        },
      ]),
    ),
  };
}
