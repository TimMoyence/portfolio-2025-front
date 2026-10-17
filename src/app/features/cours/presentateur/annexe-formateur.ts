import type { CorrigeEcranPresentateur, EcranDeroule } from '../../../../cours/content/types';
import {
  questionServie,
  type ReponsesDuQuestionnaire,
  type RevelationDuVote,
} from '../../../shared/slides/session/lecture-ecran';

export function optionDeLaBonneReponse(
  ecran: EcranDeroule,
  questionId: string,
  cible: string,
): string | null {
  const options = questionServie(ecran, questionId)?.options ?? [];
  return options.find((option) => option.libelle === cible)?.id ?? null;
}

function reponsesDe(ecran: EcranDeroule): ReponsesDuQuestionnaire['reponses'] {
  return Object.fromEntries(
    ecran.corriges.map((corrige) => [
      corrige.questionId,
      {
        cible: corrige.bonneReponse,
        optionId: optionDeLaBonneReponse(ecran, corrige.questionId, corrige.bonneReponse),
      },
    ]),
  );
}

export function annexeFormateurDeLEcran(
  ecran: EcranDeroule,
): CorrigeEcranPresentateur | ReponsesDuQuestionnaire | RevelationDuVote | null {
  if (ecran.corriges.length === 0) {
    return ecran.corrigeEcran;
  }
  if (ecran.type === 'fp-vote' && ecran.corrigeEcran?.type === 'revelation') {
    return { ...ecran.corrigeEcran, reponses: reponsesDe(ecran) };
  }
  if (ecran.corrigeEcran !== null) {
    return ecran.corrigeEcran;
  }
  return { type: 'reponses', reponses: reponsesDe(ecran) };
}
