import { buildEditionRefondue } from '../../../../testing/factories/article.factory';
import { AUTRES_SIGNAUX, anatomieDeLEdition } from './anatomie-de-l-edition';

describe('Anatomie d’une édition refondue', () => {
  it('MB-16 · compte les infos et le radar sans les lignes du brief, et range les infos par leur rubrique', () => {
    const anatomie = anatomieDeLEdition(buildEditionRefondue());

    expect(anatomie.informations).toBe(3);
    expect(anatomie.rubriques).toEqual([
      { id: 'outils-ia', titre: 'Outils IA & Agents', nombre: 2 },
      { id: 'modeles-ia', titre: 'Modèles IA & Recherche', nombre: 1 },
    ]);
  });

  it('MB-16 · range une info d’une rubrique inconnue du site parmi les autres signaux', () => {
    const edition = buildEditionRefondue();
    const anatomie = anatomieDeLEdition({
      ...edition,
      sections: edition.sections.map((section) =>
        section.kind === 'infos'
          ? { ...section, items: section.items.map((item) => ({ ...item, rubric: 'robotique' })) }
          : section,
      ),
    });

    expect(anatomie.rubriques).toEqual([
      { id: 'outils-ia', titre: 'Outils IA & Agents', nombre: 1 },
      { id: '', titre: AUTRES_SIGNAUX, nombre: 2 },
    ]);
  });
});
