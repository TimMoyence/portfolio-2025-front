import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { buildRecitDuMatin } from '../../../../testing/factories/article.factory';
import { rendreLaFiche } from '../../../../testing/page/edition-rendue';
import { texteDe } from '../../../../testing/texte/textes-dom';

describe('MB-19 · la citation dit de quelle langue elle est traduite, telle que le Pi l écrit', () => {
  beforeAll(() => registerLocaleData(localeFr));

  it('MB-19 · écrit « Traduit de l’allemand » pour traduite_de « l’allemand », sans doubler l article', () => {
    const page = rendreLaFiche(
      buildRecitDuMatin({
        sections: buildRecitDuMatin().sections.map((section) =>
          section.kind === 'citation' ? { ...section, traduite_de: "l'allemand" } : section,
        ),
      }),
    );

    const citation = texteDe(page.querySelector('#recit-citation'));
    expect(citation).toContain("Traduit de l'allemand");
    expect(citation).not.toContain("l’l'");
  });
});
