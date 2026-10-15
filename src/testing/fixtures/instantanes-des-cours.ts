import { INSTANTANE_B2_01 } from './instantane-b2-01';
import { INSTANTANE_B2_02 } from './instantane-b2-02';
import { INSTANTANE_B2_03 } from './instantane-b2-03';
import { INSTANTANE_B2_04 } from './instantane-b2-04';
import { INSTANTANE_B2_05 } from './instantane-b2-05';
import { INSTANTANE_B2_06 } from './instantane-b2-06';
import { INSTANTANE_B3_01 } from './instantane-b3-01';
import type { EcranDeroule } from '../../cours/content/types';
import { ecransDuPupitreDe, type InstantaneDuCoursB2 } from './instantane-de-cours';

export const INSTANTANES_DES_COURS_SERVIS: readonly (readonly [string, InstantaneDuCoursB2])[] = [
  ['B2-01', INSTANTANE_B2_01],
  ['B2-02', INSTANTANE_B2_02],
  ['B2-03', INSTANTANE_B2_03],
  ['B2-04', INSTANTANE_B2_04],
  ['B2-05', INSTANTANE_B2_05],
  ['B2-06', INSTANTANE_B2_06],
  ['B3-01', INSTANTANE_B3_01],
];

export const VOTES_JUMELES_DU_PUPITRE: readonly EcranDeroule[] =
  INSTANTANES_DES_COURS_SERVIS.flatMap(([, instantane]) =>
    ecransDuPupitreDe(instantane).filter(
      ({ type, donnees }) => type === 'fp-vote' && donnees?.['questionJumelle'] != null,
    ),
  );
