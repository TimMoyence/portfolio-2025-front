import { INSTANTANE_B2_09 } from '../../../../../../testing/fixtures/instantanes/b2/instantane-b2-09';
import {
  monterUnRendu,
  proprietesServies,
  retirerDuCorps,
} from '../../../../../../testing/page/montage-d-instantane';
import { SlideArbreComponent } from './slide-arbre.component';

const ARBRE_DES_PAIEMENTS = 'B2-09-A2-04-ARBRE-EXEMPLE';
const TETE = '[data-testid="slide-arbre-tete"]';
const FEUILLE = '[data-testid="slide-arbre-feuille"]';

const arbreServi = (id: string): Readonly<Record<string, unknown>> =>
  proprietesServies(INSTANTANE_B2_09, id, 'arbre');

const monterALaLargeur = (
  props: Readonly<Record<string, unknown>>,
  largeur: string,
): Promise<HTMLElement> => monterUnRendu(SlideArbreComponent, props, largeur);

const texteDe = (element: Element | null, selecteur: string): string =>
  element?.querySelector(selecteur)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

const lignes = (racine: HTMLElement, selecteur: string): string[] =>
  [...racine.querySelectorAll(selecteur)].map((element) =>
    ['evenement', 'probabilite', 'produit']
      .map((part) => texteDe(element, `:scope > .slide-arbre__noeud .slide-arbre__${part}`))
      .filter((texte) => texte !== '')
      .join(' '),
  );

const cadre = (element: Element | null): DOMRect =>
  (element?.querySelector(':scope > .slide-arbre__noeud') ?? element)?.getBoundingClientRect() ??
  new DOMRect();

describe('SlideArbreComponent', () => {
  afterEach(() => retirerDuCorps('app-slide-arbre'));

  it('ARB-01 · sur un écran large, chaque feuille se lit à droite de sa branche de tête, et chaque chemin finit par le produit servi', async () => {
    const racine = await monterALaLargeur(arbreServi(ARBRE_DES_PAIEMENTS), '60rem');
    const [mobile] = racine.querySelectorAll(TETE);
    const carte = mobile?.querySelector(FEUILLE) ?? null;

    expect(lignes(racine, TETE)).toEqual(['M 0,35', 'M̄ 0,65']);
    expect(lignes(racine, FEUILLE)).toEqual([
      'C 0,8 → 0,28',
      'C̄ 0,2 → 0,07',
      'C 0,65 → 0,4225',
      'C̄ 0,35 → 0,2275',
    ]);
    expect(cadre(carte).left).toBeGreaterThanOrEqual(cadre(mobile).right);
  });

  it('ARB-02 · sur un téléphone, l’arbre devient une liste indentée : chaque feuille sous sa branche de tête, en retrait', async () => {
    const racine = await monterALaLargeur(arbreServi(ARBRE_DES_PAIEMENTS), '22rem');
    const [mobile] = racine.querySelectorAll(TETE);
    const carte = mobile?.querySelector(FEUILLE) ?? null;

    expect(lignes(racine, FEUILLE)[0]).toBe('C 0,8 → 0,28');
    expect(cadre(carte).top).toBeGreaterThanOrEqual(cadre(mobile).bottom);
    expect(cadre(carte).left).toBeGreaterThan(cadre(mobile).left);
    expect(racine.scrollWidth).toBeLessThanOrEqual(racine.clientWidth);
  });

  it('ARB-03 · un « ? » s’affiche « ? », un chemin sans produit n’a ni flèche ni valeur, et une branche de tête sans feuilles s’arrête à sa probabilité', async () => {
    const racine = await monterALaLargeur(
      {
        title: 'Arbre à compléter',
        description: 'Deux branches de tête.',
        branches: [
          {
            evenement: 'A',
            probabilite: 0.4,
            branches: [
              { evenement: 'B', probabilite: 0.25 },
              { evenement: 'B̄', probabilite: '?' },
            ],
          },
          { evenement: 'Ā', probabilite: '?' },
        ],
      },
      '60rem',
    );

    expect(lignes(racine, TETE)).toEqual(['A 0,4', 'Ā ?']);
    expect(lignes(racine, FEUILLE)).toEqual(['B 0,25', 'B̄ ?']);
    expect(racine.querySelectorAll('.slide-arbre__produit').length).toBe(0);
    expect(racine.querySelectorAll(TETE)[1]?.querySelector(FEUILLE)).toBeNull();
  });

  it('ARB-03 · un produit « ? » à compléter s’affiche « → ? », et un produit nul « → 0 », au bout de son chemin', async () => {
    const racine = await monterALaLargeur(
      {
        title: 'Produits à lire',
        description: 'Un chemin dont le produit reste à calculer, un chemin impossible.',
        branches: [
          {
            evenement: 'A',
            probabilite: 1,
            branches: [
              { evenement: 'B', probabilite: 1, produit: '?' },
              { evenement: 'B̄', probabilite: 0, produit: 0 },
            ],
          },
        ],
      },
      '60rem',
    );

    expect(
      [...racine.querySelectorAll('.slide-arbre__produit')].map(({ textContent }) =>
        textContent?.trim(),
      ),
    ).toEqual(['→ ?', '→ 0']);
  });

  it('ARB-04 · l’écran porte le titre, le sous-titre, la description liée à l’arbre et la lecture sous « Lecture professionnelle »', async () => {
    const racine = await monterALaLargeur(arbreServi(ARBRE_DES_PAIEMENTS), '60rem');
    const arbre = racine.querySelector('[data-testid="slide-arbre"]');
    const description = racine.querySelector('[data-testid="slide-arbre-description"]');

    expect(texteDe(racine, 'h2')).toBe('Le paiement sur la boutique');
    expect(texteDe(racine, '.slide-arbre__subtitle')).not.toBe('');
    expect(description?.textContent).toContain('Arbre pondéré à deux générations.');
    expect(arbre?.getAttribute('aria-describedby')).toBe(description?.id ?? 'absent');
    expect(texteDe(racine, '.slide-arbre__reading')).toContain(
      'Lecture professionnelleM : le client paie sur mobile',
    );
  });

  it('ARB-04 · sans lecture servie, aucun libellé « Lecture professionnelle »', async () => {
    const { reading, ...sansLecture } = arbreServi(ARBRE_DES_PAIEMENTS);
    const racine = await monterALaLargeur(sansLecture, '60rem');

    expect(reading).toBeDefined();
    expect(racine.querySelector('.slide-arbre__reading')).toBeNull();
    expect(racine.querySelectorAll(TETE).length).toBe(2);
  });
});
