import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { buildRecitDuMatin, SOURCES_DU_RECIT } from '../../../../testing/factories/article.factory';
import { rendreLaFiche } from '../../../../testing/page/edition-rendue';
import { texteDe, textes } from '../../../../testing/texte/textes-dom';

describe('MB-19 · la fiche rend le récit du matin, comme le mail', () => {
  beforeAll(() => registerLocaleData(localeFr));

  it('MB-19 · ouvre sur l édito signé puis déroule les blocs du mail, dans son ordre', () => {
    const page = rendreLaFiche(buildRecitDuMatin());

    expect(texteDe(page.querySelector('.recit__edito'))).toContain(
      'Une semaine où les agents quittent la démo pour le chantier.',
    );
    expect(texteDe(page.querySelector('.recit__signature'))).toBe('Tim');
    expect(textes(page, '.recit h2')).toEqual([
      'Le sujet du jour',
      'Le Shot',
      'Le décodeur',
      'À tester ce matin',
      'Les sorties',
      'Le chiffre',
      'La citation',
      'Et à part ça…',
    ]);
  });

  it('MB-19 · le sujet du jour porte son titre, ses intertitres, son image créditée, son graphique et son feuilleton', () => {
    const page = rendreLaFiche(buildRecitDuMatin());
    const sujet = page.querySelector<HTMLElement>('#recit-sujet') ?? page;

    expect(texteDe(sujet.querySelector('h3'))).toBe('Claude vise les gros chantiers');
    expect(textes(sujet, '.recit__intertitre')).toEqual([
      'Pourquoi on en parle ?',
      'Contexte :',
      'Dans les faits :',
      'Et maintenant ?',
    ]);
    const image = sujet.querySelector('img');
    expect(image?.getAttribute('src')).toBe('https://cdn.anthropic.com/une.jpg');
    expect(texteDe(sujet.querySelector('figcaption'))).toBe('© Anthropic');
    expect(textes(sujet, '.graphique__libelle')).toEqual(['Claude', 'Gemini', 'GPT']);
    expect(textes(sujet, '.graphique__valeur')).toEqual(['82 %', '61 %', '41 %']);
    expect(texteDe(sujet.querySelector('.recit__feuilleton'))).toContain(
      'Anthropic annonçait ses agents.',
    );
    expect(sujet.querySelector(`a[href="${SOURCES_DU_RECIT.sujet.url}"]`)).not.toBeNull();
  });

  it('MB-19 · chaque bloc cite sa source par un lien', () => {
    const page = rendreLaFiche(buildRecitDuMatin());

    for (const source of Object.values(SOURCES_DU_RECIT)) {
      const lien = page.querySelector<HTMLAnchorElement>(`.recit a[href="${source.url}"]`);
      expect(lien).withContext(source.nom).not.toBeNull();
      expect(lien?.getAttribute('rel')).toContain('noopener');
    }
    expect(texteDe(page.querySelector('#recit-citation'))).toContain("Traduit de l'anglais");
    expect(texteDe(page.querySelector('#recit-sorties'))).toContain('Bun 1.3');
    expect(texteDe(page.querySelector('#recit-chiffre'))).toContain('500 millions de dollars');
  });

  it('MB-19 · ne garde ni En chiffres, ni interrupteur de lecture, ni jauge, ni compteurs', () => {
    const texte = texteDe(rendreLaFiche(buildRecitDuMatin()));

    for (const ancien of [
      'En chiffres',
      'Sous le capot',
      'Essentiel',
      'Horizon :',
      'informations ·',
    ]) {
      expect(texte).not.toContain(ancien);
    }
  });
});
