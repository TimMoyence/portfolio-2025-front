import type { Type } from '@angular/core';
import { PRESENTATION_PORT } from '../app/core/ports/presentation.port';
import { SlideDeckService } from '../app/shared/slides';
import { createPresentationPortStub } from './factories/presentation.factory';
import { montagePage } from './montage-page';

export function montageDeckDeFormation<T>(composant: Type<T>): () => HTMLElement {
  const page = montagePage(composant, {
    providers: [
      SlideDeckService,
      { provide: PRESENTATION_PORT, useValue: createPresentationPortStub() },
    ],
  });
  return () => page().nativeElement as HTMLElement;
}

export function decrireDeckDeFormation<T>(composant: Type<T>): () => HTMLElement {
  const rendu = montageDeckDeFormation(composant);

  it('rend la slide hero', () => {
    expect(rendu().querySelector('app-slide-hero')).toBeTruthy();
  });

  return rendu;
}

export function decrireDesAppelsAuContact(rendu: () => HTMLElement): void {
  it('mène chaque appel à l action au contact, sans promettre de boîte à outils', () => {
    const boutons = Array.from(rendu().querySelectorAll('.slide-cta__btn'));

    expect(boutons.length).toBeGreaterThan(0);
    for (const bouton of boutons) {
      expect(bouton.getAttribute('href'))
        .withContext(bouton.textContent ?? '')
        .toBe('/contact');
    }
    expect(rendu().textContent ?? '').not.toMatch(/toolkit|\bkit\b|PDF|télécharg/i);
  });
}
