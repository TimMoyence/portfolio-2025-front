export type ContactMethod = {
  label: string;
  value: string;
  href?: string;
  icon?: string;
  schemaProp?: 'email' | 'telephone' | 'address';
};
