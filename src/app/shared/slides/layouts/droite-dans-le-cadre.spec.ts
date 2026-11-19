import { segmentDansLeCadre } from './droite-dans-le-cadre';

const CADRE = [0, 10] as const;

describe('segmentDansLeCadre', () => {
  it('trace une horizontale du cadre d un bord à l autre, à sa hauteur', () => {
    expect(segmentDansLeCadre({ slope: 0, intercept: 5 }, CADRE, CADRE)).toEqual({
      x1: 0,
      y1: 50,
      x2: 100,
      y2: 50,
    });
  });

  it('ne trace rien d une horizontale au-dessus du cadre', () => {
    expect(segmentDansLeCadre({ slope: 0, intercept: 11 }, CADRE, CADRE)).toBeNull();
  });

  it('coupe une droite montante là où elle sort par le haut', () => {
    expect(segmentDansLeCadre({ slope: 2, intercept: 0 }, CADRE, CADRE)).toEqual({
      x1: 0,
      y1: 100,
      x2: 50,
      y2: 0,
    });
  });

  it('coupe une droite descendante là où elle sort par le bas', () => {
    expect(segmentDansLeCadre({ slope: -1, intercept: 5 }, CADRE, CADRE)).toEqual({
      x1: 0,
      y1: 50,
      x2: 50,
      y2: 100,
    });
  });

  it('ne garde que la fenêtre vue autour du point de tangence', () => {
    expect(segmentDansLeCadre({ slope: 0, intercept: 5 }, CADRE, CADRE, [4, 6])).toEqual({
      x1: 40,
      y1: 50,
      x2: 60,
      y2: 50,
    });
  });

  it('borne au cadre une fenêtre qui en déborde', () => {
    expect(segmentDansLeCadre({ slope: 0, intercept: 5 }, CADRE, CADRE, [-2, 2])).toEqual({
      x1: 0,
      y1: 50,
      x2: 20,
      y2: 50,
    });
  });

  it('ne trace rien d une fenêtre hors du cadre', () => {
    expect(segmentDansLeCadre({ slope: 0, intercept: 5 }, CADRE, CADRE, [12, 14])).toBeNull();
  });

  it('ne trace rien d une droite qui ne fait que toucher un coin du cadre', () => {
    expect(segmentDansLeCadre({ slope: 1, intercept: 10 }, CADRE, CADRE)).toBeNull();
  });
});
