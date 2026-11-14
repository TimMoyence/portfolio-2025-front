import {
  type Cadre,
  cadreFixe,
  cadresParRang,
  cotesDuPoint,
  pasQuiDegage,
  seGenent,
  touchent,
} from './garder-dans-le-trace';

const cadre = (left: number, top: number, largeur = 10, hauteur = 10): Cadre => ({
  left,
  right: left + largeur,
  top,
  bottom: top + hauteur,
});

const colonnesEspacees = (nombre: number, pas: number): Cadre[][] =>
  Array.from({ length: nombre }, (_, rang) => [cadre(rang * pas, 0)]);

function texteAu(left: number, top: number, rang?: number): HTMLElement {
  const texte = document.createElement('span');
  texte.textContent = '1 200';
  texte.style.cssText = `position:fixed;left:${left}px;top:${top}px;font:16px/20px sans-serif;margin:0;padding:0`;
  if (rang !== undefined) {
    texte.dataset['rang'] = String(rang);
  }
  document.body.append(texte);
  return texte;
}

describe('garder dans le tracé', () => {
  afterEach(() => {
    document.querySelectorAll('body > span').forEach((texte) => texte.remove());
  });

  it('QP-02 · deux libellés se gênent sous quatre pixels d écart côte à côte ou deux empilés, à l échelle du tracé', () => {
    expect(seGenent(cadre(0, 0), cadre(13, 0), 1)).toBeTrue();
    expect(seGenent(cadre(0, 0), cadre(15, 0), 1)).toBeFalse();
    expect(seGenent(cadre(0, 0), cadre(0, 11), 1)).toBeTrue();
    expect(seGenent(cadre(0, 0), cadre(0, 13), 1)).toBeFalse();
    expect(seGenent(cadre(0, 0), cadre(16, 0), 2)).toBeTrue();
  });

  it('QP-18 · une valeur touche une forme sous trois pixels d écart, à l échelle du tracé', () => {
    expect(touchent(cadre(0, 0), cadre(12, 0), 1)).toBeTrue();
    expect(touchent(cadre(0, 0), cadre(14, 0), 1)).toBeFalse();
    expect(touchent(cadre(0, 0), cadre(15, 0), 2)).toBeTrue();
  });

  it('QP-02 · garde une graduation sur le plus petit pas qui les dégage toutes', () => {
    expect(pasQuiDegage(colonnesEspacees(6, 20), 1)).toBe(1);
    expect(pasQuiDegage(colonnesEspacees(6, 12), 1)).toBe(2);
    expect(pasQuiDegage(colonnesEspacees(6, 5), 1)).toBe(3);
    expect(pasQuiDegage([], 1)).toBe(1);
  });

  it('QP-02 · ne compare jamais entre elles les lignes d une même graduation', () => {
    expect(pasQuiDegage([[cadre(0, 0), cadre(0, 2)], [cadre(20, 0)]], 1)).toBe(1);
  });

  it('range chaque libellé sous le rang de sa graduation', () => {
    const colonnes = cadresParRang([texteAu(0, 0, 0), texteAu(60, 0, 1), texteAu(0, 30, 0)]);

    expect(colonnes.map((cadres) => cadres.length)).toEqual([2, 1]);
  });

  it('fige un cadre mesuré en ses quatre bords, sans la mesure vivante du navigateur', () => {
    const fige = cadreFixe(new DOMRect(4, 6, 10, 20));

    expect(fige).toEqual({ left: 4, right: 14, top: 6, bottom: 26 });
    expect(Object.keys(fige)).toEqual(['left', 'right', 'top', 'bottom']);
  });

  it('QP-18 · sans point mesuré, la valeur n a qu un côté, là où elle est', () => {
    const valeur = texteAu(10, 10);

    expect(cotesDuPoint(valeur, undefined, false)).toHaveSize(1);
  });

  it('QP-18 · la valeur se lit d abord du côté demandé du point, puis en face, par symétrie autour de son centre', () => {
    const valeur = texteAu(10, 10);
    const boite = valeur.getBoundingClientRect();
    const point = cadre(10, 60, 8, 8);
    const decalage = point.top + point.bottom - boite.top - boite.bottom;

    const [dessus, enFace] = cotesDuPoint(valeur, point, false);
    const [enFaceDabord, ici] = cotesDuPoint(valeur, point, true);

    expect(enFace?.top).toBeCloseTo((dessus?.top ?? 0) + decalage, 5);
    expect(enFaceDabord).toEqual(enFace);
    expect(ici).toEqual(dessus);
  });
});
