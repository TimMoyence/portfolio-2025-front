import type {
  Act,
  PresentationSlide,
} from "../../../shared/models/slide.model";

// ============================================================
// Formation "Audit SEO DIY" — entrepreneurs non-tech
// Narration 4 actes : Accrocher → Montrer → Pratiquer → Ancrer
// Angle : SEO = chiffre d'affaires. Jamais de jargon SEO sans
// explication business (pourquoi ca compte pour mes clients).
// ============================================================

const ACTS = {
  accrocher: {
    id: "audit-seo-diy-accrocher",
    label: $localize`:@@formations.audit-seo-diy.act.accrocher:Accrocher`,
  } satisfies Act,
  montrer: {
    id: "audit-seo-diy-montrer",
    label: $localize`:@@formations.audit-seo-diy.act.montrer:Montrer`,
  } satisfies Act,
  pratiquer: {
    id: "audit-seo-diy-pratiquer",
    label: $localize`:@@formations.audit-seo-diy.act.pratiquer:Pratiquer`,
  } satisfies Act,
  ancrer: {
    id: "audit-seo-diy-ancrer",
    label: $localize`:@@formations.audit-seo-diy.act.ancrer:Ancrer`,
  } satisfies Act,
};

export const AUDIT_SEO_DIY_ACTS: Act[] = [
  ACTS.accrocher,
  ACTS.montrer,
  ACTS.pratiquer,
  ACTS.ancrer,
];

export const AUDIT_SEO_DIY_SLIDES: PresentationSlide[] = [
  // ── ACTE 1 — ACCROCHER (3 slides) ──

  {
    id: "audit-seo-diy-accroche",
    act: ACTS.accrocher,
    fragmentCount: 0,
    layout: "hero",
    imageUrl:
      "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageAlt: $localize`:@@formations.audit-seo-diy.accroche.imageAlt:Entrepreneure regardant les statistiques de visite de son site web sur un ordinateur portable`,
    title: $localize`:@@formations.audit-seo-diy.accroche.title:Audit SEO pour entrepreneurs non-tech — 20 minutes, 7 points, sans jargon`,
    subtitle: $localize`:@@formations.audit-seo-diy.accroche.subtitle:Comment savoir si votre site web vous rapporte des clients, ou s'il dort dans un tiroir de Google`,
    speakerNotes: $localize`:@@formations.audit-seo-diy.accroche.speakerNotes:Demarrer par : "Votre site existe. Mais est-ce que les clients que vous cherchez le trouvent ?"`,
    interactions: {
      scroll: [
        {
          type: "self-rating",
          question: $localize`:@@formations.audit-seo-diy.accroche.rating.question:Quelle part de vos clients vient d'une recherche Google ?`,
          hint: $localize`:@@formations.audit-seo-diy.accroche.rating.hint:1 = aucun, 2 = quelques-uns, 3 = la majorite. Votre reponse personnalise la checklist.`,
          min: 1,
          max: 3,
          labels: {
            min: $localize`:@@formations.audit-seo-diy.accroche.rating.labelMin:Aucun`,
            max: $localize`:@@formations.audit-seo-diy.accroche.rating.labelMax:Majorite`,
          },
          profileField: "aiLevel",
        },
      ],
    },
  },
  {
    id: "audit-seo-diy-constat",
    act: ACTS.accrocher,
    fragmentCount: 0,
    layout: "stats",
    title: $localize`:@@formations.audit-seo-diy.constat.title:Le constat : la majorite des sites d'entrepreneurs sont invisibles`,
    stats: [
      {
        value: "68%",
        label: $localize`:@@formations.audit-seo-diy.constat.stats.0.label:des recherches Google ne donnent jamais un clic au dela du premier ecran`,
        source: $localize`:@@formations.audit-seo-diy.constat.stats.0.source:Sistrix, analyse 2025`,
      },
      {
        value: "93%",
        label: $localize`:@@formations.audit-seo-diy.constat.stats.1.label:des experiences en ligne commencent par une recherche — si vous n'y etes pas, vous n'existez pas`,
        source: $localize`:@@formations.audit-seo-diy.constat.stats.1.source:BrightEdge Research, 2024`,
      },
      {
        value: "20 min",
        label: $localize`:@@formations.audit-seo-diy.constat.stats.2.label:suffisent pour reperer 80% des problemes SEO d'un site de petite entreprise, avec les bons outils gratuits`,
        source: $localize`:@@formations.audit-seo-diy.constat.stats.2.source:Benchmark asilidesign.fr, 2026`,
      },
    ],
    speakerNotes: $localize`:@@formations.audit-seo-diy.constat.speakerNotes:Le SEO n'est pas un luxe : si Google ne vous trouve pas, vos prospects non plus. Et 20 minutes d'audit bien guidees valent des heures de doute.`,
  },
  {
    id: "audit-seo-diy-promesse",
    act: ACTS.accrocher,
    fragmentCount: 0,
    layout: "quote",
    title: $localize`:@@formations.audit-seo-diy.promesse.title:La promesse : vous saurez quoi regarder et dans quel ordre`,
    quote: $localize`:@@formations.audit-seo-diy.promesse.quote:A la fin de ces 20 minutes, vous aurez une checklist imprimable des 7 points critiques a verifier sur votre site cette semaine. Pas de jargon, pas d'abonnement, pas de cookies espions.`,
    quoteAuthor: $localize`:@@formations.audit-seo-diy.promesse.quoteAuthor:Tim Moyence — asilidesign.fr`,
    authorNote: $localize`:@@formations.audit-seo-diy.promesse.authorNote:Cette methode vient de 40+ audits reels pour des coachs, artisans, commercants. Les memes 7 points reviennent a chaque fois.`,
  },

  // ── ACTE 2 — MONTRER (5 slides) ──

  {
    id: "audit-seo-diy-check1-indexation",
    act: ACTS.montrer,
    fragmentCount: 0,
    layout: "split",
    title: $localize`:@@formations.audit-seo-diy.check1.title:Check 1 — Google sait-il que votre site existe ?`,
    subtitle: $localize`:@@formations.audit-seo-diy.check1.subtitle:Sans indexation, votre site est invisible. Verification en 30 secondes, gratuite.`,
    bullets: [
      $localize`:@@formations.audit-seo-diy.check1.bullets.0:Tapez sur Google : "site:votrenomdedomaine.fr"`,
      $localize`:@@formations.audit-seo-diy.check1.bullets.1:Google affiche les pages qu'il a indexees — si la liste est vide ou tres courte, alerte rouge`,
      $localize`:@@formations.audit-seo-diy.check1.bullets.2:Rendez-vous sur Google Search Console (gratuit) pour demander l'indexation manuelle`,
      $localize`:@@formations.audit-seo-diy.check1.bullets.3:Cas verifie : 1 client sur 4 decouvre ici qu'il bloque accidentellement Google via un fichier robots.txt mal configure`,
    ],
    notes: $localize`:@@formations.audit-seo-diy.check1.notes:C'est le check numero 1 parce que sans indexation, aucun autre SEO ne compte. Le toolkit inclut la procedure exacte pour soumettre votre sitemap.`,
  },
  {
    id: "audit-seo-diy-check2-titres",
    act: ACTS.montrer,
    fragmentCount: 0,
    layout: "split",
    title: $localize`:@@formations.audit-seo-diy.check2.title:Check 2 — Vos titres disent-ils "je vends quoi, a qui" ?`,
    subtitle: $localize`:@@formations.audit-seo-diy.check2.subtitle:Le titre SEO, c'est la devanture de votre magasin en ligne. Une faute ici = perte de clics meme bien classe.`,
    bullets: [
      $localize`:@@formations.audit-seo-diy.check2.bullets.0:Ouvrez chaque page importante de votre site, regardez l'onglet navigateur`,
      $localize`:@@formations.audit-seo-diy.check2.bullets.1:Un bon titre : "Photographe mariage Lyon — Asilidesign" (metier + ville + marque)`,
      $localize`:@@formations.audit-seo-diy.check2.bullets.2:Un mauvais titre : "Accueil" ou "Bienvenue sur notre site"`,
      $localize`:@@formations.audit-seo-diy.check2.bullets.3:Outil gratuit : l'extension SEO Meta in 1 Click sur Chrome affiche le titre de chaque page en un clic`,
    ],
    notes: $localize`:@@formations.audit-seo-diy.check2.notes:Le titre est le premier texte que Google affiche dans les resultats de recherche. C'est aussi celui que les IA (ChatGPT, Perplexity) lisent en priorite pour comprendre de quoi parle votre page.`,
  },
  {
    id: "audit-seo-diy-check3-vitesse",
    act: ACTS.montrer,
    fragmentCount: 0,
    layout: "split",
    title: $localize`:@@formations.audit-seo-diy.check3.title:Check 3 — Votre site charge en moins de 3 secondes ?`,
    subtitle: $localize`:@@formations.audit-seo-diy.check3.subtitle:Sur mobile, 1 seconde de plus = 7% de clients qui partent. Verification gratuite en 2 clics.`,
    bullets: [
      $localize`:@@formations.audit-seo-diy.check3.bullets.0:Rendez-vous sur pagespeed.web.dev (outil Google gratuit)`,
      $localize`:@@formations.audit-seo-diy.check3.bullets.1:Collez l'URL de votre page d'accueil — le test prend 30 secondes`,
      $localize`:@@formations.audit-seo-diy.check3.bullets.2:Verifiez : score mobile >= 70 (bon), entre 50-70 (ameliorable), < 50 (urgence)`,
      $localize`:@@formations.audit-seo-diy.check3.bullets.3:Les 3 causes frequentes : images trop lourdes, trop de plugins WordPress, pas de mise en cache`,
    ],
    notes: $localize`:@@formations.audit-seo-diy.check3.notes:La vitesse mobile est un critere de classement Google depuis 2021. C'est aussi la premiere cause d'abandon panier sur les sites e-commerce. Un site rapide convertit mieux.`,
  },
  {
    id: "audit-seo-diy-check4-mobile",
    act: ACTS.montrer,
    fragmentCount: 0,
    layout: "split",
    title: $localize`:@@formations.audit-seo-diy.check4.title:Check 4 — Votre site est-il utilisable sur smartphone ?`,
    subtitle: $localize`:@@formations.audit-seo-diy.check4.subtitle:60% des recherches locales se font sur mobile. Un site non-mobile = 60% de clients perdus avant meme de voir votre offre.`,
    bullets: [
      $localize`:@@formations.audit-seo-diy.check4.bullets.0:Ouvrez votre site sur votre propre smartphone`,
      $localize`:@@formations.audit-seo-diy.check4.bullets.1:Test simple : un visiteur peut-il commander/reserver/vous contacter sans zoomer ni deroulement horizontal ?`,
      $localize`:@@formations.audit-seo-diy.check4.bullets.2:Bouton trop petit, texte qui deborde, formulaire inutilisable au pouce = red flag`,
      $localize`:@@formations.audit-seo-diy.check4.bullets.3:Outil gratuit : search.google.com/test/mobile-friendly — verdict Google en 20 secondes`,
    ],
    notes: $localize`:@@formations.audit-seo-diy.check4.notes:Google indexe en priorite la version mobile de votre site depuis 2020 (mobile-first indexing). Si votre site mobile est mauvais, c'est votre note SEO globale qui baisse.`,
  },
  {
    id: "audit-seo-diy-check5-contenu",
    act: ACTS.montrer,
    fragmentCount: 0,
    layout: "split",
    title: $localize`:@@formations.audit-seo-diy.check5.title:Check 5 — Avez-vous du contenu qui repond aux questions clients ?`,
    subtitle: $localize`:@@formations.audit-seo-diy.check5.subtitle:Les IA (ChatGPT, Perplexity, Google AI Overview) citent les sites qui repondent clairement. Pas les sites-brochure.`,
    bullets: [
      $localize`:@@formations.audit-seo-diy.check5.bullets.0:Listez les 10 questions que vos clients vous posent avant d'acheter`,
      $localize`:@@formations.audit-seo-diy.check5.bullets.1:Verifiez : chacune de ces questions a-t-elle une reponse claire (50-100 mots) sur votre site ?`,
      $localize`:@@formations.audit-seo-diy.check5.bullets.2:Si non, creez une page FAQ ou un blog avec 1 question = 1 page dediee`,
      $localize`:@@formations.audit-seo-diy.check5.bullets.3:Bonus IA-friendly : utilisez des titres H2 au format question ("Combien coute un audit SEO ?")`,
    ],
    notes: $localize`:@@formations.audit-seo-diy.check5.notes:Les IA extraient prioritairement les reponses de 50-100 mots sous un titre-question. C'est l'AEO (Answer Engine Optimization). Le toolkit inclut un template de FAQ optimisee.`,
  },

  // ── ACTE 3 — PRATIQUER (3 slides) ──

  {
    id: "audit-seo-diy-pratique-procedure",
    act: ACTS.pratiquer,
    fragmentCount: 0,
    layout: "grid",
    title: $localize`:@@formations.audit-seo-diy.pratique.title:L'ordre exact pour un audit efficace en 20 minutes`,
    gridItems: [
      {
        title: $localize`:@@formations.audit-seo-diy.pratique.item0.title:Minutes 1-5 — Indexation`,
        description: $localize`:@@formations.audit-seo-diy.pratique.item0.description:Commande "site:" + check Google Search Console. Zero indexation = priorite absolue.`,
      },
      {
        title: $localize`:@@formations.audit-seo-diy.pratique.item1.title:Minutes 6-10 — Titres + meta descriptions`,
        description: $localize`:@@formations.audit-seo-diy.pratique.item1.description:Extension SEO Meta in 1 Click sur les 5 pages principales. Notez les titres pourris.`,
      },
      {
        title: $localize`:@@formations.audit-seo-diy.pratique.item2.title:Minutes 11-15 — Vitesse + mobile`,
        description: $localize`:@@formations.audit-seo-diy.pratique.item2.description:PageSpeed Insights + test mobile Google. Screenshot des scores.`,
      },
      {
        title: $localize`:@@formations.audit-seo-diy.pratique.item3.title:Minutes 16-20 — Contenu + FAQ`,
        description: $localize`:@@formations.audit-seo-diy.pratique.item3.description:Listez 3 questions clients sans reponse sur votre site. Ce sont vos 3 prochains articles.`,
      },
    ],
    notes: $localize`:@@formations.audit-seo-diy.pratique.notes:L'ordre importe : on part du fondamental (etre vu par Google) vers le qualitatif (meriter d'etre cite par les IA). Tout inverser fait perdre du temps.`,
  },
  {
    id: "audit-seo-diy-pratique-outils",
    act: ACTS.pratiquer,
    fragmentCount: 0,
    layout: "comparison",
    title: $localize`:@@formations.audit-seo-diy.outils.title:Les 5 outils gratuits que j'utilise vraiment`,
    gridItems: [
      {
        title: $localize`:@@formations.audit-seo-diy.outils.item0.title:Google Search Console`,
        description: $localize`:@@formations.audit-seo-diy.outils.item0.description:Gratuit, officiel Google. Voir si vos pages sont indexees, les mots-cles qui vous amenent des clics, les erreurs techniques.`,
      },
      {
        title: $localize`:@@formations.audit-seo-diy.outils.item1.title:PageSpeed Insights`,
        description: $localize`:@@formations.audit-seo-diy.outils.item1.description:Gratuit, Google aussi. Score de vitesse mobile + desktop + recommandations concretes par ordre d'importance.`,
      },
      {
        title: $localize`:@@formations.audit-seo-diy.outils.item2.title:SEO Meta in 1 Click`,
        description: $localize`:@@formations.audit-seo-diy.outils.item2.description:Extension Chrome gratuite. Clic droit sur une page = vous voyez titre, meta description, H1, H2, images sans alt.`,
      },
      {
        title: $localize`:@@formations.audit-seo-diy.outils.item3.title:Bing Webmaster Tools`,
        description: $localize`:@@formations.audit-seo-diy.outils.item3.description:Gratuit. Moins utilise que Google, mais tres utile : ChatGPT Search s'appuie sur Bing pour ses resultats web.`,
      },
      {
        title: $localize`:@@formations.audit-seo-diy.outils.item4.title:Ahrefs Webmaster Tools`,
        description: $localize`:@@formations.audit-seo-diy.outils.item4.description:Version gratuite reservee au proprietaire verifie. Voir les liens entrants vers votre site (backlinks) sans payer les 99 euro/mois d'Ahrefs Pro.`,
      },
    ],
    notes: $localize`:@@formations.audit-seo-diy.outils.notes:Ces 5 outils ensemble couvrent 90% des besoins d'un audit SEO DIY pour une petite entreprise. Les SaaS payants (Ahrefs, Semrush) apportent surtout de la profondeur, pas de la verite.`,
  },
  {
    id: "audit-seo-diy-pratique-livrable",
    act: ACTS.pratiquer,
    fragmentCount: 0,
    layout: "cta",
    title: $localize`:@@formations.audit-seo-diy.livrable.title:Le livrable : votre rapport d'audit sur une page`,
    subtitle: $localize`:@@formations.audit-seo-diy.livrable.subtitle:Un bon audit DIY tient en une page A4 : 7 lignes, 3 colonnes (check, verdict, action). Pas 40 pages PDF dont personne ne se sert.`,
    bullets: [
      $localize`:@@formations.audit-seo-diy.livrable.bullets.0:Colonne 1 — le check (ex: "indexation", "vitesse mobile")`,
      $localize`:@@formations.audit-seo-diy.livrable.bullets.1:Colonne 2 — le verdict (OK / a corriger / urgent) avec chiffre`,
      $localize`:@@formations.audit-seo-diy.livrable.bullets.2:Colonne 3 — l'action concrete (qui / quand / combien ca coute)`,
      $localize`:@@formations.audit-seo-diy.livrable.bullets.3:Format : imprimable ET Google Sheets dupliquable (lien dans le toolkit)`,
    ],
    notes: $localize`:@@formations.audit-seo-diy.livrable.notes:Le toolkit fournit le template de rapport pre-rempli — vous remplissez les cases verdict + action a chaque check. Format imprimable + Google Sheets dupliquable.`,
  },

  // ── ACTE 4 — ANCRER (3 slides) ──

  {
    id: "audit-seo-diy-ancrer-quandaider",
    act: ACTS.ancrer,
    fragmentCount: 0,
    layout: "split",
    title: $localize`:@@formations.audit-seo-diy.quandaider.title:Quand un audit DIY n'est PAS suffisant`,
    subtitle: $localize`:@@formations.audit-seo-diy.quandaider.subtitle:Cette formation couvre 80% des cas. Les 20% restants demandent une analyse approfondie par un pro.`,
    bullets: [
      $localize`:@@formations.audit-seo-diy.quandaider.bullets.0:Chute brutale de trafic (> 30% sur un mois) — il y a une cause technique ou penalite a identifier`,
      $localize`:@@formations.audit-seo-diy.quandaider.bullets.1:Migration de site prevue — un audit prealable evite de perdre 100% du trafic`,
      $localize`:@@formations.audit-seo-diy.quandaider.bullets.2:Site e-commerce avec > 500 pages — la massification change les priorites d'audit`,
      $localize`:@@formations.audit-seo-diy.quandaider.bullets.3:Concurrence agressive sur des mots-cles a fort CA — analyse concurrentielle approfondie necessaire`,
    ],
    notes: $localize`:@@formations.audit-seo-diy.quandaider.notes:Un bon pro SEO ne fera pas ce que vous pouvez faire en 20 min. Il regardera ce que les outils gratuits ne remontent pas : architecture, strategie de contenu, concurrence.`,
  },
  {
    id: "audit-seo-diy-ancrer-faq",
    act: ACTS.ancrer,
    fragmentCount: 0,
    layout: "grid",
    title: $localize`:@@formations.audit-seo-diy.faq.title:Les questions qu'on me pose le plus souvent`,
    gridItems: [
      {
        title: $localize`:@@formations.audit-seo-diy.faq.item0.title:Combien de temps avant de voir des resultats ?`,
        description: $localize`:@@formations.audit-seo-diy.faq.item0.description:3 a 6 mois pour des effets visibles sur le trafic. Les correctifs techniques (indexation, vitesse) peuvent payer sous 2 semaines.`,
      },
      {
        title: $localize`:@@formations.audit-seo-diy.faq.item1.title:Dois-je refaire un audit chaque mois ?`,
        description: $localize`:@@formations.audit-seo-diy.faq.item1.description:Non. Un audit complet tous les 6 mois suffit. Entre-deux, un check rapide mensuel sur Google Search Console (20 min) detecte les problemes qui emergent.`,
      },
      {
        title: $localize`:@@formations.audit-seo-diy.faq.item2.title:Le SEO marche-t-il encore en 2026 avec les IA ?`,
        description: $localize`:@@formations.audit-seo-diy.faq.item2.description:Oui, plus que jamais. Les IA (ChatGPT, Perplexity) citent les sites bien optimises. Le SEO 2026 = SEO classique + AEO (optimisation pour les moteurs de reponse).`,
      },
      {
        title: $localize`:@@formations.audit-seo-diy.faq.item3.title:Faut-il payer un outil comme Semrush ?`,
        description: $localize`:@@formations.audit-seo-diy.faq.item3.description:Pour une petite entreprise, non. Les 5 outils gratuits couverts ici suffisent. Semrush/Ahrefs deviennent utiles au-dela de 10 k visites/mois.`,
      },
    ],
    notes: $localize`:@@formations.audit-seo-diy.faq.notes:Ces 4 questions reviennent dans chaque conversation client. J'en parle avec transparence — pas de "ca depend" evasifs, des ordres de grandeur concrets.`,
  },
  {
    id: "audit-seo-diy-ancrer-synthese",
    act: ACTS.ancrer,
    fragmentCount: 0,
    layout: "cta",
    title: $localize`:@@formations.audit-seo-diy.synthese.title:Recevez le kit audit SEO DIY complet`,
    subtitle: $localize`:@@formations.audit-seo-diy.synthese.subtitle:Checklist imprimable + rapport type + liens directs vers les 5 outils + script pour parler SEO a votre developpeur.`,
    bullets: [
      $localize`:@@formations.audit-seo-diy.synthese.bullets.0:Checklist imprimable — 7 checks + colonne "OK/A corriger"`,
      $localize`:@@formations.audit-seo-diy.synthese.bullets.1:Rapport type Google Sheets a dupliquer pour vos clients ou vous-meme`,
      $localize`:@@formations.audit-seo-diy.synthese.bullets.2:Script "briefer un developpeur SEO" : les 5 questions non-techniques a poser`,
      $localize`:@@formations.audit-seo-diy.synthese.bullets.3:Alternative premium : audit guide via Growth Audit (IA + humain), sur le site`,
    ],
    notes: $localize`:@@formations.audit-seo-diy.synthese.notes:Deux chemins : DIY avec le kit gratuit, ou audit guide par notre outil Growth Audit (payant). Les deux sont honnetes — DIY couvre 80%, Growth Audit ajoute la profondeur.`,
  },
];
