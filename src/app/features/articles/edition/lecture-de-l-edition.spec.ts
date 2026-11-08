import {
  buildEditionMorningBrief,
  buildItemDeSection,
  buildPublishedArticle,
  buildSectionDeLArticle,
} from '../../../../testing/factories/article.factory';
import { lectureDeLEdition, siteDe, sourcesParPublication } from './lecture-de-l-edition';

describe('Lecture de l’édition — ce que la une et la fiche tirent des sections', () => {
  it('titre l’édition par son décryptage, à défaut par le titre de l’article', () => {
    expect(lectureDeLEdition(buildEditionMorningBrief()).titre).toBe(
      'V8 travaille désormais pour le temps réel',
    );
    expect(lectureDeLEdition(buildPublishedArticle({ title: 'Veille IA' })).titre).toBe(
      'Veille IA',
    );
  });

  it('sépare le chapeau de l’essentiel de ses points à retenir', () => {
    const lecture = lectureDeLEdition(buildEditionMorningBrief());

    expect(lecture.chapeau).toBe(
      '<p>Le fil rouge de la nuit : la bataille se joue dans le <strong>routage</strong> et le cache.</p>',
    );
    expect(lecture.points).toEqual([
      'Les scores bougent de 23 points selon la consigne.',
      'Mercor passe ses lots de 12 à 2 heures.',
      'Chrome 136 gagne 630 ms au chargement.',
    ]);
  });

  it('rend le corps du décryptage et sort son encadré « Ce que ça change »', () => {
    const lecture = lectureDeLEdition(buildEditionMorningBrief());

    expect(lecture.corpsDuDecryptage).toContain('<p>Le moteur compile d’abord');
    expect(lecture.impact?.text).toBe('Les applications web démarrent plus vite sans réécriture.');
  });

  it('accepte un décryptage servi sans item, comme les éditions antérieures', () => {
    const edition = buildEditionMorningBrief({
      sections: [buildSectionDeLArticle({ id: 'deep-dive', kind: 'deep_dive', title: 'Titre' })],
    });
    expect(lectureDeLEdition(edition).impact).toBeNull();
  });

  it('garde les rubriques et les radars dans l’ordre servi', () => {
    const lecture = lectureDeLEdition(buildEditionMorningBrief());

    expect(lecture.rubriques.map((section) => section.id)).toEqual(['modeles-ia', 'outils-ia']);
    expect(lecture.radars.map((section) => section.id)).toEqual(['radar-modeles-ia', 'radar']);
  });

  it('nomme le site d’une source par son domaine, sans www', () => {
    expect(siteDe('https://www.theverge.com/ai/1')).toBe('theverge.com');
    expect(siteDe('https://vercel.com/changelog')).toBe('vercel.com');
    expect(siteDe('pas une url')).toBe('');
  });

  it('groupe les sources par publication, chaque lien nommé par son fait', () => {
    const groupes = sourcesParPublication(buildEditionMorningBrief());

    expect(groupes.map((groupe) => groupe.nom)).toEqual([
      'GitHub Changelog',
      'Hacker News',
      'Hugging Face Blog',
      'OpenAI Blog',
      'V8 Blog',
      'Vercel Blog',
    ]);
    expect(groupes.at(-1)?.liens).toEqual([
      { url: 'https://vercel.com/changelog/fait', libelle: 'Vercel / DeepSeek V4.1' },
      { url: 'https://vercel.com/changelog/ling-3-1', libelle: 'Ling 3.1 Flash' },
    ]);
  });

  it('nomme par son site une source qu’aucun fait ne cite', () => {
    const edition = buildEditionMorningBrief({
      sections: [buildSectionDeLArticle({ items: [buildItemDeSection()] })],
      sources: [
        {
          name: 'Le Monde',
          url: 'https://www.lemonde.fr/x',
          published_at: null,
          retrieved_at: null,
        },
      ],
    });
    expect(sourcesParPublication(edition)).toEqual([
      { nom: 'Le Monde', liens: [{ url: 'https://www.lemonde.fr/x', libelle: 'lemonde.fr' }] },
    ]);
  });
});
