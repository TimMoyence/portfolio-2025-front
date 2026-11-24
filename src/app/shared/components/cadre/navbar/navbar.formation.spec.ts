import { texteDe as texte } from '../../../../../testing/texte/textes-dom';
import { provideRouter } from '@angular/router';
import {
  FORMATIONS,
  type Parcours,
} from '../../../../features/formations/catalogue/formations-list.data';
import { formationsComptees } from '../../../../core/config/familles-de-formation';
import { navbarMontee } from '../../../../../testing/page/navbar-montee';

const compter = (parcours: readonly Parcours[]): number =>
  FORMATIONS.filter((carte) => parcours.includes(carte.parcours)).length;

const DIGITALES = compter(['ia-web']);
const COURS = compter(['bts-cg-1', 'bts-cg-2', 'bachelor-3']);

const echap = (): void => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
};

describe('REC-03 · Formation ouvre le digital et les cours, comptés par le catalogue', () => {
  const navbar = navbarMontee(provideRouter([{ path: '**', children: [] }]));

  const rendre = (): void => navbar.fixture.detectChanges();
  const zone = (): HTMLElement => {
    const liens = navbar.racine.querySelector('.asili-nav__links') as HTMLElement;
    liens.style.display = 'flex';
    return liens;
  };
  const declencheur = (): HTMLButtonElement =>
    zone().querySelector('button.asili-nav__trigger') as HTMLButtonElement;
  const entree = (): HTMLElement => declencheur().parentElement as HTMLElement;
  const panneau = (): HTMLElement => zone().querySelector('.asili-dropdown') as HTMLElement;
  const ouvert = (): string | null => declencheur().getAttribute('aria-expanded');
  const survolable = (oui: boolean): void => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: oui } as MediaQueryList);
  };

  it('REC-03 · deux entrées, digitale puis cours, comptées par le catalogue', () => {
    const entrees = [...panneau().querySelectorAll('a.asili-drop-item')].map((lien) => [
      lien.getAttribute('href'),
      texte(lien.querySelector('.asili-drop-item__title')),
      texte(lien.querySelector('.asili-drop-item__desc')),
    ]);

    expect(entrees).toEqual([
      [
        '/formations/digitale',
        'Formation digitale',
        `IA & web pour les pros · ${DIGITALES} formations`,
      ],
      ['/formations/cours', 'Formation cours', `BTS CG & Bachelor, en séance · ${COURS} cours`],
    ]);
  });

  it('REC-03 · une seule formation se dit au singulier', () => {
    expect(formationsComptees(1)).toBe('1 formation');
    expect(formationsComptees(4)).toBe('4 formations');
  });

  it('REC-03 · le clic ouvre le menu et aria-expanded le dit', () => {
    declencheur().click();
    rendre();

    expect(ouvert()).toBe('true');
    expect(panneau().classList).toContain('open');
  });

  it('REC-03 · Échap ferme le menu et rend le focus au déclencheur', () => {
    declencheur().focus();
    declencheur().click();
    rendre();
    const premiere = panneau().querySelector('a') as HTMLElement;
    premiere.focus();

    expect(document.activeElement).toBe(premiere);

    echap();
    rendre();

    expect(ouvert()).toBe('false');
    expect(document.activeElement).toBe(declencheur());
  });

  it('REC-03 · au survol, le panneau touche le déclencheur et se ferme quand la souris quitte les deux', () => {
    survolable(true);
    entree().dispatchEvent(new MouseEvent('mouseenter'));
    rendre();

    expect(ouvert()).toBe('true');
    expect(Math.round(panneau().getBoundingClientRect().top)).toBeLessThanOrEqual(
      Math.round(entree().getBoundingClientRect().bottom),
    );

    entree().dispatchEvent(new MouseEvent('mouseleave'));
    rendre();

    expect(ouvert()).toBe('false');
  });

  it('REC-03 · sur un écran tactile, le survol n ouvre rien : seul le toucher décide', () => {
    survolable(false);
    entree().dispatchEvent(new MouseEvent('mouseenter'));
    rendre();

    expect(ouvert()).toBe('false');

    declencheur().click();
    rendre();

    expect(ouvert()).toBe('true');
  });

  it('REC-03 · un clic hors du menu le ferme', () => {
    declencheur().click();
    rendre();

    document.body.click();
    rendre();

    expect(ouvert()).toBe('false');
  });

  it('REC-03 · choisir une entrée ferme le menu', () => {
    declencheur().click();
    rendre();

    (panneau().querySelector('a.asili-drop-item') as HTMLElement).click();
    rendre();

    expect(ouvert()).toBe('false');
  });

  it('REC-03 · le focus qui quitte le menu le ferme', () => {
    declencheur().click();
    rendre();
    const ailleurs = zone().querySelector('a[href="/presentation"]') as HTMLElement;

    entree().dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: ailleurs }));
    rendre();

    expect(ouvert()).toBe('false');
  });

  describe('dans le tiroir', () => {
    const burger = (): HTMLButtonElement =>
      navbar.racine.querySelector('.asili-nav button.asili-burger') as HTMLButtonElement;
    const tiroir = (): HTMLElement | null => navbar.racine.querySelector('#mobile-nav');
    const sousListe = (): Element | null =>
      tiroir()?.querySelector('.asili-drawer__sublist') ?? null;

    const ouvrirFormation = (): void => {
      burger().focus();
      navbar.composant.openMobileMenu();
      rendre();
      (tiroir()?.querySelector('button.asili-nav__trigger') as HTMLButtonElement).click();
      rendre();
    };

    it('REC-03 · Formation déplie les deux entrées', () => {
      ouvrirFormation();

      expect(
        [...(sousListe()?.querySelectorAll('a') ?? [])].map((lien) => [
          lien.getAttribute('href'),
          texte(lien),
        ]),
      ).toEqual([
        ['/formations/digitale', 'Formation digitale'],
        ['/formations/cours', 'Formation cours'],
      ]);
    });

    it('REC-03 · un premier Échap ferme Formation, le second le tiroir, focus sur le burger', () => {
      ouvrirFormation();

      echap();
      rendre();

      expect(sousListe()).toBeNull();
      expect(tiroir()).not.toBeNull();

      echap();
      rendre();

      expect(tiroir()).toBeNull();
      expect(document.activeElement).toBe(burger());
    });

    it('REC-03 · choisir une entrée ferme Formation et le tiroir', () => {
      ouvrirFormation();

      (sousListe()?.querySelector('a') as HTMLElement).click();
      rendre();

      expect(tiroir()).toBeNull();
      expect(navbar.composant.formationsDropdown.isOpen).toBeFalse();
    });
  });
});
