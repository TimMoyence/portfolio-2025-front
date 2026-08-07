import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ToolkitGatePageComponent } from '../../shared/toolkit-gate-page.component';
import type { ToolkitGatePageData } from '../../shared/toolkit-gate-page.model';

/**
 * Page de capture email du toolkit « Audit SEO DIY » — refonte Asili (Lot 3e).
 *
 * Shell mince : il fournit ses chaines localisees au composant partage
 * `ToolkitGatePageComponent` et projette son titre a accent. Le slug
 * `audit-seo-diy` (cle metier d'attribution back-end) est transmis verbatim au
 * formulaire de capture, qui declenche l'envoi du PDF « Checklist audit SEO +
 * rapport type » via le pipeline lead-magnet.
 *
 * La logique de capture (port `LEAD_MAGNET_PORT`, `requestToolkit`) vit dans
 * `ToolkitFormComponent`, inchangee. Routes et `seoKey` inchanges ; fond
 * constellation global. Texte localise via `$localize`.
 */
@Component({
  selector: 'app-toolkit-audit-seo',
  standalone: true,
  imports: [ToolkitGatePageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolkit-gate-page [data]="gateData" formationSlug="audit-seo-diy">
      <ng-container title i18n="@@formations.audit-seo.toolkit.title"
        >Votre checklist<br /><em>audit SEO</em>.</ng-container
      >
    </app-toolkit-gate-page>
  `,
})
export class ToolkitAuditSeoComponent {
  /** Contenu localise de la page gate. */
  protected readonly gateData: ToolkitGatePageData = {
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
  };
}
