import { longueurDeLaSaisie, longueurDeTexte } from './longueur-de-texte';

describe('longueur de texte', () => {
  it('compte les caracteres, pas les unites UTF-16', () => {
    expect(longueurDeTexte('😀é')).toBe(2);
  });

  it('compte une saisie comme le serveur : rognee de ses blancs de tete et de fin', () => {
    expect(longueurDeLaSaisie('  😀 a \n')).toBe(3);
  });
});
