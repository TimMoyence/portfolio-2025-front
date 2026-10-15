import { deuxImages } from '../../../testing/deux-images';
import { suivreLaSaisie } from './zone-de-saisie';

describe('suivreLaSaisie', () => {
  let zone: HTMLTextAreaElement;
  let arreter: () => void = () => undefined;

  beforeEach(() => {
    zone = document.createElement('textarea');
    zone.rows = 2;
    zone.style.cssText = 'box-sizing:border-box;width:240px;padding:8px;font:16px/1.5 sans-serif;';
    zone.value =
      'Le chiffre d affaires progresse de 12 % sur l année, porté par les ventes du second semestre.';
    document.body.appendChild(zone);
    arreter = suivreLaSaisie(zone);
  });

  afterEach(() => {
    arreter();
    zone.remove();
  });

  it('montre toute la réponse quand une police arrive après le premier calcul, comme une réponse restaurée avant le chargement des polices', async () => {
    zone.style.letterSpacing = '0.4em';
    document.fonts.dispatchEvent(new Event('loadingdone'));
    await deuxImages();

    expect(zone.scrollHeight).toBeLessThanOrEqual(zone.clientHeight);
  });
});
