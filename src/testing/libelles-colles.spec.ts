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

  it('ignore un texte masqué', () => {
    expect(
      libellesColles(
        rendre('<p><span>Total</span><strong hidden>3</strong><span> élèves</span></p>'),
      ),
    ).toEqual([]);
  });
});
