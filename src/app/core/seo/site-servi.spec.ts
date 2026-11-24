import { descriptionServie, LANGUE_SERVIE } from './site-servi';

describe('descriptionServie · la description d une page se lit dans la langue servie', () => {
  it('la fiche AtlanticBike reprend la description française de sa page SEO', () => {
    expect(LANGUE_SERVIE).toBe('fr');
    expect(descriptionServie('/projets/atlanticbike')).toBe(
      "Loueur et réparateur de vélos à Carcans-Maubuisson : un site qui présente l'activité, clarifie l'offre et fait entrer la réservation en ligne.",
    );
  });

  it('un chemin sans page SEO est refusé', () => {
    expect(() => descriptionServie('/inconnu')).toThrowError('aucune page SEO à /inconnu');
  });
});
