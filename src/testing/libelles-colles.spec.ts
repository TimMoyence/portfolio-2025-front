import { hoteDeRendu } from './hote-de-rendu';
import { libellesColles } from './libelles-colles';

describe('libellesColles', () => {
  const rendre = hoteDeRendu({ inlineSize: '40rem' });

  it('signale un libellé collé à sa valeur, comme « score moyen90 % » vu en QA', () => {
    expect(libellesColles(rendre('<p><span>score moyen</span><strong>90 %</strong></p>'))).toEqual([
      'score moyen|90 %',
    ]);
    expect(
      libellesColles(
        rendre('<p><span>Phase en cours :</span><strong>Vote individuel</strong></p>'),
      ),
    ).toEqual(['Phase en cours :|Vote individuel']);
  });

  it('signale aussi la jonction collée dans un Shadow DOM', () => {
    const brique = document.createElement('span');
    brique.attachShadow({ mode: 'open' }).innerHTML = '<strong>Juste</strong><span>Score</span>';
    const hote = rendre('<p></p>');
    hote.firstElementChild?.append(brique);

    expect(libellesColles(hote)).toEqual(['Juste|Score']);
  });

  it('signale deux textes qui se chevauchent, comme les années d un graphique serré sur un téléphone', () => {
    expect(
      libellesColles(
        rendre(
          '<div style="display:grid;grid-template-columns:repeat(3,1.2rem);font-size:1rem"><span>2019</span><span>2020</span><span>2021</span></div>',
        ),
      ),
    ).toEqual(['2019|2020', '2020|2021']);
    expect(
      libellesColles(
        rendre(
          '<div style="position:relative;height:2rem"><span style="position:absolute;left:3rem">−3,5</span><span style="position:absolute;left:2rem">12 %</span></div>',
        ),
      ),
    ).toEqual(['−3,5|12 %']);
  });

  it('ne juge, bout à bout, que le libellé collé à sa valeur, pas deux textes qui se chevauchent', () => {
    expect(
      libellesColles(
        rendre(
          '<p><span>score moyen</span><strong>90 %</strong></p><div style="position:relative;height:2rem"><span style="position:absolute;left:3rem">−3,5</span><span style="position:absolute;left:2rem">12 %</span></div>',
        ),
        'bout-a-bout',
      ),
    ).toEqual(['score moyen|90 %']);
  });

  it('laisse passer un texte invisible posé sur un texte visible', () => {
    const empiles = (style: string): string =>
      `<div style="position:relative;height:2rem"><span>Total</span><span style="position:absolute;left:0;${style}">Total</span></div>`;

    expect(
      [
        'opacity:0',
        'visibility:hidden',
        'clip:rect(0,0,0,0);width:1px;height:1px;overflow:hidden',
      ].flatMap((style) => libellesColles(rendre(empiles(style)))),
    ).toEqual([]);
    expect(
      libellesColles(
        rendre(
          '<div style="position:relative"><details><summary style="display:block;height:2rem">Voir les données</summary><p style="margin:0">Total</p></details><p style="position:absolute;top:2rem;left:0;margin:0">Total</p></div>',
        ),
      ),
    ).toEqual([]);
  });

  it('laisse passer un blanc rendu, une gouttière, une marge, une autre ligne ou une ponctuation', () => {
    expect(libellesColles(rendre('<p><span>score moyen</span> <strong>90 %</strong></p>'))).toEqual(
      [],
    );
    expect(
      libellesColles(
        rendre(
          '<p style="display:flex;gap:0.5rem"><span>Participants</span><strong>20</strong></p>',
        ),
      ),
    ).toEqual([]);
    expect(
      libellesColles(
        rendre('<p><span>Total</span><strong style="margin-left:0.5rem">3</strong></p>'),
      ),
    ).toEqual([]);
    expect(libellesColles(rendre('<p>Titre</p><p>Suite</p>'))).toEqual([]);
    expect(libellesColles(rendre('<p><strong>12</strong>, <span>(note)</span>.</p>'))).toEqual([]);
  });

  it('laisse passer un texte rogné hors du conteneur qu il est seul à occuper, comme la diapositive suivante sous le pied de page', () => {
    const sousLePied = (rognage: string): string =>
      `<div style="height:2rem;${rognage}"><p style="margin:0;height:2rem">Diapositive</p><p style="margin:0">68 %</p></div><p style="margin:0">Bordeaux</p>`;

    expect(
      ['overflow-y:auto', 'overflow:hidden'].flatMap((rognage) =>
        libellesColles(rendre(sousLePied(rognage))),
      ),
    ).toEqual([]);
  });

  it('signale encore deux textes qui se chevauchent dans le conteneur qui défile qu ils partagent, même hors de vue', () => {
    expect(
      libellesColles(
        rendre(
          '<div style="height:2rem;overflow-y:auto"><div style="height:2rem"></div><div style="position:relative;height:2rem"><span style="position:absolute;left:3rem">−3,5</span><span style="position:absolute;left:2rem">12 %</span></div></div>',
        ),
      ),
    ).toEqual(['−3,5|12 %']);
  });

  it('signale un texte en position absolue qui échappe au rognage de son parent non positionné', () => {
    expect(
      libellesColles(
        rendre(
          '<div style="position:relative;height:3rem"><div style="overflow:hidden;height:1rem"><span style="position:absolute;top:1.5rem;left:0">12 %</span></div><span style="position:absolute;top:1.5rem;left:0.5rem">−3,5</span></div>',
        ),
      ),
    ).toEqual(['12 %|−3,5']);
  });

  it('signale deux étiquettes empilées qui se touchent, comme les graduations d un axe serré, mais pas deux paragraphes serrés', () => {
    const empilees = (decalage: string): string =>
      `<div style="position:relative;height:4rem;font-size:1rem;line-height:1"><span style="position:absolute;top:0;right:0">1 000</span><span style="position:absolute;top:${decalage};right:0">500</span></div>`;

    expect(libellesColles(rendre(empilees('0.8em')))).toEqual(['1 000|500']);
    expect(libellesColles(rendre(empilees('1.6em')))).toEqual([]);
    expect(
      libellesColles(
        rendre(
          '<p style="margin:0;line-height:0.8">Marge brute</p><p style="margin:0;line-height:0.8">Résultat</p>',
        ),
      ),
    ).toEqual([]);
  });

  it('juge chaque écart dans la mise en page, quelle que soit la réduction de la toile à l écran', () => {
    const reduit = (echelle: number, contenu: string): string =>
      `<div style="transform:scale(${echelle});transform-origin:0 0">${contenu}</div>`;
    const compte = (ecart: string): string =>
      `<p style="display:flex;gap:${ecart};margin:0"><strong>2</strong><span>réponse(s)</span></p>`;
    const empilees = (decalage: string): string =>
      `<div style="position:relative;height:4rem;font-size:1rem;line-height:1"><span style="position:absolute;top:0;right:0">1 000</span><span style="position:absolute;top:${decalage};right:0">500</span></div>`;
    const chevauchees =
      '<div style="position:relative;height:2rem;font-size:1rem"><span style="position:absolute;left:0">0000</span><span style="position:absolute;left:calc(4ch - 0.25rem)">−000</span></div>';

    expect({
      separees: [0.2, 1, 3].flatMap((echelle) => [
        ...libellesColles(rendre(reduit(echelle, compte('0.35rem')))),
        ...libellesColles(rendre(reduit(echelle, empilees('1.6em')))),
      ]),
      colleesAGrandeEchelle: libellesColles(rendre(reduit(3, compte('0.1rem')))),
      chevaucheesAPetiteEchelle: libellesColles(rendre(reduit(0.2, chevauchees))),
    }).toEqual({
      separees: [],
      colleesAGrandeEchelle: ['2|réponse(s)'],
      chevaucheesAPetiteEchelle: ['0000|−000'],
    });
  });

  it('signale deux étiquettes empilées à 1 px de mise en page, dans une toile agrandie comme à ×1', () => {
    const reduit = (echelle: number, contenu: string): string =>
      `<div style="transform:scale(${echelle});transform-origin:0 0">${contenu}</div>`;
    const empilees = (decalage: string): string =>
      `<div style="position:relative;height:4rem;font-size:1rem;line-height:1"><span style="position:absolute;top:0;right:0">1 000</span><span style="position:absolute;top:${decalage};right:0">500</span></div>`;
    const mesure = rendre(empilees('3rem'));
    const plage = document.createRange();
    plage.selectNodeContents(mesure.querySelector('span')?.firstChild as Node);
    const hauteur = plage.getBoundingClientRect().height;
    const aUnPixel = empilees(`${hauteur + 1}px`);

    expect({
      hauteurLue: hauteur > 0,
      collees: [3, 1.5, 1].map((echelle) => libellesColles(rendre(reduit(echelle, aUnPixel)))),
      eloigneesAGrandeEchelle: libellesColles(rendre(reduit(3, empilees('1.6em')))),
    }).toEqual({
      hauteurLue: true,
      collees: [['1 000|500'], ['1 000|500'], ['1 000|500']],
      eloigneesAGrandeEchelle: [],
    });
  });

  it('ignore un texte masqué', () => {
    expect(
      libellesColles(
        rendre('<p><span>Total</span><strong hidden>3</strong><span> élèves</span></p>'),
      ),
    ).toEqual([]);
  });
});
