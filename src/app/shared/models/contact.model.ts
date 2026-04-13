export type ContactMethod = {
  label: string;
  value: string;
  href?: string;
  icon?: string;
  /** Propriete schema.org a utiliser sur l'element (email, telephone, address). */
  schemaProp?: "email" | "telephone" | "address";
};
