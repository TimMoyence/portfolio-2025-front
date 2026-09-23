import type { CorrigeEcranPresentateur, EcranDeroule } from '../../../../cours/content/types';
import type { ReponsesDuQuestionnaire } from '../../../shared/slides/session/lecture-ecran';

const QUESTIONNAIRE = 'questionnaire';

export function annexeFormateurDeLEcran(
  ecran: EcranDeroule,
): CorrigeEcranPresentateur | ReponsesDuQuestionnaire | null {
  if (ecran.type !== QUESTIONNAIRE || ecran.corriges.length === 0) {
    return ecran.corrigeEcran;
  }
  return {
    type: 'reponses',
    reponses: Object.fromEntries(
      ecran.corriges.map((corrige) => [corrige.questionId, corrige.bonneReponse]),
    ),
  };
}
