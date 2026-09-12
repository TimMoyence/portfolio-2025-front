import {
  creerMetadonneesBrique,
  type MetadonneesBrique,
  type Modalite,
  type RegimeVerrou,
} from './types';

const VALIDES: MetadonneesBrique = {
  concepts: ['interet-simple'],
  misconceptionsCiblees: ['confusion-taux-annuel-mensuel'],
  dureeMinutes: 10,
  modalite: 'solo',
  regime: 'ouvert',
};

describe('creerMetadonneesBrique', () => {
  it('accepte des metadonnees completes', () => {
    expect(creerMetadonneesBrique(VALIDES)).toEqual(VALIDES);
  });

  it('refuse une duree nulle', () => {
    expect(() => creerMetadonneesBrique({ ...VALIDES, dureeMinutes: 0 })).toThrow();
  });

  it('refuse une duree negative', () => {
    expect(() => creerMetadonneesBrique({ ...VALIDES, dureeMinutes: -5 })).toThrow();
  });

  it('refuse une modalite inconnue', () => {
    const modalite = 'improvisee' as Modalite;
    expect(() => creerMetadonneesBrique({ ...VALIDES, modalite })).toThrow();
  });

  it('refuse un regime inconnu', () => {
    const regime = 'permissif' as RegimeVerrou;
    expect(() => creerMetadonneesBrique({ ...VALIDES, regime })).toThrow();
  });

  it('refuse un tableau de concepts vide', () => {
    expect(() => creerMetadonneesBrique({ ...VALIDES, concepts: [] })).toThrow();
  });
});
