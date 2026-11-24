import { METADONNEES_DU_SITE } from '../../../../core/seo/site-servi';
import { texteDe as texte } from '../../../../../testing/texte/textes-dom';
import { TestBed } from '@angular/core/testing';
import { jsonLdDeLaPage } from '../../../../core/seo/json-ld';
import { navbarMontee } from '../../../../../testing/page/navbar-montee';
import { FooterComponent } from '../footer/footer.component';

const MENU = ['Créer mon site', 'Réalisations', 'Formation', 'À propos', 'Parler de mon site'];

const entrees = (zone: Element): string[] =>
  [...zone.querySelectorAll('.asili-nav__link, .asili-nav__cta')].map(texte);

const liens = (zone: Element): [string, string][] =>
  [...zone.querySelectorAll('a[href]')]
    .filter((lien) => texte(lien) !== '')
    .map((lien) => [
      lien.getAttribute('href') ?? '',
      texte(lien.querySelector('.asili-drop-item__title') ?? lien),
    ]);

describe('REC-02 · le menu raconte site, réalisations, formation, à propos, et chaque route porte un seul libellé', () => {
  const navbar = navbarMontee();

  const ordinateur = (): Element => navbar.racine.querySelector('.asili-nav__links') as Element;

  const tiroir = (): Element => {
    navbar.composant.openMobileMenu();
    navbar.fixture.detectChanges();
    return navbar.racine.querySelector('#mobile-nav .asili-drawer__body') as Element;
  };

  it('REC-02 · le menu ordinateur suit le récit, bouton en dernier', () => {
    expect(entrees(ordinateur())).toEqual(MENU);
  });

  it('REC-02 · le tiroir mobile suit le même ordre', () => {
    expect(entrees(tiroir())).toEqual(MENU);
  });

  it('REC-02 · « Parler de mon site » ouvre le contact sur le besoin de création', () => {
    for (const zone of [ordinateur(), tiroir()]) {
      expect(liens(zone)).toContain(['/contact?besoin=creer', 'Parler de mon site']);
    }
  });

  it('REC-02 · tout ce qui navigue est un lien, connexion comprise ; seule la bascule Formation est un bouton', () => {
    const zone = ordinateur();

    expect([...zone.querySelectorAll('button')].map(texte)).toEqual(['Formation']);
    expect(zone.querySelector('a[href="/login"][aria-label="Espace utilisateur"]')).not.toBeNull();
  });

  it('REC-02 · Articles, Contact sans besoin et le diagnostic quittent le menu', () => {
    for (const zone of [ordinateur(), tiroir()]) {
      const adresses = liens(zone).map(([adresse]) => adresse);

      expect(
        adresses.filter((adresse) => ['/articles', '/contact', '/growth-audit'].includes(adresse)),
      ).toEqual([]);
    }
  });

  it('REC-02 · menu, pied et navigation du référencement donnent un seul libellé par route', () => {
    const pied = TestBed.createComponent(FooterComponent);
    pied.detectChanges();
    const navigation = jsonLdDeLaPage(METADONNEES_DU_SITE, 'fr').find(
      (bloc) => bloc['@type'] === 'SiteNavigationElement',
    );
    const noms = (navigation?.['name'] ?? []) as readonly string[];
    const referencement = ((navigation?.['url'] ?? []) as readonly string[]).map(
      (url, rang): [string, string] => [new URL(url).pathname.replace(/^\/fr/, ''), noms[rang]],
    );
    const libelles = new Map<string, Set<string>>();
    for (const [adresse, libelle] of [
      ...liens(ordinateur()),
      ...[
        ...(pied.nativeElement as HTMLElement).querySelectorAll('nav, .asili-footer__legal'),
      ].flatMap(liens),
      ...referencement,
    ]) {
      libelles.set(adresse, (libelles.get(adresse) ?? new Set()).add(libelle));
    }
    const lu = (adresse: string): string[] => [...(libelles.get(adresse) ?? [])];

    expect(lu('/offer')).toEqual(['Créer mon site']);
    expect(lu('/projets')).toEqual(['Réalisations']);
    expect(lu('/presentation')).toEqual(['À propos']);
    expect(lu('/growth-audit')).toEqual(['Diagnostic gratuit']);
    expect([...libelles].filter(([, noms]) => noms.size > 1).map(([adresse]) => adresse)).toEqual(
      [],
    );
  });
});
