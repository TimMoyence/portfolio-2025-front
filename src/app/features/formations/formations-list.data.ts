export interface FormationCard {
  slug: string;
  title: string;
  description: string;
  duration: string;
  slidesCount: number;
  badge: string;
  icon: string;
}

/**
 * Liste des formations disponibles affichées sur la page d'accueil des formations.
 * Les chaînes utilisateur sont internationalisées via $localize.
 */
export const FORMATIONS: FormationCard[] = [
  {
    slug: "ia-solopreneurs",
    title: $localize`:@@formations-list.ia-solo.title:L'IA au service des solopreneurs`,
    description: $localize`:@@formations-list.ia-solo.description:16 outils IA triés, 30 minutes, cas pratique en live — on trie le bullshit du vraiment utile.`,
    duration: $localize`:@@formations-list.ia-solo.duration:30 min`,
    slidesCount: 17,
    badge: $localize`:@@formations-list.ia-solo.badge:Gratuit`,
    icon: "sparkles",
  },
];
