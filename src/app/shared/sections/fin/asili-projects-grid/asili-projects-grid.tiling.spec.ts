import { TestBed } from '@angular/core/testing';
import { HomeComponent } from '../../../../features/home/home.component';
import { ProjetsComponent } from '../../../../features/projets/projets.component';
import type { AsiliProject } from './asili-projects-grid.component';

const CARTES_PAR_RANGEE = 3;

function cartesParRangee(projects: readonly AsiliProject[]): readonly number[] {
  return Array.from({ length: Math.ceil(projects.length / CARTES_PAR_RANGEE) }, (_, rang) =>
    Math.min(CARTES_PAR_RANGEE, projects.length - rang * CARTES_PAR_RANGEE),
  );
}

function projectsOf(page: object): readonly AsiliProject[] {
  return (page as { readonly projects: readonly AsiliProject[] }).projects;
}

describe('Pavage de la grille projets', () => {
  it('ne laisse aucune rangee incomplete pour le teaser de la home', () => {
    const accueil = TestBed.runInInjectionContext(() => new HomeComponent());

    expect(
      cartesParRangee(projectsOf(accueil)).filter((cartes) => cartes !== CARTES_PAR_RANGEE),
    ).toEqual([]);
  });

  it('ne laisse aucune rangee intermediaire incomplete dans chaque famille de /projets', () => {
    const { familles } = new ProjetsComponent() as unknown as {
      readonly familles: readonly { readonly cartes: readonly AsiliProject[] }[];
    };

    expect(familles.length).toBeGreaterThan(0);
    for (const { cartes } of familles) {
      expect(
        cartesParRangee(cartes)
          .slice(0, -1)
          .filter((rangee) => rangee !== CARTES_PAR_RANGEE),
      ).toEqual([]);
    }
  });
});
