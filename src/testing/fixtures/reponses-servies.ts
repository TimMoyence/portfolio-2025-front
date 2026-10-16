import fichier from './reponses-servies.json';

export interface ReponseServie {
  readonly route: string;
  readonly corps: unknown;
}

export const REPONSES_SERVIES: readonly ReponseServie[] = fichier;

export function reponsesServiesPar(route: string): readonly unknown[] {
  return REPONSES_SERVIES.filter((reponse) => reponse.route === route).map(({ corps }) => corps);
}
