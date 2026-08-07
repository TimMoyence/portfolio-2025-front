import { HomeComponent } from "../../../features/home/home.component";
import { ProjetsComponent } from "../../../features/projets/projets.component";
import type {
  AsiliProject,
  AsiliProjectSize,
} from "./asili-projects-grid.component";

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
 * Verifie que les pages qui composent `<app-asili-projects-grid>` fournissent un
 * jeu de cartes pavant la grille 6 colonnes sans rangee incomplete.
 *
 * Ce contrat vit avec la grille (c'est son SCSS qui fixe les spans), mais il ne
 * peut etre verifie qu'au niveau des donnees des pages : le composant subit les
 * tailles qu'on lui passe.
 */
describe("Pavage de la grille projets", () => {
  it("ne laisse aucune rangee incomplete pour le teaser de la home", () => {
    // Composant de presentation pur, sans injection : instanciable directement.
    const home = new HomeComponent() as unknown as {
      readonly projects: readonly AsiliProject[];
    };

    const incomplete = rowFills(home.projects).filter(
      (filled) => filled !== GRID_COLUMNS,
    );

    expect(incomplete).toEqual([]);
  });

  // `/projets` n'est volontairement PAS soumis au meme contrat que la home.
  // Son jeu de 14 cartes laisse un trou de 2 colonnes en rangee 5 : le fermer
  // suppose de changer la taille de cartes (p. ex. « Voice IA » small -> big et
  // « AtlanticBike » big -> small), c'est-a-dire de rearbitrer quelle
  // realisation est mise en avant. C'est une decision editoriale, pas un
  // correctif technique — d'ou une caracterisation de l'existant plutot qu'une
  // exigence. Ce test n'entérine pas le trou : il force a le regarder si le jeu
  // de cartes bouge.
  it("caracterise le pavage actuel de /projets, trou editorial compris", () => {
    const projets = new ProjetsComponent() as unknown as {
      readonly projects: readonly AsiliProject[];
    };

    // 6|6|6|6|4|6|2 — le 4 est le trou en rangee 5 ; le 2 final est la derniere
    // rangee partielle, normale des que le total n'est pas multiple de 6.
    expect(rowFills(projets.projects)).toEqual([6, 6, 6, 6, 4, 6, 2]);
  });
});
