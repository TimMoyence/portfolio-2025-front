import { APP_BASE_HREF } from '@angular/common';
import type { Provider, Type } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { isolateAnimReady } from './anim-ready';
import { monterSurPlateforme, type PlateformeDeRendu } from './plateforme';

export type EntreesDeSection = Readonly<Record<string, unknown>>;

export type MonteurDeSection<T> = (
  plateforme?: PlateformeDeRendu,
  entrees?: EntreesDeSection,
  providers?: readonly Provider[],
) => ComponentFixture<T>;

export function decrireSectionAsili<T>(
  composant: Type<T>,
  entreesParDefaut: EntreesDeSection = {},
): MonteurDeSection<T> {
  const monter: MonteurDeSection<T> = (plateforme = 'browser', entrees = {}, providers = []) => {
    const fixture = monterSurPlateforme(composant, plateforme, providers);
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

export function decrireLiensDansLaLangueDeLaPage<T>(
  monter: MonteurDeSection<T>,
  entrees: EntreesDeSection,
  selecteur: string,
  attendus: readonly string[],
): void {
  it('garde la langue de la page sur un lien interne, et laisse un lien externe tel quel', () => {
    const fixture = monter('browser', entrees, [{ provide: APP_BASE_HREF, useValue: '/en/' }]);
    fixture.detectChanges();

    const liens = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll(selecteur));
    expect(liens.map((lien) => lien.getAttribute('href'))).toEqual([...attendus]);
  });
}
