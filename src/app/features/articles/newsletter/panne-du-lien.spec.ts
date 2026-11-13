import { ouvrirLeLienPuisCliquer } from '../../../../testing/page/lien-de-la-newsletter';

describe('Panne pendant le clic sur un lien de la newsletter', () => {
  it('NL-03 · une panne garde le bouton pour reessayer et ne propose pas de se reabonner', async () => {
    const { hote } = await ouvrirLeLienPuisCliquer('confirmation', 'c'.repeat(64), {
      statut: 503,
    });

    const boutons = Array.from(hote.querySelectorAll('button')).map((bouton) =>
      bouton.textContent?.trim(),
    );
    expect(boutons).toContain('Confirmer mon abonnement');
    expect(hote.querySelector('app-newsletter-form')).toBeNull();
    expect(hote.querySelector('[role="alert"]')?.textContent?.trim()).not.toBe('');
  });
});
