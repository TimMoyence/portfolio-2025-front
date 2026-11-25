import type { Boite } from '../formes';
import type { Sommet } from './ciel';
import { cielVide, dessinerLeCiel, suivreLeCiel, type Ciel, type Place } from './etoiles';
import { ANNEAU } from './figures';

const IMAGE = 1 / 60;
const CASSIOPEE = ANNEAU.findIndex(({ nom }) => nom === 'Cassiopée');
const DAUPHIN = ANNEAU.findIndex(({ nom }) => nom === 'Dauphin');
const LYRE = ANNEAU.findIndex(({ nom }) => nom === 'Lyre');

const en = (figure: number): Place => ({ figure, section: ANNEAU[figure].nom });

const rangee = (nombre: number, y: number): Sommet[] =>
  Array.from({ length: nombre }, (_, index) => ({ x: 100 * index, y, rayon: 2 }));

const pose = (figure: number, sommets: readonly Sommet[]): Ciel => {
  const ciel = cielVide();
  suivreLeCiel(ciel, en(figure), sommets, 0, true);
  return ciel;
};

const journal = (ciel: Ciel, reduit: boolean, voiles: readonly Boite[] = []) => {
  const contexte = document.createElement('canvas').getContext('2d');
  if (!contexte) throw new Error('pas de contexte 2D');
  const traits: number[] = [];
  const etoiles: number[] = [];
  const longueurs: number[] = [];
  let depart = { x: 0, y: 0 };
  spyOn(contexte, 'moveTo').and.callFake((x, y) => (depart = { x, y }));
  spyOn(contexte, 'lineTo').and.callFake((x, y) =>
    longueurs.push(Math.round(Math.hypot(x - depart.x, y - depart.y))),
  );
  spyOn(contexte, 'stroke').and.callFake(() => traits.push(contexte.globalAlpha));
  spyOn(contexte, 'fill').and.callFake(() => etoiles.push(contexte.globalAlpha));
  dessinerLeCiel(contexte, ciel, '#277465', reduit, voiles);
  return { traits, etoiles, longueurs };
};

describe('CIEL-05 · le passage d une figure à la suivante', () => {
  it('CIEL-05 · l étoile i glisse vers l étoile i : 12 % du chemin par image, sans saut', () => {
    const ciel = pose(CASSIOPEE, rangee(5, 0));
    const premiere = ciel.etoiles[0];

    suivreLeCiel(ciel, en(DAUPHIN), rangee(5, 100), IMAGE, false);

    expect(ciel.etoiles[0]).toBe(premiere);
    expect(ciel.etoiles.map(({ y }) => Math.round(y * 100) / 100)).toEqual([12, 12, 12, 12, 12]);
  });

  it('CIEL-05 · Cassiopée (5) → Lyre (6) : la 6e étoile naît sur sa place et apparaît en 400 ms', () => {
    const ciel = pose(CASSIOPEE, rangee(5, 0));

    suivreLeCiel(ciel, en(LYRE), rangee(6, 100), 0.2, false);
    expect(ciel.etoiles.length).toBe(6);
    expect(ciel.etoiles[5]).toEqual(jasmine.objectContaining({ x: 500, y: 100, opacite: 0.5 }));

    suivreLeCiel(ciel, en(LYRE), rangee(6, 100), 0.2, false);
    expect(ciel.etoiles[5].opacite).toBe(1);
  });

  it('CIEL-05 · Lyre (6) → Cassiopée (5) : l étoile en trop s efface en 400 ms, puis disparaît', () => {
    const ciel = pose(LYRE, rangee(6, 0));
    const enTrop = ciel.etoiles[5];

    suivreLeCiel(ciel, en(CASSIOPEE), rangee(5, 100), 0.2, false);
    expect(ciel.etoiles.length).toBe(5);
    expect(ciel.partantes).toEqual([enTrop]);
    expect(enTrop.opacite).toBe(0.5);

    suivreLeCiel(ciel, en(CASSIOPEE), rangee(5, 100), 0.2, false);
    expect(ciel.partantes).toEqual([]);
  });

  it('CIEL-07 · plus de figure : toutes les étoiles s effacent', () => {
    const ciel = pose(CASSIOPEE, rangee(5, 0));

    suivreLeCiel(ciel, undefined, [], 0.2, false);

    expect(ciel.etoiles).toEqual([]);
    expect(ciel.partantes.length).toBe(5);
  });

  it('CIEL-05 · avec « réduire », la figure suivante est posée d emblée, entière et tracée', () => {
    const ciel = pose(CASSIOPEE, rangee(5, 0));

    suivreLeCiel(ciel, en(LYRE), rangee(6, 100), 0, true);

    expect(ciel.etoiles.map(({ y, opacite }) => [y, opacite])).toEqual(
      Array.from({ length: 6 }, () => [100, 1]),
    );
    expect(ciel.partantes).toEqual([]);
    expect(journal(ciel, true).traits.length).toBe(ANNEAU[LYRE].segments.length);
  });
});

describe('VOI-02 · sur la nuit, le ciel passe au quart sous le texte', () => {
  it('VOI-02 · Cassiopée en rangée, un bloc de texte sur la 3e étoile : ses deux traits et elle au quart, le reste intact', () => {
    const bloc: Boite = { left: 150, top: -10, width: 100, height: 20 };

    const { traits, etoiles } = journal(pose(CASSIOPEE, rangee(5, 0)), true, [bloc]);

    expect(traits).toEqual([0.2, 0.05, 0.05, 0.2]);
    expect(etoiles).toEqual([0.5, 0.5, 0.125, 0.5, 0.5]);
  });

  it('VOI-02 · un segment au tiers de son tracé n atteint pas encore le bloc : intact, puis voilé une fois tracé', () => {
    const bloc: Boite = { left: 380, top: -10, width: 10, height: 20 };
    const ciel = pose(DAUPHIN, rangee(5, 0));
    suivreLeCiel(ciel, en(CASSIOPEE), rangee(5, 0), (1.5 * (3 + 1 / 3)) / 4, false);

    expect(journal(ciel, true, [bloc]).traits).toEqual([0.2, 0.2, 0.2, 0.2]);

    suivreLeCiel(ciel, en(CASSIOPEE), rangee(5, 0), 1, false);

    expect(journal(ciel, true, [bloc]).traits).toEqual([0.2, 0.2, 0.2, 0.05]);
  });

  it('VOI-02 · c est le centre de l étoile qui décide : à 1 px hors du bloc, elle reste à 0,5', () => {
    const bloc: Boite = { left: 201, top: -10, width: 40, height: 20 };

    const { etoiles } = journal(pose(CASSIOPEE, rangee(5, 0)), true, [bloc]);

    expect(etoiles).toEqual([0.5, 0.5, 0.5, 0.5, 0.5]);
  });
});

describe('CIEL-07 · la figure reste collée à sa boîte', () => {
  it('CIEL-07 · même section, boîte décalée de 40 px pendant le tracé : chaque étoile est à sa nouvelle place à l image suivante, tracé et opacités intacts', () => {
    const ciel = cielVide();
    suivreLeCiel(ciel, en(CASSIOPEE), rangee(5, 0), 0.75, false);

    suivreLeCiel(ciel, en(CASSIOPEE), rangee(5, 40), IMAGE, false);

    expect(ciel.etoiles.map(({ x, y, opacite }) => [x, y, opacite])).toEqual(
      rangee(5, 40).map(({ x, y }) => [x, y, 1]),
    );
    expect(ciel.trace).toBeCloseTo(0.5 + IMAGE / 1.5, 9);
  });

  it('CIEL-07 · en plein glissement, un défilement de 40 px décale chaque étoile de 40 px en plus de ses 12 %', () => {
    const ciel = pose(CASSIOPEE, rangee(5, 0));
    suivreLeCiel(ciel, en(DAUPHIN), rangee(5, 100), IMAGE, false);

    suivreLeCiel(ciel, en(DAUPHIN), rangee(5, 140), IMAGE, false);

    expect(ciel.etoiles.map(({ y }) => Math.round(y * 100) / 100)).toEqual(
      Array.from({ length: 5 }, () => 62.56),
    );
  });

  it('CIEL-07 · même figure, autre section : les étoiles glissent vers leur nouvelle place, sans retracer', () => {
    const ciel = pose(CASSIOPEE, rangee(5, 0));

    suivreLeCiel(ciel, { figure: CASSIOPEE, section: 'bande' }, rangee(5, 100), IMAGE, false);

    expect(ciel.etoiles.map(({ y }) => Math.round(y * 100) / 100)).toEqual([12, 12, 12, 12, 12]);
    expect(ciel.trace).toBe(1);
  });
});

describe('CIEL-05 · les traits se tracent en 1,5 s, segment après segment', () => {
  it('CIEL-05 · Cassiopée, 4 segments de 100 px : rien au changement, 2 tracés à 0,75 s, 3 et un tiers à 1,25 s, tous à 1,5 s', () => {
    const ciel = pose(DAUPHIN, rangee(5, 0));
    suivreLeCiel(ciel, en(CASSIOPEE), rangee(5, 0), 0, false);
    expect(journal(ciel, false).traits).toEqual([]);

    suivreLeCiel(ciel, en(CASSIOPEE), rangee(5, 0), 0.75, false);
    expect(journal(ciel, false).longueurs).toEqual([100, 100]);

    suivreLeCiel(ciel, en(CASSIOPEE), rangee(5, 0), 0.5, false);
    expect(journal(ciel, false).longueurs).toEqual([100, 100, 100, 33]);

    suivreLeCiel(ciel, en(CASSIOPEE), rangee(5, 0), 0.25, false);
    expect(journal(ciel, false).longueurs).toEqual([100, 100, 100, 100]);
  });
});

describe('CIEL-04 · CIEL-05 · un décor en fondu qui scintille', () => {
  it('CIEL-04 · posée : traits à 0,2, étoiles à 0,5', () => {
    const { traits, etoiles } = journal(pose(CASSIOPEE, rangee(5, 0)), true);

    expect(traits).toEqual([0.2, 0.2, 0.2, 0.2]);
    expect(etoiles).toEqual([0.5, 0.5, 0.5, 0.5, 0.5]);
  });

  it('CIEL-05 · sans réduire, chaque étoile scintille à son rythme entre 0,4 et 0,6', () => {
    const ciel = pose(CASSIOPEE, rangee(5, 0));
    suivreLeCiel(ciel, en(CASSIOPEE), rangee(5, 0), 0.7, false);
    const avant = journal(ciel, false).etoiles;
    suivreLeCiel(ciel, en(CASSIOPEE), rangee(5, 0), 0.5, false);
    const apres = journal(ciel, false).etoiles;

    for (const opacite of [...avant, ...apres]) {
      expect(opacite).toBeGreaterThanOrEqual(0.4 - 1e-9);
      expect(opacite).toBeLessThanOrEqual(0.6 + 1e-9);
    }
    expect(new Set(avant.map((opacite) => opacite.toFixed(4))).size).toBe(5);
    expect(apres).not.toEqual(avant);
  });
});
