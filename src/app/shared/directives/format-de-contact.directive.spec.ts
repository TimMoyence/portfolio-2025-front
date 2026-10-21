import { erreurDeFormat } from './format-de-contact.directive';

describe('erreurDeFormat', () => {
  it('laisse passer une saisie vide, blanche ou absente, que la règle de présence juge seule', () => {
    for (const valeur of ['', '   ', null, undefined, 12]) {
      expect(erreurDeFormat(valeur, 'email')).withContext(String(valeur)).toBeNull();
    }
  });

  it('juge une adresse électronique après avoir retiré les blancs autour', () => {
    expect(erreurDeFormat('  marie@example.com  ', 'email')).toBeNull();
    expect(erreurDeFormat('marie@example', 'email')).toEqual({ email: true });
  });

  it('juge un numéro de téléphone', () => {
    expect(erreurDeFormat('pas un numéro', 'telephone')).toEqual({ phone: true });
  });

  it('ne juge rien sans format demandé', () => {
    expect(erreurDeFormat('marie@example', null)).toBeNull();
  });
});
