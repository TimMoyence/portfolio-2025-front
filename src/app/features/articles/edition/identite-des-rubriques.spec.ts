import { identiteDeRubrique } from './identite-des-rubriques';

const RUBRIQUES = ['modeles-ia', 'outils-ia', 'dev-frameworks', 'web-internet', 'business-niches'];

describe('Identité des rubriques — couleur, picto et libellé par id de section', () => {
  it('donne à chaque rubrique la couleur de la bande du mail', () => {
    expect(RUBRIQUES.map((id) => identiteDeRubrique(id, 'Titre').couleur)).toEqual([
      '#1a9a83',
      '#4a7ff0',
      '#bf8a0c',
      '#a24f9a',
      '#cf4442',
    ]);
  });

  it('donne à chaque rubrique un picto propre', () => {
    const pictos = RUBRIQUES.map((id) => identiteDeRubrique(id, 'Titre').picto);
    expect(new Set(pictos).size).toBe(RUBRIQUES.length);
    expect(pictos.every((picto) => picto.length > 0)).toBeTrue();
  });

  it('donne au radar d’une rubrique l’identité de sa rubrique', () => {
    const rubrique = identiteDeRubrique('outils-ia', 'Outils IA & Agents');
    const radar = identiteDeRubrique('radar-outils-ia', 'Radar — Outils IA & Agents');
    expect(radar).toEqual(rubrique);
  });

  it('donne le neutre à un id inconnu et au radar sans rubrique', () => {
    const neutre = identiteDeRubrique('', '');
    expect(neutre.couleur).toBe('#9c9384');
    expect(identiteDeRubrique('cuisine', 'Cuisine').couleur).toBe(neutre.couleur);
    expect(identiteDeRubrique('radar', 'Radar').picto).toBe(neutre.picto);
    expect(RUBRIQUES.map((id) => identiteDeRubrique(id, 'T').picto)).not.toContain(neutre.picto);
  });

  it('écrit toujours le libellé servi, sans le préfixe du radar', () => {
    expect(identiteDeRubrique('modeles-ia', 'Modèles IA & Recherche').libelle).toBe(
      'Modèles IA & Recherche',
    );
    expect(identiteDeRubrique('radar-web-internet', 'Radar — Web & Internet').libelle).toBe(
      'Web & Internet',
    );
    expect(identiteDeRubrique('cuisine', 'Cuisine').libelle).toBe('Cuisine');
  });

  it('nomme « Autres signaux » le radar sans rubrique', () => {
    expect(identiteDeRubrique('', '').libelle).toBe('Autres signaux');
    expect(identiteDeRubrique('radar', 'Radar').libelle).toBe('Autres signaux');
  });
});
