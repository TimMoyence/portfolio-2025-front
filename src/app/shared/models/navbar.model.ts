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
};
