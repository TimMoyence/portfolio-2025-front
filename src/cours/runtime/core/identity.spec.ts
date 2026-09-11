import { clearIdentity, readIdentity, saveIdentity } from './identity';

describe('identity', () => {
  beforeEach(() => {
    clearIdentity();
  });

  it('retourne null quand rien n est enregistre', () => {
    expect(readIdentity()).toBeNull();
  });

  it('enregistre et relit une identite', () => {
    saveIdentity({ prenom: 'Theo', nom: 'Martin', email: 'theo@example.com' });
    expect(readIdentity()?.prenom).toBe('Theo');
  });

  it('genere une cle etudiant stable', () => {
    const premiere = saveIdentity({ prenom: 'Theo', nom: 'Martin', email: 'theo@example.com' });
    const seconde = saveIdentity({ prenom: 'Theo', nom: 'Martin', email: 'theo@example.com' });
    expect(seconde.studentKey).toBe(premiere.studentKey);
  });

  it('produit une cle au format uuid v4', () => {
    const identite = saveIdentity({ prenom: 'Theo', nom: 'Martin', email: 'theo@example.com' });
    expect(identite.studentKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('met a jour le nom sans changer la cle', () => {
    const premiere = saveIdentity({ prenom: 'Theo', nom: 'Martin', email: 'theo@example.com' });
    const seconde = saveIdentity({ prenom: 'Theo', nom: 'Durand', email: 'theo@example.com' });
    expect(seconde.studentKey).toBe(premiere.studentKey);
    expect(seconde.nom).toBe('Durand');
  });

  it('oublie l identite apres effacement', () => {
    saveIdentity({ prenom: 'Theo', nom: 'Martin', email: 'theo@example.com' });
    clearIdentity();
    expect(readIdentity()).toBeNull();
  });

  it('refuse une adresse invalide', () => {
    expect(() =>
      saveIdentity({ prenom: 'Theo', nom: 'Martin', email: 'pas-une-adresse' }),
    ).toThrow();
  });

  it('refuse un prenom vide', () => {
    expect(() =>
      saveIdentity({ prenom: '  ', nom: 'Martin', email: 'theo@example.com' }),
    ).toThrow();
  });
});
