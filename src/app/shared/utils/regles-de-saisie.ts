import type { ValidationErrors } from '@angular/forms';
import {
  zAuditRequestRequestDto,
  zContactRequestDto,
  zInscriptionDto,
  zLoginDto,
} from '../../../../contrat/zod.gen';
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

function bornesDu(champ: ChampDuContrat, brute?: true): Bornes {
  return { min: champ.minLength ?? 0, max: champ.maxLength ?? Infinity, brute };
}

const MOT_DE_PASSE_DU_CONTRAT = zInscriptionDto.shape.password;

export const MOT_DE_PASSE_NEUF = {
  bornes: bornesDu(MOT_DE_PASSE_DU_CONTRAT, true),
  respecte: (saisie: string): boolean => MOT_DE_PASSE_DU_CONTRAT.safeParse(saisie).success,
} as const;

export const LONGUEUR_MIN_D_UN_MOT_DE_PASSE = MOT_DE_PASSE_NEUF.bornes.min;

export const REGLE_D_UN_MOT_DE_PASSE = $localize`:@@regleDUnMotDePasse:Le mot de passe doit contenir au moins ${LONGUEUR_MIN_D_UN_MOT_DE_PASSE}:longueur: caractères, dont une majuscule, un chiffre et un caractère spécial.`;

export const BORNES_D_UN_MOT_DE_PASSE_SAISI = bornesDu(zLoginDto.shape.password, true);

export const BORNES_D_UN_NOM = bornesDu(zInscriptionDto.shape.firstName);

export const BORNES_D_UN_TELEPHONE = bornesDu(zInscriptionDto.shape.phone.unwrap().unwrap());

export const BORNES_D_UN_MESSAGE_DE_CONTACT = bornesDu(zContactRequestDto.shape.message);

export const BORNES_D_UN_NOM_DE_SITE = bornesDu(zAuditRequestRequestDto.shape.websiteName);

export const BORNES_D_UN_CONTACT_D_AUDIT = bornesDu(zAuditRequestRequestDto.shape.contactValue);
