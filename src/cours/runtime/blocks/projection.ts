import type { MetadonneesBrique } from '../../content/types';

export interface OptionPublique {
  readonly id: string;
  readonly libelle: string;
}

export function projeterMetadonnees(source: MetadonneesBrique): MetadonneesBrique {
  return {
    concepts: [...source.concepts],
    misconceptionsCiblees: [...source.misconceptionsCiblees],
    dureeMinutes: source.dureeMinutes,
    modalite: source.modalite,
    regime: source.regime,
  };
}

export function projeterOptions(options: readonly OptionPublique[]): OptionPublique[] {
  return options.map((option) => ({ id: option.id, libelle: option.libelle }));
}
