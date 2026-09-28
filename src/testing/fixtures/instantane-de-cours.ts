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

export function lireInstantaneDuFil(fichier: unknown): InstantaneDuCoursB2 {
  const duFil = fichier as InstantaneDuFil;
  return {
    ...duFil,
    sujet: sujetDuFil(duFil.sujet),
    deroule: derouleDuFil(duFil.deroule),
    catalogue: sujetDuFil(duFil.catalogue),
  };
}

export function ecransPublicsDe(instantane: InstantaneDuCoursB2): readonly EcranContent[] {
  return instantane.sujet.ecrans;
}

export function ecransDuPupitreDe(instantane: InstantaneDuCoursB2): readonly EcranDeroule[] {
  return instantane.deroule.ecrans;
}
