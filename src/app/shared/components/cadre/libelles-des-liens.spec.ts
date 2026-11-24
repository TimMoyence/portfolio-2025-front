import type { Type } from '@angular/core';
import { type OptionsDeMontage, pageMontee } from '../../../../testing/page/montage-page';
import { texteDe } from '../../../../testing/texte/textes-dom';
import { NotFoundComponent } from '../../../features/annexes/not-found/not-found.component';
import { HomeComponent } from '../../../features/home/home.component';
import { OfferComponent } from '../../../features/offer/offer.component';
import { PresentationComponent } from '../../../features/presentation/presentation.component';
import { RealisationComponent } from '../../../features/projets/fiche/realisation.component';
import { ProjetsComponent } from '../../../features/projets/projets.component';
import { METADONNEES_DU_SITE, nomCourtServi } from '../../../core/seo/site-servi';

const LIBELLES: readonly (readonly [string, string, string, string])[] = [
  ['offer', '/offer', nomCourtServi('/offer'), 'Build my website'],
  ['projets', '/projets', nomCourtServi('/projets'), 'Work'],
  ['presentation', '/presentation', nomCourtServi('/presentation'), 'About'],
  ['growth-audit', '/growth-audit', nomCourtServi('/growth-audit'), 'Free diagnosis'],
];

const PAGES: readonly (readonly [string, Type<unknown>, OptionsDeMontage<unknown>?])[] = [
  ['l accueil', HomeComponent],
  ['Créer mon site', OfferComponent],
  ['Réalisations', ProjetsComponent],
  [
    'une fiche réalisation',
    RealisationComponent,
    { avantRendu: (fixture) => fixture.componentRef.setInput('slug', 'atlanticbike') },
  ],
  ['À propos', PresentationComponent],
  ['la page introuvable', NotFoundComponent],
];

const enMinuscules = (texte: string): string => texte.toLocaleLowerCase('fr');

const liensVersLeMenu = (racine: HTMLElement): (readonly [string, string, string])[] =>
  Array.from(racine.querySelectorAll('a[href]')).flatMap((lien) => {
    const chemin = new URL(lien.getAttribute('href') ?? '', 'https://asilidesign.fr').pathname;
    const route = LIBELLES.find(([, cible]) => cible === chemin);
    return route ? [[chemin, texteDe(lien), route[2]] as const] : [];
  });

describe('REC-02 · un lien porte le mot de sa route, dans les pages comme dans le menu', () => {
  for (const [nom, composant, options] of PAGES) {
    describe(nom, () => {
      const page = pageMontee(composant, options);

      it(`REC-02 · ${nom} : chaque lien vers /offer, /projets, /presentation ou /growth-audit porte le libellé de sa route`, () => {
        const liens = liensVersLeMenu(page.racine);

        expect(liens.length).toBeGreaterThan(0);
        expect(
          liens
            .filter(
              ([, libelle, attendu]) => !enMinuscules(libelle).includes(enMinuscules(attendu)),
            )
            .map(([chemin, libelle]) => `${chemin} « ${libelle} »`),
        ).toEqual([]);
      });
    });
  }

  it('REC-02 · le titre de chaque page du menu s ouvre sur le libellé de sa route, en français comme en anglais', () => {
    const pages = METADONNEES_DU_SITE.pages;
    const titres = LIBELLES.flatMap(([id, , fr, en]) => {
      const locales = pages.find((entree) => entree.id === id)?.locales;
      return [
        [id, 'fr', locales?.['fr']?.title, fr],
        [id, 'en', locales?.['en']?.title, en],
      ];
    });

    expect(titres.filter(([, , titre, libelle]) => !titre?.startsWith(`${libelle} `))).toEqual([]);
  });
});
