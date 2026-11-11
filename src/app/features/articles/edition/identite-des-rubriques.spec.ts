import { identiteDeRubrique } from './identite-des-rubriques';

const RUBRIQUES = ['modeles_ia', 'outils_ia', 'dev_frameworks', 'web_internet', 'business_niches'];

describe('Identité des rubriques — couleur et picto par rubrique du récit', () => {
  it('donne à chaque rubrique servie par le Pi la couleur de la bande du mail', () => {
    expect(RUBRIQUES.map((id) => identiteDeRubrique(id).couleur)).toEqual([
      '#1a9a83',
      '#4a7ff0',
      '#bf8a0c',
      '#a24f9a',
      '#cf4442',
    ]);
  });

  it('donne à chaque rubrique un picto propre', () => {
    const pictos = RUBRIQUES.map((id) => identiteDeRubrique(id).picto);
    expect(new Set(pictos).size).toBe(RUBRIQUES.length);
    expect(pictos.every((picto) => picto.length > 0)).toBeTrue();
  });

  it('lit de la même façon la rubrique écrite avec des tirets', () => {
    expect(identiteDeRubrique('outils-ia')).toEqual(identiteDeRubrique('outils_ia'));
  });

  it('donne le neutre à une rubrique inconnue ou vide', () => {
    const neutre = identiteDeRubrique('');
    expect(neutre.couleur).toBe('#9c9384');
    expect(identiteDeRubrique('cuisine')).toEqual(neutre);
    expect(identiteDeRubrique('hasOwnProperty')).toEqual(neutre);
    expect(RUBRIQUES.map((id) => identiteDeRubrique(id).picto)).not.toContain(neutre.picto);
  });
});
