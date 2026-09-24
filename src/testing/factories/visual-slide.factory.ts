import type { RetourBrique } from '../../app/shared/slides/session/contrat-hote';
import type { EcranContent } from '../../cours/content/types';

export function buildVisualSlide(overrides: Partial<EcranContent> = {}): EcranContent {
  return {
    id: 'B2-01-S01-ACCROCHE',
    type: 'fp-story',
    duree: 3,
    interactif: false,
    donnees: {
      recit: {
        id: 'B2-01-S01-ACCROCHE',
        presentation: {
          version: 2,
          screenId: 'B2-01-S01-ACCROCHE',
          renderer: 'hero',
          props: {
            title: 'Lire un chiffre',
            subtitle: 'Contrôler avant de décider',
            bullets: ['B2'],
          },
        },
      },
    },
    ...overrides,
  };
}

export function buildVisualImageHeroSlide(id = 'B2-01-S01-ACCROCHE'): EcranContent {
  return buildVisualSlide({
    id,
    donnees: {
      recit: {
        id,
        presentation: {
          version: 2,
          screenId: id,
          renderer: 'hero',
          props: {
            title: 'Lire un chiffre',
            bullets: ['B2'],
            bgImage: `https://images.example/${id}.webp`,
            bgImageAlt: 'Tableau de chiffres projeté en classe',
          },
        },
      },
    },
  });
}

export const TRI_CORRIGE = { screenId: 'B2-01-A1-05-ANATOMIE', sortId: 'b2-01-a1-anatomie' };

export function buildSortCorrectionProps(
  overrides: Readonly<Record<string, unknown>> = {},
): Readonly<Record<string, unknown>> {
  return {
    title: 'Correction du tri',
    subtitle: 'Chaque carte à sa place, avec la raison.',
    source: TRI_CORRIGE,
    categories: [
      { id: 'valeur', label: 'Valeur absolue' },
      { id: 'ambigu', label: 'Ambigu sans base' },
    ],
    cards: [
      {
        id: 'ca-2025',
        label: 'CA 2025 : 1,2 M€',
        category: 'valeur',
        justification: 'Un montant, lisible seul.',
      },
      {
        id: 'inflation',
        label: '+12 %',
        category: 'ambigu',
        justification: 'Sans base ni période, le pourcentage ne dit rien.',
      },
    ],
    ...overrides,
  };
}

export function buildVisualSortCorrectionSlide(
  props: Readonly<Record<string, unknown>> = buildSortCorrectionProps(),
  id = 'B2-01-A1-05-CORRECTION',
): EcranContent {
  return buildVisualSlide({
    id,
    donnees: {
      recit: {
        id,
        presentation: { version: 2, screenId: id, renderer: 'sort-review', props },
      },
    },
  });
}

export const ATELIER_CORRIGE = {
  screenId: 'B2-01-A2-03-ATELIER-1',
  questions: ['b2-01-a2-evolution-marge', 'b2-01-a2-part-marketplace'],
} as const;

export function buildAnswerReviewProps(
  overrides: Readonly<Record<string, unknown>> = {},
): Readonly<Record<string, unknown>> {
  return {
    title: 'Correction de l’atelier 1',
    subtitle: 'Chaque calcul, avec son contrôle.',
    source: { screenId: ATELIER_CORRIGE.screenId },
    explications: [
      {
        reference: ATELIER_CORRIGE.questions[0],
        texte: '(291 000 − 285 000) ÷ 285 000 ≈ 0,021 : +2,1 % en trois ans.',
      },
      {
        reference: ATELIER_CORRIGE.questions[1],
        texte: '523 000 ÷ 1 150 000 ≈ 0,455, soit 45,5 % du CA.',
      },
    ],
    ...overrides,
  };
}

export function buildVisualAnswerReviewSlide(
  overrides: Partial<EcranContent> = {},
  id = 'B2-01-A2-03-CORRECTION-1',
): EcranContent {
  return buildVisualSlide({
    id,
    donnees: {
      recit: {
        id,
        presentation: {
          version: 2,
          screenId: id,
          renderer: 'answer-review',
          props: buildAnswerReviewProps(),
        },
      },
    },
    ecranSource: ATELIER_CORRIGE.screenId,
    ...overrides,
  });
}

export function buildVerdictDeQuestion(questionId: string, correcte: boolean): RetourBrique {
  return { kind: 'verdict-reponse', questionId, correcte, libelleConfusion: null };
}

export function buildVerdictDuTri(
  justes: Readonly<Record<string, boolean>>,
  questionId = TRI_CORRIGE.sortId,
): RetourBrique {
  const details = Object.entries(justes).map(([cle, juste]) => ({
    cle,
    juste,
    libelleConfusion: null,
  }));
  return {
    kind: 'verdict-production',
    questionId,
    correcte: details.every((detail) => detail.juste),
    score: details.filter((detail) => detail.juste).length,
    details,
  };
}

export function buildVisualChartSlide(
  props: Readonly<Record<string, unknown>>,
  id = 'B2-01-A2-04-MARGE-AXE-ZERO',
): EcranContent {
  return buildVisualSlide({
    id,
    donnees: {
      recit: {
        id,
        presentation: { version: 2, screenId: id, renderer: 'chart', props },
      },
    },
  });
}

export function buildVisualNestedQuizSlide(overrides: Partial<EcranContent> = {}): EcranContent {
  return buildVisualSlide({
    id: 'B2-01-S07-GRAPHIQUE',
    interactif: true,
    donnees: {
      recit: {
        id: 'B2-01-S07-GRAPHIQUE',
        presentation: {
          version: 2,
          screenId: 'B2-01-S07-GRAPHIQUE',
          renderer: 'image-left',
          props: {
            title: 'Le repère d’abord',
            nestedQuiz: {
              id: 'b2-s07-repere',
              type: 'quiz',
              question: 'Que faut-il vérifier en premier ?',
              options: ['L’axe', 'La couleur'],
            },
          },
        },
      },
    },
    ...overrides,
  });
}

export function buildVisualQuizSlide(overrides: Partial<EcranContent> = {}): EcranContent {
  return buildVisualSlide({
    id: 'B2-01-S03-PREDICTION',
    interactif: true,
    donnees: {
      recit: {
        id: 'B2-01-S03-PREDICTION',
        presentation: {
          version: 2,
          screenId: 'B2-01-S03-PREDICTION',
          renderer: 'quiz',
          props: {
            questionData: {
              id: 'b2-s03-prediction',
              type: 'quiz',
              question: 'Quelle échelle ?',
              options: ['A', 'B'],
            },
          },
        },
      },
    },
    ...overrides,
  });
}
