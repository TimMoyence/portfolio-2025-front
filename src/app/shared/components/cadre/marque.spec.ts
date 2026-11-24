import { texteDe as texte } from '../../../../testing/texte/textes-dom';
import seoMetadata from '../../../../assets/seo/seo-metadata.json';
import { pageMontee } from '../../../../testing/page/montage-page';
import { navbarMontee } from '../../../../testing/page/navbar-montee';
import { FooterComponent } from './footer/footer.component';

const accueil = seoMetadata.pages.find(({ id }) => id === 'home');

describe('REC-01 · Asili Design se signe « Sites web & apps mobiles » partout', () => {
  describe('dans la navbar', () => {
    const navbar = navbarMontee();

    const signature = (logo: Element | null): [string, string] => [
      texte(logo?.querySelector('.asili-logo__name')),
      texte(logo?.querySelector('.asili-logo__metier')),
    ];

    it('REC-01 · le logo porte le nom puis le métier', () => {
      expect(signature(navbar.racine.querySelector('a.asili-logo'))).toEqual([
        'Asili Design',
        'Sites web & apps mobiles',
      ]);
    });

    it('REC-01 · le tiroir mobile porte la même signature', () => {
      navbar.composant.openMobileMenu();
      navbar.fixture.detectChanges();

      expect(signature(navbar.racine.querySelector('#mobile-nav a.asili-logo'))).toEqual([
        'Asili Design',
        'Sites web & apps mobiles',
      ]);
    });
  });

  describe('dans le pied de page', () => {
    const pied = pageMontee(FooterComponent);

    it('REC-01 · la ligne de copyright dit le métier', () => {
      expect(texte(pied.racine)).toContain(
        '© 2026 Asili Design — Sites web & apps mobiles · Bordeaux',
      );
    });
  });

  describe('dans le référencement', () => {
    it("REC-01 · le titre de l'accueil nomme la marque et le métier", () => {
      expect(accueil?.locales.fr.title).toBe(
        'Asili Design — Création de sites web & apps mobiles à Bordeaux',
      );
      expect(accueil?.locales.en.title.startsWith('Asili Design — ')).toBeTrue();
    });

    it("REC-01 · l'organisation garde son nom et décrit sites web et apps mobiles", () => {
      const { name } = seoMetadata.global.localBusiness;
      const { description } = seoMetadata.global.textes.fr.localBusiness;

      expect(name).toBe('Asili Design');
      expect(description).toContain('sites web & apps mobiles');
      expect(description).not.toContain('Agence digitale');
    });
  });
});
