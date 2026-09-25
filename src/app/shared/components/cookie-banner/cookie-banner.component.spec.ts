import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { CookieConsentService } from '../../../core/services/cookie-consent.service';
import { CookieBannerComponent } from './cookie-banner.component';
import {
  buildCookiePreferences,
  createCookieConsentServiceStub,
} from '../../../../testing/factories/cookie-consent.factory';

describe('CookieBannerComponent', () => {
  const consentServiceStub = createCookieConsentServiceStub();

  beforeEach(async () => {
    consentServiceStub.shouldShowBanner.calls.reset();
    consentServiceStub.saveConsent.calls.reset();

    consentServiceStub.shouldShowBanner.and.returnValue(false);
    consentServiceStub.saveConsent.and.returnValue(of({ message: 'ok', httpCode: 201 }));

    await TestBed.configureTestingModule({
      imports: [CookieBannerComponent, RouterModule.forRoot([])],
      providers: [{ provide: CookieConsentService, useValue: consentServiceStub }],
    }).compileComponents();
  });

  it('devrait creer le composant', () => {
    const fixture = TestBed.createComponent(CookieBannerComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('devrait etre visible quand shouldShowBanner retourne true', () => {
    consentServiceStub.shouldShowBanner.and.returnValue(true);

    const fixture = TestBed.createComponent(CookieBannerComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isVisible).toBeTrue();
    const bannerEl = fixture.nativeElement.querySelector('.cookie-banner') as HTMLElement | null;
    expect(bannerEl).toBeTruthy();
  });

  it('devrait etre masque quand shouldShowBanner retourne false', () => {
    consentServiceStub.shouldShowBanner.and.returnValue(false);

    const fixture = TestBed.createComponent(CookieBannerComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.isVisible).toBeFalse();
    const bannerEl = fixture.nativeElement.querySelector('.cookie-banner') as HTMLElement | null;
    expect(bannerEl).toBeNull();
  });

  function cliquerSur(libelle: 'acceptAll' | 'rejectAll'): void {
    consentServiceStub.shouldShowBanner.and.returnValue(true);
    const fixture = TestBed.createComponent(CookieBannerComponent);
    fixture.detectChanges();

    const boutons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
    const bouton = Array.from(boutons).find((btn) =>
      btn.textContent?.includes(fixture.componentInstance.content[libelle]),
    );
    expect(bouton).toBeTruthy();
    bouton!.click();
  }

  it('devrait appeler acceptAll au clic sur Tout accepter', () => {
    cliquerSur('acceptAll');

    expect(consentServiceStub.saveConsent).toHaveBeenCalledWith(
      buildCookiePreferences({ preferences: true }),
      'banner',
      'accept_all',
    );
  });

  it('devrait appeler rejectAll au clic sur Tout refuser (CNIL compliant)', () => {
    cliquerSur('rejectAll');

    expect(consentServiceStub.saveConsent).toHaveBeenCalledWith(
      buildCookiePreferences(),
      'banner',
      'essential_only',
    );
  });

  function rendreVisible(): ComponentFixture<CookieBannerComponent> {
    consentServiceStub.shouldShowBanner.and.returnValue(true);
    const fixture = TestBed.createComponent(CookieBannerComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.isVisible).toBeTrue();
    return fixture;
  }

  function masquerParUnChangementDeConsentement(): void {
    consentServiceStub.shouldShowBanner.and.returnValue(false);
    consentServiceStub.consentChanges$.next(null);
  }

  it('devrait ne plus reagir aux changements apres destruction', () => {
    const fixture = rendreVisible();

    fixture.destroy();
    masquerParUnChangementDeConsentement();

    expect(fixture.componentInstance.isVisible).toBeTrue();
  });

  it("devrait mettre a jour la visibilite lors d'un changement de consentement", () => {
    const fixture = rendreVisible();

    masquerParUnChangementDeConsentement();

    expect(fixture.componentInstance.isVisible).toBeFalse();
  });
});
