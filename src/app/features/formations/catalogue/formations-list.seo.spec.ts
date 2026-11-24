import { METADONNEES_DU_SITE } from '../../../core/seo/site-servi';

describe('CAT-01 · ce que les moteurs disent de /formations', () => {
  const locales =
    METADONNEES_DU_SITE.pages.find(({ path }) => path === '/formations')?.locales ?? {};

  it('CAT-01 · décrit en chaque langue le catalogue seul, cours du BTS CG et du Bachelor compris, sans l offre sur mesure', () => {
    expect(Object.keys(locales)).toEqual(METADONNEES_DU_SITE.site.locales);
    for (const [locale, { description, ogDescription }] of Object.entries(locales)) {
      for (const texte of [description, ogDescription]) {
        expect(texte).withContext(locale).toContain('BTS CG');
        expect(texte).withContext(locale).toContain('Bachelor');
        expect(texte)
          .withContext(locale)
          .not.toMatch(/management|managing|sur mesure|tailored/i);
      }
    }
  });
});
