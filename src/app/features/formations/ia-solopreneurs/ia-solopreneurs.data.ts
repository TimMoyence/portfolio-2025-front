import type { Slide } from "../../../shared/models/slide.model";

export const IA_SOLOPRENEURS_SLIDES: Slide[] = [
  {
    id: "accroche",
    image: "assets/images/auto_graph.png",
    title: "L'IA, accélérateur de productivité",
    subtitle:
      "Les entreprises qui adoptent l'IA gagnent 20 à 40% de productivité — McKinsey, 2025",
    bullets: [
      "88% des organisations utilisent déjà l'IA régulièrement (McKinsey, nov. 2025)",
      "L'IA générative peut automatiser 60 à 70% des tâches répétitives d'un indépendant",
      "Un stack complet d'outils IA coûte entre 0€ et 100€/mois — une fraction du coût d'un salarié",
    ],
    notes:
      "Sources : McKinsey Global Institute, « The state of AI in early 2025 » (nov. 2025) — 88% des organisations interrogées déclarent utiliser l'IA. « A new future of work » (mai 2024) — +20 à 40% de productivité. L'estimation 60-70% de tâches automatisables vient du rapport McKinsey « The economic potential of generative AI » (juin 2023).",
  },
  {
    id: "trois-cerveaux",
    image: "assets/images/smart_toy.png",
    title: "ChatGPT, Claude, Gemini — lequel choisir ?",
    subtitle:
      "Chaque IA a ses forces. Les pros utilisent la bonne pour chaque tâche.",
    table: {
      headers: ["", "ChatGPT", "Claude", "Gemini"],
      rows: [
        [
          "Force",
          "Polyvalent, plugins, GPT Store",
          "Rédaction, analyse de longs documents",
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
      "ChatGPT (OpenAI) : le plus utilisé, vaste écosystème de plugins. Claude (Anthropic) : fenêtre de 200K tokens, idéal pour les documents longs. Gemini (Google) : seul modèle capable d'analyser de la vidéo nativement. Intégration native Google Workspace. Prix comparables, le choix se fait sur le cas d'usage.",
  },
  {
    id: "contenu-creation",
    image: "assets/images/description.png",
    title: "Créer du contenu 10x plus vite",
    subtitle: "Texte, visuels et vidéos — les outils qui changent la donne",
    bullets: [
      "Texte : ChatGPT ou Claude pour les articles, posts LinkedIn, emails, fiches produit",
      "Visuel : Canva AI (gratuit) pour le tout-en-un, Ideogram pour le texte dans les images (95% de précision)",
      "Vidéo : Descript pour l'édition comme un traitement de texte, Opus Clip pour les shorts automatiques",
      "Astuce : donner son style, ses exemples, son contexte — jamais publier du texte IA brut",
    ],
    notes:
      "Canva AI : génération d'images, suppression de fond, resize multi-format — tout en gratuit. Ideogram : 10 images/jour gratuites, champion du texte dans les images vs Midjourney (95% vs 40% de précision). Descript : éditer une vidéo comme un doc Word, économie estimée à 10-15h/semaine pour les créateurs de contenu.",
  },
  {
    id: "presentations-ia",
    image: "assets/images/chart.png",
    title: "Présentations et supports en 60 secondes",
    subtitle: "Gamma.app — 70 millions d'utilisateurs, valorisé 2,1 milliards",
    bullets: [
      "Tapez un prompt, obtenez une présentation complète en moins d'une minute",
      "Export PowerPoint, Google Slides, PDF — ou partage direct par lien",
      "Nouveau : Gamma Agent recherche sur le web, restructure et donne du feedback design",
      "Gratuit pour démarrer, 10€/mois en premium",
    ],
    notes:
      "Gamma a levé 68M$ en Série B auprès d'a16z (nov. 2025). 100M€ de revenus annuels récurrents. Le Gamma Agent (3.0, 2026) peut chercher sur le web, restructurer automatiquement le contenu et fournir du feedback design en langage naturel.",
  },
  {
    id: "automatiser",
    image: "assets/images/gear.png",
    title: "Automatiser ce qui vous fait perdre du temps",
    subtitle:
      "Le vrai game-changer : l'IA qui agit à votre place pendant que vous dormez",
    table: {
      headers: ["Outil", "Difficulté", "Prix", "Exemple concret"],
      rows: [
        [
          "Zapier",
          "Facile",
          "Gratuit (100 tâches/mois)",
          "Nouveau contact → email de bienvenue → ajout CRM",
        ],
        [
          "Make.com",
          "Moyen",
          "9€/mois",
          "Post LinkedIn → repost X + archivage Sheets",
        ],
        [
          "n8n",
          "Avancé",
          "Gratuit (self-hosted)",
          "Email reçu → IA trie et pré-rédige la réponse",
        ],
      ],
    },
    notes:
      "Zapier : le plus simple, 100 tâches/mois gratuites, parfait pour démarrer. Make.com : consensus des comparatifs 2026, meilleur rapport puissance/prix pour les indépendants. n8n : open-source, gratuit en auto-hébergement, intégration native LangChain pour des agents IA custom.",
  },
  {
    id: "productivite",
    image: "assets/images/business_center.png",
    title: "Gérer son activité au quotidien",
    subtitle: "Productivité, emails, relation client — tout en un clic",
    bullets: [
      "Notion AI : notes, base de données, wiki, gestion de projet — avec IA intégrée",
      "Microsoft Copilot : IA dans Word, Excel, PowerPoint et Outlook",
      "Tidio : chatbot IA sur votre site, répond 24/7 — plug-and-play",
      "Waalaxy : automatisation LinkedIn + email, très populaire chez les freelances",
    ],
    notes:
      "Notion AI : l'outil de productivité le plus populaire chez les solopreneurs, combine notes + base de données + gestion de projet avec une couche IA. Tidio : chatbot facile à installer, idéal pour répondre aux questions fréquentes quand vous n'êtes pas disponible. Waalaxy : séquences de prospection multicanales automatisées.",
  },
  {
    id: "site-sans-coder",
    image: "assets/images/computer.png",
    title: "Du prompt au site web en 5 minutes",
    subtitle: "La révolution no-code de 2026",
    table: {
      headers: ["Outil", "Force", "Prix"],
      rows: [
        [
          "Lovable",
          "App full-stack avec base de données",
          "Gratuit limité, 20€/mois",
        ],
        ["Bolt.new", "Prototype rapide dans le navigateur", "Gratuit limité"],
        ["v0.app", "Composants UI pro (Next.js, Vercel)", "Gratuit limité"],
      ],
    },
    bullets: [
      "Parfait pour un MVP ou un prototype rapide",
      "Pour un site qui convertit, bien référencé et sécurisé — c'est là qu'un expert fait la différence",
    ],
    notes:
      "Lovable : 200M€ de revenus annuels, valorisé 6,6 milliards. Bolt.new : pas besoin de connaître React, tout dans le navigateur. v0.app (Vercel) : code Next.js de qualité professionnelle. Ces outils génèrent du code, un expert génère des résultats.",
  },
  {
    id: "boite-a-outils",
    image: "assets/images/diamond.png",
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
          "ChatGPT Pro + Canva Pro + Make.com + Notion AI",
          "~50€/mois",
        ],
        [
          "Avancé",
          "Claude Pro + ChatGPT Pro + Make.com + Descript",
          "~100€/mois",
        ],
      ],
    },
    bullets: [
      "Commencez par 2-3 outils, maîtrisez-les, puis ajoutez selon vos besoins",
    ],
    notes:
      "La règle d'or : ne pas tout installer d'un coup. Chaque outil doit résoudre un problème concret. Le stack débutant à 0€ couvre déjà 80% des besoins d'un indépendant qui démarre.",
  },
  {
    id: "transition-pratique",
    image: "assets/images/lightbulb.png",
    title: "Démonstration en direct",
    subtitle: "Deux outils, deux minutes, un résultat concret",
    bullets: [
      "On va utiliser Google NotebookLM pour transformer du contenu en podcast IA",
      "Puis un prompt Gamma pour générer une présentation de vente — adaptée à votre secteur",
      "Tout est gratuit et reproductible chez vous dès ce soir",
    ],
  },
  {
    id: "demo-notebooklm",
    image: "assets/images/biotech.png",
    title: "NotebookLM — Votre contenu devient un podcast",
    subtitle:
      "Uploadez n'importe quel document, NotebookLM génère une discussion audio de 10 minutes",
    bullets: [
      "Gratuit, par Google — propulsé par Gemini",
      "Deux voix IA naturelles analysent et discutent votre contenu",
      "Formats : Deep Dive, Briefing, Critique ou Débat",
      "Nouveau (2026) : mode interactif — interrompez les hosts pour poser vos questions",
      "Génère aussi des infographies, présentations et tableaux de données",
    ],
    notes:
      "notebooklm.google — totalement gratuit. Audio Overviews disponibles depuis sept. 2024. Le mode interactif (« raise your hand ») permet d'interrompre la discussion pour poser des questions en temps réel. Depuis mars 2026, tourne sur Gemini 3. Cas d'usage business : transformer ses articles de blog en podcasts, créer des résumés audio de rapports clients, générer du contenu formation.",
  },
  {
    id: "demo-gamma-prompt",
    image: "assets/images/reorganize.png",
    title: "À vous — Générez votre pitch de vente",
    subtitle: "Tapez votre secteur, copiez le prompt, collez-le dans Gamma.app",
    promptTemplate: {
      label: "Votre secteur d'activité",
      placeholder:
        "ex: Coach sportif, Photographe, Consultant RH, Fleuriste...",
      template:
        "Tu es un consultant marketing expert en création d'offres pour les indépendants.\n\nMon secteur d'activité : {{sector}}\n\nCrée une présentation de vente complète et professionnelle avec :\n\n1. **Nom de l'offre** — Un nom accrocheur et mémorable\n2. **Promesse principale** — Une phrase qui résume la transformation client\n3. **3 bénéfices clés** — Ce que le client obtient concrètement\n4. **Structure de l'offre** — Les étapes ou modules inclus\n5. **Preuve sociale** — Un témoignage fictif mais réaliste\n6. **Tarif suggéré** — Avec ancrage de prix (valeur perçue vs prix réel)\n7. **Call-to-action** — Une phrase de clôture qui pousse à l'action\n8. **FAQ** — 3 objections courantes avec réponses\n\nStyle : professionnel, chaleureux, orienté résultats.\nFormat : présentation Gamma avec sections visuelles distinctes.",
    },
    notes:
      "En live : demander à un participant son secteur, le taper en direct, copier le prompt, ouvrir gamma.app et coller. En 60 secondes Gamma génère une présentation de vente complète. Pour les visiteurs web : ils peuvent taper leur secteur et copier le prompt pour l'utiliser chez eux.",
  },
  {
    id: "recap",
    image: "assets/images/trending_up.png",
    title: "L'IA fait 80% du travail — l'expertise fait 80% de la différence",
    bullets: [
      "L'IA accélère : contenu, visuels, automatisations, support client",
      "L'IA ne remplace pas : votre connaissance du marché, la relation client, la stratégie",
      "Un site généré en 5 minutes ne sera jamais aussi performant qu'un site conçu par un expert",
    ],
    notes:
      "Message clé : l'IA est un accélérateur extraordinaire, mais la compréhension du marché, la relation de confiance avec les clients et la stratégie de différenciation restent irremplaçables. L'IA génère du contenu, un expert génère des résultats.",
  },
  {
    id: "cta",
    image: "assets/images/person.png",
    title: "Envie d'intégrer l'IA dans votre activité ?",
    subtitle: "Audit gratuit, conseil personnalisé, développement sur mesure",
    bullets: [
      "Audit gratuit de votre stack d'outils actuel",
      "Accompagnement personnalisé pour intégrer l'IA",
      "Création de site web professionnel et optimisé",
      "Développement d'automatisations sur mesure",
    ],
    notes:
      "Tous les outils mentionnés : ChatGPT (chat.openai.com), Claude (claude.ai), Gemini (gemini.google.com), Canva (canva.com), Ideogram (ideogram.ai), Gamma (gamma.app), Descript (descript.com), Zapier (zapier.com), Make (make.com), n8n (n8n.io), Notion (notion.so), Lovable (lovable.dev), Bolt (bolt.new), v0 (v0.app), NotebookLM (notebooklm.google).",
  },
];
