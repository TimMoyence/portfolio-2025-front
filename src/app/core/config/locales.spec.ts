import seoMetadata from '../../../assets/seo/seo-metadata.json';
import { LOCALES_DU_SITE, langueDuSite } from './locales';

describe('LOCALES_DU_SITE', () => {
  it('reprend exactement les locales declarees dans seo-metadata.json', () => {
    const declarees: string[] = [...LOCALES_DU_SITE];
    expect(declarees).toEqual(seoMetadata.site.locales);
  });
});

describe('langueDuSite', () => {
  it('rend la langue d un LOCALE_ID, en minuscules et sans sa region', () => {
    expect(['fr', 'fr-FR', 'en-US', 'EN', 'En-gb', ''].map(langueDuSite)).toEqual([
      'fr',
      'fr',
      'en',
      'en',
      'en',
      '',
    ]);
  });
});
