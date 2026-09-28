import type { EcranDeroule } from '../../../../cours/content/types';
import { questionsDeLEcran } from '../../../shared/slides/session/lecture-ecran';
import type { QuestionDuPanneau } from './cours-panneau-question.component';

export function questionsDuPanneau(ecran: EcranDeroule): readonly QuestionDuPanneau[] {
  const apercu = questionsDeLEcran(ecran);
  let horsApercu = apercu.length;
  const questions = ecran.corriges.map((corrige) => {
    const position = apercu.findIndex((question) => question.id === corrige.questionId);
    if (position !== -1) {
      return { numero: position + 1, enonce: apercu[position].enonce, corrige };
    }
    horsApercu += 1;
    return { numero: horsApercu, enonce: '', corrige };
  });
  return questions.sort((gauche, droite) => gauche.numero - droite.numero);
}
