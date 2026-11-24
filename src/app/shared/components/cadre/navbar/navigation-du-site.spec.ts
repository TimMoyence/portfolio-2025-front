import { METADONNEES_DU_SITE } from '../../../../core/seo/site-servi';
import { type BlocJsonLd, jsonLdDeLaPage } from '../../../../core/seo/json-ld';
import type { SeoMetadataFile } from '../../../../core/seo/seo-metadata.model';
import {
  buildPageSeoFr,
  buildSeoMetadata,
} from '../../../../../testing/factories/seo-metadata.factory';
import { navbarMontee } from '../../../../../testing/page/navbar-montee';
import { texteDe } from '../../../../../testing/texte/textes-dom';

const LIENS_DU_MENU =
  '.asili-nav__links .asili-nav__link[href], .asili-nav__links .asili-drop-item[href], .asili-nav__links .asili-nav__cta[href]';

const navigationDuSite = (
  langue: string,
  metadonnees: SeoMetadataFile = METADONNEES_DU_SITE,
): BlocJsonLd | undefined =>
  jsonLdDeLaPage(metadonnees, langue).find((bloc) => bloc['@type'] === 'SiteNavigationElement');

const cheminDe = (url: string): string => new URL(url, 'https://asilidesign.fr').pathname;

describe('SEO-4 · la navigation du site reprend le menu, écrite une seule fois', () => {
  const page = navbarMontee();

  it('SEO-4 · en français : six entrées du menu, nommées par leur nom court, sur des liens /fr/ sans paramètre', () => {
    expect(navigationDuSite('fr')).toEqual(
      jasmine.objectContaining({
        name: [
          'Créer mon site',
          'Réalisations',
          'Formation digitale',
          'Formation cours',
          'À propos',
          'Contact',
        ],
        url: [
          'https://asilidesign.fr/fr/offer',
          'https://asilidesign.fr/fr/projets',
          'https://asilidesign.fr/fr/formations/digitale',
          'https://asilidesign.fr/fr/formations/cours',
          'https://asilidesign.fr/fr/presentation',
          'https://asilidesign.fr/fr/contact',
        ],
      }),
    );
  });

  it('SEO-4 · en anglais : les mêmes entrées, nommées en anglais, sur des liens /en/', () => {
    expect(navigationDuSite('en')).toEqual(
      jasmine.objectContaining({
        name: [
          'Build my website',
          'Work',
          'Digital training',
          'Classroom courses',
          'About',
          'Contact',
        ],
        url: [
          'https://asilidesign.fr/en/offer',
          'https://asilidesign.fr/en/projets',
          'https://asilidesign.fr/en/formations/digitale',
          'https://asilidesign.fr/en/formations/cours',
          'https://asilidesign.fr/en/presentation',
          'https://asilidesign.fr/en/contact',
        ],
      }),
    );
  });

  it('SEO-4 · ni « Diagnostic gratuit » ni « Formations » dans la navigation', () => {
    const noms = navigationDuSite('fr')?.['name'] as readonly string[] | undefined;

    expect(noms).toContain('Réalisations');
    expect(noms).not.toContain('Diagnostic gratuit');
    expect(noms).not.toContain('Formations');
  });

  it('SEO-4 · les liens du menu sur ordinateur suivent, dans l ordre, la liste de navigation', () => {
    const liens = Array.from(page.racine.querySelectorAll(LIENS_DU_MENU)).map((lien) =>
      cheminDe(lien.getAttribute('href') ?? ''),
    );

    expect(liens).toEqual([
      '/offer',
      '/projets',
      '/formations/digitale',
      '/formations/cours',
      '/presentation',
      '/contact',
    ]);
    expect(liens).toEqual([...(METADONNEES_DU_SITE.global?.navigation ?? [])]);
  });

  it('SEO-4 · le bouton du menu garde « Parler de mon site » et son besoin, la navigation porte « Contact »', () => {
    const bouton = page.racine.querySelector<HTMLAnchorElement>(
      '.asili-nav__links .asili-nav__cta',
    );

    expect(texteDe(bouton)).toBe('Parler de mon site');
    expect(bouton?.getAttribute('href')).toBe('/contact?besoin=creer');
    expect((navigationDuSite('fr')?.['name'] as readonly string[]).at(-1)).toBe('Contact');
  });

  it('SEO-4 · un chemin de navigation sans page indexable est refusé', () => {
    const metadonnees = buildSeoMetadata([buildPageSeoFr('offer', '/offer')], {
      global: { localBusiness: {}, navigation: ['/offer', '/x'] },
    });

    expect(() => navigationDuSite('fr', metadonnees)).toThrowError(
      'chemin de navigation sans page indexable : /x',
    );
  });
});
