import type { Slide } from "../../../shared/models/slide.model";

export const IA_SOLOPRENEURS_SLIDES: Slide[] = [
  {
    id: "accroche",
    title: "127€/h vs 30€/h — le pouvoir de l'IA",
    bullets: [
      "Un solopreneur automatisé gagne en moyenne 127€/h contre 30€/h en manuel (McKinsey, 2025)",
      "45% des tâches entrepreneuriales seront automatisables gratuitement d'ici fin 2026 (Gartner)",
      "Un stack IA complet coûte 250-1000€/an — contre 35 000€ pour un seul salarié",
    ],
    notes:
      'Source McKinsey : étude 2025 sur 2 400 entreprises unipersonnelles. Les 127€/h représentent le revenu médian des solopreneurs ayant automatisé au moins 3 workflows. La stat Gartner vient du rapport "Future of Work" Q3 2025. Le coût du stack IA est basé sur les tarifs 2026 des outils mentionnés dans cette présentation.',
  },
  {
    id: "trois-cerveaux",
    title: "Les 3 cerveaux IA — bien choisir",
    subtitle:
      "Les pros ne choisissent plus UN outil — ils utilisent le bon pour chaque tâche",
    table: {
      headers: ["", "ChatGPT", "Claude", "Gemini"],
      rows: [
        [
          "Force",
          "Polyvalent, plugins",
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
      "ChatGPT (OpenAI) : le plus polyvalent, meilleur écosystème de plugins, GPT Store. Claude (Anthropic) : classé n°1 par les évaluateurs humains pour la rédaction business. Fenêtre de contexte de 200K tokens. Gemini (Google) : seul modèle capable d'analyser de la vidéo nativement. Intégration native Google Workspace.",
  },
  {
    id: "contenu-texte",
    title: "Créer du contenu — Texte & Copywriting",
    bullets: [
      "ChatGPT / Claude — Articles, posts LinkedIn, emails clients, fiches produit",
      "Astuce : ne jamais publier un texte IA brut",
      "Donner son STYLE, ses EXEMPLES, son CONTEXTE → résultat personnel, pas générique",
    ],
    notes:
      "La clé : fournir 2-3 exemples de votre style d'écriture dans le prompt, préciser le contexte (audience, ton), et toujours relire et personnaliser.",
  },
  {
    id: "contenu-visuel",
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
      "Ideogram écrase Midjourney sur le texte dans les images (95% vs 40%). Midjourney reste supérieur pour le photoréalisme. Les pros utilisent les deux.",
  },
  {
    id: "contenu-video",
    title: "Créer du contenu — Vidéo",
    bullets: [
      "Descript — Éditer une vidéo comme un document Word. Économie : 10-15h/semaine",
      "Opus Clip — Découpe un long format en shorts viraux automatiquement",
      "Synthesia — Vidéos avec avatar IA (formation, onboarding, tutos clients)",
    ],
    notes:
      "Descript est le plus gros gain de temps documenté : 10-15h/semaine pour les créateurs de contenu vidéo. Opus Clip : parfait pour transformer un webinaire de 1h en 30 jours de contenu.",
  },
  {
    id: "contenu-presentations",
    title: "Créer du contenu — Présentations",
    bullets: [
      "Gamma.app — Génère des présentations pro en 60 secondes",
      "70 millions d'utilisateurs, 100M€ de revenus annuels",
      "Gratuit pour démarrer, 10€/mois en premium",
      "Nouveau : Gamma Agent — un partenaire IA qui recherche, restructure et design",
    ],
    notes:
      "Gamma a levé 68M$ en Série B (a16z) à une valorisation de 2,1 milliards. Le Gamma Agent peut chercher sur le web, restructurer le contenu, et donner du feedback design.",
  },
  {
    id: "automatiser-overview",
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
      "Zapier : le plus simple, parfait pour commencer. Make.com : meilleur rapport puissance/prix en 2026. n8n : open-source, gratuit en self-hosted, intégration LangChain.",
  },
  {
    id: "automatiser-exemples",
    title: "3 automatisations concrètes",
    bullets: [
      "1. Formulaire contact → email personnalisé + fiche Notion + rappel calendrier",
      "2. Post LinkedIn publié → repost Twitter + archivage Google Sheet + notification",
      "3. Email devis reçu → IA analyse et catégorise → pré-rédige la réponse",
    ],
    notes:
      "Workflow 1 (Make.com) : ~2h de setup. Workflow 2 (Zapier) : gratuit. Workflow 3 (n8n + Claude) : catégorisation automatique urgent/standard/spam.",
  },
  {
    id: "business-productivite",
    title: "Gérer son business — Productivité",
    bullets: [
      "Notion AI — Notes, base de données, wiki d'entreprise, IA intégrée",
      "Microsoft Copilot — IA dans Word, Excel, PowerPoint, Outlook",
      "Analyser un tableau Excel en langage naturel, créer un rapport depuis un document",
    ],
    notes:
      "Notion AI : le plus populaire chez les solopreneurs. Microsoft Copilot : accélérateur massif dans l'écosystème Microsoft.",
  },
  {
    id: "business-crm",
    title: "Gérer son business — Email & Relation client",
    bullets: [
      "Alfred — Lit vos emails, priorise, rédige des réponses dans votre style, extrait les tâches",
      "Tidio — Chatbot IA sur votre site + réseaux sociaux, plug-and-play",
      "Waalaxy — Automatisation LinkedIn + email, séquences multicanales",
      "ActiveCampaign — CRM + email marketing + séquences automatisées",
    ],
    notes:
      'Alfred apprend votre style d\'écriture. Tidio : chatbot 24/7 facile à installer. Waalaxy : très populaire chez les freelances français. ActiveCampaign : séquences automatisées (lead → case study → tag "chaud").',
  },
  {
    id: "site-sans-coder",
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
      "Lovable : valorisé 6,6 milliards, 200M€ de revenus annuels. Ces outils sont géniaux pour un MVP. Pour un site professionnel qui convertit, bien référencé, rapide, sécurisé — c'est là qu'un développeur expert fait la différence.",
  },
  {
    id: "boite-a-outils",
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
      "Stack débutant (0€) : parfait pour tester. Stack intermédiaire (~50€) : activité validée. Stack avancé (~80-100€) : maximiser la productivité.",
  },
  {
    id: "transition-pratique",
    title: "Passons à la pratique",
    subtitle: "Lançons une offre complète en 10 minutes avec l'IA",
    bullets: [
      "Scénario : vous êtes indépendant et vous voulez lancer une nouvelle offre",
      "On va utiliser 4 outils en live pour créer : stratégie, visuel, landing page et automatisation",
      "Tout ce que vous allez voir est reproductible chez vous, gratuitement",
    ],
  },
  {
    id: "pratique-strategie",
    title: "Étape 1 — Stratégie avec ChatGPT",
    subtitle: "De l'idée au plan marketing en 30 secondes",
    bullets: [
      'Prompt : "Tu es un consultant marketing. Je suis coach sportif indépendant..."',
      "Demander : nom d'offre, 3 bénéfices clients, page de vente structurée, email de lancement",
      "Résultat : un plan marketing complet en moins d'une minute",
    ],
    notes:
      'Prompt complet : "Tu es un consultant marketing expert. Je suis coach sportif indépendant, je veux lancer une offre de programme personnalisé en ligne à 197€. Donne-moi : 1) Le nom de l\'offre 2) 3 bénéfices clients concrets 3) Une page de vente structurée 4) Un email de lancement."',
  },
  {
    id: "pratique-visuel",
    title: "Étape 2 — Visuel avec Ideogram",
    subtitle: "Un visuel professionnel avec texte intégré en 10 secondes",
    bullets: [
      "Prompt : \"Professional fitness coaching banner, modern design, text 'PROGRAMME SPORT SUR MESURE'\"",
      "Résultat : un visuel de qualité pro avec le texte parfaitement intégré",
      "Alternative : Canva AI pour un contrôle plus fin du design",
    ],
    notes:
      "Ideogram excelle pour les visuels marketing avec du texte. Canva AI est meilleur quand on veut modifier finement le design après génération.",
  },
  {
    id: "pratique-landing",
    title: "Étape 3 — Landing page avec Gamma",
    subtitle: "De l'idée à la page de vente en 60 secondes",
    bullets: [
      "Copier le texte de ChatGPT → Coller dans Gamma comme prompt",
      "Gamma génère une landing page complète, responsive, partageable",
      "Résultat professionnel immédiat, modifiable en quelques clics",
    ],
    notes:
      "En 60 secondes, Gamma génère une landing page complète avec : hero section, présentation de l'offre, bénéfices, tarif, et call-to-action.",
  },
  {
    id: "pratique-prompt",
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
      "C'est le moment interactif de la présentation. En live : demander à un membre de l'audience de donner son secteur, le taper en direct, montrer le prompt généré, puis le coller dans Gamma.",
  },
  {
    id: "pratique-automatisation",
    title: "Étape 4 — Automatisation avec Zapier",
    subtitle: "Connecter le tout pour que ça tourne sans vous",
    bullets: [
      "Formulaire d'inscription → Email de bienvenue automatique",
      "→ Ajout dans Google Sheets (suivi prospects)",
      "→ Notification email/Slack pour vous",
      "Setup : 30 minutes, gratuit avec Zapier",
    ],
    notes:
      "Workflow Zapier : Trigger (Google Forms) → Gmail (email bienvenue) → Google Sheets (archivage) → notification. 100% gratuit.",
  },
  {
    id: "pratique-notebooklm",
    title: "Bonus — Google NotebookLM",
    subtitle: "Transformez n'importe quel document en podcast IA",
    bullets: [
      "Uploadez un PDF, un doc, une URL → NotebookLM génère un podcast de 10 minutes",
      "Deux voix IA naturelles qui discutent et analysent votre contenu",
      "Gratuit, par Google — parfait pour de la formation, du contenu, de la veille",
      "Nouveau : infographies, présentations et tableaux de données générés automatiquement",
    ],
    notes:
      'NotebookLM (gratuit, Google) : "Audio Overviews" génère un podcast de 6-15 minutes. Cas d\'usage : transformer articles en podcasts, résumés audio de rapports. Depuis mars 2026, tourne sur Gemini 3.',
  },
  {
    id: "recap",
    title: "Ce que l'IA fait — et ne fait pas",
    bullets: [
      "L'IA fait 80% du travail opérationnel : contenu, visuels, automatisations, support",
      "L'IA ne remplace pas : votre connaissance du marché, votre relation client, votre stratégie",
      "Les 20% restants font 80% de la différence — c'est là que l'expertise humaine crée la valeur",
    ],
    notes:
      "L'IA est un accélérateur extraordinaire, mais elle ne remplace pas la compréhension du marché, la relation client, ni la stratégie. L'IA génère du contenu, un expert génère des résultats.",
  },
  {
    id: "cta",
    title: "Allons plus loin ensemble",
    subtitle: "Envie d'intégrer l'IA dans votre activité ?",
    bullets: [
      "Audit gratuit de votre stack d'outils actuel",
      "Conseil et accompagnement personnalisé",
      "Création de site web professionnel et optimisé",
      "Développement d'automatisations sur mesure",
    ],
    notes:
      "Liens vers les outils :\n- ChatGPT : chat.openai.com\n- Claude : claude.ai\n- Gemini : gemini.google.com\n- Canva : canva.com\n- Ideogram : ideogram.ai\n- Gamma : gamma.app\n- Descript : descript.com\n- Zapier : zapier.com\n- Make.com : make.com\n- n8n : n8n.io\n- Notion : notion.so\n- Lovable : lovable.dev\n- Bolt.new : bolt.new\n- v0 : v0.app\n- NotebookLM : notebooklm.google",
  },
];
