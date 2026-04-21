import type {
  Act,
  PresentationSlide,
} from "../../../shared/models/slide.model";

// ============================================================
// Formation "Automatiser avec l'IA" — cible entrepreneurs non-tech
// Narration 4 actes : Accrocher → Montrer → Pratiquer → Ancrer
// Pattern slides ia-solopreneurs reutilise (layouts + interactions)
// ============================================================

const ACTS = {
  accrocher: {
    id: "auto-ia-accrocher",
    label: $localize`:@@formations.automatiser-avec-ia.act.accrocher:Accrocher`,
  } satisfies Act,
  montrer: {
    id: "auto-ia-montrer",
    label: $localize`:@@formations.automatiser-avec-ia.act.montrer:Montrer`,
  } satisfies Act,
  pratiquer: {
    id: "auto-ia-pratiquer",
    label: $localize`:@@formations.automatiser-avec-ia.act.pratiquer:Pratiquer`,
  } satisfies Act,
  ancrer: {
    id: "auto-ia-ancrer",
    label: $localize`:@@formations.automatiser-avec-ia.act.ancrer:Ancrer`,
  } satisfies Act,
};

export const AUTOMATISER_AVEC_IA_ACTS: Act[] = [
  ACTS.accrocher,
  ACTS.montrer,
  ACTS.pratiquer,
  ACTS.ancrer,
];

export const AUTOMATISER_AVEC_IA_SLIDES: PresentationSlide[] = [
  // ── ACTE 1 — ACCROCHER (3 slides) ──

  {
    id: "auto-ia-accroche",
    act: ACTS.accrocher,
    fragmentCount: 0,
    layout: "hero",
    imageUrl:
      "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200",
    imageAlt: $localize`:@@formations.automatiser-avec-ia.accroche.imageAlt:Entrepreneur concentre devant son ordinateur au milieu d'une journee de travail`,
    title: $localize`:@@formations.automatiser-avec-ia.accroche.title:Automatiser avec l'IA — sans coder, sans se perdre`,
    subtitle: $localize`:@@formations.automatiser-avec-ia.accroche.subtitle:5 workflows testes qui font gagner 2 heures par jour aux entrepreneurs et TPE`,
    speakerNotes: $localize`:@@formations.automatiser-avec-ia.accroche.speakerNotes:Demarrer par une question directe au public : "Combien de minutes par jour sur des taches repetitives (devis, factures, emails) ?"`,
    interactions: {
      scroll: [
        {
          type: "self-rating",
          question: $localize`:@@formations.automatiser-avec-ia.accroche.rating.question:Combien de temps par jour passez-vous sur des taches repetitives ?`,
          hint: $localize`:@@formations.automatiser-avec-ia.accroche.rating.hint:1 = moins de 30 min, 3 = plus de 2 heures. Votre reponse personnalise le toolkit que vous recevrez.`,
          min: 1,
          max: 3,
          labels: {
            min: $localize`:@@formations.automatiser-avec-ia.accroche.rating.labelMin:Peu`,
            max: $localize`:@@formations.automatiser-avec-ia.accroche.rating.labelMax:Beaucoup`,
          },
          profileField: "aiLevel",
        },
      ],
    },
  },
  {
    id: "auto-ia-constat",
    act: ACTS.accrocher,
    fragmentCount: 0,
    layout: "stats",
    title: $localize`:@@formations.automatiser-avec-ia.constat.title:Combien d'heures perdez-vous chaque semaine sur des taches automatisables ?`,
    stats: [
      {
        value: "13h",
        label: $localize`:@@formations.automatiser-avec-ia.constat.stats.0.label:par semaine en moyenne sur des taches automatisables (devis, emails, reseaux sociaux)`,
        source: $localize`:@@formations.automatiser-avec-ia.constat.stats.0.source:Enquete BPI France / OpinionWay, 2025`,
      },
      {
        value: "72%",
        label: $localize`:@@formations.automatiser-avec-ia.constat.stats.1.label:des dirigeants de TPE disent manquer de temps pour developper leur activite`,
        source: $localize`:@@formations.automatiser-avec-ia.constat.stats.1.source:CPME, barometre 2025`,
      },
      {
        value: "0 euro",
        label: $localize`:@@formations.automatiser-avec-ia.constat.stats.2.label:c'est le budget IA necessaire pour demarrer — les 5 workflows montres tournent sur du gratuit`,
        source: $localize`:@@formations.automatiser-avec-ia.constat.stats.2.source:Benchmark asilidesign.fr, 2026`,
      },
    ],
    speakerNotes: $localize`:@@formations.automatiser-avec-ia.constat.speakerNotes:Appuyer sur le chiffre "0 euro" — l'IA utile ne necessite pas d'abonnement au depart.`,
  },
  {
    id: "auto-ia-promesse",
    act: ACTS.accrocher,
    fragmentCount: 0,
    layout: "quote",
    title: $localize`:@@formations.automatiser-avec-ia.promesse.title:La promesse claire`,
    quote: $localize`:@@formations.automatiser-avec-ia.promesse.quote:A la fin de ces 25 minutes, vous aurez identifie au moins un workflow concret que vous lancerez cette semaine. Pas besoin de coder, pas besoin d'abonnement paye.`,
    quoteAuthor: $localize`:@@formations.automatiser-avec-ia.promesse.quoteAuthor:Tim Moyence — asilidesign.fr`,
    authorNote: $localize`:@@formations.automatiser-avec-ia.promesse.authorNote:Les exemples viennent de ma pratique quotidienne et de celle de clients reels (coachs, photographes, artisans, commercants).`,
  },

  // ── ACTE 2 — MONTRER (5 slides) ──

  {
    id: "auto-ia-w1-devis",
    act: ACTS.montrer,
    fragmentCount: 0,
    layout: "split",
    title: $localize`:@@formations.automatiser-avec-ia.w1.title:Workflow 1 — Generer un devis en 3 minutes`,
    subtitle: $localize`:@@formations.automatiser-avec-ia.w1.subtitle:ChatGPT + un template Word. Aucun compte pro requis.`,
    bullets: [
      $localize`:@@formations.automatiser-avec-ia.w1.bullets.0:Vous dictez a ChatGPT : "prestation X, duree Y, tarif horaire Z"`,
      $localize`:@@formations.automatiser-avec-ia.w1.bullets.1:L'IA produit un texte formel + un tableau recapitulatif`,
      $localize`:@@formations.automatiser-avec-ia.w1.bullets.2:Vous copiez dans votre template Word/Google Docs existant`,
      $localize`:@@formations.automatiser-avec-ia.w1.bullets.3:Gain mesure : de 25 min a 3 min par devis`,
    ],
    notes: $localize`:@@formations.automatiser-avec-ia.w1.notes:Cas verifie sur 3 activites testees : coach, photographe, artisan. Le prompt exact figure dans le toolkit PDF envoye par email.`,
  },
  {
    id: "auto-ia-w2-emails",
    act: ACTS.montrer,
    fragmentCount: 0,
    layout: "split",
    title: $localize`:@@formations.automatiser-avec-ia.w2.title:Workflow 2 — Reponses emails recurrentes`,
    subtitle: $localize`:@@formations.automatiser-avec-ia.w2.subtitle:Gmail + une bibliotheque de reponses pre-ecrites par l'IA.`,
    bullets: [
      $localize`:@@formations.automatiser-avec-ia.w2.bullets.0:Vous listez vos 5 questions clients les plus frequentes`,
      $localize`:@@formations.automatiser-avec-ia.w2.bullets.1:ChatGPT genere une reponse type personnalisable pour chaque`,
      $localize`:@@formations.automatiser-avec-ia.w2.bullets.2:Vous les enregistrez comme "reponses standard" dans Gmail`,
      $localize`:@@formations.automatiser-avec-ia.w2.bullets.3:Chaque email traite en 30 secondes au lieu de 5 minutes`,
    ],
    notes: $localize`:@@formations.automatiser-avec-ia.w2.notes:Attention : toujours relire avant d'envoyer. L'IA se trompe sur les specifics (prix, delais). Le toolkit donne la checklist de relecture.`,
  },
  {
    id: "auto-ia-w3-reseaux",
    act: ACTS.montrer,
    fragmentCount: 0,
    layout: "split",
    title: $localize`:@@formations.automatiser-avec-ia.w3.title:Workflow 3 — Publier sur les reseaux sans y penser`,
    subtitle: $localize`:@@formations.automatiser-avec-ia.w3.subtitle:Une seance de 30 min = un mois de contenu planifie.`,
    bullets: [
      $localize`:@@formations.automatiser-avec-ia.w3.bullets.0:Vous listez 4 themes de la semaine (une realisation, une astuce, un temoignage, un behind-the-scenes)`,
      $localize`:@@formations.automatiser-avec-ia.w3.bullets.1:ChatGPT produit 4 textes + 4 idees d'images`,
      $localize`:@@formations.automatiser-avec-ia.w3.bullets.2:Vous les programmez dans Buffer ou Metricool (gratuit jusqu'a 3 reseaux)`,
      $localize`:@@formations.automatiser-avec-ia.w3.bullets.3:Publication automatique, vous reprenez la main pour repondre aux commentaires`,
    ],
    notes: $localize`:@@formations.automatiser-avec-ia.w3.notes:Piege a eviter : le ton robotique. Le toolkit partage un prompt qui force l'IA a copier VOTRE style a partir de 3 posts existants.`,
  },
  {
    id: "auto-ia-w4-factures",
    act: ACTS.montrer,
    fragmentCount: 0,
    layout: "split",
    title: $localize`:@@formations.automatiser-avec-ia.w4.title:Workflow 4 — Extraire les donnees des factures`,
    subtitle: $localize`:@@formations.automatiser-avec-ia.w4.subtitle:ChatGPT Vision : vous photographiez, l'IA tape les lignes pour vous.`,
    bullets: [
      $localize`:@@formations.automatiser-avec-ia.w4.bullets.0:Vous glissez une photo de facture dans ChatGPT (version gratuite avec limite quotidienne)`,
      $localize`:@@formations.automatiser-avec-ia.w4.bullets.1:L'IA retourne un tableau avec montant HT, TVA, TTC, date, fournisseur`,
      $localize`:@@formations.automatiser-avec-ia.w4.bullets.2:Copie-colle dans votre tableur / logiciel de compta`,
      $localize`:@@formations.automatiser-avec-ia.w4.bullets.3:15 factures traitees en 10 minutes au lieu d'une heure`,
    ],
    notes: $localize`:@@formations.automatiser-avec-ia.w4.notes:Limite a connaitre : toujours verifier le chiffre TTC, l'IA peut decaler une virgule. Le toolkit donne le prompt qui reduit ce risque.`,
  },
  {
    id: "auto-ia-w5-veille",
    act: ACTS.montrer,
    fragmentCount: 0,
    layout: "split",
    title: $localize`:@@formations.automatiser-avec-ia.w5.title:Workflow 5 — Veille hebdo automatique`,
    subtitle: $localize`:@@formations.automatiser-avec-ia.w5.subtitle:Recevez chaque lundi un resume des nouveautes de votre secteur.`,
    bullets: [
      $localize`:@@formations.automatiser-avec-ia.w5.bullets.0:Vous definissez 3 sujets cles (ex : "reglementation artisan BTP", "nouvelles aides BPI")`,
      $localize`:@@formations.automatiser-avec-ia.w5.bullets.1:Perplexity.ai fait la recherche web live et cite ses sources`,
      $localize`:@@formations.automatiser-avec-ia.w5.bullets.2:Vous enregistrez la conversation comme "veille hebdo"`,
      $localize`:@@formations.automatiser-avec-ia.w5.bullets.3:5 minutes le lundi = vous etes a jour sur toute la semaine`,
    ],
    notes: $localize`:@@formations.automatiser-avec-ia.w5.notes:Perplexity est gratuit avec une limite quotidienne confortable. Pas besoin de compte payant pour la majorite des entrepreneurs.`,
  },

  // ── ACTE 3 — PRATIQUER (2 slides) ──

  {
    id: "auto-ia-par-ou-commencer",
    act: ACTS.pratiquer,
    fragmentCount: 0,
    layout: "grid",
    title: $localize`:@@formations.automatiser-avec-ia.pratiquer.title:Par ou commencer selon votre metier ?`,
    gridItems: [
      {
        title: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.0.title:Photographe`,
        description: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.0.description:Commencer par le workflow devis (W1). Chaque shooting a un cahier des charges similaire — l'IA economise 20 min par demande client.`,
      },
      {
        title: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.1.title:Coach / Consultant`,
        description: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.1.description:Workflow reseaux sociaux (W3). Capitaliser sur les notes de seances pour generer des posts authentiques sans y passer le week-end.`,
      },
      {
        title: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.2.title:Artisan / BTP`,
        description: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.2.description:Workflow factures (W4) + veille reglementaire (W5). Deux heures gagnees par semaine sur l'administratif et les normes.`,
      },
      {
        title: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.3.title:Commerce de proximite`,
        description: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.3.description:Workflow emails (W2) + reseaux (W3). Maintenir la relation clientele a frequence constante sans exploser le temps passe.`,
      },
      {
        title: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.4.title:Conseil B2B`,
        description: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.4.description:Workflow devis (W1) + veille (W5). Reponse sous 24h aux appels d'offres, veille pour nourrir les propositions.`,
      },
      {
        title: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.5.title:Association / Solopreneur`,
        description: $localize`:@@formations.automatiser-avec-ia.pratiquer.items.5.description:Tous les workflows en sequence : commencer par W2 (emails), le plus vite rentable. Puis W3, W1, W4, W5.`,
      },
    ],
    speakerNotes: $localize`:@@formations.automatiser-avec-ia.pratiquer.speakerNotes:Demander au public : "Qui se reconnait dans l'un de ces profils ?". Ajuster le temps passe sur le workflow correspondant.`,
  },
  {
    id: "auto-ia-declencheur",
    act: ACTS.pratiquer,
    fragmentCount: 0,
    layout: "cta",
    title: $localize`:@@formations.automatiser-avec-ia.declencheur.title:Quelle action concrete lancez-vous cette semaine ?`,
    subtitle: $localize`:@@formations.automatiser-avec-ia.declencheur.subtitle:Recevez les 5 workflows complets (prompts + captures d'ecran par secteur) + mon email de support direct`,
    bullets: [
      $localize`:@@formations.automatiser-avec-ia.declencheur.bullets.0:PDF 12 pages avec captures d'ecran par etape`,
      $localize`:@@formations.automatiser-avec-ia.declencheur.bullets.1:Prompts prets a copier-coller, testes en conditions reelles`,
      $localize`:@@formations.automatiser-avec-ia.declencheur.bullets.2:Sequence email 5 jours : un workflow detaille chaque jour, zero teasing`,
      $localize`:@@formations.automatiser-avec-ia.declencheur.bullets.3:Repondez a n'importe quel email — je lis tout, sans bot`,
    ],
  },

  // ── ACTE 4 — ANCRER (3 slides) ──

  {
    id: "auto-ia-erreurs",
    act: ACTS.ancrer,
    fragmentCount: 0,
    layout: "comparison",
    title: $localize`:@@formations.automatiser-avec-ia.erreurs.title:Pourquoi certains workflows IA echouent : 5 erreurs evitables`,
    table: {
      headers: [
        $localize`:@@formations.automatiser-avec-ia.erreurs.headers.0:Ce qui fonctionne`,
        $localize`:@@formations.automatiser-avec-ia.erreurs.headers.1:A eviter au depart`,
      ],
      rows: [
        [
          $localize`:@@formations.automatiser-avec-ia.erreurs.rows.0.0:Automatiser 1 tache a la fois, mesurer, puis en ajouter`,
          $localize`:@@formations.automatiser-avec-ia.erreurs.rows.0.1:Vouloir tout automatiser en une semaine — abandon garanti`,
        ],
        [
          $localize`:@@formations.automatiser-avec-ia.erreurs.rows.1.0:Relire systematiquement avant d'envoyer au client`,
          $localize`:@@formations.automatiser-avec-ia.erreurs.rows.1.1:Confier des emails sensibles a l'IA sans relecture`,
        ],
        [
          $localize`:@@formations.automatiser-avec-ia.erreurs.rows.2.0:Outils gratuits en phase de test (ChatGPT, Perplexity, Buffer free)`,
          $localize`:@@formations.automatiser-avec-ia.erreurs.rows.2.1:Payer un abonnement avant d'avoir valide le workflow`,
        ],
        [
          $localize`:@@formations.automatiser-avec-ia.erreurs.rows.3.0:Personnaliser l'IA avec VOS exemples (3 emails, 3 posts)`,
          $localize`:@@formations.automatiser-avec-ia.erreurs.rows.3.1:Accepter le ton robotique par defaut — on perd la personnalite`,
        ],
      ],
    },
  },
  {
    id: "auto-ia-faq-rapide",
    act: ACTS.ancrer,
    fragmentCount: 0,
    layout: "grid",
    title: $localize`:@@formations.automatiser-avec-ia.faq.title:3 questions qui reviennent`,
    gridItems: [
      {
        title: $localize`:@@formations.automatiser-avec-ia.faq.items.0.title:Et si l'IA se trompe ?`,
        description: $localize`:@@formations.automatiser-avec-ia.faq.items.0.description:Elle se trompe, c'est une donnee. Chaque workflow contient une etape de relecture explicite. La regle : l'IA accelere, vous validez.`,
      },
      {
        title: $localize`:@@formations.automatiser-avec-ia.faq.items.1.title:Mes donnees sont-elles reutilisees ?`,
        description: $localize`:@@formations.automatiser-avec-ia.faq.items.1.description:Oui par defaut. Le toolkit indique comment desactiver l'entrainement sur vos echanges (ChatGPT, Perplexity) en 2 clics. RGPD OK.`,
      },
      {
        title: $localize`:@@formations.automatiser-avec-ia.faq.items.2.title:Faut-il apprendre a coder ?`,
        description: $localize`:@@formations.automatiser-avec-ia.faq.items.2.description:Non. Zero ligne de code, zero API, zero webhook. Tout passe par des interfaces graphiques standards — si vous savez utiliser Word et Gmail, vous savez deja.`,
      },
    ],
  },
  {
    id: "auto-ia-synthese",
    act: ACTS.ancrer,
    fragmentCount: 0,
    layout: "cta",
    title: $localize`:@@formations.automatiser-avec-ia.synthese.title:La prochaine etape concrete`,
    subtitle: $localize`:@@formations.automatiser-avec-ia.synthese.subtitle:Choisissez 1 workflow ci-dessus, testez-le cette semaine sur une seule tache reelle. Repondez a l'email de bienvenue pour que je vous aide a calibrer.`,
    bullets: [
      $localize`:@@formations.automatiser-avec-ia.synthese.bullets.0:Aujourd'hui : telecharger le toolkit PDF + lire le workflow adapte a votre metier`,
      $localize`:@@formations.automatiser-avec-ia.synthese.bullets.1:Cette semaine : tester sur 1 tache reelle (pas 5, pas 10 — une seule)`,
      $localize`:@@formations.automatiser-avec-ia.synthese.bullets.2:Dans 7 jours : mesurer le temps gagne vs la methode manuelle`,
      $localize`:@@formations.automatiser-avec-ia.synthese.bullets.3:Si ca marche : automatiser la 2e tache. Sinon : me repondre, on ajuste ensemble.`,
    ],
  },
];
