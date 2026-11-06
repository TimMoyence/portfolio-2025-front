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

type CarteDeCoursEnSeance = Pick<FormationGratuite, 'link' | 'title' | 'description' | 'duree'>;

function coursEnSeance(carte: CarteDeCoursEnSeance, badge: string): FormationCard {
  return formationGratuite({
    ...carte,
    badge,
    format: $localize`:@@formations-list.b2.format:Slides + séance accompagnée`,
    avecToolkit: false,
    variant: 'live',
  });
}

function coursBtsEnSeance(carte: CarteDeCoursEnSeance): FormationCard {
  return coursEnSeance(carte, $localize`:@@formations-list.b2.badge:BTS CG · Cours interactif`);
}

function coursBachelorEnSeance(carte: CarteDeCoursEnSeance): FormationCard {
  return coursEnSeance(carte, $localize`:@@formations-list.b3.badge:Bachelor 3 · Cours interactif`);
}

export const FORMATIONS: readonly FormationCard[] = [
  coursBtsEnSeance({
    link: '/formations/b1-01-proportions-pourcentages',
    title: $localize`:@@formations-list.b1-01.title:B1-01 — Proportions et pourcentages`,
    description: $localize`:@@formations-list.b1-01.description:Calculer une part et dire de quel tout elle parle, multiplier deux parts, calculer un taux global, distinguer points et pourcentages, taux de marge et taux de marque, puis répartir un effectif au tableur, comme en CCF. À suivre en séance accompagnée, avec le code donné par votre formateur.`,
    duree: $localize`:@@formations-list.b1-01.duration:2 h 00`,
  }),
  coursBtsEnSeance({
    link: '/formations/b1-02-evolutions-coefficients-indices',
    title: $localize`:@@formations-list.b1-02.title:B1-02 — Évolutions : taux, coefficients, indices`,
    description: $localize`:@@formations-list.b1-02.description:Passer d’un taux à un coefficient, du HT au TTC, enchaîner des évolutions, revenir au départ, lire un indice et calculer un taux moyen, puis traiter au tableur un tableau de sujet de BTS. À suivre en séance accompagnée, avec le code donné par votre formateur.`,
    duree: $localize`:@@formations-list.b1-02.duration:2 h 00`,
  }),
  coursBtsEnSeance({
    link: '/formations/b1-03-tcd-serie-une-variable',
    title: $localize`:@@formations-list.b1-03.title:B1-03 — Traiter un fichier : TCD et série à une variable`,
    description: $localize`:@@formations-list.b1-03.description:Regrouper un fichier de ventes par un tableau croisé dynamique dans Excel, calculer le taux de marge par un champ calculé, résumer une série par la médiane, les quartiles et l’écart type, puis comparer deux séries par leurs boîtes à moustaches. Chaque notion s’explique d’abord par une image du quotidien. À suivre en séance accompagnée, avec le code donné par votre formateur.`,
    duree: $localize`:@@formations-list.b1-03.duration:2 h 00`,
  }),
  coursBtsEnSeance({
    link: '/formations/b2-01-traitement-information-chiffree',
    title: $localize`:@@formations-list.b2.title:B2-01 — Lire et contrôler l’information chiffrée`,
    description: $localize`:@@formations-list.b2.description:Lire, contrôler et expliquer une information chiffrée : proportions, pourcentages, évolutions. À suivre en séance accompagnée, avec le code donné par votre formateur.`,
    duree: $localize`:@@formations-list.b2.duration:3 h 20`,
  }),
  coursBtsEnSeance({
    link: '/formations/b2-02-series-statistiques',
    title: $localize`:@@formations-list.b2-02.title:B2-02 — Séries statistiques : résumer, relier, prévoir`,
    description: $localize`:@@formations-list.b2-02.description:Résumer une série, relier deux variables par un nuage de points et un ajustement affine, puis prévoir au tableur, comme en CCF. À suivre en séance accompagnée de 3 h 15, pause de 30 min comprise, avec le code donné par votre formateur.`,
    duree: $localize`:@@formations-list.b2-02.duration:2 h 45`,
  }),
  coursBtsEnSeance({
    link: '/formations/b2-03-logique',
    title: $localize`:@@formations-list.b2-03.title:B2-03 — Logique : écrire et contrôler une règle`,
    description: $localize`:@@formations-list.b2-03.description:Traduire une règle de gestion avec et, ou, non, si… alors, la nier avec les lois de Morgan, dire « tous » ou « au moins un », puis la contrôler au tableur, comme en CCF. À suivre en séance accompagnée, avec le code donné par votre formateur.`,
    duree: $localize`:@@formations-list.b2-03.duration:2 h 15`,
  }),
  coursBtsEnSeance({
    link: '/formations/b2-04-suites',
    title: $localize`:@@formations-list.b2-04.title:B2-04 — Suites : modéliser une évolution régulière`,
    description: $localize`:@@formations-list.b2-04.description:Modéliser une évolution par une suite arithmétique ou géométrique, comparer deux hypothèses de croissance, trouver le rang où un seuil est franchi et cumuler des termes au tableur, comme en CCF. À suivre en séance accompagnée de 3 h 15, pause de 30 min comprise, avec le code donné par votre formateur.`,
    duree: $localize`:@@formations-list.b2-04.duration:2 h 45`,
  }),
  coursBtsEnSeance({
    link: '/formations/b2-05-mathematiques-financieres',
    title: $localize`:@@formations-list.b2-05.title:B2-05 — Mathématiques financières : placer, emprunter`,
    description: $localize`:@@formations-list.b2-05.description:Calculer une valeur acquise et une valeur actuelle, chiffrer une suite de versements, construire le tableau d’amortissement d’un emprunt et son coût, avec VPM au tableur, comme en CCF. À suivre en séance accompagnée de 2 h 45, pause de 30 min comprise, avec le code donné par votre formateur.`,
    duree: $localize`:@@formations-list.b2-05.duration:2 h 15`,
  }),
  coursBtsEnSeance({
    link: '/formations/b2-06-exponentielle-logarithme',
    title: $localize`:@@formations-list.b2-06.title:B2-06 — Exponentielle et logarithme : croître, viser, ajuster`,
    description: $localize`:@@formations-list.b2-06.description:Calculer avec un modèle exponentiel et son taux, trouver un seuil avec le logarithme népérien, ajuster une série par z = ln y et prévoir avec EXP et LN au tableur, comme en CCF. À suivre en séance accompagnée de 2 h 45, pause de 30 min comprise, avec le code donné par votre formateur.`,
    duree: $localize`:@@formations-list.b2-06.duration:2 h 15`,
  }),
  coursBtsEnSeance({
    link: '/formations/b2-07-derivee-optimisation',
    title: $localize`:@@formations-list.b2-07.title:B2-07 — Dérivée et optimisation : la pente, le sens, le sommet`,
    description: $localize`:@@formations-list.b2-07.description:Revoir d’abord l’exponentielle, le logarithme et la boucle « Tant que » par des images du quotidien, puis dériver un polynôme et a e^(kx), étudier le signe de la dérivée, dresser un tableau de variation et trouver un prix optimal, même sous contrainte, comme en CCF. À suivre en séance accompagnée de 2 h 45, pause de 30 min comprise, avec le code donné par votre formateur.`,
    duree: $localize`:@@formations-list.b2-07.duration:2 h 15`,
  }),
  coursBachelorEnSeance({
    link: '/formations/b3-01-donnee-brute-decision',
    title: $localize`:@@formations-list.b3-01.title:B3-01 — Expert Data : de la donnée brute à la décision`,
    description: $localize`:@@formations-list.b3-01.description:Nettoyer un export de ventes dans Excel, le croiser avec ses référentiels, le résumer par un tableau croisé dynamique, puis bâtir un tableau de bord et une recommandation pour un comité de direction. À suivre en séance accompagnée de 3 h 25, pause de 30 min comprise, avec le code donné par votre formateur.`,
    duree: $localize`:@@formations-list.b3-01.duration:2 h 55`,
  }),
  coursBachelorEnSeance({
    link: '/formations/b3-02-formules-et-ia-analyste',
    title: $localize`:@@formations-list.b3-02.title:B3-02 — Toutes les formules, puis l’IA analyste`,
    description: $localize`:@@formations-list.b3-02.description:Toutes les formules Excel du manager, une page chacune : syntaxe, arguments, exemple chiffré, piège ; puis nettoyer, relier, compter les jours ouvrés, croiser par un TCD et bâtir un tableau de bord, pas à pas. Une heure enfin pour confier l’analyse à une IA, la guider par son cahier de règles et vérifier ses chiffres. À suivre en séance accompagnée de 3 h 30, pause de 30 min comprise, avec le code donné par votre formateur.`,
    duree: $localize`:@@formations-list.b3-02.duration:3 h 00`,
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
    avecToolkit: false,
    variant: 'default',
  }),
  formationGratuite({
    link: '/formations/audit-seo-diy',
    badge: $localize`:@@formations-list.audit-seo.badge:Gratuit · 14 slides`,
    title: $localize`:@@formations-list.audit-seo.title:Audit SEO DIY — 7 points en 20 minutes`,
    description: $localize`:@@formations-list.audit-seo.description:7 checks SEO concrets avec 5 outils gratuits, pour savoir si Google trouve votre site — et corriger vous-même ce qui coince.`,
    duree: $localize`:@@formations-list.audit-seo.duration:20 min · 14 slides`,
    format: $localize`:@@formations-list.audit-seo.format:Slides + checklist`,
    avecToolkit: false,
    variant: 'default',
  }),
  {
    link: '/formations/ia-solopreneurs/toolkit',
    badge: $localize`:@@formations-list.toolkit.badge:Bonus`,
    title: $localize`:@@formations-list.toolkit.title:Le toolkit à emporter`,
    description: $localize`:@@formations-list.toolkit.description:La formation « L'IA au service des solopreneurs » s'accompagne d'un toolkit PDF : modèles de prompts, checklists, workflows prêts à l'emploi. Votre email sert uniquement à vous l'envoyer.`,
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
    desc: $localize`:@@formations-list.benefit.toolkit.desc:La formation IA pour solopreneurs se termine par un toolkit PDF actionnable, pour passer de l'écoute à la pratique.`,
  },
];
