import type {
  CoursContent,
  DerouleCours,
  EcranContent,
  EcranDeroule,
} from '../../cours/content/types';
import fichier from './b2-01.instantane.json';

export interface InstantaneDuCoursB2 {
  readonly graine: number;
  readonly empreinte: string;
  readonly sujet: CoursContent;
  readonly deroule: DerouleCours;
  readonly catalogue: CoursContent;
}

export const INSTANTANE_B2_01 = fichier as unknown as InstantaneDuCoursB2;

export function ecransPublicsB2_01(): readonly EcranContent[] {
  return INSTANTANE_B2_01.sujet.ecrans;
}

export function ecransDuPupitreB2_01(): readonly EcranDeroule[] {
  return INSTANTANE_B2_01.deroule.ecrans;
}
