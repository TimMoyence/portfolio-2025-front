import type { PresentationServie } from '../../../../../../../contrat';
import { montagePage, poserLesEntrees } from '../../../../../../testing/page/montage-page';
import { etiquettesRendues, textes } from '../../../../../../testing/texte/textes-dom';
import { SlideCourbeComponent } from './slide-courbe.component';

type Courbe = Extract<PresentationServie, { renderer: 'courbe' }>['props'];

const COLLINE: Courbe = {
  title: 'La pente, point par point',
  figure: {
    formula: 'f(x) = −x² + 6x',
    xLabel: 'x',
    yLabel: 'f(x)',
    xRange: [0, 6],
    yRange: [0, 10],
    points: [0, 5, 8, 9, 8, 5, 0].map((y, x) => ({ x, y })),
    description: 'Une colline qui monte de 0 à 9 puis redescend.',
  },
  steps: [
    { title: 'Une colline', text: 'f monte, puis descend.' },
    {
      title: 'En x = 1',
      text: 'La pente vaut 4.',
      tangent: { x: 1, y: 5, slope: 4, label: 'pente 4' },
    },
    {
      title: 'Au sommet',
      text: 'La pente vaut 0.',
      tangent: { x: 3, y: 9, slope: 0, label: 'pente 0' },
    },
  ],
};

const etat = (racine: HTMLElement) => ({
  etape: textes(racine, '[data-testid="slide-courbe-etape"]'),
  titre: textes(racine, '[data-testid="slide-courbe-titre-etape"]'),
  tangentes: etiquettesRendues(racine),
  precedent: racine.querySelector<HTMLButtonElement>('[data-testid="slide-courbe-precedent"]')
    ?.disabled,
  suivant: racine.querySelector<HTMLButtonElement>('[data-testid="slide-courbe-suivant"]')
    ?.disabled,
});

describe('courbe pas à pas (RET-03)', () => {
  const fixture = montagePage(SlideCourbeComponent, {
    http: false,
    avantRendu: (montee) => poserLesEntrees(montee, COLLINE),
  });
  const monter = (...clics: readonly ('precedent' | 'suivant')[]): HTMLElement => {
    const racine = fixture().nativeElement as HTMLElement;
    for (const bouton of clics) {
      racine.querySelector<HTMLButtonElement>(`[data-testid="slide-courbe-${bouton}"]`)?.click();
      fixture().detectChanges();
    }
    return racine;
  };

  it('RET-03 · ouvre sur la première étape, sans tangente, Précédent fermé', () => {
    expect(etat(monter())).toEqual({
      etape: ['Étape 1/3'],
      titre: ['Une colline'],
      tangentes: [],
      precedent: true,
      suivant: false,
    });
  });

  it('RET-03 · chaque Suivant dévoile une étape et garde les tangentes des précédentes', () => {
    expect(etat(monter('suivant', 'suivant'))).toEqual({
      etape: ['Étape 3/3'],
      titre: ['Au sommet'],
      tangentes: ['pente 4', 'pente 0'],
      precedent: false,
      suivant: true,
    });
  });

  it('RET-03 · Précédent retire la tangente de l étape quittée', () => {
    expect(etat(monter('suivant', 'suivant', 'precedent'))).toEqual({
      etape: ['Étape 2/3'],
      titre: ['En x = 1'],
      tangentes: ['pente 4'],
      precedent: false,
      suivant: false,
    });
  });
});
