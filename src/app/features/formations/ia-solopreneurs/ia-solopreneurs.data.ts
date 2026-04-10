import type {
  Act,
  PresentationSlide,
} from "../../../shared/models/slide.model";

// ============================================================
// 4 blocs narratifs — restructuration V2 (avril 2026)
// Accrocher → Montrer → Pratiquer → Ancrer
// ============================================================

const BLOCS = {
  accrocher: { id: "bloc-1", label: "Accrocher" } satisfies Act,
  montrer: { id: "bloc-2", label: "Montrer" } satisfies Act,
  pratiquer: { id: "bloc-3", label: "Pratiquer" } satisfies Act,
  ancrer: { id: "bloc-4", label: "Ancrer" } satisfies Act,
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
    imageAlt: "Main de robot interagissant avec un réseau neuronal lumineux",
    title: "L'IA au service des solopreneurs",
    subtitle: "16 outils, 30 minutes, on trie le bullshit du vraiment utile",
    speakerNotes:
      "Sondage à main levée : « Qui utilise déjà ChatGPT ? Et Claude ou Gemini ? » — calibrer le niveau du groupe.",
    authorNote:
      "L'accroche doit poser le cadre sans promesse. On est là pour faire le tri, pas pour vendre du rêve.",
  },
  {
    id: "probleme",
    act: BLOCS.accrocher,
    fragmentCount: 3,
    layout: "stats",
    title: "Le constat : l'IA avance, avec ou sans vous",
    stats: [
      {
        value: "88%",
        label: "des organisations utilisent déjà l'IA",
        source: "McKinsey, 2025",
      },
      {
        value: "72%",
        label: "utilisent l'IA générative (vs 33% un an avant)",
        source: "McKinsey, 2025",
      },
      {
        value: "+760%",
        label: "de tâches IA sur Zapier en 2 ans",
        source: "Zapier Blog, 2025",
      },
    ],
    speakerNotes:
      "Question au public : « Qui passe plus de 3h par jour sur des tâches qu'un outil pourrait faire ? »",
    sources: [
      {
        label: "McKinsey — The State of AI 2025",
        url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
      },
      {
        label: "Zapier — AI in Business",
        url: "https://zapier.com/blog/ai-business/",
      },
    ],
    authorNote:
      "Stat originale '127$/h vs 31$/h' non retrouvée dans les rapports McKinsey. Remplacée par les stats macro vérifiables. Le ratio 4x est possiblement Upwork (freelancers IA gagnent +44%).",
  },
  {
    id: "promesse",
    act: BLOCS.accrocher,
    fragmentCount: 0,
    layout: "hero",
    imageUrl:
      "https://images.pexels.com/photos/10401267/pexels-photo-10401267.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Intervenant donnant une présentation dynamique sur scène",
    title: "Ce qu'on va faire ensemble",
    subtitle:
      "1. Tour d'horizon des outils qui comptent — 2. Ce qui marche vraiment au quotidien — 3. Un exercice pratique, vous repartez avec un résultat",
    speakerNotes:
      "Annoncer la structure en 3 blocs. Rassurer : c'est pratique, pas un cours magistral.",
  },
  {
    id: "contexte-marche",
    act: BLOCS.accrocher,
    fragmentCount: 4,
    layout: "split",
    visibility: "scrollOnly",
    title: "Contexte : le marché IA en avril 2026",
    bullets: [
      "ChatGPT : 900M d'utilisateurs hebdo, 50M d'abonnés payants (OpenAI, fév. 2026)",
      "Anthropic (Claude) : 30Md$ ARR, a dépassé OpenAI (25Md$) pour la première fois (avril 2026)",
      "Le marché des agents IA passe de 7,8Md$ à 52,6Md$ d'ici 2030 (Gartner)",
      "68% des PME US utilisent l'IA (QuickBooks, 2 200 PME)",
    ],
    sources: [
      {
        label: "TechCrunch — ChatGPT 900M weekly users",
        url: "https://techcrunch.com/2026/02/27/chatgpt-reaches-900m-weekly-active-users/",
      },
      {
        label: "The AI Corner — Anthropic 30B ARR",
        url: "https://www.the-ai-corner.com/p/anthropic-30b-arr-passed-openai-revenue-2026",
      },
      {
        label: "QuickBooks — AI statistics for SMB",
        url: "https://colorwhistle.com/artificial-intelligence-statistics-for-small-business/",
      },
    ],
    authorNote:
      "Cette slide donne le contexte macro pour ceux qui lisent en async. En présentation, les chiffres clés sont déjà dans la slide problème.",
  },

  // ── BLOC 2 — MONTRER (~12 min, 7 both + 2 scrollOnly) ───

  {
    id: "culture-apprendre",
    act: BLOCS.montrer,
    fragmentCount: 3,
    layout: "split",
    imageUrl:
      "https://images.pexels.com/photos/33923596/pexels-photo-33923596.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Enregistrement podcast avec microphone professionnel en studio",
    title: "Apprenez plus vite que vos concurrents",
    subtitle: "Votre veille passe de 3h à 20 min",
    bullets: [
      "NotebookLM — Uploadez un PDF, récupérez un podcast de 10 min avec deux voix IA qui l'analysent. Par Google, gratuit. Mode interactif : interrompez les hosts pour poser vos questions.",
      "Perplexity — Moteur de recherche IA. 100M+ utilisateurs/mois. Réponses sourcées avec citations, pas de liens bleus à trier. Gratuit ou 20$/mois.",
      "Fathom — Notes de réunion automatiques sur Zoom/Meet/Teams. Transcription + résumé + actions. 5 résumés IA/mois en gratuit, 19$/mois pour l'illimité.",
    ],
    notes:
      "NotebookLM : tourne sur Gemini 3, mode interactif « raise your hand » (2026), Cinematic Video Overviews. Perplexity : valorisé 21Md$ (Series E, 2026). Fathom : attention, le gratuit est limité à 5 résumés IA — au-delà c'est 19$/mois.",
    sources: [
      { label: "NotebookLM", url: "https://notebooklm.google" },
      {
        label: "Perplexity AI stats",
        url: "https://www.getpanto.ai/blog/perplexity-ai-statistics",
      },
      { label: "Fathom Pricing", url: "https://www.fathom.ai/pricing" },
    ],
    speakerNotes:
      "Démo live NotebookLM si le temps le permet : uploader un PDF, lancer un Deep Dive. Le podcast sera prêt dans ~47 secondes.",
  },
  {
    id: "chat-produire",
    act: BLOCS.montrer,
    fragmentCount: 3,
    layout: "comparison",
    imageUrl:
      "https://images.pexels.com/photos/16544949/pexels-photo-16544949.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Personne utilisant ChatGPT sur un ordinateur portable",
    title: "ChatGPT, Claude, Gemini — lequel ouvrir en premier",
    subtitle:
      "Chaque IA a sa force. Les pros utilisent la bonne pour la bonne tâche.",
    table: {
      headers: ["", "ChatGPT", "Claude", "Gemini"],
      rows: [
        [
          "Force",
          "Polyvalent, 900M users/sem, GPT Store",
          "N°1 rédaction, 1M tokens de contexte",
          "Branché sur Google Workspace, analyse vidéo",
        ],
        [
          "Idéal pour",
          "Brainstorm, code, analyse de données",
          "Rédaction pro, contrats, docs longs",
          "Gmail, Drive, Agenda, résumé vidéo",
        ],
        [
          "Prix",
          "Gratuit / 20$/mois (Plus)",
          "Gratuit / 20$/mois (Pro)",
          "Gratuit / 20$/mois (Pro)",
        ],
      ],
    },
    notes:
      "ChatGPT (OpenAI) : valorisé 852Md$, IPO visée fin 2026. Claude (Anthropic) : 30Md$ ARR, a dépassé OpenAI en CA — en dépensant 4x moins en entraînement. Fenêtre de contexte 1M tokens GA depuis mars 2026. Gemini (Google) : intégré dans Workspace, seul à analyser la vidéo nativement.",
    sources: [
      {
        label: "OpenAI — 852Md$ valuation (Bloomberg)",
        url: "https://www.bloomberg.com/news/articles/2026-03-31/openai-valued-at-852-billion",
      },
      {
        label: "Anthropic 30Md$ ARR (SaaStr)",
        url: "https://www.saastr.com/anthropic-just-passed-openai-in-revenue-while-spending-4x-less-to-train-their-models/",
      },
      {
        label: "Claude 1M context GA",
        url: "https://medium.com/@ivankolodiy/claudes-1m-context-window-is-finally-here",
      },
    ],
    authorNote:
      "Ne pas entrer dans la guerre des modèles. Le message : les 3 sont bons, utilisez celui qui colle à votre tâche. Pour le public B, insister sur Gemini/Workspace.",
  },
  {
    id: "creer",
    act: BLOCS.montrer,
    fragmentCount: 3,
    layout: "split",
    imageUrl:
      "https://images.pexels.com/photos/4348404/pexels-photo-4348404.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Espace de travail créatif avec laptop et calligraphie",
    title: "Du contenu pro en 10× moins de temps",
    bullets: [
      "Ideogram — Génération d'images avec du texte lisible dedans. Aucun autre outil ne fait ça aussi bien. Gratuit (10 prompts/jour).",
      "Gamma — 70M d'utilisateurs. Tapez un prompt, récupérez une présentation complète en moins d'une minute. Gamma Agent restructure et donne du feedback design. Gratuit pour démarrer, 10$/mois.",
      "ElevenLabs — Clonage vocal ultra-réaliste. Valorisé 11Md$. Votre voix dans 29 langues. Gratuit (10 min) puis 5$/mois.",
    ],
    notes:
      "Ideogram 3.0 : Style References (jusqu'à 3 images), photoréalisme amélioré. Gamma : levée de 68M$ (a16z), 600K abonnés payants. ElevenLabs : Series D 500M$ (Sequoia, a16z), 330M$ ARR fin 2025.",
    sources: [
      {
        label: "Ideogram 3.0",
        url: "https://ideogram.ai/features/3.0",
      },
      {
        label: "Gamma revenue (Sacra)",
        url: "https://sacra.com/c/gamma/",
      },
      {
        label: "ElevenLabs Series D (TechCrunch)",
        url: "https://techcrunch.com/2026/02/04/elevenlabs-raises-500m-from-sequioia-at-a-11-billion-valuation/",
      },
    ],
    speakerNotes:
      "Montrer un exemple Ideogram avec du texte parfait vs un fail Midjourney/DALL-E sur du texte. Le contraste est parlant.",
  },
  {
    id: "automatiser",
    act: BLOCS.montrer,
    fragmentCount: 3,
    layout: "comparison",
    imageUrl:
      "https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt:
      "Suivi multi-écrans avec smartphone et ordinateur, données en temps réel",
    title: "Les tâches que vous faites encore à la main",
    subtitle: "+760% de tâches IA sur Zapier en 2 ans",
    table: {
      headers: ["Outil", "Difficulté", "Prix", "En une phrase"],
      rows: [
        [
          "Zapier",
          "Facile",
          "Gratuit (100 tâches/mois)",
          "Branchez deux apps en 5 min, ça tourne tout seul",
        ],
        [
          "Make.com",
          "Moyen",
          "9€/mois (10K opérations)",
          "Plus flexible que Zapier, scénarios visuels complexes",
        ],
        [
          "n8n",
          "Avancé",
          "Gratuit (self-hosted)",
          "Open source, illimité, valorisé 2,5Md$ — pour ceux qui aiment bidouiller",
        ],
      ],
    },
    notes:
      "Zapier : 3M+ utilisateurs, 100K+ clients payants. Make : 3,1M utilisateurs, 52,6M$ CA. n8n : 230K utilisateurs actifs, 3000 clients entreprise, Series C 180M$. Différence clé : 1 action Zapier = 1 tâche, 1 étape Make = 1 opération. À 10K opérations/mois, Make est 2x moins cher.",
    sources: [
      { label: "Zapier Pricing", url: "https://zapier.com/pricing" },
      {
        label: "Make.com Revenue (GetLatka)",
        url: "https://getlatka.com/companies/make.com",
      },
      {
        label: "n8n Series C (TechFundingNews)",
        url: "https://techfundingnews.com/n8n-raises-180m-series-c-2-5-billion-valuation-automation-ai/",
      },
    ],
    speakerNotes:
      "Workflow concret : 'Un formulaire est rempli → email personnalisé + fiche Notion + rappel calendrier. Temps de setup : 2h. Temps humain ensuite : 0.' Pour l'audience A, mentionner n8n self-hosted + MCP.",
  },
  {
    id: "site-web",
    act: BLOCS.montrer,
    fragmentCount: 3,
    layout: "split",
    imageUrl:
      "https://images.pexels.com/photos/326513/pexels-photo-326513.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt:
      "Espace de travail avec double écran montrant des maquettes de design",
    title: "Votre site en ligne ce soir, sans une ligne de code",
    bullets: [
      "Lovable — Du prompt au site full-stack. 8M d'utilisateurs, valorisé 6,6Md$. Gratuit (50 actions IA/jour).",
      "Bolt.new — Même concept, tout dans le navigateur. Frontend, backend, déploiement. 25$/mois.",
      "v0 — Par Vercel. Génère du React/Next.js/Tailwind. Plus technique, plus propre. Gratuit (5$ de crédits/mois) puis 20$/mois.",
    ],
    notes:
      "Lovable : Series B 330M$, 100K+ projets/jour. Bolt : import Figma, modèle Opus 4.6 intégré. v0 : intégration Git, éditeur de code (fév. 2026). Ces outils ne remplacent pas un dev pour un projet complexe, mais pour une landing page ou un MVP c'est suffisant.",
    sources: [
      {
        label: "Lovable stats (GetPanto)",
        url: "https://www.getpanto.ai/blog/lovable-statistics",
      },
      { label: "Bolt.new Pricing", url: "https://bolt.new/pricing" },
      {
        label: "v0 Guide 2026 (NxCode)",
        url: "https://www.nxcode.io/resources/news/v0-by-vercel-complete-guide-2026",
      },
    ],
    speakerNotes:
      "Pour l'audience B : insister sur Lovable (le plus simple). Pour l'audience A : montrer v0 et le code généré, c'est impressionnant.",
    authorNote:
      "Ne pas survendre. Ces outils font des landing pages et des MVPs. Pour un vrai produit, il faut un dev. Mais pour un solopreneur qui veut tester une idée, c'est game-changer.",
  },
  {
    id: "clients",
    act: BLOCS.montrer,
    fragmentCount: 4,
    layout: "grid",
    imageUrl:
      "https://images.pexels.com/photos/2528118/pexels-photo-2528118.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Bureau minimaliste avec MacBook et iPad, outils numériques",
    title: "Prospecter → Convertir → Fidéliser",
    subtitle: "Le cycle client complet, 4 outils, 29€/mois",
    gridItems: [
      {
        title: "Waalaxy",
        description:
          "Prospection LinkedIn automatisée. 300 invitations/mois, follow-up auto, détection de réponses.",
        badge: "Prospecter — 19€/mois",
      },
      {
        title: "Notion AI",
        description:
          "CRM léger + pipeline visuel + agents custom qui bossent sur votre workspace 24/7.",
        badge: "Convertir — 10$/mois",
      },
      {
        title: "Brevo",
        description:
          "Email marketing IA, français, RGPD-friendly. Séquences automatisées. 300 emails/jour gratuits.",
        badge: "Fidéliser — Gratuit",
      },
      {
        title: "Canva AI",
        description:
          "Visuels pro pour vos emails, posts, newsletters. 220M+ d'utilisateurs. Le design sans designer.",
        badge: "Communiquer — Gratuit",
      },
    ],
    notes:
      "Workflow complet : Prospect répond sur LinkedIn (Waalaxy) → ajout auto dans Notion → Brevo envoie la séquence d'onboarding → visuels Canva. Via Zapier ou Make en connecteur. Coût total : ~29€/mois. Waalaxy : essai 14 jours. Notion Business (20$/mois) pour l'IA complète. Brevo (ex-Sendinblue) : entreprise française, conforme RGPD.",
    sources: [
      { label: "Waalaxy Pricing", url: "https://www.waalaxy.com/pricing" },
      { label: "Notion AI Pricing", url: "https://www.notion.com/pricing" },
      { label: "Brevo", url: "https://www.brevo.com" },
      {
        label: "Canva Users (Backlinko)",
        url: "https://backlinko.com/canva-users",
      },
    ],
    speakerNotes:
      "Montrer le schéma Waalaxy → Notion → Brevo → Canva. Insister : le combo Brevo + Zapier/Make transforme des emails manuels en séquences automatiques.",
  },
  {
    id: "stack-budget",
    act: BLOCS.montrer,
    fragmentCount: 3,
    layout: "comparison",
    imageUrl:
      "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt:
      "Équipe collaborant autour d'une table avec laptops et smartphones",
    title: "0€, 60€ ou 120€/mois : votre stack sur mesure",
    table: {
      headers: ["Niveau", "Outils", "Budget"],
      rows: [
        [
          "Débutant",
          "ChatGPT gratuit + Canva gratuit + Gamma + Zapier (100 tâches) + Brevo + NotebookLM",
          "0€/mois",
        ],
        [
          "Intermédiaire",
          "ChatGPT Plus (20$) + Canva Pro (15$) + Make (9€) + Notion AI (10$) + Perplexity Pro (20$)",
          "~60€/mois",
        ],
        [
          "Avancé",
          "Claude Pro (20$) + ChatGPT Plus (20$) + Make Pro (16€) + ElevenLabs (22$) + Fathom (19$) + Waalaxy (19€)",
          "~120€/mois",
        ],
      ],
    },
    bullets: [
      "Commencez par 2-3 outils, maîtrisez-les. Le stack à 0€ couvre 80% des besoins.",
    ],
    notes:
      "Ne pas tout installer d'un coup. Chaque outil doit résoudre un problème concret. L'objectif n'est pas d'avoir le stack le plus gros mais le plus efficace.",
    sources: [
      {
        label:
          "Prix vérifiés avril 2026 — voir slides individuelles pour chaque outil",
        url: "",
      },
    ],
    authorNote:
      "Les prix changent souvent. Vérifier avant chaque présentation. Les liens vers les pages pricing sont dans les sources de chaque slide outil.",
  },
  {
    id: "outils-detail",
    act: BLOCS.montrer,
    fragmentCount: 0,
    layout: "comparison",
    visibility: "scrollOnly",
    title: "Tableau récap : les 16 outils en un coup d'œil",
    table: {
      headers: ["Outil", "Catégorie", "Prix", "En une phrase"],
      rows: [
        ["NotebookLM", "Apprendre", "Gratuit", "PDF → podcast en 47 secondes"],
        [
          "Perplexity",
          "Apprendre",
          "Gratuit / 20$/mois",
          "Recherche IA sourcée, 100M+ users/mois",
        ],
        [
          "Fathom",
          "Apprendre",
          "Gratuit (limité) / 19$/mois",
          "Notes de réunion automatiques",
        ],
        [
          "ChatGPT",
          "Produire",
          "Gratuit / 20$/mois",
          "Le couteau suisse, 900M users/semaine",
        ],
        [
          "Claude",
          "Produire",
          "Gratuit / 20$/mois",
          "N°1 rédaction, 1M tokens de contexte",
        ],
        [
          "Gemini",
          "Produire",
          "Gratuit / 20$/mois",
          "Branché Google Workspace, analyse vidéo",
        ],
        [
          "Ideogram",
          "Créer",
          "Gratuit (10/jour)",
          "Images avec texte lisible, imbattable",
        ],
        [
          "Gamma",
          "Créer",
          "Gratuit / 10$/mois",
          "Présentation complète en 60 secondes",
        ],
        [
          "ElevenLabs",
          "Créer",
          "Gratuit / 5$/mois",
          "Clonage vocal, 11Md$ valorisation",
        ],
        [
          "Zapier",
          "Automatiser",
          "Gratuit (100 tâches)",
          "Branchez deux apps en 5 min",
        ],
        [
          "Make.com",
          "Automatiser",
          "9€/mois",
          "Scénarios visuels, 10K opérations",
        ],
        [
          "n8n",
          "Automatiser",
          "Gratuit (self-hosted)",
          "Open source, illimité, pour les bidouilleurs",
        ],
        ["Waalaxy", "Clients", "19€/mois", "Prospection LinkedIn automatisée"],
        ["Notion AI", "Clients", "10$/mois", "CRM léger + agents custom"],
        [
          "Brevo",
          "Clients",
          "Gratuit (300/jour)",
          "Email marketing IA, français, RGPD",
        ],
        [
          "Canva AI",
          "Clients",
          "Gratuit / 15$/mois",
          "Visuels pro, 220M+ utilisateurs",
        ],
      ],
    },
    authorNote:
      "Ce tableau est le cheat sheet de la formation. Il résume tout le bloc 2 pour ceux qui consultent en scroll.",
  },
  {
    id: "workflows-detail",
    act: BLOCS.montrer,
    fragmentCount: 0,
    layout: "grid",
    visibility: "scrollOnly",
    title: "3 workflows à mettre en place cette semaine",
    gridItems: [
      {
        title: "Prospection automatisée",
        description:
          "Waalaxy capte le lead LinkedIn → Zapier/Make crée la fiche Notion → Brevo envoie l'email de bienvenue → Rappel calendrier auto",
        badge: "Make + Brevo",
      },
      {
        title: "Contenu multicanal",
        description:
          "Post LinkedIn rédigé avec Claude → visuel Canva AI → Zapier reposte sur X + archive dans Google Sheet + notification Slack",
        badge: "Zapier + Claude",
      },
      {
        title: "Veille automatique",
        description:
          "Perplexity recherche quotidienne sur votre secteur → résumé dans Notion → NotebookLM génère un brief audio de 5 min",
        badge: "Perplexity + NotebookLM",
      },
    ],
    notes:
      "Workflow 1 : ~2h de setup, gratuit avec Zapier. Workflow 2 : 100% automatisable. Workflow 3 : nécessite Perplexity Pro (20$/mois) pour les recherches automatisées.",
    authorNote:
      "Ces workflows sont les exemples les plus concrets de la formation. En scroll, ils servent de guide pas-à-pas pour ceux qui veulent implémenter après la présentation.",
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
    imageAlt: "Intervenant donnant une présentation dynamique sur scène",
    title: "Stop. On pratique.",
    subtitle:
      "Tout ce que je viens de dire ne vaut rien si vous ne le testez pas.",
    speakerNotes:
      "Pause. Laisser le silence. Puis : « On le fait. Maintenant. Ensemble. » Transition vers l'exercice interactif.",
    authorNote:
      "Cette slide n'existe qu'en présentation. En scroll, on passe directement à l'exercice.",
  },
  {
    id: "demo-gamma",
    act: BLOCS.pratiquer,
    fragmentCount: 0,
    layout: "demo",
    title: "À vous — générez votre pitch de vente",
    subtitle: "Tapez votre secteur, copiez le prompt, collez-le dans Gamma.app",
    promptTemplate: {
      label: "Votre secteur d'activité",
      placeholder:
        "ex: Coach sportif, Photographe, Consultant RH, Fleuriste...",
      template:
        "Tu es un consultant marketing expert en création d'offres pour les indépendants.\n\nMon secteur d'activité : {{sector}}\n\nCrée une présentation de vente complète et professionnelle avec :\n\n1. **Nom de l'offre** — Un nom accrocheur et mémorable\n2. **Promesse principale** — Une phrase qui résume la transformation client\n3. **3 bénéfices clés** — Ce que le client obtient concrètement\n4. **Structure de l'offre** — Les étapes ou modules inclus\n5. **Preuve sociale** — Un témoignage fictif mais réaliste\n6. **Tarif suggéré** — Avec ancrage de prix (valeur perçue vs prix réel)\n7. **Call-to-action** — Une phrase de clôture qui pousse à l'action\n8. **FAQ** — 3 objections courantes avec réponses\n\nStyle : professionnel, chaleureux, orienté résultats.\nFormat : présentation Gamma avec sections visuelles distinctes.",
    },
    notes:
      "gamma.app — gratuit pour démarrer. Le prompt est conçu pour Gamma Agent (v3.0) qui peut chercher sur le web et restructurer le contenu. En 60 secondes vous avez un deck de 10 slides.",
    sources: [{ label: "Gamma.app", url: "https://gamma.app" }],
    speakerNotes:
      "En live : demander à un participant son secteur, taper en direct, copier le prompt, ouvrir gamma.app et coller. Le résultat sort en ~60 secondes — c'est le moment wow de la présentation.",
  },
  {
    id: "recap-8020",
    act: BLOCS.pratiquer,
    fragmentCount: 3,
    layout: "stats",
    title: "Ce que l'IA change — et ce qu'elle ne change pas",
    stats: [
      {
        value: "80%",
        label: "du travail opérationnel accéléré par l'IA",
      },
      {
        value: "20%",
        label: "d'expertise humaine qui fait la différence",
      },
      {
        value: "0€",
        label: "pour démarrer avec un stack complet",
      },
    ],
    notes:
      "L'IA accélère le contenu, les visuels, les automatisations, le support. Elle ne remplace pas la connaissance du marché, la relation client, la stratégie. Le message central : l'IA amplifie votre expertise, elle ne la remplace pas.",
    speakerNotes:
      "Insister : les 20% d'expertise humaine, c'est ce que VOUS apportez. L'IA sans votre connaissance métier produit du contenu générique. Avec, elle produit du contenu expert.",
  },

  // ── BLOC 4 — ANCRER (~4 min, 3 both + 1 presentOnly + 1 scrollOnly)

  {
    id: "pieges",
    act: BLOCS.ancrer,
    fragmentCount: 3,
    layout: "grid",
    title: "Les 3 pièges à éviter",
    gridItems: [
      {
        title: "Hallucinations",
        description:
          "L'IA invente des faits avec assurance. Vérifiez toujours les chiffres, les citations, les liens. Perplexity aide — il cite ses sources.",
        badge: "Vérifiez",
      },
      {
        title: "RGPD",
        description:
          "Ne mettez JAMAIS de données personnelles clients dans un prompt. Pas de noms, pas d'emails, pas de numéros. Les conditions d'utilisation vous le disent.",
        badge: "Protégez",
      },
      {
        title: "Dépendance",
        description:
          "L'IA amplifie votre expertise, elle ne la remplace pas. Si vous ne savez pas écrire un bon brief, ChatGPT ne le saura pas pour vous.",
        badge: "Gardez le contrôle",
      },
    ],
    notes:
      "Ces 3 pièges sont les plus fréquents chez les débutants. Les mentionner renforce la crédibilité et différencie des formations 'l'IA c'est magique' sur YouTube.",
    authorNote:
      "Cette slide est cruciale pour la crédibilité auprès de l'audience A (tech). Sans elle, on ressemble à un vendeur de rêve.",
  },
  {
    id: "citation",
    act: BLOCS.ancrer,
    fragmentCount: 2,
    layout: "quote",
    imageUrl:
      "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Main de robot interagissant avec un réseau neuronal lumineux",
    title: "Le mot de la fin",
    quote: "L'IA génère du contenu. Un expert génère des résultats.",
    quoteAuthor: "— La règle d'or du solopreneur en 2026",
  },
  {
    id: "cta",
    act: BLOCS.ancrer,
    fragmentCount: 0,
    layout: "cta",
    imageUrl:
      "https://images.pexels.com/photos/7433848/pexels-photo-7433848.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Réunion de conseil professionnelle dans un bureau moderne",
    title: "Recevez la boîte à outils complète",
    subtitle:
      "16 outils, les prix, les liens, les budgets — dans votre inbox en 30 secondes.",
    bullets: [
      "Le tableau récap des 16 outils avec liens directs",
      "3 workflows prêts à copier (Zapier/Make)",
      "Le prompt Gamma personnalisé",
    ],
    notes:
      "QR code vers le formulaire de capture email. Le PDF est généré automatiquement (backend NestJS + PDFKit). C'est le lead magnet principal de la formation.",
    speakerNotes:
      "Afficher le QR code, laisser 30 secondes. « Scannez, tapez votre email, vous recevez tout ce qu'on a vu aujourd'hui en PDF. »",
  },
  {
    id: "one-more-thing",
    act: BLOCS.ancrer,
    fragmentCount: 4,
    layout: "split",
    visibility: "presentOnly",
    imageUrl:
      "https://images.pexels.com/photos/33923596/pexels-photo-33923596.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Enregistrement podcast avec microphone professionnel en studio",
    title: "Une dernière chose...",
    subtitle: "NotebookLM — votre PDF devient un podcast avec deux hosts IA",
    bullets: [
      "Uploadez n'importe quel document",
      "47 secondes plus tard : un podcast de 10 min, deux voix naturelles",
      "Mode interactif : interrompez les hosts pour poser vos questions",
      "Nouveau 2026 : Cinematic Video Overviews — vos docs deviennent des vidéos",
    ],
    notes:
      "notebooklm.google — gratuit. Tourne sur Gemini 3. Cinematic Video réservé aux abonnés Google AI Ultra (250$/mois) mais le podcast est 100% gratuit.",
    speakerNotes:
      "Si le temps le permet, lancer la démo live. Sinon, montrer le podcast généré en début de session. C'est le 'One More Thing' à la Steve Jobs — finir sur un wow.",
    authorNote:
      "Cette slide n'existe qu'en mode présentation. En scroll, NotebookLM est déjà couvert dans le bloc Culture/Apprendre.",
  },
  {
    id: "sources-biblio",
    act: BLOCS.ancrer,
    fragmentCount: 0,
    layout: "split",
    visibility: "scrollOnly",
    title: "Sources et bibliographie",
    bullets: [
      "McKinsey — 'The State of AI in early 2025', enquête 1 993 participants, 105 pays",
      "Zapier — 'AI in Business Statistics', 2025",
      "Upwork — '2025 In-Demand Skills', janvier 2025",
      "QuickBooks — Enquête 2 200 PME US, 2024-2025",
      "Gartner — 'Strategic Technology Trends 2026'",
    ],
    sources: [
      {
        label: "McKinsey — The State of AI",
        url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
      },
      {
        label: "Zapier — AI in Business",
        url: "https://zapier.com/blog/ai-business/",
      },
      {
        label: "Upwork — In-Demand Skills",
        url: "https://investors.upwork.com/news-releases/news-release-details/upwork-unveils-2025s-most-demand-skills",
      },
      {
        label: "Gartner — AI agents 2026",
        url: "https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026",
      },
    ],
    authorNote:
      "Toutes les statistiques de cette présentation sont vérifiées avec des sources primaires (avril 2026). Les prix des outils changent régulièrement — vérifier les pages pricing avant chaque présentation.",
  },
];
