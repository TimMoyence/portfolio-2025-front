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
      "16 outils IA triés, 30 minutes, cas pratique en live — on trie le bullshit du vraiment utile.",
    duration: "30 min",
    slidesCount: 17,
    badge: "Gratuit",
    icon: "sparkles",
  },
];
