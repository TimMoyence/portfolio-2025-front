import { ouvrirLeLienPuisCliquer } from '../../../../../testing/page/lien-de-la-newsletter';

const JETON_DE_DESABONNEMENT = '0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d';

describe('Page de désabonnement de la newsletter', () => {
  it('NL-05 NL-14 · desabonne au clic seulement', async () => {
    const { port, appelsAvantLeClic, hote } = await ouvrirLeLienPuisCliquer(
      'desabonnement',
      JETON_DE_DESABONNEMENT,
    );

    expect(appelsAvantLeClic).toBe(0);
    expect(port.seDesabonner.calls.allArgs()).toEqual([[JETON_DE_DESABONNEMENT]]);
    expect(hote.textContent).toContain('Vous êtes désabonné.');
  });

  it('NL-05 · dit qu un lien de desabonnement inconnu n est pas valable', async () => {
    const { hote } = await ouvrirLeLienPuisCliquer('desabonnement', JETON_DE_DESABONNEMENT, {
      statut: 404,
    });

    expect(hote.textContent).toContain('Ce lien de désabonnement n’est pas valable.');
  });
});
