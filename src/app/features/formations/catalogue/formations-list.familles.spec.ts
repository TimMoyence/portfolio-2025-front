import { METADONNEES_DU_SITE } from '../../../core/seo/site-servi';
import { texteDe } from '../../../../testing/texte/textes-dom';
import type { ComponentFixture } from '@angular/core/testing';
import {
  liensAffiches,
  pucesRendues,
  saisir,
  SECTIONS_ATTENDUES,
  sectionsRendues,
} from '../../../../testing/dom/catalogue-des-formations';
import { montagePage } from '../../../../testing/page/montage-page';
import { routes } from '../../../app.routes';
import { FormationsListComponent } from './formations-list.component';
import { FORMATIONS } from './formations-list.data';

const SECTIONS_DES_COURS = SECTIONS_ATTENDUES.slice(0, 3);
const SECTION_DIGITALE = SECTIONS_ATTENDUES[3];

const pageDe = (
  famille?: 'digitale' | 'cours',
): (() => ComponentFixture<FormationsListComponent>) =>
  montagePage(FormationsListComponent, {
    avantRendu: (fixture) => {
      if (famille) {
        fixture.componentRef.setInput('famille', famille);
      }
    },
  });

const racineDe = (fixture: ComponentFixture<FormationsListComponent>): HTMLElement =>
  fixture.nativeElement as HTMLElement;

const titreDe = (racine: HTMLElement): string => texteDe(racine.querySelector('h1'));

describe('REC-04 · chaque famille de formation a sa page', () => {
  describe('/formations/digitale', () => {
    const page = pageDe('digitale');

    it('REC-04 · titre « Formation digitale », les seules cartes IA & web, et aucune puce', () => {
      const racine = racineDe(page());

      expect(titreDe(racine)).toBe('Formation digitale');
      expect(liensAffiches(racine)).toEqual(SECTION_DIGITALE[1]);
      expect(pucesRendues(racine)).toEqual([]);
    });
  });

  describe('/formations/cours', () => {
    const page = pageDe('cours');

    it('REC-04 · titre « Formation cours », les sections BTS CG et Bachelor, sans carte IA & web', () => {
      const racine = racineDe(page());

      expect(titreDe(racine)).toBe('Formation cours');
      expect(sectionsRendues(racine).map(({ titre, liens }) => [titre, liens])).toEqual(
        SECTIONS_DES_COURS.map(([titre, liens]) => [titre, liens]),
      );
      expect(pucesRendues(racine).map(({ libelle }) => libelle)).toEqual([
        'Toutes',
        ...SECTIONS_DES_COURS.map(([titre]) => titre),
      ]);
    });

    it('REC-04 · la recherche ne fouille que les cours', () => {
      saisir(page(), 'IA solopreneurs');

      expect((racineDe(page()).textContent ?? '').replace(/\s+/g, ' ')).toContain(
        'Aucune formation ne correspond à « IA solopreneurs »',
      );
    });
  });

  describe('/formations', () => {
    const page = pageDe();

    it('REC-04 · reste le catalogue complet', () => {
      const racine = racineDe(page());

      expect(titreDe(racine)).toBe('Formations');
      expect(liensAffiches(racine).length).toBe(FORMATIONS.length);
    });
  });

  for (const [famille, titre] of [
    ['digitale', 'Formation digitale'],
    ['cours', 'Formation cours'],
  ] as const) {
    describe(`routes et référencement de /formations/${famille}`, () => {
      it(`REC-04 · la route sert le catalogue de la famille ${famille} sous sa clé SEO`, () => {
        const route = routes.find(({ path }) => path === `formations/${famille}`);

        expect(route?.data).toEqual({ seoKey: `formations-${famille}`, famille });
        expect(route?.loadComponent).toBeDefined();
      });

      it(`REC-04 · formations-${famille} est indexée, titrée et décrite en chaque langue`, () => {
        const fiche = METADONNEES_DU_SITE.pages.find(({ id }) => id === `formations-${famille}`);
        const locales = fiche?.locales ?? {};

        expect(fiche?.path).toBe(`/formations/${famille}`);
        expect(fiche?.index).toBeTrue();
        expect(Object.keys(locales)).toEqual(METADONNEES_DU_SITE.site.locales);
        expect(locales['fr']?.title).toContain(titre);
        expect(locales['en']?.title).not.toBe(locales['fr']?.title);
        expect(locales['en']?.description).not.toBe(locales['fr']?.description);
      });
    });
  }
});
