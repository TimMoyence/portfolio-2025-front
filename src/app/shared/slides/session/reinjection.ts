import type {
  EcranDeroule,
  ExplicationServie,
  RevelationServie,
  Role,
  VotePhase,
} from '../../../../cours/content/types';
import type { SpacedQuestionPublique } from '../../../../cours/runtime/blocks/FpSpaced';
import {
  type CibleRevelee,
  lireCibleRevelee,
  PROPRIETE_FORMATEUR,
} from '../../../../cours/runtime/blocks/retours';
import { estObjet } from '../../../../cours/runtime/core/valeurs';
import type { RetourBrique, SyntheseConcept } from '../../../core/ports/formations.port';
import type { DirectEcran } from './contrat-hote';
import { deLaQuestion, type Montage, type ReponsesDuQuestionnaire } from './lecture-ecran';

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
  readonly papier: ImpressionDeLEcran | null;
  readonly explications: readonly ExplicationServie[];
}

export interface ImpressionDeLEcran {
  readonly questions: EcranDeroule['questions'];
}

export type Pose = readonly [propriete: string, valeur: unknown];

type Genre<K extends RetourBrique['kind']> = Extract<RetourBrique, { kind: K }>;

const QUESTIONS_SIMPLES: ReadonlySet<string> = new Set(['fp-numeric', 'fp-recall', 'fp-exit']);
const QUESTIONS_REVELABLES: ReadonlySet<string> = new Set([
  ...QUESTIONS_SIMPLES,
  'fp-vote',
  'fp-spaced',
]);
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
  return direct?.pilotage.questionAffichee ?? montage.identifiants.at(0) ?? null;
}

interface ResultatsDeVote {
  readonly total: number;
  readonly parOption: Readonly<Record<string, number>>;
}

function resultatsDe(
  identifiant: string | null | undefined,
  direct: DirectEcran | null,
): ResultatsDeVote | null {
  const resultat = deLaQuestion(direct?.resultats, identifiant);
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
  return direct?.pilotage.phase ?? null;
}

function ecranRevele(contexte: ContexteDeReinjection): boolean {
  const pilotage = contexte.direct?.pilotage;
  return contexte.papier !== null || pilotage?.revele === true || (pilotage?.etayage ?? 0) > 0;
}

function rappelImprime(papier: ImpressionDeLEcran): SpacedQuestionPublique[] {
  return papier.questions.map((question) => ({
    questionId: question.id,
    concept: '',
    boite: 1,
    cours: '',
    enonce: question.enonce,
    options: [...(question.options ?? [])],
  }));
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

function expliqueSurPlace(contexte: ContexteDeReinjection): boolean {
  return contexte.explications.length > 0;
}

function annexeVisible(contexte: ContexteDeReinjection): unknown {
  if (contexte.role === 'presentateur') {
    return ecranRevele(contexte) || expliqueSurPlace(contexte) ? contexte.donneesFormateur : null;
  }
  return contexte.revelation === null ? null : annexeDeLaRevelation(contexte.revelation);
}

function cibleDeLaQuestionAffichee(
  montage: MontageIdentifie,
  reponses: unknown,
  direct: DirectEcran | null,
): CibleRevelee | null {
  return estObjet(reponses)
    ? lireCibleRevelee(reponses[questionAffichee(montage, direct) ?? ''])
    : null;
}

function annexeDuMontage(
  montage: MontageIdentifie,
  donnees: unknown,
  direct: DirectEcran | null,
): unknown {
  if (!estObjet(donnees)) {
    return donnees;
  }
  if (donnees['type'] === 'revelation' && 'reponses' in donnees) {
    const { reponses, ...revelation } = donnees;
    return {
      ...revelation,
      optionId: cibleDeLaQuestionAffichee(montage, reponses, direct)?.optionId ?? null,
    };
  }
  if (donnees['type'] !== 'reponses') {
    return donnees;
  }
  const bonne = cibleDeLaQuestionAffichee(montage, donnees['reponses'], direct);
  return bonne === null ? null : { type: 'cible', ...bonne };
}

function visantLeMontage<T extends { readonly questionId: string }>(
  verdicts: readonly T[],
  montage: MontageIdentifie,
): T[] {
  return verdicts.filter((verdict) => viseUnIdentifiant(montage.identifiants, verdict.questionId));
}

function poseDuDernierVerdict(
  verdicts: readonly { readonly questionId: string }[],
  montage: MontageIdentifie,
): Pose[] {
  return [['verdict', visantLeMontage(verdicts, montage).at(-1) ?? null]];
}

function posesDesQuestions(montage: MontageIdentifie, contexte: ContexteDeReinjection): Pose[] {
  const verdicts = deGenre(contexte.retours, 'verdict-reponse');
  if (montage.brique === 'fp-vote') {
    return [
      ['verdicts', visantLeMontage(verdicts, montage)],
      ['phase', phaseDuVote(contexte.direct)],
      ['questionAffichee', questionAffichee(montage, contexte.direct)],
      ['resultats', resultatsDuVote(montage, contexte.direct)],
      ['resultatsPremierVote', resultatsDuPremierVote(montage, contexte.direct)],
    ];
  }
  if (QUESTIONS_SIMPLES.has(montage.brique)) {
    return poseDuDernierVerdict(verdicts, montage);
  }
  return [];
}

function posesDesProductions(montage: MontageIdentifie, contexte: ContexteDeReinjection): Pose[] {
  if (!PRODUCTIONS.has(montage.brique)) {
    return [];
  }
  return poseDuDernierVerdict(deGenre(contexte.retours, 'verdict-production'), montage);
}

function posesDuRappel(montage: MontageIdentifie, contexte: ContexteDeReinjection): Pose[] {
  if (montage.brique !== 'fp-spaced') {
    return [];
  }
  const questions =
    contexte.papier === null
      ? (deGenre(contexte.retours, 'rappels').at(-1)?.questions ?? null)
      : rappelImprime(contexte.papier);
  const servies = new Set((questions ?? []).map((question) => question.questionId));
  const annexe: Pose[] =
    contexte.role === 'presentateur' ? [] : [[PROPRIETE_FORMATEUR, annexeVisible(contexte)]];
  return [
    ...annexe,
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

function etapesDevoilees(contexte: ContexteDeReinjection): number {
  const pilotage = contexte.direct?.pilotage;
  const affichees = pilotage?.etayage ?? 0;
  return contexte.role === 'presentateur'
    ? affichees
    : Math.max(affichees, pilotage?.etayageAtteint ?? 0);
}

function posesDUneProductionEtayee(
  montage: MontageIdentifie,
  contexte: ContexteDeReinjection,
  genre: 'feuille-evaluee' | 'tableau-evalue',
): Pose[] {
  const pilotage = contexte.direct?.pilotage;
  const evaluation =
    contexte.role === 'presentateur'
      ? null
      : (deGenre(contexte.retours, genre)
          .filter((retour) => viseUnIdentifiant(montage.identifiants, retour.planId))
          .at(-1) ?? null);
  return [
    ['etayage', pilotage?.etayage ?? 0],
    ['saisieFermee', pilotage?.saisieFermee === true],
    ['evaluation', evaluation],
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
      return [['etayage', etapesDevoilees(contexte)]];
    case 'fp-sheet':
      return posesDUneProductionEtayee(montage, contexte, 'feuille-evaluee');
    case 'fp-table-build':
      return posesDUneProductionEtayee(montage, contexte, 'tableau-evalue');
    case 'fp-cardsort':
      return [['saisieFermee', pilotage?.saisieFermee === true]];
    case 'fp-recall':
      return [['optionsAffichees', pilotage?.optionsAffichees === true]];
    case 'fp-pulse':
      return [['comptes', contexte.direct?.comptesJalon ?? null]];
    case 'fp-concept4':
      return contexte.role === 'presentateur'
        ? [
            ['reglages', pilotage?.reglages ?? null],
            ['evaluee', pilotage?.sortiesProjetees ?? null],
          ]
        : [['evaluee', deGenre(contexte.retours, 'machine-evaluee').at(-1)?.sorties ?? null]];
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
    ? [['cloture', contexte.direct?.pilotage.saisieFermee === true || expliqueSurPlace(contexte)]]
    : [];
  return [
    ['dejaRepondu', dejaRepondu],
    ['erreur', refus?.message ?? null],
    ...cloture,
    ...formateur,
    ['explications', contexte.explications],
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
