export interface FormationCard {
  slug: string;
  title: string;
  description: string;
  duration: string;
  slidesCount: number;
  badge: string;
  icon: string;
}

export const FORMATIONS: FormationCard[] = [
  {
    slug: "ia-solopreneurs",
    title: "L'IA au service des solopreneurs",
    description:
      "Panorama des meilleurs outils IA pour entrepreneurs, suivi d'un cas pratique en live.",
    duration: "30 min",
    slidesCount: 21,
    badge: "Gratuit",
    icon: "sparkles",
  },
];
