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
