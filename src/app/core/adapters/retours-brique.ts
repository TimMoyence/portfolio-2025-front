import type {
  DecomptesParCle,
  EtatParticipant,
  ResultatsSeance,
} from '../../../cours/content/types';
import type {
  MotifRefusReponse,
  RetourBrique,
  VerdictProduction,
  VerdictReponse,
  VerdictTentative,
} from '../ports/formations.port';

type RetoursParEcran = ReadonlyMap<string, readonly RetourBrique[]>;

export function retourDeReponse(questionId: string, verdict: VerdictReponse): RetourBrique | null {
  if (verdict.reussite === null) {
    return null;
  }
  return {
    kind: 'verdict-reponse',
    questionId,
    correcte: verdict.reussite,
    libelleConfusion: verdict.libelleConfusion,
  };
}

export function retourDeProduction(
  questionId: string,
  verdict: VerdictProduction,
  envoyee: EtatParticipant['reponses'][number]['valeur'],
): RetourBrique {
  const neSaitPas = typeof envoyee === 'object' && 'neSaitPas' in envoyee;
  return {
    kind: 'verdict-production',
    questionId,
    correcte: verdict.correcte,
    score: verdict.score,
    details: neSaitPas ? [] : verdict.details,
    neSaitPas,
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
    etats: verdict.etats,
    enigmeOuverte: verdict.enigmeOuverte,
    acheve: verdict.acheve,
  };
}

export function retourDeRefus(motif: MotifRefusReponse, message: string): RetourBrique {
  return { kind: 'refus', motif, message };
}

function verdictRepris(reponse: EtatParticipant['reponses'][number]): readonly RetourBrique[] {
  const { questionId, correcte, details, libelleConfusion } = reponse;
  if (details === null) {
    const retour = retourDeReponse(questionId, { reussite: correcte, libelleConfusion });
    return retour === null ? [] : [retour];
  }
  if (correcte === null) {
    return [];
  }
  return [
    retourDeProduction(
      questionId,
      { correcte, score: reponse.score ?? 0, details, libelleConfusion },
      reponse.valeur,
    ),
  ];
}

function retoursDesReponses(etat: EtatParticipant): { id: string; retours: RetourBrique[] }[] {
  return etat.reponses.map((reponse) => ({
    id: reponse.questionId,
    retours: [...verdictRepris(reponse), { kind: 'deja-repondu', questionId: reponse.questionId }],
  }));
}

function retoursDesEnigmes(etat: EtatParticipant): { id: string; retours: RetourBrique[] }[] {
  return etat.enigmes.map((parcours) => ({
    id: parcours.parcoursId,
    retours: [{ kind: 'progression-enigmes', ...parcours }],
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

export function remplacerRetour(
  existants: RetoursParEcran,
  screenId: string,
  nouveau: RetourBrique,
): RetoursParEcran {
  const suite = new Map(existants);
  suite.set(screenId, [
    ...(existants.get(screenId) ?? []).filter((retour) => retour.kind !== nouveau.kind),
    nouveau,
  ]);
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
    case 'progression-enigmes':
      return Object.entries(retour.etats).flatMap(
        ([enigmeId, { etat }]): (readonly [string, boolean])[] =>
          etat === 'resolue' || etat === 'epuisee' ? [[enigmeId, etat === 'resolue']] : [],
      );
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

export function questionsAuVerdictRetenu(etat: EtatParticipant): readonly string[] {
  return etat.reponses
    .filter(({ correcte }) => correcte === null)
    .map(({ questionId }) => questionId);
}

export function verdictsServis(
  etat: EtatParticipant,
  retenues: ReadonlySet<string>,
  ecranDe: (identifiant: string) => string | null,
): { readonly servies: readonly string[]; readonly retours: RetoursParEcran } {
  const reponses = etat.reponses.filter(
    ({ questionId, correcte }) => correcte !== null && retenues.has(questionId),
  );
  let retours: RetoursParEcran = new Map();
  for (const reponse of reponses) {
    const screenId = ecranDe(reponse.questionId);
    if (screenId !== null) {
      retours = ajouterRetours(retours, screenId, verdictRepris(reponse));
    }
  }
  return { servies: reponses.map(({ questionId }) => questionId), retours };
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
