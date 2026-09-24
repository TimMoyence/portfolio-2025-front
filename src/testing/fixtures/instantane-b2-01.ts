import type {
  CoursContent,
  DerouleCours,
  EcranContent,
  EcranDeroule,
} from '../../cours/content/types';
import {
  type DerouleDuFil,
  derouleDuFil,
  type SujetDuFil,
  sujetDuFil,
} from '../../app/core/adapters/formations-fil';
import fichier from './b2-01.instantane.json';

export interface InstantaneDuCoursB2 {
  readonly graine: number;
  readonly empreinte: string;
  readonly sujet: CoursContent;
  readonly deroule: DerouleCours;
  readonly catalogue: CoursContent;
}

interface InstantaneDuFil extends Omit<InstantaneDuCoursB2, 'sujet' | 'deroule' | 'catalogue'> {
  readonly sujet: SujetDuFil;
  readonly deroule: DerouleDuFil;
  readonly catalogue: SujetDuFil;
}

const DU_FIL = fichier as unknown as InstantaneDuFil;

export const INSTANTANE_B2_01: InstantaneDuCoursB2 = {
  ...DU_FIL,
  sujet: sujetDuFil(DU_FIL.sujet),
  deroule: derouleDuFil(DU_FIL.deroule),
  catalogue: sujetDuFil(DU_FIL.catalogue),
};

export function ecransPublicsB2_01(): readonly EcranContent[] {
  return INSTANTANE_B2_01.sujet.ecrans;
}

export function ecransDuPupitreB2_01(): readonly EcranDeroule[] {
  return INSTANTANE_B2_01.deroule.ecrans;
}
