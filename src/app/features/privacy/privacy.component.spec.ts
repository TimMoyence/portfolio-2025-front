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

  it('nomme l adresse IP, le user-agent et le referer qu enregistrent le message de contact, la demande d audit et le choix de cookies', () => {
    const collecte = rendre().querySelector('#collecte')?.textContent?.replace(/\s+/g, ' ') ?? '';

    expect(collecte).toContain(
      'Données de contact : les informations que vous nous transmettez via le formulaire.',
    );
    expect(collecte).toContain(
      "Données techniques de la demande : l'adresse IP, le navigateur (user-agent) et la page de provenance (referer), enregistrés avec chaque message de contact, chaque demande d'audit et chaque choix de cookies.",
    );
  });

  it('nomme ce que gardent le journal des connexions et la surveillance des requêtes suspectes', () => {
    const collecte = rendre().querySelector('#collecte')?.textContent?.replace(/\s+/g, ' ') ?? '';

    expect(collecte).toContain(
      "Données de sécurité : à chaque événement de connexion ou de sécurité de votre compte, réussi ou non, l'adresse IP, le navigateur (user-agent) et l'email saisi, inscrits au journal du serveur ; l'adresse IP et le navigateur d'une requête jugée suspecte.",
    );
  });

  it('donne une finalité à ces données techniques : la sécurité et la preuve du choix de cookies', () => {
    const usages = [...rendre().querySelectorAll('#usage li')].map((item) =>
      (item.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );

    expect(usages).toEqual(
      jasmine.arrayContaining([
        'Protéger le site et vos comptes : repérer les connexions, les requêtes et les envois de formulaire suspects.',
        'Garder la preuve de votre choix de cookies.',
      ]),
    );
  });

  it('date la politique du jour où elle a nommé ces données', () => {
    expect(rendre().textContent).toContain('Dernière mise à jour : 15 octobre 2026');
  });
});
