import seoMetadata from '../../../assets/seo/seo-metadata.json';
import { LOCALES_DU_SITE } from './locales';

describe('LOCALES_DU_SITE', () => {
  it('reprend exactement les locales declarees dans seo-metadata.json', () => {
    const declarees: string[] = [...LOCALES_DU_SITE];
    expect(declarees).toEqual(seoMetadata.site.locales);
  });
});
