import { creerChamp, pointsLibres, redimensionner, tenirLesFormes, type Demande } from './champ';

const hasardFixe = (): number => 0.5;
const sommets = (nombre: number) =>
  Array.from({ length: nombre }, (_, index) => ({ x: 5000 + index * 10, y: 5000 }));
const carte: Demande = { cle: 'carte', sommets: sommets(8) };
const etapes: Demande = { cle: 'etapes', sommets: sommets(4) };
const douze: Demande = { cle: 'douze', sommets: sommets(12) };

describe('CON-01 · quand N baisse, les points nés ne comptent pas parmi les libres', () => {
  it('CON-01 · 412×1175, carte relâchée, étapes et forme de 12 avec 8 nés → 412×823 : 4 libres retirés, la forme de 12 garde ses 8 nés, 10 libres', () => {
    const champ = creerChamp(412, 1175, hasardFixe);
    tenirLesFormes(champ, [carte, etapes, douze]);
    tenirLesFormes(champ, [etapes, douze]);

    redimensionner(champ, 412, 823, hasardFixe);

    expect(champ.formes.map(({ cle }) => cle)).toEqual(['etapes', 'douze']);
    expect(champ.formes[1].points.filter(({ ne }) => ne).length).toBe(8);
    expect(pointsLibres(champ).length).toBe(10);
    expect(champ.points.length).toBe(18);
    expect(champ.suspendues.has('douze')).toBeFalse();
  });
});
