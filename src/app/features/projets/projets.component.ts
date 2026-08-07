import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AsiliCtaBandComponent,
  AsiliHeroComponent,
  AsiliMethodComponent,
  type AsiliMethodStep,
  type AsiliProject,
  AsiliProjectsGridComponent,
} from '../../shared/sections';

/**
 * Page Projets Asili (`/projets`) — liste des réalisations.
 *
 * Compose les sections de la bibliothèque marketing du Lot 3a
 * (`shared/sections/*`) dans l'ordre de la maquette
 * `AsiliNewDesign/projets.html` : hero (kicker « Réalisations », titre « Des
 * preuves, pas des promesses. ») → grille `asili-projects-grid` reprenant les
 * réalisations verbatim de la maquette → bandeau `asili-method` (« le fil
 * rouge », quatre étapes Comprendre / Déployer / Éprouver / Faire durer) →
 * bande `asili-cta-band`.
 *
 * Les réalisations sont authored par l'utilisateur (maquette) : titres,
 * descriptions, étiquettes et statut « En production » sont repris tels quels —
 * rien n'est inventé. Les liens internes pointent vers les pages existantes
 * (ateliers, growth audit) ; les réalisations sans page dédiée restent non
 * cliquables.
 *
 * Tout le texte est fourni en `$localize` (source FR verbatim de la maquette,
 * IDs `@@projets*`) ; la traduction EN vit dans les XLF. Le fond constellation
 * est global (Lot 0, `<app-asili-background>`) : la page ne recrée aucun canvas.
 */
@Component({
  selector: 'app-projets',
  standalone: true,
  imports: [
    RouterLink,
    AsiliHeroComponent,
    AsiliProjectsGridComponent,
    AsiliMethodComponent,
    AsiliCtaBandComponent,
  ],
  templateUrl: './projets.component.html',
  styleUrl: './projets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjetsComponent {
  // --- Hero -----------------------------------------------------------------

  /** Sur-titre mono du hero. */
  protected readonly heroKicker = $localize`:@@projetsHeroKicker:Réalisations`;

  /** Accroche du hero. */
  protected readonly heroLead = $localize`:@@projetsHeroLead:Chaque projet part d'un besoin réel et finit par un outil qui tient dans le temps. Voici quelques réalisations — des plateformes métier aux expériences de l'Atelier.`;

  // --- Grille des réalisations ---------------------------------------------

  /**
   * Réalisations reprises verbatim de `AsiliNewDesign/projets.html` (ordre,
   * titres, descriptions, étiquettes et statut « En production » authored par
   * l'utilisateur), complétées par AtlanticBike, Assistant IA Geev et
   * Modélisation prédictive — dont les textes sont repris verbatim de
   * l'ancienne section « Réalisations » de `/presentation`.
   *
   * Les liens internes ne sont posés que pour les réalisations disposant d'une
   * page dédiée dans l'app. Une réalisation sans `image` s'affiche avec le
   * placeholder rayé de `asili-projects-grid` tant qu'aucune capture n'existe.
   *
   * Trois réalisations sans capture possible (Morning-Brief, Le Jeu des Fourmis,
   * Voice IA) sont illustrées par des photos Pexels — licence libre, usage
   * commercial, sans attribution obligatoire — et leur `imageAlt` dit
   * « illustration » et non « capture » pour ne pas les faire passer pour des
   * copies d'écran du produit :
   * - `morning-brief.webp`   → pexels.com/photo/27164054
   * - `jeu-des-fourmis.webp` → pexels.com/photo/842401
   * - `voice-ia.webp`        → pexels.com/photo/7120126
   */
  protected readonly projects: readonly AsiliProject[] = [
    {
      size: 'small',
      tags: [
        { label: $localize`:@@projetsProject2Tag1:Atelier` },
        { label: $localize`:@@projetsProject2Tag2:Data-viz` },
      ],
      title: $localize`:@@projetsProject2Title:Weather`,
      desc: $localize`:@@projetsProject2Desc:Prévisions, qualité de l'air, alertes, circuit breaker multi-provider.`,
      href: '/atelier/meteo',
      image: '/assets/images/projects/weather.webp',
      imageAlt: $localize`:@@projetsProject2ImageAlt:capture — Weather`,
    },
    {
      size: 'big',
      tags: [
        { label: $localize`:@@projetsProject3Tag1:En production`, prod: true },
        { label: $localize`:@@projetsProject3Tag2:App web + Telegram` },
        { label: $localize`:@@projetsProject3Tag3:Widmark` },
      ],
      title: $localize`:@@projetsProject3Title:Sebastian — suivi de consommation`,
      desc: $localize`:@@projetsProject3Desc:App complète (objectifs, calcul d'alcoolémie, rapports) doublée d'un bot Telegram qui logge un verre en langage naturel — « j'ai bu 3 bières » — et calcule le taux en direct.`,
      href: '/atelier/sebastian',
      image: '/assets/images/projects/sebastian.webp',
      imageAlt: $localize`:@@projetsProject3ImageAlt:capture — Sebastian`,
    },
    {
      size: 'small',
      tags: [
        { label: $localize`:@@projetsProject4Tag1:En production`, prod: true },
        { label: $localize`:@@projetsProject4Tag2:Raspberry Pi` },
      ],
      title: $localize`:@@projetsProject4Title:Morning-Brief`,
      desc: $localize`:@@projetsProject4Desc:Newsletter IA : 50+ sources agrégées, dédupliquées, synthétisées, livrées chaque matin par Telegram. 24/7 sur un Raspberry Pi.`,
      image: '/assets/images/projects/morning-brief.webp',
      imageAlt: $localize`:@@projetsProject4ImageAlt:illustration — Morning-Brief`,
    },
    {
      size: 'big',
      tags: [
        { label: $localize`:@@projetsProject5Tag1:En production`, prod: true },
        { label: $localize`:@@projetsProject5Tag2:Automatisation` },
        { label: $localize`:@@projetsProject5Tag3:Telegram` },
      ],
      title: $localize`:@@projetsProject5Title:Onboarding Telegram IFS — académie de formation`,
      desc: $localize`:@@projetsProject5Desc:Audit d'appartenance aux groupes, relances automatiques, liens d'invitation signés, parcours d'onboarding multi-étapes et récap quotidien par email. Accueille des centaines d'élèves sans intervention manuelle.`,
      image: '/assets/images/projects/IFS-Academy.webp',
      imageAlt: $localize`:@@projetsProject5ImageAlt:capture — Onboarding Telegram IFS`,
    },
    {
      size: 'small',
      tags: [
        { label: $localize`:@@projetsProject6Tag1:Mobile` },
        { label: $localize`:@@projetsProject6Tag2:Multi-LLM` },
      ],
      title: $localize`:@@projetsProject6Title:Musaium`,
      desc: $localize`:@@projetsProject6Desc:Médiation culturelle par l'IA : reconnaissance d'œuvres par photo, chat contextuel, multilingue.`,
      image: '/assets/images/projects/Assistant-mediation-culturelle.webp',
      imageAlt: $localize`:@@projetsProject6ImageAlt:capture — Musaium`,
    },
    {
      size: 'big',
      tags: [
        { label: $localize`:@@projetsProject7Tag1:En production`, prod: true },
        { label: $localize`:@@projetsProject7Tag2:Outil métier` },
        { label: $localize`:@@projetsProject7Tag3:Traçabilité` },
      ],
      title: $localize`:@@projetsProject7Title:Gestion de chais de Cognac — traçabilité`,
      desc: $localize`:@@projetsProject7Desc:Suivi de la production de la vigne à la mise en bouteille : centralisation des informations, traçabilité complète, accompagnement des usages métier au quotidien.`,
      image: '/assets/images/projects/GDC-presentation.webp',
      imageAlt: $localize`:@@projetsProject7ImageAlt:capture — Gestion de chais de Cognac`,
    },
    {
      size: 'small',
      tags: [
        { label: $localize`:@@projetsProject15Tag1:Vinification` },
        { label: $localize`:@@projetsProject15Tag2:Poste & mobile` },
      ],
      title: $localize`:@@projetsProject15Title:Gestion de chais — la vinification au quotidien`,
      desc: $localize`:@@projetsProject15Desc:Le même outil, côté terrain : les opérations de vinification se saisissent aussi bien au poste que sur mobile, pour que la traçabilité se remplisse là où le travail se fait.`,
      image: '/assets/images/projects/GDC-vinification.webp',
      imageAlt: $localize`:@@projetsProject15ImageAlt:capture — Gestion de chais, vinification sur poste et mobile`,
    },
    {
      size: 'small',
      tags: [
        { label: $localize`:@@projetsProject8Tag1:En production`, prod: true },
        { label: $localize`:@@projetsProject8Tag2:Web sur-mesure` },
      ],
      title: $localize`:@@projetsProject8Title:Louison`,
      desc: $localize`:@@projetsProject8Desc:Le site complet d'une praticienne : design, contenu, paiement en ligne et génération de documents PDF.`,
      image: '/assets/images/projects/Louisson-masseuse.webp',
      imageAlt: $localize`:@@projetsProject8ImageAlt:capture — Louison`,
    },
    {
      size: 'small',
      tags: [
        { label: $localize`:@@projetsProject9Tag1:MMO web` },
        { label: $localize`:@@projetsProject9Tag2:Simulation` },
      ],
      title: $localize`:@@projetsProject9Title:Le Jeu des Fourmis`,
      desc: $localize`:@@projetsProject9Desc:MMO myrmécologique : 15 espèces = 15 façons de jouer, monde persistant avec météo et biomes, territoires sur une carte du monde réel en temps réel.`,
      image: '/assets/images/projects/jeu-des-fourmis.webp',
      imageAlt: $localize`:@@projetsProject9ImageAlt:illustration — Le Jeu des Fourmis`,
    },
    {
      size: 'small',
      tags: [
        { label: $localize`:@@projetsProject10Tag1:SSE` },
        { label: $localize`:@@projetsProject10Tag2:LangChain` },
      ],
      title: $localize`:@@projetsProject10Title:Growth Audit`,
      desc: $localize`:@@projetsProject10Desc:Audit SEO en temps réel : l'analyse s'écrit live (streaming SSE), pilotée par BullMQ.`,
      href: '/growth-audit',
      image: '/assets/images/projects/growth-audit.webp',
      imageAlt: $localize`:@@projetsProject10ImageAlt:capture — Growth Audit`,
    },
    {
      size: 'big',
      tags: [{ label: $localize`:@@projetsProject11Tag1:NestJS 11` }],
      title: $localize`:@@projetsProject11Title:Voice IA`,
      desc: $localize`:@@projetsProject11Desc:Assistant vocal Telegram : capture, transcrit et organise les idées vers Notion & Google Calendar.`,
      image: '/assets/images/projects/voice-ia.webp',
      imageAlt: $localize`:@@projetsProject11ImageAlt:illustration — Voice IA`,
    },
    {
      size: 'small',
      tags: [
        { label: $localize`:@@projetsProject12Tag1:Refonte en cours` },
        { label: $localize`:@@projetsProject12Tag2:Réservation en ligne` },
        { label: $localize`:@@projetsProject12Tag3:Migration SEO` },
      ],
      title: $localize`:@@projetsProject12Title:AtlanticBike — location et réparation de vélos`,
      desc: $localize`:@@projetsProject12Desc:Loueur-réparateur sur la côte atlantique : présenter l'activité, structurer l'offre et permettre la réservation en ligne. Demande en 6 étapes dont le devis est recalculé côté serveur uniquement, back-office du parc et de l'atelier, reprise des URL indexées.`,
      image: '/assets/images/projects/Atlanticbike.webp',
      imageAlt: $localize`:@@projetsProject12ImageAlt:capture — AtlanticBike`,
    },
    {
      size: 'small',
      tags: [
        { label: $localize`:@@projetsProject13Tag1:Prototype` },
        { label: $localize`:@@projetsProject13Tag2:Analyse de contenu` },
      ],
      title: $localize`:@@projetsProject13Title:Assistant IA Geev`,
      desc: $localize`:@@projetsProject13Desc:Prototype d'assistant intelligent pour faciliter le tri et l'analyse d'annonces à partir de contenus visuels.`,
      image: '/assets/images/projects/Assistant-IA-Geev.webp',
      imageAlt: $localize`:@@projetsProject13ImageAlt:capture — Assistant IA Geev`,
    },
    {
      size: 'small',
      tags: [
        { label: $localize`:@@projetsProject14Tag1:Projet académique` },
        { label: $localize`:@@projetsProject14Tag2:Modélisation prédictive` },
      ],
      title: $localize`:@@projetsProject14Title:Modélisation prédictive de risques sanitaires`,
      desc: $localize`:@@projetsProject14Desc:Modélisation et analyse de données visant à anticiper l'apparition de risques sanitaires à partir de données épidémiologiques.`,
      image: '/assets/images/projects/Modélisation-prédictive-risques-sanitaires.webp',
      imageAlt: $localize`:@@projetsProject14ImageAlt:capture — Modélisation prédictive de risques sanitaires`,
    },
  ];

  // --- Bandeau méthode (le fil rouge) --------------------------------------

  /** Sur-titre mono du bandeau méthode. */
  protected readonly methodKicker = $localize`:@@projetsMethodKicker:Le fil rouge`;

  /**
   * Quatre étapes du fil rouge (verbatim maquette) : Clarifier / Construire /
   * Tester / Évoluer, déclinées en Comprendre / Déployer / Éprouver / Faire
   * durer.
   */
  protected readonly methodSteps: readonly AsiliMethodStep[] = [
    {
      num: '01',
      index: $localize`:@@projetsMethodStep1Index:— Clarifier`,
      title: $localize`:@@projetsMethodStep1Title:Comprendre`,
      desc: $localize`:@@projetsMethodStep1Desc:Cartographier le besoin réel avant tout.`,
    },
    {
      num: '02',
      index: $localize`:@@projetsMethodStep2Index:— Construire`,
      title: $localize`:@@projetsMethodStep2Title:Déployer`,
      desc: $localize`:@@projetsMethodStep2Desc:Des outils robustes, dimensionnés juste.`,
    },
    {
      num: '03',
      index: $localize`:@@projetsMethodStep3Index:— Tester`,
      title: $localize`:@@projetsMethodStep3Title:Éprouver`,
      desc: $localize`:@@projetsMethodStep3Desc:Confronter à l'usage, mesurer, ajuster.`,
    },
    {
      num: '04',
      index: $localize`:@@projetsMethodStep4Index:— Évoluer`,
      title: $localize`:@@projetsMethodStep4Title:Faire durer`,
      desc: $localize`:@@projetsMethodStep4Desc:L'outil grandit avec vous.`,
    },
  ];

  // --- Bande CTA ------------------------------------------------------------

  /** Sur-titre de la bande CTA. */
  protected readonly ctaKicker = $localize`:@@projetsCtaKicker:Un projet en tête ?`;

  /** Titre de la bande CTA. */
  protected readonly ctaTitle = $localize`:@@projetsCtaTitle:Racontez-moi votre situation. On verra ce qui mérite d'être construit.`;

  /** CTA primaire de la bande. */
  protected readonly ctaPrimary = $localize`:@@projetsCtaPrimary:Démarrer la conversation`;

  /** CTA secondaire de la bande. */
  protected readonly ctaSecondary = $localize`:@@projetsCtaSecondary:Explorer l'Atelier`;
}
