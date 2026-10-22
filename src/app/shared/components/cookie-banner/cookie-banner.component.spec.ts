import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { readJson, removeKey, writeJson } from '../../../../cours/runtime/core/storage';
import { VERSIONS_DES_TEXTES_LEGAUX } from '../../../core/config/textes-legaux';
import { CLE_DU_BANDEAU_LU, CookieBannerComponent } from './cookie-banner.component';

describe('CookieBannerComponent', () => {
  function monter(plateforme: 'browser' | 'server' = 'browser') {
    TestBed.configureTestingModule({
      imports: [CookieBannerComponent],
      providers: [provideRouter([]), { provide: PLATFORM_ID, useValue: plateforme }],
    });
    const fixture = TestBed.createComponent(CookieBannerComponent);
    fixture.detectChanges();
    return fixture;
  }

  const bandeau = (racine: HTMLElement) => racine.querySelector('.cookie-banner');

  beforeEach(() => {
    removeKey(CLE_DU_BANDEAU_LU);
  });

  it('informe sans demander de choix : un seul bouton, aucun refus ni acceptation', () => {
    const racine = monter().nativeElement as HTMLElement;

    expect(bandeau(racine)?.textContent).toContain('strictement nécessaires');
    expect(racine.querySelectorAll('button').length).toBe(1);
  });

  it('se ferme sur « J’ai compris » et retient la version de la politique lue', () => {
    const fixture = monter();
    const racine = fixture.nativeElement as HTMLElement;

    (racine.querySelector('[data-testid="bandeau-cookies-compris"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(bandeau(racine)).toBeNull();
    expect(readJson<string>(CLE_DU_BANDEAU_LU)).toBe(VERSIONS_DES_TEXTES_LEGAUX.confidentialite);
  });

  it('ne revient pas tant que la politique n’a pas changé', () => {
    writeJson(CLE_DU_BANDEAU_LU, VERSIONS_DES_TEXTES_LEGAUX.confidentialite);

    expect(bandeau(monter().nativeElement as HTMLElement)).toBeNull();
  });

  it('revient quand la politique a changé depuis la dernière lecture', () => {
    writeJson(CLE_DU_BANDEAU_LU, '2000-01-01');

    expect(bandeau(monter().nativeElement as HTMLElement)).not.toBeNull();
  });

  it('ne rend rien côté serveur', () => {
    expect(bandeau(monter('server').nativeElement as HTMLElement)).toBeNull();
  });
});
