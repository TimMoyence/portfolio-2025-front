import type { EntreeDeFormation } from '../../core/config/familles-de-formation';

export type NavLink = {
  label: string;
  href: string;
};

export type DropdownSection = {
  label: string;
  isOpen: boolean;
  items: readonly EntreeDeFormation[];
};
