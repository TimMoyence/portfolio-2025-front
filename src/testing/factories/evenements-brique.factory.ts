const DUREE_MS = 1200;

const DETAILS: Readonly<Partial<Record<string, Readonly<Record<string, unknown>>>>> = {
  'fp-numeric-submit': { questionId: 'Q-VA-07', valeur: 1480.24, dureeMs: DUREE_MS },
  'fp-vote-submit': { questionId: 'Q-CAP-03', valeur: 'b', dureeMs: DUREE_MS },
  'fp-recall-submit': {
    questionId: 'Q-RAPPEL-04',
    valeur: 'a',
    rappel: 'On capitalise chaque annee',
    dureeMs: DUREE_MS,
  },
  'fp-exit-submit': {
    billetId: 'B-SORTIE-09',
    valeur: 'a',
    texteLibre: 'Le passage au taux mensuel reste flou',
    dureeMs: DUREE_MS,
  },
  'fp-spaced-reponse': { questionId: 'Q-ACT-01', optionId: 'act-a', dureeMs: DUREE_MS },
  'fp-sheet-submit': { planId: 'K-TABLEUR-01', cellules: { C3: '=A3*B3' }, dureeMs: DUREE_MS },
  'fp-table-build-submit': {
    planId: 'b2-01-a4-indice-toile',
    saisies: [{ rang: 0, cle: 'prix', valeur: 21.6 }],
    dureeMs: DUREE_MS,
  },
  'fp-cardsort-submit': {
    planId: 'K-CHARGES-01',
    classement: { loyer: 'fixe' },
    dureeMs: DUREE_MS,
  },
  'fp-escape-tentative': {
    parcoursId: 'K-EVASION-01',
    enigmeId: 'seuil',
    reponse: '30000',
    dureeMs: DUREE_MS,
  },
  'fp-pulse-change': { sondageId: 'P-PULSE-01', etat: 'perdu', dureeMs: 0 },
  'fp-challenge-submit': {
    problemeId: 'D-DEFI-07',
    tentative: 'Une dizaine d annees a vue de nez',
    dureeMs: DUREE_MS,
  },
  'fp-worked-submit': {
    exempleId: 'E-CAP-01',
    redactions: { 'etape-2': 'Je multiplie par 1,04' },
    explications: { 'etape-2': 'Le taux s applique au capital augmente' },
    dureeMs: DUREE_MS,
  },
};

export function buildDetailDeBrique(
  evenement: string,
  overrides: Readonly<Record<string, unknown>> = {},
): Record<string, unknown> {
  const detail = DETAILS[evenement];
  if (detail === undefined) {
    throw new Error(`aucun detail type pour ${evenement}`);
  }
  return { ...detail, ...overrides };
}
