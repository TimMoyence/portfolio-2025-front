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

const FAMILLES = [
  ['Sites web', ['AtlanticBike', 'Maria Naumenko', 'asilidesign.fr']],
  ['Apps mobiles', ['Musaium']],
  [
    'Sur-mesure',
    ['Gestion de chais', 'IFS Academy', 'ZenFirst Renta', 'Morning-Brief', 'Portail-EG'],
  ],
  ['Outils', ['Schema-Atlas', 'Slide-Shot', 'Outillage-Claude', 'Fourmizzz-Suite']],
] as const;

const VITRINE = [
  'AtlanticBike',
  'Maria Naumenko',
  'Musaium',
  'Gestion de chais',
  'IFS Academy',
  'ZenFirst Renta',
];

describe('VIT2-08 · les réalisations se rangent en sites, apps, sur-mesure et outils', () => {
  describe('la liste', () => {
    it('VIT2-08 · quatre familles dans l ordre, et les réalisations de chacune', () => {
      expect(
        FAMILLES_DE_REALISATIONS.map(({ id, titre }) => [
          titre,
          REALISATIONS.filter(({ famille }) => famille === id).map(({ titre: nom }) => nom),
        ]),
      ).toEqual(FAMILLES.map(([titre, noms]) => [titre, [...noms]]));
    });

    it('VIT2-08 · un outil mène au contact avec le besoin sur-mesure', () => {
      expect(FAMILLES_DE_REALISATIONS.find(({ titre }) => titre === 'Outils')?.besoin).toBe(
        'sur-mesure',
      );
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

    it('REC-10 · au moins un site web porte l étiquette « En ligne »', () => {
      const enLigne = REALISATIONS.filter(
        ({ famille, etiquettes }) => famille === 'sites' && etiquettes.includes(ETIQUETTE_EN_LIGNE),
      );

      expect(ETIQUETTE_EN_LIGNE).toEqual({ libelle: 'En ligne', genre: 'resultat' });
      expect(enLigne.length).toBeGreaterThan(0);
    });

    it('VIT2-08 · la vitrine de l accueil suit sa liste de six réalisations', () => {
      expect(vitrineDeLAccueil().map(({ titre }) => titre)).toEqual(VITRINE);
    });
  });

  describe('/projets', () => {
    const page = pageMontee(ProjetsComponent);

    it('VIT2-08 · un titre de famille puis ses cartes, dans l ordre de la liste', () => {
      const familles = [...page.racine.querySelectorAll('app-asili-projects-grid')].map(
        (grille) => [texte(grille.querySelector('h2')), titresDe(grille)],
      );

      expect(familles).toEqual(
        FAMILLES.map(([titre, noms]) => [jasmine.stringMatching(`^${titre}`), [...noms]]),
      );
    });

    it('REC-10 · chaque carte mène à sa fiche', () => {
      const liens = [...page.racine.querySelectorAll('a.proj-link')].map((lien) =>
        lien.getAttribute('href'),
      );

      expect(liens).toEqual(REALISATIONS.map(({ slug }) => `/projets/${slug}`));
    });
  });

  describe('l accueil', () => {
    const accueil = pageMontee(HomeComponent);

    it('VIT2-08 · six cartes en deux rangées pleines, et aucune carte hors de la liste', () => {
      const grille = accueil.racine.querySelector('app-asili-projects-grid') as Element;

      expect(titresDe(grille)).toEqual(VITRINE);
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
