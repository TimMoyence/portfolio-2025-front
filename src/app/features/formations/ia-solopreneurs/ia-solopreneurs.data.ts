import type { Slide } from "../../../shared/models/slide.model";

export const IA_SOLOPRENEURS_SLIDES: Slide[] = [
  {
    id: "accroche",
    layout: "hero",
    imageUrl:
      "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Main de robot interagissant avec un réseau neuronal lumineux",
    title: "L'IA au service des solopreneurs",
    subtitle:
      "88% des organisations utilisent l'IA. 72% utilisent l'IA générative. Vous êtes prêt ?",
  },
  {
    id: "stats-cles",
    layout: "stats",
    title: "Les chiffres qui comptent",
    stats: [
      {
        value: "88%",
        label: "des organisations utilisent l'IA",
        source: "McKinsey, 2025",
      },
      {
        value: "72%",
        label: "utilisent l'IA générative (vs 33% en 2024)",
        source: "McKinsey, 2025",
      },
      {
        value: "+40%",
        label: "de productivité pour les adopteurs",
        source: "McKinsey, 2024",
      },
      {
        value: "12-18h",
        label: "économisées par semaine en moyenne",
        source: "Zapier, 2025",
      },
    ],
    notes:
      "Sources : McKinsey « The state of AI in early 2025 » (nov. 2025). McKinsey « A new future of work » (mai 2024). Zapier « State of AI » (2025) — 68% des PME US utilisent l'IA, économie de 12-18h/semaine.",
  },
  {
    id: "trois-cerveaux",
    layout: "comparison",
    imageUrl:
      "https://images.pexels.com/photos/16544949/pexels-photo-16544949.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Personne utilisant ChatGPT sur un ordinateur portable",
    title: "ChatGPT vs Claude vs Gemini",
    subtitle:
      "Chaque IA a ses forces — les pros utilisent la bonne pour chaque tâche",
    table: {
      headers: ["", "ChatGPT", "Claude", "Gemini"],
      rows: [
        [
          "Force",
          "Polyvalent, plugins, GPT Store",
          "Rédaction, docs longs (200K tokens)",
          "Google Workspace, analyse vidéo",
        ],
        [
          "Idéal pour",
          "Brainstorm, code, analyse de données",
          "Rédaction pro, contrats, stratégie",
          "Gmail, Drive, Agenda, vidéo",
        ],
        ["Prix", "20€/mois (Plus)", "20€/mois (Pro)", "20€/mois ou gratuit"],
      ],
    },
    notes:
      "ChatGPT (OpenAI) : le plus utilisé, vaste écosystème. Claude (Anthropic) : n°1 rédaction business, 200K tokens. Gemini (Google) : seul à analyser la vidéo nativement.",
  },
  {
    id: "contenu-texte",
    layout: "split",
    imageUrl:
      "https://images.pexels.com/photos/4348404/pexels-photo-4348404.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Espace de travail créatif avec laptop et calligraphie",
    title: "Créer du contenu — Texte & Copywriting",
    bullets: [
      "ChatGPT / Claude — Articles, posts LinkedIn, emails clients, fiches produit",
      "Astuce : ne jamais publier un texte IA brut",
      "Donner son STYLE, ses EXEMPLES, son CONTEXTE → résultat personnel",
    ],
    notes:
      "La clé : fournir 2-3 exemples de votre style dans le prompt, préciser le contexte (audience, ton), toujours relire et personnaliser.",
  },
  {
    id: "contenu-visuel",
    layout: "split",
    imageUrl:
      "https://images.pexels.com/photos/4348401/pexels-photo-4348401.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Créatrice travaillant sur laptop et tablette graphique",
    title: "Créer du contenu — Visuel & Design",
    bullets: [
      "Canva AI (gratuit) — Génération d'images, suppression de fond, resize multi-format",
      "Ideogram (10 images/jour gratuites) — Champion du texte dans les images (95% de précision)",
      "Midjourney (10€/mois) — Photos réalistes, ambiances de marque premium",
    ],
    table: {
      headers: ["Outil", "Texte dans image", "Prix", "Meilleur pour"],
      rows: [
        ["Canva AI", "Moyen", "Gratuit", "Tout-en-un, réseaux sociaux"],
        [
          "Ideogram",
          "95% précision",
          "Gratuit (10/jour)",
          "Logos, affiches, visuels avec slogan",
        ],
        ["Midjourney", "~40%", "10€/mois", "Photos réalistes, branding"],
      ],
    },
    notes:
      "Ideogram écrase Midjourney sur le texte (95% vs 40%). Les pros utilisent les deux.",
  },
  {
    id: "contenu-video",
    layout: "split",
    imageUrl:
      "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt:
      "Visage avec projection de code numérique, concept de production digitale",
    title: "Créer du contenu — Vidéo & Audio",
    bullets: [
      "Descript — Éditer une vidéo comme un document Word. Économie : 10-15h/semaine",
      "Opus Clip — Découpe un long format en shorts viraux automatiquement",
      "ElevenLabs — Clonage vocal IA, voix off réalistes, valorisé 11 milliards",
      "Synthesia — Vidéos avec avatar IA (formation, onboarding, tutos clients)",
    ],
    notes:
      "Descript : plus gros gain documenté, 10-15h/sem. ElevenLabs : $500M levés en fév. 2026, $11Md valorisation, 1M+ créateurs. Clonage vocal en 2 min d'audio.",
  },
  {
    id: "contenu-presentations",
    layout: "split",
    imageUrl:
      "https://images.pexels.com/photos/326513/pexels-photo-326513.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt:
      "Espace de travail avec double écran montrant des maquettes de design",
    title: "Présentations en 60 secondes",
    bullets: [
      "Gamma.app — 70 millions d'utilisateurs, valorisé 2,1 milliards",
      "Tapez un prompt, obtenez une présentation complète en moins d'une minute",
      "Gamma Agent — recherche sur le web, restructure et donne du feedback design",
      "Gratuit pour démarrer, 10€/mois en premium",
    ],
    notes:
      "Gamma a levé 68M$ (a16z). Le Gamma Agent (v3.0) peut chercher sur le web et restructurer le contenu.",
  },
  {
    id: "automatiser-overview",
    layout: "comparison",
    imageUrl:
      "https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt:
      "Suivi multi-écrans avec smartphone et ordinateur, données en temps réel",
    title: "Automatiser — l'IA qui agit à votre place",
    subtitle: "+760% de tâches IA sur Zapier en 2 ans",
    table: {
      headers: ["Outil", "Difficulté", "Prix", "Exemple"],
      rows: [
        [
          "Zapier",
          "Facile",
          "Gratuit (100 tâches)",
          "Lead → email → CRM automatique",
        ],
        [
          "Make.com",
          "Moyen",
          "9€/mois",
          "Post LinkedIn → repost X + archivage",
        ],
        [
          "n8n",
          "Avancé",
          "Gratuit (self-hosted)",
          "Email → IA trie et pré-rédige",
        ],
      ],
    },
    notes:
      "Zapier : +760% tâches IA en 2 ans. 68% des PME US utilisent l'IA. Économie moyenne 12-18h/semaine. ROI en 1-3 mois.",
  },
  {
    id: "automatiser-exemples",
    layout: "grid",
    imageUrl:
      "https://images.pexels.com/photos/574069/pexels-photo-574069.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Code CSS affiché sur un écran de laptop, développement web",
    title: "3 automatisations concrètes",
    gridItems: [
      {
        title: "Prospection auto",
        description:
          "Formulaire contact → email personnalisé + fiche Notion + rappel calendrier",
        badge: "Make.com",
      },
      {
        title: "Contenu multicanal",
        description:
          "Post LinkedIn → repost Twitter + archivage Sheet + notification",
        badge: "Zapier",
      },
      {
        title: "Réponse IA",
        description:
          "Email devis reçu → IA analyse, catégorise, pré-rédige la réponse",
        badge: "n8n + Claude",
      },
    ],
    notes:
      "Workflow 1 : ~2h de setup. Workflow 2 : 100% gratuit. Workflow 3 : catégorisation automatique urgent/standard/spam.",
  },
  {
    id: "business-productivite",
    layout: "grid",
    imageUrl:
      "https://images.pexels.com/photos/2528118/pexels-photo-2528118.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Bureau minimaliste avec MacBook et iPad, outils numériques",
    title: "Productivité au quotidien",
    gridItems: [
      {
        title: "Notion AI",
        description:
          "Notes, base de données, wiki, gestion de projet — avec IA intégrée",
        badge: "Gratuit+",
      },
      {
        title: "Perplexity",
        description:
          "Moteur de recherche IA, 100M+ users/mois. Réponses sourcées, pas de liens",
        badge: "20€/mois",
      },
      {
        title: "Microsoft Copilot",
        description:
          "IA dans Word, Excel, PowerPoint, Outlook — en langage naturel",
        badge: "30€/mois",
      },
      {
        title: "Tidio",
        description: "Chatbot IA sur votre site, répond 24/7, plug-and-play",
        badge: "Gratuit+",
      },
    ],
    notes:
      "Perplexity : 100M+ users mensuels, shift vers les agents IA, +50% de revenus. Remplace Google pour la recherche sourcée.",
  },
  {
    id: "business-crm",
    layout: "split",
    imageUrl:
      "https://images.pexels.com/photos/7988219/pexels-photo-7988219.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Réunion professionnelle dans un bureau moderne",
    title: "Email & Relation client",
    bullets: [
      "Alfred — Lit vos emails, priorise, rédige dans votre style, extrait les tâches",
      "Waalaxy — Automatisation LinkedIn + email, séquences multicanales, populaire en France",
      "ActiveCampaign — CRM + email marketing + séquences (lead → case study → tag 'chaud')",
      "Crisp AI — Référence française du support client IA, centralise les échanges",
    ],
    notes:
      "Crisp AI : référence française, centralise échanges, automatise les réponses fréquentes. Waalaxy : très populaire chez les freelances français.",
  },
  {
    id: "site-sans-coder",
    layout: "comparison",
    imageUrl:
      "https://images.pexels.com/photos/196658/pexels-photo-196658.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt:
      "Poste de travail avec double écran iMac, design et développement",
    title: "Du prompt au site web en 5 minutes",
    subtitle: "La révolution no-code de 2026",
    table: {
      headers: ["Outil", "Force", "Prix"],
      rows: [
        [
          "Lovable",
          "Full-stack (app + BDD) — 6,6Md valorisation",
          "Gratuit limité, 20€/mois",
        ],
        ["Bolt.new", "Prototype rapide dans le navigateur", "Gratuit limité"],
        [
          "v0.app",
          "Composants UI pro-grade (Next.js, Vercel)",
          "Gratuit limité",
        ],
        ["Figma Sites", "Design to website sans code", "Gratuit limité"],
      ],
    },
    notes:
      "Lovable : 200M€ ARR, 6,6Md valorisation. Figma Sites : nouveau, intègre IA pour design → publication directe.",
  },
  {
    id: "boite-a-outils",
    layout: "comparison",
    imageUrl:
      "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt:
      "Équipe collaborant autour d'une table avec laptops et smartphones",
    title: "Le stack idéal selon votre budget",
    table: {
      headers: ["Niveau", "Outils", "Budget"],
      rows: [
        [
          "Débutant",
          "ChatGPT gratuit + Canva gratuit + Gamma + Zapier",
          "0€/mois",
        ],
        [
          "Intermédiaire",
          "ChatGPT Pro + Canva Pro + Make.com + Notion AI + Perplexity",
          "~60€/mois",
        ],
        [
          "Avancé",
          "Claude Pro + ChatGPT Pro + Make.com + ElevenLabs + Descript",
          "~120€/mois",
        ],
      ],
    },
    bullets: [
      "Commencez par 2-3 outils, maîtrisez-les, puis ajoutez selon vos besoins",
    ],
    notes:
      "Ne pas tout installer d'un coup. Chaque outil doit résoudre un problème concret. Le stack débutant à 0€ couvre 80% des besoins.",
  },
  {
    id: "transition-pratique",
    layout: "hero",
    imageUrl:
      "https://images.pexels.com/photos/10401267/pexels-photo-10401267.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Intervenant donnant une présentation dynamique sur scène",
    title: "Démonstration en direct",
    subtitle: "Deux outils. Deux minutes. Un résultat concret.",
  },
  {
    id: "demo-notebooklm",
    layout: "split",
    imageUrl:
      "https://images.pexels.com/photos/33923596/pexels-photo-33923596.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Enregistrement podcast avec microphone professionnel en studio",
    title: "NotebookLM — Votre contenu devient un podcast",
    subtitle:
      "Uploadez n'importe quel document, NotebookLM génère une discussion audio de 10 minutes",
    bullets: [
      "Gratuit, par Google — propulsé par Gemini",
      "Deux voix IA naturelles analysent et discutent votre contenu",
      "Formats : Deep Dive, Briefing, Critique ou Débat",
      "Nouveau (2026) : mode interactif — interrompez les hosts pour vos questions",
    ],
    notes:
      "notebooklm.google — gratuit. Mode interactif « raise your hand » (2026). Depuis mars 2026, tourne sur Gemini 3.",
  },
  {
    id: "demo-gamma-prompt",
    layout: "demo",
    title: "Votre tour — Générez votre pitch de vente",
    subtitle: "Tapez votre secteur, copiez le prompt, collez-le dans Gamma.app",
    promptTemplate: {
      label: "Votre secteur d'activité",
      placeholder:
        "ex: Coach sportif, Photographe, Consultant RH, Fleuriste...",
      template:
        "Tu es un consultant marketing expert en création d'offres pour les indépendants.\n\nMon secteur d'activité : {{sector}}\n\nCrée une présentation de vente complète et professionnelle avec :\n\n1. **Nom de l'offre** — Un nom accrocheur et mémorable\n2. **Promesse principale** — Une phrase qui résume la transformation client\n3. **3 bénéfices clés** — Ce que le client obtient concrètement\n4. **Structure de l'offre** — Les étapes ou modules inclus\n5. **Preuve sociale** — Un témoignage fictif mais réaliste\n6. **Tarif suggéré** — Avec ancrage de prix (valeur perçue vs prix réel)\n7. **Call-to-action** — Une phrase de clôture qui pousse à l'action\n8. **FAQ** — 3 objections courantes avec réponses\n\nStyle : professionnel, chaleureux, orienté résultats.\nFormat : présentation Gamma avec sections visuelles distinctes.",
    },
    notes:
      "En live : demander à un participant son secteur, taper en direct, copier le prompt, ouvrir gamma.app et coller.",
  },
  {
    id: "quote-recap",
    layout: "quote",
    imageUrl:
      "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Main de robot interagissant avec un réseau neuronal lumineux",
    title: "Le mot de la fin",
    quote: "L'IA génère du contenu. Un expert génère des résultats.",
    quoteAuthor: "— La règle d'or du solopreneur en 2026",
  },
  {
    id: "recap-stats",
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
      "L'IA accélère le contenu, les visuels, les automatisations, le support. Elle ne remplace pas la connaissance du marché, la relation client, la stratégie.",
  },
  {
    id: "cta",
    layout: "cta",
    imageUrl:
      "https://images.pexels.com/photos/7433848/pexels-photo-7433848.jpeg?auto=compress&cs=tinysrgb&w=800",
    imageAlt: "Réunion de conseil professionnelle dans un bureau moderne",
    title: "Recevez votre boite a outils IA",
    subtitle:
      "Les meilleurs outils, les prix, les budgets recommandes — dans votre inbox en 30 secondes.",
    bullets: [
      "14 outils IA tries sur le volet, avec liens et prix",
      "3 niveaux de budget : 0€, 50€ et 100€/mois",
      "Pret a imprimer, 1 page cheat sheet",
    ],
    notes:
      "Liens outils : ChatGPT (chat.openai.com), Claude (claude.ai), Gemini (gemini.google.com), Canva (canva.com), Ideogram (ideogram.ai), Gamma (gamma.app), Descript (descript.com), ElevenLabs (elevenlabs.io), Perplexity (perplexity.ai), Zapier (zapier.com), Make (make.com), n8n (n8n.io), Notion (notion.so), Lovable (lovable.dev), Bolt (bolt.new), v0 (v0.app), NotebookLM (notebooklm.google), Crisp (crisp.chat), Figma Sites (figma.com)",
  },
];
