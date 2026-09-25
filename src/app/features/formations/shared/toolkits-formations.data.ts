import type { ToolkitGatePageData } from './toolkit-gate-page.model';

export type ToolkitFormation = 'ia-solo' | 'automatiser-avec-ia' | 'audit-seo-diy';

export const TOOLKITS_FORMATIONS: Readonly<Record<ToolkitFormation, ToolkitGatePageData>> = {
  'ia-solo': {
    lead: $localize`:@@formations.toolkit.subtitle:Un kit de démarrage concret, offert. De quoi vous faire une idée juste — et passer à l'action dès aujourd'hui.`,
    items: [
      {
        label: $localize`:@@formations.toolkit.item1:30 prompts prêts à l'emploi, classés par usage`,
      },
      {
        label: $localize`:@@formations.toolkit.item2:Une checklist d'automatisation pas-à-pas`,
      },
      {
        label: $localize`:@@formations.toolkit.item3:Un mini-guide « par où commencer »`,
      },
    ],
    foot: $localize`:@@formations.toolkit.foot:Gratuit, sans engagement. Désinscription en un clic. Vos données restent confidentielles.`,
    contentsTitle: $localize`:@@formations.toolkit.contentsTitle:Ce que contient le toolkit`,
    contents: [
      $localize`:@@formations.toolkit.content1:16 outils IA sélectionnés pour la génération de contenu, l'automatisation marketing, la création visuelle, la prospection commerciale et le support client — avec une fiche comparative pour chacun.`,
      $localize`:@@formations.toolkit.content2:Les budgets mensuels estimés par tier d'usage (solo, équipe, agence) pour dimensionner votre stack IA sans surpayer — typiquement 30 à 150 € / mois pour un solopreneur.`,
      $localize`:@@formations.toolkit.content3:3 workflows concrets clé en main : rédaction de newsletters hebdo, réponse client multilingue, création de visuels LinkedIn — chacun avec prompt, outil recommandé et temps gagné.`,
      $localize`:@@formations.toolkit.content4:Les pièges à éviter : outils payants qui ne tiennent pas leurs promesses, RGPD sur les données, hallucinations IA sur la partie juridique et comptable.`,
    ],
    faqTitle: $localize`:@@formations.toolkit.faqTitle:Questions fréquentes`,
    faq: [
      {
        question: $localize`:@@formations.toolkit.faq1Q:À qui s'adresse ce toolkit ?`,
        answer: $localize`:@@formations.toolkit.faq1A:Aux solopreneurs, freelances et indépendants qui veulent gagner du temps sans se noyer dans les dizaines d'outils IA qui sortent chaque semaine. Niveau requis : zéro — les fiches expliquent pas à pas.`,
      },
      {
        question: $localize`:@@formations.toolkit.faq2Q:Pourquoi le toolkit est gratuit ?`,
        answer: $localize`:@@formations.toolkit.faq2A:Parce que c'est une version condensée des formations que je vends en intra-entreprise. L'objectif est de démontrer la qualité du travail avant de proposer un accompagnement sur-mesure, si vous en avez besoin.`,
      },
      {
        question: $localize`:@@formations.toolkit.faq3Q:Comment le recevoir ?`,
        answer: $localize`:@@formations.toolkit.faq3A:Laissez votre email dans le formulaire ci-dessus. Vous recevrez le PDF du toolkit dans la minute. Aucune newsletter automatique, aucun follow-up marketing : c'est promis, et conforme RGPD.`,
      },
    ],
    brand: $localize`:@@formations.toolkit.brand:Asili Design — asilidesign.fr`,
    privacyLabel: $localize`:@@formations.toolkit.privacyLink:Politique de confidentialité`,
  },
  'automatiser-avec-ia': {
    lead: $localize`:@@formations.auto.toolkit.subtitle:Les cinq workflows testés de la formation — avec les prompts exacts, les pièges à éviter et la checklist de relecture — livrés en PDF dans votre boîte mail en 30 secondes. Gratuit, sans engagement.`,
    items: [
      {
        label: $localize`:@@formations.auto.toolkit.item1:5 workflows complets : devis, emails, réseaux, factures, veille`,
      },
      {
        label: $localize`:@@formations.auto.toolkit.item2:La checklist de relecture en une minute`,
      },
      {
        label: $localize`:@@formations.auto.toolkit.item3:Le tableau de bord « temps gagné » pré-rempli`,
      },
    ],
    foot: $localize`:@@formations.auto.toolkit.foot:Gratuit, sans engagement. Désinscription en un clic. Vos données restent confidentielles.`,
    contentsTitle: $localize`:@@formations.auto.toolkit.contentsTitle:Ce que contient le toolkit`,
    contents: [
      $localize`:@@formations.auto.toolkit.content1:Les 5 workflows complets avec le prompt exact, le résultat attendu et la durée pour le mettre en place — devis, emails, réseaux sociaux, factures, veille.`,
      $localize`:@@formations.auto.toolkit.content2:La checklist de relecture en une minute — les 6 points à vérifier avant d'envoyer un contenu généré par l'IA à un client ou un prospect.`,
      $localize`:@@formations.auto.toolkit.content3:Le tableau de bord "temps gagné" — une feuille Google Docs pré-remplie pour mesurer le retour sur investissement de chaque workflow sur 4 semaines.`,
      $localize`:@@formations.auto.toolkit.content4:Les alternatives gratuites aux outils payants — pour chaque workflow, les options zéro euro qui tiennent la route en 2026 et celles à éviter.`,
    ],
    faqTitle: $localize`:@@formations.auto.toolkit.faqTitle:Questions fréquentes`,
    faq: [
      {
        question: $localize`:@@formations.auto.toolkit.faq1Q:Les workflows fonctionnent-ils sans outil payant ?`,
        answer: $localize`:@@formations.auto.toolkit.faq1A:Oui. Les 5 workflows tournent entièrement sur les versions gratuites de ChatGPT, Perplexity, Buffer et Google Docs. Le toolkit indique quand un outil payant apporte un gain réel et quand c'est un achat inutile.`,
      },
      {
        question: $localize`:@@formations.auto.toolkit.faq2Q:Faut-il avoir suivi la formation pour utiliser le toolkit ?`,
        answer: $localize`:@@formations.auto.toolkit.faq2A:Non. Le PDF est autonome — chaque workflow est documenté étape par étape avec captures d'écran. La formation ajoute le contexte et les explications, le toolkit donne les instructions pratiques directement copiables.`,
      },
      {
        question: $localize`:@@formations.auto.toolkit.faq3Q:Comment recevoir le toolkit ?`,
        answer: $localize`:@@formations.auto.toolkit.faq3A:Laissez votre email dans le formulaire. Vous recevrez le PDF dans la minute. Aucune newsletter automatique, aucun suivi marketing — conforme RGPD.`,
      },
    ],
    brand: $localize`:@@formations.auto.toolkit.brand:Asili Design — asilidesign.fr`,
    privacyLabel: $localize`:@@formations.auto.toolkit.privacyLink:Politique de confidentialité`,
  },
  'audit-seo-diy': {
    lead: $localize`:@@formations.audit-seo.toolkit.subtitle:Les 7 checks SEO de la formation — avec les liens directs vers les 5 outils gratuits, le template de rapport à imprimer et le script pour briefer un développeur — livrés en PDF dans votre boîte mail en 30 secondes. Gratuit, sans engagement.`,
    items: [
      {
        label: $localize`:@@formations.audit-seo.toolkit.item1:La checklist imprimable des 7 points à vérifier`,
      },
      {
        label: $localize`:@@formations.audit-seo.toolkit.item2:Le template de rapport d'audit sur une page A4`,
      },
      {
        label: $localize`:@@formations.audit-seo.toolkit.item3:Les 5 outils SEO gratuits avec liens directs`,
      },
    ],
    foot: $localize`:@@formations.audit-seo.toolkit.foot:Gratuit, sans engagement. Désinscription en un clic. Vos données restent confidentielles.`,
    contentsTitle: $localize`:@@formations.audit-seo.toolkit.contentsTitle:Ce que contient le toolkit`,
    contents: [
      $localize`:@@formations.audit-seo.toolkit.content1:La checklist imprimable des 7 points à vérifier — indexation, titres, vitesse, mobile, contenu, questions-réponses, signaux AEO — avec colonne OK / à corriger / urgent à cocher.`,
      $localize`:@@formations.audit-seo.toolkit.content2:Le template de rapport d'audit sur une page A4 au format Google Sheets dupliquable — 3 colonnes (check, verdict, action) prêtes à remplir pour vos clients ou votre propre site.`,
      $localize`:@@formations.audit-seo.toolkit.content3:Les 5 outils SEO gratuits avec liens directs et mode d'emploi commenté — Google Search Console, PageSpeed Insights, Bing Webmaster, Ahrefs Webmaster Tools, SEO Meta in 1 Click.`,
      $localize`:@@formations.audit-seo.toolkit.content4:Le script "briefer un développeur" — les 5 questions non-techniques à poser pour faire corriger les problèmes SEO sans être baladé(e) par un jargon incompréhensible.`,
    ],
    faqTitle: $localize`:@@formations.audit-seo.toolkit.faqTitle:Questions fréquentes`,
    faq: [
      {
        question: $localize`:@@formations.audit-seo.toolkit.faq1Q:Puis-je faire cet audit sans compétence technique ?`,
        answer: $localize`:@@formations.audit-seo.toolkit.faq1A:Oui entièrement. Chaque check utilise Google directement ou des outils avec un formulaire. Aucun terminal, aucun code. Si vous savez faire une recherche Google, vous savez lire le verdict de chaque outil présenté dans le toolkit.`,
      },
      {
        question: $localize`:@@formations.audit-seo.toolkit.faq2Q:Combien de temps pour voir des résultats SEO ?`,
        answer: $localize`:@@formations.audit-seo.toolkit.faq2A:Les corrections techniques (indexation, vitesse) produisent des effets visibles en 2 à 4 semaines. Les améliorations de contenu prennent 3 à 6 mois pour grimper dans les résultats. SEO = marathon, pas sprint.`,
      },
      {
        question: $localize`:@@formations.audit-seo.toolkit.faq3Q:Comment recevoir le toolkit ?`,
        answer: $localize`:@@formations.audit-seo.toolkit.faq3A:Laissez votre email dans le formulaire. Vous recevrez le PDF dans la minute. Aucune newsletter automatique, aucun suivi marketing — conforme RGPD.`,
      },
    ],
    brand: $localize`:@@formations.audit-seo.toolkit.brand:Asili Design — asilidesign.fr`,
    privacyLabel: $localize`:@@formations.audit-seo.toolkit.privacyLink:Politique de confidentialité`,
  },
};
