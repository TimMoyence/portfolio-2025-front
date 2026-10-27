import type { CorrigeEcranPresentateur, EcranDeroule } from '../../../../cours/content/types';
import type { ReponsesDuQuestionnaire } from '../../../shared/slides/session/lecture-ecran';

function reponsesDe(ecran: EcranDeroule): ReponsesDuQuestionnaire['reponses'] {
  return Object.fromEntries(
    ecran.corriges.map(({ questionId, bonneReponse, optionId }) => [
      questionId,
      { cible: bonneReponse, optionId },
    ]),
  );
}

export function annexeFormateurDeLEcran(
  ecran: EcranDeroule,
): CorrigeEcranPresentateur | ReponsesDuQuestionnaire | null {
  if (ecran.corriges.length === 0) {
    return ecran.corrigeEcran;
  }
  if (ecran.corrigeEcran !== null) {
    return ecran.corrigeEcran;
  }
  return { type: 'reponses', reponses: reponsesDe(ecran) };
}
