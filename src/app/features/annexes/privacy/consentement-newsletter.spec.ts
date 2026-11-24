import { rendreLaPolitique } from '../../../../testing/page/politique-de-confidentialite';
import { texteDe as texteNormalise } from '../../../../testing/texte/textes-dom';

describe('Consentement newsletter dans la politique de confidentialité', () => {
  it('NL-07 · fonde la newsletter sur le consentement', () => {
    const page = rendreLaPolitique();

    expect(texteNormalise(page.querySelector('#base p'))).toBe(
      "Le traitement repose, selon les cas, sur l'exécution d'un contrat (votre achat), votre consentement (newsletter, toolkit), ou notre intérêt légitime (sécurité et bon fonctionnement du site).",
    );
    expect([...page.querySelectorAll('#usage li')].map(texteNormalise)).toContain(
      'Vous envoyer la newsletter à laquelle vous vous êtes abonné, dans la langue choisie, jusqu’à votre désabonnement.',
    );
  });
});
