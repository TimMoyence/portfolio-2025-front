import type {
  ResultatQuestion,
  RevelationServie,
  Role,
  VotePhase,
} from '../../../../cours/content/types';
import { estObjet, PROPRIETE_FORMATEUR } from '../../../../cours/runtime/blocks/retours';
import type { SyntheseConcept } from '../../../core/ports/formations.port';
import type { DirectEcran, RetourBrique } from './contrat-hote';
import type { Montage, ReponsesDuQuestionnaire } from './lecture-ecran';

export interface MontageIdentifie extends Montage {
  readonly identifiants: readonly string[];
}

export interface ContexteDeReinjection {
  readonly retours: readonly RetourBrique[];
  readonly direct: DirectEcran | null;
  readonly revelation: RevelationServie | null;
  readonly role: Role;
  readonly donneesFormateur: unknown;
  readonly maitrise: readonly SyntheseConcept[] | null;
  readonly dernierEmetteur: boolean;
}

export type Pose = readonly [propriete: string, valeur: unknown];

type Genre<K extends RetourBrique['kind']> = Extract<RetourBrique, { kind: K }>;

const QUESTIONS_SIMPLES: ReadonlySet<string> = new Set(['fp-numeric', 'fp-recall', 'fp-exit']);
const QUESTIONS_REVELABLES: ReadonlySet<string> = new Set([...QUESTIONS_SIMPLES, 'fp-vote']);
const PRODUCTIONS: ReadonlySet<string> = new Set(['fp-sheet', 'fp-table-build', 'fp-cardsort']);
const LECTRICES_DE_L_ANNEXE: ReadonlySet<string> = new Set([
  ...PRODUCTIONS,
  'fp-vote',
  'fp-numeric',
  'fp-recall',
  'fp-challenge',
  'fp-escape',
]);

function deGenre<K extends RetourBrique['kind']>(
  retours: readonly RetourBrique[],
  genre: K,
): Genre<K>[] {
  return retours.filter((retour): retour is Genre<K> => retour.kind === genre);
}

function viseUnIdentifiant(identifiants: readonly string[], identifiant: string): boolean {
  return identifiants.includes(identifiant);
}

function questionAffichee(montage: MontageIdentifie, direct: DirectEcran | null): string | null {
  const jumelle = montage.identifiants.at(1);
  const phase = direct?.pilotage.phase;
  if ((phase === 'revote' || phase === 'revele') && jumelle !== undefined) {
    return jumelle;
  }
  return montage.identifiants.at(0) ?? null;
}

interface ResultatsDeVote {
  readonly total: number;
  readonly parOption: Readonly<Record<string, number>>;
}

function resultatsDe(
  identifiant: string | null | undefined,
  direct: DirectEcran | null,
): ResultatsDeVote | null {
  const resultat: ResultatQuestion | undefined = direct?.resultats?.find(
    (question) => question.questionId === identifiant,
  );
  return resultat === undefined
    ? null
    : { total: resultat.total, parOption: resultat.parOption ?? {} };
}

function resultatsDuVote(
  montage: MontageIdentifie,
  direct: DirectEcran | null,
): ResultatsDeVote | null {
  return resultatsDe(questionAffichee(montage, direct), direct);
}

function resultatsDuPremierVote(
  montage: MontageIdentifie,
  direct: DirectEcran | null,
): ResultatsDeVote | null {
  return montage.identifiants.length < 2 ? null : resultatsDe(montage.identifiants[0], direct);
}

function phaseDuVote(direct: DirectEcran | null): VotePhase | null {
  const pilotage = direct?.pilotage;
  return pilotage?.phase ?? (pilotage?.revele === true ? 'revele' : null);
}

function ecranRevele(contexte: ContexteDeReinjection): boolean {
  const pilotage = contexte.direct?.pilotage;
  return pilotage?.phase === 'revele' || pilotage?.revele === true || (pilotage?.etayage ?? 0) > 0;
}

function annexeDeLaRevelation(revelation: RevelationServie): unknown {
  if (revelation.questions.length === 0) {
    return revelation.annexe;
  }
  const reponses: ReponsesDuQuestionnaire = {
    type: 'reponses',
    reponses: Object.fromEntries(
      revelation.questions.map(({ questionId, cible, optionId }) => [
        questionId,
        { cible, optionId },
      ]),
    ),
  };
  return reponses;
}

function annexeVisible(contexte: ContexteDeReinjection): unknown {
  if (contexte.role === 'presentateur') {
    return ecranRevele(contexte) ? contexte.donneesFormateur : null;
  }
  return contexte.revelation === null ? null : annexeDeLaRevelation(contexte.revelation);
}

function annexeDuMontage(
  montage: MontageIdentifie,
  donnees: unknown,
  direct: DirectEcran | null,
): unknown {
  if (!estObjet(donnees) || donnees['type'] !== 'reponses') {
    return donnees;
  }
  const reponses = donnees['reponses'];
  const bonne = estObjet(reponses) ? reponses[questionAffichee(montage, direct) ?? ''] : undefined;
  if (!estObjet(bonne) || typeof bonne['cible'] !== 'string') {
    return null;
  }
  const optionId = typeof bonne['optionId'] === 'string' ? bonne['optionId'] : null;
  return { type: 'cible', cible: bonne['cible'], optionId };
}

function posesDesQuestions(montage: MontageIdentifie, contexte: ContexteDeReinjection): Pose[] {
  const verdicts = deGenre(contexte.retours, 'verdict-reponse');
  if (montage.brique === 'fp-vote') {
    return [
      [
        'verdicts',
        verdicts.filter((verdict) => viseUnIdentifiant(montage.identifiants, verdict.questionId)),
      ],
      ['phase', phaseDuVote(contexte.direct)],
      ['resultats', resultatsDuVote(montage, contexte.direct)],
      ['resultatsPremierVote', resultatsDuPremierVote(montage, contexte.direct)],
    ];
  }
  if (QUESTIONS_SIMPLES.has(montage.brique)) {
    const verdict = verdicts.filter((candidat) =>
      viseUnIdentifiant(montage.identifiants, candidat.questionId),
    );
    return [['verdict', verdict.at(-1) ?? null]];
  }
  return [];
}

function posesDesProductions(montage: MontageIdentifie, contexte: ContexteDeReinjection): Pose[] {
  if (!PRODUCTIONS.has(montage.brique)) {
    return [];
  }
  const verdict = deGenre(contexte.retours, 'verdict-production').filter((candidat) =>
    viseUnIdentifiant(montage.identifiants, candidat.questionId),
  );
  return [['verdict', verdict.at(-1) ?? null]];
}

function posesDuRappel(montage: MontageIdentifie, contexte: ContexteDeReinjection): Pose[] {
  if (montage.brique !== 'fp-spaced') {
    return [];
  }
  const questions = deGenre(contexte.retours, 'rappels').at(-1)?.questions ?? null;
  const servies = new Set((questions ?? []).map((question) => question.questionId));
  return [
    ['questions', questions],
    [
      'verdicts',
      deGenre(contexte.retours, 'verdict-reponse').filter((verdict) =>
        servies.has(verdict.questionId),
      ),
    ],
    ['maitrise', contexte.role === 'presentateur' ? contexte.maitrise : null],
  ];
}

function posesDuCoffre(montage: MontageIdentifie, contexte: ContexteDeReinjection): Pose[] {
  if (montage.brique !== 'fp-escape') {
    return [];
  }
  const visees = (retour: { readonly parcoursId: string }): boolean =>
    viseUnIdentifiant(montage.identifiants, retour.parcoursId);
  return [
    ['progression', deGenre(contexte.retours, 'progression-enigmes').filter(visees).at(-1) ?? null],
    ['tentatives', deGenre(contexte.retours, 'tentative').filter(visees)],
  ];
}

function posesDuPilotage(montage: MontageIdentifie, contexte: ContexteDeReinjection): Pose[] {
  const pilotage = contexte.direct?.pilotage;
  switch (montage.brique) {
    case 'fp-challenge':
      return [
        [
          'strategies',
          deGenre(contexte.retours, 'strategies')
            .filter((retour) => viseUnIdentifiant(montage.identifiants, retour.defiId))
            .at(-1)?.strategies ?? null,
        ],
        ['revele', pilotage?.revele === true],
      ];
    case 'fp-worked':
    case 'fp-sheet':
    case 'fp-table-build':
      return [['etayage', pilotage?.etayage ?? 0]];
    case 'fp-recall':
      return [['optionsAffichees', pilotage?.optionsAffichees === true]];
    case 'fp-pulse':
      return [['comptes', contexte.direct?.comptesJalon ?? null]];
    case 'fp-concept4':
    case 'fp-plot':
      return contexte.role === 'presentateur' ? [['reglages', pilotage?.reglages ?? null]] : [];
    default:
      return [];
  }
}

function posesCommunes(montage: MontageIdentifie, contexte: ContexteDeReinjection): Pose[] {
  const dejaRepondu = deGenre(contexte.retours, 'deja-repondu').some((retour) =>
    viseUnIdentifiant(montage.identifiants, retour.questionId),
  );
  const refus = contexte.dernierEmetteur ? deGenre(contexte.retours, 'refus').at(-1) : undefined;
  const formateur: Pose[] = LECTRICES_DE_L_ANNEXE.has(montage.brique)
    ? [[PROPRIETE_FORMATEUR, annexeDuMontage(montage, annexeVisible(contexte), contexte.direct)]]
    : [];
  const cloture: Pose[] = QUESTIONS_REVELABLES.has(montage.brique)
    ? [['cloture', contexte.direct?.pilotage.revele === true]]
    : [];
  return [
    ['dejaRepondu', dejaRepondu],
    ['erreur', refus?.message ?? null],
    ...cloture,
    ...formateur,
  ];
}

export function posesDeReinjection(
  montage: MontageIdentifie,
  contexte: ContexteDeReinjection,
): readonly Pose[] {
  return [
    ...posesDesQuestions(montage, contexte),
    ...posesDesProductions(montage, contexte),
    ...posesDuRappel(montage, contexte),
    ...posesDuCoffre(montage, contexte),
    ...posesDuPilotage(montage, contexte),
    ...posesCommunes(montage, contexte),
  ];
}

export function memeValeur(gauche: unknown, droite: unknown): boolean {
  if (Array.isArray(gauche) && Array.isArray(droite)) {
    return (
      gauche.length === droite.length &&
      gauche.every((element, rang) => Object.is(element, droite[rang]))
    );
  }
  if (estObjet(gauche) && estObjet(droite)) {
    return egauxEnProfondeur(gauche, droite);
  }
  return Object.is(gauche, droite);
}

function egauxEnProfondeur(gauche: unknown, droite: unknown): boolean {
  if (Array.isArray(gauche) || Array.isArray(droite)) {
    return (
      Array.isArray(gauche) &&
      Array.isArray(droite) &&
      gauche.length === droite.length &&
      gauche.every((element, rang) => egauxEnProfondeur(element, droite[rang]))
    );
  }
  if (estObjet(gauche) && estObjet(droite)) {
    const cles = Object.keys(gauche);
    return (
      cles.length === Object.keys(droite).length &&
      cles.every((cle) => Object.hasOwn(droite, cle) && egauxEnProfondeur(gauche[cle], droite[cle]))
    );
  }
  return Object.is(gauche, droite);
}
