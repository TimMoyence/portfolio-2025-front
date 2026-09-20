import { sansStockageLocal, saturationDuStockage } from '../../../testing/sans-stockage';
import { clearIdentity, readIdentity, saveIdentity } from './identity';

const THEO = { prenom: 'Theo', nom: 'Martin', email: 'theo@example.com' };

describe('identity', () => {
  beforeEach(() => {
    clearIdentity();
  });

  afterEach(() => {
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
    const premiere = saveIdentity(THEO);
    const seconde = saveIdentity(THEO);
    expect(seconde.identite.studentKey).toBe(premiere.identite.studentKey);
  });

  it('produit une cle au format uuid v4', () => {
    const enregistrement = saveIdentity(THEO);
    expect(enregistrement.identite.studentKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(enregistrement.persistee).toBe(true);
  });

  it('donne une cle neuve a qui saisit une autre identite sur le meme poste', () => {
    const premiere = saveIdentity(THEO);
    const seconde = saveIdentity({ prenom: 'Lea', nom: 'Dubois', email: 'lea@example.com' });
    expect(seconde.identite.studentKey).not.toBe(premiere.identite.studentKey);
    expect(seconde.identite.nom).toBe('Dubois');
  });

  it('donne une cle neuve des qu un seul champ du triplet change', () => {
    const premiere = saveIdentity(THEO);
    const nom = saveIdentity({ prenom: 'Theo', nom: 'Durand', email: 'theo@example.com' });
    expect(nom.identite.studentKey).not.toBe(premiere.identite.studentKey);
    const email = saveIdentity({ prenom: 'Theo', nom: 'Durand', email: 'autre@example.com' });
    expect(email.identite.studentKey).not.toBe(nom.identite.studentKey);
  });

  it('garde la cle quand le meme etudiant revient, a la casse de l adresse pres', () => {
    const premiere = saveIdentity(THEO);
    const reprise = saveIdentity({ prenom: ' Theo ', nom: 'Martin ', email: 'THEO@example.com' });
    expect(reprise.identite.studentKey).toBe(premiere.identite.studentKey);
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

  it('sous saturation du stockage, l identite tient en memoire et signale qu elle n est pas persistee', () => {
    spyOn(globalThis.localStorage, 'setItem').and.throwError(saturationDuStockage());
    const enregistrement = saveIdentity(THEO);
    expect(enregistrement.persistee).toBe(false);
    expect(enregistrement.identite.prenom).toBe('Theo');
    expect(readIdentity()?.studentKey).toBe(enregistrement.identite.studentKey);
  });

  it('sous stockage absent, la cle etudiant reste identique entre deux lectures', () => {
    sansStockageLocal(() => {
      const premiere = saveIdentity(THEO);
      const seconde = saveIdentity(THEO);
      expect(premiere.persistee).toBe(false);
      expect(seconde.persistee).toBe(false);
      expect(seconde.identite.studentKey).toBe(premiere.identite.studentKey);
      expect(readIdentity()?.studentKey).toBe(premiere.identite.studentKey);
    });
  });

  it('refuse de generer une cle sans source d aleatoire disponible', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
    try {
      expect(() =>
        saveIdentity({ prenom: 'Theo', nom: 'Martin', email: 'theo@example.com' }),
      ).toThrowError(/identifiant sécurisé/);
    } finally {
      if (original) {
        Object.defineProperty(globalThis, 'crypto', original);
      } else {
        delete (globalThis as { crypto?: Crypto }).crypto;
      }
    }
  });
});
