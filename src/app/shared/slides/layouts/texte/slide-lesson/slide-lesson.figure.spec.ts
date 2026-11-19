import type { PresentationServie } from '../../../../../../../contrat';
import { montagePage, poserLesEntrees } from '../../../../../../testing/page/montage-page';
import { textes } from '../../../../../../testing/texte/textes-dom';
import { SlideLessonComponent } from './slide-lesson.component';

type Lecon = Extract<PresentationServie, { renderer: 'lesson' }>['props'];

const FIGURE: NonNullable<Lecon['figure']> = {
  formula: 'f(x) = −2x² + 40x + 5',
  xLabel: 'x',
  yLabel: 'f(x)',
  xRange: [0, 15],
  yRange: [0, 220],
  points: [
    { x: 0, y: 5 },
    { x: 5, y: 155 },
    { x: 10, y: 205 },
    { x: 15, y: 155 },
  ],
  tangents: [
    { x: 10, y: 205, slope: 0, label: 'sommet : f(10) = 205' },
    { x: 5, y: 155, slope: 20 },
  ],
  zone: { from: 12, to: 15, label: 'contrainte x ≥ 12' },
  description: 'La parabole monte jusqu’au sommet en x = 10, puis redescend.',
};

const LECON: Lecon = {
  title: 'Le sommet ou le bord',
  blocks: [{ kind: 'method', title: 'Chercher le sommet', text: 'On résout f′(x) = 0.' }],
  figure: FIGURE,
};

const valeurDe = (part: number, [min, max]: readonly [number, number]): number =>
  min + (part / 100) * (max - min);

function droiteServie(trait: Element): { pente: number; hauteurEn: (x: number) => number } {
  const [x1, y1, x2, y2] = ['x1', 'y1', 'x2', 'y2'].map((nom) => Number(trait.getAttribute(nom)));
  const debut = { x: valeurDe(x1, FIGURE.xRange), y: valeurDe(100 - y1, FIGURE.yRange) };
  const fin = { x: valeurDe(x2, FIGURE.xRange), y: valeurDe(100 - y2, FIGURE.yRange) };
  const pente = (fin.y - debut.y) / (fin.x - debut.x);
  return { pente, hauteurEn: (x) => debut.y + pente * (x - debut.x) };
}

describe('leçon avec figure (RET-04)', () => {
  const fixture = montagePage(SlideLessonComponent, {
    http: false,
    avantRendu: (montee) => poserLesEntrees(montee, LECON),
  });
  const monter = (): HTMLElement => fixture().nativeElement as HTMLElement;

  it('RET-04 · dessine la courbe servie, sa formule et ses tangentes de pente servie', () => {
    const racine = monter();
    const traits = [...racine.querySelectorAll('[data-testid="slide-scatter-tangente"]')];

    expect(textes(racine, '.slide-lesson app-slide-scatter h2')).toEqual([FIGURE.formula]);
    expect(
      racine
        .querySelector('[data-testid="slide-scatter-courbe"]')
        ?.getAttribute('points')
        ?.split(' ').length,
    ).toBe(FIGURE.points.length);
    expect(traits.length).toBe(2);
    for (const [rang, tangente] of (FIGURE.tangents ?? []).entries()) {
      const droite = droiteServie(traits[rang]);
      expect(droite.pente).withContext(`pente ${rang}`).toBeCloseTo(tangente.slope, 2);
      expect(droite.hauteurEn(tangente.x)).withContext(`point ${rang}`).toBeCloseTo(tangente.y, 1);
    }
    expect(textes(racine, '.slide-scatter__point-label')).toEqual(['sommet : f(10) = 205']);
  });

  it('RET-04 · marque la zone permise de son début à sa fin, avec son libellé', () => {
    const zone = monter().querySelector<HTMLElement>('[data-testid="slide-scatter-zone"]');

    expect(zone?.style.left).toBe('80%');
    expect(zone?.style.width).toBe('20%');
    expect(zone?.textContent?.trim()).toBe('contrainte x ≥ 12');
  });

  it('RET-04 · donne les valeurs de la courbe en table, à la française', () => {
    const lignes = [...monter().querySelectorAll('app-donnees-de-figure tbody tr')].map((ligne) =>
      [...ligne.querySelectorAll('td')].map((cellule) => cellule.textContent?.trim()),
    );

    expect(lignes).toEqual([
      ['0', '5'],
      ['5', '155'],
      ['10', '205'],
      ['15', '155'],
    ]);
  });
});
