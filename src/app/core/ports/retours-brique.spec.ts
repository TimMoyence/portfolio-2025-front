import type { RetourBrique } from '../../shared/slides/session/contrat-hote';
import { buildEtatParticipant } from '../../../testing/factories/formations.factory';
import {
  ajouterRetours,
  retirerLesRefus,
  retourDeProduction,
  retourDeRefus,
  retourDeReponse,
  retourDeTentative,
  retoursDeLEtat,
} from './retours-brique';

const QUESTION = 'b2-01-a4-feuille-canaux';
const PRODUCTION = 'b2-01-a4-tableau-canaux';
const PARCOURS = 'b2-01-a6-coffre';
const ECRAN = 'B2-01-A4-02-FEUILLE-CANAUX';

const DETAIL = { cle: 'E3', juste: false, libelleConfusion: 'Base de départ oubliée' };

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

  it('traduit un verdict de production avec son score et ses détails', () => {
    expect(
      retourDeProduction(PRODUCTION, {
        correcte: false,
        score: 0.5,
        details: [DETAIL],
        libelleConfusion: 'Base de départ oubliée',
      }),
    ).toEqual({
      kind: 'verdict-production',
      questionId: PRODUCTION,
      correcte: false,
      score: 0.5,
      details: [DETAIL],
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
      },
      { kind: 'deja-repondu', questionId: PRODUCTION },
    ]);
  });

  it('remplace par zéro le score absent d’une production servie sans note', () => {
    const etat = buildEtatParticipant({
      reponses: [reponseServie({ questionId: PRODUCTION, score: null, details: [DETAIL] })],
    });

    const [production] = retours(retoursDeLEtat(etat, ecranDe), `ecran-de-${PRODUCTION}`);

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
