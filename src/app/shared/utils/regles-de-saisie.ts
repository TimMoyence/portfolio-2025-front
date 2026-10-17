import type { ValidationErrors } from '@angular/forms';
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

export const LONGUEUR_MIN_D_UN_MOT_DE_PASSE = 12;

const LONGUEUR_MAX_D_UN_MOT_DE_PASSE = 256;

export const REGLE_D_UN_MOT_DE_PASSE = $localize`:@@regleDUnMotDePasse:Le mot de passe doit contenir au moins ${LONGUEUR_MIN_D_UN_MOT_DE_PASSE}:longueur: caractères, dont une majuscule, un chiffre et un caractère spécial.`;

export const BORNES_D_UN_MOT_DE_PASSE_SAISI: Bornes = {
  min: 1,
  max: LONGUEUR_MAX_D_UN_MOT_DE_PASSE,
  brute: true,
};

export const MOT_DE_PASSE_NEUF = {
  bornes: { min: LONGUEUR_MIN_D_UN_MOT_DE_PASSE, max: LONGUEUR_MAX_D_UN_MOT_DE_PASSE, brute: true },
  motif: '(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+',
} as const satisfies { bornes: Bornes; motif: string };

export const BORNES_D_UN_NOM: Bornes = { min: 1, max: 50 };

export const BORNES_D_UN_NOM_DU_PROFIL_JUSQU_AU_LOT_2D: Bornes = { ...BORNES_D_UN_NOM, min: 2 };

export const BORNES_D_UN_TELEPHONE: Bornes = { min: 0, max: 30 };

export const BORNES_D_UN_MESSAGE_DE_CONTACT: Bornes = { min: 10, max: 2000 };

export const BORNES_D_UN_NOM_DE_SITE: Bornes = { min: 2, max: 200 };

export const BORNES_D_UN_CONTACT_D_AUDIT: Bornes = { min: 6, max: 200 };
