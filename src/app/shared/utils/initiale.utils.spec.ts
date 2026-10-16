import { initialeDe } from './initiale.utils';

describe('initialeDe', () => {
  it('rend en majuscule la premiere lettre du libelle, blancs de tete ôtés', () => {
    expect(initialeDe('  élodie')).toBe('É');
    expect(initialeDe('banque')).toBe('B');
  });

  it('prend le premier libelle non vide, un libelle blanc comptant pour vide', () => {
    expect(initialeDe(undefined, '   ', 'dupont')).toBe('D');
    expect(initialeDe('', 'jean@exemple.fr')).toBe('J');
  });

  it('rend une chaine vide quand aucun libelle n a de lettre', () => {
    expect(initialeDe()).toBe('');
    expect(initialeDe('', '  ', undefined)).toBe('');
  });
});
