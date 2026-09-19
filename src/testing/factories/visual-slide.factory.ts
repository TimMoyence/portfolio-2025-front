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
