type FooterLink = {
  label: string;
  href: string;
};

type FooterColumn = {
  links: FooterLink[];
};

type SocialLink = FooterLink & {
  icon?: string | null;
  fallback?: string;
};
