import type { DerouleCours, EcranContent } from '../../../../cours/content/types';
import type { Donnees } from '../visual/presentation-v2';
import {
  aUnePresentation,
  objet,
  presentationDe,
  quizImbrique,
  quizPrincipal,
} from '../visual/presentation-v2';

interface Montage {
  readonly brique: string;
  readonly donnees: Donnees;
}

export interface QuestionDeLEcran {
  readonly id: string;
  readonly enonce: string;
}

export const PROPRIETES_PAR_BRIQUE: Readonly<Record<string, readonly string[]>> = {
  'fp-quote': ['citation'],
  'fp-story': ['recit'],
  'fp-pro': ['cas'],
  'fp-worked': ['exemple', 'etayage'],
  'fp-concept4': ['definition'],
  'fp-plot': ['definition'],
  'fp-challenge': ['probleme'],
  'fp-cardsort': ['plan'],
  'fp-numeric': ['question'],
  'fp-vote': ['question'],
  'fp-recall': ['question'],
  'fp-exit': ['billet'],
  'fp-quiz': ['question'],
};

const PORTEUR_DE_REPONSE: Readonly<Record<string, string>> = {
  'fp-numeric': 'question',
  'fp-vote': 'question',
  'fp-recall': 'question',
  'fp-exit': 'billet',
  'fp-quiz': 'question',
};

const QUESTIONNAIRE = 'questionnaire';

function lireMontage(brique: unknown, donnees: unknown): Montage | null {
  if (typeof brique !== 'string' || !Object.hasOwn(PROPRIETES_PAR_BRIQUE, brique)) {
    return null;
  }
  return { brique, donnees: objet(donnees) ?? {} };
}

export function planDeMontage(ecran: EcranContent): readonly Montage[] | null {
  if (ecran.type !== QUESTIONNAIRE) {
    const montage = lireMontage(ecran.type, ecran.donnees);
    return montage === null ? null : [montage];
  }
  const questions = ecran.donnees?.['questions'];
  if (!Array.isArray(questions) || questions.length === 0) {
    return null;
  }
  const montages = questions.map((question) => {
    const entree = objet(question);
    return entree === null ? null : lireMontage(entree['brique'], entree['donnees']);
  });
  return montages.every((montage): montage is Montage => montage !== null) ? montages : null;
}

function questionPortee(porteur: Donnees | null, champEnonce: string): readonly QuestionDeLEcran[] {
  if (porteur === null || typeof porteur['id'] !== 'string') {
    return [];
  }
  const enonce = porteur[champEnonce];
  return [{ id: porteur['id'], enonce: typeof enonce === 'string' ? enonce : '' }];
}

function questionsDuMontage(montage: Montage): readonly QuestionDeLEcran[] {
  const propriete = PORTEUR_DE_REPONSE[montage.brique] ?? '';
  return propriete === '' ? [] : questionPortee(objet(montage.donnees[propriete]), 'enonce');
}

export function questionsDeLEcran(ecran: EcranContent): readonly QuestionDeLEcran[] {
  if (aUnePresentation(ecran)) {
    const presentation = presentationDe(ecran);
    return [
      ...questionPortee(quizPrincipal(presentation), 'question'),
      ...questionPortee(quizImbrique(presentation), 'question'),
    ];
  }
  return (planDeMontage(ecran) ?? []).flatMap(questionsDuMontage);
}

export function titreDeLEcran(ecran: EcranContent): string | null {
  const presentation = presentationDe(ecran);
  const candidats = [presentation?.props['title'], quizPrincipal(presentation)?.['question']];
  return (
    candidats.find(
      (candidat): candidat is string => typeof candidat === 'string' && candidat !== '',
    ) ?? null
  );
}

export function identifiantsDesQuestions(ecran: EcranContent): readonly string[] {
  return questionsDeLEcran(ecran).map((question) => question.id);
}

export function enoncesDuDeroule(deroule: DerouleCours): ReadonlyMap<string, string> {
  return new Map(
    deroule.ecrans
      .flatMap((ecran) => questionsDeLEcran(ecran))
      .filter((question) => question.enonce !== '')
      .map((question) => [question.id, question.enonce]),
  );
}
