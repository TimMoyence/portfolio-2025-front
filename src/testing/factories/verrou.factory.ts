import type { VerrouInterOnglets } from '../../app/core/services/verrou-inter-onglets';

export function createVerrouEnMemoire(): VerrouInterOnglets {
  let tenu: Promise<unknown> = Promise.resolve();
  return <T>(_nom: string, travail: () => Promise<T>): Promise<T> => {
    const tour = tenu.then(travail);
    tenu = tour.catch(() => undefined);
    return tour;
  };
}

export interface VerrouAAccordManuel {
  readonly verrou: VerrouInterOnglets;
  readonly demandesEnAttente: () => number;
  readonly accorderLeSuivant: () => void;
}

export function createVerrouAAccordManuel(): VerrouAAccordManuel {
  const enAttente: (() => void)[] = [];
  const enchainer = createVerrouEnMemoire();
  return {
    verrou: <T>(nom: string, travail: () => Promise<T>): Promise<T> =>
      new Promise<T>((resoudre, rejeter) => {
        enAttente.push(() => {
          enchainer(nom, travail).then(resoudre, rejeter);
        });
      }),
    demandesEnAttente: () => enAttente.length,
    accorderLeSuivant: () => enAttente.shift()?.(),
  };
}
