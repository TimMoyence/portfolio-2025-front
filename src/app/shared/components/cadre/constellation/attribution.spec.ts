import {
  creerChamp,
  estomper,
  pointsLibres,
  redimensionner,
  tenirLesFormes,
  type Champ,
  type Demande,
} from './champ';

const hasardFixe = (): number => 0.5;
const loin = (index: number) => ({ x: 5000 + index * 10, y: 5000 });
const sommets = (nombre: number) => Array.from({ length: nombre }, (_, index) => loin(index));
const etapes: Demande = { cle: 'etapes', sommets: sommets(4) };
const douze: Demande = { cle: 'douze', sommets: sommets(12) };
const carte: Demande = { cle: 'carte', sommets: sommets(8) };

const forme = (champ: Champ, cle: string) => champ.formes.find((tenue) => tenue.cle === cle);
const nes = (champ: Champ, cle: string) => forme(champ, cle)?.points.filter(({ ne }) => ne) ?? [];
const tenu = (largeur: number, hauteur: number, demandes: readonly Demande[]): Champ => {
  const champ = creerChamp(largeur, hauteur, hasardFixe);
  tenirLesFormes(champ, demandes);
  return champ;
};
const retreci = (demandes: readonly Demande[]): Champ => {
  const champ = tenu(1350, 940, demandes);
  redimensionner(champ, 412, 823, hasardFixe);
  return champ;
};

describe('CON-05 · une forme tenue est toujours entière et laisse 6 points libres', () => {
  it('CON-05 · N = 18, étapes et forme de 12 → étapes 4, forme de 12 8 libres pris et 4 points nés, 6 libres', () => {
    const champ = tenu(412, 823, [etapes, douze]);

    expect(forme(champ, 'etapes')?.points.length).toBe(4);
    expect(nes(champ, 'etapes').length).toBe(0);
    expect(forme(champ, 'douze')?.points.length).toBe(12);
    expect(nes(champ, 'douze').length).toBe(4);
    expect([pointsLibres(champ).length, champ.points.length]).toEqual([6, 18]);
  });

  it('CON-05 · N = 58, même cas → 16 points pris, 42 libres, aucun né', () => {
    const champ = tenu(1350, 940, [etapes, douze]);

    expect(pointsLibres(champ).length).toBe(42);
    expect(nes(champ, 'douze').length).toBe(0);
  });

  it('CON-05 · N = 18, forme de 12 seul → 12 pris, 6 libres, aucun né', () => {
    const champ = tenu(412, 823, [douze]);

    expect(pointsLibres(champ).length).toBe(6);
    expect(nes(champ, 'douze').length).toBe(0);
  });

  it('CON-05 · chaque sommet prend le libre le plus proche, le plus petit indice à égalité', () => {
    const champ = creerChamp(412, 823, hasardFixe);
    champ.points.forEach((point, index) => Object.assign(point, loin(index)));
    Object.assign(champ.points[3], { x: 6, y: 0 });
    Object.assign(champ.points[7], { x: -100, y: 0 });
    Object.assign(champ.points[9], { x: -100, y: 0 });

    tenirLesFormes(champ, [
      {
        cle: 'paire',
        sommets: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
        ],
      },
    ]);

    expect(forme(champ, 'paire')?.points).toEqual([champ.points[3], champ.points[7]]);
  });
});

describe('CON-05 · relâche et fondu des points nés', () => {
  it('CON-05 · les étapes se relâchent → 10 libres, la forme de 12 garde ses 4 nés', () => {
    const champ = tenu(412, 823, [etapes, douze]);

    tenirLesFormes(champ, [douze]);

    expect(pointsLibres(champ).length).toBe(10);
    expect(nes(champ, 'douze').length).toBe(4);
  });

  it('CON-05 · un point né apparaît en 400 ms, puis s efface en 400 ms quand sa forme se relâche', () => {
    const champ = tenu(412, 823, [etapes, douze]);
    const [premierNe] = nes(champ, 'douze');

    expect(premierNe.opacite).toBe(0);
    estomper(champ, 0.2);
    expect(premierNe.opacite).toBeCloseTo(0.5, 6);
    estomper(champ, 0.2);
    expect(premierNe.opacite).toBeCloseTo(1, 6);

    tenirLesFormes(champ, []);
    expect(pointsLibres(champ).length).toBe(18);
    expect(champ.partants.length).toBe(4);
    estomper(champ, 0.2);
    expect(premierNe.opacite).toBeCloseTo(0.5, 6);
    estomper(champ, 0.2);
    expect(champ.partants).toEqual([]);
  });

  it('CON-05 · un point né relâché en plein fondu d apparition s efface depuis son opacité courante', () => {
    const champ = tenu(412, 823, [etapes, douze]);
    const [premierNe] = nes(champ, 'douze');
    estomper(champ, 0.2);

    tenirLesFormes(champ, [etapes]);
    estomper(champ, 0.1);

    expect(premierNe.opacite).toBeCloseTo(0.25, 6);
    estomper(champ, 0.1);
    expect(champ.partants).toEqual([]);
  });

  it('CON-07 · sans fondu, un point né apparaît d emblée et disparaît à l image suivante', () => {
    const champ = tenu(412, 823, [etapes, douze]);

    estomper(champ, Infinity);
    expect(nes(champ, 'douze').map(({ opacite }) => opacite)).toEqual([1, 1, 1, 1]);

    tenirLesFormes(champ, [etapes]);
    estomper(champ, Infinity);
    expect(champ.partants).toEqual([]);
  });
});

describe('CON-01 · quand la fenêtre rétrécit, la dernière forme se relâche', () => {
  it('CON-01 · 1350×940, étapes et forme de 12 tenus → 412×823 : la forme de 12 se relâche, étapes tenues, 14 libres', () => {
    const champ = tenu(1350, 940, [etapes, douze]);
    const pointsDesEtapes = [...(forme(champ, 'etapes')?.points ?? [])];

    redimensionner(champ, 412, 823, hasardFixe);

    expect(champ.points.length).toBe(18);
    expect(forme(champ, 'douze')).toBeUndefined();
    expect(forme(champ, 'etapes')?.points).toEqual(pointsDesEtapes);
    pointsDesEtapes.forEach((point) => expect(champ.points).toContain(point));
    expect(pointsLibres(champ).length).toBe(14);
  });

  it('CON-01 · la forme relâchée ne se reforme pas tant qu elle reste dans la fenêtre, puis revient après en être sortie', () => {
    const champ = retreci([etapes, douze]);

    tenirLesFormes(champ, [etapes, douze]);
    expect(forme(champ, 'douze')).toBeUndefined();

    tenirLesFormes(champ, [etapes]);
    tenirLesFormes(champ, [etapes, douze]);
    expect(forme(champ, 'douze')?.points.length).toBe(12);
    expect(nes(champ, 'douze').length).toBe(4);
  });

  it('CON-01 · carte, étapes et forme de 12 → 412×823 : seul la forme de 12 se relâche, 6 libres', () => {
    const champ = retreci([carte, etapes, douze]);

    expect(champ.formes.map(({ cle }) => cle)).toEqual(['carte', 'etapes']);
    expect([pointsLibres(champ).length, champ.points.length]).toEqual([6, 18]);
  });

  it('CON-01 · retour à 1350×940 : 58 points, la forme de 12 se reforme', () => {
    const champ = retreci([etapes, douze]);

    redimensionner(champ, 1350, 940, hasardFixe);
    tenirLesFormes(champ, [etapes, douze]);

    expect(champ.points.length).toBe(58);
    expect(forme(champ, 'douze')?.points.length).toBe(12);
    expect(nes(champ, 'douze').length).toBe(0);
  });
});
