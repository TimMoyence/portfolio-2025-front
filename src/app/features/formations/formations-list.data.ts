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
  {
    slug: "automatiser-avec-ia",
    title: $localize`:@@formations-list.auto-ia.title:Automatiser avec l'IA — 5 workflows pour non-tech`,
    description: $localize`:@@formations-list.auto-ia.description:5 workflows testés, 25 minutes, zéro ligne de code — devis, emails, réseaux sociaux, factures, veille.`,
    duration: $localize`:@@formations-list.auto-ia.duration:25 min`,
    slidesCount: 13,
    badge: $localize`:@@formations-list.auto-ia.badge:Gratuit`,
    icon: "sparkles",
  },
  {
    slug: "audit-seo-diy",
    title: $localize`:@@formations-list.audit-seo.title:Audit SEO DIY — 7 points en 20 minutes`,
    description: $localize`:@@formations-list.audit-seo.description:7 checks SEO concrets, 5 outils gratuits, 20 minutes — pour savoir si Google trouve vraiment votre site.`,
    duration: $localize`:@@formations-list.audit-seo.duration:20 min`,
    slidesCount: 14,
    badge: $localize`:@@formations-list.audit-seo.badge:Gratuit`,
    icon: "sparkles",
  },
];
