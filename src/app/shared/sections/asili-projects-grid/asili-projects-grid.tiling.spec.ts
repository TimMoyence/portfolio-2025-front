import { HomeComponent } from '../../../features/home/home.component';
import { ProjetsComponent } from '../../../features/projets/projets.component';
import type { AsiliProject, AsiliProjectSize } from './asili-projects-grid.component';

/**
 * Nombre de colonnes de la grille desktop
 * (`asili-projects-grid.component.scss` : `grid-template-columns: repeat(6, 1fr)`).
 */
const GRID_COLUMNS = 6;

/** `asili-projects-grid.component.scss` : `.proj.big` span 4, `.proj.small` span 2. */
const SPANS: Readonly<Record<AsiliProjectSize, number>> = { big: 4, small: 2 };

function columnsFilledPerRow(projects: readonly AsiliProject[]): readonly number[] {
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

function incompleteRows(projects: readonly AsiliProject[]): readonly number[] {
  return columnsFilledPerRow(projects).filter((filled) => filled !== GRID_COLUMNS);
}

function incompleteRowsExceptLast(projects: readonly AsiliProject[]): readonly number[] {
  return columnsFilledPerRow(projects)
    .slice(0, -1)
    .filter((filled) => filled !== GRID_COLUMNS);
}

function projectsOf(page: object): readonly AsiliProject[] {
  return (page as { readonly projects: readonly AsiliProject[] }).projects;
}

describe('Pavage de la grille projets', () => {
  it('ne laisse aucune rangee incomplete pour le teaser de la home', () => {
    expect(incompleteRows(projectsOf(new HomeComponent()))).toEqual([]);
  });

  it('ne laisse aucune rangee intermediaire incomplete sur /projets', () => {
    expect(incompleteRowsExceptLast(projectsOf(new ProjetsComponent()))).toEqual([]);
  });
});
