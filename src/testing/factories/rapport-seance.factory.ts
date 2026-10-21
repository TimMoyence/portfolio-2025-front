import type {
  ResultatQuestion,
  ResultatsSeance,
  ResumeBareme,
  StatistiquesSeance,
} from '../../cours/content/types';
import type {
  RapportSeance,
  Rattachement,
  RegleNotation,
} from '../../app/core/ports/formations.port';

export function buildResultatQuestion(overrides: Partial<ResultatQuestion> = {}): ResultatQuestion {
  return {
    questionId: 'Q-CAP-03',
    ecranId: 'ecran-1',
    type: 'vote',
    noteCompte: true,
    total: 24,
    correctes: 16,
    neSaitPas: 2,
    confusions: [
      { id: 'interet-simple', libelle: 'Intérêts simples au lieu de composés', nombre: 6 },
    ],
    parOption: null,
    scoreMoyen: null,
    parCle: null,
    confusionDominante: 'interet-simple',
    part: 16 / 24,
    sousLeSeuil: false,
    remediation: null,
    ...overrides,
  };
}

export function buildResultatsSeance(overrides: Partial<ResultatsSeance> = {}): ResultatsSeance {
  return {
    participants: 24,
    questions: [buildResultatQuestion()],
    confusions: buildResultatQuestion().confusions,
    ...overrides,
  };
}

export function buildStatistiquesSeance(
  overrides: Partial<StatistiquesSeance> = {},
): StatistiquesSeance {
  return {
    moyenne: 12.5,
    mediane: 13,
    dispersion: 3.25,
    tauxParticipation: 0.75,
    tauxReussite: 0.6,
    questionsProblemes: [],
    ...overrides,
  };
}

export function buildRegleNotation(overrides: Partial<RegleNotation> = {}): RegleNotation {
  return {
    noteMax: 20,
    partCohorteReference: 0.2,
    ratioSeuilValidation: 0.4,
    neSaitPasCompteCommeReponse: true,
    pointsNonReponse: 0,
    reponsesLibresNotees: false,
    seuilQuestionProbleme: 0.7,
    decimalesStatistiques: 2,
    statistiquesSurQuestionsNotees: true,
    ...overrides,
  };
}

export function buildResumeBareme(overrides: Partial<ResumeBareme> = {}): ResumeBareme {
  return {
    questionsNotees: 31,
    parType: {
      vote: { notees: 19, nonNotees: 13 },
      numeric: { notees: 7, nonNotees: 0 },
      classement: { notees: 3, nonNotees: 0 },
      feuille: { notees: 1, nonNotees: 0 },
      tableau: { notees: 1, nonNotees: 0 },
      enigme: { notees: 0, nonNotees: 4 },
    },
    ...overrides,
  };
}

export function buildRapportSeance(overrides: Partial<RapportSeance> = {}): RapportSeance {
  return {
    courseSlug: 'b1-09-interets-composes',
    code: '4821',
    ouverteLe: '2026-09-11T08:00:00.000Z',
    fermeeLe: '2026-09-11T10:00:00.000Z',
    participants: [],
    conceptsFragiles: ['capitalisation'],
    libellesDesConcepts: { capitalisation: 'Capitalisation' },
    resultats: buildResultatsSeance(),
    statistiques: buildStatistiquesSeance(),
    notation: buildRegleNotation(),
    bareme: buildResumeBareme(),
    jalons: {},
    enigmes: [],
    ...overrides,
  };
}

export function buildRattachement(overrides: Partial<Rattachement> = {}): Rattachement {
  return {
    participantId: 'participant-1',
    sessionId: 'seance-1',
    ecranCourant: 0,
    modeRythme: 'pilote',
    jeton: 'jeton-1',
    secretDeReprise: 'secret-de-reprise-1',
    ...overrides,
  };
}
