import {
  GAUGE_PERIMETER,
  buildDeterministicHeatmap,
  buildRandomHeatmap,
  gaugeOffset,
} from './sebastian-gauge';

/**
 * Snapshot oracle de la heatmap deterministe du hub (atelier) : 28 cases,
 * seuil bas par defaut 0.3. Verrouille le motif sin(i·1.7) de la maquette.
 */
const EXPECTED_DET_28: readonly number[] = [
  1, 3, 1, 0, 2, 3, 0, 0, 3, 2, 0, 1, 3, 1, 0, 2, 3, 0, 0, 3, 2, 0, 1, 3, 1, 0, 2, 3,
];

/**
 * Snapshot oracle de la heatmap deterministe de la landing Sebastian : 56
 * cases, seuil bas 0.32. Verrouille le motif sin(i·1.7) de la maquette.
 */
const EXPECTED_DET_56_032: readonly number[] = [
  1, 3, 1, 0, 2, 3, 0, 0, 3, 2, 0, 1, 3, 1, 0, 2, 3, 0, 0, 3, 2, 0, 1, 3, 1, 0, 2, 3, 0, 0, 3, 3, 0,
  0, 3, 2, 0, 1, 3, 1, 0, 2, 3, 0, 0, 3, 2, 0, 1, 3, 1, 0, 2, 3, 0, 0,
];

describe('sebastian-gauge — GAUGE_PERIMETER', () => {
  it('devrait exposer le perimetre du cercle SVG (2·π·40 ≈ 251)', () => {
    expect(GAUGE_PERIMETER).toBe(251);
  });
});

describe('sebastian-gauge — gaugeOffset', () => {
  it('devrait retourner le perimetre complet pour value=0 (jauge vide)', () => {
    expect(gaugeOffset(0)).toBe(251);
  });

  it('devrait retourner 0 pour value=100 (jauge pleine)', () => {
    expect(gaugeOffset(100)).toBe(0);
  });

  it('devrait retourner ≈55.22 pour value=78 (score cible du hub)', () => {
    expect(gaugeOffset(78)).toBeCloseTo(55.22, 2);
  });

  it('devrait rester coherent avec 251 - (value/100)*251', () => {
    for (const v of [12, 40, 63, 91]) {
      expect(gaugeOffset(v)).toBeCloseTo(251 - (v / 100) * 251, 9);
    }
  });
});

describe('sebastian-gauge — buildDeterministicHeatmap', () => {
  it('devrait produire 28 cases avec le seuil par defaut 0.3 (hub)', () => {
    expect(buildDeterministicHeatmap(28).length).toBe(28);
  });

  it('devrait produire 56 cases avec le seuil 0.32 (landing)', () => {
    expect(buildDeterministicHeatmap(56, 0.32).length).toBe(56);
  });

  it('devrait ne produire que des niveaux ∈ {0,1,2,3}', () => {
    for (const level of buildDeterministicHeatmap(56, 0.32)) {
      expect([0, 1, 2, 3]).toContain(level);
    }
  });

  it('devrait etre deterministe : deux appels identiques donnent le meme tableau', () => {
    expect(buildDeterministicHeatmap(28)).toEqual(buildDeterministicHeatmap(28));
    expect(buildDeterministicHeatmap(56, 0.32)).toEqual(buildDeterministicHeatmap(56, 0.32));
  });

  it('devrait correspondre au snapshot oracle 28 cases / seuil 0.3', () => {
    expect(buildDeterministicHeatmap(28)).toEqual([...EXPECTED_DET_28]);
  });

  it('devrait correspondre au snapshot oracle 56 cases / seuil 0.32', () => {
    expect(buildDeterministicHeatmap(56, 0.32)).toEqual([...EXPECTED_DET_56_032]);
  });

  it('devrait appliquer les seuils partages 0.78→3 et 0.55→2 (independants du seuil bas)', () => {
    // Oracle recalcule verbatim depuis la maquette pour prouver le mapping.
    const oracle = (length: number, low: number): number[] =>
      Array.from({ length }, (_, i) => {
        const v = (Math.sin(i * 1.7) + 1) / 2;
        return v > 0.78 ? 3 : v > 0.55 ? 2 : v > low ? 1 : 0;
      });
    expect(buildDeterministicHeatmap(28, 0.3)).toEqual(oracle(28, 0.3));
    expect(buildDeterministicHeatmap(56, 0.32)).toEqual(oracle(56, 0.32));
  });

  it('devrait donner un resultat identique pour 0.3 et 0.32 sur la sequence sin (aucune valeur ne tombe dans la bande ]0.3,0.32])', () => {
    // Documente : la sensibilite au seuil bas ne se manifeste PAS sur la
    // sequence deterministe (prouvee via buildRandomHeatmap ci-dessous).
    const noValueInBand = Array.from({ length: 56 }, (_, i) => {
      const v = (Math.sin(i * 1.7) + 1) / 2;
      return v > 0.3 && v <= 0.32;
    }).every((inBand) => !inBand);
    expect(noValueInBand).toBe(true);
    expect(buildDeterministicHeatmap(56, 0.3)).toEqual(buildDeterministicHeatmap(56, 0.32));
  });
});

describe('sebastian-gauge — buildRandomHeatmap', () => {
  afterEach(() => {
    if ((Math.random as jasmine.Spy).and) {
      (Math.random as jasmine.Spy).and.callThrough();
    }
  });

  it('devrait produire la longueur demandee (28 hub, 56 landing)', () => {
    expect(buildRandomHeatmap(28).length).toBe(28);
    expect(buildRandomHeatmap(56, 0.32).length).toBe(56);
  });

  it('devrait ne produire que des niveaux ∈ {0,1,2,3}', () => {
    for (const level of buildRandomHeatmap(56, 0.32)) {
      expect([0, 1, 2, 3]).toContain(level);
    }
  });

  it('devrait mapper r=0.9 → 3 (seuil 0.78)', () => {
    spyOn(Math, 'random').and.returnValue(0.9);
    expect(buildRandomHeatmap(3)).toEqual([3, 3, 3]);
  });

  it('devrait mapper r=0.6 → 2 (seuil 0.55)', () => {
    spyOn(Math, 'random').and.returnValue(0.6);
    expect(buildRandomHeatmap(2)).toEqual([2, 2]);
  });

  it('devrait mapper r=0.4 → 1 avec le seuil bas par defaut 0.3', () => {
    spyOn(Math, 'random').and.returnValue(0.4);
    expect(buildRandomHeatmap(2)).toEqual([1, 1]);
  });

  it('devrait mapper r=0.2 → 0 (sous le seuil bas)', () => {
    spyOn(Math, 'random').and.returnValue(0.2);
    expect(buildRandomHeatmap(2)).toEqual([0, 0]);
  });

  it('devrait prouver la sensibilite au seuil bas : r=0.31 → 1 (defaut 0.3) mais 0 (seuil 0.32)', () => {
    spyOn(Math, 'random').and.returnValue(0.31);
    expect(buildRandomHeatmap(1)).toEqual([1]);
    expect(buildRandomHeatmap(1, 0.32)).toEqual([0]);
  });

  it('devrait utiliser une comparaison stricte (> et non >=) sur les seuils', () => {
    // r exactement sur un seuil retombe au niveau inferieur.
    spyOn(Math, 'random').and.returnValue(0.78);
    expect(buildRandomHeatmap(1)).toEqual([2]); // 0.78 n'est pas > 0.78
  });
});
