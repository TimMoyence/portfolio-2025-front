import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ToolkitGatePageComponent } from '../../shared/toolkit-gate-page.component';
import type { ToolkitGatePageData } from '../../shared/toolkit-gate-page.model';

@Component({
  selector: 'app-toolkit',
  standalone: true,
  imports: [ToolkitGatePageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolkit-gate-page [data]="gateData">
      <ng-container title i18n="@@formations.toolkit.title"
        >Le toolkit IA<br />pour <em>solopreneurs</em>.</ng-container
      >
    </app-toolkit-gate-page>
  `,
})
export class ToolkitComponent {
  protected readonly gateData: ToolkitGatePageData = {
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
  };
}
