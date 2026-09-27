import { lignesDeCalculHtml } from './calculs';

describe('lignesDeCalculHtml', () => {
  it('rend chaque calcul dans sa ligne et échappe le texte', () => {
    const conteneur = document.createElement('p');
    conteneur.innerHTML = lignesDeCalculHtml(
      '100 × 1,10 = 110, puis 110 × 0,90 = 99 : la baisse <s’applique> à 110.',
    );

    expect(
      [...conteneur.querySelectorAll('.fp-ligne-de-calcul')].map((ligne) => ligne.textContent),
    ).toEqual(['100 × 1,10 = 110,', 'puis 110 × 0,90 = 99 :', 'la baisse <s’applique> à 110.']);
    expect(conteneur.querySelector('s')).toBeNull();
  });
});
