import {
  type CoursContent,
  type EcranContent,
  creerMetadonneesBrique,
} from '../../cours/content/types';
import type { ChallengeProbleme } from '../../cours/runtime/blocks/FpChallenge';
import type { Concept4Definition } from '../../cours/runtime/blocks/FpConcept4';
import type { ExitBillet } from '../../cours/runtime/blocks/FpExit';
import type { NumericQuestion } from '../../cours/runtime/blocks/FpNumeric';
import type { PlotDefinition } from '../../cours/runtime/blocks/FpPlot';
import type { ProCas } from '../../cours/runtime/blocks/FpPro';
import type { PulseSondage } from '../../cours/runtime/blocks/FpPulse';
import type { QuoteCitation } from '../../cours/runtime/blocks/FpQuote';
import type { RecallQuestion } from '../../cours/runtime/blocks/FpRecall';
import type { StoryRecit } from '../../cours/runtime/blocks/FpStory';
import type { VoteQuestion } from '../../cours/runtime/blocks/FpVote';
import type { WorkedExemple } from '../../cours/runtime/blocks/FpWorked';
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

export function buildQuoteCitation(overrides: Partial<QuoteCitation> = {}): QuoteCitation {
  return {
    id: 'C-CITATION-01',
    texte: 'L interet compose est la huitieme merveille du monde : qui le comprend le percoit.',
    auteur: 'Mayer Amschel Rothschild',
    source: 'attribue',
    metadonnees: creerMetadonneesBrique({
      concepts: ['capitalisation'],
      misconceptionsCiblees: ['interet-simple'],
      dureeMinutes: 1,
      modalite: 'classe',
      regime: 'ouvert',
    }),
    ...overrides,
  };
}

export function buildStoryRecit(overrides: Partial<StoryRecit> = {}): StoryRecit {
  return {
    id: 'R-RECIT-03',
    titre: 'Le livret ouvert a la naissance',
    paragraphes: [
      'En 2008, les parents de Sofia deposent 500 € sur un livret ouvert le jour de sa naissance.',
      'Personne n y touche pendant dix-huit ans : chaque annee, les interets rejoignent le capital.',
      'Le jour de ses dix-huit ans, Sofia ne retrouve pas 500 € augmentes d un peu : elle retrouve un capital qui a travaille pour elle.',
    ],
    metadonnees: creerMetadonneesBrique({
      concepts: ['capitalisation', 'valeur-acquise'],
      misconceptionsCiblees: ['interet-simple'],
      dureeMinutes: 3,
      modalite: 'classe',
      regime: 'ouvert',
    }),
    ...overrides,
  };
}

export function buildProCas(overrides: Partial<ProCas> = {}): ProCas {
  return {
    id: 'M-METIER-06',
    metier: 'Gestionnaire de credit en agence',
    situation:
      'Un client compare deux offres de pret : 4,2 % sur douze mois et 0,35 % par mois sur la meme duree.',
    geste:
      'Ramener les deux taux a la meme periode avant de comparer : on eleve (1 + i) a la puissance 12, on ne multiplie pas par 12.',
    consequence:
      'Annoncer le mauvais taux equivalent engage l agence sur un cout que le client decouvrira a la premiere echeance.',
    metadonnees: creerMetadonneesBrique({
      concepts: ['taux-equivalent'],
      misconceptionsCiblees: ['proportionnalite'],
      dureeMinutes: 4,
      modalite: 'binome',
      regime: 'ouvert',
    }),
    ...overrides,
  };
}

function valeurAcquise(valeurs: Readonly<Record<string, number>>): number {
  return valeurs['C'] * (1 + valeurs['i'] / 100) ** valeurs['n'];
}

export function buildConcept4Definition(
  overrides: Partial<Concept4Definition> = {},
): Concept4Definition {
  return {
    id: 'K-QUATRE-FACES-01',
    parametres: [
      { cle: 'C', libelle: 'Capital place en euros', min: 100, max: 5000, pas: 100, defaut: 1000 },
      { cle: 'i', libelle: 'Taux annuel en pourcent', min: 1, max: 10, pas: 0.5, defaut: 4 },
      { cle: 'n', libelle: 'Duree en annees', min: 1, max: 30, pas: 1, defaut: 10 },
    ],
    formuleLatexSimplifie: 'C × (1 + i)^n',
    calcul: valeurAcquise,
    phrase: (valeurs) =>
      `Un capital de ${valeurs['C']} € placé à ${valeurs['i']} % pendant ${valeurs['n']} ans devient ${valeurAcquise(valeurs).toFixed(2)} €.`,
    metadonnees: creerMetadonneesBrique({
      concepts: ['capitalisation', 'valeur-acquise'],
      misconceptionsCiblees: ['interet-simple'],
      dureeMinutes: 6,
      modalite: 'binome',
      regime: 'ouvert',
    }),
    ...overrides,
  };
}

export function buildWorkedExemple(overrides: Partial<WorkedExemple> = {}): WorkedExemple {
  return {
    id: 'K-RESOLU-01',
    enonce: 'Un capital de 1 000 € est place a 4 % pendant 3 ans : calculez la valeur acquise.',
    etapes: [
      {
        id: 'e1',
        intitule: 'Relever les donnees',
        raisonnement: 'C = 1 000 €, i = 4 % soit 0,04, n = 3 ans.',
        invite: 'Pourquoi ecrire le taux en decimal avant de calculer ?',
      },
      {
        id: 'e2',
        intitule: 'Choisir la formule',
        raisonnement: 'La valeur acquise vaut C × (1 + i)^n car les interets se capitalisent.',
        invite: 'Pourquoi une puissance plutot qu une multiplication par 3 ?',
      },
      {
        id: 'e3',
        intitule: 'Remplacer les valeurs',
        raisonnement: '1 000 × (1 + 0,04)^3 = 1 000 × 1,124864.',
        invite: 'Pourquoi eleve-t-on 1,04 et non 0,04 a la puissance 3 ?',
      },
      {
        id: 'e4',
        intitule: 'Conclure',
        raisonnement: 'La valeur acquise est de 1 124,86 € au bout de trois ans.',
        invite: 'Pourquoi arrondir seulement a la fin du calcul ?',
      },
    ],
    metadonnees: creerMetadonneesBrique({
      concepts: ['capitalisation', 'valeur-acquise'],
      misconceptionsCiblees: ['interet-simple'],
      dureeMinutes: 8,
      modalite: 'solo',
      regime: 'focus',
    }),
    ...overrides,
  };
}

function capitalDe(valeurs: Readonly<Record<string, number>>): number {
  return valeurs['C'] ?? 0;
}

function tauxDe(valeurs: Readonly<Record<string, number>>): number {
  return (valeurs['i'] ?? 0) / 100;
}

export function buildPlotDefinition(overrides: Partial<PlotDefinition> = {}): PlotDefinition {
  return {
    id: 'K-COURBE-01',
    abscisse: { libelle: 'Duree en annees', min: 0, max: 20 },
    ordonnee: 'Capital acquis en euros',
    parametres: [
      { cle: 'C', libelle: 'Capital place en euros', min: 100, max: 5000, pas: 100, defaut: 1000 },
      { cle: 'i', libelle: 'Taux annuel en pourcent', min: 1, max: 10, pas: 0.5, defaut: 4 },
    ],
    series: [
      {
        id: 'compose',
        libelle: 'Interets composes',
        trait: 'plein',
        calcul: (annees, valeurs) => capitalDe(valeurs) * (1 + tauxDe(valeurs)) ** annees,
      },
      {
        id: 'simple',
        libelle: 'Interets simples',
        trait: 'tirets',
        calcul: (annees, valeurs) => capitalDe(valeurs) * (1 + tauxDe(valeurs) * annees),
      },
    ],
    metadonnees: creerMetadonneesBrique({
      concepts: ['capitalisation', 'interet-simple'],
      misconceptionsCiblees: ['croissance-lineaire'],
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
