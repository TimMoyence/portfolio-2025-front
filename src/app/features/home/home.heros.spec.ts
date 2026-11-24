import { texteDe as texte } from '../../../testing/texte/textes-dom';
import { buildRealisation as realisationDe } from '../../../testing/factories/realisation.factory';
import { pageMontee } from '../../../testing/page/montage-page';
import { ETIQUETTE_EN_LIGNE, type Realisation, REALISATIONS } from '../projets/realisations.data';
import { HomeComponent } from './home.component';
import { realisationDuHeros } from './realisation-du-heros';

const avecEtiquettes = (slug: string, etiquettes: Realisation['etiquettes']): Realisation =>
  realisationDe(slug, { etiquettes });

describe('REC-05 · le héros promet un site qu on trouve', () => {
  describe('la capture du héros', () => {
    it('REC-05 · montre le premier site web marqué « En ligne » : Maria Naumenko, AtlanticBike n ayant que « Mise en ligne en cours »', () => {
      expect(realisationDuHeros(REALISATIONS)?.slug).toBe('maria-naumenko');
    });

    it('REC-05 · montre AtlanticBike dès qu il porte l étiquette « En ligne »', () => {
      const liste = [
        avecEtiquettes('atlanticbike', [ETIQUETTE_EN_LIGNE]),
        ...REALISATIONS.filter(({ slug }) => slug !== 'atlanticbike'),
      ];

      expect(realisationDuHeros(liste)?.slug).toBe('atlanticbike');
    });

    it('REC-05 · reconnaît l étiquette par son identifiant, jamais par son libellé', () => {
      const liste = [
        avecEtiquettes('atlanticbike', [{ libelle: 'En ligne', genre: 'resultat' }]),
        avecEtiquettes('maria-naumenko', [
          { id: ETIQUETTE_EN_LIGNE.id, libelle: 'Live', genre: 'resultat' },
        ]),
      ];

      expect(realisationDuHeros(liste)?.slug).toBe('maria-naumenko');
    });

    it('REC-05 · ne prend jamais une réalisation hors des sites web', () => {
      const liste = [avecEtiquettes('innovmind', [ETIQUETTE_EN_LIGNE])];

      expect(realisationDuHeros(liste)).toBeUndefined();
    });
  });

  describe('l accueil', () => {
    const page = pageMontee(HomeComponent);
    const heros = (): Element => page.racine.querySelector('app-asili-hero') as Element;

    it('REC-05 · kicker, titre et accroche disent la promesse', () => {
      expect(texte(heros().querySelector('.kicker'))).toBe('Création de sites web · Bordeaux');
      expect(texte(heros().querySelector('h1'))).toBe(
        'Votre métier mérite mieux qu’une page qu’on ne trouve pas.',
      );
      expect(texte(heros().querySelector('.lead'))).toBe(
        'Je crée le site des artisans, commerces et indépendants : clair à lire, facile à trouver, sur Google comme dans les réponses des IA, avant vos concurrents. Vous parlez de votre métier, je m’occupe du reste.',
      );
    });

    it('REC-05 · deux liens : parler de mon site, voir mes réalisations', () => {
      const liens = [...heros().querySelectorAll('.hero-cta a')].map((lien) => [
        texte(lien),
        lien.getAttribute('href'),
      ]);

      expect(liens).toEqual([
        ['Parler de mon site →', '/contact?besoin=creer'],
        ['Voir mes réalisations', '/projets'],
      ]);
    });

    it('REC-05 · la capture du site en ligne, dans un cadre de navigateur, avec un alt qui le nomme', () => {
      const capture = heros().querySelector<HTMLImageElement>('.cadre-navigateur img');

      expect(capture?.getAttribute('src')).toBe(realisationDe('maria-naumenko').image);
      expect(capture?.getAttribute('alt')).toContain('Maria Naumenko');
    });

    it('REC-05 · ni point clignotant, ni barre défiler, ni piliers ni formats', () => {
      expect(page.racine.querySelector('.live-dot')).toBeNull();
      expect(page.racine.querySelector('.scroll-hint')).toBeNull();
      expect(texte(heros())).not.toMatch(/piliers|formats d.intervention/);
    });
  });
});
