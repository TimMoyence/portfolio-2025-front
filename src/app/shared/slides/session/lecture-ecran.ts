import type { CoursContent, DerouleCours, EcranContent } from '../../../../cours/content/types';
import type { Donnees } from '../visual/presentation-v2';
import {
  aUnePresentation,
  objet,
  presentationDe,
  quizImbrique,
  quizPrincipal,
} from '../visual/presentation-v2';

export interface Montage {
  readonly brique: string;
  readonly donnees: Donnees;
}

export interface QuestionDeLEcran {
  readonly id: string;
  readonly enonce: string;
}

export interface EnteteDeQuestionnaire {
  readonly intitule: string;
  readonly consigne: string;
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
  'fp-sheet': ['plan'],
  'fp-table-build': ['plan'],
  'fp-escape': ['parcours'],
  'fp-pulse': ['sondage'],
  'fp-spaced': ['rappel'],
  'fp-numeric': ['question'],
  'fp-vote': ['question', 'questionJumelle'],
  'fp-recall': ['question', 'delaiMs'],
  'fp-exit': ['billet'],
};

const PORTEURS: Readonly<Record<string, readonly string[]>> = {
  'fp-numeric': ['question'],
  'fp-vote': ['question', 'questionJumelle'],
  'fp-recall': ['question'],
  'fp-exit': ['billet'],
  'fp-cardsort': ['plan'],
  'fp-sheet': ['plan'],
  'fp-table-build': ['plan'],
  'fp-escape': ['parcours'],
  'fp-challenge': ['probleme'],
  'fp-spaced': ['rappel'],
  'fp-pulse': ['sondage'],
  'fp-worked': ['exemple'],
};

const PORTEURS_DE_QUESTION: Readonly<Record<string, readonly string[]>> = {
  'fp-numeric': ['question'],
  'fp-vote': ['question', 'questionJumelle'],
  'fp-recall': ['question'],
  'fp-exit': ['billet'],
  'fp-cardsort': ['plan'],
  'fp-sheet': ['plan'],
  'fp-table-build': ['plan'],
};

const CHAMP_ENONCE: Readonly<Record<string, string>> = {
  billet: 'question',
  plan: 'intitule',
};

const QUESTIONNAIRE = 'questionnaire';
export const ECRAN_VERROUILLE = 'ecran-verrouille';

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

export function enteteDeQuestionnaire(ecran: EcranContent): EnteteDeQuestionnaire | null {
  if (ecran.type !== QUESTIONNAIRE) {
    return null;
  }
  const intitule = ecran.donnees?.['intitule'];
  const consigne = ecran.donnees?.['consigne'];
  return typeof intitule === 'string' && typeof consigne === 'string'
    ? { intitule, consigne }
    : null;
}

function identifiantPorte(donnees: Donnees, propriete: string): string | null {
  const identifiant = objet(donnees[propriete])?.['id'];
  return typeof identifiant === 'string' && identifiant !== '' ? identifiant : null;
}

export function identifiantsDuMontage(montage: Montage): readonly string[] {
  return (PORTEURS[montage.brique] ?? [])
    .map((propriete) => identifiantPorte(montage.donnees, propriete))
    .filter((identifiant): identifiant is string => identifiant !== null);
}

function questionPortee(porteur: Donnees | null, champEnonce: string): readonly QuestionDeLEcran[] {
  if (porteur === null || typeof porteur['id'] !== 'string') {
    return [];
  }
  const enonce = porteur[champEnonce];
  return [{ id: porteur['id'], enonce: typeof enonce === 'string' ? enonce : '' }];
}

function questionsDuMontage(montage: Montage): readonly QuestionDeLEcran[] {
  return (PORTEURS_DE_QUESTION[montage.brique] ?? []).flatMap((propriete) =>
    questionPortee(objet(montage.donnees[propriete]), CHAMP_ENONCE[propriete] ?? 'enonce'),
  );
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
  const candidats = [
    ecran.titre,
    presentation?.props['title'],
    quizPrincipal(presentation)?.['question'],
  ];
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

export function ecransDesIdentifiants(cours: CoursContent): ReadonlyMap<string, string> {
  const ecrans = new Map<string, string>();
  for (const ecran of cours.ecrans) {
    const identifiants = [
      ...identifiantsDesQuestions(ecran),
      ...(planDeMontage(ecran) ?? []).flatMap(identifiantsDuMontage),
    ];
    for (const identifiant of identifiants) {
      ecrans.set(identifiant, ecran.id);
    }
  }
  return ecrans;
}

export function ecranDuRappel(cours: CoursContent): string | null {
  return cours.ecrans.find((ecran) => ecran.type === 'fp-spaced')?.id ?? null;
}
