import type { EcranDeroule } from '../../cours/content/types';
import { FILS_DES_COURS_SERVIS } from './fils-des-cours';
import {
  ecransDuPupitreDe,
  type InstantaneDuCoursB2,
  lireInstantaneDuFil,
} from './instantane-de-cours';

export const INSTANTANES_DES_COURS_SERVIS: readonly (readonly [string, InstantaneDuCoursB2])[] =
  FILS_DES_COURS_SERVIS.map(([code, fil]) => [code, lireInstantaneDuFil(fil)]);

export const SLUGS_DES_COURS_SERVIS: readonly string[] = INSTANTANES_DES_COURS_SERVIS.map(
  ([, instantane]) => instantane.sujet.id,
);

export const VOTES_JUMELES_DU_PUPITRE: readonly EcranDeroule[] =
  INSTANTANES_DES_COURS_SERVIS.flatMap(([, instantane]) =>
    ecransDuPupitreDe(instantane).filter(
      ({ type, donnees }) => type === 'fp-vote' && donnees?.['questionJumelle'] != null,
    ),
  );
