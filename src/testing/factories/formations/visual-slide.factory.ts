import type { RetourBrique } from '../../../app/core/ports/formations.port';
import type { EcranContent } from '../../../cours/content/types';
import { metadonnees } from './cours.factory';

type PropsVisuelles = Readonly<Record<string, unknown>>;

function donneesDeRecit(
  id: string,
  renderer: string,
  props: PropsVisuelles,
): EcranContent['donnees'] {
  return {
    recit: {
      id,
      presentation: { version: 2, screenId: id, renderer, props },
      metadonnees: metadonnees(),
    },
  };
}

export function buildVisualSlide(overrides: Partial<EcranContent> = {}): EcranContent {
  return {
    id: 'B2-01-S01-ACCROCHE',
    type: 'fp-story',
    titre: null,
    duree: 3,
    interactif: false,
    donnees: donneesDeRecit('B2-01-S01-ACCROCHE', 'hero', {
      title: 'Lire un chiffre',
      subtitle: 'Contrôler avant de décider',
      bullets: ['B2'],
    }),
    ...overrides,
  };
}

export function buildRecitVisuel(
  id: string,
  renderer: string,
  props: PropsVisuelles,
  champs: Partial<EcranContent> = {},
): EcranContent {
  return buildVisualSlide({ id, donnees: donneesDeRecit(id, renderer, props), ...champs });
}

export function buildVisualImageHeroSlide(id = 'B2-01-S01-ACCROCHE'): EcranContent {
  return buildRecitVisuel(id, 'hero', {
    title: 'Lire un chiffre',
    bullets: ['B2'],
    bgImage: `https://images.example/${id}.webp`,
    bgImageAlt: 'Tableau de chiffres projeté en classe',
  });
}

export function buildVisualImageSlide(
  renderer: 'image-left' | 'image-right' = 'image-left',
  id = 'B2-01-A5-01-NIGHTINGALE',
  props: PropsVisuelles = {},
): EcranContent {
  return buildRecitVisuel(id, renderer, {
    title: '1858 : Florence Nightingale fait décider par les données',
    paragraphs: ['Un secteur par mois de la guerre de Crimée.'],
    image: `https://images.example/${id}.webp`,
    imageAlt: 'Diagramme polaire de Florence Nightingale',
    ...props,
  });
}

export function buildVisualIllustrationSlide(
  id = 'B2-02-A1-06-ILLUSTRATION-RESUMER',
): EcranContent {
  return buildRecitVisuel(id, 'illustration', {
    image: '/assets/cours/b2-02/v2/cinq-factures.webp',
    imageAlt: 'Schéma des cinq factures : moyenne 20 jours, médiane 12 jours',
  });
}

export const TRI_CORRIGE = { screenId: 'B2-01-A1-05-ANATOMIE', sortId: 'b2-01-a1-anatomie' };

export function buildSortCorrectionProps(overrides: PropsVisuelles = {}): PropsVisuelles {
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
  props: PropsVisuelles = buildSortCorrectionProps(),
  id = 'B2-01-A1-05-CORRECTION',
): EcranContent {
  return buildRecitVisuel(id, 'sort-review', props);
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
    neSaitPas: false,
  };
}

export function buildVisualChartSlide(
  props: PropsVisuelles,
  id = 'K-GRAPHIQUE-DE-REFERENCE',
): EcranContent {
  return buildRecitVisuel(id, 'chart', props);
}
