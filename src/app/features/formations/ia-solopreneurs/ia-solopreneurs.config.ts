import type { FormationConfig } from "../shared/formation.types";
import { IA_SOLOPRENEURS_SLIDES } from "./ia-solopreneurs.data";

/**
 * Configuration de la formation "L'IA au service des solopreneurs".
 *
 * Source de verite unique : route `/formations/ia-solopreneurs`, JSON-LD
 * Course, FAQ annexe, sitemap et drip email sont tous derives de ce
 * fichier. Les slides restent dans `ia-solopreneurs.data.ts` pour rester
 * pilotables independamment lors d'un refresh.
 */
export const iaSolopreneursFormation: FormationConfig = {
  configVersion: 1,
  slug: "ia-solopreneurs",
  metadata: {
    title: {
      fr: $localize`:@@formations.ia-solopreneurs.metadata.title.fr:L'IA au service des solopreneurs — formation gratuite`,
      en: $localize`:@@formations.ia-solopreneurs.metadata.title.en:AI for solopreneurs — free training`,
    },
    description: {
      fr: $localize`:@@formations.ia-solopreneurs.metadata.description.fr:Seize outils d'intelligence artificielle testes en conditions reelles pour solopreneurs, freelances et petites equipes non-techniques. Formation gratuite de 30 minutes qui couvre les cas d'usage concrets et mesurables : generation de contenu, prospection commerciale, automatisation des taches repetitives, veille sectorielle, creation visuelle, podcasting. Chaque outil est compare honnement sur les criteres qui comptent pour un independant : cout mensuel reel, courbe d'apprentissage, gain de temps observe sur trois mois d'usage quotidien, limites constatees en pratique. Ni promesse marketing ni demonstration technique hors-sol : chaque exemple est tire directement de ma pratique quotidienne a Bordeaux, avec les prompts qui fonctionnent et ceux qui ne passent pas le test du client. A la fin, vous repartez avec un plan d'action concret pour cette semaine, un cheatsheet PDF personnalise selon votre secteur et niveau, et 30 prompts prets a copier-coller directement dans ChatGPT ou Claude.`,
      en: $localize`:@@formations.ia-solopreneurs.metadata.description.en:16 AI tools tested and used in production for solopreneurs, freelancers and small non-technical teams. A completely free 30-minute training covering concrete and measurable use-cases that actually matter: content generation, commercial prospecting, automation of repetitive daily tasks, sector monitoring, visual creation and podcasting. Every tool is honestly evaluated on criteria that matter to an independent professional: real monthly cost, learning curve, actual time savings measured over three months of daily use, and hard limits observed in practice. No marketing promises, no out-of-context demonstrations: every single example is drawn from my own work in Bordeaux, with the prompts that work and those that fail the client test. You leave with a concrete action plan for this week, a PDF cheatsheet personalised by sector, and 30 tested prompts ready to paste right into ChatGPT or Claude.`,
    },
    tagline: {
      fr: $localize`:@@formations.ia-solopreneurs.metadata.tagline.fr:16 outils testes, 30 minutes, cas pratiques — on trie le bullshit du vraiment utile.`,
      en: $localize`:@@formations.ia-solopreneurs.metadata.tagline.en:16 tested tools, 30 minutes, real use-cases — cutting through the hype.`,
    },
    duration: "PT30M",
    level: "beginner",
    category: "ia",
    tags: [
      "formation ia solopreneur",
      "outils ia independants",
      "prompt engineering francais",
      "automatisation ia solopreneur",
    ],
    iconSlug: "sparkles",
    // TODO(S2-og-images) : rapatrier les hero images sur le domaine
    // (public/assets/images/formations/). L'URL Pexels reste alignee avec
    // l'image deja utilisee dans la slide d'accroche (ia-solopreneurs.data.ts)
    // pour eviter une desynchro visuelle en attendant la migration.
    heroImage:
      "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1200",
    heroImageAlt: {
      fr: $localize`:@@formations.ia-solopreneurs.metadata.heroImageAlt.fr:Main de robot interagissant avec un reseau neuronal lumineux illustrant l'intelligence artificielle au service des solopreneurs`,
      en: $localize`:@@formations.ia-solopreneurs.metadata.heroImageAlt.en:Robot hand interacting with a glowing neural network illustrating AI for solopreneurs`,
    },
    publishDate: "2026-02-15",
    lastModified: "2026-04-20",
    status: "published",
  },
  slides: IA_SOLOPRENEURS_SLIDES,
  leadMagnet: {
    enabled: true,
    pdfTemplateId: "toolkit-ia-v1",
    emailDripId: "drip-ia-5d",
    customizationAxes: ["sector", "aiLevel", "budget"],
  },
  seo: {
    keywords: [
      "formation ia gratuite",
      "outils ia pour entrepreneur",
      "ia solopreneur bordeaux",
      "chatgpt claude gemini comparatif",
      "prompt francais pour independant",
      "stack ia 0 euro",
    ],
    prerequisites: [
      {
        fr: $localize`:@@formations.ia-solopreneurs.seo.prerequisites.0.fr:Aucun prerequis technique. Un ordinateur, un navigateur recent et 30 minutes disponibles.`,
        en: $localize`:@@formations.ia-solopreneurs.seo.prerequisites.0.en:No technical prerequisites. A computer, a recent browser and 30 minutes of availability.`,
      },
    ],
    teaches: [
      {
        fr: $localize`:@@formations.ia-solopreneurs.seo.teaches.0.fr:Identifier les 4 a 6 outils IA qui correspondent reellement a votre activite sans se disperser`,
        en: $localize`:@@formations.ia-solopreneurs.seo.teaches.0.en:Identify the 4 to 6 AI tools that really fit your business without spreading thin`,
      },
      {
        fr: $localize`:@@formations.ia-solopreneurs.seo.teaches.1.fr:Ecrire des prompts qui produisent un resultat utilisable du premier coup`,
        en: $localize`:@@formations.ia-solopreneurs.seo.teaches.1.en:Write prompts that produce a usable result on the first try`,
      },
      {
        fr: $localize`:@@formations.ia-solopreneurs.seo.teaches.2.fr:Automatiser 3 taches repetitives par semaine avec l'IA sans quitter vos outils actuels`,
        en: $localize`:@@formations.ia-solopreneurs.seo.teaches.2.en:Automate 3 repetitive tasks per week with AI without leaving your current stack`,
      },
      {
        fr: $localize`:@@formations.ia-solopreneurs.seo.teaches.3.fr:Detecter quand l'IA se trompe et mettre en place des garde-fous simples`,
        en: $localize`:@@formations.ia-solopreneurs.seo.teaches.3.en:Detect when AI is wrong and set up simple guardrails`,
      },
    ],
    learningResourceType: "Course",
    faq: [
      {
        question: {
          fr: $localize`:@@formations.ia-solopreneurs.faq.0.q.fr:La formation est-elle vraiment gratuite ?`,
          en: $localize`:@@formations.ia-solopreneurs.faq.0.q.en:Is this training really free?`,
        },
        answer: {
          fr: $localize`:@@formations.ia-solopreneurs.faq.0.a.fr:Oui, integralement. Les slides interactifs, les quiz et les polls sont gratuits et consultables sans inscription. Seule la boite a outils PDF personnalisee demande un email pour l'envoi, que vous pouvez retirer a tout moment.`,
          en: $localize`:@@formations.ia-solopreneurs.faq.0.a.en:Yes, fully. Interactive slides, quizzes and polls are free and accessible without signup. Only the personalised PDF toolkit requires an email for delivery, which you can unsubscribe from at any time.`,
        },
      },
      {
        question: {
          fr: $localize`:@@formations.ia-solopreneurs.faq.1.q.fr:Dois-je savoir coder pour suivre cette formation ?`,
          en: $localize`:@@formations.ia-solopreneurs.faq.1.q.en:Do I need to know how to code to follow this training?`,
        },
        answer: {
          fr: $localize`:@@formations.ia-solopreneurs.faq.1.a.fr:Non. La formation est pensee pour des independants non-techniques : pas d'API, pas de terminal, pas de webhook. Tous les outils montres s'utilisent via une interface graphique standard et les prompts sont donnes prets a copier-coller.`,
          en: $localize`:@@formations.ia-solopreneurs.faq.1.a.en:No. The training is built for non-technical independents: no APIs, no terminals, no webhooks. Every tool shown uses a standard graphical interface and the prompts are provided ready to copy and paste.`,
        },
      },
      {
        question: {
          fr: $localize`:@@formations.ia-solopreneurs.faq.2.q.fr:Quel budget mensuel faut-il prevoir ?`,
          en: $localize`:@@formations.ia-solopreneurs.faq.2.q.en:What monthly budget should I plan for?`,
        },
        answer: {
          fr: $localize`:@@formations.ia-solopreneurs.faq.2.a.fr:Entre 0 et 60 euros par mois selon l'usage. La formation montre un stack complet 100 % gratuit qui suffit pour demarrer et traite separement les cas ou passer a un tarif payant a un reel sens (volume quotidien, besoin de contexte long, generation d'images commerciale).`,
          en: $localize`:@@formations.ia-solopreneurs.faq.2.a.en:Between 0 and 60 euros per month depending on usage. The training shows a fully free stack that is enough to get started, and separately covers when upgrading to a paid tier actually matters (daily volume, long-context needs, commercial image generation).`,
        },
      },
      {
        question: {
          fr: $localize`:@@formations.ia-solopreneurs.faq.3.q.fr:Et si l'IA me donne une mauvaise reponse ?`,
          en: $localize`:@@formations.ia-solopreneurs.faq.3.q.en:What if the AI gives me a wrong answer?`,
        },
        answer: {
          fr: $localize`:@@formations.ia-solopreneurs.faq.3.a.fr:C'est un vrai risque, traite explicitement dans la formation. On voit trois patterns anti-hallucination que j'utilise en production : ancrage via sources citees, verification croisee entre deux modeles, et checklist de relecture avant publication. Aucun outil ne remplace votre expertise metier, et la formation insiste sur ce point.`,
          en: $localize`:@@formations.ia-solopreneurs.faq.3.a.en:It is a real risk, addressed explicitly. Three anti-hallucination patterns are covered: grounding via cited sources, cross-checking between two models, and a pre-publication review checklist. No tool replaces your domain expertise, and the training insists on this.`,
        },
      },
      {
        question: {
          fr: $localize`:@@formations.ia-solopreneurs.faq.4.q.fr:La formation est-elle mise a jour ?`,
          en: $localize`:@@formations.ia-solopreneurs.faq.4.q.en:Is the training kept up to date?`,
        },
        answer: {
          fr: $localize`:@@formations.ia-solopreneurs.faq.4.a.fr:Oui, tous les trois a quatre mois. Les outils IA bougent vite ; les slides qui ne fonctionnent plus sont remplaces, les grilles tarifaires revues et les nouveautes integrees si elles tiennent la route au bout d'un mois d'usage. La date de derniere mise a jour est affichee en bas de page.`,
          en: $localize`:@@formations.ia-solopreneurs.faq.4.a.en:Yes, every three to four months. AI tools move fast; slides that no longer hold are replaced, pricing is refreshed and new tools are added only if they prove useful after a month of real use. The last update date is shown at the bottom of the page.`,
        },
      },
      {
        question: {
          fr: $localize`:@@formations.ia-solopreneurs.faq.5.q.fr:Proposez-vous un accompagnement au-dela de la formation ?`,
          en: $localize`:@@formations.ia-solopreneurs.faq.5.q.en:Do you offer support beyond the training?`,
        },
        answer: {
          fr: $localize`:@@formations.ia-solopreneurs.faq.5.a.fr:Oui : accompagnement individuel et formation intra-entreprise sur l'integration IA dans des workflows metier existants. Les details sont sur la page offre et vous pouvez repondre directement a n'importe quel email pour en discuter.`,
          en: $localize`:@@formations.ia-solopreneurs.faq.5.a.en:Yes: one-on-one coaching and in-company training on integrating AI into existing business workflows. Details are on the offer page and you can reply to any email to discuss.`,
        },
      },
    ],
  },
  conversion: {
    primary: {
      labelKey: "formations.ia-solopreneurs.conversion.primary.label",
      href: "/formations/ia-solopreneurs/toolkit",
      trackingId: "ia-solopreneurs-primary-toolkit",
    },
  },
  analytics: {
    eventPrefix: "formation_ia_",
    trackProgress: true,
    trackInteractions: true,
  },
};
