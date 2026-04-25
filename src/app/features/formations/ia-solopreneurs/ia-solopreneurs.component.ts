import { ChangeDetectionStrategy, Component } from "@angular/core";
import {
  type ComparisonColumn,
  SlideComponent,
  SlideComparisonComponent,
  SlideCtaComponent,
  SlideDeckComponent,
  SlideGridComponent,
  SlideHeroComponent,
  SlideImageLeftComponent,
  SlideImageRightComponent,
  SlidePollComponent,
  SlideQuizComponent,
  SlideQuoteComponent,
  SlideStatsComponent,
  SlideTableComponent,
} from "../../../shared/slides";

/**
 * Page de la formation "L'IA au service des solopreneurs".
 *
 * Composant slide-driven : chaque slide est explicitement declaree dans
 * le template. Le contenu est integralement transpose depuis l'ancien
 * `ia-solopreneurs.data.ts` (BIG BANG migration Task 19).
 */
@Component({
  selector: "app-ia-solopreneurs",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SlideDeckComponent,
    SlideComponent,
    SlideHeroComponent,
    SlideImageLeftComponent,
    SlideImageRightComponent,
    SlideStatsComponent,
    SlideGridComponent,
    SlideComparisonComponent,
    SlideQuoteComponent,
    SlideQuizComponent,
    SlidePollComponent,
    SlideCtaComponent,
    SlideTableComponent,
  ],
  templateUrl: "./ia-solopreneurs.component.html",
  styleUrl: "./ia-solopreneurs.component.scss",
})
export class IaSolopreneursComponent {
  /** Bullets slide "promesse" — rendus en colonne dans le hero. */
  protected readonly promesseBullets = [
    $localize`:@@ia-solo.promesse.bullets.0:Tour d'horizon des outils qui comptent`,
    $localize`:@@ia-solo.promesse.bullets.1:Ce qui marche vraiment au quotidien`,
    $localize`:@@ia-solo.promesse.bullets.2:Un exercice pratique, vous repartez avec un résultat`,
  ];

  /** Stats slide "probleme". */
  protected readonly problemeStats = [
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
  ];

  /** Recap stats slide "recap-8020". */
  protected readonly recap8020Stats = [
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
  ];

  /** Slide "clients" — cycle client complet. */
  protected readonly clientsItems = [
    {
      title: "Waalaxy",
      description: $localize`:@@ia-solo.clients.grid.0.description:Prospection LinkedIn automatisée. 300 invitations/mois, follow-up auto, détection de réponses. (Prospecter — 19€/mois)`,
    },
    {
      title: "Notion AI",
      description: $localize`:@@ia-solo.clients.grid.1.description:CRM léger + pipeline visuel + agents custom qui bossent sur votre workspace 24/7. (Convertir — 10$/mois)`,
    },
    {
      title: "Brevo",
      description: $localize`:@@ia-solo.clients.grid.2.description:Email marketing IA, français, RGPD-friendly. Séquences automatisées. 300 emails/jour gratuits. (Fidéliser — Gratuit)`,
    },
    {
      title: "Canva AI",
      description: $localize`:@@ia-solo.clients.grid.3.description:Visuels pro pour vos emails, posts, newsletters. 220M+ d'utilisateurs. Le design sans designer. (Communiquer — Gratuit)`,
    },
  ];

  /** Slide "workflows-detail". */
  protected readonly workflowsItems = [
    {
      title: $localize`:@@ia-solo.workflows-detail.grid.0.title:Prospection automatisée`,
      description: $localize`:@@ia-solo.workflows-detail.grid.0.description:Waalaxy capte le lead LinkedIn → Zapier/Make crée la fiche Notion → Brevo envoie l'email de bienvenue → Rappel calendrier auto (Make + Brevo)`,
    },
    {
      title: $localize`:@@ia-solo.workflows-detail.grid.1.title:Contenu multicanal`,
      description: $localize`:@@ia-solo.workflows-detail.grid.1.description:Post LinkedIn rédigé avec Claude → visuel Canva AI → Zapier reposte sur X + archive dans Google Sheet + notification Slack (Zapier + Claude)`,
    },
    {
      title: $localize`:@@ia-solo.workflows-detail.grid.2.title:Veille automatique`,
      description: $localize`:@@ia-solo.workflows-detail.grid.2.description:Perplexity recherche quotidienne sur votre secteur → résumé dans Notion → NotebookLM génère un brief audio de 5 min (Perplexity + NotebookLM)`,
    },
  ];

  /** Slide "pieges". */
  protected readonly piegesItems = [
    {
      title: $localize`:@@ia-solo.pieges.grid.0.title:Hallucinations`,
      description: $localize`:@@ia-solo.pieges.grid.0.description:L'IA invente des faits avec assurance. Vérifiez toujours les chiffres, les citations, les liens. Perplexity aide — il cite ses sources. (Vérifiez)`,
    },
    {
      title: $localize`:@@ia-solo.pieges.grid.1.title:RGPD`,
      description: $localize`:@@ia-solo.pieges.grid.1.description:Ne mettez JAMAIS de données personnelles clients dans un prompt. Pas de noms, pas d'emails, pas de numéros. Les conditions d'utilisation vous le disent. (Protégez)`,
    },
    {
      title: $localize`:@@ia-solo.pieges.grid.2.title:Dépendance`,
      description: $localize`:@@ia-solo.pieges.grid.2.description:L'IA amplifie votre expertise, elle ne la remplace pas. Si vous ne savez pas écrire un bon brief, ChatGPT ne le saura pas pour vous. (Gardez le contrôle)`,
    },
  ];

  /** Comparison slide "chat-produire" — gauche ChatGPT vs droite Claude. */
  protected readonly chatGptItems = [
    $localize`:@@ia-solo.chat-produire.cgpt.0:Polyvalent, 900M users/sem, GPT Store`,
    $localize`:@@ia-solo.chat-produire.cgpt.1:Idéal pour brainstorm, code, analyse de données`,
    $localize`:@@ia-solo.chat-produire.cgpt.2:Gratuit / 20$/mois (Plus)`,
  ];

  protected readonly claudeItems = [
    $localize`:@@ia-solo.chat-produire.claude.0:N°1 rédaction, 1M tokens de contexte`,
    $localize`:@@ia-solo.chat-produire.claude.1:Idéal pour rédaction pro, contrats, docs longs`,
    $localize`:@@ia-solo.chat-produire.claude.2:Gratuit / 20$/mois (Pro)`,
  ];

  protected readonly geminiItems = [
    $localize`:@@ia-solo.chat-produire.gemini.0:Branché Google Workspace, analyse vidéo native`,
    $localize`:@@ia-solo.chat-produire.gemini.1:Idéal pour Gmail/Drive/Agenda + résumé vidéo YouTube`,
    $localize`:@@ia-solo.chat-produire.gemini.2:Gratuit / 20$/mois (Advanced)`,
  ];

  /** Comparison slide "automatiser" — Zapier vs Make vs n8n. */
  protected readonly zapierItems = [
    $localize`:@@ia-solo.automatiser.zapier.0:Difficulté : facile`,
    $localize`:@@ia-solo.automatiser.zapier.1:Gratuit (100 tâches/mois)`,
    $localize`:@@ia-solo.automatiser.zapier.2:Branchez deux apps en 5 min, ça tourne tout seul`,
  ];

  protected readonly makeItems = [
    $localize`:@@ia-solo.automatiser.make.0:Difficulté : moyen`,
    $localize`:@@ia-solo.automatiser.make.1:9€/mois (10K opérations)`,
    $localize`:@@ia-solo.automatiser.make.2:Plus flexible que Zapier, scénarios visuels complexes`,
  ];

  protected readonly n8nItems = [
    $localize`:@@ia-solo.automatiser.n8n.0:Open source self-hosted, valorisé 2,5Md$`,
    $localize`:@@ia-solo.automatiser.n8n.1:Idéal pour devs qui veulent contrôle total + MCP`,
    $localize`:@@ia-solo.automatiser.n8n.2:Gratuit (self-host) / 24€/mois (cloud)`,
  ];

  /** Comparison slide "stack-budget" — Débutant 0€ vs Intermédiaire 60€ vs Avancé 120€. */
  protected readonly stackBudgetDebutantItems = [
    $localize`:@@ia-solo.stack-budget.debutant.0:ChatGPT gratuit + Canva gratuit + Gamma`,
    $localize`:@@ia-solo.stack-budget.debutant.1:Zapier (100 tâches) + Brevo + NotebookLM`,
    $localize`:@@ia-solo.stack-budget.debutant.2:Budget : 0€/mois — couvre 80% des besoins`,
  ];

  protected readonly stackBudgetIntermediaireItems = [
    $localize`:@@ia-solo.stack-budget.intermediaire.0:ChatGPT Plus (20€) + Canva Pro (12€)`,
    $localize`:@@ia-solo.stack-budget.intermediaire.1:Make.com (9€) + Notion AI (10€)`,
    $localize`:@@ia-solo.stack-budget.intermediaire.2:Perplexity Pro (20€) — total ~70€/mois`,
  ];

  protected readonly stackBudgetAvanceItems = [
    $localize`:@@ia-solo.stack-budget.avance.0:Claude Pro (20$) + ChatGPT Plus (20$)`,
    $localize`:@@ia-solo.stack-budget.avance.1:Make Pro (16€) + ElevenLabs (22$)`,
    $localize`:@@ia-solo.stack-budget.avance.2:Fathom (19$) + Waalaxy (19€) — ~120€/mois`,
  ];

  /** Lignes du tableau récap "outils-detail" — 16 outils en mode scroll. */
  protected readonly outilsDetailHeaders = [
    $localize`:@@ia-solo.outils-detail.headers.tool:Outil`,
    $localize`:@@ia-solo.outils-detail.headers.category:Catégorie`,
    $localize`:@@ia-solo.outils-detail.headers.price:Prix`,
    $localize`:@@ia-solo.outils-detail.headers.tagline:Tagline`,
  ];

  protected readonly outilsDetailRows = [
    {
      tool: "NotebookLM",
      category: $localize`:@@ia-solo.outils-detail.cat.apprendre:Apprendre`,
      price: $localize`:@@ia-solo.outils-detail.row.0.price:Gratuit`,
      tagline: $localize`:@@ia-solo.outils-detail.row.0.tagline:PDF → podcast en 47 secondes`,
    },
    {
      tool: "Perplexity",
      category: $localize`:@@ia-solo.outils-detail.cat.apprendre:Apprendre`,
      price: $localize`:@@ia-solo.outils-detail.row.1.price:Gratuit / 20$/mois`,
      tagline: $localize`:@@ia-solo.outils-detail.row.1.tagline:Recherche IA sourcée, 100M+ users/mois`,
    },
    {
      tool: "Fathom",
      category: $localize`:@@ia-solo.outils-detail.cat.apprendre:Apprendre`,
      price: $localize`:@@ia-solo.outils-detail.row.2.price:Gratuit (limité) / 19$/mois`,
      tagline: $localize`:@@ia-solo.outils-detail.row.2.tagline:Notes de réunion automatiques`,
    },
    {
      tool: "ChatGPT",
      category: $localize`:@@ia-solo.outils-detail.cat.produire:Produire`,
      price: $localize`:@@ia-solo.outils-detail.row.3.price:Gratuit / 20$/mois`,
      tagline: $localize`:@@ia-solo.outils-detail.row.3.tagline:Le couteau suisse, 900M users/semaine`,
    },
    {
      tool: "Claude",
      category: $localize`:@@ia-solo.outils-detail.cat.produire:Produire`,
      price: $localize`:@@ia-solo.outils-detail.row.4.price:Gratuit / 20$/mois`,
      tagline: $localize`:@@ia-solo.outils-detail.row.4.tagline:N°1 rédaction, 1M tokens de contexte`,
    },
    {
      tool: "Gemini",
      category: $localize`:@@ia-solo.outils-detail.cat.produire:Produire`,
      price: $localize`:@@ia-solo.outils-detail.row.5.price:Gratuit / 20$/mois`,
      tagline: $localize`:@@ia-solo.outils-detail.row.5.tagline:Branché Google Workspace, analyse vidéo`,
    },
    {
      tool: "Ideogram",
      category: $localize`:@@ia-solo.outils-detail.cat.creer:Créer`,
      price: $localize`:@@ia-solo.outils-detail.row.6.price:Gratuit (10/jour)`,
      tagline: $localize`:@@ia-solo.outils-detail.row.6.tagline:Images avec texte lisible, imbattable`,
    },
    {
      tool: "Gamma",
      category: $localize`:@@ia-solo.outils-detail.cat.creer:Créer`,
      price: $localize`:@@ia-solo.outils-detail.row.7.price:Gratuit / 10$/mois`,
      tagline: $localize`:@@ia-solo.outils-detail.row.7.tagline:Présentation complète en 60 secondes`,
    },
    {
      tool: "ElevenLabs",
      category: $localize`:@@ia-solo.outils-detail.cat.creer:Créer`,
      price: $localize`:@@ia-solo.outils-detail.row.8.price:Gratuit / 5$/mois`,
      tagline: $localize`:@@ia-solo.outils-detail.row.8.tagline:Clonage vocal, valorisé 11Md$`,
    },
    {
      tool: "Zapier",
      category: $localize`:@@ia-solo.outils-detail.cat.automatiser:Automatiser`,
      price: $localize`:@@ia-solo.outils-detail.row.9.price:Gratuit (100 tâches)`,
      tagline: $localize`:@@ia-solo.outils-detail.row.9.tagline:Branchez deux apps en 5 min`,
    },
    {
      tool: "Make.com",
      category: $localize`:@@ia-solo.outils-detail.cat.automatiser:Automatiser`,
      price: $localize`:@@ia-solo.outils-detail.row.10.price:9€/mois`,
      tagline: $localize`:@@ia-solo.outils-detail.row.10.tagline:Scénarios visuels, 10K opérations`,
    },
    {
      tool: "n8n",
      category: $localize`:@@ia-solo.outils-detail.cat.automatiser:Automatiser`,
      price: $localize`:@@ia-solo.outils-detail.row.11.price:Gratuit (self-hosted)`,
      tagline: $localize`:@@ia-solo.outils-detail.row.11.tagline:Open source, illimité, pour les bidouilleurs`,
    },
    {
      tool: "Waalaxy",
      category: $localize`:@@ia-solo.outils-detail.cat.clients:Clients`,
      price: $localize`:@@ia-solo.outils-detail.row.12.price:19€/mois`,
      tagline: $localize`:@@ia-solo.outils-detail.row.12.tagline:Prospection LinkedIn automatisée`,
    },
    {
      tool: "Notion AI",
      category: $localize`:@@ia-solo.outils-detail.cat.clients:Clients`,
      price: $localize`:@@ia-solo.outils-detail.row.13.price:10$/mois`,
      tagline: $localize`:@@ia-solo.outils-detail.row.13.tagline:CRM léger + agents custom`,
    },
    {
      tool: "Brevo",
      category: $localize`:@@ia-solo.outils-detail.cat.clients:Clients`,
      price: $localize`:@@ia-solo.outils-detail.row.14.price:Gratuit (300/jour)`,
      tagline: $localize`:@@ia-solo.outils-detail.row.14.tagline:Email marketing IA, français, RGPD`,
    },
    {
      tool: "Canva AI",
      category: $localize`:@@ia-solo.outils-detail.cat.clients:Clients`,
      price: $localize`:@@ia-solo.outils-detail.row.15.price:Gratuit / 15$/mois`,
      tagline: $localize`:@@ia-solo.outils-detail.row.15.tagline:Visuels pro, 220M+ utilisateurs`,
    },
  ];

  /** Colonnes de comparaison "chat-produire" (ChatGPT, Claude, Gemini). */
  protected readonly chatProduireColumns: ComparisonColumn[] = [
    {
      label: $localize`:@@ia-solo.chat-produire.left:ChatGPT (OpenAI)`,
      tone: "info",
      items: this.chatGptItems,
    },
    {
      label: $localize`:@@ia-solo.chat-produire.right:Claude (Anthropic)`,
      tone: "success",
      items: this.claudeItems,
    },
    {
      label: $localize`:@@ia-solo.chat-produire.gemini.label:Gemini (Google)`,
      tone: "warning",
      items: this.geminiItems,
    },
  ];

  /** Colonnes de comparaison "automatiser" (Zapier, Make, n8n). */
  protected readonly automatiserColumns: ComparisonColumn[] = [
    {
      label: $localize`:@@ia-solo.automatiser.zapier.label:Zapier`,
      tone: "info",
      items: this.zapierItems,
    },
    {
      label: $localize`:@@ia-solo.automatiser.make.label:Make.com`,
      tone: "warning",
      items: this.makeItems,
    },
    {
      label: $localize`:@@ia-solo.automatiser.n8n.label:n8n`,
      tone: "success",
      items: this.n8nItems,
    },
  ];

  /** Colonnes de comparaison "stack-budget" (debutant 0€, intermediaire 60€, avance 120€). */
  protected readonly stackBudgetColumns: ComparisonColumn[] = [
    {
      label: $localize`:@@ia-solo.stack-budget.debutant.label:Stack débutant — 0€/mois`,
      tone: "success",
      items: this.stackBudgetDebutantItems,
    },
    {
      label: $localize`:@@ia-solo.stack-budget.intermediaire.label:Stack intermédiaire — ~60€/mois`,
      tone: "warning",
      items: this.stackBudgetIntermediaireItems,
    },
    {
      label: $localize`:@@ia-solo.stack-budget.avance.label:Stack avancé — ~120€/mois`,
      tone: "danger",
      items: this.stackBudgetAvanceItems,
    },
  ];
}
