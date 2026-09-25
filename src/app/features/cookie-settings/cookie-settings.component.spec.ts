import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CookieConsentService } from '../../core/services/cookie-consent.service';
import { CookieSettingsComponent } from './cookie-settings.component';
import {
  buildCookiePreferences,
  createCookieConsentServiceStub,
} from '../../../testing/factories/cookie-consent.factory';

describe('CookieSettingsComponent', () => {
  const consentServiceStub = createCookieConsentServiceStub();

  beforeEach(async () => {
    consentServiceStub.saveConsent.calls.reset();
    consentServiceStub.withdrawConsent.calls.reset();
    consentServiceStub.getPreferences.calls.reset();
    consentServiceStub.getDefaultPreferences.calls.reset();

    consentServiceStub.getPreferences.and.returnValue(buildCookiePreferences());
    consentServiceStub.getDefaultPreferences.and.returnValue(buildCookiePreferences());
    consentServiceStub.saveConsent.and.returnValue(of({ message: 'ok', httpCode: 201 }));
    consentServiceStub.withdrawConsent.and.returnValue(of({ message: 'ok', httpCode: 201 }));

    await TestBed.configureTestingModule({
      imports: [CookieSettingsComponent],
      providers: [
        provideRouter([]),
        { provide: CookieConsentService, useValue: consentServiceStub },
      ],
    }).compileComponents();
  });

  function rendre(): ComponentFixture<CookieSettingsComponent> {
    const fixture = TestBed.createComponent(CookieSettingsComponent);
    fixture.detectChanges();
    return fixture;
  }

  function cliquerSurAction(action: 'save' | 'acceptAll'): CookieSettingsComponent {
    const fixture = rendre();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    const bouton = Array.from(buttons).find((btn) =>
      btn.textContent?.includes(fixture.componentInstance.actions[action]),
    );
    expect(bouton).toBeTruthy();
    bouton!.click();
    return fixture.componentInstance;
  }

  function sauvegarderAvecReponse(
    reponse: ReturnType<CookieConsentService['saveConsent']>,
  ): CookieSettingsComponent {
    consentServiceStub.saveConsent.and.returnValue(reponse);
    const fixture = rendre();
    fixture.componentInstance.savePreferences();
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('devrait creer le composant', () => {
    const fixture = TestBed.createComponent(CookieSettingsComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('devrait initialiser les preferences depuis le service', () => {
    const fixture = TestBed.createComponent(CookieSettingsComponent);
    expect(consentServiceStub.getPreferences).toHaveBeenCalled();
    expect(fixture.componentInstance.preferences).toEqual(buildCookiePreferences());
  });

  it('devrait afficher les quatre categories de cookies', () => {
    const fixture = rendre();

    const items = fixture.nativeElement.querySelectorAll('.ck-item') as NodeListOf<HTMLElement>;
    expect(items.length).toBe(4);

    const content = fixture.nativeElement.textContent as string;
    const component = fixture.componentInstance;
    expect(content).toContain(component.categories.essential.title);
    expect(content).toContain(component.categories.analytics.title);
    expect(content).toContain(component.categories.preferences.title);
    expect(content).toContain(component.categories.marketing.title);
  });

  it('devrait rendre la categorie Essentiels cochee et desactivee', () => {
    const firstToggle = rendre().nativeElement.querySelector(
      ".ck-item input[type='checkbox']",
    ) as HTMLInputElement;
    expect(firstToggle.checked).toBeTrue();
    expect(firstToggle.disabled).toBeTrue();
  });

  it('devrait appeler saveConsent au clic sur Enregistrer', () => {
    const component = cliquerSurAction('save');

    expect(consentServiceStub.saveConsent).toHaveBeenCalledWith(
      component.preferences,
      'settings',
      'save_preferences',
    );
  });

  it('devrait afficher le message de succes apres sauvegarde reussie (httpCode 201)', () => {
    const component = sauvegarderAvecReponse(of({ message: 'ok', httpCode: 201 }));

    expect(component.showSaved).toBeTrue();
    expect(component.statusMessage).toBe(component.actions.saved);
  });

  it("devrait afficher le message d'erreur si httpCode n'est pas 201", () => {
    const component = sauvegarderAvecReponse(of({ message: 'error', httpCode: 500 }));

    expect(component.showSaved).toBeFalse();
    expect(component.statusMessage).toBe(component.actions.error);
  });

  it("devrait afficher le message d'erreur en cas d'erreur observable", () => {
    const component = sauvegarderAvecReponse(throwError(() => new Error('network')));

    expect(component.statusMessage).toBe(component.actions.error);
  });

  it("devrait rendre Mesure d'audience et Marketing desactives (non collectes)", () => {
    const toggles = rendre().nativeElement.querySelectorAll(
      ".ck-item input[type='checkbox']",
    ) as NodeListOf<HTMLInputElement>;
    const [, analytics, preferences, marketing] = Array.from(toggles);
    expect(analytics.disabled)
      .withContext("Mesure d'audience non collectée → toggle désactivé")
      .toBeTrue();
    expect(analytics.checked).toBeFalse();
    expect(marketing.disabled).withContext('Marketing non utilisé → toggle désactivé').toBeTrue();
    expect(marketing.checked).toBeFalse();
    expect(preferences.disabled).toBeFalse();
  });

  it('devrait tout accepter (catégories réellement activables) via saveConsent (action accept_all)', () => {
    const component = cliquerSurAction('acceptAll');
    const toutAccepte = buildCookiePreferences({ preferences: true });

    expect(component.preferences).toEqual(toutAccepte);
    expect(consentServiceStub.saveConsent).toHaveBeenCalledWith(
      toutAccepte,
      'settings',
      'accept_all',
    );
  });

  it('devrait appeler withdrawConsent et reinitialiser les preferences', () => {
    const component = rendre().componentInstance;

    component.preferences = buildCookiePreferences({ preferences: true, analytics: true });

    component.withdrawConsent();

    expect(consentServiceStub.withdrawConsent).toHaveBeenCalled();
    expect(component.preferences).toEqual(buildCookiePreferences());
  });

  it('devrait passer isSaving a true pendant la sauvegarde et a false apres', () => {
    consentServiceStub.saveConsent.and.returnValue(of({ message: 'ok', httpCode: 201 }));

    const component = rendre().componentInstance;
    expect(component.isSaving).toBeFalse();

    component.savePreferences();

    expect(component.isSaving).toBeFalse();
  });
});
