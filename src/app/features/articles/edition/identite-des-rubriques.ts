export interface IdentiteDeRubrique {
  readonly couleur: string;
  readonly picto: string;
}

const MARQUES: Readonly<Record<string, IdentiteDeRubrique>> = {
  'modeles-ia': {
    couleur: '#1a9a83',
    picto:
      'M12 3v5M12 16v5M3 12h5M16 12h5M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5',
  },
  'outils-ia': {
    couleur: '#4a7ff0',
    picto: 'M5 9h14v10H5zM12 5v4M9.5 14h.01M14.5 14h.01M3 13v3M21 13v3',
  },
  'dev-frameworks': {
    couleur: '#bf8a0c',
    picto: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  },
  'web-internet': {
    couleur: '#a24f9a',
    picto:
      'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M3 12h18M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9M12 3c-2.4 2.6-3.6 5.6-3.6 9s1.2 6.4 3.6 9',
  },
  'business-niches': {
    couleur: '#cf4442',
    picto: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  },
};

const NEUTRE: IdentiteDeRubrique = {
  couleur: '#9c9384',
  picto: 'M12 10a2 2 0 1 0 0 4a2 2 0 1 0 0-4M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4',
};

export function identiteDeRubrique(rubrique: string): IdentiteDeRubrique {
  const id = rubrique.replaceAll('_', '-');
  return Object.hasOwn(MARQUES, id) ? MARQUES[id] : NEUTRE;
}
