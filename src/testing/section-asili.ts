import type { Type } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { isolateAnimReady } from './anim-ready';
import { monterSurPlateforme, type PlateformeDeRendu } from './plateforme';

export type EntreesDeSection = Readonly<Record<string, unknown>>;

export type MonteurDeSection<T> = (
  plateforme?: PlateformeDeRendu,
  entrees?: EntreesDeSection,
) => ComponentFixture<T>;

export function decrireSectionAsili<T>(
  composant: Type<T>,
  entreesParDefaut: EntreesDeSection = {},
): MonteurDeSection<T> {
  const monter: MonteurDeSection<T> = (plateforme = 'browser', entrees = {}) => {
    const fixture = monterSurPlateforme(composant, plateforme);
    for (const [nom, valeur] of Object.entries({ ...entreesParDefaut, ...entrees })) {
      fixture.componentRef.setInput(nom, valeur);
    }
    return fixture;
  };

  isolateAnimReady();

  it('se cree', () => {
    const fixture = monter();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  return monter;
}

export function decrireRenduServeur<T>(
  monter: MonteurDeSection<T>,
  verifier: (hote: HTMLElement) => void,
  entrees: EntreesDeSection = {},
): void {
  it("reste rendu cote serveur (SSR fail-open : pas d'anim-ready)", () => {
    const fixture = monter('server', entrees);
    fixture.detectChanges();
    verifier(fixture.nativeElement as HTMLElement);
    expect(document.documentElement.classList).not.toContain('anim-ready');
  });
}
