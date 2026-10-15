import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { SlideChartComponent } from '../app/shared/slides/layouts/slide-chart/slide-chart.component';
import { REQUETE_MOUVEMENT_REDUIT } from '../cours/runtime/core/mouvement';
import { installerIntersectionObserverToujoursVisible } from './factories/intersection-observer.factory';
import { poserLesEntrees } from './montage-page';
import { setupTestBed } from './setup-test-bed';

export function preparerLeGraphique(): void {
  beforeEach(() => {
    setupTestBed({ imports: [SlideChartComponent], http: false });
  });
}

export function jouerLesGraphiquesJusquAuBout(): void {
  let restaurerLObservateur: () => void = () => undefined;

  beforeEach(() => {
    const reelle = window.matchMedia.bind(window);
    spyOn(window, 'matchMedia').and.callFake((requete: string) =>
      reelle(requete === REQUETE_MOUVEMENT_REDUIT ? 'all' : requete),
    );
    restaurerLObservateur = installerIntersectionObserverToujoursVisible();
  });

  afterEach(() => restaurerLObservateur());
}

export function monterLeGraphique(
  entrees: Readonly<Record<string, unknown>>,
): ComponentFixture<SlideChartComponent> {
  return poserLesEntrees(TestBed.createComponent(SlideChartComponent), entrees);
}
