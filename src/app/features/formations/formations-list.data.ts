interface FormationMeta {
  key: string;
  value: string;
}

export interface FormationCard {
  link: string;
  badge: string;
  title: string;
  description: string;
  meta: readonly FormationMeta[];
  price: string;
  cta: string;
  variant: 'default' | 'bonus';
}

export interface FormationBenefit {
  icon: 'interactive' | 'screen' | 'toolkit';
  title: string;
  desc: string;
}

export const FORMATIONS: readonly FormationCard[] = [
  {
    link: '/formations/ia-solopreneurs',
    badge: $localize`:@@formations-list.ia-solo.badge:Gratuit · 17 slides`,
    title: $localize`:@@formations-list.ia-solo.title:L'IA au service des solopreneurs`,
    description: $localize`:@@formations-list.ia-solo.description:16 outils IA triés, un cas pratique en live : on trie le bullshit du vraiment utile. De quoi repartir avec une boîte à outils claire, pas une liste de hype.`,
    meta: [
      {
        key: $localize`:@@formations-list.meta.duration:Durée`,
        value: $localize`:@@formations-list.ia-solo.duration:30 min · 17 slides`,
      },
      {
        key: $localize`:@@formations-list.meta.format:Format`,
        value: $localize`:@@formations-list.ia-solo.format:Slides + quiz`,
      },
      {
        key: $localize`:@@formations-list.meta.toolkit:Toolkit`,
        value: $localize`:@@formations-list.meta.toolkit.value:PDF à télécharger`,
      },
    ],
    price: $localize`:@@formations-list.price.free:Gratuit`,
    cta: $localize`:@@formations-list.cta.view:Consulter`,
    variant: 'default',
  },
  {
    link: '/formations/automatiser-avec-ia',
    badge: $localize`:@@formations-list.auto-ia.badge:Gratuit · 13 slides`,
    title: $localize`:@@formations-list.auto-ia.title:Automatiser avec l'IA — 5 workflows pour non-tech`,
    description: $localize`:@@formations-list.auto-ia.description:5 workflows testés sans coder — devis, emails, réseaux, factures, veille — pour récupérer environ 2h par jour. Concrets, reproductibles, applicables tout de suite.`,
    meta: [
      {
        key: $localize`:@@formations-list.meta.duration:Durée`,
        value: $localize`:@@formations-list.auto-ia.duration:25 min · 13 slides`,
      },
      {
        key: $localize`:@@formations-list.meta.format:Format`,
        value: $localize`:@@formations-list.auto-ia.format:Slides + sondages`,
      },
      {
        key: $localize`:@@formations-list.meta.toolkit:Toolkit`,
        value: $localize`:@@formations-list.meta.toolkit.value:PDF à télécharger`,
      },
    ],
    price: $localize`:@@formations-list.price.free:Gratuit`,
    cta: $localize`:@@formations-list.cta.view:Consulter`,
    variant: 'default',
  },
  {
    link: '/formations/audit-seo-diy',
    badge: $localize`:@@formations-list.audit-seo.badge:Gratuit · 14 slides`,
    title: $localize`:@@formations-list.audit-seo.title:Audit SEO DIY — 7 points en 20 minutes`,
    description: $localize`:@@formations-list.audit-seo.description:7 checks SEO concrets avec 5 outils gratuits, pour savoir si Google trouve votre site — et corriger vous-même ce qui coince.`,
    meta: [
      {
        key: $localize`:@@formations-list.meta.duration:Durée`,
        value: $localize`:@@formations-list.audit-seo.duration:20 min · 14 slides`,
      },
      {
        key: $localize`:@@formations-list.meta.format:Format`,
        value: $localize`:@@formations-list.audit-seo.format:Slides + checklist`,
      },
      {
        key: $localize`:@@formations-list.meta.toolkit:Toolkit`,
        value: $localize`:@@formations-list.meta.toolkit.value:PDF à télécharger`,
      },
    ],
    price: $localize`:@@formations-list.price.free:Gratuit`,
    cta: $localize`:@@formations-list.cta.view:Consulter`,
    variant: 'default',
  },
  {
    link: '/formations/ia-solopreneurs/toolkit',
    badge: $localize`:@@formations-list.toolkit.badge:Bonus`,
    title: $localize`:@@formations-list.toolkit.title:Le toolkit à emporter`,
    description: $localize`:@@formations-list.toolkit.description:Chaque formation s'accompagne d'un toolkit PDF : modèles de prompts, checklists, workflows prêts à l'emploi. Votre email sert uniquement à vous l'envoyer.`,
    meta: [
      {
        key: $localize`:@@formations-list.toolkit.meta.content:Contenu`,
        value: $localize`:@@formations-list.toolkit.meta.content.value:PDF + modèles`,
      },
      {
        key: $localize`:@@formations-list.toolkit.meta.access:Accès`,
        value: $localize`:@@formations-list.toolkit.meta.access.value:Email uniquement`,
      },
    ],
    price: $localize`:@@formations-list.price.offered:Offert`,
    cta: $localize`:@@formations-list.cta.toolkit:Recevoir le toolkit`,
    variant: 'bonus',
  },
];

export const FORMATION_BENEFITS: readonly FormationBenefit[] = [
  {
    icon: 'interactive',
    title: $localize`:@@formations-list.benefit.interactive.title:Interactif`,
    desc: $localize`:@@formations-list.benefit.interactive.desc:Des quiz et des sondages ponctuent chaque formation : on participe au lieu de subir.`,
  },
  {
    icon: 'screen',
    title: $localize`:@@formations-list.benefit.screen.title:En ligne ou projeté`,
    desc: $localize`:@@formations-list.benefit.screen.desc:À consulter tranquillement chez soi, ou à projeter en présentation devant une équipe.`,
  },
  {
    icon: 'toolkit',
    title: $localize`:@@formations-list.benefit.toolkit.title:Un toolkit à emporter`,
    desc: $localize`:@@formations-list.benefit.toolkit.desc:Chaque session se termine par un PDF actionnable, pour passer de l'écoute à la pratique.`,
  },
];
