export interface Bornes {
  readonly min: number;
  readonly max: number;
}

export const LONGUEUR_MIN_D_UN_MOT_DE_PASSE = 12;

export const LONGUEUR_MAX_D_UN_MOT_DE_PASSE = 256;

export const REGLE_D_UN_MOT_DE_PASSE = $localize`:@@regleDUnMotDePasse:Le mot de passe doit contenir au moins ${LONGUEUR_MIN_D_UN_MOT_DE_PASSE}:longueur: caractères, dont une majuscule, un chiffre et un caractère spécial.`;

export const MOT_DE_PASSE_NEUF = {
  longueurMin: LONGUEUR_MIN_D_UN_MOT_DE_PASSE,
  longueurMax: LONGUEUR_MAX_D_UN_MOT_DE_PASSE,
  motif: '(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+',
} as const;

export const LONGUEUR_MAX_D_UN_NOM = 50;

export const LONGUEUR_MAX_D_UN_TELEPHONE = 30;

export const BORNES_D_UN_MESSAGE_DE_CONTACT: Bornes = { min: 10, max: 2000 };

export const BORNES_D_UN_NOM_DE_SITE: Bornes = { min: 2, max: 200 };

export const BORNES_D_UN_CONTACT_D_AUDIT: Bornes = { min: 6, max: 200 };
