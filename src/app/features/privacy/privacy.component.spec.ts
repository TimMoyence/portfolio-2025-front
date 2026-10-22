import { LOCALE_ID, PLATFORM_ID } from '@angular/core';
import { LIBELLES_DES_INCIDENTS } from '../../core/models/libelles-des-incidents';
import { isolateAnimReady } from '../../../testing/anim-ready';
import { setupTestBed } from '../../../testing/setup-test-bed';
import { PrivacyComponent } from './privacy.component';

const DONNEES_NOMMEES: readonly (readonly [string, readonly string[]])[] = [
  [
    'l adresse IP, le user-agent et le referer qu enregistrent le message de contact et la demande d audit',
    [
      'Données de contact : les informations que vous nous transmettez via le formulaire.',
      "Données techniques de la demande : l'adresse IP, le navigateur (user-agent) et la page de provenance (referer), enregistrés avec chaque message de contact et chaque demande d'audit.",
    ],
  ],
  [
    'ce que gardent le journal des connexions, sans l email en clair, et la surveillance des requêtes suspectes',
    [
      "Données de sécurité : à chaque événement de connexion ou de sécurité de votre compte, réussi ou non, l'adresse IP, le navigateur (user-agent) et une empreinte non réversible de l'email saisi, inscrits au journal du serveur ; l'adresse IP et le navigateur d'une requête jugée suspecte.",
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
      "Données des séances de cours : le prénom, le nom et l'adresse email saisis pour rejoindre une séance ; vos réponses aux questions, avec leur durée, et aux sondages, vos productions, vos tentatives d'énigme, vos scores et votre progression par notion ; le relevé des incidents survenus pendant la séance (onglet masqué, fenêtre quittée, tentative de copier, tentative de coller, menu contextuel ouvert, raccourci bloqué, outils de développement soupçonnés, page quittée ou rechargée, réponse trop rapide), avec leur heure et leur contexte, que le formateur voit dans la synthèse de la séance.",
    ],
  ],
];

const FINALITES_NOMMEES: readonly (readonly [string, readonly string[]])[] = [
  [
    'ces données techniques : la sécurité',
    [
      'Protéger le site et vos comptes : repérer les connexions, les requêtes et les envois de formulaire suspects.',
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
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: LOCALE_ID, useValue: 'fr' },
      ],
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

  it('ne fonde plus le consentement sur une newsletter, que le site n envoie plus (LEG-05)', () => {
    expect(texteNormalise(rendre().querySelector('#base p'))).toBe(
      "Le traitement repose, selon les cas, sur l'exécution d'un contrat (votre achat), votre consentement (toolkit), ou notre intérêt légitime (sécurité et bon fonctionnement du site).",
    );
  });

  it('n annonce aucune statistique de navigation, que le site ne collecte pas', () => {
    const page = rendre();

    expect(texteNormalise(page.querySelector('#collecte'))).toContain(
      "Mesure d'audience : aucune pour l'instant, le site ne collecte aucune statistique de navigation.",
    );
    expect(texteNormalise(page)).not.toContain('statistiques de navigation anonymisées');
    expect([...page.querySelectorAll('#usage li')].map(texteNormalise)).not.toContain(
      'Améliorer le site, de façon agrégée et anonyme.',
    );
    expect(texteNormalise(page.querySelector('#base'))).not.toContain('amélioration du site');
  });

  it('nomme chaque type d incident que le poste consigne, et aucun autre', () => {
    const collecte = texteNormalise(rendre().querySelector('#collecte'));
    const releve = /incidents survenus pendant la séance \(([^)]*)\)/u.exec(collecte)?.[1] ?? '';

    expect(releve.split(', ')).toEqual(Object.values(LIBELLES_DES_INCIDENTS));
  });

  it('date la politique du jour où elle a nommé ces données', () => {
    expect(rendre().textContent).toContain('Dernière mise à jour : 22 octobre 2026');
  });

  it('nomme chaque cookie et stockage local du poste, sans choix à proposer', () => {
    const cookies = rendre().querySelector('#cookies');

    expect([...(cookies?.querySelectorAll('li strong') ?? [])].map(texteNormalise)).toEqual([
      'Session du compte',
      'Séance de cours',
      "Bandeau d'information",
    ]);
    expect(texteNormalise(cookies)).toContain('ils ne demandent donc pas votre consentement');
  });
});
