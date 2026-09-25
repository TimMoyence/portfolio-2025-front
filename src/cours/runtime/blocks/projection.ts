import type { MetadonneesBrique } from '../../content/types';

export interface OptionPublique {
  readonly id: string;
  readonly libelle: string;
}

export function projeterMetadonnees(source: MetadonneesBrique): MetadonneesBrique {
  return {
    concepts: [...source.concepts],
    misconceptionsCiblees: [],
    dureeMinutes: source.dureeMinutes,
    modalite: source.modalite,
    regime: source.regime,
  };
}

export interface ContenuDeBrique {
  readonly id: string;
  readonly metadonnees: MetadonneesBrique;
}

export function copierLeSocle(source: ContenuDeBrique): ContenuDeBrique {
  return { id: source.id, metadonnees: projeterMetadonnees(source.metadonnees) };
}

export function projeterOptions(options: readonly OptionPublique[]): OptionPublique[] {
  return options.map((option) => ({ id: option.id, libelle: option.libelle }));
}
