import {
  delaiDeMiseEnLigne,
  faqDuSite,
  type OffreDeSite,
  OFFRE_DE_SITE,
  prixPlancher,
} from './prix-et-delai';

const lisible = (texte: string): string => texte.replace(/\s/g, ' ');

describe("REC-07 · le prix et le délai d'un site sortent d'une seule constante", () => {
  it('REC-07 · la constante porte 1 500 € HT et 3 à 4 semaines', () => {
    expect(OFFRE_DE_SITE).toEqual({ prixPlancherHt: 1500, semainesMin: 3, semainesMax: 4 });
  });

  it('REC-07 · en français, « à partir de 1 500 € HT » et « en ligne en 3 à 4 semaines »', () => {
    expect(lisible(prixPlancher('fr'))).toBe('à partir de 1 500 € HT');
    expect(delaiDeMiseEnLigne()).toBe('en ligne en 3 à 4 semaines');
  });

  it('REC-07 · en anglais, le montant suit le format de la locale', () => {
    expect(prixPlancher('en')).toContain('€1,500');
    expect(prixPlancher('en')).not.toContain('1 500');
  });

  it('REC-07 · la FAQ pose prix, délai puis l après, dans cet ordre', () => {
    expect(faqDuSite('fr').map(({ question }) => question)).toEqual([
      'Combien coûte un site ?',
      'En combien de temps mon site est-il en ligne ?',
      'Et après la mise en ligne ?',
    ]);
  });

  it('REC-07 · la FAQ cite le prix et le délai de la constante', () => {
    const [prix, delai] = faqDuSite('fr').map(({ reponse }) => lisible(reponse));

    expect(prix).toContain('à partir de 1 500 € HT');
    expect(delai).toContain('en ligne en 3 à 4 semaines');
  });

  it('REC-07 · une autre offre change les trois endroits sans autre édition', () => {
    const autre: OffreDeSite = { prixPlancherHt: 1800, semainesMin: 4, semainesMax: 6 };
    const [prix, delai] = faqDuSite('fr', autre).map(({ reponse }) => lisible(reponse));

    expect(lisible(prixPlancher('fr', autre))).toBe('à partir de 1 800 € HT');
    expect(delaiDeMiseEnLigne(autre)).toBe('en ligne en 4 à 6 semaines');
    expect(prix).toContain('à partir de 1 800 € HT');
    expect(delai).toContain('en ligne en 4 à 6 semaines');
  });
});
