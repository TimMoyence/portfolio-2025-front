import type { CoursCatalogue } from '../../cours/content/types';
import { buildVisualSlide } from './visual-slide.factory';

export function buildVisualCourse(overrides: Partial<CoursCatalogue> = {}): CoursCatalogue {
  return {
    id: 'b2-01-traitement-information-chiffree',
    titre: 'Lire et contrôler l’information chiffrée',
    niveau: 'B2',
    duree: 210,
    concepts: ['proportion'],
    version: 3,
    publieLe: '2026-09-15T09:30:00.000Z',
    ecrans: Array.from({ length: 72 }, (_, index) =>
      buildVisualSlide({ id: `B2-01-S${String(index + 1).padStart(2, '0')}` }),
    ),
    ...overrides,
  };
}
