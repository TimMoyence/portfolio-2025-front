import {
  carteDeRealisation,
  cheminDeLaFiche,
  cleSeoDeLaRealisation,
  familleDeLaRealisation,
  type Realisation,
  realisationDuSlug,
  variantesDeLaCapture,
  vignetteDeLaRealisation,
} from './realisations.data';

const realisation: Realisation = {
  slug: 'atelier-test',
  famille: 'apps',
  titre: 'Atelier test',
  description: 'Une description',
  etiquettes: [
    { libelle: 'Artisanat', genre: 'secteur' },
    { libelle: 'Réservation en ligne', genre: 'resultat' },
  ],
  recit: { defi: 'Défi', construit: 'Construit', resultat: 'Résultat' },
  taille: 'big',
  image: '/assets/images/projects/atelier-test.webp',
  largeurDeLaCapture: 627,
  imageAlt: 'Capture',
};

describe('carteDeRealisation', () => {
  it('garde la taille de la réalisation, mène à sa fiche et nomme sa capture', () => {
    expect(carteDeRealisation(realisation)).toEqual({
      title: 'Atelier test',
      desc: 'Une description',
      tags: [
        { label: 'Artisanat', prod: false },
        { label: 'Réservation en ligne', prod: true },
      ],
      image: '/assets/images/projects/atelier-test.webp',
      srcset: [360, 400, 480, 560, 627]
        .map(
          (largeur) => `/assets/images/projects/vignettes/atelier-test/${largeur}.webp ${largeur}w`,
        )
        .join(', '),
      imageAlt: 'Capture',
      href: '/projets/atelier-test',
      vignette: 'realisation-atelier-test',
      size: 'big',
    });
  });

  it('impose la taille demandée par la vitrine', () => {
    expect(carteDeRealisation(realisation, 'small').size).toBe('small');
  });
});

describe('variantesDeLaCapture', () => {
  const largeurs = (largeurDeLaCapture: number): string[] =>
    variantesDeLaCapture({ slug: 'atelier-test', largeurDeLaCapture })
      .split(', ')
      .map((variante) => variante.split(' ')[1]);

  it('une capture de 1200 px ferme ses variantes à 1200 w, sans doublon', () => {
    expect(largeurs(1200)).toEqual([
      '360w',
      '400w',
      '480w',
      '560w',
      '640w',
      '800w',
      '1000w',
      '1200w',
    ]);
  });

  it('une capture plus étroite que la plus petite variante ne sert qu elle-même', () => {
    expect(largeurs(300)).toEqual(['300w']);
  });

  it('une capture de 627 px s arrête à sa largeur réelle, après 560 w', () => {
    expect(largeurs(627)).toEqual(['360w', '400w', '480w', '560w', '627w']);
  });

  it('chaque variante pointe le dossier de sa réalisation', () => {
    expect(variantesDeLaCapture({ slug: 'atelier-test', largeurDeLaCapture: 300 })).toBe(
      '/assets/images/projects/vignettes/atelier-test/300.webp 300w',
    );
  });
});

describe('les repères d une réalisation', () => {
  it('dérivent du slug : chemin, clé de référencement et nom de transition', () => {
    expect([
      cheminDeLaFiche('innovmind'),
      cleSeoDeLaRealisation('innovmind'),
      vignetteDeLaRealisation('innovmind'),
    ]).toEqual(['projets/innovmind', 'projet-innovmind', 'realisation-innovmind']);
  });

  it('retrouvent une réalisation par son slug exact, jamais par une autre casse', () => {
    expect(realisationDuSlug('innovmind')?.titre).toBe('InnovMind');
    expect(realisationDuSlug('InnovMind')).toBeUndefined();
    expect(realisationDuSlug(undefined)).toBeUndefined();
  });

  it('rattachent une réalisation au besoin de contact de sa famille', () => {
    expect(familleDeLaRealisation(realisation).besoin).toBe('app-mobile');
  });
});
