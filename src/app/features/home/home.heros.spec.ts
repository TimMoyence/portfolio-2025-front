import { texteDe as texte } from '../../../testing/texte/textes-dom';
import { pageMontee } from '../../../testing/page/montage-page';
import { variantesDeLargeur } from '../../shared/images/variantes-de-largeur';
import { HomeComponent } from './home.component';

describe('REC-05 · le héros promet un site qu on trouve', () => {
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

    it('VIT2-01 · l illustration de Tim au travail, au premier plan, chargée en priorité et servie à sa largeur', () => {
      const illustration = heros().querySelector<HTMLImageElement>('.hero-visuel img');

      expect(illustration?.getAttribute('src')).toBe('/assets/images/audit.webp');
      expect(illustration?.getAttribute('srcset')).toBe(
        variantesDeLargeur('/assets/images/audit', 1022),
      );
      expect([illustration?.getAttribute('width'), illustration?.getAttribute('height')]).toEqual([
        '1022',
        '952',
      ]);
      expect(illustration?.getAttribute('fetchpriority')).toBe('high');
      expect(illustration?.getAttribute('loading')).not.toBe('lazy');
      expect(illustration?.getAttribute('alt')).toBe(
        'Tim Moyence au travail sur son ordinateur portable',
      );
      expect(heros().querySelector('.cadre-navigateur')).toBeNull();
    });

    it('REC-05 · ni point clignotant, ni barre défiler, ni piliers ni formats', () => {
      expect(page.racine.querySelector('.live-dot')).toBeNull();
      expect(page.racine.querySelector('.scroll-hint')).toBeNull();
      expect(texte(heros())).not.toMatch(/piliers|formats d.intervention/);
    });
  });
});
