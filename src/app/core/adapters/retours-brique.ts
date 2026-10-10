import type {
  DecomptesParCle,
  EtatParticipant,
  ResultatsSeance,
} from '../../../cours/content/types';
import type { RetourBrique } from '../../shared/slides/session/contrat-hote';
import type {
  MotifRefusReponse,
  VerdictProduction,
  VerdictReponse,
  VerdictTentative,
} from '../ports/formations.port';

type RetoursParEcran = ReadonlyMap<string, readonly RetourBrique[]>;

export function retourDeReponse(questionId: string, verdict: VerdictReponse): RetourBrique {
  return {
    kind: 'verdict-reponse',
    questionId,
    correcte: verdict.reussite,
    libelleConfusion: verdict.libelleConfusion,
  };
}

export function retourDeProduction(questionId: string, verdict: VerdictProduction): RetourBrique {
  return {
    kind: 'verdict-production',
    questionId,
    correcte: verdict.correcte,
    score: verdict.score,
    details: verdict.details,
  };
}

export function retourDeTentative(
  parcoursId: string,
  enigmeId: string,
  verdict: VerdictTentative,
): RetourBrique {
  return {
    kind: 'tentative',
    parcoursId,
    enigmeId,
    correcte: verdict.correcte,
    fragment: verdict.fragment,
    tentativesRestantes: verdict.tentativesRestantes,
  };
}

export function retourDeRefus(motif: MotifRefusReponse, message: string): RetourBrique {
  return { kind: 'refus', motif, message };
}

function retoursDesReponses(etat: EtatParticipant): { id: string; retours: RetourBrique[] }[] {
  return etat.reponses.map((reponse) => ({
    id: reponse.questionId,
    retours: [
      reponse.details === null
        ? retourDeReponse(reponse.questionId, {
            reussite: reponse.correcte,
            libelleConfusion: reponse.libelleConfusion,
          })
        : retourDeProduction(reponse.questionId, {
            correcte: reponse.correcte,
            score: reponse.score ?? 0,
            details: reponse.details,
            libelleConfusion: reponse.libelleConfusion,
          }),
      { kind: 'deja-repondu', questionId: reponse.questionId },
    ],
  }));
}

function retoursDesEnigmes(etat: EtatParticipant): { id: string; retours: RetourBrique[] }[] {
  return etat.enigmes.map((parcours) => ({
    id: parcours.parcoursId,
    retours: [
      {
        kind: 'progression-enigmes',
        parcoursId: parcours.parcoursId,
        resolues: parcours.resolues,
        tentativesRestantes: parcours.tentativesRestantes,
      },
    ],
  }));
}

export function ajouterRetours(
  existants: RetoursParEcran,
  screenId: string,
  nouveaux: readonly RetourBrique[],
): RetoursParEcran {
  if (nouveaux.length === 0) {
    return existants;
  }
  const suite = new Map(existants);
  suite.set(screenId, [...(existants.get(screenId) ?? []), ...nouveaux]);
  return suite;
}

export function retirerLesRefus(existants: RetoursParEcran, screenId: string): RetoursParEcran {
  const retours = existants.get(screenId) ?? [];
  if (!retours.some((retour) => retour.kind === 'refus')) {
    return existants;
  }
  const suite = new Map(existants);
  suite.set(
    screenId,
    retours.filter((retour) => retour.kind !== 'refus'),
  );
  return suite;
}

function verdictsDuRetour(retour: RetourBrique): readonly (readonly [string, boolean])[] {
  switch (retour.kind) {
    case 'verdict-reponse':
    case 'verdict-production':
      return [[retour.questionId, retour.correcte]];
    case 'tentative':
      return [[retour.enigmeId, retour.correcte]];
    case 'progression-enigmes': {
      const resolues = new Set(retour.resolues.map(({ enigmeId }) => enigmeId));
      const epuisees = Object.entries(retour.tentativesRestantes).flatMap(
        ([enigmeId, restantes]) =>
          restantes === 0 && !resolues.has(enigmeId) ? [[enigmeId, false] as const] : [],
      );
      return [...epuisees, ...[...resolues].map((enigmeId) => [enigmeId, true] as const)];
    }
    default:
      return [];
  }
}

export function verdictsDeLEcran(
  retours: readonly RetourBrique[],
): Readonly<Record<string, boolean>> {
  return Object.fromEntries(retours.flatMap(verdictsDuRetour));
}

export function reussitesDeLEcran(
  resultats: ResultatsSeance | null,
  ecranId: string | null,
): DecomptesParCle {
  return Object.fromEntries(
    (resultats?.questions ?? [])
      .filter((question) => question.ecranId === ecranId && question.total > 0)
      .map(({ questionId, correctes, total }) => [questionId, { justes: correctes, total }]),
  );
}

export function retoursDeLEtat(
  etat: EtatParticipant,
  ecranDe: (identifiant: string) => string | null,
): RetoursParEcran {
  let retours: RetoursParEcran = new Map();
  for (const { id, retours: lot } of [...retoursDesReponses(etat), ...retoursDesEnigmes(etat)]) {
    const screenId = ecranDe(id);
    if (screenId !== null) {
      retours = ajouterRetours(retours, screenId, lot);
    }
  }
  return retours;
}
