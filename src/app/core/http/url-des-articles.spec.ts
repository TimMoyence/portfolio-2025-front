import { urlDesArticles } from './url-des-articles';

describe('urlDesArticles', () => {
  it('ne double pas la barre quand l URL de base finit par /', () => {
    expect(urlDesArticles('https://api.test/v1/', { locale: 'fr', limite: 12 })).toBe(
      'https://api.test/v1/articles?locale=fr&limit=12',
    );
  });

  it('n ajoute pas de curseur absent ou vide', () => {
    for (const curseur of [undefined, null, '']) {
      expect(urlDesArticles('https://api.test', { locale: 'en', limite: 24, curseur })).toBe(
        'https://api.test/articles?locale=en&limit=24',
      );
    }
  });

  it('encode le curseur de la page suivante', () => {
    expect(urlDesArticles('https://api.test', { locale: 'fr', limite: 24, curseur: 'MjQ=' })).toBe(
      'https://api.test/articles?locale=fr&limit=24&cursor=MjQ%3D',
    );
  });
});
