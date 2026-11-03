import filB101 from './instantanes/json/b1-01.instantane.json';
import filB102 from './instantanes/json/b1-02.instantane.json';
import filB201 from './instantanes/json/b2-01.instantane.json';
import filB202 from './instantanes/json/b2-02.instantane.json';
import filB203 from './instantanes/json/b2-03.instantane.json';
import filB204 from './instantanes/json/b2-04.instantane.json';
import filB205 from './instantanes/json/b2-05.instantane.json';
import filB206 from './instantanes/json/b2-06.instantane.json';
import filB301 from './instantanes/json/b3-01.instantane.json';
import { INSTANTANE_B1_01 } from './instantanes/instantane-b1-01';
import { INSTANTANE_B1_02 } from './instantanes/instantane-b1-02';
import { INSTANTANE_B2_01 } from './instantanes/instantane-b2-01';
import { INSTANTANE_B2_02 } from './instantanes/instantane-b2-02';
import { INSTANTANE_B2_03 } from './instantanes/instantane-b2-03';
import { INSTANTANE_B2_04 } from './instantanes/instantane-b2-04';
import { INSTANTANE_B2_05 } from './instantanes/instantane-b2-05';
import { INSTANTANE_B2_06 } from './instantanes/instantane-b2-06';
import { INSTANTANE_B3_01 } from './instantanes/instantane-b3-01';
import type { EcranDeroule } from '../../cours/content/types';
import { ecransDuPupitreDe, type InstantaneDuCoursB2 } from './instantane-de-cours';

export const INSTANTANES_DES_COURS_SERVIS: readonly (readonly [
  string,
  InstantaneDuCoursB2,
  unknown,
])[] = [
  ['B1-01', INSTANTANE_B1_01, filB101],
  ['B1-02', INSTANTANE_B1_02, filB102],
  ['B2-01', INSTANTANE_B2_01, filB201],
  ['B2-02', INSTANTANE_B2_02, filB202],
  ['B2-03', INSTANTANE_B2_03, filB203],
  ['B2-04', INSTANTANE_B2_04, filB204],
  ['B2-05', INSTANTANE_B2_05, filB205],
  ['B2-06', INSTANTANE_B2_06, filB206],
  ['B3-01', INSTANTANE_B3_01, filB301],
];

export const VOTES_JUMELES_DU_PUPITRE: readonly EcranDeroule[] =
  INSTANTANES_DES_COURS_SERVIS.flatMap(([, instantane]) =>
    ecransDuPupitreDe(instantane).filter(
      ({ type, donnees }) => type === 'fp-vote' && donnees?.['questionJumelle'] != null,
    ),
  );
