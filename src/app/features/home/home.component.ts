import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { RevealOnScrollDirective } from "../../shared/directives/reveal-on-scroll.directive";
import {
  AsiliCtaBandComponent,
  AsiliHeroComponent,
  AsiliManifestoComponent,
  type AsiliManifestoLine,
  AsiliMethodComponent,
  type AsiliMethodStep,
  AsiliPillarsComponent,
  type AsiliPillar,
  AsiliProjectsGridComponent,
  type AsiliProject,
} from "../../shared/sections";

/**
 * Page d'accueil Asili (page pilote du Lot 3b).
 *
 * Compose la bibliotheque de sections marketing du Lot 3a
 * (`shared/sections/*`) dans l'ordre de la maquette
 * `AsiliNewDesign/index.html` : hero → methode → piliers → Atelier (bloc
 * immersif `theme-night` avec deux lab-cards) → manifeste → grille de projets
 * (teaser) → bande CTA. Tout le texte est fourni en `$localize` (source FR
 * verbatim de la maquette, IDs `@@home*`) ; la traduction EN vit dans les XLF.
 *
 * Le fond constellation est global (Lot 0, `<app-asili-background>`) : la home
 * ne recree aucun canvas. La demo Meteo jouable inline de la maquette est
 * reportee au Lot 4 — ici l'Atelier expose seulement les deux cartes labo et
 * leurs liens (`/atelier/meteo`, `/atelier/sebastian`).
 *
 * Identite : Tim Moyence, developpeur & consultant Angular / NestJS / IA. Pas
 * de social proof ni de temoignage fictif (apps en lancement).
 */
@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    RouterLink,
    RevealOnScrollDirective,
    AsiliHeroComponent,
    AsiliMethodComponent,
    AsiliPillarsComponent,
    AsiliManifestoComponent,
    AsiliProjectsGridComponent,
    AsiliCtaBandComponent,
  ],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  // --- Hero -----------------------------------------------------------------

  /** Puce live mono surmontant le titre du hero. */
  protected readonly heroChip = $localize`:@@homeHeroChip:Studio digital & IA · Bordeaux`;

  /** Debut du titre du hero, avant l'accent italique teal. */
  protected readonly heroTitlePre = $localize`:@@homeHeroTitlePre:Clarifier`;

  /** Mot accentue (italique teal) du titre du hero. */
  protected readonly heroTitleAccent = $localize`:@@homeHeroTitleAccent:avant`;

  /** Fin du titre du hero, apres l'accent. */
  protected readonly heroTitlePost = $localize`:@@homeHeroTitlePost:de construire.`;

  /** Accroche du hero. */
  protected readonly heroLead = $localize`:@@homeHeroLead:Développeur & consultant spécialisé Angular, NestJS et IA. Je structure les usages avant de déployer la techno — pour des TPE, PME et solopreneurs qui veulent des leviers concrets, pas du jargon.`;

  /** Libelle de l'indication de scroll. */
  protected readonly heroScrollHint = $localize`:@@homeHeroScrollHint:Défiler`;

  /** Statistique 1 du hero : nombre. */
  protected readonly heroStat1Num = $localize`:@@homeHeroStat1Num:2`;
  /** Statistique 1 du hero : libelle. */
  protected readonly heroStat1Label = $localize`:@@homeHeroStat1Label:piliers : services & formations`;

  /** Statistique 2 du hero : nombre. */
  protected readonly heroStat2Num = $localize`:@@homeHeroStat2Num:∞`;
  /** Statistique 2 du hero : libelle. */
  protected readonly heroStat2Label = $localize`:@@homeHeroStat2Label:l'Atelier, un labo vivant à essayer`;

  /** CTA primaire du hero. */
  protected readonly heroCtaPrimary = $localize`:@@homeHeroCtaPrimary:Voir comment je travaille`;
  /** CTA secondaire du hero. */
  protected readonly heroCtaSecondary = $localize`:@@homeHeroCtaSecondary:Essayer l'Atelier`;

  // --- Methode --------------------------------------------------------------

  /** Sur-titre de la section methode. */
  protected readonly methodKicker = $localize`:@@homeMethodKicker:La méthode`;
  /** Introduction (lead) de la section methode. */
  protected readonly methodIntro = $localize`:@@homeMethodIntro:Le digital et l'IA sont des leviers, jamais des finalités. On commence par comprendre, on déploie ensuite — et on garde ce qui marche.`;

  /** Etapes de la methode. */
  protected readonly methodSteps: readonly AsiliMethodStep[] = [
    {
      num: "01",
      index: $localize`:@@homeMethodStep1Index:— Clarifier`,
      title: $localize`:@@homeMethodStep1Title:Comprendre`,
      desc: $localize`:@@homeMethodStep1Desc:On cartographie le besoin réel et les usages avant la moindre ligne de code.`,
    },
    {
      num: "02",
      index: $localize`:@@homeMethodStep2Index:— Construire`,
      title: $localize`:@@homeMethodStep2Title:Déployer`,
      desc: $localize`:@@homeMethodStep2Desc:Des outils robustes et lisibles, dimensionnés sur le périmètre réel.`,
    },
    {
      num: "03",
      index: $localize`:@@homeMethodStep3Index:— Tester`,
      title: $localize`:@@homeMethodStep3Title:Éprouver`,
      desc: $localize`:@@homeMethodStep3Desc:On confronte à l'usage, on mesure, on ajuste sans dogme.`,
    },
    {
      num: "04",
      index: $localize`:@@homeMethodStep4Index:— Évoluer`,
      title: $localize`:@@homeMethodStep4Title:Faire durer`,
      desc: $localize`:@@homeMethodStep4Desc:Continuité humaine : l'outil grandit avec vous, pas contre vous.`,
    },
  ];

  // --- Piliers --------------------------------------------------------------

  /** Sur-titre de la section piliers. */
  protected readonly pillarsKicker = $localize`:@@homePillarsKicker:Deux façons de travailler ensemble`;

  /** Piliers : services premium puis formations premium. */
  protected readonly pillars: readonly AsiliPillar[] = [
    {
      variant: "services",
      tag: $localize`:@@homePillarServicesTag:01 — Services premium`,
      title: $localize`:@@homePillarServicesTitle:On bâtit exactement ce qu'il vous faut.`,
      desc: $localize`:@@homePillarServicesDesc:Interventions ciblées, projets structurants, accompagnement dans la durée. Un périmètre défini sur votre situation réelle — pas un catalogue de prix figés.`,
      items: [
        $localize`:@@homePillarServicesItem1:Audit & cadrage avant tout chantier`,
        $localize`:@@homePillarServicesItem2:Développement Angular / NestJS sur-mesure`,
        $localize`:@@homePillarServicesItem3:Intégration d'IA utile, mesurée, maîtrisée`,
      ],
      link: {
        label: $localize`:@@homePillarServicesLink:Découvrir l'offre`,
        href: "/offer",
      },
    },
    {
      variant: "formations",
      tag: $localize`:@@homePillarFormationsTag:02 — Formations premium`,
      title: $localize`:@@homePillarFormationsTitle:On vous rend autonome, pour de bon.`,
      desc: $localize`:@@homePillarFormationsDesc:Des formations qui font monter en gamme : de l'usage flou à un système qui travaille pour vous. Le gratuit reste un point d'entrée — le premium va au fond des choses.`,
      items: [
        $localize`:@@homePillarFormationsItem1:IA pour solopreneurs`,
        $localize`:@@homePillarFormationsItem2:Automatiser avec l'IA`,
        $localize`:@@homePillarFormationsItem3:Audit SEO DIY — diagnostiquer soi-même`,
      ],
      link: {
        label: $localize`:@@homePillarFormationsLink:Voir les formations`,
        href: "/formations",
      },
    },
  ];

  // --- Atelier (bloc immersif, cards) --------------------------------------

  /** Sur-titre de la section Atelier. */
  protected readonly atelierKicker = $localize`:@@homeAtelierKicker:L'Atelier — le bac à sable`;
  /** Debut du titre Atelier, avant l'accent serif. */
  protected readonly atelierTitlePre = $localize`:@@homeAtelierTitlePre:Un laboratoire vivant où vous pouvez`;
  /** Accent serif italique du titre Atelier. */
  protected readonly atelierTitleAccent = $localize`:@@homeAtelierTitleAccent:jouer`;
  /** Accroche de la section Atelier (la demo jouable inline arrive au Lot 4). */
  protected readonly atelierLead = $localize`:@@homeAtelierLead:Pas des produits à vendre : des preuves jouables. Je teste des idées en vrai, et vous les manipulez directement — sans inscription.`;

  /** Carte labo Meteo : titre. */
  protected readonly atelierMeteoTitle = $localize`:@@homeAtelierMeteoTitle:Météo`;
  /** Carte labo Meteo : description. */
  protected readonly atelierMeteoDesc = $localize`:@@homeAtelierMeteoDesc:Données réalistes, parallaxe, mode immersif ciel. La preuve d'une interface vivante et précise.`;
  /** Carte labo Meteo : lien. */
  protected readonly atelierMeteoLink = $localize`:@@homeAtelierMeteoLink:Essayer l'app`;

  /** Carte labo Sebastian : titre. */
  protected readonly atelierSebTitle = $localize`:@@homeAtelierSebTitle:Sebastian`;
  /** Carte labo Sebastian : description. */
  protected readonly atelierSebDesc = $localize`:@@homeAtelierSebDesc:Suivi de consommation : jauge de santé, calcul d'alcoolémie, heatmap, et un bot Telegram. Le dark lounge ambré.`;
  /** Carte labo Sebastian : lien. */
  protected readonly atelierSebLink = $localize`:@@homeAtelierSebLink:Accéder à Sebastian`;

  // --- Manifeste ------------------------------------------------------------

  /** Lignes du manifeste (scrollytelling). */
  protected readonly manifestoLines: readonly AsiliManifestoLine[] = [
    {
      step: $localize`:@@homeManifestoStep1:Le problème`,
      html: $localize`:@@homeManifestoLine1:La technologie promet beaucoup,`,
    },
    {
      html: $localize`:@@homeManifestoLine2:et laisse souvent un <span class="t">flou</span>.`,
    },
    {
      step: $localize`:@@homeManifestoStep2:La clarté`,
      html: $localize`:@@homeManifestoLine3:Mon métier commence là :`,
    },
    {
      html: $localize`:@@homeManifestoLine4:comprendre <span class="t">avant</span> de construire.`,
    },
    {
      step: $localize`:@@homeManifestoStep3:La preuve`,
      html: $localize`:@@homeManifestoLine5:Et le prouver en le rendant <span class="t">jouable</span>.`,
    },
  ];

  // --- Projets (teaser) -----------------------------------------------------

  /** Sur-titre de la grille de projets. */
  protected readonly projectsKicker = $localize`:@@homeProjectsKicker:Preuve de savoir-faire`;
  /** Lien d'entete vers la page projets. */
  protected readonly projectsHeadLink = $localize`:@@homeProjectsHeadLink:Voir tous les projets`;

  /**
   * Cartes projet du teaser.
   *
   * Les trois cartes sont en `small` (span 2) : la grille desktop compte 6
   * colonnes et n'active pas `grid-auto-flow: dense` (qui reordonnerait les
   * cartes), donc 2 + 2 + 2 pave exactement une rangee. Un `big` (span 4) ici
   * ferait 2 + 2 + 4 = 8, soit deux rangees trouees de 2 colonnes chacune.
   * Toute carte ajoutee doit preserver ce pavage (multiples de 6 par rangee,
   * dans l'ordre d'affichage).
   */
  protected readonly projects: readonly AsiliProject[] = [
    {
      size: "small",
      tags: [{ label: $localize`:@@homeProject2Tag1:Atelier` }],
      title: $localize`:@@homeProject2Title:Météo`,
      desc: $localize`:@@homeProject2Desc:Data-viz vivante : vent, UV, arc solaire.`,
      href: "/atelier/meteo",
      image: "/assets/images/projects/weather.webp",
      imageAlt: $localize`:@@homeProject2ImageAlt:capture — app Météo`,
    },
    {
      size: "small",
      tags: [{ label: $localize`:@@homeProject3Tag1:Atelier` }],
      title: $localize`:@@homeProject3Title:Sebastian`,
      desc: $localize`:@@homeProject3Desc:Suivi de consommation, app + bot Telegram.`,
      href: "/atelier/sebastian",
      image: "/assets/images/projects/sebastian.webp",
      imageAlt: $localize`:@@homeProject3ImageAlt:capture — Sebastian`,
    },
    {
      size: "small",
      tags: [
        { label: $localize`:@@homeProject4Tag1:Automatisation` },
        { label: $localize`:@@homeProject4Tag2:IA` },
      ],
      title: $localize`:@@homeProject4Title:Un système qui travaille en silence`,
      desc: $localize`:@@homeProject4Desc:Des tâches répétitives remplacées par une automatisation lisible, mesurée, sous contrôle humain.`,
      href: "/offer",
      image: "/assets/images/projects/Automation-validation.webp",
      imageAlt: $localize`:@@homeProject4ImageAlt:capture — automatisation IA`,
    },
  ];

  // --- Bande CTA ------------------------------------------------------------

  /** Sur-titre de la bande CTA. */
  protected readonly ctaKicker = $localize`:@@homeCtaKicker:Parlons de votre situation`;
  /** Titre de la bande CTA. */
  protected readonly ctaTitle = $localize`:@@homeCtaTitle:Et si on clarifiait, ensemble, avant de construire ?`;
  /** Accroche de la bande CTA. */
  protected readonly ctaLead = $localize`:@@homeCtaLead:Décrivez votre contexte en quelques lignes. Je reviens vers vous avec un regard honnête — pas un devis générique.`;
  /** CTA primaire de la bande. */
  protected readonly ctaPrimary = $localize`:@@homeCtaPrimary:Démarrer la conversation`;
  /** CTA secondaire de la bande. */
  protected readonly ctaSecondary = $localize`:@@homeCtaSecondary:Explorer l'Atelier`;
}
