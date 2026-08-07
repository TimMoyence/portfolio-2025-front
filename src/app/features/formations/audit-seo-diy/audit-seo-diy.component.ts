import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  SlideComponent,
  SlideCtaComponent,
  SlideDeckComponent,
  SlideGridComponent,
  SlideHeroComponent,
  SlideImageComponent,
  SlideQuoteComponent,
  SlideStatsComponent,
} from '../../../shared/slides';

@Component({
  selector: 'app-audit-seo-diy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SlideDeckComponent,
    SlideComponent,
    SlideHeroComponent,
    SlideImageComponent,
    SlideStatsComponent,
    SlideGridComponent,
    SlideQuoteComponent,
    SlideCtaComponent,
  ],
  templateUrl: './audit-seo-diy.component.html',
  styleUrl: './audit-seo-diy.component.scss',
})
export class AuditSeoDiyComponent {
  protected readonly constatStats = [
    {
      value: '68%',
      label: $localize`:@@formations.audit-seo-diy.constat.stats.0.label:des recherches Google ne donnent jamais un clic au dela du premier ecran`,
      source: $localize`:@@formations.audit-seo-diy.constat.stats.0.source:Sistrix, analyse 2025`,
    },
    {
      value: '93%',
      label: $localize`:@@formations.audit-seo-diy.constat.stats.1.label:des experiences en ligne commencent par une recherche — si vous n'y etes pas, vous n'existez pas`,
      source: $localize`:@@formations.audit-seo-diy.constat.stats.1.source:BrightEdge Research, 2024`,
    },
    {
      value: '20 min',
      label: $localize`:@@formations.audit-seo-diy.constat.stats.2.label:suffisent pour reperer 80% des problemes SEO d'un site de petite entreprise, avec les bons outils gratuits`,
      source: $localize`:@@formations.audit-seo-diy.constat.stats.2.source:Benchmark asilidesign.fr, 2026`,
    },
  ];

  protected readonly procedureItems = [
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
  ];

  protected readonly outilsItems = [
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
  ];

  protected readonly faqItems = [
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
  ];
}
