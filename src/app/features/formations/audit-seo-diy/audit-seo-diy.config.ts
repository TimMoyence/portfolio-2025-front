import type { FormationConfig } from "../shared/formation.types";
import { AUDIT_SEO_DIY_SLIDES } from "./audit-seo-diy.slides.data";

/**
 * Configuration de la formation "Audit SEO DIY".
 *
 * Cible : entrepreneurs, solopreneurs et TPE qui veulent savoir si leur
 * site web est visible sur Google sans payer un audit professionnel a
 * 1 500 euros. L'angle est business : chaque check est presente comme
 * un signal de chiffre d'affaires, jamais comme un exercice technique.
 *
 * Cross-sell vers `/growth-audit` (audit payant IA + humain) pour les
 * cas qui depassent le DIY (chute de trafic, migration, e-commerce > 500
 * pages, concurrence agressive).
 */
export const auditSeoDiyFormation: FormationConfig = {
  configVersion: 1,
  slug: "audit-seo-diy",
  metadata: {
    title: {
      fr: $localize`:@@formations.audit-seo-diy.metadata.title.fr:Audit SEO DIY — 7 points a verifier en 20 minutes sur votre site`,
      en: $localize`:@@formations.audit-seo-diy.metadata.title.en:DIY SEO Audit — 7 checks to run in 20 minutes on your website`,
    },
    description: {
      fr: $localize`:@@formations.audit-seo-diy.metadata.description.fr:Formation gratuite de vingt minutes pour entrepreneurs, solopreneurs, artisans et commercants qui veulent savoir si leur site web est visible sur Google sans payer un audit professionnel couteux. On y decouvre sept points precis a verifier dans un ordre strict, du plus critique au plus qualitatif, en utilisant cinq outils entierement gratuits deja utilises par la plupart des agences SEO. Chaque check se termine par un verdict clair et une action concrete : indexation Google, titres, vitesse mobile, experience smartphone, richesse du contenu, structure des questions-reponses et signaux pour les moteurs de reponse comme ChatGPT ou Perplexity. La formation explique aussi quand un audit maison ne suffit plus et qu'il faut passer la main a un pro. Format sans jargon : pas de termes techniques sans traduction business claire, zero abonnement requis et aucune competence tech prealable demandee.`,
      en: $localize`:@@formations.audit-seo-diy.metadata.description.en:Free twenty-minute training designed for entrepreneurs, solopreneurs, craftspeople and shop owners who want to know if their website is visible on Google without paying for an expensive professional audit. Covers seven specific checks to run in a strict order, from the most critical to the most qualitative, using five completely free tools already used by most SEO agencies every day. Each check ends with a clear verdict and a concrete action: Google indexing, page titles, mobile speed, smartphone experience, content richness, question-and-answer structure, and signals for answer engines like ChatGPT and Perplexity. The training also explains when a DIY audit is no longer enough and when you should hand over to a professional. Jargon-free format: no technical terms without a clear business translation, no paid subscription required and no prior technical skill needed whatsoever.`,
    },
    tagline: {
      fr: $localize`:@@formations.audit-seo-diy.metadata.tagline.fr:7 checks SEO en 20 minutes avec 5 outils gratuits — sans jargon.`,
      en: $localize`:@@formations.audit-seo-diy.metadata.tagline.en:7 SEO checks in 20 minutes with 5 free tools — no jargon.`,
    },
    duration: "PT20M",
    level: "beginner",
    category: "seo",
    tags: [
      "audit seo diy",
      "audit seo gratuit",
      "audit seo soi-meme",
      "verifier son site web",
      "seo entrepreneur non-tech",
    ],
    iconSlug: "sparkles",
    // TODO(S3-og-images) : rapatrier sur public/assets/images/formations/
    heroImage:
      "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=1200",
    heroImageAlt: {
      fr: $localize`:@@formations.audit-seo-diy.metadata.heroImageAlt.fr:Entrepreneure analysant les statistiques de visite de son site web sur un ordinateur portable`,
      en: $localize`:@@formations.audit-seo-diy.metadata.heroImageAlt.en:Entrepreneur analysing her website visit statistics on a laptop computer`,
    },
    publishDate: "2026-04-21",
    lastModified: "2026-04-21",
    status: "published",
  },
  slides: AUDIT_SEO_DIY_SLIDES,
  quiz: {
    id: "audit-seo-diy-profile-quiz",
    questions: [
      {
        id: "q-secteur",
        question: {
          fr: $localize`:@@formations.audit-seo-diy.quiz.q-secteur.fr:Quel est votre secteur d'activite ?`,
          en: $localize`:@@formations.audit-seo-diy.quiz.q-secteur.en:What is your business sector?`,
        },
        kind: "single-choice",
        options: [
          {
            value: "services",
            label: {
              fr: $localize`:@@formations.audit-seo-diy.quiz.q-secteur.opt.services.fr:Services (coaching, conseil, therapie)`,
              en: $localize`:@@formations.audit-seo-diy.quiz.q-secteur.opt.services.en:Services (coaching, consulting, therapy)`,
            },
          },
          {
            value: "artisan",
            label: {
              fr: $localize`:@@formations.audit-seo-diy.quiz.q-secteur.opt.artisan.fr:Artisanat (plombier, coiffeur, menuisier)`,
              en: $localize`:@@formations.audit-seo-diy.quiz.q-secteur.opt.artisan.en:Crafts (plumber, hairdresser, carpenter)`,
            },
          },
          {
            value: "commerce",
            label: {
              fr: $localize`:@@formations.audit-seo-diy.quiz.q-secteur.opt.commerce.fr:Commerce physique ou e-commerce`,
              en: $localize`:@@formations.audit-seo-diy.quiz.q-secteur.opt.commerce.en:Physical shop or e-commerce`,
            },
          },
          {
            value: "creation",
            label: {
              fr: $localize`:@@formations.audit-seo-diy.quiz.q-secteur.opt.creation.fr:Creation (photo, design, musique, ecriture)`,
              en: $localize`:@@formations.audit-seo-diy.quiz.q-secteur.opt.creation.en:Creative (photo, design, music, writing)`,
            },
          },
        ],
        profileField: "sector",
      },
      {
        id: "q-visibilite",
        question: {
          fr: $localize`:@@formations.audit-seo-diy.quiz.q-visibilite.fr:Comment evaluez-vous votre visibilite actuelle sur Google ?`,
          en: $localize`:@@formations.audit-seo-diy.quiz.q-visibilite.en:How do you rate your current visibility on Google?`,
        },
        kind: "single-choice",
        options: [
          {
            value: "invisible",
            label: {
              fr: $localize`:@@formations.audit-seo-diy.quiz.q-visibilite.opt.invisible.fr:Je n'apparais nulle part`,
              en: $localize`:@@formations.audit-seo-diy.quiz.q-visibilite.opt.invisible.en:I don't show up anywhere`,
            },
          },
          {
            value: "nom",
            label: {
              fr: $localize`:@@formations.audit-seo-diy.quiz.q-visibilite.opt.nom.fr:On me trouve en tapant mon nom`,
              en: $localize`:@@formations.audit-seo-diy.quiz.q-visibilite.opt.nom.en:Found when typing my name`,
            },
          },
          {
            value: "metier",
            label: {
              fr: $localize`:@@formations.audit-seo-diy.quiz.q-visibilite.opt.metier.fr:On me trouve sur mon metier + ville`,
              en: $localize`:@@formations.audit-seo-diy.quiz.q-visibilite.opt.metier.en:Found on my trade + city`,
            },
          },
          {
            value: "generique",
            label: {
              fr: $localize`:@@formations.audit-seo-diy.quiz.q-visibilite.opt.generique.fr:Je sors sur des mots-cles generiques`,
              en: $localize`:@@formations.audit-seo-diy.quiz.q-visibilite.opt.generique.en:I rank on generic keywords`,
            },
          },
        ],
        profileField: "aiLevel",
      },
      {
        id: "q-budget",
        question: {
          fr: $localize`:@@formations.audit-seo-diy.quiz.q-budget.fr:Quel budget SEO etes-vous pret(e) a investir par mois ?`,
          en: $localize`:@@formations.audit-seo-diy.quiz.q-budget.en:What monthly SEO budget are you willing to invest?`,
        },
        kind: "single-choice",
        options: [
          {
            value: "zero",
            label: {
              fr: $localize`:@@formations.audit-seo-diy.quiz.q-budget.opt.zero.fr:Zero euro — je veux tout faire moi-meme`,
              en: $localize`:@@formations.audit-seo-diy.quiz.q-budget.opt.zero.en:Zero euros — I want to DIY everything`,
            },
          },
          {
            value: "small",
            label: {
              fr: $localize`:@@formations.audit-seo-diy.quiz.q-budget.opt.small.fr:Moins de 200 euros / mois`,
              en: $localize`:@@formations.audit-seo-diy.quiz.q-budget.opt.small.en:Under 200 euros / month`,
            },
          },
          {
            value: "medium",
            label: {
              fr: $localize`:@@formations.audit-seo-diy.quiz.q-budget.opt.medium.fr:200 a 500 euros / mois`,
              en: $localize`:@@formations.audit-seo-diy.quiz.q-budget.opt.medium.en:200 to 500 euros / month`,
            },
          },
          {
            value: "large",
            label: {
              fr: $localize`:@@formations.audit-seo-diy.quiz.q-budget.opt.large.fr:Plus de 500 euros / mois`,
              en: $localize`:@@formations.audit-seo-diy.quiz.q-budget.opt.large.en:Over 500 euros / month`,
            },
          },
        ],
        profileField: "budget",
      },
    ],
  },
  leadMagnet: {
    enabled: true,
    pdfTemplateId: "toolkit-audit-seo-v1",
    emailDripId: "drip-seo-diy",
    customizationAxes: ["sector", "aiLevel", "budget"],
  },
  seo: {
    keywords: [
      "audit seo diy",
      "audit seo gratuit",
      "verifier seo de son site",
      "checker son site web",
      "outils seo gratuits 2026",
    ],
    prerequisites: [
      {
        fr: $localize`:@@formations.audit-seo-diy.seo.prerequisites.0.fr:Avoir un site web en ligne et y acceder (administrateur ou developpeur disponible au besoin).`,
        en: $localize`:@@formations.audit-seo-diy.seo.prerequisites.0.en:Have a website online and access to it (administrator or developer available if needed).`,
      },
    ],
    teaches: [
      {
        fr: $localize`:@@formations.audit-seo-diy.seo.teaches.0.fr:Verifier en 30 secondes si Google a indexe votre site`,
        en: $localize`:@@formations.audit-seo-diy.seo.teaches.0.en:Check in 30 seconds if Google has indexed your website`,
      },
      {
        fr: $localize`:@@formations.audit-seo-diy.seo.teaches.1.fr:Identifier les 3 problemes SEO qui coutent le plus de clients potentiels`,
        en: $localize`:@@formations.audit-seo-diy.seo.teaches.1.en:Identify the 3 SEO issues costing you the most potential customers`,
      },
      {
        fr: $localize`:@@formations.audit-seo-diy.seo.teaches.2.fr:Utiliser 5 outils SEO entierement gratuits (Google Search Console, PageSpeed, etc.)`,
        en: $localize`:@@formations.audit-seo-diy.seo.teaches.2.en:Use 5 completely free SEO tools (Google Search Console, PageSpeed, etc.)`,
      },
      {
        fr: $localize`:@@formations.audit-seo-diy.seo.teaches.3.fr:Produire un rapport d'audit d'une page, imprimable et actionable cette semaine`,
        en: $localize`:@@formations.audit-seo-diy.seo.teaches.3.en:Produce a one-page audit report, printable and actionable this week`,
      },
      {
        fr: $localize`:@@formations.audit-seo-diy.seo.teaches.4.fr:Savoir quand un audit DIY ne suffit plus et qu'il faut appeler un pro`,
        en: $localize`:@@formations.audit-seo-diy.seo.teaches.4.en:Know when a DIY audit is not enough and you should call a professional`,
      },
    ],
    learningResourceType: "Tutorial",
    faq: [
      {
        question: {
          fr: $localize`:@@formations.audit-seo-diy.faq.0.q.fr:Puis-je faire cet audit sans competence technique ?`,
          en: $localize`:@@formations.audit-seo-diy.faq.0.q.en:Can I run this audit without technical skills?`,
        },
        answer: {
          fr: $localize`:@@formations.audit-seo-diy.faq.0.a.fr:Oui entierement. Chaque check utilise soit Google directement, soit des outils en ligne avec un formulaire. Aucun terminal, aucun code, aucune configuration serveur. Si vous savez faire une recherche Google, vous savez lire le verdict de chaque outil presente.`,
          en: $localize`:@@formations.audit-seo-diy.faq.0.a.en:Yes, entirely. Every check uses either Google directly or online tools with a form. No terminal, no code, no server configuration. If you can run a Google search, you can read the verdict each tool returns.`,
        },
      },
      {
        question: {
          fr: $localize`:@@formations.audit-seo-diy.faq.1.q.fr:Combien de temps avant de voir des resultats si je corrige les erreurs ?`,
          en: $localize`:@@formations.audit-seo-diy.faq.1.q.en:How long before I see results once I fix the issues?`,
        },
        answer: {
          fr: $localize`:@@formations.audit-seo-diy.faq.1.a.fr:Les corrections techniques (indexation, vitesse) produisent des effets visibles en 2 a 4 semaines. Les ameliorations de contenu prennent 3 a 6 mois pour grimper dans les resultats. Le SEO est un marathon, pas un sprint — on fait tout en 20 min, on attend plusieurs mois.`,
          en: $localize`:@@formations.audit-seo-diy.faq.1.a.en:Technical fixes (indexing, speed) produce visible effects in 2 to 4 weeks. Content improvements take 3 to 6 months to climb in results. SEO is a marathon, not a sprint — everything is set up in 20 minutes, then you wait several months.`,
        },
      },
      {
        question: {
          fr: $localize`:@@formations.audit-seo-diy.faq.2.q.fr:Faut-il refaire un audit chaque mois ?`,
          en: $localize`:@@formations.audit-seo-diy.faq.2.q.en:Should I redo the audit every month?`,
        },
        answer: {
          fr: $localize`:@@formations.audit-seo-diy.faq.2.a.fr:Non. Un audit complet tous les 6 mois suffit pour une petite entreprise qui ne change pas beaucoup de pages. Entre deux, un check mensuel de 20 minutes sur Google Search Console detecte les problemes qui apparaissent (pages qui sortent de l'index, erreurs 404).`,
          en: $localize`:@@formations.audit-seo-diy.faq.2.a.en:No. A full audit every 6 months is enough for a small business that doesn't change many pages. In between, a monthly 20-minute check on Google Search Console detects emerging problems (pages leaving the index, 404 errors).`,
        },
      },
      {
        question: {
          fr: $localize`:@@formations.audit-seo-diy.faq.3.q.fr:Le SEO marche-t-il encore en 2026 avec l'essor des IA ?`,
          en: $localize`:@@formations.audit-seo-diy.faq.3.q.en:Does SEO still work in 2026 with the rise of AI?`,
        },
        answer: {
          fr: $localize`:@@formations.audit-seo-diy.faq.3.a.fr:Oui, plus que jamais. Les IA (ChatGPT Search, Perplexity, Google AI Overview) citent preferentiellement les sites bien optimises. Le SEO 2026 se compose de deux piliers : le SEO classique (Google) et l'AEO (reponses prelevees par les IA). Cette formation couvre les deux.`,
          en: $localize`:@@formations.audit-seo-diy.faq.3.a.en:Yes, more than ever. AIs (ChatGPT Search, Perplexity, Google AI Overview) preferentially cite well-optimised sites. 2026 SEO rests on two pillars: classic SEO (Google) and AEO (answers extracted by AIs). This training covers both.`,
        },
      },
      {
        question: {
          fr: $localize`:@@formations.audit-seo-diy.faq.4.q.fr:Quand un audit DIY n'est-il plus suffisant ?`,
          en: $localize`:@@formations.audit-seo-diy.faq.4.q.en:When is a DIY audit no longer enough?`,
        },
        answer: {
          fr: $localize`:@@formations.audit-seo-diy.faq.4.a.fr:Quatre situations demandent un pro : chute brutale de trafic (> 30% sur un mois), migration de site prevue, site e-commerce de plus de 500 pages, concurrence agressive sur des mots-cles a fort chiffre d'affaires. Dans ces cas, la profondeur d'analyse et la strategie concurrentielle depassent le DIY.`,
          en: $localize`:@@formations.audit-seo-diy.faq.4.a.en:Four situations require a professional: sudden traffic drop (> 30% in a month), planned site migration, e-commerce site with over 500 pages, aggressive competition on high-revenue keywords. In these cases, analysis depth and competitive strategy go beyond DIY.`,
        },
      },
      {
        question: {
          fr: $localize`:@@formations.audit-seo-diy.faq.5.q.fr:Dois-je payer un outil comme Semrush ou Ahrefs ?`,
          en: $localize`:@@formations.audit-seo-diy.faq.5.q.en:Should I pay for a tool like Semrush or Ahrefs?`,
        },
        answer: {
          fr: $localize`:@@formations.audit-seo-diy.faq.5.a.fr:Pour une petite entreprise avec moins de 10 000 visites par mois, non. Les 5 outils gratuits presentes (Google Search Console, PageSpeed, SEO Meta in 1 Click, Bing Webmaster, Ahrefs Webmaster Tools) couvrent 90% des besoins. Les SaaS payants deviennent utiles pour l'analyse concurrentielle approfondie.`,
          en: $localize`:@@formations.audit-seo-diy.faq.5.a.en:For a small business with fewer than 10,000 monthly visits, no. The 5 free tools covered (Google Search Console, PageSpeed, SEO Meta in 1 Click, Bing Webmaster, Ahrefs Webmaster Tools) cover 90% of needs. Paid SaaS become useful for deep competitive analysis.`,
        },
      },
    ],
  },
  conversion: {
    primary: {
      labelKey: "formations.audit-seo-diy.conversion.primary.label",
      href: "/formations/audit-seo-diy/toolkit",
      trackingId: "audit-seo-diy-primary-toolkit",
    },
    secondary: {
      labelKey: "formations.audit-seo-diy.conversion.secondary.label",
      href: "/growth-audit",
      trackingId: "audit-seo-diy-secondary-growth-audit",
    },
  },
  analytics: {
    eventPrefix: "formation_audit_seo_diy_",
    trackProgress: true,
    trackInteractions: true,
  },
};
