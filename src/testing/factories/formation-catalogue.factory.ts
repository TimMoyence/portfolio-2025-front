import { of } from 'rxjs';
import type { CoursContent } from '../../cours/content/types';
import type { FormationCataloguePort } from '../../app/core/ports/formation-catalogue.port';
import { buildVisualSlide } from './visual-slide.factory';

export function buildVisualCourse(overrides: Partial<CoursContent> = {}): CoursContent {
  return {
    id: 'b2-01-traitement-information-chiffree',
    titre: 'Lire et contrôler l’information chiffrée',
    niveau: 'B2',
    duree: 210,
    concepts: ['proportion'],
    ecrans: Array.from({ length: 72 }, (_, index) =>
      buildVisualSlide({ id: `B2-01-S${String(index + 1).padStart(2, '0')}` }),
    ),
    ...overrides,
  };
}

export function createFormationCataloguePortStub(
  course: CoursContent = buildVisualCourse(),
): jasmine.SpyObj<FormationCataloguePort> {
  return jasmine.createSpyObj<FormationCataloguePort>('FormationCataloguePort', {
    lire: of(course),
  });
}
