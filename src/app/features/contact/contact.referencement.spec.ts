import seoMetadata from '../../../assets/seo/seo-metadata.json';

describe('REC-12 · le référencement de /contact', () => {
  it('REC-12 · dit aussi « 48 h ouvrées », en français comme en anglais', () => {
    const locales = seoMetadata.pages.find(({ id }) => id === 'contact')?.locales;
    const textes = (locale: 'fr' | 'en'): string =>
      [locales?.[locale]?.description, locales?.[locale]?.ogDescription].join(' ');

    expect(textes('fr')).toContain('48 h ouvrées');
    expect(textes('fr')).not.toMatch(/48 ?h(?! ouvrées)/);
    expect(textes('en')).toContain('48 working hours');
    expect(textes('en')).not.toMatch(/48 ?h(?!ours)/);
  });
});
