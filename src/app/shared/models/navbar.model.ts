type NavLink = {
  label: string;
  href: string;
};

type DropdownItem = {
  title: string;
  description: string;
  icon: string;
  iconAlt: string;
  href: string;
};

type DropdownSection = {
  label: string;
  isOpen: boolean;
  items: DropdownItem[];
};
