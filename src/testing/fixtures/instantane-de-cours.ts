import { z } from 'zod';
import type {
  CoursContent,
  DerouleCours,
  EcranContent,
  EcranDeroule,
} from '../../cours/content/types';
import { derouleDuFil, sujetDuFil } from '../../app/core/adapters/formations-fil';
import {
  coursPublicServi,
  derouleServi,
  sujetServi,
} from '../../app/core/adapters/formations-schemas';
import { optionDeLaBonneReponse } from '../../app/features/cours/presentateur/annexe-formateur';
import { ecranDIdentifiant } from '../../app/shared/slides/session/lecture-ecran';

export interface InstantaneDuCoursB2 {
  readonly graine: number;
  readonly empreinte: string;
  readonly sujet: CoursContent;
  readonly deroule: DerouleCours;
  readonly catalogue: CoursContent;
}

export const instantaneDuFil = z
  .object({
    graine: z.number(),
    empreinte: z.string(),
    sujet: sujetServi,
    deroule: derouleServi,
    catalogue: coursPublicServi,
  })
  .strict();

export function lireInstantaneDuFil(fichier: unknown): InstantaneDuCoursB2 {
  const duFil = instantaneDuFil.parse(fichier);
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
  const source = ecranDIdentifiant(pupitre, ecran.id);
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
        optionId: optionDeLaBonneReponse(source, questionId, bonneReponse),
      })),
      annexe: corrige,
      reflexion:
        corrige?.type === 'reflexion' ? { attendu: corrige.attendu, suite: corrige.suite } : null,
      explications: source.explications ?? [],
    },
  };
}
