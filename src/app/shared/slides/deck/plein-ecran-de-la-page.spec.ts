import {
  createEnvironmentInjector,
  EnvironmentInjector,
  PLATFORM_ID,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { PlateformeDeRendu } from '../../../../testing/plateforme';
import type { PleinEcranSimule } from '../../../../testing/plein-ecran-simule';
import { simulerLePleinEcran } from '../../../../testing/plein-ecran-simule';
import type { PleinEcranDeLaPage } from './plein-ecran-de-la-page';
import { pleinEcranDeLaPage } from './plein-ecran-de-la-page';

describe('pleinEcranDeLaPage', () => {
  let ecran: PleinEcranSimule;
  let injecteur: EnvironmentInjector | null;

  function creer(plateforme: PlateformeDeRendu = 'browser'): PleinEcranDeLaPage {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: plateforme }] });
    const vue = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
    injecteur = vue;
    return runInInjectionContext(vue, pleinEcranDeLaPage);
  }

  function detruireLaVue(): void {
    injecteur?.destroy();
    injecteur = null;
  }

  function signalerLeChangement(element: Element | null): void {
    ecran.activer(element);
    document.dispatchEvent(new Event('fullscreenchange'));
  }

  beforeEach(() => {
    ecran = simulerLePleinEcran();
    injecteur = null;
  });

  afterEach(() => {
    detruireLaVue();
    ecran.restaurer();
  });

  it('reflete l etat obtenu par la bascule', async () => {
    const pleinEcran = creer();
    spyOn(document.documentElement, 'requestFullscreen').and.callFake(async () =>
      ecran.activer(document.documentElement),
    );

    await pleinEcran.basculer();

    expect(pleinEcran.actif()).toBeTrue();
  });

  it('suit une entree ou une sortie faite hors du bouton', () => {
    const pleinEcran = creer();

    signalerLeChangement(document.documentElement);
    expect(pleinEcran.actif()).toBeTrue();

    signalerLeChangement(null);
    expect(pleinEcran.actif()).toBeFalse();
  });

  it('cesse d ecouter le document une fois la vue detruite', () => {
    const pleinEcran = creer();

    detruireLaVue();
    signalerLeChangement(document.documentElement);

    expect(pleinEcran.actif()).toBeFalse();
  });

  it('n ecoute pas le document pendant le rendu serveur', () => {
    const ecoute = spyOn(document, 'addEventListener').and.callThrough();

    creer('server');

    expect(ecoute).not.toHaveBeenCalledWith('fullscreenchange', jasmine.any(Function));
  });
});
