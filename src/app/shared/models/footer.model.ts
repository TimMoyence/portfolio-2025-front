export type FooterLink = {
  label: string;
  href: string;
};

export type FooterColumn = {
  links: FooterLink[];
};

export type SocialLink = FooterLink & {
  icon?: string | null;
};
