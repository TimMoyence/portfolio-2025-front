import type { FormationConfig } from "../shared/formation.types";
import { AUTOMATISER_AVEC_IA_SLIDES } from "./automatiser-avec-ia.slides.data";

/**
 * Configuration de la formation "Automatiser avec l'IA".
 *
 * Cible : entrepreneurs non-technique, TPE, solopreneurs qui veulent
 * gagner du temps sans apprendre a coder. Le contenu evite tout jargon
 * tech — api, webhook, terminal sont bannis. Les 5 workflows montres
 * sont derives de pratique reelle (asilidesign + clients testes).
 */
export const automatiserAvecIaFormation: FormationConfig = {
  configVersion: 1,
  slug: "automatiser-avec-ia",
  metadata: {
    title: {
      fr: $localize`:@@formations.automatiser-avec-ia.metadata.title.fr:Automatiser avec l'IA — 5 workflows pour entrepreneurs non-tech`,
      en: $localize`:@@formations.automatiser-avec-ia.metadata.title.en:Automate with AI — 5 workflows for non-technical entrepreneurs`,
    },
    description: {
      fr: $localize`:@@formations.automatiser-avec-ia.metadata.description.fr:Formation gratuite de 25 minutes pour entrepreneurs, artisans et solopreneurs qui veulent gagner deux heures par semaine grace a l'intelligence artificielle sans ecrire une ligne de code. On y decouvre cinq workflows testes en conditions reelles : generation de devis en trois minutes, reponses emails recurrentes, publications reseaux sociaux planifiees, extraction de donnees de factures, veille hebdomadaire automatique. Chaque workflow montre le prompt exact, les pieges a eviter, la checklist de relecture avant envoi client. Le format est pense pour les profils non-techniques : aucune api, aucun webhook, aucun abonnement paye requis pour demarrer. Les outils utilises sont ChatGPT, Perplexity, Buffer et Google Docs dans leur version gratuite.`,
      en: $localize`:@@formations.automatiser-avec-ia.metadata.description.en:Free 25-minute training for entrepreneurs, craftspeople and solopreneurs who want to save two hours per week with AI without writing a line of code. Five workflows tested in real conditions: quote generation in three minutes, recurring email replies, scheduled social media posts, invoice data extraction, automated weekly monitoring. Each workflow shows the exact prompt, pitfalls to avoid, pre-send review checklist. The format targets non-technical profiles: no API, no webhook, no paid subscription required to start. Tools used are ChatGPT, Perplexity, Buffer and Google Docs in their free versions.`,
    },
    tagline: {
      fr: $localize`:@@formations.automatiser-avec-ia.metadata.tagline.fr:5 workflows testes, 25 minutes, zero ligne de code — on gagne 2h par semaine.`,
      en: $localize`:@@formations.automatiser-avec-ia.metadata.tagline.en:5 tested workflows, 25 minutes, zero code — 2 hours saved weekly.`,
    },
    duration: "PT25M",
    level: "beginner",
    category: "automation",
    tags: [
      "automatiser taches ia entrepreneur",
      "workflows ia sans coder",
      "gagner temps ia pme",
      "outils ia entrepreneur gratuit",
    ],
    iconSlug: "sparkles",
    // TODO(S2-og-images) : rapatrier sur public/assets/images/formations/
    heroImage:
      "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200",
    heroImageAlt: {
      fr: $localize`:@@formations.automatiser-avec-ia.metadata.heroImageAlt.fr:Entrepreneur concentre devant son ordinateur illustrant l'automatisation intelligente pour professionnels non-techniques`,
      en: $localize`:@@formations.automatiser-avec-ia.metadata.heroImageAlt.en:Entrepreneur focused on their computer illustrating smart automation for non-technical professionals`,
    },
    publishDate: "2026-04-21",
    lastModified: "2026-04-21",
    status: "published",
  },
  slides: AUTOMATISER_AVEC_IA_SLIDES,
  leadMagnet: {
    enabled: true,
    pdfTemplateId: "toolkit-automation-v1",
    emailDripId: "drip-auto-ia",
    customizationAxes: ["sector", "aiLevel"],
  },
  seo: {
    keywords: [
      "automatisation ia pme",
      "workflow ia entrepreneur",
      "gagner du temps solopreneur",
      "ia sans coder",
      "devis automatique ia",
      "chatgpt entrepreneur francais",
    ],
    prerequisites: [
      {
        fr: $localize`:@@formations.automatiser-avec-ia.seo.prerequisites.0.fr:Savoir utiliser un ordinateur, un navigateur recent et sa boite email. Aucun prerequis technique.`,
        en: $localize`:@@formations.automatiser-avec-ia.seo.prerequisites.0.en:Know how to use a computer, a recent browser and your email inbox. No technical prerequisites.`,
      },
    ],
    teaches: [
      {
        fr: $localize`:@@formations.automatiser-avec-ia.seo.teaches.0.fr:Identifier les 3 a 5 taches repetitives de votre activite qui meritent d'etre automatisees`,
        en: $localize`:@@formations.automatiser-avec-ia.seo.teaches.0.en:Identify the 3 to 5 repetitive tasks in your business that deserve to be automated`,
      },
      {
        fr: $localize`:@@formations.automatiser-avec-ia.seo.teaches.1.fr:Mettre en place un workflow IA complet sans coder, sans API, sans abonnement paye`,
        en: $localize`:@@formations.automatiser-avec-ia.seo.teaches.1.en:Set up a complete AI workflow without coding, without API, without paid subscription`,
      },
      {
        fr: $localize`:@@formations.automatiser-avec-ia.seo.teaches.2.fr:Securiser le processus : checklist de relecture pour eviter qu'une erreur IA parte au client`,
        en: $localize`:@@formations.automatiser-avec-ia.seo.teaches.2.en:Secure the process: review checklist to prevent AI errors from reaching your customer`,
      },
      {
        fr: $localize`:@@formations.automatiser-avec-ia.seo.teaches.3.fr:Mesurer le gain de temps reel pour decider quel workflow automatiser en priorite`,
        en: $localize`:@@formations.automatiser-avec-ia.seo.teaches.3.en:Measure real time savings to decide which workflow to automate first`,
      },
    ],
    learningResourceType: "Workshop",
    faq: [
      {
        question: {
          fr: $localize`:@@formations.automatiser-avec-ia.faq.0.q.fr:Dois-je savoir coder pour suivre cette formation ?`,
          en: $localize`:@@formations.automatiser-avec-ia.faq.0.q.en:Do I need to know how to code to follow this training?`,
        },
        answer: {
          fr: $localize`:@@formations.automatiser-avec-ia.faq.0.a.fr:Non. Zero ligne de code, zero API, zero webhook. Tous les workflows utilisent des interfaces graphiques standard : si vous savez utiliser Word et votre boite email, vous avez le niveau necessaire.`,
          en: $localize`:@@formations.automatiser-avec-ia.faq.0.a.en:No. Zero lines of code, no API, no webhook. Every workflow uses standard graphical interfaces: if you can use Word and your email inbox, you have the required level.`,
        },
      },
      {
        question: {
          fr: $localize`:@@formations.automatiser-avec-ia.faq.1.q.fr:Combien ca coute vraiment ?`,
          en: $localize`:@@formations.automatiser-avec-ia.faq.1.q.en:How much does it really cost?`,
        },
        answer: {
          fr: $localize`:@@formations.automatiser-avec-ia.faq.1.a.fr:Zero euro pour demarrer. Les cinq workflows tournent sur les versions gratuites de ChatGPT, Perplexity, Buffer et Google Docs. L'upgrade a un tarif paye se justifie seulement au-dela de 30 a 50 usages quotidiens — la formation explique quand franchir le pas.`,
          en: $localize`:@@formations.automatiser-avec-ia.faq.1.a.en:Zero euros to get started. The five workflows run on free versions of ChatGPT, Perplexity, Buffer and Google Docs. Upgrading to a paid tier only makes sense beyond 30 to 50 daily uses — the training explains when to switch.`,
        },
      },
      {
        question: {
          fr: $localize`:@@formations.automatiser-avec-ia.faq.2.q.fr:Et si l'IA se trompe sur un devis ou un email ?`,
          en: $localize`:@@formations.automatiser-avec-ia.faq.2.q.en:What if AI makes a mistake on a quote or email?`,
        },
        answer: {
          fr: $localize`:@@formations.automatiser-avec-ia.faq.2.a.fr:La regle simple : l'IA accelere, vous validez. Chaque workflow integre une etape de relecture explicite. Le toolkit contient une checklist d'une minute qui couvre les erreurs les plus frequentes (decalage de virgule, confusion de client, ton trop familier).`,
          en: $localize`:@@formations.automatiser-avec-ia.faq.2.a.en:The simple rule: AI accelerates, you validate. Every workflow includes an explicit review step. The toolkit contains a one-minute checklist covering the most common errors (decimal point shift, wrong customer, overly casual tone).`,
        },
      },
      {
        question: {
          fr: $localize`:@@formations.automatiser-avec-ia.faq.3.q.fr:Mes donnees clients sont-elles reutilisees par l'IA ?`,
          en: $localize`:@@formations.automatiser-avec-ia.faq.3.q.en:Is my customer data reused by AI?`,
        },
        answer: {
          fr: $localize`:@@formations.automatiser-avec-ia.faq.3.a.fr:Par defaut, oui sur les versions gratuites de ChatGPT. Le toolkit indique en deux captures d'ecran comment desactiver l'entrainement sur vos echanges — en deux clics dans les parametres. Les versions payantes (ChatGPT Teams, Enterprise) desactivent l'entrainement par defaut.`,
          en: $localize`:@@formations.automatiser-avec-ia.faq.3.a.en:By default, yes on free ChatGPT versions. The toolkit shows in two screenshots how to disable training on your conversations — two clicks in settings. Paid versions (ChatGPT Teams, Enterprise) disable training by default.`,
        },
      },
      {
        question: {
          fr: $localize`:@@formations.automatiser-avec-ia.faq.4.q.fr:Combien de temps faut-il pour mettre en place un workflow ?`,
          en: $localize`:@@formations.automatiser-avec-ia.faq.4.q.en:How long does it take to set up a workflow?`,
        },
        answer: {
          fr: $localize`:@@formations.automatiser-avec-ia.faq.4.a.fr:Entre 15 et 30 minutes la premiere fois, dont la moitie est de la personnalisation (vos exemples, votre ton, votre template). Ensuite, chaque usage prend moins de 3 minutes. Le retour sur investissement est mesurable des la fin de la premiere semaine.`,
          en: $localize`:@@formations.automatiser-avec-ia.faq.4.a.en:Between 15 and 30 minutes the first time, half of which is customisation (your examples, your tone, your template). Afterwards, each use takes less than 3 minutes. Return on investment is measurable within the first week.`,
        },
      },
      {
        question: {
          fr: $localize`:@@formations.automatiser-avec-ia.faq.5.q.fr:Puis-je obtenir un accompagnement personnalise ?`,
          en: $localize`:@@formations.automatiser-avec-ia.faq.5.q.en:Can I get personalised support?`,
        },
        answer: {
          fr: $localize`:@@formations.automatiser-avec-ia.faq.5.a.fr:Oui. Apres la formation vous recevez un email direct auquel vous pouvez repondre : je lis toutes les reponses et je donne un feedback gratuit sur votre premier workflow. Pour un accompagnement structure (audit + mise en place), consulter la page offre.`,
          en: $localize`:@@formations.automatiser-avec-ia.faq.5.a.en:Yes. After the training you receive a direct email you can reply to: I read every reply and give free feedback on your first workflow. For structured support (audit + setup), see the offer page.`,
        },
      },
    ],
  },
  conversion: {
    primary: {
      labelKey: "formations.automatiser-avec-ia.conversion.primary.label",
      href: "/formations/automatiser-avec-ia/toolkit",
      trackingId: "automatiser-avec-ia-primary-toolkit",
    },
  },
  analytics: {
    eventPrefix: "formation_auto_ia_",
    trackProgress: true,
    trackInteractions: true,
  },
};
