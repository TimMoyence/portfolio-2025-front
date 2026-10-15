import { hoteDeRendu } from './hote-de-rendu';
import { valeursSurUneForme } from './valeurs-sur-les-formes';

const ZONE = 'class="slide-chart__zone" style="position:relative;width:20rem;height:10rem"';
const SOCLE = 'class="slide-chart__bar-wrap" style="position:absolute;top:0;bottom:0;width:2rem;';
const BARRE = 'class="slide-chart__bar" style="position:absolute;left:0;right:0;bottom:0;';
const VALEUR = 'style="position:absolute;white-space:nowrap;font:16px monospace;line-height:1;';
const POINT = 'class="slide-chart__point" style="position:absolute;width:1rem;height:1rem;';

describe('valeursSurUneForme', () => {
  const rendre = hoteDeRendu();

  it('signale la valeur d une barre posée sur la barre voisine, jugée à sa hauteur finale même pendant qu elle pousse, comme « 4 602,48 » au B2-05', () => {
    expect(
      valeursSurUneForme(
        rendre(
          `<div ${ZONE}>` +
            `<div ${SOCLE}left:0"><span ${BARRE}height:40%"></span>` +
            `<span class="slide-chart__value" ${VALEUR}left:0;bottom:calc(40% + 0.4rem)">4 602,48</span></div>` +
            `<div ${SOCLE}left:2.25rem"><span ${BARRE}height:70%;transform:scaleY(0.06);transform-origin:bottom"></span></div>` +
            `</div>`,
        ),
      ),
    ).toEqual(['4 602,48 › bar']);
  });

  it('laisse passer une valeur sur sa propre barre ou son propre marqueur, et une valeur masquée', () => {
    expect(
      valeursSurUneForme(
        rendre(
          `<div ${ZONE}>` +
            `<div ${SOCLE}left:0"><span ${BARRE}height:40%"></span>` +
            `<span class="slide-chart__marqueur slide-chart__marqueur--barre" style="position:absolute;left:0;bottom:40%;width:1rem;height:1rem"></span>` +
            `<span class="slide-chart__value" ${VALEUR}left:0;bottom:calc(40% - 0.5rem)">5 000</span></div>` +
            `<div ${SOCLE}left:4rem"><span ${BARRE}height:70%"></span>` +
            `<span class="slide-chart__value" ${VALEUR}right:0;bottom:calc(40% + 0.4rem);visibility:hidden">8 347,98</span></div>` +
            `</div>`,
        ),
      ),
    ).toEqual([]);
  });

  it('signale la valeur d un point posée sur le point d une autre courbe, comme « 80 » sur le losange du prix du sac, mais pas sur son propre point', () => {
    expect(
      valeursSurUneForme(
        rendre(
          `<div ${ZONE}>` +
            `<span ${POINT}left:5rem;bottom:5rem"></span>` +
            `<span class="slide-chart__point-value" ${VALEUR}left:5rem;bottom:4.5rem">80</span>` +
            `<span ${POINT}left:5rem;bottom:3.6rem;transform:rotate(45deg)" data-marqueur="losange"></span>` +
            `</div>`,
        ),
      ),
    ).toEqual(['80 › point']);
  });
});
