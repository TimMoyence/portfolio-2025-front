import { zSubmitAnswerRequestDto } from '../../../../../contrat/zod.gen';
import { ETATS_PULSE, type ValeurProduction } from '../../../../cours/content/types';
import { lireTextes } from '../../../../cours/runtime/blocks/retours';
import {
  estChaineNonVide,
  estEntierPositif,
  estMembre,
  estNombreFini,
  estObjet,
  estTexteNonVide,
  objet,
} from '../../../../cours/runtime/core/valeurs';
import type { EvenementBrique } from './contrat-hote';

type Detail = Readonly<Record<string, unknown>>;

type TypeDeProduction = 'feuille' | 'tableau' | 'classement';

const PRODUCTIONS: Readonly<Record<string, { type: TypeDeProduction; champ: string }>> = {
  'fp-sheet-submit': { type: 'feuille', champ: 'cellules' },
  'fp-table-build-submit': { type: 'tableau', champ: 'saisies' },
  'fp-cardsort-submit': { type: 'classement', champ: 'classement' },
};

export const EVENEMENTS_DES_BRIQUES: readonly string[] = [
  'fp-numeric-submit',
  'fp-vote-submit',
  'fp-recall-submit',
  'fp-spaced-reponse',
  'fp-sheet-submit',
  'fp-sheet-evaluation',
  'fp-table-build-submit',
  'fp-table-build-evaluation',
  'fp-cardsort-submit',
  'fp-escape-tentative',
  'fp-pulse-change',
  'fp-challenge-submit',
  'fp-worked-submit',
  'fp-pro-submit',
  'fp-concept4-reglage',
  'fp-concept4-evaluation',
  'fp-plot-reglage',
];

const DUREE_MAX_MS = zSubmitAnswerRequestDto.shape.dureeMs.maxValue ?? Number.MAX_SAFE_INTEGER;

function duree(detail: Detail): number | null {
  const dureeMs = detail['dureeMs'];
  return estEntierPositif(dureeMs) ? Math.min(dureeMs, DUREE_MAX_MS) : null;
}

function estValeurDeReponse(valeur: unknown): valeur is number | string {
  return typeof valeur === 'string' || estNombreFini(valeur);
}

function reponse(
  screenId: string,
  questionId: unknown,
  valeur: unknown,
  dureeMs: number,
): EvenementBrique[] {
  return estChaineNonVide(questionId) && estValeurDeReponse(valeur)
    ? [{ kind: 'reponse', screenId, questionId, valeur, dureeMs }]
    : [];
}

function libre(
  screenId: string,
  activityId: string,
  texte: unknown,
  dureeMs: number,
): EvenementBrique[] {
  return estTexteNonVide(texte)
    ? [{ kind: 'libre', screenId, activityId, response: texte, dureeMs }]
    : [];
}

function estTexte(valeur: unknown): valeur is string {
  return typeof valeur === 'string';
}

function cellulesDuTableau<Valeur>(
  contenu: unknown,
  champ: string,
  estValeur: (valeur: unknown) => valeur is Valeur,
): (readonly [number, string, Valeur])[] | null {
  if (!Array.isArray(contenu)) {
    return null;
  }
  return contenu.map(objet).flatMap((cellule) => {
    const rang = cellule?.['rang'];
    const cle = cellule?.['cle'];
    const valeur = cellule?.[champ];
    return estEntierPositif(rang) && estChaineNonVide(cle) && estValeur(valeur)
      ? [[rang, cle, valeur] as const]
      : [];
  });
}

function champsTextuels(valeur: unknown): readonly [string, string][] {
  return Object.entries(objet(valeur) ?? {}).filter((entree): entree is [string, string] =>
    estTexteNonVide(entree[1]),
  );
}

function valeurDeProduction(
  type: TypeDeProduction,
  champ: string,
  detail: Detail,
): ValeurProduction | null {
  if (detail['neSaitPas'] === true) {
    return { type, neSaitPas: true };
  }
  const contenu = detail[champ];
  if (type === 'tableau') {
    const valides = (cellulesDuTableau(contenu, 'valeur', estNombreFini) ?? []).map(
      ([rang, cle, valeur]) => ({ rang, cle, valeur }),
    );
    return valides.length > 0 ? { type, saisies: valides } : null;
  }
  if (!estObjet(contenu)) {
    return null;
  }
  const textes = lireTextes(contenu);
  return type === 'feuille' ? { type, cellules: textes } : { type, classement: textes };
}

function production(
  screenId: string,
  nom: string,
  detail: Detail,
  dureeMs: number,
): EvenementBrique[] {
  const forme = PRODUCTIONS[nom];
  const questionId = detail['planId'];
  const valeur = valeurDeProduction(forme.type, forme.champ, detail);
  return estChaineNonVide(questionId) && valeur !== null
    ? [{ kind: 'production', screenId, questionId, valeur, dureeMs }]
    : [];
}

function redactions(screenId: string, detail: Detail, dureeMs: number): EvenementBrique[] {
  const exempleId = detail['exempleId'];
  if (!estChaineNonVide(exempleId)) {
    return [];
  }
  return champsTextuels(detail['redactions']).flatMap(([etape, texte]) =>
    libre(screenId, `${exempleId}:${etape}`, texte, dureeMs),
  );
}

function reglage(
  kind: 'reglage' | 'evaluation-machine',
  screenId: string,
  detail: Detail,
): EvenementBrique[] {
  const reglages = objet(detail['reglages']);
  if (reglages === null) {
    return [];
  }
  const valeurs = Object.entries(reglages);
  return valeurs.length > 0 && valeurs.every(([, valeur]) => estNombreFini(valeur))
    ? [{ kind, screenId, reglages: reglages as Readonly<Record<string, number>> }]
    : [];
}

function evaluationDeFeuille(screenId: string, detail: Detail): EvenementBrique[] {
  const { planId, rang, recopie } = detail;
  const cellules = objet(detail['cellules']);
  if (!estChaineNonVide(planId) || !estEntierPositif(rang) || cellules === null) {
    return [];
  }
  const evaluation = { kind: 'evaluation-feuille', screenId, planId, rang } as const;
  if (recopie === undefined) {
    return [{ ...evaluation, demande: { cellules: lireTextes(cellules) } }];
  }
  const de = objet(recopie)?.['de'];
  return estChaineNonVide(de)
    ? [{ ...evaluation, demande: { cellules: lireTextes(cellules), recopie: { de } } }]
    : [];
}

function evaluationDeTableau(screenId: string, detail: Detail): EvenementBrique[] {
  const { planId, rang } = detail;
  const saisies = cellulesDuTableau(detail['saisies'], 'saisie', estTexte);
  return estChaineNonVide(planId) && estEntierPositif(rang) && saisies !== null
    ? [
        {
          kind: 'evaluation-tableau',
          screenId,
          planId,
          rang,
          saisies: saisies.map(([ligne, cle, saisie]) => ({ rang: ligne, cle, saisie })),
        },
      ]
    : [];
}

function reponsesDuCas(screenId: string, detail: Detail, dureeMs: number): EvenementBrique[] {
  if (!estChaineNonVide(detail['casId'])) {
    return [];
  }
  return champsTextuels(detail['reponses']).flatMap(([questionId, texte]) =>
    libre(screenId, questionId, texte, dureeMs),
  );
}

function tentative(screenId: string, detail: Detail, dureeMs: number): EvenementBrique[] {
  const { parcoursId, enigmeId, reponse: saisie } = detail;
  return estChaineNonVide(parcoursId) && estChaineNonVide(enigmeId) && estTexteNonVide(saisie)
    ? [{ kind: 'tentative', screenId, parcoursId, enigmeId, reponse: saisie, dureeMs }]
    : [];
}

function jalon(screenId: string, detail: Detail): EvenementBrique[] {
  const sondageId = detail['sondageId'];
  const etat = detail['etat'];
  return estChaineNonVide(sondageId) && estMembre(ETATS_PULSE, etat)
    ? [{ kind: 'jalon', screenId, sondageId, etat }]
    : [];
}

function defi(screenId: string, detail: Detail, dureeMs: number): EvenementBrique[] {
  const defiId = detail['problemeId'];
  const texte = detail['tentative'];
  return estChaineNonVide(defiId) && estTexteNonVide(texte)
    ? [{ kind: 'defi', screenId, defiId, texte, dureeMs }]
    : [];
}

function selon(nom: string, screenId: string, detail: Detail, dureeMs: number): EvenementBrique[] {
  switch (nom) {
    case 'fp-numeric-submit':
    case 'fp-vote-submit':
      return reponse(screenId, detail['questionId'], detail['valeur'], dureeMs);
    case 'fp-recall-submit':
      return [
        ...reponse(screenId, detail['questionId'], detail['valeur'], dureeMs),
        ...libre(screenId, `${String(detail['questionId'])}:rappel`, detail['rappel'], dureeMs),
      ];
    case 'fp-spaced-reponse':
      return reponse(screenId, detail['questionId'], detail['optionId'], dureeMs);
    case 'fp-escape-tentative':
      return tentative(screenId, detail, dureeMs);
    case 'fp-challenge-submit':
      return defi(screenId, detail, dureeMs);
    case 'fp-worked-submit':
      return redactions(screenId, detail, dureeMs);
    case 'fp-pro-submit':
      return reponsesDuCas(screenId, detail, dureeMs);
    default:
      return Object.hasOwn(PRODUCTIONS, nom) ? production(screenId, nom, detail, dureeMs) : [];
  }
}

export function evenementsDe(nom: string, brut: unknown, screenId: string): EvenementBrique[] {
  const detail = objet(brut);
  if (detail === null) {
    return [];
  }
  if (nom === 'fp-pulse-change') {
    return jalon(screenId, detail);
  }
  if (nom === 'fp-concept4-reglage' || nom === 'fp-plot-reglage') {
    return reglage('reglage', screenId, detail);
  }
  if (nom === 'fp-concept4-evaluation') {
    return reglage('evaluation-machine', screenId, detail);
  }
  if (nom === 'fp-sheet-evaluation') {
    return evaluationDeFeuille(screenId, detail);
  }
  if (nom === 'fp-table-build-evaluation') {
    return evaluationDeTableau(screenId, detail);
  }
  const dureeMs = duree(detail);
  return dureeMs === null ? [] : selon(nom, screenId, detail, dureeMs);
}
