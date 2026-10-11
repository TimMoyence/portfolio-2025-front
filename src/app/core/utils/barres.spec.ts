import { trimLeadingSlashes, trimTrailingSlashes } from './barres';

describe('barres', () => {
  it('trimTrailingSlashes ne retire que les slashs finaux', () => {
    expect(trimTrailingSlashes('/fr/contact///')).toBe('/fr/contact');
    expect(trimTrailingSlashes('///')).toBe('');
    expect(trimTrailingSlashes('/fr/contact')).toBe('/fr/contact');
    expect(trimTrailingSlashes('')).toBe('');
  });

  it('trimLeadingSlashes ne retire que les slashs initiaux', () => {
    expect(trimLeadingSlashes('///fr/contact/')).toBe('fr/contact/');
    expect(trimLeadingSlashes('///')).toBe('');
    expect(trimLeadingSlashes('fr')).toBe('fr');
  });

  it('reste lineaire sur une longue repetition de slashs', () => {
    expect(trimLeadingSlashes(`${'/'.repeat(100_000)}a`)).toBe('a');
    expect(trimTrailingSlashes(`a${'/'.repeat(100_000)}`)).toBe('a');
  });
});
