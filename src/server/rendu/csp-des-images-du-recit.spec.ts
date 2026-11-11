import { buildSecurityHeaders } from './security-headers';

describe('MB-19 · la CSP laisse passer les images du récit, en https seulement', () => {
  const directive = (): string | undefined => {
    const csp = buildSecurityHeaders({ isHttps: true })['Content-Security-Policy-Report-Only'];
    return csp.split('; ').find((regle) => regle.startsWith('img-src '));
  };

  it('MB-19 · autorise toute image https, comme celles des sources du récit', () => {
    expect(directive()?.split(' ')).toContain('https:');
  });

  it('MB-11 · n autorise ni le http ni le joker', () => {
    const sources = directive()?.split(' ') ?? [];
    expect(sources).not.toContain('http:');
    expect(sources).not.toContain('*');
    expect(sources.slice(1).filter((source) => !["'self'", 'data:', 'https:'].includes(source)))
      .withContext('aucune autre origine, ni hôte en http, ni joker de sous-domaine')
      .toEqual([]);
  });
});
