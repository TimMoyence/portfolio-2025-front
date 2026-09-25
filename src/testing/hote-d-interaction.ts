import type { Provider, Type } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed, tick } from '@angular/core/testing';
import type { SlideInteractions } from '../app/core/models/presentation-interactions.model';
import { PRESENTATION_PORT, type PresentationPort } from '../app/core/ports/presentation.port';
import {
  buildInteractionsResponse,
  createPresentationPortStub,
} from './factories/presentation.factory';

export function configurerLHoteDInteraction(
  hote: Type<unknown>,
  interactions: Record<string, SlideInteractions>,
  providers: Provider[] = [],
): jasmine.SpyObj<PresentationPort> {
  const port = createPresentationPortStub(buildInteractionsResponse({ interactions }));
  TestBed.configureTestingModule({
    imports: [hote],
    providers: [{ provide: PRESENTATION_PORT, useValue: port }, ...providers],
  });
  return port;
}

export function choisirLOptionDuQuiz<T>(
  fixture: ComponentFixture<T>,
  index: number,
): ComponentFixture<T> {
  const options = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
    '.slide-quiz__option',
  );
  options[index].click();
  fixture.detectChanges();
  return fixture;
}

export function monterApresChargement<T>(hote: Type<T>): ComponentFixture<T> {
  const fixture = TestBed.createComponent(hote);
  fixture.detectChanges();
  tick();
  fixture.detectChanges();
  return fixture;
}
