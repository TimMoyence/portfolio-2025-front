import type { VerrouInterOnglets } from '../../app/core/services/verrou-inter-onglets';

export function createVerrouEnMemoire(): VerrouInterOnglets {
  let tenu: Promise<unknown> = Promise.resolve();
  return <T>(_nom: string, travail: () => Promise<T>): Promise<T> => {
    const tour = tenu.then(travail);
    tenu = tour.catch(() => undefined);
    return tour;
  };
}
