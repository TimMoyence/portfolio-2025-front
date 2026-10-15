import { PLATFORM_ID } from '@angular/core';
import { isolateAnimReady } from '../../../testing/anim-ready';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { PrivacyComponent } from './privacy.component';

describe('PrivacyComponent', () => {
  isolateAnimReady();

  function rendre(): HTMLElement {
    const fixture = setupTestBed({
      http: false,
      router: true,
      imports: [PrivacyComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    }).createComponent(PrivacyComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('nomme l adresse IP, le user-agent et le referer que consigne le formulaire de contact', () => {
    const collecte = rendre().querySelector('#collecte')?.textContent?.replace(/\s+/g, ' ') ?? '';

    expect(collecte).toContain(
      "Données de contact : les informations que vous nous transmettez via le formulaire, ainsi que l'adresse IP, le navigateur (user-agent) et la page de provenance (referer) de l'envoi.",
    );
  });

  it('date la politique du jour où elle a nommé ces données', () => {
    expect(rendre().textContent).toContain('Dernière mise à jour : 15 octobre 2026');
  });
});
