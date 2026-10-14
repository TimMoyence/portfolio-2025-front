import type { RetourBrique } from '../ports/formations.port';
import {
  buildEtatParticipant,
  buildResultatQuestion,
  buildResultatsSeance,
} from '../../../testing/factories/formations.factory';
import {
  ajouterRetours,
  questionsAuVerdictRetenu,
  retirerLesRefus,
  retourDeProduction,
  retourDeRefus,
  retourDeReponse,
  retourDeTentative,
  retoursDeLEtat,
  reussitesDeLEcran,
  verdictsDeLEcran,
  verdictsServis,
} from './retours-brique';

const QUESTION = 'b2-01-a4-feuille-canaux';
const PRODUCTION = 'b2-01-a4-tableau-canaux';
const PARCOURS = 'b2-01-a6-coffre';
const ECRAN = 'B2-01-A4-02-FEUILLE-CANAUX';

const DETAIL = { cle: 'E3', juste: false, libelleConfusion: 'Base de départ oubliée' };
const FEUILLE_ENVOYEE = { type: 'feuille', cellules: { E3: '=E2*1,05' } } as const;
const NE_SAIT_PAS = { type: 'feuille', neSaitPas: true } as const;
const VERDICT_DU_NE_SAIT_PAS = {
  correcte: false,
  score: 0,
  details: [
    { cle: 'E3', juste: false, libelleConfusion: null },
    { cle: 'E4', juste: false, libelleConfusion: null },
  ],
  libelleConfusion: null,
};

function reponseServie(overrides: Record<string, unknown> = {}) {
  return {
    questionId: QUESTION,
    valeur: 0.2,
    correcte: true,
    score: null,
    details: null,
    libelleConfusion: null,
    ...overrides,
  };
}

describe('traduction des verdicts du serveur en retours de brique', () => {
  it('traduit un verdict de réponse sans inventer de détail', () => {
    expect(
      retourDeReponse(QUESTION, { reussite: false, libelleConfusion: 'Taux annuel divisé par 12' }),
    ).toEqual({
      kind: 'verdict-reponse',
      questionId: QUESTION,
      correcte: false,
      libelleConfusion: 'Taux annuel divisé par 12',
    });
  });

  it('QA-12 · ne fait aucun retour d’une réponse dont le serveur retient encore le verdict', () => {
    expect(retourDeReponse(QUESTION, { reussite: null, libelleConfusion: null })).toBeNull();
  });

  it('traduit un verdict de production avec son score et ses détails', () => {
    expect(
      retourDeProduction(
        PRODUCTION,
        {
          correcte: false,
          score: 0.5,
          details: [DETAIL],
          libelleConfusion: 'Base de départ oubliée',
        },
        FEUILLE_ENVOYEE,
      ),
    ).toEqual({
      kind: 'verdict-production',
      questionId: PRODUCTION,
      correcte: false,
      score: 0.5,
      details: [DETAIL],
      neSaitPas: false,
    });
  });

  it('QA-06 · fait d’un « je ne sais pas » envoyé un verdict à zéro qui ne marque aucune case', () => {
    expect(retourDeProduction(PRODUCTION, VERDICT_DU_NE_SAIT_PAS, NE_SAIT_PAS)).toEqual({
      kind: 'verdict-production',
      questionId: PRODUCTION,
      correcte: false,
      score: 0,
      details: [],
      neSaitPas: true,
    });
  });

  it('traduit une tentative d’énigme avec son fragment et son reste', () => {
    expect(
      retourDeTentative(PARCOURS, 'enigme-1', {
        correcte: true,
        fragment: '7',
        tentativesRestantes: 9,
      }),
    ).toEqual({
      kind: 'tentative',
      parcoursId: PARCOURS,
      enigmeId: 'enigme-1',
      correcte: true,
      fragment: '7',
      tentativesRestantes: 9,
    });
  });

  it('porte le motif et le message d’un refus', () => {
    expect(retourDeRefus('tentatives-epuisees', 'Plus de tentative.')).toEqual({
      kind: 'refus',
      motif: 'tentatives-epuisees',
      message: 'Plus de tentative.',
    });
  });
});

describe('accumulation des retours par écran', () => {
  const verdict: RetourBrique = {
    kind: 'verdict-reponse',
    questionId: QUESTION,
    correcte: true,
    libelleConfusion: null,
  };
  const refus: RetourBrique = { kind: 'refus', motif: 'reseau', message: 'Coupure.' };

  it('rend la même carte, sans copie, quand il n’y a rien à ajouter', () => {
    const existants = new Map([[ECRAN, [verdict]]]);

    expect(ajouterRetours(existants, ECRAN, [])).toBe(existants);
  });

  it('empile les nouveaux retours derrière les anciens sans muter l’ancienne carte', () => {
    const existants = new Map([[ECRAN, [verdict]]]);

    const suite = ajouterRetours(existants, ECRAN, [refus]);

    expect(suite.get(ECRAN)).toEqual([verdict, refus]);
    expect(existants.get(ECRAN)).toEqual([verdict]);
  });

  it('crée l’entrée d’un écran encore inconnu', () => {
    expect(ajouterRetours(new Map(), ECRAN, [refus]).get(ECRAN)).toEqual([refus]);
  });

  it('rend l’objet identique quand l’écran ne porte aucun refus à retirer', () => {
    const existants = new Map([[ECRAN, [verdict]]]);

    expect(retirerLesRefus(existants, ECRAN)).toBe(existants);
    expect(retirerLesRefus(existants, 'ecran-inconnu')).toBe(existants);
  });

  it('retire les refus et ne garde que les verdicts', () => {
    const existants = new Map([[ECRAN, [verdict, refus]]]);

    const suite = retirerLesRefus(existants, ECRAN);

    expect(suite).not.toBe(existants);
    expect(suite.get(ECRAN)).toEqual([verdict]);
    expect(existants.get(ECRAN)).toEqual([verdict, refus]);
  });
});

describe('AC-33 : reconstruction des retours à la reprise', () => {
  const ecranDe = (identifiant: string): string | null =>
    identifiant === 'hors-deck' ? null : `ecran-de-${identifiant}`;

  const productionReprise = (overrides: Record<string, unknown>): RetourBrique | undefined => {
    const etat = buildEtatParticipant({
      reponses: [reponseServie({ questionId: PRODUCTION, ...overrides })],
    });
    return retours(retoursDeLEtat(etat, ecranDe), `ecran-de-${PRODUCTION}`).at(0);
  };

  it('fait d’une réponse sans détail un verdict de réponse, et d’une réponse détaillée une production', () => {
    const etat = buildEtatParticipant({
      reponses: [
        reponseServie({ libelleConfusion: 'Confusion A' }),
        reponseServie({
          questionId: PRODUCTION,
          correcte: false,
          score: 0.5,
          details: [DETAIL],
          libelleConfusion: null,
        }),
      ],
    });

    const retours = retoursDeLEtat(etat, ecranDe);

    expect(retours.get(`ecran-de-${QUESTION}`)).toEqual([
      {
        kind: 'verdict-reponse',
        questionId: QUESTION,
        correcte: true,
        libelleConfusion: 'Confusion A',
      },
      { kind: 'deja-repondu', questionId: QUESTION },
    ]);
    expect(retours.get(`ecran-de-${PRODUCTION}`)).toEqual([
      {
        kind: 'verdict-production',
        questionId: PRODUCTION,
        correcte: false,
        score: 0.5,
        details: [DETAIL],
        neSaitPas: false,
      },
      { kind: 'deja-repondu', questionId: PRODUCTION },
    ]);
  });

  it('QA-06 · reprend un « je ne sais pas » à une production comme le verdict envoyé en direct', () => {
    const production = productionReprise({ valeur: NE_SAIT_PAS, ...VERDICT_DU_NE_SAIT_PAS });

    expect(production).toEqual(retourDeProduction(PRODUCTION, VERDICT_DU_NE_SAIT_PAS, NE_SAIT_PAS));
    expect(production).toEqual(
      jasmine.objectContaining({ kind: 'verdict-production', details: [], neSaitPas: true }),
    );
  });

  it('QA-12 · ne reprend d’une réponse au verdict retenu que sa marque « déjà répondu »', () => {
    const etat = buildEtatParticipant({
      reponses: [reponseServie({ correcte: null, libelleConfusion: null })],
    });

    expect(retoursDeLEtat(etat, ecranDe).get(`ecran-de-${QUESTION}`)).toEqual([
      { kind: 'deja-repondu', questionId: QUESTION },
    ]);
  });

  it('QA-12 · nomme les seules réponses dont le serveur retient encore le verdict', () => {
    const etat = buildEtatParticipant({
      reponses: [
        reponseServie({ correcte: null, libelleConfusion: null }),
        reponseServie({ questionId: PRODUCTION, correcte: false }),
      ],
    });

    expect(questionsAuVerdictRetenu(etat)).toEqual([QUESTION]);
  });

  it('QA-12 · ne pose que le verdict désormais servi d’une réponse retenue, sans autre marque', () => {
    const etat = buildEtatParticipant({
      reponses: [
        reponseServie({ correcte: false, libelleConfusion: 'Taux annuel divisé par 12' }),
        reponseServie({ questionId: PRODUCTION, correcte: true }),
        reponseServie({ questionId: PARCOURS, correcte: null }),
      ],
    });

    const { servies, retours } = verdictsServis(etat, new Set([QUESTION, PARCOURS]), ecranDe);

    expect(servies).toEqual([QUESTION]);
    expect([...retours]).toEqual([
      [
        `ecran-de-${QUESTION}`,
        [
          {
            kind: 'verdict-reponse',
            questionId: QUESTION,
            correcte: false,
            libelleConfusion: 'Taux annuel divisé par 12',
          },
        ],
      ],
    ]);
  });

  it('remplace par zéro le score absent d’une production servie sans note', () => {
    const production = productionReprise({ score: null, details: [DETAIL] });

    expect(production).toEqual(jasmine.objectContaining({ kind: 'verdict-production', score: 0 }));
  });

  it('reconstruit la progression de chaque parcours d’énigmes', () => {
    const etat = buildEtatParticipant({
      enigmes: [
        {
          parcoursId: PARCOURS,
          resolues: [{ enigmeId: 'enigme-1', fragment: '7' }],
          tentativesRestantes: { 'enigme-2': 10 },
        },
      ],
    });

    expect(retoursDeLEtat(etat, ecranDe).get(`ecran-de-${PARCOURS}`)).toEqual([
      {
        kind: 'progression-enigmes',
        parcoursId: PARCOURS,
        resolues: [{ enigmeId: 'enigme-1', fragment: '7' }],
        tentativesRestantes: { 'enigme-2': 10 },
      },
    ]);
  });

  it('ne pose aucun retour pour une question dont l’écran est introuvable', () => {
    const etat = buildEtatParticipant({
      reponses: [reponseServie({ questionId: 'hors-deck' })],
      enigmes: [{ parcoursId: 'hors-deck', resolues: [], tentativesRestantes: {} }],
    });

    expect([...retoursDeLEtat(etat, ecranDe).keys()]).toEqual([]);
  });

  it('rend une carte vide pour un état sans réponse ni énigme', () => {
    expect(retoursDeLEtat(buildEtatParticipant(), ecranDe).size).toBe(0);
  });
});

describe('lecture des verdicts et réussites d’un écran révélé', () => {
  it('rend le verdict de chaque réponse et production, sans les autres retours', () => {
    const lot: RetourBrique[] = [
      { kind: 'verdict-reponse', questionId: QUESTION, correcte: true, libelleConfusion: null },
      retourDeProduction(
        PRODUCTION,
        { correcte: false, score: 0.5, details: [DETAIL], libelleConfusion: null },
        FEUILLE_ENVOYEE,
      ),
      { kind: 'deja-repondu', questionId: QUESTION },
      retourDeRefus('reseau', 'Hors ligne'),
    ];

    expect(verdictsDeLEcran(lot)).toEqual({ [QUESTION]: true, [PRODUCTION]: false });
  });

  it('T6 · rend le verdict de chaque énigme du coffre, résolue ou manquée', () => {
    const lot: RetourBrique[] = [
      retourDeTentative(PARCOURS, 'b2-01-a6-e1-mix', {
        correcte: false,
        fragment: null,
        tentativesRestantes: 2,
      }),
      retourDeTentative(PARCOURS, 'b2-01-a6-e1-mix', {
        correcte: true,
        fragment: 'A',
        tentativesRestantes: 1,
      }),
      retourDeTentative(PARCOURS, 'b2-01-a6-e2-points', {
        correcte: false,
        fragment: null,
        tentativesRestantes: 2,
      }),
      {
        kind: 'progression-enigmes',
        parcoursId: PARCOURS,
        resolues: [{ enigmeId: 'b2-01-a6-e3-rouleau', fragment: 'C' }],
        tentativesRestantes: {
          'b2-01-a6-e3-rouleau': 2,
          'b2-01-a6-e4-tva': 0,
          'b2-01-a6-e5-jamais': 3,
        },
      },
    ];

    expect(verdictsDeLEcran(lot)).toEqual({
      'b2-01-a6-e1-mix': true,
      'b2-01-a6-e2-points': false,
      'b2-01-a6-e3-rouleau': true,
      'b2-01-a6-e4-tva': false,
    });
  });

  it('rend la réussite de la classe par question de l’écran, sans les questions sans réponse', () => {
    const resultats = buildResultatsSeance({
      questions: [
        buildResultatQuestion({ questionId: QUESTION, ecranId: ECRAN, total: 20, correctes: 13 }),
        buildResultatQuestion({ questionId: PRODUCTION, ecranId: ECRAN, total: 0, correctes: 0 }),
        buildResultatQuestion({
          questionId: 'autre',
          ecranId: 'B2-01-A1-02',
          total: 9,
          correctes: 9,
        }),
      ],
    });

    expect(reussitesDeLEcran(resultats, ECRAN)).toEqual({
      [QUESTION]: { justes: 13, total: 20 },
    });
  });

  it('ne rend aucune réussite sans résultats ni écran source', () => {
    expect(reussitesDeLEcran(null, ECRAN)).toEqual({});
    expect(reussitesDeLEcran(buildResultatsSeance(), null)).toEqual({});
  });
});

function retours(
  carte: ReadonlyMap<string, readonly RetourBrique[]>,
  ecran: string,
): readonly RetourBrique[] {
  const trouves = carte.get(ecran);
  if (trouves === undefined) {
    throw new Error(`aucun retour pose sur ${ecran}`);
  }
  return trouves;
}
