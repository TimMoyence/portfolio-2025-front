import type {
  CoursContent,
  DerouleCours,
  EcranContent,
  EcranDeroule,
} from '../../cours/content/types';
import fichier from './b2-01-v3.instantane.json';

export interface InstantaneV3 {
  readonly version: number;
  readonly graine: number;
  readonly empreinte: string;
  readonly sujet: CoursContent;
  readonly deroule: DerouleCours;
  readonly catalogue: CoursContent;
}

export const INSTANTANE_V3 = fichier as unknown as InstantaneV3;

export function ecransPublicsV3(): readonly EcranContent[] {
  return INSTANTANE_V3.sujet.ecrans;
}

export function ecransDuPupitreV3(): readonly EcranDeroule[] {
  return INSTANTANE_V3.deroule.ecrans;
}
