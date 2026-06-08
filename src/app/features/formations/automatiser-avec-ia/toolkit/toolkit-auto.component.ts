import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ToolkitGatePageComponent } from "../../shared/toolkit-gate-page.component";
import type { ToolkitGatePageData } from "../../shared/toolkit-gate-page.model";

/**
 * Page de capture email du toolkit « Automatiser avec l'IA » — refonte Asili
 * (Lot 3e).
 *
 * Shell mince : il fournit ses chaines localisees au composant partage
 * `ToolkitGatePageComponent` et projette son titre a accent. Le slug
 * `automatiser-avec-ia` (cle metier d'attribution back-end) est transmis
 * verbatim au formulaire de capture, qui declenche l'envoi du PDF « 5 workflows
 * prets a l'emploi » via le pipeline lead-magnet.
 *
 * La logique de capture (port `LEAD_MAGNET_PORT`, `requestToolkit`) vit dans
 * `ToolkitFormComponent`, inchangee. Routes et `seoKey` inchanges ; fond
 * constellation global. Texte localise via `$localize`.
 */
@Component({
  selector: "app-toolkit-auto",
  standalone: true,
  imports: [ToolkitGatePageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolkit-gate-page
      [data]="gateData"
      formationSlug="automatiser-avec-ia"
    >
      <ng-container title i18n="@@formations.auto.toolkit.title"
        >Vos 5 workflows<br />prêts à <em>l'emploi</em>.</ng-container
      >
    </app-toolkit-gate-page>
  `,
})
export class ToolkitAutoComponent {
  /** Contenu localise de la page gate. */
  protected readonly gateData: ToolkitGatePageData = {
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
  };
}
