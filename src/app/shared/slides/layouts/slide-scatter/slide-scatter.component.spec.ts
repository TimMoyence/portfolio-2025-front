import { TestBed } from '@angular/core/testing';
import { poserLesEntrees } from '../../../../../testing/montage-page';
import { setupTestBed } from '../../../../../testing/setup-test-bed';
import { textes } from '../../../../../testing/textes-dom';
import { SlideScatterComponent } from './slide-scatter.component';

const VENTES = [610, 652, 694, 736, 790, 826].map((y, rang) => ({ x: rang + 1, y }));

function monter(surcharges: Readonly<Record<string, unknown>> = {}): HTMLElement {
  setupTestBed({ http: false, imports: [SlideScatterComponent] });
  const fixture = poserLesEntrees(TestBed.createComponent(SlideScatterComponent), {
    title: 'Ventes mensuelles',
    xLabel: 'Rang du mois',
    yLabel: 'Ventes (k€)',
    xRange: [0, 7],
    yRange: [550, 900],
    points: VENTES,
    description: 'Six points alignés qui montent de 610 à 826 k€.',
    ...surcharges,
  });
  return fixture.nativeElement as HTMLElement;
}

function coordonnees(element: Element | null): { x: number; y: number } {
  const style = (element as HTMLElement | null)?.style;
  return {
    x: Number.parseFloat(style?.getPropertyValue('--x') ?? ''),
    y: Number.parseFloat(style?.getPropertyValue('--y') ?? ''),
  };
}

function extremites(racine: HTMLElement): readonly number[] {
  const droite = racine.querySelector('[data-testid="slide-scatter-droite"]');
  return ['x1', 'y1', 'x2', 'y2'].map((attribut) =>
    Number.parseFloat(droite?.getAttribute(attribut) ?? ''),
  );
}

describe('SlideScatterComponent', () => {
  it('place chaque point aux pourcentages de ses deux axes', () => {
    const points = monter().querySelectorAll('[data-testid="slide-scatter-point"]');
    expect(points.length).toBe(6);
    expect(coordonnees(points[0]).x).toBeCloseTo((1 / 7) * 100, 3);
    expect(coordonnees(points[0]).y).toBeCloseTo((60 / 350) * 100, 3);
    expect(coordonnees(points[5]).y).toBeCloseTo((276 / 350) * 100, 3);
  });

  it('ne marque ni point moyen ni droite quand ils ne sont pas fournis', () => {
    const racine = monter();
    expect(racine.querySelector('[data-testid="slide-scatter-moyen"]')).toBeNull();
    expect(racine.querySelector('[data-testid="slide-scatter-droite"]')).toBeNull();
  });

  it('marque le point moyen G a sa place', () => {
    const racine = monter({ meanPoint: { x: 3.5, y: 718 } });
    const moyen = racine.querySelector('[data-testid="slide-scatter-moyen"]');
    expect(coordonnees(moyen).x).toBeCloseTo(50, 3);
    expect(coordonnees(moyen).y).toBeCloseTo((168 / 350) * 100, 3);
    expect(moyen?.textContent).toContain('G');
  });

  it('trace la droite d un bord a l autre du cadre quand elle y tient', () => {
    const racine = monter({
      line: { slope: 43.885714, intercept: 564.4, label: 'y = 43,89x + 564,4' },
    });
    const [x1, y1, x2, y2] = extremites(racine);
    expect(x1).toBeCloseTo(0, 3);
    expect(y1).toBeCloseTo(100 - (14.4 / 350) * 100, 2);
    expect(x2).toBeCloseTo(100, 3);
    expect(y2).toBeCloseTo(100 - (321.6 / 350) * 100, 2);
    expect(racine.textContent).toContain('y = 43,89x + 564,4');
  });

  it('decoupe la droite la ou elle sort du cadre vertical', () => {
    const racine = monter({ line: { slope: 100, intercept: 500 } });
    const [x1, y1, x2, y2] = extremites(racine);
    expect(x1).toBeCloseTo((0.5 / 7) * 100, 3);
    expect(y1).toBeCloseTo(100, 3);
    expect(x2).toBeCloseTo((4 / 7) * 100, 3);
    expect(y2).toBeCloseTo(0, 3);
  });

  it('ne trace rien quand la droite passe entierement hors du cadre', () => {
    const racine = monter({ line: { slope: 0, intercept: 1000 } });
    expect(racine.querySelector('[data-testid="slide-scatter-droite"]')).toBeNull();
  });

  it('gradue les deux axes avec des nombres a la francaise', () => {
    const racine = monter();
    const abscisses = textes(racine, '[data-testid="slide-scatter-graduation-x"]');
    const ordonnees = textes(racine, '[data-testid="slide-scatter-graduation-y"]');
    expect(abscisses[0]).toBe('0');
    expect(abscisses.at(-1)).toBe('7');
    expect(ordonnees[0]).toBe('550');
    expect(ordonnees.at(-1)).toBe('900');
    expect(racine.textContent).toContain('Rang du mois');
    expect(racine.textContent).toContain('Ventes (k€)');
  });

  it('decrit le nuage aux lecteurs d ecran', () => {
    const racine = monter();
    const nuage = racine.querySelector('[role="img"]');
    const description = racine.querySelector('[data-testid="slide-scatter-description"]');
    expect(description?.textContent).toContain('Six points alignés');
    expect(nuage?.getAttribute('aria-describedby')).toBe(description?.id ?? 'absent');
  });

  it('donne les coordonnees en tableau, avec la lecture et la source', () => {
    const racine = monter({
      reading: 'Les ventes gagnent environ 44 k€ par mois.',
      source: 'Atelier Rivage (données fictives).',
    });
    const lignes = racine.querySelectorAll('.slide-scatter__data tbody tr');
    expect(lignes.length).toBe(6);
    expect(lignes[4].textContent).toContain('790');
    expect(racine.querySelector('.slide-scatter__reading')?.textContent).toContain('44 k€');
    expect(racine.querySelector('.slide-scatter__source')?.textContent).toContain('Atelier Rivage');
  });
});
