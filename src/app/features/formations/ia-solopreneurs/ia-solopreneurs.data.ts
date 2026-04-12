import type {
  Act,
  PresentationSlide,
} from "../../../shared/models/slide.model";

// ============================================================
// 4 blocs narratifs — restructuration V2 (avril 2026)
// Accrocher → Montrer → Pratiquer → Ancrer
// Chaînes utilisateur internationalisées via $localize.
// ============================================================

const BLOCS = {
  accrocher: {
    id: "bloc-1",
    label: $localize`:@@ia-solo.bloc.accrocher:Accrocher`,
  } satisfies Act,
  montrer: {
    id: "bloc-2",
    label: $localize`:@@ia-solo.bloc.montrer:Montrer`,
  } satisfies Act,
  pratiquer: {
    id: "bloc-3",
    label: $localize`:@@ia-solo.bloc.pratiquer:Pratiquer`,
  } satisfies Act,
  ancrer: {
    id: "bloc-4",
    label: $localize`:@@ia-solo.bloc.ancrer:Ancrer`,
  } satisfies Act,
};

export const IA_SOLOPRENEURS_ACTS: Act[] = [
  BLOCS.accrocher,
  BLOCS.montrer,
  BLOCS.pratiquer,
  BLOCS.ancrer,
];

export const IA_SOLOPRENEURS_SLIDES: PresentationSlide[] = [
  // ── BLOC 1 — ACCROCHER (~4 min, 3 both + 1 scrollOnly) ──

  {
    id: "accroche",
    act: BLOCS.accrocher,
    fragmentCount: 0,
    layout: "hero",
    imageUrl:
      "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: $localize`:@@ia-solo.accroche.imageAlt:Main de robot interagissant avec un réseau neuronal lumineux`,
    title: $localize`:@@ia-solo.accroche.title:L'IA au service des solopreneurs`,
    subtitle: $localize`:@@ia-solo.accroche.subtitle:16 outils, 30 minutes, on trie le bullshit du vraiment utile`,
    speakerNotes: $localize`:@@ia-solo.accroche.speakerNotes:Sondage à main levée : « Qui utilise déjà ChatGPT ? Et Claude ou Gemini ? » — calibrer le niveau du groupe.`,
    interactions: {
      present: [
        {
          type: "poll",
          question: $localize`:@@ia-solo.accroche.poll.question:Qui utilise déjà l'IA au quotidien ?`,
          options: [
            $localize`:@@ia-solo.accroche.poll.option.0:ChatGPT`,
            $localize`:@@ia-solo.accroche.poll.option.1:Claude`,
            $localize`:@@ia-solo.accroche.poll.option.2:Gemini`,
            $localize`:@@ia-solo.accroche.poll.option.3:Autre IA`,
            $localize`:@@ia-solo.accroche.poll.option.4:Aucune`,
          ],
        },
      ],
      scroll: [],
    },
  },
  {
    id: "probleme",
    act: BLOCS.accrocher,
    fragmentCount: 0,
    layout: "stats",
    title: $localize`:@@ia-solo.probleme.title:Le constat : l'IA avance, avec ou sans vous`,
    stats: [
      {
        value: "88%",
        label: $localize`:@@ia-solo.probleme.stats.0.label:des organisations utilisent déjà l'IA`,
        source: $localize`:@@ia-solo.probleme.stats.0.source:McKinsey, 2025`,
      },
      {
        value: "72%",
        label: $localize`:@@ia-solo.probleme.stats.1.label:utilisent l'IA générative (vs 33% un an avant)`,
        source: $localize`:@@ia-solo.probleme.stats.1.source:McKinsey, 2025`,
      },
      {
        value: "+760%",
        label: $localize`:@@ia-solo.probleme.stats.2.label:de tâches IA sur Zapier en 2 ans`,
        source: $localize`:@@ia-solo.probleme.stats.2.source:Zapier Blog, 2025`,
      },
    ],
    speakerNotes: $localize`:@@ia-solo.probleme.speakerNotes:Question au public : « Qui passe plus de 3h par jour sur des tâches qu'un outil pourrait faire ? »`,
    interactions: {
      scroll: [
        {
          type: "self-rating",
          question: $localize`:@@ia-solo.probleme.rating.question:Où en êtes-vous avec l'IA ?`,
          hint: $localize`:@@ia-solo.probleme.rating.hint:Votre réponse adapte le guide que vous recevrez par email.`,
          min: 1,
          max: 3,
          labels: {
            min: $localize`:@@ia-solo.probleme.rating.min:Débutant`,
            max: $localize`:@@ia-solo.probleme.rating.max:Avancé`,
          },
          profileField: "aiLevel",
        },
      ],
    },
  },
  {
    id: "promesse",
    act: BLOCS.accrocher,
    fragmentCount: 0,
    layout: "hero",
    visibility: "presentOnly",
    imageUrl:
      "https://images.pexels.com/photos/10401267/pexels-photo-10401267.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: $localize`:@@ia-solo.promesse.imageAlt:Intervenant donnant une présentation dynamique sur scène`,
    title: $localize`:@@ia-solo.promesse.title:Ce qu'on va faire ensemble`,
    subtitle: $localize`:@@ia-solo.promesse.subtitle:1. Tour d'horizon des outils qui comptent — 2. Ce qui marche vraiment au quotidien — 3. Un exercice pratique, vous repartez avec un résultat`,
    speakerNotes: $localize`:@@ia-solo.promesse.speakerNotes:Annoncer la structure en 3 blocs. Rassurer : c'est pratique, pas un cours magistral.`,
  },
  {
    id: "contexte-marche",
    act: BLOCS.accrocher,
    fragmentCount: 0,
    layout: "split",
    visibility: "scrollOnly",
    imageUrl:
      "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: $localize`:@@ia-solo.contexte-marche.imageAlt:Écran de marché boursier avec données et graphiques en temps réel`,
    title: $localize`:@@ia-solo.contexte-marche.title:Contexte : le marché IA en avril 2026`,
    bullets: [
      $localize`:@@ia-solo.contexte-marche.bullets.0:ChatGPT : 900M d'utilisateurs hebdo, 50M d'abonnés payants (OpenAI, fév. 2026)`,
      $localize`:@@ia-solo.contexte-marche.bullets.1:Anthropic (Claude) : 30Md$ ARR, a dépassé OpenAI (25Md$) pour la première fois (avril 2026)`,
      $localize`:@@ia-solo.contexte-marche.bullets.2:Le marché des agents IA passe de 7,8Md$ à 52,6Md$ d'ici 2030 (Gartner)`,
      $localize`:@@ia-solo.contexte-marche.bullets.3:68% des PME US utilisent l'IA (QuickBooks, 2 200 PME)`,
    ],
  },

  // ── BLOC 2 — MONTRER (~12 min, 7 both + 2 scrollOnly) ───

  {
    id: "culture-apprendre",
    act: BLOCS.montrer,
    fragmentCount: 0,
    layout: "split",
    imageUrl:
      "https://images.pexels.com/photos/33923596/pexels-photo-33923596.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: $localize`:@@ia-solo.culture-apprendre.imageAlt:Enregistrement podcast avec microphone professionnel en studio`,
    title: $localize`:@@ia-solo.culture-apprendre.title:Apprenez plus vite que vos concurrents`,
    subtitle: $localize`:@@ia-solo.culture-apprendre.subtitle:Votre veille passe de 3h à 20 min`,
    bullets: [
      $localize`:@@ia-solo.culture-apprendre.bullets.0:NotebookLM — Uploadez un PDF, récupérez un podcast de 10 min avec deux voix IA qui l'analysent. Par Google, gratuit. Mode interactif : interrompez les hosts pour poser vos questions.`,
      $localize`:@@ia-solo.culture-apprendre.bullets.1:Perplexity — Moteur de recherche IA. 100M+ utilisateurs/mois. Réponses sourcées avec citations, pas de liens bleus à trier. Gratuit ou 20$/mois.`,
      $localize`:@@ia-solo.culture-apprendre.bullets.2:Fathom — Notes de réunion automatiques sur Zoom/Meet/Teams. Transcription + résumé + actions. 5 résumés IA/mois en gratuit, 19$/mois pour l'illimité.`,
    ],
    notes: $localize`:@@ia-solo.culture-apprendre.notes:NotebookLM : tourne sur Gemini 3, mode interactif « raise your hand » (2026), Cinematic Video Overviews. Perplexity : valorisé 21Md$ (Series E, 2026). Fathom : attention, le gratuit est limité à 5 résumés IA — au-delà c'est 19$/mois.`,
    speakerNotes: $localize`:@@ia-solo.culture-apprendre.speakerNotes:Démo live NotebookLM si le temps le permet : uploader un PDF, lancer un Deep Dive. Le podcast sera prêt dans ~47 secondes.`,
  },
  {
    id: "chat-produire",
    act: BLOCS.montrer,
    fragmentCount: 0,
    layout: "comparison",
    imageUrl:
      "https://images.pexels.com/photos/16544949/pexels-photo-16544949.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: $localize`:@@ia-solo.chat-produire.imageAlt:Personne utilisant ChatGPT sur un ordinateur portable`,
    title: $localize`:@@ia-solo.chat-produire.title:ChatGPT, Claude, Gemini — lequel ouvrir en premier`,
    subtitle: $localize`:@@ia-solo.chat-produire.subtitle:Chaque IA a sa force. Les pros utilisent la bonne pour la bonne tâche.`,
    table: {
      headers: ["", "ChatGPT", "Claude", "Gemini"],
      rows: [
        [
          $localize`:@@ia-solo.chat-produire.table.row.0.col.0:Force`,
          $localize`:@@ia-solo.chat-produire.table.row.0.col.1:Polyvalent, 900M users/sem, GPT Store`,
          $localize`:@@ia-solo.chat-produire.table.row.0.col.2:N°1 rédaction, 1M tokens de contexte`,
          $localize`:@@ia-solo.chat-produire.table.row.0.col.3:Branché sur Google Workspace, analyse vidéo`,
        ],
        [
          $localize`:@@ia-solo.chat-produire.table.row.1.col.0:Idéal pour`,
          $localize`:@@ia-solo.chat-produire.table.row.1.col.1:Brainstorm, code, analyse de données`,
          $localize`:@@ia-solo.chat-produire.table.row.1.col.2:Rédaction pro, contrats, docs longs`,
          $localize`:@@ia-solo.chat-produire.table.row.1.col.3:Gmail, Drive, Agenda, résumé vidéo`,
        ],
        [
          $localize`:@@ia-solo.chat-produire.table.row.2.col.0:Prix`,
          $localize`:@@ia-solo.chat-produire.table.row.2.col.1:Gratuit / 20$/mois (Plus)`,
          $localize`:@@ia-solo.chat-produire.table.row.2.col.2:Gratuit / 20$/mois (Pro)`,
          $localize`:@@ia-solo.chat-produire.table.row.2.col.3:Gratuit / 20$/mois (Pro)`,
        ],
      ],
    },
    notes: $localize`:@@ia-solo.chat-produire.notes:ChatGPT (OpenAI) : valorisé 852Md$, IPO visée fin 2026. Claude (Anthropic) : 30Md$ ARR, a dépassé OpenAI en CA — en dépensant 4x moins en entraînement. Fenêtre de contexte 1M tokens GA depuis mars 2026. Gemini (Google) : intégré dans Workspace, seul à analyser la vidéo nativement.`,
  },
  {
    id: "creer",
    act: BLOCS.montrer,
    fragmentCount: 0,
    layout: "split",
    imageUrl:
      "https://images.pexels.com/photos/4348404/pexels-photo-4348404.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: $localize`:@@ia-solo.creer.imageAlt:Espace de travail créatif avec laptop et calligraphie`,
    title: $localize`:@@ia-solo.creer.title:Du contenu pro en 10× moins de temps`,
    bullets: [
      $localize`:@@ia-solo.creer.bullets.0:Ideogram — Génération d'images avec du texte lisible dedans. Aucun autre outil ne fait ça aussi bien. Gratuit (10 prompts/jour).`,
      $localize`:@@ia-solo.creer.bullets.1:Gamma — 70M d'utilisateurs. Tapez un prompt, récupérez une présentation complète en moins d'une minute. Gamma Agent restructure et donne du feedback design. Gratuit pour démarrer, 10$/mois.`,
      $localize`:@@ia-solo.creer.bullets.2:ElevenLabs — Clonage vocal ultra-réaliste. Valorisé 11Md$. Votre voix dans 29 langues. Gratuit (10 min) puis 5$/mois.`,
    ],
    notes: $localize`:@@ia-solo.creer.notes:Ideogram 3.0 : Style References (jusqu'à 3 images), photoréalisme amélioré. Gamma : levée de 68M$ (a16z), 600K abonnés payants. ElevenLabs : Series D 500M$ (Sequoia, a16z), 330M$ ARR fin 2025.`,
    speakerNotes: $localize`:@@ia-solo.creer.speakerNotes:Montrer un exemple Ideogram avec du texte parfait vs un fail Midjourney/DALL-E sur du texte. Le contraste est parlant.`,
  },
  {
    id: "automatiser",
    act: BLOCS.montrer,
    fragmentCount: 0,
    layout: "comparison",
    imageUrl:
      "https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: $localize`:@@ia-solo.automatiser.imageAlt:Suivi multi-écrans avec smartphone et ordinateur, données en temps réel`,
    title: $localize`:@@ia-solo.automatiser.title:Les tâches que vous faites encore à la main`,
    subtitle: $localize`:@@ia-solo.automatiser.subtitle:+760% de tâches IA sur Zapier en 2 ans`,
    table: {
      headers: [
        $localize`:@@ia-solo.automatiser.table.header.0:Outil`,
        $localize`:@@ia-solo.automatiser.table.header.1:Difficulté`,
        $localize`:@@ia-solo.automatiser.table.header.2:Prix`,
        $localize`:@@ia-solo.automatiser.table.header.3:En une phrase`,
      ],
      rows: [
        [
          "Zapier",
          $localize`:@@ia-solo.automatiser.table.row.0.col.1:Facile`,
          $localize`:@@ia-solo.automatiser.table.row.0.col.2:Gratuit (100 tâches/mois)`,
          $localize`:@@ia-solo.automatiser.table.row.0.col.3:Branchez deux apps en 5 min, ça tourne tout seul`,
        ],
        [
          "Make.com",
          $localize`:@@ia-solo.automatiser.table.row.1.col.1:Moyen`,
          $localize`:@@ia-solo.automatiser.table.row.1.col.2:9€/mois (10K opérations)`,
          $localize`:@@ia-solo.automatiser.table.row.1.col.3:Plus flexible que Zapier, scénarios visuels complexes`,
        ],
        [
          "n8n",
          $localize`:@@ia-solo.automatiser.table.row.2.col.1:Avancé`,
          $localize`:@@ia-solo.automatiser.table.row.2.col.2:Gratuit (self-hosted)`,
          $localize`:@@ia-solo.automatiser.table.row.2.col.3:Open source, illimité, valorisé 2,5Md$ — pour ceux qui aiment bidouiller`,
        ],
      ],
    },
    notes: $localize`:@@ia-solo.automatiser.notes:Zapier : 3M+ utilisateurs, 100K+ clients payants. Make : 3,1M utilisateurs, 52,6M$ CA. n8n : 230K utilisateurs actifs, 3000 clients entreprise, Series C 180M$. Différence clé : 1 action Zapier = 1 tâche, 1 étape Make = 1 opération. À 10K opérations/mois, Make est 2x moins cher.`,
    speakerNotes: $localize`:@@ia-solo.automatiser.speakerNotes:Workflow concret : 'Un formulaire est rempli → email personnalisé + fiche Notion + rappel calendrier. Temps de setup : 2h. Temps humain ensuite : 0.' Pour l'audience A, mentionner n8n self-hosted + MCP.`,
  },
  {
    id: "site-web",
    act: BLOCS.montrer,
    fragmentCount: 0,
    layout: "split",
    imageUrl:
      "https://images.pexels.com/photos/326513/pexels-photo-326513.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: $localize`:@@ia-solo.site-web.imageAlt:Espace de travail avec double écran montrant des maquettes de design`,
    title: $localize`:@@ia-solo.site-web.title:Votre site en ligne ce soir, sans une ligne de code`,
    bullets: [
      $localize`:@@ia-solo.site-web.bullets.0:Lovable — Du prompt au site full-stack. 8M d'utilisateurs, valorisé 6,6Md$. Gratuit (50 actions IA/jour).`,
      $localize`:@@ia-solo.site-web.bullets.1:Bolt.new — Même concept, tout dans le navigateur. Frontend, backend, déploiement. 25$/mois.`,
      $localize`:@@ia-solo.site-web.bullets.2:v0 — Par Vercel. Génère du React/Next.js/Tailwind. Plus technique, plus propre. Gratuit (5$ de crédits/mois) puis 20$/mois.`,
    ],
    notes: $localize`:@@ia-solo.site-web.notes:Lovable : Series B 330M$, 100K+ projets/jour. Bolt : import Figma, modèle Opus 4.6 intégré. v0 : intégration Git, éditeur de code (fév. 2026). Ces outils ne remplacent pas un dev pour un projet complexe, mais pour une landing page ou un MVP c'est suffisant.`,
    speakerNotes: $localize`:@@ia-solo.site-web.speakerNotes:Pour l'audience B : insister sur Lovable (le plus simple). Pour l'audience A : montrer v0 et le code généré, c'est impressionnant.`,
  },
  {
    id: "clients",
    act: BLOCS.montrer,
    fragmentCount: 0,
    layout: "grid",
    imageUrl:
      "https://images.pexels.com/photos/2528118/pexels-photo-2528118.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: $localize`:@@ia-solo.clients.imageAlt:Bureau minimaliste avec MacBook et iPad, outils numériques`,
    title: $localize`:@@ia-solo.clients.title:Prospecter → Convertir → Fidéliser`,
    subtitle: $localize`:@@ia-solo.clients.subtitle:Le cycle client complet, 4 outils, 29€/mois`,
    gridItems: [
      {
        title: "Waalaxy",
        description: $localize`:@@ia-solo.clients.grid.0.description:Prospection LinkedIn automatisée. 300 invitations/mois, follow-up auto, détection de réponses.`,
        badge: $localize`:@@ia-solo.clients.grid.0.badge:Prospecter — 19€/mois`,
      },
      {
        title: "Notion AI",
        description: $localize`:@@ia-solo.clients.grid.1.description:CRM léger + pipeline visuel + agents custom qui bossent sur votre workspace 24/7.`,
        badge: $localize`:@@ia-solo.clients.grid.1.badge:Convertir — 10$/mois`,
      },
      {
        title: "Brevo",
        description: $localize`:@@ia-solo.clients.grid.2.description:Email marketing IA, français, RGPD-friendly. Séquences automatisées. 300 emails/jour gratuits.`,
        badge: $localize`:@@ia-solo.clients.grid.2.badge:Fidéliser — Gratuit`,
      },
      {
        title: "Canva AI",
        description: $localize`:@@ia-solo.clients.grid.3.description:Visuels pro pour vos emails, posts, newsletters. 220M+ d'utilisateurs. Le design sans designer.`,
        badge: $localize`:@@ia-solo.clients.grid.3.badge:Communiquer — Gratuit`,
      },
    ],
    notes: $localize`:@@ia-solo.clients.notes:Workflow complet : Prospect répond sur LinkedIn (Waalaxy) → ajout auto dans Notion → Brevo envoie la séquence d'onboarding → visuels Canva. Via Zapier ou Make en connecteur. Coût total : ~29€/mois. Waalaxy : essai 14 jours. Notion Business (20$/mois) pour l'IA complète. Brevo (ex-Sendinblue) : entreprise française, conforme RGPD.`,
    speakerNotes: $localize`:@@ia-solo.clients.speakerNotes:Montrer le schéma Waalaxy → Notion → Brevo → Canva. Insister : le combo Brevo + Zapier/Make transforme des emails manuels en séquences automatiques.`,
    interactions: {
      present: [
        {
          type: "poll",
          question: $localize`:@@ia-solo.clients.poll.question:Quel est votre plus gros défi client ?`,
          options: [
            $localize`:@@ia-solo.clients.poll.option.0:Trouver des prospects`,
            $localize`:@@ia-solo.clients.poll.option.1:Convertir`,
            $localize`:@@ia-solo.clients.poll.option.2:Fidéliser`,
            $localize`:@@ia-solo.clients.poll.option.3:Communiquer`,
          ],
        },
      ],
      scroll: [],
    },
  },
  {
    id: "stack-budget",
    act: BLOCS.montrer,
    fragmentCount: 0,
    layout: "comparison",
    imageUrl:
      "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: $localize`:@@ia-solo.stack-budget.imageAlt:Équipe collaborant autour d'une table avec laptops et smartphones`,
    title: $localize`:@@ia-solo.stack-budget.title:0€, 60€ ou 120€/mois : votre stack sur mesure`,
    table: {
      headers: [
        $localize`:@@ia-solo.stack-budget.table.header.0:Niveau`,
        $localize`:@@ia-solo.stack-budget.table.header.1:Outils`,
        $localize`:@@ia-solo.stack-budget.table.header.2:Budget`,
      ],
      rows: [
        [
          $localize`:@@ia-solo.stack-budget.table.row.0.col.0:Débutant`,
          $localize`:@@ia-solo.stack-budget.table.row.0.col.1:ChatGPT gratuit + Canva gratuit + Gamma + Zapier (100 tâches) + Brevo + NotebookLM`,
          $localize`:@@ia-solo.stack-budget.table.row.0.col.2:0€/mois`,
        ],
        [
          $localize`:@@ia-solo.stack-budget.table.row.1.col.0:Intermédiaire`,
          $localize`:@@ia-solo.stack-budget.table.row.1.col.1:ChatGPT Plus (20$) + Canva Pro (15$) + Make (9€) + Notion AI (10$) + Perplexity Pro (20$)`,
          $localize`:@@ia-solo.stack-budget.table.row.1.col.2:~60€/mois`,
        ],
        [
          $localize`:@@ia-solo.stack-budget.table.row.2.col.0:Avancé`,
          $localize`:@@ia-solo.stack-budget.table.row.2.col.1:Claude Pro (20$) + ChatGPT Plus (20$) + Make Pro (16€) + ElevenLabs (22$) + Fathom (19$) + Waalaxy (19€)`,
          $localize`:@@ia-solo.stack-budget.table.row.2.col.2:~120€/mois`,
        ],
      ],
    },
    bullets: [
      $localize`:@@ia-solo.stack-budget.bullets.0:Commencez par 2-3 outils, maîtrisez-les. Le stack à 0€ couvre 80% des besoins.`,
    ],
    notes: $localize`:@@ia-solo.stack-budget.notes:Ne pas tout installer d'un coup. Chaque outil doit résoudre un problème concret. L'objectif n'est pas d'avoir le stack le plus gros mais le plus efficace.`,
    interactions: {
      scroll: [
        {
          type: "self-rating",
          question: $localize`:@@ia-solo.stack-budget.rating.question:Quel budget mensuel pour vos outils IA ?`,
          hint: $localize`:@@ia-solo.stack-budget.rating.hint:On adaptera les recommandations de votre guide à votre budget.`,
          min: 1,
          max: 3,
          labels: {
            min: $localize`:@@ia-solo.stack-budget.rating.min:0€`,
            max: $localize`:@@ia-solo.stack-budget.rating.max:120€+`,
          },
          profileField: "budgetTier",
        },
      ],
    },
  },
  {
    id: "outils-detail",
    act: BLOCS.montrer,
    fragmentCount: 0,
    layout: "comparison",
    visibility: "scrollOnly",
    title: $localize`:@@ia-solo.outils-detail.title:Tableau récap : les 16 outils en un coup d'œil`,
    table: {
      headers: [
        $localize`:@@ia-solo.outils-detail.table.header.0:Outil`,
        $localize`:@@ia-solo.outils-detail.table.header.1:Catégorie`,
        $localize`:@@ia-solo.outils-detail.table.header.2:Prix`,
        $localize`:@@ia-solo.outils-detail.table.header.3:En une phrase`,
      ],
      rows: [
        [
          "NotebookLM",
          $localize`:@@ia-solo.outils-detail.cat.apprendre:Apprendre`,
          $localize`:@@ia-solo.outils-detail.row.0.price:Gratuit`,
          $localize`:@@ia-solo.outils-detail.row.0.tagline:PDF → podcast en 47 secondes`,
        ],
        [
          "Perplexity",
          $localize`:@@ia-solo.outils-detail.cat.apprendre:Apprendre`,
          $localize`:@@ia-solo.outils-detail.row.1.price:Gratuit / 20$/mois`,
          $localize`:@@ia-solo.outils-detail.row.1.tagline:Recherche IA sourcée, 100M+ users/mois`,
        ],
        [
          "Fathom",
          $localize`:@@ia-solo.outils-detail.cat.apprendre:Apprendre`,
          $localize`:@@ia-solo.outils-detail.row.2.price:Gratuit (limité) / 19$/mois`,
          $localize`:@@ia-solo.outils-detail.row.2.tagline:Notes de réunion automatiques`,
        ],
        [
          "ChatGPT",
          $localize`:@@ia-solo.outils-detail.cat.produire:Produire`,
          $localize`:@@ia-solo.outils-detail.row.3.price:Gratuit / 20$/mois`,
          $localize`:@@ia-solo.outils-detail.row.3.tagline:Le couteau suisse, 900M users/semaine`,
        ],
        [
          "Claude",
          $localize`:@@ia-solo.outils-detail.cat.produire:Produire`,
          $localize`:@@ia-solo.outils-detail.row.4.price:Gratuit / 20$/mois`,
          $localize`:@@ia-solo.outils-detail.row.4.tagline:N°1 rédaction, 1M tokens de contexte`,
        ],
        [
          "Gemini",
          $localize`:@@ia-solo.outils-detail.cat.produire:Produire`,
          $localize`:@@ia-solo.outils-detail.row.5.price:Gratuit / 20$/mois`,
          $localize`:@@ia-solo.outils-detail.row.5.tagline:Branché Google Workspace, analyse vidéo`,
        ],
        [
          "Ideogram",
          $localize`:@@ia-solo.outils-detail.cat.creer:Créer`,
          $localize`:@@ia-solo.outils-detail.row.6.price:Gratuit (10/jour)`,
          $localize`:@@ia-solo.outils-detail.row.6.tagline:Images avec texte lisible, imbattable`,
        ],
        [
          "Gamma",
          $localize`:@@ia-solo.outils-detail.cat.creer:Créer`,
          $localize`:@@ia-solo.outils-detail.row.7.price:Gratuit / 10$/mois`,
          $localize`:@@ia-solo.outils-detail.row.7.tagline:Présentation complète en 60 secondes`,
        ],
        [
          "ElevenLabs",
          $localize`:@@ia-solo.outils-detail.cat.creer:Créer`,
          $localize`:@@ia-solo.outils-detail.row.8.price:Gratuit / 5$/mois`,
          $localize`:@@ia-solo.outils-detail.row.8.tagline:Clonage vocal, 11Md$ valorisation`,
        ],
        [
          "Zapier",
          $localize`:@@ia-solo.outils-detail.cat.automatiser:Automatiser`,
          $localize`:@@ia-solo.outils-detail.row.9.price:Gratuit (100 tâches)`,
          $localize`:@@ia-solo.outils-detail.row.9.tagline:Branchez deux apps en 5 min`,
        ],
        [
          "Make.com",
          $localize`:@@ia-solo.outils-detail.cat.automatiser:Automatiser`,
          $localize`:@@ia-solo.outils-detail.row.10.price:9€/mois`,
          $localize`:@@ia-solo.outils-detail.row.10.tagline:Scénarios visuels, 10K opérations`,
        ],
        [
          "n8n",
          $localize`:@@ia-solo.outils-detail.cat.automatiser:Automatiser`,
          $localize`:@@ia-solo.outils-detail.row.11.price:Gratuit (self-hosted)`,
          $localize`:@@ia-solo.outils-detail.row.11.tagline:Open source, illimité, pour les bidouilleurs`,
        ],
        [
          "Waalaxy",
          $localize`:@@ia-solo.outils-detail.cat.clients:Clients`,
          $localize`:@@ia-solo.outils-detail.row.12.price:19€/mois`,
          $localize`:@@ia-solo.outils-detail.row.12.tagline:Prospection LinkedIn automatisée`,
        ],
        [
          "Notion AI",
          $localize`:@@ia-solo.outils-detail.cat.clients:Clients`,
          $localize`:@@ia-solo.outils-detail.row.13.price:10$/mois`,
          $localize`:@@ia-solo.outils-detail.row.13.tagline:CRM léger + agents custom`,
        ],
        [
          "Brevo",
          $localize`:@@ia-solo.outils-detail.cat.clients:Clients`,
          $localize`:@@ia-solo.outils-detail.row.14.price:Gratuit (300/jour)`,
          $localize`:@@ia-solo.outils-detail.row.14.tagline:Email marketing IA, français, RGPD`,
        ],
        [
          "Canva AI",
          $localize`:@@ia-solo.outils-detail.cat.clients:Clients`,
          $localize`:@@ia-solo.outils-detail.row.15.price:Gratuit / 15$/mois`,
          $localize`:@@ia-solo.outils-detail.row.15.tagline:Visuels pro, 220M+ utilisateurs`,
        ],
      ],
    },
    interactions: {
      scroll: [
        {
          type: "checklist",
          question: $localize`:@@ia-solo.outils-detail.checklist.question:Cochez les outils que vous connaissez déjà :`,
          hint: $localize`:@@ia-solo.outils-detail.checklist.hint:Votre guide mettra en avant ceux que vous n'avez pas encore testés.`,
          items: [
            "NotebookLM",
            "Perplexity",
            "Fathom",
            "ChatGPT",
            "Claude",
            "Gemini",
            "Ideogram",
            "Gamma",
            "ElevenLabs",
            "Zapier",
            "Make.com",
            "n8n",
            "Waalaxy",
            "Notion AI",
            "Brevo",
            "Canva AI",
          ],
          profileField: "toolsAlreadyUsed",
        },
      ],
    },
  },
  {
    id: "workflows-detail",
    act: BLOCS.montrer,
    fragmentCount: 0,
    layout: "grid",
    visibility: "scrollOnly",
    title: $localize`:@@ia-solo.workflows-detail.title:3 workflows à mettre en place cette semaine`,
    gridItems: [
      {
        title: $localize`:@@ia-solo.workflows-detail.grid.0.title:Prospection automatisée`,
        description: $localize`:@@ia-solo.workflows-detail.grid.0.description:Waalaxy capte le lead LinkedIn → Zapier/Make crée la fiche Notion → Brevo envoie l'email de bienvenue → Rappel calendrier auto`,
        badge: $localize`:@@ia-solo.workflows-detail.grid.0.badge:Make + Brevo`,
      },
      {
        title: $localize`:@@ia-solo.workflows-detail.grid.1.title:Contenu multicanal`,
        description: $localize`:@@ia-solo.workflows-detail.grid.1.description:Post LinkedIn rédigé avec Claude → visuel Canva AI → Zapier reposte sur X + archive dans Google Sheet + notification Slack`,
        badge: $localize`:@@ia-solo.workflows-detail.grid.1.badge:Zapier + Claude`,
      },
      {
        title: $localize`:@@ia-solo.workflows-detail.grid.2.title:Veille automatique`,
        description: $localize`:@@ia-solo.workflows-detail.grid.2.description:Perplexity recherche quotidienne sur votre secteur → résumé dans Notion → NotebookLM génère un brief audio de 5 min`,
        badge: $localize`:@@ia-solo.workflows-detail.grid.2.badge:Perplexity + NotebookLM`,
      },
    ],
    notes: $localize`:@@ia-solo.workflows-detail.notes:Workflow 1 : ~2h de setup, gratuit avec Zapier. Workflow 2 : 100% automatisable. Workflow 3 : nécessite Perplexity Pro (20$/mois) pour les recherches automatisées.`,
  },

  // ── BLOC 3 — PRATIQUER (~10 min, 2 both + 1 presentOnly) ─

  {
    id: "transition-pratique",
    act: BLOCS.pratiquer,
    fragmentCount: 0,
    layout: "hero",
    visibility: "presentOnly",
    imageUrl:
      "https://images.pexels.com/photos/10401267/pexels-photo-10401267.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: $localize`:@@ia-solo.promesse.imageAlt:Intervenant donnant une présentation dynamique sur scène`,
    title: $localize`:@@ia-solo.transition-pratique.title:Stop. On pratique.`,
    subtitle: $localize`:@@ia-solo.transition-pratique.subtitle:Tout ce que je viens de dire ne vaut rien si vous ne le testez pas.`,
    speakerNotes: $localize`:@@ia-solo.transition-pratique.speakerNotes:Pause. Laisser le silence. Puis : « On le fait. Maintenant. Ensemble. » Transition vers l'exercice interactif.`,
    interactions: {
      present: [
        {
          type: "countdown",
          label: $localize`:@@ia-solo.transition-pratique.countdown.label:Pensez à votre secteur d'activité...`,
          durationSeconds: 10,
        },
      ],
    },
  },
  {
    id: "demo-gamma",
    act: BLOCS.pratiquer,
    fragmentCount: 0,
    layout: "demo",
    title: $localize`:@@ia-solo.demo-gamma.title:À vous — générez votre pitch de vente`,
    subtitle: $localize`:@@ia-solo.demo-gamma.subtitle:Tapez votre secteur, copiez le prompt, collez-le dans Gamma.app`,
    promptTemplate: {
      label: $localize`:@@ia-solo.demo-gamma.prompt.label:Votre secteur d'activité`,
      placeholder: $localize`:@@ia-solo.demo-gamma.prompt.placeholder:ex: Coach sportif, Photographe, Consultant RH, Fleuriste...`,
      template: $localize`:@@ia-solo.demo-gamma.prompt.template:Tu es un consultant marketing expert en création d'offres pour les indépendants.\n\nMon secteur d'activité : {{sector}}\n\nCrée une présentation de vente complète et professionnelle avec :\n\n1. **Nom de l'offre** — Un nom accrocheur et mémorable\n2. **Promesse principale** — Une phrase qui résume la transformation client\n3. **3 bénéfices clés** — Ce que le client obtient concrètement\n4. **Structure de l'offre** — Les étapes ou modules inclus\n5. **Preuve sociale** — Un témoignage fictif mais réaliste\n6. **Tarif suggéré** — Avec ancrage de prix (valeur perçue vs prix réel)\n7. **Call-to-action** — Une phrase de clôture qui pousse à l'action\n8. **FAQ** — 3 objections courantes avec réponses\n\nStyle : professionnel, chaleureux, orienté résultats.\nFormat : présentation Gamma avec sections visuelles distinctes.`,
    },
    notes: $localize`:@@ia-solo.demo-gamma.notes:gamma.app — gratuit pour démarrer. Le prompt est conçu pour Gamma Agent (v3.0) qui peut chercher sur le web et restructurer le contenu. En 60 secondes vous avez un deck de 10 slides.`,
    speakerNotes: $localize`:@@ia-solo.demo-gamma.speakerNotes:En live : demander à un participant son secteur, taper en direct, copier le prompt, ouvrir gamma.app et coller. Le résultat sort en ~60 secondes — c'est le moment wow de la présentation.`,
  },
  {
    id: "recap-8020",
    act: BLOCS.pratiquer,
    fragmentCount: 0,
    layout: "stats",
    title: $localize`:@@ia-solo.recap-8020.title:Ce que l'IA change — et ce qu'elle ne change pas`,
    stats: [
      {
        value: "16",
        label: $localize`:@@ia-solo.recap-8020.stats.0.label:outils testés et comparés`,
      },
      {
        value: "80%",
        label: $localize`:@@ia-solo.recap-8020.stats.1.label:du travail opérationnel accéléré par l'IA`,
      },
      {
        value: "20%",
        label: $localize`:@@ia-solo.recap-8020.stats.2.label:d'expertise humaine qui fait la différence`,
      },
      {
        value: "0€",
        label: $localize`:@@ia-solo.recap-8020.stats.3.label:pour démarrer avec un stack complet`,
      },
    ],
    notes: $localize`:@@ia-solo.recap-8020.notes:L'IA accélère le contenu, les visuels, les automatisations, le support. Elle ne remplace pas la connaissance du marché, la relation client, la stratégie. Le message central : l'IA amplifie votre expertise, elle ne la remplace pas.`,
    speakerNotes: $localize`:@@ia-solo.recap-8020.speakerNotes:Insister : les 20% d'expertise humaine, c'est ce que VOUS apportez. L'IA sans votre connaissance métier produit du contenu générique. Avec, elle produit du contenu expert.`,
    interactions: {
      present: [
        {
          type: "poll",
          question: $localize`:@@ia-solo.recap-8020.poll.question:Quel outil allez-vous tester en premier ?`,
          options: [
            $localize`:@@ia-solo.recap-8020.poll.option.0:ChatGPT/Claude`,
            $localize`:@@ia-solo.recap-8020.poll.option.1:Gamma`,
            $localize`:@@ia-solo.recap-8020.poll.option.2:Zapier/Make`,
            $localize`:@@ia-solo.recap-8020.poll.option.3:NotebookLM`,
            $localize`:@@ia-solo.recap-8020.poll.option.4:Autre`,
          ],
        },
      ],
      scroll: [],
    },
  },

  // ── BLOC 4 — ANCRER (~4 min, 3 both + 1 presentOnly + 1 scrollOnly)

  {
    id: "pieges",
    act: BLOCS.ancrer,
    fragmentCount: 0,
    layout: "grid",
    title: $localize`:@@ia-solo.pieges.title:Les 3 pièges à éviter`,
    gridItems: [
      {
        title: $localize`:@@ia-solo.pieges.grid.0.title:Hallucinations`,
        description: $localize`:@@ia-solo.pieges.grid.0.description:L'IA invente des faits avec assurance. Vérifiez toujours les chiffres, les citations, les liens. Perplexity aide — il cite ses sources.`,
        badge: $localize`:@@ia-solo.pieges.grid.0.badge:Vérifiez`,
      },
      {
        title: $localize`:@@ia-solo.pieges.grid.1.title:RGPD`,
        description: $localize`:@@ia-solo.pieges.grid.1.description:Ne mettez JAMAIS de données personnelles clients dans un prompt. Pas de noms, pas d'emails, pas de numéros. Les conditions d'utilisation vous le disent.`,
        badge: $localize`:@@ia-solo.pieges.grid.1.badge:Protégez`,
      },
      {
        title: $localize`:@@ia-solo.pieges.grid.2.title:Dépendance`,
        description: $localize`:@@ia-solo.pieges.grid.2.description:L'IA amplifie votre expertise, elle ne la remplace pas. Si vous ne savez pas écrire un bon brief, ChatGPT ne le saura pas pour vous.`,
        badge: $localize`:@@ia-solo.pieges.grid.2.badge:Gardez le contrôle`,
      },
    ],
    notes: $localize`:@@ia-solo.pieges.notes:Ces 3 pièges sont les plus fréquents chez les débutants. Les mentionner renforce la crédibilité et différencie des formations 'l'IA c'est magique' sur YouTube.`,
  },
  {
    id: "citation",
    act: BLOCS.ancrer,
    fragmentCount: 0,
    layout: "quote",
    imageUrl:
      "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: $localize`:@@ia-solo.accroche.imageAlt:Main de robot interagissant avec un réseau neuronal lumineux`,
    title: $localize`:@@ia-solo.citation.title:Le mot de la fin`,
    quote: $localize`:@@ia-solo.citation.quote:L'IA génère du contenu. Un expert génère des résultats.`,
    quoteAuthor: $localize`:@@ia-solo.citation.author:— La règle d'or du solopreneur en 2026`,
  },
  {
    id: "cta",
    act: BLOCS.ancrer,
    fragmentCount: 0,
    layout: "cta",
    imageUrl:
      "https://images.pexels.com/photos/7433848/pexels-photo-7433848.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: $localize`:@@ia-solo.cta.imageAlt:Réunion de conseil professionnelle dans un bureau moderne`,
    title: $localize`:@@ia-solo.cta.title:Recevez votre guide IA personnalisé`,
    subtitle: $localize`:@@ia-solo.cta.subtitle:Prompts, workflows et templates adaptés à votre profil — dans votre inbox en 30 secondes.`,
    bullets: [
      $localize`:@@ia-solo.cta.bullets.0:Cheatsheet de décision : quel outil pour quelle tâche`,
      $localize`:@@ia-solo.cta.bullets.1:Prompts prêts à copier adaptés à votre niveau`,
      $localize`:@@ia-solo.cta.bullets.2:3 workflows pas-à-pas (Zapier/Make) + templates`,
    ],
    notes: $localize`:@@ia-solo.cta.notes:QR code vers le formulaire de capture email. Le PDF est généré automatiquement (backend NestJS + PDFKit). C'est le lead magnet principal de la formation.`,
    speakerNotes: $localize`:@@ia-solo.cta.speakerNotes:Afficher le QR code, laisser 30 secondes. « Scannez, tapez votre email, vous recevez tout ce qu'on a vu aujourd'hui en PDF. »`,
  },
  {
    id: "one-more-thing",
    act: BLOCS.ancrer,
    fragmentCount: 0,
    layout: "split",
    visibility: "presentOnly",
    imageUrl:
      "https://images.pexels.com/photos/33923596/pexels-photo-33923596.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: $localize`:@@ia-solo.culture-apprendre.imageAlt:Enregistrement podcast avec microphone professionnel en studio`,
    title: $localize`:@@ia-solo.one-more-thing.title:Une dernière chose...`,
    subtitle: $localize`:@@ia-solo.one-more-thing.subtitle:NotebookLM — votre PDF devient un podcast avec deux hosts IA`,
    bullets: [
      $localize`:@@ia-solo.one-more-thing.bullets.0:Uploadez n'importe quel document`,
      $localize`:@@ia-solo.one-more-thing.bullets.1:47 secondes plus tard : un podcast de 10 min, deux voix naturelles`,
      $localize`:@@ia-solo.one-more-thing.bullets.2:Mode interactif : interrompez les hosts pour poser vos questions`,
      $localize`:@@ia-solo.one-more-thing.bullets.3:Nouveau 2026 : Cinematic Video Overviews — vos docs deviennent des vidéos`,
    ],
    notes: $localize`:@@ia-solo.one-more-thing.notes:notebooklm.google — gratuit. Tourne sur Gemini 3. Cinematic Video réservé aux abonnés Google AI Ultra (250$/mois) mais le podcast est 100% gratuit.`,
    speakerNotes: $localize`:@@ia-solo.one-more-thing.speakerNotes:Si le temps le permet, lancer la démo live. Sinon, montrer le podcast généré en début de session. C'est le 'One More Thing' à la Steve Jobs — finir sur un wow.`,
  },
];
