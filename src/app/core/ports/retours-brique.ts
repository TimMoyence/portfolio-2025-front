import type { EtatParticipant, ResultatsSeance } from '../../../cours/content/types';
import type { ReussiteDeLaClasse } from '../../shared/slides/layouts/slide-answer-review/slide-answer-review.component';
import type { RetourBrique } from '../../shared/slides/session/contrat-hote';
import type {
  MotifRefusReponse,
  VerdictProduction,
  VerdictReponse,
  VerdictTentative,
} from './formations.port';

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
        ? {
            kind: 'verdict-reponse',
            questionId: reponse.questionId,
            correcte: reponse.correcte,
            libelleConfusion: reponse.libelleConfusion,
          }
        : {
            kind: 'verdict-production',
            questionId: reponse.questionId,
            correcte: reponse.correcte,
            score: reponse.score ?? 0,
            details: reponse.details,
          },
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

export function verdictsDeLEcran(
  retours: readonly RetourBrique[],
): Readonly<Record<string, boolean>> {
  return Object.fromEntries(
    retours.flatMap((retour) =>
      retour.kind === 'verdict-reponse' || retour.kind === 'verdict-production'
        ? [[retour.questionId, retour.correcte]]
        : [],
    ),
  );
}

export function reussitesDeLEcran(
  resultats: ResultatsSeance | null,
  ecranId: string | null,
): Readonly<Record<string, ReussiteDeLaClasse>> {
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
