import type { EtatPulse, ValeurProduction } from '../../../../cours/content/types';
import type { EvenementBrique } from './contrat-hote';
import { objet } from '../visual/presentation-v2';

type Detail = Readonly<Record<string, unknown>>;

type TypeDeProduction = 'feuille' | 'tableau' | 'classement';

const ETATS_PULSE: readonly EtatPulse[] = ['perdu', 'ca-va', 'clair'];

const PRODUCTIONS: Readonly<Record<string, { type: TypeDeProduction; champ: string }>> = {
  'fp-sheet-submit': { type: 'feuille', champ: 'cellules' },
  'fp-table-build-submit': { type: 'tableau', champ: 'saisies' },
  'fp-cardsort-submit': { type: 'classement', champ: 'classement' },
};

export const EVENEMENTS_DES_BRIQUES: readonly string[] = [
  'fp-numeric-submit',
  'fp-vote-submit',
  'fp-recall-submit',
  'fp-exit-submit',
  'fp-spaced-reponse',
  'fp-sheet-submit',
  'fp-table-build-submit',
  'fp-cardsort-submit',
  'fp-escape-tentative',
  'fp-pulse-change',
  'fp-challenge-submit',
  'fp-worked-submit',
];

function texteNonVide(valeur: unknown): valeur is string {
  return typeof valeur === 'string' && valeur.trim().length > 0;
}

function identifiant(valeur: unknown): valeur is string {
  return typeof valeur === 'string' && valeur !== '';
}

function duree(detail: Detail): number | null {
  const dureeMs = detail['dureeMs'];
  return typeof dureeMs === 'number' && Number.isInteger(dureeMs) && dureeMs >= 0 ? dureeMs : null;
}

function estValeurDeReponse(valeur: unknown): valeur is number | string {
  return typeof valeur === 'string' || (typeof valeur === 'number' && Number.isFinite(valeur));
}

function reponse(
  screenId: string,
  questionId: unknown,
  valeur: unknown,
  dureeMs: number,
): EvenementBrique[] {
  return identifiant(questionId) && estValeurDeReponse(valeur)
    ? [{ kind: 'reponse', screenId, questionId, valeur, dureeMs }]
    : [];
}

function libre(
  screenId: string,
  activityId: string,
  texte: unknown,
  dureeMs: number,
): EvenementBrique[] {
  return texteNonVide(texte)
    ? [{ kind: 'libre', screenId, activityId, response: texte, dureeMs }]
    : [];
}

function champsTextuels(valeur: unknown): readonly [string, string][] {
  return Object.entries(objet(valeur) ?? {}).filter((entree): entree is [string, string] =>
    texteNonVide(entree[1]),
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
    const saisies = Array.isArray(contenu) ? contenu.map(objet) : [];
    const valides = saisies.flatMap((saisie) =>
      saisie !== null &&
      typeof saisie['rang'] === 'number' &&
      typeof saisie['cle'] === 'string' &&
      typeof saisie['valeur'] === 'number' &&
      Number.isFinite(saisie['valeur'])
        ? [{ rang: saisie['rang'], cle: saisie['cle'], valeur: saisie['valeur'] }]
        : [],
    );
    return valides.length > 0 ? { type, saisies: valides } : null;
  }
  const dictionnaire = objet(contenu);
  if (dictionnaire === null) {
    return null;
  }
  const textes = Object.fromEntries(
    Object.entries(dictionnaire).filter(
      (entree): entree is [string, string] => typeof entree[1] === 'string',
    ),
  );
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
  return identifiant(questionId) && valeur !== null
    ? [{ kind: 'production', screenId, questionId, valeur, dureeMs }]
    : [];
}

function redactions(screenId: string, detail: Detail, dureeMs: number): EvenementBrique[] {
  const exempleId = detail['exempleId'];
  if (!identifiant(exempleId)) {
    return [];
  }
  return [
    ...champsTextuels(detail['redactions']).flatMap(([etape, texte]) =>
      libre(screenId, `${exempleId}:${etape}`, texte, dureeMs),
    ),
    ...champsTextuels(detail['explications']).flatMap(([etape, texte]) =>
      libre(screenId, `${exempleId}:${etape}:pourquoi`, texte, dureeMs),
    ),
  ];
}

function tentative(screenId: string, detail: Detail, dureeMs: number): EvenementBrique[] {
  const { parcoursId, enigmeId, reponse: saisie } = detail;
  return identifiant(parcoursId) && identifiant(enigmeId) && texteNonVide(saisie)
    ? [{ kind: 'tentative', screenId, parcoursId, enigmeId, reponse: saisie, dureeMs }]
    : [];
}

function jalon(screenId: string, detail: Detail): EvenementBrique[] {
  const sondageId = detail['sondageId'];
  const etat = ETATS_PULSE.find((connu) => connu === detail['etat']);
  return identifiant(sondageId) && etat !== undefined
    ? [{ kind: 'jalon', screenId, sondageId, etat }]
    : [];
}

function defi(screenId: string, detail: Detail, dureeMs: number): EvenementBrique[] {
  const defiId = detail['problemeId'];
  const texte = detail['tentative'];
  return identifiant(defiId) && texteNonVide(texte)
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
    case 'fp-exit-submit':
      return [
        ...reponse(screenId, detail['billetId'], detail['valeur'], dureeMs),
        ...libre(screenId, String(detail['billetId']), detail['texteLibre'], dureeMs),
      ];
    case 'fp-spaced-reponse':
      return reponse(screenId, detail['questionId'], detail['optionId'], dureeMs);
    case 'fp-escape-tentative':
      return tentative(screenId, detail, dureeMs);
    case 'fp-challenge-submit':
      return defi(screenId, detail, dureeMs);
    case 'fp-worked-submit':
      return redactions(screenId, detail, dureeMs);
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
  const dureeMs = duree(detail);
  return dureeMs === null ? [] : selon(nom, screenId, detail, dureeMs);
}
