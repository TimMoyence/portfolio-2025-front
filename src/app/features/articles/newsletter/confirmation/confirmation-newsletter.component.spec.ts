import { ouvrirLeLienPuisCliquer } from '../../../../../testing/page/lien-de-la-newsletter';

const JETON = 'c'.repeat(64);

describe('Page de confirmation de la newsletter', () => {
  it('NL-03 NL-14 · confirme au clic seulement, et dit le refus d un lien expire', async () => {
    const { port, appelsAvantLeClic, hote } = await ouvrirLeLienPuisCliquer('confirmation', JETON);

    expect(appelsAvantLeClic).toBe(0);
    expect(port.confirmer.calls.allArgs()).toEqual([[JETON]]);
    expect(hote.textContent).toContain('Votre abonnement est confirmé.');
  });

  it('NL-03 · dit qu un lien expire ou faux ne vaut plus et propose de se reabonner', async () => {
    const { hote } = await ouvrirLeLienPuisCliquer('confirmation', JETON, { statut: 404 });

    expect(hote.textContent).toContain('Ce lien de confirmation a expiré ou n’est pas valable.');
    expect(hote.querySelector('app-newsletter-form input[type="email"]')).not.toBeNull();
    expect(hote.textContent).toContain('Se réabonner');
  });
});
