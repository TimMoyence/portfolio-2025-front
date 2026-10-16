import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import type { MessageResponse } from '../../core/models/message.response';
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
    consentServiceStub.saveConsent.and.returnValue(of({ message: 'ok' }));
    consentServiceStub.withdrawConsent.and.returnValue(of({ message: 'ok' }));

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

  it('dit le succès sur toute réponse 2xx, sans lire de code recopié dans le corps', () => {
    const component = sauvegarderAvecReponse(
      of({ message: 'Cookie consent recorded successfully.' }),
    );

    expect(component.showSaved).toBeTrue();
    expect(component.statusMessage).toBe(component.actions.saved);
  });

  it('rend le succès et les boutons quand la réponse arrive après le clic', () => {
    const reponse = new Subject<MessageResponse>();
    consentServiceStub.saveConsent.and.returnValue(reponse);
    const fixture = rendre();
    const page = fixture.nativeElement as HTMLElement;
    fixture.componentInstance.savePreferences();
    fixture.detectChanges();

    reponse.next({ message: 'Cookie consent recorded successfully.' });
    reponse.complete();
    fixture.detectChanges();

    expect(page.querySelector('.ck-saved')?.classList).toContain('show');
    expect(
      Array.from(page.querySelectorAll('button')).every((bouton) => !bouton.disabled),
    ).toBeTrue();
  });

  it("devrait afficher le message d'erreur en cas d'erreur observable, et rendre les boutons", () => {
    const component = sauvegarderAvecReponse(throwError(() => new Error('network')));

    expect(component.statusMessage).toBe(component.actions.error);
    expect(component.isSaving).toBeFalse();
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
    consentServiceStub.saveConsent.and.returnValue(of({ message: 'ok' }));

    const component = rendre().componentInstance;
    expect(component.isSaving).toBeFalse();

    component.savePreferences();

    expect(component.isSaving).toBeFalse();
  });
});
