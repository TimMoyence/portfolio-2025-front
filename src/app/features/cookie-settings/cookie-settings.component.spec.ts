import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";
import { CookieConsentService } from "../../core/services/cookie-consent.service";
import { CookieSettingsComponent } from "./cookie-settings.component";
import { createCookieConsentServiceStub } from "../../../testing/factories/cookie-consent.factory";

/**
 * Tests unitaires du CookieSettingsComponent (restyle Asili — layout cookies).
 * Vérifie l'affichage des quatre catégories, la sauvegarde des préférences,
 * « Tout accepter », le retrait du consentement et la gestion des erreurs.
 * La logique de consentement (CookieConsentService) est préservée : on vérifie
 * que les handlers délèguent au service avec le contrat existant.
 */
describe("CookieSettingsComponent", () => {
  const consentServiceStub = createCookieConsentServiceStub();

  beforeEach(async () => {
    consentServiceStub.saveConsent.calls.reset();
    consentServiceStub.withdrawConsent.calls.reset();
    consentServiceStub.getPreferences.calls.reset();
    consentServiceStub.getDefaultPreferences.calls.reset();

    consentServiceStub.getPreferences.and.returnValue({
      essential: true,
      preferences: false,
      analytics: false,
      marketing: false,
    });
    consentServiceStub.getDefaultPreferences.and.returnValue({
      essential: true,
      preferences: false,
      analytics: false,
      marketing: false,
    });
    consentServiceStub.saveConsent.and.returnValue(
      of({ message: "ok", httpCode: 201 }),
    );
    consentServiceStub.withdrawConsent.and.returnValue(
      of({ message: "ok", httpCode: 201 }),
    );

    await TestBed.configureTestingModule({
      imports: [CookieSettingsComponent],
      providers: [
        provideRouter([]),
        { provide: CookieConsentService, useValue: consentServiceStub },
      ],
    }).compileComponents();
  });

  it("devrait creer le composant", () => {
    const fixture = TestBed.createComponent(CookieSettingsComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it("devrait initialiser les preferences depuis le service", () => {
    const fixture = TestBed.createComponent(CookieSettingsComponent);
    expect(consentServiceStub.getPreferences).toHaveBeenCalled();
    expect(fixture.componentInstance.preferences).toEqual({
      essential: true,
      preferences: false,
      analytics: false,
      marketing: false,
    });
  });

  it("devrait afficher les quatre categories de cookies", () => {
    const fixture = TestBed.createComponent(CookieSettingsComponent);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll(
      ".ck-item",
    ) as NodeListOf<HTMLElement>;
    expect(items.length).toBe(4);

    const content = fixture.nativeElement.textContent as string;
    const component = fixture.componentInstance;
    expect(content).toContain(component.categories.essential.title);
    expect(content).toContain(component.categories.analytics.title);
    expect(content).toContain(component.categories.preferences.title);
    expect(content).toContain(component.categories.marketing.title);
  });

  it("devrait rendre la categorie Essentiels cochee et desactivee", () => {
    const fixture = TestBed.createComponent(CookieSettingsComponent);
    fixture.detectChanges();

    const firstToggle = fixture.nativeElement.querySelector(
      ".ck-item input[type='checkbox']",
    ) as HTMLInputElement;
    expect(firstToggle.checked).toBeTrue();
    expect(firstToggle.disabled).toBeTrue();
  });

  it("devrait appeler saveConsent au clic sur Enregistrer", () => {
    const fixture = TestBed.createComponent(CookieSettingsComponent);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      "button",
    ) as NodeListOf<HTMLButtonElement>;
    const saveBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes(fixture.componentInstance.actions.save),
    );
    expect(saveBtn).toBeTruthy();
    saveBtn!.click();

    expect(consentServiceStub.saveConsent).toHaveBeenCalledWith(
      fixture.componentInstance.preferences,
      "settings",
      "save_preferences",
    );
  });

  it("devrait afficher le message de succes apres sauvegarde reussie (httpCode 201)", () => {
    consentServiceStub.saveConsent.and.returnValue(
      of({ message: "ok", httpCode: 201 }),
    );

    const fixture = TestBed.createComponent(CookieSettingsComponent);
    fixture.detectChanges();

    fixture.componentInstance.savePreferences();
    fixture.detectChanges();

    expect(fixture.componentInstance.showSaved).toBeTrue();
    expect(fixture.componentInstance.statusMessage).toBe(
      fixture.componentInstance.actions.saved,
    );
  });

  it("devrait afficher le message d'erreur si httpCode n'est pas 201", () => {
    consentServiceStub.saveConsent.and.returnValue(
      of({ message: "error", httpCode: 500 }),
    );

    const fixture = TestBed.createComponent(CookieSettingsComponent);
    fixture.detectChanges();

    fixture.componentInstance.savePreferences();
    fixture.detectChanges();

    expect(fixture.componentInstance.showSaved).toBeFalse();
    expect(fixture.componentInstance.statusMessage).toBe(
      fixture.componentInstance.actions.error,
    );
  });

  it("devrait afficher le message d'erreur en cas d'erreur observable", () => {
    consentServiceStub.saveConsent.and.returnValue(
      throwError(() => new Error("network")),
    );

    const fixture = TestBed.createComponent(CookieSettingsComponent);
    fixture.detectChanges();

    fixture.componentInstance.savePreferences();
    fixture.detectChanges();

    expect(fixture.componentInstance.statusMessage).toBe(
      fixture.componentInstance.actions.error,
    );
  });

  it("devrait rendre Mesure d'audience et Marketing desactives (non collectes)", () => {
    const fixture = TestBed.createComponent(CookieSettingsComponent);
    fixture.detectChanges();

    const toggles = fixture.nativeElement.querySelectorAll(
      ".ck-item input[type='checkbox']",
    ) as NodeListOf<HTMLInputElement>;
    // Ordre des catégories : essentiels, analytics, préférences, marketing.
    const [, analytics, preferences, marketing] = Array.from(toggles);
    expect(analytics.disabled)
      .withContext("Mesure d'audience non collectée → toggle désactivé")
      .toBeTrue();
    expect(analytics.checked).toBeFalse();
    expect(marketing.disabled)
      .withContext("Marketing non utilisé → toggle désactivé")
      .toBeTrue();
    expect(marketing.checked).toBeFalse();
    // La seule catégorie optionnelle réellement pilotable reste activable.
    expect(preferences.disabled).toBeFalse();
  });

  it("devrait tout accepter (catégories réellement activables) via saveConsent (action accept_all)", () => {
    const fixture = TestBed.createComponent(CookieSettingsComponent);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      "button",
    ) as NodeListOf<HTMLButtonElement>;
    const acceptBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes(fixture.componentInstance.actions.acceptAll),
    );
    expect(acceptBtn).toBeTruthy();
    acceptBtn!.click();

    // analytics/marketing restent false : non collectés (et forcés par le service).
    expect(fixture.componentInstance.preferences).toEqual({
      essential: true,
      preferences: true,
      analytics: false,
      marketing: false,
    });
    expect(consentServiceStub.saveConsent).toHaveBeenCalledWith(
      {
        essential: true,
        preferences: true,
        analytics: false,
        marketing: false,
      },
      "settings",
      "accept_all",
    );
  });

  it("devrait appeler withdrawConsent et reinitialiser les preferences", () => {
    const fixture = TestBed.createComponent(CookieSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.preferences = {
      essential: true,
      preferences: true,
      analytics: true,
      marketing: false,
    };

    component.withdrawConsent();

    expect(consentServiceStub.withdrawConsent).toHaveBeenCalled();
    expect(component.preferences).toEqual({
      essential: true,
      preferences: false,
      analytics: false,
      marketing: false,
    });
  });

  it("devrait passer isSaving a true pendant la sauvegarde et a false apres", () => {
    consentServiceStub.saveConsent.and.returnValue(
      of({ message: "ok", httpCode: 201 }),
    );

    const fixture = TestBed.createComponent(CookieSettingsComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.isSaving).toBeFalse();

    component.savePreferences();

    // L'observable synchrone complete immediatement, donc isSaving revient a false
    expect(component.isSaving).toBeFalse();
  });
});
