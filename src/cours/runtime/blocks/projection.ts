import type { OptionPubliqueResponseDto } from '../../../../contrat/types.gen';
import type { MetadonneesBrique } from '../../content/types';
import { texte } from '../core/i18n';

export type OptionPublique = OptionPubliqueResponseDto;

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

export const ID_JE_NE_SAIS_PAS = '__je_ne_sais_pas__';

export function avecJeNeSaisPas(options: readonly OptionPublique[]): OptionPublique[] {
  return [...options, { id: ID_JE_NE_SAIS_PAS, libelle: texte('je-ne-sais-pas') }];
}
