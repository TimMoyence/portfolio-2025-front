import { PLATFORM_ID } from '@angular/core';
import { isolateAnimReady } from '../../../testing/anim-ready';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { PrivacyComponent } from './privacy.component';

const DONNEES_NOMMEES: readonly (readonly [string, readonly string[]])[] = [
  [
    'l adresse IP, le user-agent et le referer qu enregistrent le message de contact, la demande d audit et le choix de cookies',
    [
      'Données de contact : les informations que vous nous transmettez via le formulaire.',
      "Données techniques de la demande : l'adresse IP, le navigateur (user-agent) et la page de provenance (referer), enregistrés avec chaque message de contact, chaque demande d'audit et chaque choix de cookies.",
    ],
  ],
  [
    'ce que gardent le journal des connexions et la surveillance des requêtes suspectes',
    [
      "Données de sécurité : à chaque événement de connexion ou de sécurité de votre compte, réussi ou non, l'adresse IP, le navigateur (user-agent) et l'email saisi, inscrits au journal du serveur ; l'adresse IP et le navigateur d'une requête jugée suspecte.",
    ],
  ],
  [
    'le journal d accès du serveur, qui couvre chaque requête de tout visiteur',
    [
      "Journal d'accès : pour chaque requête adressée au serveur, l'adresse IP, le navigateur (user-agent) et la page de provenance (referer), inscrits au journal du serveur.",
    ],
  ],
  [
    'toutes les données du compte, téléphone et identifiant Google compris',
    [
      'Données de compte : prénom, nom, adresse email, téléphone (facultatif), mot de passe (chiffré) et, si vous vous connectez avec Google, votre identifiant Google.',
    ],
  ],
  [
    'les données des séances de cours, relevé des incidents compris',
    [
      "Données des séances de cours : le prénom, le nom et l'adresse email saisis pour rejoindre une séance ; vos réponses aux questions, avec leur durée, et aux sondages, vos productions, vos tentatives d'énigme, vos scores et votre progression par notion ; le relevé des incidents survenus pendant la séance (onglet masqué, fenêtre quittée, sortie du plein écran, tentative de copier ou de coller, raccourci bloqué, outils de développement soupçonnés, connexion perdue, réponse trop rapide), avec leur contexte.",
    ],
  ],
];

const FINALITES_NOMMEES: readonly (readonly [string, readonly string[]])[] = [
  [
    'ces données techniques : la sécurité et la preuve du choix de cookies',
    [
      'Protéger le site et vos comptes : repérer les connexions, les requêtes et les envois de formulaire suspects.',
      'Garder la preuve de votre choix de cookies.',
    ],
  ],
  [
    'le journal d accès et les données des séances',
    [
      "Suivre vos apprentissages pendant et après une séance de cours, et garantir l'intégrité d'une évaluation.",
      'Faire fonctionner le serveur et diagnostiquer ses pannes.',
    ],
  ],
];

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

  const texteNormalise = (element: Element | null): string =>
    (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

  for (const [donnees, textes] of DONNEES_NOMMEES) {
    it(`nomme ${donnees}`, () => {
      const collecte = texteNormalise(rendre().querySelector('#collecte'));

      for (const texte of textes) {
        expect(collecte).toContain(texte);
      }
    });
  }

  for (const [donnees, finalites] of FINALITES_NOMMEES) {
    it(`donne une finalité à ${donnees}`, () => {
      const usages = [...rendre().querySelectorAll('#usage li')].map(texteNormalise);

      expect(usages).toEqual(jasmine.arrayContaining([...finalites]));
    });
  }

  it('date la politique du jour où elle a nommé ces données', () => {
    expect(rendre().textContent).toContain('Dernière mise à jour : 16 octobre 2026');
  });
});
