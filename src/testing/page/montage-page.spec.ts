import { Component, input } from '@angular/core';
import { pageMontee } from './montage-page';

@Component({
  selector: 'app-hote-montage',
  template: '<p data-testid="valeur">{{ valeur() }}</p>',
})
class HoteMontageComponent {
  readonly valeur = input.required<string>();
}

describe('pageMontee', () => {
  const vus: string[] = [];
  const page = pageMontee(HoteMontageComponent, {
    avantRendu: (fixture) => {
      vus.push(fixture.nativeElement.textContent as string);
      fixture.componentRef.setInput('valeur', 'posee avant rendu');
    },
  });

  it('applique avantRendu avant le premier rendu et expose fixture, composant et racine', () => {
    expect(vus.at(-1)).toBe('');
    expect(page.composant).toBe(page.fixture.componentInstance);
    expect(page.racine).toBe(page.fixture.nativeElement);
    expect(page.racine.querySelector('[data-testid="valeur"]')?.textContent).toBe(
      'posee avant rendu',
    );
  });
});
