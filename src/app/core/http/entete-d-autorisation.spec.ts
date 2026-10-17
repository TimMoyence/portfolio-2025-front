import { enteteDAutorisation } from './entete-d-autorisation';

describe('enteteDAutorisation', () => {
  it('porte le jeton de la session dans l en-tete Bearer', () => {
    expect(enteteDAutorisation('jwt-formateur')).toEqual({
      authorization: 'Bearer jwt-formateur',
    });
  });

  it('n envoie aucun en-tete sans jeton', () => {
    expect(enteteDAutorisation(null)).toEqual({});
    expect(enteteDAutorisation('')).toEqual({});
  });
});
