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

export function garderLaReflexion(fixture: ComponentFixture<unknown>, texte: string): void {
  const racine = fixture.nativeElement as HTMLElement;
  const zone = racine.querySelector('textarea') as HTMLTextAreaElement;
  zone.value = texte;
  zone.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  (racine.querySelector('.slide-reflection__save') as HTMLButtonElement).click();
}

export function etatDeLaReflexion(fixture: ComponentFixture<unknown>): string | null {
  return (
    (fixture.nativeElement as HTMLElement)
      .querySelector('[data-testid="slide-reflection-etat"]')
      ?.getAttribute('data-etat') ?? null
  );
}

export async function jusqua(
  fixture: ComponentFixture<unknown>,
  condition: () => boolean,
): Promise<void> {
  for (let essai = 0; essai < 200 && !condition(); essai += 1) {
    await new Promise((resoudre) => setTimeout(resoudre, 10));
    fixture.detectChanges();
  }
}

export function monterApresChargement<T>(hote: Type<T>): ComponentFixture<T> {
  const fixture = TestBed.createComponent(hote);
  fixture.detectChanges();
  tick();
  fixture.detectChanges();
  return fixture;
}
