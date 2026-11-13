import { LOCALE_ID } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { VERSIONS_DES_TEXTES_LEGAUX } from '../../../../core/config/textes-legaux';
import { NEWSLETTER_PORT } from '../../../../core/ports/newsletter.port';
import {
  createNewsletterPortStub,
  MESSAGE_D_ABONNEMENT,
} from '../../../../../testing/factories/newsletter.factory';
import { refusDuBack } from '../../../../../testing/factories/serveur/probleme-http.factory';
import { setupTestBed } from '../../../../../testing/setup-test-bed';
import { NewsletterFormComponent } from './newsletter-form.component';

async function monter(
  port: ReturnType<typeof createNewsletterPortStub>,
  localeId: string,
): Promise<ComponentFixture<NewsletterFormComponent>> {
  await setupTestBed({
    http: false,
    router: true,
    imports: [NewsletterFormComponent],
    providers: [
      { provide: NEWSLETTER_PORT, useValue: port },
      { provide: LOCALE_ID, useValue: localeId },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(NewsletterFormComponent);
  fixture.detectChanges();
  return fixture;
}

function element<T extends HTMLElement>(hote: HTMLElement, selecteur: string): T {
  const trouve = hote.querySelector<T>(selecteur);
  if (trouve === null) throw new Error(`absent : ${selecteur}`);
  return trouve;
}

function saisirLAdresse(hote: HTMLElement, adresse: string): void {
  const champ = element<HTMLInputElement>(hote, 'input[type="email"]');
  champ.value = adresse;
  champ.dispatchEvent(new Event('input'));
}

function cocher(hote: HTMLElement, selecteur: string): void {
  element<HTMLInputElement>(hote, selecteur).click();
}

async function sAbonner(fixture: ComponentFixture<NewsletterFormComponent>): Promise<void> {
  fixture.detectChanges();
  element<HTMLButtonElement>(fixture.nativeElement, 'button[type="submit"]').click();
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('NewsletterFormComponent', () => {
  it('NL-01 NL-19 · s abonne dans la langue cochee et affiche le message de tous', async () => {
    const port = createNewsletterPortStub();
    const fixture = await monter(port, 'fr');
    const hote = fixture.nativeElement as HTMLElement;
    const langueDeLaPage = element<HTMLInputElement>(
      hote,
      'input[name="langue"][value="fr"]',
    ).checked;

    saisirLAdresse(hote, ' jane@mail.com ');
    cocher(hote, 'input[name="langue"][value="en"]');
    cocher(hote, '[data-newsletter-consentement]');
    await sAbonner(fixture);

    expect(langueDeLaPage).toBeTrue();
    expect(port.sAbonner.calls.allArgs()).toEqual([
      [
        jasmine.objectContaining({
          email: 'jane@mail.com',
          locale: 'en',
          termsVersion: VERSIONS_DES_TEXTES_LEGAUX.confidentialite,
          website: '',
        }),
      ],
    ]);
    expect(element(hote, '[data-newsletter-succes]').textContent?.trim()).toBe(
      MESSAGE_D_ABONNEMENT,
    );
  });

  it('NL-01 · coche la langue de la page anglaise et garde le bouton inactif sans le consentement', async () => {
    const port = createNewsletterPortStub();
    const fixture = await monter(port, 'en-US');
    const hote = fixture.nativeElement as HTMLElement;

    saisirLAdresse(hote, 'jane@mail.com');
    fixture.detectChanges();

    expect(element<HTMLInputElement>(hote, 'input[name="langue"][value="en"]').checked).toBeTrue();
    expect(element<HTMLButtonElement>(hote, 'button[type="submit"]').disabled).toBeTrue();
    expect(port.sAbonner).not.toHaveBeenCalled();
  });

  it('NL-01 · dit l echec et laisse le formulaire pour reessayer', async () => {
    const port = createNewsletterPortStub();
    port.sAbonner.and.returnValue(throwError(() => refusDuBack(429)));
    const fixture = await monter(port, 'fr');
    const hote = fixture.nativeElement as HTMLElement;

    saisirLAdresse(hote, 'jane@mail.com');
    cocher(hote, '[data-newsletter-consentement]');
    await sAbonner(fixture);

    expect(element(hote, '[data-newsletter-erreur]').textContent?.trim()).not.toBe('');
    expect(element<HTMLInputElement>(hote, 'input[type="email"]').value).toBe('jane@mail.com');
  });
});
