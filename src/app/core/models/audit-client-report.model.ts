import type { RapportClientServi } from '../../../../contrat/types.gen';

export type ClientReport = RapportClientServi;

export type StatutScore = ClientReport['pillarScorecard'][number]['status'];
