export type NavLink = {
  label: string;
  href: string;
};

export type DropdownItem = {
  title: string;
  description: string;
  icon: string;
  iconAlt: string;
  href: string;
};

export type DropdownSection = {
  label: string;
  isOpen: boolean;
  items: DropdownItem[];
  /**
   * Sous-titre court affiche sous le label dans le drawer mobile
   * (ex. "Météo · Sebastian" pour L'Atelier). Optionnel : seuls les
   * dropdowns dont l'entree drawer expose un resume le renseignent.
   */
  subtitle?: string;
};
