import {
  type CoursContent,
  type EcranContent,
  creerMetadonneesBrique,
} from '../../cours/content/types';
import type { ChallengeProbleme } from '../../cours/runtime/blocks/FpChallenge';
import type { ExitBillet } from '../../cours/runtime/blocks/FpExit';
import type { NumericQuestion } from '../../cours/runtime/blocks/FpNumeric';
import type { PulseSondage } from '../../cours/runtime/blocks/FpPulse';
import type { RecallQuestion } from '../../cours/runtime/blocks/FpRecall';
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

export function buildRecallQuestion(overrides: Partial<RecallQuestion> = {}): RecallQuestion {
  return {
    id: 'Q-RAPPEL-04',
    enonce: 'Sans vos notes : comment passe-t-on d une valeur actuelle a une valeur acquise ?',
    options: [
      { id: 'a', libelle: 'On multiplie par (1 + i) puissance n', misconception: null },
      { id: 'b', libelle: 'On multiplie par 1 + i fois n', misconception: 'interet-simple' },
      { id: 'c', libelle: 'On divise par (1 + i) puissance n', misconception: 'sens-inverse' },
    ],
    metadonnees: creerMetadonneesBrique({
      concepts: ['capitalisation'],
      misconceptionsCiblees: ['interet-simple', 'sens-inverse'],
      dureeMinutes: 4,
      modalite: 'solo',
      regime: 'examen',
    }),
    ...overrides,
  };
}

export function buildExitBillet(overrides: Partial<ExitBillet> = {}): ExitBillet {
  return {
    id: 'B-SORTIE-09',
    question: 'Le taux equivalent mensuel d un taux annuel de 12 % vaut :',
    invite: 'Qu est-ce qui reste flou ?',
    options: [
      { id: 'a', libelle: 'Un peu moins de 1 %', misconception: null },
      { id: 'b', libelle: 'Exactement 1 %', misconception: 'proportionnalite' },
      { id: 'c', libelle: 'Un peu plus de 1 %', misconception: 'sens-inverse' },
    ],
    metadonnees: creerMetadonneesBrique({
      concepts: ['taux-equivalent'],
      misconceptionsCiblees: ['proportionnalite'],
      dureeMinutes: 5,
      modalite: 'solo',
      regime: 'ouvert',
    }),
    ...overrides,
  };
}

export function buildPulseSondage(overrides: Partial<PulseSondage> = {}): PulseSondage {
  return {
    id: 'P-PULSE-02',
    invite: 'Ou en etes-vous sur le passage du taux annuel au taux mensuel ?',
    metadonnees: creerMetadonneesBrique({
      concepts: ['taux-equivalent'],
      misconceptionsCiblees: ['proportionnalite'],
      dureeMinutes: 1,
      modalite: 'classe',
      regime: 'ouvert',
    }),
    ...overrides,
  };
}

export function buildChallengeProbleme(
  overrides: Partial<ChallengeProbleme> = {},
): ChallengeProbleme {
  return {
    id: 'D-DEFI-05',
    enonce:
      'Un capital double en combien d annees a 7 % par an ? Cherchez sans formule, estimez et expliquez.',
    invite: 'Ecrivez votre tentative et la maniere dont vous avez raisonne',
    strategies: [
      { id: 'a', libelle: 'Diviser 100 par 7 et arrondir', fausse: true },
      {
        id: 'b',
        libelle: 'Ajouter 7 % au capital annee apres annee jusqu a depasser le double',
        fausse: false,
      },
      { id: 'c', libelle: 'Multiplier 7 % par 2 pour obtenir la duree', fausse: true },
    ],
    metadonnees: creerMetadonneesBrique({
      concepts: ['capitalisation'],
      misconceptionsCiblees: ['interet-simple'],
      dureeMinutes: 7,
      modalite: 'binome',
      regime: 'ouvert',
    }),
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
