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
  variant: 'default' | 'live' | 'bonus';
}

export interface FormationBenefit {
  icon: 'interactive' | 'screen' | 'toolkit';
  title: string;
  desc: string;
}

interface FormationGratuite extends Pick<
  FormationCard,
  'link' | 'badge' | 'title' | 'description'
> {
  duree: string;
  format: string;
  avecToolkit: boolean;
  variant: 'default' | 'live';
}

const META_TOOLKIT: FormationMeta = {
  key: $localize`:@@formations-list.meta.toolkit:Toolkit`,
  value: $localize`:@@formations-list.meta.toolkit.value:PDF à télécharger`,
};

function formationGratuite({
  duree,
  format,
  avecToolkit,
  variant,
  ...carte
}: FormationGratuite): FormationCard {
  return {
    ...carte,
    meta: [
      { key: $localize`:@@formations-list.meta.duration:Durée`, value: duree },
      { key: $localize`:@@formations-list.meta.format:Format`, value: format },
      ...(avecToolkit ? [META_TOOLKIT] : []),
    ],
    price: $localize`:@@formations-list.price.free:Gratuit`,
    cta: $localize`:@@formations-list.cta.view:Consulter`,
    variant,
  };
}

function coursBtsEnSeance(
  carte: Pick<FormationGratuite, 'link' | 'title' | 'description' | 'duree'>,
): FormationCard {
  return formationGratuite({
    ...carte,
    badge: $localize`:@@formations-list.b2.badge:BTS CG · Cours interactif`,
    format: $localize`:@@formations-list.b2.format:Slides + séance accompagnée`,
    avecToolkit: false,
    variant: 'live',
  });
}

export const FORMATIONS: readonly FormationCard[] = [
  coursBtsEnSeance({
    link: '/formations/b2-01-traitement-information-chiffree',
    title: $localize`:@@formations-list.b2.title:B2-01 — Lire et contrôler l’information chiffrée`,
    description: $localize`:@@formations-list.b2.description:Lire, contrôler et expliquer une information chiffrée : proportions, pourcentages, évolutions. À suivre en séance accompagnée, avec le code donné par votre formateur.`,
    duree: $localize`:@@formations-list.b2.duration:3 h 30`,
  }),
  coursBtsEnSeance({
    link: '/formations/b2-02-series-statistiques',
    title: $localize`:@@formations-list.b2-02.title:B2-02 — Séries statistiques : résumer, relier, prévoir`,
    description: $localize`:@@formations-list.b2-02.description:Résumer une série, relier deux variables par un nuage de points et un ajustement affine, puis prévoir au tableur, comme en CCF. À suivre en séance accompagnée de 3 h 30, pause de 30 min comprise, avec le code donné par votre formateur.`,
    duree: $localize`:@@formations-list.b2-02.duration:3 h 00`,
  }),
  coursBtsEnSeance({
    link: '/formations/b2-03-logique',
    title: $localize`:@@formations-list.b2-03.title:B2-03 — Logique : écrire et contrôler une règle`,
    description: $localize`:@@formations-list.b2-03.description:Traduire une règle de gestion avec et, ou, non, si… alors, la nier avec les lois de Morgan, dire « tous » ou « au moins un », puis la contrôler au tableur, comme en CCF. À suivre en séance accompagnée de 3 h 30, pause de 30 min comprise, avec le code donné par votre formateur.`,
    duree: $localize`:@@formations-list.b2-03.duration:3 h 00`,
  }),
  formationGratuite({
    link: '/formations/ia-solopreneurs',
    badge: $localize`:@@formations-list.ia-solo.badge:Gratuit · 17 slides`,
    title: $localize`:@@formations-list.ia-solo.title:L'IA au service des solopreneurs`,
    description: $localize`:@@formations-list.ia-solo.description:16 outils IA triés, un cas pratique en live : on trie le bullshit du vraiment utile. De quoi repartir avec une boîte à outils claire, pas une liste de hype.`,
    duree: $localize`:@@formations-list.ia-solo.duration:30 min · 17 slides`,
    format: $localize`:@@formations-list.ia-solo.format:Slides + quiz`,
    avecToolkit: true,
    variant: 'default',
  }),
  formationGratuite({
    link: '/formations/automatiser-avec-ia',
    badge: $localize`:@@formations-list.auto-ia.badge:Gratuit · 13 slides`,
    title: $localize`:@@formations-list.auto-ia.title:Automatiser avec l'IA — 5 workflows pour non-tech`,
    description: $localize`:@@formations-list.auto-ia.description:5 workflows testés sans coder — devis, emails, réseaux, factures, veille — pour récupérer environ 2h par jour. Concrets, reproductibles, applicables tout de suite.`,
    duree: $localize`:@@formations-list.auto-ia.duration:25 min · 13 slides`,
    format: $localize`:@@formations-list.auto-ia.format:Slides + sondages`,
    avecToolkit: true,
    variant: 'default',
  }),
  formationGratuite({
    link: '/formations/audit-seo-diy',
    badge: $localize`:@@formations-list.audit-seo.badge:Gratuit · 14 slides`,
    title: $localize`:@@formations-list.audit-seo.title:Audit SEO DIY — 7 points en 20 minutes`,
    description: $localize`:@@formations-list.audit-seo.description:7 checks SEO concrets avec 5 outils gratuits, pour savoir si Google trouve votre site — et corriger vous-même ce qui coince.`,
    duree: $localize`:@@formations-list.audit-seo.duration:20 min · 14 slides`,
    format: $localize`:@@formations-list.audit-seo.format:Slides + checklist`,
    avecToolkit: true,
    variant: 'default',
  }),
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
