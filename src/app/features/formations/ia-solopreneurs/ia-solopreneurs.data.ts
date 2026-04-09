import type { Slide } from "../../../shared/models/slide.model";

export const IA_SOLOPRENEURS_SLIDES: Slide[] = [
  {
    id: "accroche",
    image: "assets/images/auto_graph.png",
    title: "L'IA, accélérateur de productivité",
    subtitle:
      "88% des organisations utilisent déjà l'IA — McKinsey, novembre 2025",
    bullets: [
      "L'IA générative adoptée par 72% des entreprises en 2025, contre 33% en 2024 (McKinsey, « The state of AI »)",
      "Gain de productivité de 20 à 40% pour les entreprises qui intègrent l'IA dans leurs processus (McKinsey, « A new future of work »)",
      "Un stack complet d'outils IA coûte entre 0€ et 100€/mois — une fraction du coût d'un collaborateur",
    ],
    notes:
      "Sources vérifiées : McKinsey Global Institute, « The state of AI in early 2025 » (nov. 2025) — 88% des organisations utilisent l'IA, 72% l'IA générative. « A new future of work » (mai 2024) — +20 à 40% de productivité estimée. Gartner prévoit que 40% des applications d'entreprise intégreront des agents IA d'ici fin 2026, contre moins de 5% début 2025.",
  },
  {
    id: "trois-cerveaux",
    image: "assets/images/smart_toy.png",
    title: "ChatGPT, Claude, Gemini — bien choisir",
    subtitle:
      "Les pros ne choisissent plus UN outil — ils utilisent le bon pour chaque tâche",
    table: {
      headers: ["", "ChatGPT", "Claude", "Gemini"],
      rows: [
        [
          "Force",
          "Polyvalent, plugins, GPT Store",
          "Qualité rédaction, docs longs",
          "Google intégré, vidéo",
        ],
        [
          "Idéal pour",
          "Brainstorm, code, analyse",
          "Rédaction pro, contrats, stratégie",
          "Gmail/Drive/Agenda, vidéo",
        ],
        ["Prix", "20€/mois", "20€/mois", "20€/mois (ou gratuit)"],
      ],
    },
    notes:
      "ChatGPT (OpenAI) : le plus utilisé, vaste écosystème de plugins, GPT Store. Claude (Anthropic) : classé n°1 par les évaluateurs humains pour la rédaction business (rapports, analyses, propositions). Fenêtre de contexte de 200K tokens = peut analyser un document de 150 pages d'un coup. Gemini (Google) : seul modèle capable d'analyser de la vidéo nativement. Intégration native Google Workspace. Les 3 sont au même prix (20€/mois tier pro).",
  },
  {
    id: "contenu-texte",
    image: "assets/images/description.png",
    title: "Créer du contenu — Texte & Copywriting",
    bullets: [
      "ChatGPT / Claude — Articles, posts LinkedIn, emails clients, fiches produit",
      "Astuce : ne jamais publier un texte IA brut",
      "Donner son STYLE, ses EXEMPLES, son CONTEXTE → résultat personnel, pas générique",
    ],
    notes:
      "La clé pour obtenir du contenu qui ne 'sent' pas l'IA : fournir 2-3 exemples de votre style d'écriture dans le prompt, préciser le contexte (qui est votre audience, quel ton), et toujours relire et personnaliser. Exemple de prompt efficace : 'Tu es mon rédacteur. Voici 2 exemples de mes posts LinkedIn [exemples]. Rédige un post sur [sujet] dans le même style, même longueur, même ton.'",
  },
  {
    id: "contenu-visuel",
    image: "assets/images/edit.png",
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
      "Ideogram vs Midjourney : Ideogram écrase Midjourney sur le texte dans les images (95% vs 40% de précision). Midjourney reste supérieur pour le photoréalisme et les ambiances. Les pros en 2026 utilisent les deux : Midjourney pour l'esthétique, Ideogram pour le texte/branding. Canva AI est le couteau suisse : moins spécialisé mais fait tout correctement et gratuitement.",
  },
  {
    id: "contenu-video",
    image: "assets/images/logiciel.png",
    title: "Créer du contenu — Vidéo",
    bullets: [
      "Descript — Éditer une vidéo comme un document Word. Économie : 10-15h/semaine",
      "Opus Clip — Découpe un long format en shorts viraux automatiquement",
      "Synthesia — Vidéos avec avatar IA (formation, onboarding, tutos clients)",
    ],
    notes:
      "Descript est le plus gros gain de temps documenté : 10-15h/semaine pour les créateurs de contenu vidéo. On édite le texte de la transcription et la vidéo se coupe toute seule. Suppression automatique des 'euh', sous-titres auto. Opus Clip : parfait pour transformer un webinaire de 1h en 30 jours de contenu quotidien pour les réseaux. Synthesia : pas besoin de caméra ni d'acteur.",
  },
  {
    id: "contenu-presentations",
    image: "assets/images/chart.png",
    title: "Créer du contenu — Présentations",
    bullets: [
      "Gamma.app — Génère des présentations pro en 60 secondes",
      "70 millions d'utilisateurs, 100M€ de revenus annuels",
      "Gratuit pour démarrer, 10€/mois en premium",
      "Nouveau : Gamma Agent — un partenaire IA qui recherche, restructure et design",
    ],
    notes:
      "Gamma a levé 68M$ en Série B (a16z) à une valorisation de 2,1 milliards. Le Gamma Agent (v3.0, 2026) peut chercher sur le web, restructurer automatiquement le contenu, et fournir du feedback design en langage naturel. Alternative : Beautiful.ai, Presentations.AI.",
  },
  {
    id: "automatiser-overview",
    image: "assets/images/gear.png",
    title: "Automatiser les tâches répétitives",
    subtitle: "Le vrai game-changer : l'IA qui AGIT à votre place",
    table: {
      headers: ["Outil", "Difficulté", "Prix", "Cas d'usage"],
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
          "Workflows complexes, boucles, branchements",
        ],
        [
          "n8n",
          "Avancé (open-source)",
          "Gratuit (self-hosted)",
          "Agents IA custom, LangChain intégré",
        ],
      ],
    },
    notes:
      "Les tâches IA sur Zapier ont augmenté de 760% en deux ans — c'est la catégorie la plus rapide de la plateforme. 68% des PME américaines utilisent l'IA régulièrement, avec une économie moyenne de 12 à 18h par semaine (Zapier, 2025). ROI moyen : l'automatisation IA se rentabilise en 1 à 3 mois pour la plupart des petites entreprises.",
  },
  {
    id: "automatiser-exemples",
    image: "assets/images/reorganize.png",
    title: "3 automatisations concrètes",
    bullets: [
      "1. Formulaire contact → email personnalisé + fiche Notion + rappel calendrier",
      "2. Post LinkedIn publié → repost Twitter + archivage Google Sheet + notification",
      "3. Email devis reçu → IA analyse et catégorise → pré-rédige la réponse",
    ],
    notes:
      "Workflow 1 (Make.com) : Typeform/Google Forms → Make reçoit les données → envoie un email personnalisé via Gmail → crée une fiche dans Notion → programme un rappel dans Google Calendar. Temps de setup : ~2h. Workflow 2 (Zapier) : 100% gratuit sur le tier gratuit. Workflow 3 (n8n + Claude) : email → n8n extrait le contenu → envoie à Claude pour analyse → catégorise (urgent/standard/spam) → pré-rédige une réponse → notification Slack.",
  },
  {
    id: "business-productivite",
    image: "assets/images/business_center.png",
    title: "Gérer son business — Productivité",
    bullets: [
      "Notion AI — Notes, base de données, wiki d'entreprise, IA intégrée",
      "Microsoft Copilot — IA dans Word, Excel, PowerPoint, Outlook",
      "Analyser un tableau Excel en langage naturel, créer un rapport depuis un document",
    ],
    notes:
      "Notion AI : l'outil de productivité le plus populaire chez les solopreneurs. Combine prise de notes, base de données, gestion de projet et wiki, le tout avec une couche IA pour résumer, rédiger et planifier. Microsoft Copilot : si vous êtes dans l'écosystème Microsoft, c'est un accélérateur massif. Rédiger un email dans Outlook, analyser des données dans Excel, créer une présentation depuis un document Word — tout en langage naturel.",
  },
  {
    id: "business-crm",
    image: "assets/images/groups.png",
    title: "Gérer son business — Email & Relation client",
    bullets: [
      "Alfred — Lit vos emails, priorise, rédige des réponses dans votre style, extrait les tâches",
      "Tidio — Chatbot IA sur votre site + réseaux sociaux, plug-and-play",
      "Waalaxy — Automatisation LinkedIn + email, séquences multicanales",
      "ActiveCampaign — CRM + email marketing + séquences automatisées",
    ],
    notes:
      "Alfred : assistant email IA qui apprend votre style d'écriture. Tidio : chatbot IA facile à installer, répond 24/7. Waalaxy : très populaire chez les freelances français, automatise la prospection LinkedIn + email. ActiveCampaign : combine CRM et email marketing. Exemple de séquence : lead s'inscrit → attend 2 jours → envoie une étude de cas → si clic, tag 'lead chaud'.",
  },
  {
    id: "site-sans-coder",
    image: "assets/images/computer.png",
    title: "Créer un site ou une app sans coder",
    subtitle: "La révolution 2026 : du prompt au produit en 5 minutes",
    table: {
      headers: ["Outil", "Force", "Prix"],
      rows: [
        [
          "Lovable",
          "Full-stack (app + base de données)",
          "Gratuit limité, 20€/mois",
        ],
        ["Bolt.new", "Prototypage rapide dans le navigateur", "Gratuit limité"],
        [
          "v0.app (Vercel)",
          "Composants UI pro-grade (Next.js)",
          "Gratuit limité",
        ],
      ],
    },
    notes:
      "Lovable : valorisé 6,6 milliards d'euros, 200M€ de revenus annuels. Bolt.new : pas besoin de connaître React, ça marche directement dans le navigateur. v0.app : code de qualité professionnelle reconnu par les développeurs. Ces outils sont géniaux pour un MVP. Pour un site professionnel qui convertit, bien référencé, rapide, sécurisé — c'est là qu'un développeur expert fait la différence. L'IA génère du code, un expert génère des résultats.",
  },
  {
    id: "boite-a-outils",
    image: "assets/images/diamond.png",
    title: "La boîte à outils idéale du solopreneur",
    table: {
      headers: ["Niveau", "Outils", "Budget"],
      rows: [
        [
          "Débutant",
          "ChatGPT gratuit + Canva gratuit + Gamma gratuit + Zapier gratuit",
          "0€/mois",
        ],
        [
          "Intermédiaire",
          "ChatGPT Pro + Canva Pro + Make.com + Notion AI",
          "~50€/mois",
        ],
        [
          "Avancé",
          "Claude Pro + ChatGPT Pro + Make.com + n8n + Descript",
          "~80-100€/mois",
        ],
      ],
    },
    bullets: [
      "Règle d'or : commencer par 2-3 outils, les maîtriser, puis ajouter",
    ],
    notes:
      "Stack débutant (0€) : parfait pour tester et se familiariser. ChatGPT gratuit a des limites mais suffit pour commencer. Canva gratuit couvre 90% des besoins visuels. Stack intermédiaire (~50€) : pour les solopreneurs qui ont validé leur activité. Stack avancé (~80-100€) : pour maximiser la productivité. La règle d'or : ne pas tout installer d'un coup. Chaque outil doit résoudre un problème concret.",
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
      "notebooklm.google — totalement gratuit. Audio Overviews disponibles depuis sept. 2024. Le mode interactif ('raise your hand') permet d'interrompre la discussion pour poser des questions en temps réel. Depuis mars 2026, tourne sur Gemini 3. Cas d'usage business : transformer ses articles de blog en podcasts, créer des résumés audio de rapports clients, générer du contenu formation.",
  },
  {
    id: "demo-gamma-prompt",
    title: "Votre tour — Générez votre pitch de vente",
    subtitle: "Entrez votre secteur et obtenez un prompt Gamma prêt à l'emploi",
    promptTemplate: {
      label: "Votre secteur d'activité",
      placeholder:
        "ex: Coach sportif, Photographe, Consultant RH, Fleuriste...",
      template:
        "Tu es un consultant marketing expert en création d'offres pour les indépendants.\n\nMon secteur d'activité : {{sector}}\n\nCrée une présentation de vente complète et professionnelle avec :\n\n1. **Nom de l'offre** — Un nom accrocheur et mémorable\n2. **Promesse principale** — Une phrase qui résume la transformation client\n3. **3 bénéfices clés** — Ce que le client obtient concrètement\n4. **Structure de l'offre** — Les étapes ou modules inclus\n5. **Preuve sociale** — Un témoignage fictif mais réaliste\n6. **Tarif suggéré** — Avec ancrage de prix (valeur perçue vs prix réel)\n7. **Call-to-action** — Une phrase de clôture qui pousse à l'action\n8. **FAQ** — 3 objections courantes avec réponses\n\nStyle : professionnel, chaleureux, orienté résultats.\nFormat : présentation Gamma avec sections visuelles distinctes.",
    },
    notes:
      "C'est le moment interactif de la présentation. En live : demander à un membre de l'audience de donner son secteur, le taper en direct, montrer le prompt généré, puis le coller dans Gamma. Pour les visiteurs web : ils peuvent taper leur propre secteur et copier le prompt pour l'utiliser eux-mêmes.",
  },
  {
    id: "recap",
    image: "assets/images/trending_up.png",
    title: "Ce que l'IA fait — et ne fait pas",
    bullets: [
      "L'IA fait 80% du travail opérationnel : contenu, visuels, automatisations, support",
      "L'IA ne remplace pas : votre connaissance du marché, votre relation client, votre stratégie",
      "Les 20% restants font 80% de la différence — c'est là que l'expertise humaine crée la valeur",
    ],
    notes:
      "Message clé de la présentation : l'IA est un accélérateur extraordinaire, mais elle ne remplace pas la compréhension de votre marché, la relation de confiance avec vos clients, ni la stratégie de différenciation. Un site généré par IA en 5 minutes ne sera jamais aussi performant qu'un site conçu par un expert qui comprend le SEO, la performance, la sécurité et la conversion. L'IA génère du contenu, un expert génère des résultats.",
  },
  {
    id: "cta",
    image: "assets/images/person.png",
    title: "Allons plus loin ensemble",
    subtitle: "Envie d'intégrer l'IA dans votre activité ?",
    bullets: [
      "Audit gratuit de votre stack d'outils actuel",
      "Conseil et accompagnement personnalisé",
      "Création de site web professionnel et optimisé",
      "Développement d'automatisations sur mesure",
    ],
    notes:
      "Liens vers les outils mentionnés :\n- ChatGPT : chat.openai.com\n- Claude : claude.ai\n- Gemini : gemini.google.com\n- Canva : canva.com\n- Ideogram : ideogram.ai\n- Midjourney : midjourney.com\n- Gamma : gamma.app\n- Descript : descript.com\n- Opus Clip : opus.pro\n- Synthesia : synthesia.io\n- Zapier : zapier.com\n- Make.com : make.com\n- n8n : n8n.io\n- Notion : notion.so\n- Lovable : lovable.dev\n- Bolt.new : bolt.new\n- v0 : v0.app\n- NotebookLM : notebooklm.google\n- Tidio : tidio.com\n- Waalaxy : waalaxy.com\n- ActiveCampaign : activecampaign.com",
  },
];
