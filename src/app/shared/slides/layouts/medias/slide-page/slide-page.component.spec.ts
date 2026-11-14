import { INSTANTANE_B3_03 } from '../../../../../../testing/fixtures/instantanes/b3/instantane-b3-03';
import {
  monterUnRendu,
  proprietesServies,
  retirerDuCorps,
} from '../../../../../../testing/page/montage-d-instantane';
import { SlidePageComponent } from './slide-page.component';

const FEUILLE = '[data-testid="slide-page-feuille"]';
const BLOC = '[data-testid="slide-page-bloc"]';
const PASTILLE = '[data-testid="slide-page-pastille"]';

const monter = (id: string, largeur = '64rem'): Promise<HTMLElement> =>
  monterUnRendu(SlidePageComponent, proprietesServies(INSTANTANE_B3_03, id, 'page'), largeur);

const propre = (texte: string | null | undefined): string =>
  (texte ?? '').replace(/\s+/g, ' ').trim();

const textes = (racine: Element, selecteur: string): string[] =>
  [...racine.querySelectorAll(selecteur)].map((element) => propre(element.textContent));

const styleDe = (element: Element | null | undefined): CSSStyleDeclaration =>
  getComputedStyle(element ?? document.body);

function morceau(racine: Element, texte: string): Element {
  const trouve = [...racine.querySelectorAll('[data-testid="slide-page-morceau"]')].find(
    (element) => propre(element.textContent) === texte,
  );
  if (trouve === undefined) {
    throw new Error(`morceau absent : ${texte}`);
  }
  return trouve;
}

describe('SlidePageComponent', () => {
  afterEach(() => retirerDuCorps('app-slide-page'));

  it('PAG-01 · dessine la feuille servie : en-tête, corps et pied, chaque bloc avec son style, son alignement et sa pastille', async () => {
    const racine = await monter('B3-03-A2-06-PAGE-EN-TETE-PIED');
    const feuille = racine.querySelector(FEUILLE);
    const enTete = feuille?.querySelector('[data-testid="slide-page-en-tete"] ' + BLOC);
    const corps = feuille?.querySelectorAll('[data-testid="slide-page-corps"] ' + BLOC) ?? [];
    const pied = feuille?.querySelector('[data-testid="slide-page-pied"] ' + BLOC);

    expect(feuille?.getAttribute('data-orientation')).toBe('portrait');
    expect(propre(enTete?.textContent)).toContain(
      'Fournil du Port · Rapport 2026 · exemple inventé',
    );
    expect(styleDe(enTete).textAlign).toBe('right');
    expect([...corps].map((bloc) => bloc.getAttribute('data-style'))).toEqual([
      'heading1',
      'normal',
    ]);
    expect(propre(corps[0]?.textContent)).toContain('1. Bilan de l’année');
    expect(propre(pied?.textContent)).toContain('15/06/2026');
    expect(styleDe(pied).textAlign).toBe('center');
    expect(textes(feuille ?? racine, PASTILLE)).toEqual(['1', '2', '3']);
  });

  it('PAG-01 · un champ se lit sur fond gris, comme dans Word', async () => {
    const racine = await monter('B3-03-A2-06-PAGE-EN-TETE-PIED');

    expect(styleDe(morceau(racine, '15/06/2026')).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(
      styleDe(morceau(racine, 'Les ventes de pain progressent au printemps.')).backgroundColor,
    ).toBe('rgba(0, 0, 0, 0)');
  });

  it('PAG-01 · gras, italique, souligné et ton se voient sur le seul morceau qui les porte', async () => {
    const racine = await monter('B3-03-A1-08-PAGE-CARACTERES');
    const record = morceau(racine, 'record');
    const moulin = morceau(racine, 'Moulin de Kerlann');
    const date = morceau(racine, '3 mai');
    const ton = morceau(racine, 'dix minutes');
    const neutre = morceau(racine, 'Les ventes de brioches battent un');

    expect(Number(styleDe(record).fontWeight)).toBeGreaterThanOrEqual(700);
    expect(Number(styleDe(neutre).fontWeight)).toBeLessThan(700);
    expect(styleDe(moulin).fontStyle).toBe('italic');
    expect(styleDe(date).textDecorationLine).toContain('underline');
    expect(styleDe(ton).color).not.toBe(styleDe(neutre).color);
  });

  it('PAG-01 · les marques ¶ s’affichent au bout de chaque paragraphe quand la page les montre', async () => {
    const avecMarques = await monter('B3-03-A1-04-PAGE-IMPORTER');
    const corps = avecMarques.querySelectorAll('[data-testid="slide-page-corps"] ' + BLOC);

    expect([...corps].map((bloc) => propre(bloc.textContent).endsWith('¶'))).toEqual([
      true,
      true,
      true,
      true,
      true,
    ]);
    expect([...corps].map((bloc) => bloc.getAttribute('data-style'))).toEqual([
      'normal',
      'empty',
      'normal',
      'empty',
      'normal',
    ]);
  });

  it('PAG-01 · sans marques servies, la page n’affiche aucun ¶', async () => {
    const racine = await monter('B3-03-A1-08-PAGE-CARACTERES');

    expect(propre(racine.querySelector(FEUILLE)?.textContent)).not.toContain('¶');
  });

  it('PAG-01 · un paragraphe en retrait décale sa première ligne, et un justifié se justifie', async () => {
    const racine = await monter('B3-03-A2-02-PAGE-PARAGRAPHES');
    const [titre, retrait, , suite] = racine.querySelectorAll(
      '[data-testid="slide-page-corps"] ' + BLOC,
    );

    expect(styleDe(titre).textAlign).toBe('center');
    expect(styleDe(retrait).textAlign).toBe('justify');
    expect(parseFloat(styleDe(retrait).textIndent)).toBeGreaterThan(0);
    expect(parseFloat(styleDe(suite).textIndent)).toBe(0);
  });

  it('PAG-01 · une page en paysage porte sa pastille de marge, et son tableau lit sa première ligne en en-tête', async () => {
    const racine = await monter('B3-03-A2-07-PAGE-MISE-EN-PAGE');
    const feuille = racine.querySelector(FEUILLE);
    const tableau = feuille?.querySelector('table');

    expect(feuille?.getAttribute('data-orientation')).toBe('landscape');
    expect(textes(feuille ?? racine, '[data-testid="slide-page-pastille-marge"]')).toEqual(['1']);
    expect(textes(tableau ?? racine, 'thead th')).toEqual([
      'Produit',
      'Janvier',
      'Février',
      'Mars',
    ]);
    expect(
      [...(tableau?.querySelectorAll('tbody tr') ?? [])].map((ligne) => textes(ligne, 'td')),
    ).toEqual([
      ['Baguette', '4 210', '3 980', '4 450'],
      ['Brioche', '610', '590', '720'],
    ]);
    expect(textes(feuille ?? racine, PASTILLE)).toEqual(['3', '2']);
    const large = feuille?.getBoundingClientRect() ?? new DOMRect();
    expect(large.width).toBeGreaterThan(large.height);
  });

  it('PAG-01 · à côté de la page, le titre, le sous-titre, les trois paragraphes puis une correspondance par pastille', async () => {
    const racine = await monter('B3-03-A2-06-PAGE-EN-TETE-PIED');
    const feuille = racine.querySelector(FEUILLE);
    const texte = racine.querySelector('[data-testid="slide-page-texte"]');

    expect(propre(texte?.querySelector('h2')?.textContent)).toBe('Page : en-tête et pied de page');
    expect(propre(texte?.querySelector('.slide-page__subtitle')?.textContent)).toBe(
      'Traitement de texte · page 8 sur 11',
    );
    expect(textes(texte ?? racine, '.slide-page__paragraphe').map((p) => p.split(' :')[0])).toEqual(
      ['Syntaxe', 'Le piège', 'Exemple'],
    );
    expect(textes(texte ?? racine, '.slide-page__correspondances li')).toEqual([
      'Pastille 1 → l’en-tête, répété sur chaque page',
      'Pastille 2 → le corps, que l’en-tête ne touche pas',
      'Pastille 3 → la date, un champ qui se met à jour',
    ]);
    expect(feuille?.getAttribute('role')).toBe('img');
    expect(feuille?.getAttribute('aria-label')).toBe(
      'Une page Word : un en-tête aligné à droite, un titre de partie, et en pied une date insérée par un champ.',
    );
    expect(feuille?.getBoundingClientRect().right ?? 0).toBeLessThanOrEqual(
      texte?.getBoundingClientRect().left ?? 0,
    );
  });

  it('PAG-01 · sur un téléphone, la page passe au-dessus du texte, sans défilement horizontal', async () => {
    const racine = await monter('B3-03-A2-06-PAGE-EN-TETE-PIED', '22rem');
    const feuille = racine.querySelector(FEUILLE)?.getBoundingClientRect() ?? new DOMRect();
    const texte =
      racine.querySelector('[data-testid="slide-page-texte"]')?.getBoundingClientRect() ??
      new DOMRect();

    expect(feuille.height).toBeGreaterThan(0);
    expect(texte.height).toBeGreaterThan(0);
    expect(feuille.bottom).toBeLessThanOrEqual(texte.top);
    expect(racine.scrollWidth).toBeLessThanOrEqual(racine.clientWidth);
  });
});
