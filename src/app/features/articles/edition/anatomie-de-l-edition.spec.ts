import {
  buildEditionMorningBrief,
  buildItemDeSection,
  buildSectionDeLArticle,
} from '../../../../testing/factories/article.factory';
import { anatomieDeLEdition } from './anatomie-de-l-edition';

describe('Anatomie de l’édition — calculée depuis les sections servies', () => {
  it('compte les informations de toutes les sections, l’item du décryptage compris', () => {
    expect(anatomieDeLEdition(buildEditionMorningBrief()).informations).toBe(7);
  });

  it('compte les publications par nom distinct des sources', () => {
    expect(anatomieDeLEdition(buildEditionMorningBrief()).publications).toBe(6);
  });

  it('reprend la durée de lecture servie', () => {
    expect(anatomieDeLEdition(buildEditionMorningBrief()).minutes).toBe(9);
    expect(
      anatomieDeLEdition(buildEditionMorningBrief({ reading_time_minutes: null })).minutes,
    ).toBeNull();
  });

  it('range cartes et brèves par rubrique, radar-<id> compris, les brèves sans rubrique en dernier', () => {
    expect(anatomieDeLEdition(buildEditionMorningBrief()).rubriques).toEqual([
      { id: 'modeles-ia', titre: 'Modèles IA & Recherche', nombre: 4 },
      { id: 'outils-ia', titre: 'Outils IA & Agents', nombre: 1 },
      { id: '', titre: 'Autres signaux', nombre: 1 },
    ]);
  });

  it('laisse le décryptage hors des rubriques', () => {
    const anatomie = anatomieDeLEdition(buildEditionMorningBrief());
    const reparties = anatomie.rubriques.reduce((total, part) => total + part.nombre, 0);
    expect(reparties).toBe(anatomie.informations - 1);
  });

  it('donne au radar d’une rubrique sans carte le titre de sa rubrique', () => {
    const edition = buildEditionMorningBrief({
      sections: [
        buildSectionDeLArticle({
          id: 'radar-web-internet',
          kind: 'radar',
          title: 'Radar — Web & Internet',
          items: [buildItemDeSection(), buildItemDeSection({ url: 'https://vercel.com/b' })],
        }),
      ],
    });
    expect(anatomieDeLEdition(edition).rubriques).toEqual([
      { id: 'web-internet', titre: 'Web & Internet', nombre: 2 },
    ]);
  });

  it('omet une rubrique servie sans item', () => {
    const edition = buildEditionMorningBrief({
      sections: [buildSectionDeLArticle({ items: [] })],
    });
    expect(anatomieDeLEdition(edition).rubriques).toEqual([]);
  });

  it('mesure la part des informations datées publiées dans les 24 h avant l’édition', () => {
    expect(anatomieDeLEdition(buildEditionMorningBrief()).partDes24Heures).toBeCloseTo(4 / 6, 6);
  });

  it('borne la part des 24 h à [publication − 24 h, publication], bornes comprises', () => {
    const datees = [
      '2026-11-08T04:00:00.000Z',
      '2026-11-09T04:00:00.000Z',
      '2026-11-08T03:59:59.999Z',
      '2026-11-09T04:00:00.001Z',
    ];
    const edition = buildEditionMorningBrief({
      published_at: '2026-11-09T04:00:00.000Z',
      sections: [
        buildSectionDeLArticle({
          items: datees.map((published_at) => buildItemDeSection({ published_at })),
        }),
      ],
    });
    expect(anatomieDeLEdition(edition).partDes24Heures).toBe(2 / 4);
  });

  it('ne donne aucune part quand aucune information n’est datée', () => {
    const edition = buildEditionMorningBrief({
      sections: [
        buildSectionDeLArticle({ items: [buildItemDeSection({ published_at: undefined })] }),
      ],
    });
    expect(anatomieDeLEdition(edition).partDes24Heures).toBeNull();
  });

  it('classe les publications par nombre d’informations, puis par nom', () => {
    expect(anatomieDeLEdition(buildEditionMorningBrief()).publicationsEnTete).toEqual([
      { nom: 'Vercel Blog', nombre: 2 },
      { nom: 'GitHub Changelog', nombre: 1 },
      { nom: 'Hacker News', nombre: 1 },
      { nom: 'Hugging Face Blog', nombre: 1 },
      { nom: 'OpenAI Blog', nombre: 1 },
      { nom: 'V8 Blog', nombre: 1 },
    ]);
    expect(anatomieDeLEdition(buildEditionMorningBrief()).autresPublications).toBeNull();
  });

  describe('publications en tête', () => {
    const SEPT = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const anatomieDesPublications = (noms: readonly string[]) =>
      anatomieDeLEdition(
        buildEditionMorningBrief({
          sections: [
            buildSectionDeLArticle({
              items: noms.map((nom, rang) =>
                buildItemDeSection({ source: nom, url: `https://exemple.fr/${rang}` }),
              ),
            }),
          ],
        }),
      );

    it('regroupe au-delà de sept publications, six nommées et le reste compté', () => {
      const anatomie = anatomieDesPublications([...SEPT, 'H', 'H']);

      expect(anatomie.publicationsEnTete.map((part) => part.nom)).toEqual([
        'H',
        'A',
        'B',
        'C',
        'D',
        'E',
      ]);
      expect(anatomie.autresPublications).toEqual({ publications: 2, informations: 2 });
    });

    it('montre la septième publication plutôt que de la regrouper seule', () => {
      const anatomie = anatomieDesPublications(SEPT);

      expect(anatomie.publicationsEnTete.map((part) => part.nom)).toEqual(SEPT);
      expect(anatomie.autresPublications).toBeNull();
    });
  });

  it('rend une anatomie vide pour une édition sans sections', () => {
    const anatomie = anatomieDeLEdition(buildEditionMorningBrief({ sections: [], sources: [] }));
    expect(anatomie).toEqual({
      informations: 0,
      publications: 0,
      minutes: 9,
      partDes24Heures: null,
      rubriques: [],
      publicationsEnTete: [],
      autresPublications: null,
    });
  });
});
