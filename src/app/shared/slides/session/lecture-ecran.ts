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

const RESOLU_AILLEURS = 'resoluAilleurs';

export const PROPRIETES_PAR_BRIQUE: Readonly<Record<string, readonly string[]>> = {
  'fp-quote': ['citation'],
  'fp-story': ['recit'],
  'fp-pro': ['cas'],
  'fp-worked': ['exemple', 'etayage', 'pilote'],
  'fp-concept4': ['definition'],
  'fp-plot': ['definition'],
  'fp-challenge': ['probleme'],
  'fp-cardsort': ['plan', RESOLU_AILLEURS],
  'fp-sheet': ['plan'],
  'fp-table-build': ['plan'],
  'fp-escape': ['parcours'],
  'fp-pulse': ['sondage'],
  'fp-spaced': ['rappel'],
  'fp-numeric': ['question'],
  'fp-vote': ['question', 'questionJumelle'],
  'fp-recall': ['question', 'delaiMs', 'consigne'],
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
  'fp-pro': ['cas'],
};

const BRIQUES_A_QUESTION: readonly string[] = [
  'fp-numeric',
  'fp-vote',
  'fp-recall',
  'fp-exit',
  'fp-cardsort',
  'fp-sheet',
  'fp-table-build',
];

const PORTEURS_DE_QUESTION: Readonly<Record<string, readonly string[]>> = Object.fromEntries(
  BRIQUES_A_QUESTION.map((brique) => [brique, PORTEURS[brique]]),
);

const CHAMP_ENONCE: Readonly<Record<string, string>> = {
  billet: 'question',
  plan: 'intitule',
};

export interface ReponsesDuQuestionnaire {
  readonly type: 'reponses';
  readonly reponses: Readonly<
    Record<string, { readonly cible: string; readonly optionId: string | null }>
  >;
}

const QUESTIONNAIRE = 'questionnaire';
export const ECRAN_VERROUILLE = 'ecran-verrouille';

function lireMontage(brique: unknown, donnees: unknown): Montage | null {
  if (typeof brique !== 'string' || !Object.hasOwn(PROPRIETES_PAR_BRIQUE, brique)) {
    return null;
  }
  return { brique, donnees: objet(donnees) ?? {} };
}

function signalerLeRenvoi(montage: Montage, ecran: EcranContent): Montage {
  if (!PROPRIETES_PAR_BRIQUE[montage.brique].includes(RESOLU_AILLEURS)) {
    return montage;
  }
  const resoluAilleurs = (ecran.resoluPar?.length ?? 0) > 0;
  return { ...montage, donnees: { ...montage.donnees, [RESOLU_AILLEURS]: resoluAilleurs } };
}

export function planDeMontage(ecran: EcranContent): readonly Montage[] | null {
  if (ecran.type !== QUESTIONNAIRE) {
    const montage = lireMontage(ecran.type, ecran.donnees);
    return montage === null ? null : [signalerLeRenvoi(montage, ecran)];
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

function entreesPortees(
  porteurs: unknown,
  champEnonce: string,
  prefixe = '',
): readonly (readonly [string, string])[] {
  return (Array.isArray(porteurs) ? porteurs : [porteurs]).flatMap((porteur) => {
    const entree = objet(porteur);
    const id = entree?.['id'];
    const enonce = entree?.[champEnonce];
    return typeof id === 'string' && typeof enonce === 'string'
      ? [[`${prefixe}${id}`, enonce] as const]
      : [];
  });
}

function activitesDuTravaille(donnees: Donnees): readonly (readonly [string, string])[] {
  const exemple = objet(donnees['exemple']);
  const id = exemple?.['id'];
  if (donnees['pilote'] === true || typeof id !== 'string') {
    return [];
  }
  return entreesPortees(exemple?.['etapes'], 'invite', `${id}:`);
}

function activitesDuRappel(donnees: Donnees): readonly (readonly [string, string])[] {
  return entreesPortees(donnees['question'], 'enonce').map(
    ([id, enonce]) => [`${id}:rappel`, enonce] as const,
  );
}

export function enoncesDesActivites(ecran: EcranContent): ReadonlyMap<string, string> {
  const donnees = ecran.donnees ?? {};
  switch (ecran.type) {
    case 'fp-pro':
      return new Map(entreesPortees(objet(donnees['cas'])?.['questionsLibres'], 'question'));
    case 'fp-worked':
      return new Map(activitesDuTravaille(donnees));
    case 'fp-recall':
      return new Map(activitesDuRappel(donnees));
    case 'fp-exit':
      return new Map(entreesPortees(donnees['billet'], 'question'));
    case 'fp-story': {
      const presentation = presentationDe(ecran);
      return presentation?.renderer === 'reflection'
        ? new Map(entreesPortees(presentation.props['promptData'], 'question'))
        : new Map();
    }
    default:
      return new Map();
  }
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
