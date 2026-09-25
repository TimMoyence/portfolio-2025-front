import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { SlideChartComponent } from '../app/shared/slides/layouts/slide-chart/slide-chart.component';
import { poserLesEntrees } from './montage-page';
import { setupTestBed } from './setup-test-bed';

export function preparerLeGraphique(): void {
  beforeEach(() => {
    setupTestBed({ imports: [SlideChartComponent], http: false });
  });
}

export function monterLeGraphique(
  entrees: Readonly<Record<string, unknown>>,
): ComponentFixture<SlideChartComponent> {
  return poserLesEntrees(TestBed.createComponent(SlideChartComponent), entrees);
}
