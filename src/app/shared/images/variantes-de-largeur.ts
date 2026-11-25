const LARGEURS_SERVIES = [360, 400, 480, 560, 640, 680, 800, 960, 1000, 1200];

export const variantesDeLargeur = (dossier: string, largeurNaturelle: number): string =>
  [...LARGEURS_SERVIES.filter((largeur) => largeur < largeurNaturelle), largeurNaturelle]
    .map((largeur) => `${dossier}/${largeur}.webp ${largeur}w`)
    .join(', ');
