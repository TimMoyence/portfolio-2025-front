import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { RevealOnScrollDirective } from "../../shared/directives/reveal-on-scroll.directive";
import {
  AsiliCtaBandComponent,
  AsiliHeroComponent,
  AsiliMethodComponent,
  type AsiliMethodStep,
} from "../../shared/sections";

/**
 * Un mode d'intervention de la page Services.
 *
 * - `num` : numéro mono teal (ex. « 01 »).
 * - `title` : intitulé du mode (ex. « Interventions ciblées »).
 * - `desc` : phrase de description.
 * - `link` : route interne cible du lien (la ligne entière est cliquable).
 * - `revealDelay` : délai de révélation au scroll (cascade visuelle).
 */
interface OfferMode {
  num: string;
  title: string;
  desc: string;
  link: string;
  revealDelay: 1 | 2 | 3 | 4 | null;
}

/**
 * Un différenciateur de la page Services (carte fond encre).
 *
 * - `num` : numéro mono (ex. « 01 »).
 * - `title` : intitulé de l'engagement.
 * - `desc` : phrase de description.
 * - `revealDelay` : délai de révélation au scroll (cascade visuelle).
 */
interface OfferDiff {
  num: string;
  title: string;
  desc: string;
  revealDelay: 1 | 2 | 3 | 4 | null;
}

/**
 * Une question / réponse de la FAQ de la page Services.
 *
 * - `q` : question (libellé de l'accordéon `<summary>`).
 * - `a` : réponse en texte brut.
 */
interface OfferFaq {
  q: string;
  a: string;
}

/**
 * Page Services Asili (`/offer`) — refonte du Lot 3c.
 *
 * Compose les sections de la bibliothèque marketing du Lot 3a
 * (`shared/sections/*`) dans l'ordre de la maquette
 * `AsiliNewDesign/services.html` : hero (kicker « Services premium »,
 * titre « Un périmètre défini sur *votre* besoin. »), quatre modes
 * d'intervention (Interventions ciblées / Projets structurants /
 * Accompagnement continu / Formation sur-mesure), section « Méthode »
 * (`asili-method`, quatre étapes Comprendre → Déployer → Éprouver → Faire
 * durer), trois différenciateurs (Expertise réelle / Continuité humaine /
 * Stratégie avant techno), FAQ (dont « Pourquoi pas de grille de prix ? ») et
 * bande CTA (`asili-cta-band`).
 *
 * Tout le texte est fourni en `$localize` (source FR verbatim de la maquette) ;
 * la traduction EN vit dans les XLF. Le fond constellation est global (Lot 0,
 * `<app-asili-background>`) : la page ne recrée aucun canvas.
 *
 * Pas de grille de prix figée : l'offre se cadre sur le besoin réel. Pas de
 * social proof fictif.
 */
@Component({
  selector: "app-offer",
  standalone: true,
  imports: [
    RouterLink,
    RevealOnScrollDirective,
    AsiliHeroComponent,
    AsiliMethodComponent,
    AsiliCtaBandComponent,
  ],
  templateUrl: "./offer.component.html",
  styleUrl: "./offer.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferComponent {
  // --- Hero -----------------------------------------------------------------

  /** Sur-titre mono du hero. */
  protected readonly heroKicker = $localize`:@@offerHeroKicker:Services premium`;

  /** Début du titre du hero, avant l'accent italique teal. */
  protected readonly heroTitlePre = $localize`:@@offerHeroTitlePre:Un périmètre défini sur`;

  /** Mot accentué (italique teal) du titre du hero. */
  protected readonly heroTitleAccent = $localize`:@@offerHeroTitleAccent:votre`;

  /** Fin du titre du hero, après l'accent. */
  protected readonly heroTitlePost = $localize`:@@offerHeroTitlePost:besoin.`;

  /** Accroche du hero. */
  protected readonly heroLead = $localize`:@@offerHeroLead:Pas un catalogue de prix figés. Quatre façons de travailler ensemble, choisies selon votre situation réelle — de l'intervention ciblée à l'accompagnement dans la durée.`;

  /** Lignes de méta du hero : clé mono + valeur. */
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

  // --- Modes d'intervention -------------------------------------------------

  /** Quatre modes d'intervention (du ponctuel au continu, plus la formation). */
  protected readonly modes: readonly OfferMode[] = [
    {
      num: "01",
      revealDelay: null,
      link: "/contact",
      title: $localize`:@@offerMode1Title:Interventions ciblées`,
      desc: $localize`:@@offerMode1Desc:Un blocage précis, une fonctionnalité, un audit. Une action courte et nette, avec un livrable clair.`,
    },
    {
      num: "02",
      revealDelay: 1,
      link: "/contact",
      title: $localize`:@@offerMode2Title:Projets structurants`,
      desc: $localize`:@@offerMode2Desc:Une plateforme, une refonte, une intégration d'IA. Du cadrage à la mise en production, avec une architecture qui dure.`,
    },
    {
      num: "03",
      revealDelay: 2,
      link: "/contact",
      title: $localize`:@@offerMode3Title:Accompagnement continu`,
      desc: $localize`:@@offerMode3Desc:Une présence dans la durée : évolutions, conseil, montée en compétence de votre équipe. Le partenaire, pas le prestataire.`,
    },
    {
      num: "04",
      revealDelay: 3,
      link: "/formations",
      title: $localize`:@@offerMode4Title:Formation sur-mesure`,
      desc: $localize`:@@offerMode4Desc:Rendre votre équipe autonome sur l'IA, l'automatisation ou le SEO. Adapté à votre contexte, pas un cours générique.`,
    },
  ];

  // --- Méthode --------------------------------------------------------------

  /** Sur-titre mono de la section méthode. */
  protected readonly methodKicker = $localize`:@@offerMethodKicker:La méthode`;

  /** Accroche de la section méthode. */
  protected readonly methodIntro = $localize`:@@offerMethodIntro:Un fil conducteur stable, quel que soit le mode d'intervention choisi.`;

  /** Quatre étapes de la méthode (Comprendre → Déployer → Éprouver → Faire durer). */
  protected readonly methodSteps: readonly AsiliMethodStep[] = [
    {
      num: "01",
      index: $localize`:@@offerMethodStep1Index:— Clarifier`,
      title: $localize`:@@offerMethodStep1Title:Comprendre`,
      desc: $localize`:@@offerMethodStep1Desc:On cartographie le besoin réel et les usages avant toute proposition technique.`,
    },
    {
      num: "02",
      index: $localize`:@@offerMethodStep2Index:— Construire`,
      title: $localize`:@@offerMethodStep2Title:Déployer`,
      desc: $localize`:@@offerMethodStep2Desc:Des outils robustes et lisibles, dimensionnés sur le périmètre réel.`,
    },
    {
      num: "03",
      index: $localize`:@@offerMethodStep3Index:— Tester`,
      title: $localize`:@@offerMethodStep3Title:Éprouver`,
      desc: $localize`:@@offerMethodStep3Desc:On confronte à l'usage, on mesure, on ajuste sans dogme.`,
    },
    {
      num: "04",
      index: $localize`:@@offerMethodStep4Index:— Évoluer`,
      title: $localize`:@@offerMethodStep4Title:Faire durer`,
      desc: $localize`:@@offerMethodStep4Desc:Continuité humaine : l'outil grandit avec vous, pas contre vous.`,
    },
  ];

  // --- Ce qui différencie ---------------------------------------------------

  /** Sur-titre mono de la section différenciateurs. */
  protected readonly diffKicker = $localize`:@@offerDiffKicker:Ce qui différencie`;

  /** Trois engagements qui différencient. */
  protected readonly diffs: readonly OfferDiff[] = [
    {
      num: "01",
      revealDelay: null,
      title: $localize`:@@offerDiff1Title:Expertise réelle`,
      desc: $localize`:@@offerDiff1Desc:Angular, NestJS, IA : une maîtrise technique qui se voit dans la robustesse et la lisibilité de ce qu'on livre.`,
    },
    {
      num: "02",
      revealDelay: 1,
      title: $localize`:@@offerDiff2Title:Continuité humaine`,
      desc: $localize`:@@offerDiff2Desc:Un interlocuteur unique, qui connaît votre contexte et reste là après la livraison. Pas de tunnel, pas de turnover.`,
    },
    {
      num: "03",
      revealDelay: 2,
      title: $localize`:@@offerDiff3Title:Stratégie avant techno`,
      desc: $localize`:@@offerDiff3Desc:On décide ensemble quoi construire — et quoi ne pas construire. La sobriété est une décision, pas un défaut.`,
    },
  ];

  // --- FAQ ------------------------------------------------------------------

  /** Sur-titre de la FAQ. */
  protected readonly faqKicker = $localize`:@@offerFaqKicker:Questions fréquentes`;

  /** Titre de la FAQ. */
  protected readonly faqTitle = $localize`:@@offerFaqTitle:Avant de se lancer.`;

  /** Questions / réponses de la FAQ. */
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

  // --- Bande CTA ------------------------------------------------------------

  /** Sur-titre de la bande CTA. */
  protected readonly ctaKicker = $localize`:@@offerCtaKicker:Prêt à clarifier ?`;

  /** Titre de la bande CTA. */
  protected readonly ctaTitle = $localize`:@@offerCtaTitle:Décrivez votre besoin. Je propose un cadrage, pas un devis générique.`;

  /** CTA primaire de la bande. */
  protected readonly ctaPrimary = $localize`:@@offerCtaPrimary:Démarrer la conversation`;

  /** CTA secondaire de la bande. */
  protected readonly ctaSecondary = $localize`:@@offerCtaSecondary:Voir les réalisations`;
}
