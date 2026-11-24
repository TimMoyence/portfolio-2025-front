import { ETIQUETTE_EN_LIGNE, type Realisation } from '../projets/realisations.data';

export function realisationDuHeros(liste: readonly Realisation[]): Realisation | undefined {
  return liste.find(
    ({ famille, etiquettes }) =>
      famille === 'sites' &&
      etiquettes.some(({ id, genre }) => genre === 'resultat' && id === ETIQUETTE_EN_LIGNE.id),
  );
}
