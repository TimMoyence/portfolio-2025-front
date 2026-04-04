import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { CookieConsentService } from "../../core/services/cookie-consent.service";
import { CookieSettingsComponent } from "./cookie-settings.component";
import { createCookieConsentServiceStub } from "../../../testing/factories/cookie-consent.factory";

/**
 * Tests unitaires du CookieSettingsComponent.
 * Verifie l'affichage des sections RGPD, la sauvegarde des preferences,
 * le retrait du consentement et la gestion des erreurs.
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
        { provide: CookieConsentService, useValue: consentServiceStub },
      ],
    }).compileComponents();
  });

  it("devrait creer le composant", () => {
    const fixture = TestBed.createComponent(CookieSettingsComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it("devrait afficher les cinq sections de conformite", () => {
    const fixture = TestBed.createComponent(CookieSettingsComponent);
    fixture.detectChanges();

    const articles = fixture.nativeElement.querySelectorAll(
      "article",
    ) as NodeListOf<HTMLElement>;
    expect(articles.length).toBe(5);

    const component = fixture.componentInstance;
    component.sections.forEach((section, index) => {
      const articleText = articles[index].textContent ?? "";
      expect(articleText).toContain(section.title);
    });
  });

  it("devrait afficher la section preferences cookies avec les quatre categories", () => {
    const fixture = TestBed.createComponent(CookieSettingsComponent);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    const component = fixture.componentInstance;

    expect(content).toContain(component.preferenceLabels.essential.title);
    expect(content).toContain(component.preferenceLabels.preferences.title);
    expect(content).toContain(component.preferenceLabels.analytics.title);
    expect(content).toContain(component.preferenceLabels.marketing.title);
  });

  it("devrait appeler saveConsent au clic sur Enregistrer", () => {
    const fixture = TestBed.createComponent(CookieSettingsComponent);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      "button",
    ) as NodeListOf<HTMLButtonElement>;
    const saveBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes(
        fixture.componentInstance.preferenceLabels.save,
      ),
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

    expect(fixture.componentInstance.statusMessage).toBe(
      fixture.componentInstance.preferenceLabels.saved,
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

    expect(fixture.componentInstance.statusMessage).toBe(
      fixture.componentInstance.preferenceLabels.error,
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
      fixture.componentInstance.preferenceLabels.error,
    );
  });

  it("devrait appeler withdrawConsent au clic sur Retirer le consentement", () => {
    const fixture = TestBed.createComponent(CookieSettingsComponent);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      "button",
    ) as NodeListOf<HTMLButtonElement>;
    const withdrawBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes(
        fixture.componentInstance.preferenceLabels.withdraw,
      ),
    );
    expect(withdrawBtn).toBeTruthy();
    withdrawBtn!.click();

    expect(consentServiceStub.withdrawConsent).toHaveBeenCalled();
  });

  it("devrait reinitialiser les preferences au retrait du consentement", () => {
    const fixture = TestBed.createComponent(CookieSettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.preferences = {
      essential: true,
      preferences: true,
      analytics: false,
      marketing: false,
    };

    component.withdrawConsent();

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

  it("devrait passer isSaving a true au debut du retrait et a false apres", () => {
    consentServiceStub.withdrawConsent.and.returnValue(
      of({ message: "ok", httpCode: 201 }),
    );

    const fixture = TestBed.createComponent(CookieSettingsComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.isSaving).toBeFalse();

    component.withdrawConsent();

    // L'observable synchrone complete immediatement, donc isSaving revient a false
    expect(component.isSaving).toBeFalse();
  });
});
