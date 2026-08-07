import { HomeComponent } from '../../../features/home/home.component';
import { ProjetsComponent } from '../../../features/projets/projets.component';
import type { AsiliProject, AsiliProjectSize } from './asili-projects-grid.component';

/**
 * Nombre de colonnes de la grille desktop
 * (`asili-projects-grid.component.scss` : `grid-template-columns: repeat(6, 1fr)`).
 */
const GRID_COLUMNS = 6;

/**
 * Largeur en colonnes de chaque taille de carte, miroir du SCSS
 * (`.proj.big { grid-column: span 4 }`, `.proj.small { span 2 }`).
 */
const SPANS: Readonly<Record<AsiliProjectSize, number>> = { big: 4, small: 2 };

/**
 * Rejoue le placement automatique CSS Grid (sans `grid-auto-flow: dense`, que la
 * grille n'active volontairement pas pour preserver l'ordre d'affichage) et
 * retourne le nombre de colonnes reellement remplies par chaque rangee.
 *
 * Une valeur inferieure a `GRID_COLUMNS` signale un trou visuel : la carte
 * suivante ne tenait pas dans la place restante et a ete repoussee a la rangee
 * suivante, laissant l'espace vide.
 */
function rowFills(projects: readonly AsiliProject[]): readonly number[] {
  const rows: number[] = [];
  let filled = 0;

  for (const project of projects) {
    const span = SPANS[project.size];
    if (filled + span > GRID_COLUMNS) {
      rows.push(filled);
      filled = 0;
    }
    filled += span;
  }
  if (filled > 0) {
    rows.push(filled);
  }

  return rows;
}

/**
 * Rangées dont le remplissage doit être complet, c'est-à-dire toutes sauf la
 * dernière : une rangée intermédiaire incomplète est un trou visuel au milieu
 * de la grille, alors qu'une dernière rangée partielle est la conséquence
 * arithmétique normale d'un total de cartes non multiple de `GRID_COLUMNS`.
 *
 * @returns Les remplissages des rangées intermédiaires qui ne font pas la
 *   largeur complète — tableau vide quand le pavage est sain.
 */
function incompleteInnerRows(projects: readonly AsiliProject[]): readonly number[] {
  return rowFills(projects)
    .slice(0, -1)
    .filter((filled) => filled !== GRID_COLUMNS);
}

/**
 * Vérifie que les pages qui composent `<app-asili-projects-grid>` fournissent un
 * jeu de cartes pavant la grille 6 colonnes sans rangée incomplète.
 *
 * Ce contrat vit avec la grille (c'est son SCSS qui fixe les spans), mais il ne
 * peut être vérifié qu'au niveau des données des pages : le composant subit les
 * tailles qu'on lui passe.
 */
describe('Pavage de la grille projets', () => {
  it('ne laisse aucune rangee incomplete pour le teaser de la home', () => {
    // Composant de presentation pur, sans injection : instanciable directement.
    const home = new HomeComponent() as unknown as {
      readonly projects: readonly AsiliProject[];
    };

    const incomplete = rowFills(home.projects).filter((filled) => filled !== GRID_COLUMNS);

    expect(incomplete).toEqual([]);
  });

  // `/projets` est soumis au même contrat que la home depuis que le trou de 2
  // colonnes qui subsistait en rangée 5 a été fermé (« Voice IA » small → big,
  // « AtlanticBike » big → small). Ce n'était pas un correctif technique mais un
  // arbitrage éditorial sur la réalisation mise en avant : il est tranché, donc
  // ce test cesse de caractériser l'existant et exige le pavage sain.
  //
  // Seule la dernière rangée peut rester partielle : le jeu de 14 cartes ne
  // totalise pas nécessairement un multiple de 6 colonnes.
  it('ne laisse aucune rangee intermediaire incomplete sur /projets', () => {
    const projets = new ProjetsComponent() as unknown as {
      readonly projects: readonly AsiliProject[];
    };

    expect(incompleteInnerRows(projets.projects)).toEqual([]);
  });
});
