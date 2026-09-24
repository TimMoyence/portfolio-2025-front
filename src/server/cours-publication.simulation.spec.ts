import { melangeur } from '../testing/melangeur';
import { lastmodDeLaPage } from '../testing/sitemap-xml';
import { buildReponseDuCatalogue } from '../testing/factories/formation-catalogue.factory';
import {
  buildPageDuCoursB2,
  buildSeoMetadata,
  CHEMIN_DU_COURS_B2,
  SLUG_DU_COURS_B2,
} from '../testing/factories/seo-metadata.factory';
import { lecteurDePublicationsDeCours } from './cours-publication';
import { buildSitemapXml } from './seo-builders';

const GRAINE = 20260920;
const TIRAGES = 200;
const LECTURES_EN_CACHE = 300;
const CINQ_MINUTES = 300_000;
const LASTMOD_DU_FICHIER = '2026-09-19';
const JOUR = /^\d{4}-\d{2}-\d{2}$/;

type Tirage = {
  readonly nom: string;
  readonly apiBaseUrl: string | undefined;
  readonly repond: (publieLe: string) => Promise<Response>;
  readonly publie: boolean;
};

const TIRAGES_POSSIBLES: readonly Tirage[] = [
  {
    nom: 'publication lisible',
    apiBaseUrl: 'https://api.asilidesign.fr/api/v1/portfolio25',
    repond: (publieLe) => Promise.resolve(buildReponseDuCatalogue(publieLe)),
    publie: true,
  },
  {
    nom: 'publieLe absent',
    apiBaseUrl: 'https://api.asilidesign.fr/api/v1/portfolio25',
    repond: () => Promise.resolve(buildReponseDuCatalogue()),
    publie: false,
  },
  {
    nom: 'publieLe illisible',
    apiBaseUrl: 'https://api.asilidesign.fr/api/v1/portfolio25',
    repond: () => Promise.resolve(buildReponseDuCatalogue('la semaine prochaine')),
    publie: false,
  },
  {
    nom: 'erreur HTTP',
    apiBaseUrl: 'https://api.asilidesign.fr/api/v1/portfolio25',
    repond: () => Promise.resolve(new Response('', { status: 500 })),
    publie: false,
  },
  {
    nom: 'panne réseau',
    apiBaseUrl: 'https://api.asilidesign.fr/api/v1/portfolio25',
    repond: () => Promise.reject(new TypeError('Failed to fetch')),
    publie: false,
  },
  {
    nom: 'API non configurée',
    apiBaseUrl: undefined,
    repond: () => Promise.reject(new Error('jamais appelé')),
    publie: false,
  },
];

function jourDe(publieLe: string): string {
  return new Date(publieLe).toISOString().slice(0, 10);
}

describe('lastmod du cours servi par l API (H1, simulation)', () => {
  it(`garde un lastmod valide et jamais antérieur au fichier SEO sur ${TIRAGES} tirages`, async () => {
    const hasard = melangeur(GRAINE);
    const metadata = buildSeoMetadata([buildPageDuCoursB2(LASTMOD_DU_FICHIER)]);

    for (let tirage = 0; tirage < TIRAGES; tirage += 1) {
      const scenario = TIRAGES_POSSIBLES[Math.floor(hasard() * TIRAGES_POSSIBLES.length)];
      const decalageJours = Math.floor(hasard() * 800) - 400;
      const publieLe = new Date(
        Date.UTC(2026, 8, 19) + decalageJours * 86_400_000 + Math.floor(hasard() * 86_400_000),
      ).toISOString();
      const journal = jasmine.createSpyObj<Pick<Console, 'warn'>>('journal', ['warn']);
      const appels = jasmine
        .createSpy<typeof fetch>('fetch')
        .and.callFake(() => scenario.repond(publieLe));

      const publications = await lecteurDePublicationsDeCours({
        apiBaseUrl: scenario.apiBaseUrl,
        slugs: [SLUG_DU_COURS_B2],
        fetch: appels,
        journal,
      })();
      const lastmod =
        lastmodDeLaPage(
          buildSitemapXml(metadata, 'https://asilidesign.fr', [], publications),
          CHEMIN_DU_COURS_B2,
        ) ?? 'aucun lastmod';
      const attendu =
        scenario.publie && jourDe(publieLe) > LASTMOD_DU_FICHIER
          ? jourDe(publieLe)
          : LASTMOD_DU_FICHIER;

      expect(lastmod).withContext(`${scenario.nom} · publieLe ${publieLe}`).toBe(attendu);
      expect(lastmod).toMatch(JOUR);
      expect(lastmod >= LASTMOD_DU_FICHIER).toBeTrue();
      expect(appels.calls.count()).toBe(scenario.apiBaseUrl === undefined ? 0 : 1);
      expect(journal.warn.calls.count()).toBe(scenario.publie ? 0 : 1);
    }
  });

  it(`n interroge l API qu une fois par fenêtre de cinq minutes sur ${LECTURES_EN_CACHE} lectures`, async () => {
    const hasard = melangeur(GRAINE + 1);
    const journal = jasmine.createSpyObj<Pick<Console, 'warn'>>('journal', ['warn']);
    const appels = jasmine
      .createSpy<typeof fetch>('fetch')
      .and.callFake(() => Promise.resolve(buildReponseDuCatalogue('2026-10-02T08:15:00.000Z')));
    let horloge = Date.UTC(2026, 9, 2);
    const lire = lecteurDePublicationsDeCours({
      apiBaseUrl: 'https://api.asilidesign.fr/api/v1/portfolio25',
      slugs: [SLUG_DU_COURS_B2],
      fetch: appels,
      journal,
      maintenant: () => horloge,
    });

    let expire = -Infinity;
    let attendus = 0;
    for (let lecture = 0; lecture < LECTURES_EN_CACHE; lecture += 1) {
      horloge += Math.floor(hasard() * 4 * CINQ_MINUTES);
      if (expire <= horloge) {
        attendus += 1;
        expire = horloge + CINQ_MINUTES;
      }

      const publications = await lire();

      expect(publications).toEqual([
        { chemin: CHEMIN_DU_COURS_B2, publieLe: '2026-10-02T08:15:00.000Z' },
      ]);
      expect(appels.calls.count()).withContext(`lecture ${lecture}`).toBe(attendus);
    }

    expect(attendus).toBeGreaterThan(1);
    expect(attendus).toBeLessThan(LECTURES_EN_CACHE);
    expect(journal.warn).not.toHaveBeenCalled();
  });
});
