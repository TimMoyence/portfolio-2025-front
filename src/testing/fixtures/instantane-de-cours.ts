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

export function ecranReveleAuPosteEtudiant(
  ecran: EcranContent,
  pupitre: readonly EcranDeroule[],
): EcranContent {
  const source = pupitre.find(({ id }) => id === ecran.id);
  if (source === undefined) {
    return ecran;
  }
  const corrige = source.corrigeEcran;
  return {
    ...ecran,
    revelation: {
      ecranId: ecran.id,
      questions: source.corriges.map(({ questionId, bonneReponse }) => ({
        questionId,
        cible: bonneReponse,
        optionId:
          source.questions
            .find(({ id }) => id === questionId)
            ?.options?.find(({ libelle }) => libelle === bonneReponse)?.id ?? null,
      })),
      annexe: corrige,
      reflexion:
        corrige?.type === 'reflexion' ? { attendu: corrige.attendu, suite: corrige.suite } : null,
      explications: source.explications ?? [],
    },
  };
}
