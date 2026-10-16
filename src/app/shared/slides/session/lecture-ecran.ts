import type {
  CorrigeEcranPresentateur,
  CoursContent,
  DerouleCours,
  EcranContent,
} from '../../../../cours/content/types';
import { rappelEcritAvantLesOptions } from '../../../../cours/runtime/blocks/FpRecall';
import type { TableBuildPlanPublic } from '../../../../cours/runtime/blocks/FpTableBuild';
import type { CibleRevelee } from '../../../../cours/runtime/blocks/retours';
import {
  chaineDe,
  estChaineNonVide,
  estChaineOuNul,
  objet,
} from '../../../../cours/runtime/core/valeurs';
import {
  cleDeCellule,
  enonceDeCellule,
  saisiesDuPlan,
} from '../../../../cours/runtime/blocks/FpTableBuild';
import type { Donnees } from '../visual/presentation-v2';
import {
  aUnePresentation,
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
  readonly consigne: string | null;
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
  readonly reponses: Readonly<Record<string, CibleRevelee>>;
}

export type RevelationDuVote = Extract<CorrigeEcranPresentateur, { readonly type: 'revelation' }> &
  Pick<ReponsesDuQuestionnaire, 'reponses'>;

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

export function estVoteJumele(ecran: EcranContent): boolean {
  return ecran.type === 'fp-vote' && objet(ecran.donnees?.['questionJumelle']) !== null;
}

export function enteteDeQuestionnaire(ecran: EcranContent): EnteteDeQuestionnaire | null {
  if (ecran.type !== QUESTIONNAIRE) {
    return null;
  }
  const intitule = chaineDe(ecran.donnees, 'intitule');
  const consigne = ecran.donnees?.['consigne'] ?? null;
  return intitule !== null && estChaineOuNul(consigne) ? { intitule, consigne } : null;
}

export function identifiantPorte(donnees: Donnees | undefined, propriete: string): string | null {
  const identifiant = objet(donnees?.[propriete])?.['id'];
  return estChaineNonVide(identifiant) ? identifiant : null;
}

export function identifiantsDuMontage(montage: Montage): readonly string[] {
  return (PORTEURS[montage.brique] ?? [])
    .map((propriete) => identifiantPorte(montage.donnees, propriete))
    .filter((identifiant): identifiant is string => identifiant !== null);
}

function questionPortee(porteur: Donnees | null, champEnonce: string): readonly QuestionDeLEcran[] {
  const id = chaineDe(porteur, 'id');
  return id === null ? [] : [{ id, enonce: chaineDe(porteur, champEnonce) ?? '' }];
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
  return candidats.find(estChaineNonVide) ?? null;
}

export function identifiantsDesQuestions(ecran: EcranContent): readonly string[] {
  return questionsDeLEcran(ecran).map((question) => question.id);
}

export function enoncesDuDeroule(deroule: DerouleCours): ReadonlyMap<string, string> {
  return new Map(
    deroule.ecrans
      .flatMap((ecran) => [...ecran.questions, ...questionsDeLEcran(ecran)])
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
    const id = chaineDe(porteur, 'id');
    const enonce = chaineDe(porteur, champEnonce);
    return id !== null && enonce !== null ? [[`${prefixe}${id}`, enonce] as const] : [];
  });
}

function activitesDuTravaille(donnees: Donnees): readonly (readonly [string, string])[] {
  const exemple = donnees['exemple'];
  const id = chaineDe(exemple, 'id');
  if (donnees['pilote'] === true || id === null) {
    return [];
  }
  return entreesPortees(objet(exemple)?.['etapes'], 'invite', `${id}:`);
}

function activitesDuRappel(donnees: Donnees): readonly (readonly [string, string])[] {
  if (!rappelEcritAvantLesOptions(donnees['delaiMs'])) {
    return [];
  }
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
      return new Map(entreesPortees(donnees['billet'], 'invite'));
    case 'fp-challenge':
      return new Map(entreesPortees(donnees['probleme'], 'invite'));
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

function cellulesDuTableau(plan: Donnees | null): readonly (readonly [string, string])[] {
  if (plan === null) {
    return [];
  }
  const tableau = plan as unknown as TableBuildPlanPublic;
  return saisiesDuPlan(tableau).map(
    ({ rang, colonne }) =>
      [
        cleDeCellule(rang, colonne.cle),
        enonceDeCellule(tableau.libellesLignes, rang, colonne.intitule),
      ] as const,
  );
}

export function libellesDesElements(ecran: EcranContent): ReadonlyMap<string, string> {
  const donnees = ecran.donnees ?? {};
  switch (ecran.type) {
    case 'fp-cardsort':
      return new Map(entreesPortees(objet(donnees['plan'])?.['cartes'], 'libelle'));
    case 'fp-escape':
      return new Map(entreesPortees(objet(donnees['parcours'])?.['enigmes'], 'intitule'));
    case 'fp-table-build':
      return new Map(cellulesDuTableau(objet(donnees['plan'])));
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

export function ecranDIdentifiant<T extends EcranContent>(
  ecrans: readonly T[],
  id: string | undefined,
): T | undefined {
  return ecrans.find((ecran) => ecran.id === id);
}

export function ecranAuRang<T extends EcranContent>(
  contenu: { readonly ecrans: readonly T[] } | null | undefined,
  rang: number,
): T | undefined {
  return contenu?.ecrans[rang];
}

export function ecranDuRappel(cours: CoursContent): string | null {
  return cours.ecrans.find((ecran) => ecran.type === 'fp-spaced')?.id ?? null;
}
