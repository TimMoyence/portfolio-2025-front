import { texteDe as texte } from '../../../testing/texte/textes-dom';
import seoMetadata from '../../../assets/seo/seo-metadata.json';
import { pageMontee } from '../../../testing/page/montage-page';
import { HomeComponent } from '../home/home.component';
import { ProjetsComponent } from './projets.component';
import {
  ETIQUETTE_EN_LIGNE,
  FAMILLES_DE_REALISATIONS,
  REALISATIONS,
  vitrineDeLAccueil,
} from './realisations.data';

const titresDe = (zone: Element): string[] => [...zone.querySelectorAll('h3')].map(texte);

const RETIREES = ['Fourmizzz', 'Slide-Shot', 'Schema-Atlas', 'Portail-EG'];

describe('REC-10 · les réalisations se rangent en sites, apps et sur-mesure', () => {
  describe('la liste', () => {
    it('REC-10 · trois familles dans l ordre, et les réalisations de chacune', () => {
      expect(
        FAMILLES_DE_REALISATIONS.map(({ id, titre }) => [
          titre,
          REALISATIONS.filter(({ famille }) => famille === id).map(({ titre: nom }) => nom),
        ]),
      ).toEqual([
        ['Sites web', ['AtlanticBike', 'Maria Naumenko', 'asilidesign.fr']],
        ['Apps mobiles', ['InnovMind']],
        ['Sur-mesure', ['Gestion de chais', 'IFS Academy', 'ZenFirst Renta', 'Morning-Brief']],
      ]);
    });

    it('REC-10 · chaque carte porte un secteur et un résultat, et aucun résultat ne contient de chiffre', () => {
      for (const { titre, etiquettes } of REALISATIONS) {
        const resultats = etiquettes.filter(({ genre }) => genre === 'resultat');

        expect(etiquettes.some(({ genre }) => genre === 'secteur'))
          .withContext(titre)
          .toBeTrue();
        expect(resultats.length).withContext(titre).toBeGreaterThan(0);
        expect(resultats.filter(({ libelle }) => /\d/.test(libelle)))
          .withContext(titre)
          .toEqual([]);
      }
    });

    it('REC-10 · au moins un site web est marqué « En ligne », reconnu par son identifiant', () => {
      const enLigne = REALISATIONS.filter(
        ({ famille, etiquettes }) =>
          famille === 'sites' && etiquettes.some(({ id }) => id === ETIQUETTE_EN_LIGNE.id),
      );

      expect(ETIQUETTE_EN_LIGNE).toEqual(
        jasmine.objectContaining({ libelle: 'En ligne', genre: 'resultat' }),
      );
      expect(enLigne.length).toBeGreaterThan(0);
    });

    it('REC-10 · l accueil montre la première réalisation de chaque famille', () => {
      expect(vitrineDeLAccueil().map(({ titre }) => titre)).toEqual([
        'AtlanticBike',
        'InnovMind',
        'Gestion de chais',
      ]);
    });
  });

  describe('/projets', () => {
    const page = pageMontee(ProjetsComponent);

    it('REC-10 · un titre de famille puis ses cartes, dans l ordre de la liste', () => {
      const familles = [...page.racine.querySelectorAll('app-asili-projects-grid')].map(
        (grille) => [texte(grille.querySelector('h2')), titresDe(grille)],
      );

      expect(familles).toEqual([
        [
          jasmine.stringMatching(/^Sites web/),
          ['AtlanticBike', 'Maria Naumenko', 'asilidesign.fr'],
        ],
        [jasmine.stringMatching(/^Apps mobiles/), ['InnovMind']],
        [
          jasmine.stringMatching(/^Sur-mesure/),
          ['Gestion de chais', 'IFS Academy', 'ZenFirst Renta', 'Morning-Brief'],
        ],
      ]);
    });

    it('REC-10 · chaque carte mène à sa fiche, et les projets retirés ne paraissent plus', () => {
      const liens = [...page.racine.querySelectorAll('a.proj-link')].map((lien) =>
        lien.getAttribute('href'),
      );

      expect(liens).toEqual(REALISATIONS.map(({ slug }) => `/projets/${slug}`));
      for (const retire of RETIREES) {
        expect(texte(page.racine)).not.toContain(retire);
      }
    });
  });

  describe('l accueil', () => {
    const accueil = pageMontee(HomeComponent);

    it('REC-10 · trois cartes, une par famille, et aucune carte hors de la liste', () => {
      const grille = accueil.racine.querySelector('app-asili-projects-grid') as Element;

      expect(titresDe(grille)).toEqual(['AtlanticBike', 'InnovMind', 'Gestion de chais']);
      expect(texte(grille)).not.toContain('Audit de visibilité web');
      expect(texte(grille)).not.toContain('Formations actionnables');
    });
  });

  describe('le référencement de /projets', () => {
    const nomsDecrits = (valeur: unknown): string[] => {
      if (Array.isArray(valeur)) return valeur.flatMap(nomsDecrits);
      if (valeur === null || typeof valeur !== 'object') return [];
      const bloc = valeur as Record<string, unknown>;
      const nom = bloc['@type'] === 'CreativeWork' && typeof bloc['name'] === 'string';
      return [
        ...(nom ? [bloc['name'] as string] : []),
        ...Object.values(bloc).flatMap(nomsDecrits),
      ];
    };

    for (const locale of ['fr', 'en'] as const) {
      it(`MN-5 · ne décrit aucune réalisation hors de la liste (${locale})`, () => {
        const page = seoMetadata.pages.find(({ id }) => id === 'projets');
        const titres = REALISATIONS.map(({ titre }) => titre);

        expect(
          nomsDecrits(page?.locales[locale]?.jsonLd).filter((nom) => !titres.includes(nom)),
        ).toEqual([]);
      });
    }
  });

  it('MN-9 · AtlanticBike dit que sa mise en ligne est en cours, sur sa carte comme dans son récit', () => {
    const atlanticbike = REALISATIONS.find(({ slug }) => slug === 'atlanticbike');

    expect(atlanticbike?.etiquettes.map(({ libelle }) => libelle)).toEqual([
      'Location de vélos',
      'Mise en ligne en cours',
    ]);
    expect(atlanticbike?.recit.resultat).toContain('en cours de mise en ligne');
  });
});
