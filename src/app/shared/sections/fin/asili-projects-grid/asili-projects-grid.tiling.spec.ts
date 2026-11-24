import { TestBed } from '@angular/core/testing';
import { HomeComponent } from '../../../../features/home/home.component';
import { ProjetsComponent } from '../../../../features/projets/projets.component';
import type { AsiliProject, AsiliProjectSize } from './asili-projects-grid.component';

const COLONNES_DE_LA_GRILLE_ORDINATEUR = 6;

const SPANS: Readonly<Record<AsiliProjectSize, number>> = { big: 4, small: 2 };

function columnsFilledPerRow(projects: readonly AsiliProject[]): readonly number[] {
  const rows: number[] = [];
  let filled = 0;

  for (const project of projects) {
    const span = SPANS[project.size];
    if (filled + span > COLONNES_DE_LA_GRILLE_ORDINATEUR) {
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
  return columnsFilledPerRow(projects).filter(
    (filled) => filled !== COLONNES_DE_LA_GRILLE_ORDINATEUR,
  );
}

function incompleteRowsExceptLast(projects: readonly AsiliProject[]): readonly number[] {
  return columnsFilledPerRow(projects)
    .slice(0, -1)
    .filter((filled) => filled !== COLONNES_DE_LA_GRILLE_ORDINATEUR);
}

function projectsOf(page: object): readonly AsiliProject[] {
  return (page as { readonly projects: readonly AsiliProject[] }).projects;
}

describe('Pavage de la grille projets', () => {
  it('ne laisse aucune rangee incomplete pour le teaser de la home', () => {
    const accueil = TestBed.runInInjectionContext(() => new HomeComponent());

    expect(incompleteRows(projectsOf(accueil))).toEqual([]);
  });

  it('ne laisse aucune rangee intermediaire incomplete dans chaque famille de /projets', () => {
    const { familles } = new ProjetsComponent() as unknown as {
      readonly familles: readonly { readonly cartes: readonly AsiliProject[] }[];
    };

    expect(familles.length).toBeGreaterThan(0);
    for (const { cartes } of familles) {
      expect(incompleteRowsExceptLast(cartes)).toEqual([]);
    }
  });
});
