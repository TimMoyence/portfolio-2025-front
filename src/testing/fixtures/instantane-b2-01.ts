import type { EcranContent, EcranDeroule } from '../../cours/content/types';
import fichier from './b2-01.instantane.json';
import {
  ecransDuPupitreDe,
  ecransPublicsDe,
  type InstantaneDuCoursB2,
  lireInstantaneDuFil,
} from './instantane-de-cours';

export type { InstantaneDuCoursB2 } from './instantane-de-cours';

export const INSTANTANE_B2_01: InstantaneDuCoursB2 = lireInstantaneDuFil(fichier);

export function ecransPublicsB2_01(): readonly EcranContent[] {
  return ecransPublicsDe(INSTANTANE_B2_01);
}

export function ecransDuPupitreB2_01(): readonly EcranDeroule[] {
  return ecransDuPupitreDe(INSTANTANE_B2_01);
}
