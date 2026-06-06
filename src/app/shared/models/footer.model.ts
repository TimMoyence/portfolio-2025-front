export type FooterLink = {
  label: string;
  href: string;
  /**
   * Lien externe (rendu via `[href]` + `target="_blank"` cote template) plutot
   * qu'un `routerLink` interne. Utilise notamment pour LinkedIn dans la colonne
   * "En savoir plus" du footer Asili.
   */
  external?: boolean;
};

export type FooterColumn = {
  /**
   * En-tete de colonne du footer (ex. "Travailler", "L'Atelier",
   * "En savoir plus"). Optionnel : les colonnes sans titre (legacy) le laissent
   * vide.
   */
  heading?: string;
  links: FooterLink[];
};

export type SocialLink = FooterLink & {
  icon?: string | null;
};
