import {
  type CoursContent,
  type EcranContent,
  creerMetadonneesBrique,
} from '../../cours/content/types';
import type { NumericQuestion } from '../../cours/runtime/blocks/FpNumeric';
import type { VoteQuestion } from '../../cours/runtime/blocks/FpVote';
import type { DeckState } from '../../cours/runtime/core/state';

function buildEcran(overrides: Partial<EcranContent> = {}): EcranContent {
  return {
    id: 'ecran-1',
    type: 'vote',
    duree: 180,
    interactif: true,
    ...overrides,
  };
}

export function buildCoursContent(overrides: Partial<CoursContent> = {}): CoursContent {
  return {
    id: 'b1-09-interets-composes',
    titre: 'Faire fructifier : interets composes et capitalisation',
    niveau: 'B1',
    duree: 210,
    concepts: ['capitalisation', 'valeur-acquise'],
    ecrans: [
      buildEcran({ id: 'ecran-1' }),
      buildEcran({ id: 'ecran-2' }),
      buildEcran({ id: 'ecran-3', interactif: false }),
      buildEcran({ id: 'ecran-4' }),
    ],
    ...overrides,
  };
}

export function buildVoteQuestion(overrides: Partial<VoteQuestion> = {}): VoteQuestion {
  return {
    id: 'Q-CAP-03',
    enonce: 'Un capital de 1 000 € place a 4 % pendant 10 ans vaut :',
    options: [
      { id: 'a', libelle: '1 400 €', misconception: 'interet-simple' },
      { id: 'b', libelle: '1 480,24 €', misconception: null },
      { id: 'c', libelle: '1 040 €', misconception: 'oubli-de-la-duree' },
    ],
    ...overrides,
  };
}

export function buildNumericQuestion(overrides: Partial<NumericQuestion> = {}): NumericQuestion {
  return {
    id: 'Q-VA-07',
    enonce: 'Quelle est la valeur acquise, au centime pres ?',
    unite: '€',
    metadonnees: creerMetadonneesBrique({
      concepts: ['capitalisation', 'valeur-acquise'],
      misconceptionsCiblees: ['interet-simple'],
      dureeMinutes: 3,
      modalite: 'solo',
      regime: 'focus',
    }),
    tolerance: { type: 'absolue', valeur: 0.01 },
    valeurAttendue: 1480.24,
    ...overrides,
  };
}

export function buildDeckState(overrides: Partial<DeckState> = {}): DeckState {
  return {
    coursId: 'b1-09-interets-composes',
    ecranCourant: 0,
    modeRythme: 'pilote',
    intervalleLibre: null,
    reponses: {},
    majLe: '2026-09-11T08:00:00.000Z',
    ...overrides,
  };
}
