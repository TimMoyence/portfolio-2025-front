import type { ValidationErrors } from '@angular/forms';
import { zInscriptionDto } from '../../../../contrat/zod.gen';
import { longueurDeTexte } from '../../../cours/runtime/core/longueur-de-texte';

export interface Bornes {
  readonly min: number;
  readonly max: number;
  readonly brute?: boolean;
}

export function erreursDeLongueur(saisie: string, bornes: Bornes): ValidationErrors | null {
  const longueur = longueurDeTexte(bornes.brute === true ? saisie : saisie.trim());
  if (longueur === 0) {
    return bornes.min > 0 ? { required: true } : null;
  }
  if (longueur < bornes.min) {
    return { minlength: { requiredLength: bornes.min, actualLength: longueur } };
  }
  if (longueur > bornes.max) {
    return { maxlength: { requiredLength: bornes.max, actualLength: longueur } };
  }
  return null;
}

interface ChampDuContrat {
  readonly minLength: number | null;
  readonly maxLength: number | null;
}

export function bornesDu(champ: ChampDuContrat, brute?: true): Bornes {
  return { min: champ.minLength ?? 0, max: champ.maxLength ?? Infinity, brute };
}

const MOT_DE_PASSE_DU_CONTRAT = zInscriptionDto.shape.password;

export const MOT_DE_PASSE_NEUF = {
  bornes: bornesDu(MOT_DE_PASSE_DU_CONTRAT, true),
  respecte: (saisie: string): boolean => MOT_DE_PASSE_DU_CONTRAT.safeParse(saisie).success,
} as const;

export const LONGUEUR_MIN_D_UN_MOT_DE_PASSE = MOT_DE_PASSE_NEUF.bornes.min;

export const REGLE_D_UN_MOT_DE_PASSE = $localize`:@@regleDUnMotDePasse:Le mot de passe doit contenir au moins ${LONGUEUR_MIN_D_UN_MOT_DE_PASSE}:longueur: caractères, dont une majuscule, un chiffre et un caractère spécial.`;
