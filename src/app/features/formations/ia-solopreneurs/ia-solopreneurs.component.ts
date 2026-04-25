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

  /** Comparison slide "automatiser" — gauche Zapier vs droite Make. */
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

  /** Comparison slide "stack-budget" — gauche débutant vs droite avancé. */
  protected readonly stackBudgetDebutantItems = [
    $localize`:@@ia-solo.stack-budget.debutant.0:ChatGPT gratuit + Canva gratuit + Gamma`,
    $localize`:@@ia-solo.stack-budget.debutant.1:Zapier (100 tâches) + Brevo + NotebookLM`,
    $localize`:@@ia-solo.stack-budget.debutant.2:Budget : 0€/mois — couvre 80% des besoins`,
  ];

  protected readonly stackBudgetAvanceItems = [
    $localize`:@@ia-solo.stack-budget.avance.0:Claude Pro (20$) + ChatGPT Plus (20$)`,
    $localize`:@@ia-solo.stack-budget.avance.1:Make Pro (16€) + ElevenLabs (22$)`,
    $localize`:@@ia-solo.stack-budget.avance.2:Fathom (19$) + Waalaxy (19€) — ~120€/mois`,
  ];

  /** Colonnes de comparaison "chat-produire" (ChatGPT vs Claude). */
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
  ];

  /** Colonnes de comparaison "automatiser" (Zapier vs Make). */
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
  ];

  /** Colonnes de comparaison "stack-budget" (debutant vs avance). */
  protected readonly stackBudgetColumns: ComparisonColumn[] = [
    {
      label: $localize`:@@ia-solo.stack-budget.debutant.label:Stack débutant — 0€/mois`,
      tone: "success",
      items: this.stackBudgetDebutantItems,
    },
    {
      label: $localize`:@@ia-solo.stack-budget.avance.label:Stack avancé — ~120€/mois`,
      tone: "info",
      items: this.stackBudgetAvanceItems,
    },
  ];
}
