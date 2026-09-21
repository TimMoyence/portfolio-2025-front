import type { RenderMode, ResultatQuestion, Role } from '../../../../cours/content/types';
import { PROPRIETE_FORMATEUR } from '../../../../cours/runtime/blocks/retours';
import type { SyntheseConcept } from '../../../core/ports/formations.port';
import type { DirectEcran, RetourBrique } from './contrat-hote';
import type { Montage } from './lecture-ecran';

export interface MontageIdentifie extends Montage {
  readonly identifiants: readonly string[];
}

export interface ContexteDeReinjection {
  readonly retours: readonly RetourBrique[];
  readonly direct: DirectEcran | null;
  readonly render: RenderMode;
  readonly role: Role;
  readonly donneesFormateur: unknown;
  readonly maitrise: readonly SyntheseConcept[] | null;
  readonly dernierEmetteur: boolean;
}

export type Pose = readonly [propriete: string, valeur: unknown];

type Genre<K extends RetourBrique['kind']> = Extract<RetourBrique, { kind: K }>;

const QUESTIONS_SIMPLES: ReadonlySet<string> = new Set(['fp-numeric', 'fp-recall', 'fp-exit']);
const PRODUCTIONS: ReadonlySet<string> = new Set(['fp-sheet', 'fp-table-build', 'fp-cardsort']);
const LECTRICES_DU_FORMATEUR: ReadonlySet<string> = new Set([
  ...PRODUCTIONS,
  'fp-vote',
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

function resultatsDuVote(
  montage: MontageIdentifie,
  direct: DirectEcran | null,
): { total: number; parOption: Readonly<Record<string, number>> } | null {
  const identifiant = questionAffichee(montage, direct);
  const resultat: ResultatQuestion | undefined = direct?.resultats?.find(
    (question) => question.questionId === identifiant,
  );
  return resultat === undefined
    ? null
    : { total: resultat.total, parOption: resultat.parOption ?? {} };
}

function donneesFormateurVisibles(contexte: ContexteDeReinjection): unknown {
  if (contexte.role !== 'presentateur') {
    return null;
  }
  const pilotage = contexte.direct?.pilotage;
  const revele = pilotage?.phase === 'revele' || pilotage?.revele === true;
  return contexte.render === 'board' || (contexte.render === 'stage' && revele)
    ? contexte.donneesFormateur
    : null;
}

function posesDesQuestions(montage: MontageIdentifie, contexte: ContexteDeReinjection): Pose[] {
  const verdicts = deGenre(contexte.retours, 'verdict-reponse');
  if (montage.brique === 'fp-vote') {
    return [
      [
        'verdicts',
        verdicts.filter((verdict) => viseUnIdentifiant(montage.identifiants, verdict.questionId)),
      ],
      ['phase', contexte.direct?.pilotage.phase ?? null],
      ['resultats', resultatsDuVote(montage, contexte.direct)],
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
      return pilotage?.etayage === undefined ? [] : [['etayage', pilotage.etayage]];
    case 'fp-pulse':
      return [['comptes', contexte.direct?.comptesJalon ?? null]];
    default:
      return [];
  }
}

function posesCommunes(montage: MontageIdentifie, contexte: ContexteDeReinjection): Pose[] {
  const dejaRepondu = deGenre(contexte.retours, 'deja-repondu').some((retour) =>
    viseUnIdentifiant(montage.identifiants, retour.questionId),
  );
  const refus = contexte.dernierEmetteur ? deGenre(contexte.retours, 'refus').at(-1) : undefined;
  const formateur: Pose[] = LECTRICES_DU_FORMATEUR.has(montage.brique)
    ? [[PROPRIETE_FORMATEUR, donneesFormateurVisibles(contexte)]]
    : [];
  return [['dejaRepondu', dejaRepondu], ['erreur', refus?.message ?? null], ...formateur];
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
  return Object.is(gauche, droite);
}
