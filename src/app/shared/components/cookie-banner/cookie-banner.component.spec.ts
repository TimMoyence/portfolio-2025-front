import { TestBed } from "@angular/core/testing";
import { RouterModule } from "@angular/router";
import { of } from "rxjs";
import { CookieConsentService } from "../../../core/services/cookie-consent.service";
import { CookieBannerComponent } from "./cookie-banner.component";
import { createCookieConsentServiceStub } from "../../../../testing/factories/cookie-consent.factory";

/**
 * Tests unitaires du CookieBannerComponent.
 * Verifie la logique de visibilite, les actions d'acceptation,
 * et le nettoyage de la souscription a la destruction.
 */
describe("CookieBannerComponent", () => {
  const consentServiceStub = createCookieConsentServiceStub();

  beforeEach(async () => {
    consentServiceStub.shouldShowBanner.calls.reset();
    consentServiceStub.saveConsent.calls.reset();

    consentServiceStub.shouldShowBanner.and.returnValue(false);
    consentServiceStub.saveConsent.and.returnValue(
      of({ message: "ok", httpCode: 201 }),
    );

    await TestBed.configureTestingModule({
      imports: [CookieBannerComponent, RouterModule.forRoot([])],
      providers: [
        { provide: CookieConsentService, useValue: consentServiceStub },
      ],
    }).compileComponents();
  });

  it("devrait creer le composant", () => {
    const fixture = TestBed.createComponent(CookieBannerComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it("devrait etre visible quand shouldShowBanner retourne true", () => {
    consentServiceStub.shouldShowBanner.and.returnValue(true);

    const fixture = TestBed.createComponent(CookieBannerComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isVisible).toBeTrue();
    const bannerEl = fixture.nativeElement.querySelector(
      ".cookie-banner",
    ) as HTMLElement | null;
    expect(bannerEl).toBeTruthy();
  });

  it("devrait etre masque quand shouldShowBanner retourne false", () => {
    consentServiceStub.shouldShowBanner.and.returnValue(false);

    const fixture = TestBed.createComponent(CookieBannerComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.isVisible).toBeFalse();
    const bannerEl = fixture.nativeElement.querySelector(
      ".cookie-banner",
    ) as HTMLElement | null;
    expect(bannerEl).toBeNull();
  });

  it("devrait appeler acceptAll au clic sur Tout accepter", () => {
    consentServiceStub.shouldShowBanner.and.returnValue(true);

    const fixture = TestBed.createComponent(CookieBannerComponent);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      "button",
    ) as NodeListOf<HTMLButtonElement>;
    const acceptAllBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes(fixture.componentInstance.content.acceptAll),
    );
    expect(acceptAllBtn).toBeTruthy();
    acceptAllBtn!.click();

    expect(consentServiceStub.saveConsent).toHaveBeenCalledWith(
      {
        essential: true,
        preferences: true,
        analytics: false,
        marketing: false,
      },
      "banner",
      "accept_all",
    );
  });

  it("devrait appeler acceptEssentialOnly au clic sur Essentiels uniquement", () => {
    consentServiceStub.shouldShowBanner.and.returnValue(true);

    const fixture = TestBed.createComponent(CookieBannerComponent);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      "button",
    ) as NodeListOf<HTMLButtonElement>;
    const essentialBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes(
        fixture.componentInstance.content.essentialOnly,
      ),
    );
    expect(essentialBtn).toBeTruthy();
    essentialBtn!.click();

    expect(consentServiceStub.saveConsent).toHaveBeenCalledWith(
      {
        essential: true,
        preferences: false,
        analytics: false,
        marketing: false,
      },
      "banner",
      "essential_only",
    );
  });

  it("devrait ne plus reagir aux changements apres destruction", () => {
    consentServiceStub.shouldShowBanner.and.returnValue(true);

    const fixture = TestBed.createComponent(CookieBannerComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.isVisible).toBeTrue();

    fixture.destroy();

    consentServiceStub.shouldShowBanner.and.returnValue(false);
    consentServiceStub.consentChanges$.next(null);

    // Apres destruction, isVisible ne devrait plus etre mis a jour
    expect(fixture.componentInstance.isVisible).toBeTrue();
  });

  it("devrait mettre a jour la visibilite lors d'un changement de consentement", () => {
    consentServiceStub.shouldShowBanner.and.returnValue(true);

    const fixture = TestBed.createComponent(CookieBannerComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.isVisible).toBeTrue();

    consentServiceStub.shouldShowBanner.and.returnValue(false);
    consentServiceStub.consentChanges$.next(null);

    expect(fixture.componentInstance.isVisible).toBeFalse();
  });
});
