import { localeDesArticles } from './locale-des-articles';

describe('localeDesArticles', () => {
  it('sert l anglais a la locale anglaise, quelle que soit sa casse', () => {
    expect(localeDesArticles('EN-US', '/articles')).toBe('en');
  });

  it('sert l anglais sous le prefixe /en meme quand la locale de build est francaise', () => {
    expect(localeDesArticles('fr', '/en/articles')).toBe('en');
  });

  it('sert le francais par defaut', () => {
    expect(localeDesArticles('fr', '/articles')).toBe('fr');
  });
});
