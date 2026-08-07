import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import {
  AsiliCtaBandComponent,
  AsiliHeroComponent,
  AsiliMethodComponent,
  type AsiliMethodStep,
} from '../../shared/sections';

interface OfferMode {
  num: string;
  title: string;
  desc: string;
  link: string;
  revealDelay: 1 | 2 | 3 | 4 | null;
}

interface OfferDiff {
  num: string;
  title: string;
  desc: string;
  revealDelay: 1 | 2 | 3 | 4 | null;
}

interface OfferFaq {
  q: string;
  a: string;
}

@Component({
  selector: 'app-offer',
  standalone: true,
  imports: [
    RouterLink,
    RevealOnScrollDirective,
    AsiliHeroComponent,
    AsiliMethodComponent,
    AsiliCtaBandComponent,
  ],
  templateUrl: './offer.component.html',
  styleUrl: './offer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferComponent {
  protected readonly heroKicker = $localize`:@@offerHeroKicker:Services premium`;

  protected readonly heroTitlePre = $localize`:@@offerHeroTitlePre:Un périmètre défini sur`;

  protected readonly heroTitleAccent = $localize`:@@offerHeroTitleAccent:votre`;

  protected readonly heroTitlePost = $localize`:@@offerHeroTitlePost:besoin.`;

  protected readonly heroLead = $localize`:@@offerHeroLead:Pas un catalogue de prix figés. Quatre façons de travailler ensemble, choisies selon votre situation réelle — de l'intervention ciblée à l'accompagnement dans la durée.`;

  protected readonly heroMeta: readonly { key: string; value: string }[] = [
    {
      key: $localize`:@@offerHeroMeta1Key:Format`,
      value: $localize`:@@offerHeroMeta1Value:Sur-mesure`,
    },
    {
      key: $localize`:@@offerHeroMeta2Key:Engagement`,
      value: $localize`:@@offerHeroMeta2Value:Du ponctuel au continu`,
    },
    {
      key: $localize`:@@offerHeroMeta3Key:Toujours inclus`,
      value: $localize`:@@offerHeroMeta3Value:Cadrage honnête`,
    },
  ];

  protected readonly modes: readonly OfferMode[] = [
    {
      num: '01',
      revealDelay: null,
      link: '/contact',
      title: $localize`:@@offerMode1Title:Interventions ciblées`,
      desc: $localize`:@@offerMode1Desc:Un blocage précis, une fonctionnalité, un audit. Une action courte et nette, avec un livrable clair.`,
    },
    {
      num: '02',
      revealDelay: 1,
      link: '/contact',
      title: $localize`:@@offerMode2Title:Projets structurants`,
      desc: $localize`:@@offerMode2Desc:Une plateforme, une refonte, une intégration d'IA. Du cadrage à la mise en production, avec une architecture qui dure.`,
    },
    {
      num: '03',
      revealDelay: 2,
      link: '/contact',
      title: $localize`:@@offerMode3Title:Accompagnement continu`,
      desc: $localize`:@@offerMode3Desc:Une présence dans la durée : évolutions, conseil, montée en compétence de votre équipe. Le partenaire, pas le prestataire.`,
    },
    {
      num: '04',
      revealDelay: 3,
      link: '/formations',
      title: $localize`:@@offerMode4Title:Formation sur-mesure`,
      desc: $localize`:@@offerMode4Desc:Rendre votre équipe autonome sur l'IA, l'automatisation ou le SEO. Adapté à votre contexte, pas un cours générique.`,
    },
  ];

  protected readonly methodKicker = $localize`:@@offerMethodKicker:La méthode`;

  protected readonly methodIntro = $localize`:@@offerMethodIntro:Un fil conducteur stable, quel que soit le mode d'intervention choisi.`;

  protected readonly methodSteps: readonly AsiliMethodStep[] = [
    {
      num: '01',
      index: $localize`:@@offerMethodStep1Index:— Clarifier`,
      title: $localize`:@@offerMethodStep1Title:Comprendre`,
      desc: $localize`:@@offerMethodStep1Desc:On cartographie le besoin réel et les usages avant toute proposition technique.`,
    },
    {
      num: '02',
      index: $localize`:@@offerMethodStep2Index:— Construire`,
      title: $localize`:@@offerMethodStep2Title:Déployer`,
      desc: $localize`:@@offerMethodStep2Desc:Des outils robustes et lisibles, dimensionnés sur le périmètre réel.`,
    },
    {
      num: '03',
      index: $localize`:@@offerMethodStep3Index:— Tester`,
      title: $localize`:@@offerMethodStep3Title:Éprouver`,
      desc: $localize`:@@offerMethodStep3Desc:On confronte à l'usage, on mesure, on ajuste sans dogme.`,
    },
    {
      num: '04',
      index: $localize`:@@offerMethodStep4Index:— Évoluer`,
      title: $localize`:@@offerMethodStep4Title:Faire durer`,
      desc: $localize`:@@offerMethodStep4Desc:Continuité humaine : l'outil grandit avec vous, pas contre vous.`,
    },
  ];

  protected readonly diffKicker = $localize`:@@offerDiffKicker:Ce qui différencie`;

  protected readonly diffs: readonly OfferDiff[] = [
    {
      num: '01',
      revealDelay: null,
      title: $localize`:@@offerDiff1Title:Expertise réelle`,
      desc: $localize`:@@offerDiff1Desc:Angular, NestJS, IA : une maîtrise technique qui se voit dans la robustesse et la lisibilité de ce qu'on livre.`,
    },
    {
      num: '02',
      revealDelay: 1,
      title: $localize`:@@offerDiff2Title:Continuité humaine`,
      desc: $localize`:@@offerDiff2Desc:Un interlocuteur unique, qui connaît votre contexte et reste là après la livraison. Pas de tunnel, pas de turnover.`,
    },
    {
      num: '03',
      revealDelay: 2,
      title: $localize`:@@offerDiff3Title:Stratégie avant techno`,
      desc: $localize`:@@offerDiff3Desc:On décide ensemble quoi construire — et quoi ne pas construire. La sobriété est une décision, pas un défaut.`,
    },
  ];

  protected readonly faqKicker = $localize`:@@offerFaqKicker:Questions fréquentes`;

  protected readonly faqTitle = $localize`:@@offerFaqTitle:Avant de se lancer.`;

  protected readonly faqItems: readonly OfferFaq[] = [
    {
      q: $localize`:@@offerFaq1Q:Pourquoi pas de grille de prix ?`,
      a: $localize`:@@offerFaq1A:Parce qu'un prix figé répond rarement à un besoin réel. Je préfère cadrer votre situation, puis proposer un périmètre et un budget justes. Transparent, mais sur-mesure.`,
    },
    {
      q: $localize`:@@offerFaq2Q:Combien de temps dure un projet ?`,
      a: $localize`:@@offerFaq2A:D'une intervention de quelques jours à un accompagnement de plusieurs mois. On définit ensemble le rythme adapté à vos contraintes et à votre maturité.`,
    },
    {
      q: $localize`:@@offerFaq3Q:Reprenez-vous un projet existant ?`,
      a: $localize`:@@offerFaq3A:Oui, fréquemment. J'audite l'existant, j'identifie ce qui mérite d'être gardé, et je propose un chemin réaliste vers plus de clarté et de robustesse.`,
    },
    {
      q: $localize`:@@offerFaq4Q:Travaillez-vous à distance ?`,
      a: $localize`:@@offerFaq4A:Basé à Bordeaux, je travaille avec des clients partout en France, à distance comme en présentiel selon les besoins. La proximité humaine ne dépend pas de la géographie.`,
    },
  ];

  protected readonly ctaKicker = $localize`:@@offerCtaKicker:Prêt à clarifier ?`;

  protected readonly ctaTitle = $localize`:@@offerCtaTitle:Décrivez votre besoin. Je propose un cadrage, pas un devis générique.`;

  protected readonly ctaPrimary = $localize`:@@offerCtaPrimary:Démarrer la conversation`;

  protected readonly ctaSecondary = $localize`:@@offerCtaSecondary:Voir les réalisations`;
}
