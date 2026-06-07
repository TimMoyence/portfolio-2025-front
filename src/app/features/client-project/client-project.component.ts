import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AsiliCtaBandComponent } from "../../shared/sections";
import { RevealOnScrollDirective } from "../../shared/directives/reveal-on-scroll.directive";

/** Étiquette du hero (ex. « Étude de cas », « 2025 — 2026 »). */
export interface CaseStudyTag {
  /** Libellé affiché dans la puce. */
  readonly label: string;
}

/** Couple clé/valeur de la méta du hero (Rôle, Stack, Secteur, Marchés). */
export interface CaseStudyMeta {
  /** Intitulé (mono, ex. « Rôle »). */
  readonly key: string;
  /** Valeur (ex. « Conception & développement »). */
  readonly value: string;
}

/** Variante d'un visuel d'étude de cas (placeholder rayé tant qu'aucune capture). */
export interface CaseStudyShot {
  /** Texte du placeholder mono (ex. « capture — tableau de bord »). */
  readonly caption: string;
}

/**
 * Bloc narratif labellisé du corps de l'étude (Le problème / La clarté /
 * La solution / La preuve). Le titre peut porter un segment accentué.
 */
export interface CaseStudyBlock {
  /** Sur-titre mono de l'étape (ex. « Le problème »). */
  readonly stepLabel: string;
  /** Début du titre, avant l'accent. */
  readonly titlePre: string;
  /** Segment accentué (italique teal). Optionnel. */
  readonly titleAccent?: string;
  /** Fin du titre, après l'accent. Optionnel. */
  readonly titlePost?: string;
  /**
   * Paragraphes du corps. Chaque paragraphe peut contenir un segment fort,
   * rendu via `strongPre`/`strong`/`strongPost` (pas de HTML brut dans les
   * `$localize`).
   */
  readonly paragraphs: readonly CaseStudyParagraph[];
  /** Liste à puces optionnelle (cases cochées teal). */
  readonly bullets?: readonly string[];
}

/** Paragraphe d'un bloc, avec un éventuel segment fort mis en valeur. */
export interface CaseStudyParagraph {
  /** Texte avant le segment fort. */
  readonly pre: string;
  /** Segment fort (`<strong>`). Optionnel. */
  readonly strong?: string;
  /** Texte après le segment fort. Optionnel. */
  readonly post?: string;
}

/** Chiffre clé du bandeau « scope » (encre, halo teal). */
export interface CaseStudyScope {
  /** Valeur affichée en grand serif (ex. « 455 », « 100% », « OWASP »). */
  readonly n: string;
  /** Légende sous le chiffre. */
  readonly label: string;
}

/** Lien « projet suivant » en bas de l'étude. */
export interface CaseStudyNext {
  /** Intitulé mono (ex. « Projet suivant »). */
  readonly kicker: string;
  /** Libellé du lien (ex. « Musaium — médiation IA »). */
  readonly label: string;
  /** Destination interne (route Angular). */
  readonly href: string;
}

/**
 * Modèle typé d'une étude de cas Asili. Le template `ClientProjectComponent`
 * est piloté par ce modèle pour rester réutilisable : ajouter une étude
 * revient à construire un nouvel objet `CaseStudy` — la structure visuelle
 * (hero → capture → corps narratif → duo → scope → citation → tech → suivant →
 * CTA) ne change pas.
 */
export interface CaseStudy {
  /** Lien de retour vers la liste des projets (libellé + route). */
  readonly back: { readonly label: string; readonly href: string };
  /** Étiquettes du hero (ex. « Étude de cas », « 2025 — 2026 »). */
  readonly tags: readonly CaseStudyTag[];
  /** Sur-titre (nom du projet). */
  readonly kicker: string;
  /** Début du titre du hero, avant l'accent. */
  readonly titlePre: string;
  /** Segment accentué du titre (italique teal). */
  readonly titleAccent: string;
  /** Fin du titre, après l'accent. Optionnel. */
  readonly titlePost?: string;
  /** Accroche sous le titre. */
  readonly lead: string;
  /** Méta du hero (Rôle, Stack, Secteur, Marchés). */
  readonly meta: readonly CaseStudyMeta[];
  /** Capture pleine largeur sous le hero. */
  readonly cover: CaseStudyShot;
  /** Premiers blocs narratifs (Le problème, La clarté). */
  readonly blocksBeforeDuo: readonly CaseStudyBlock[];
  /** Duo de captures inséré au milieu du corps. */
  readonly duo: readonly CaseStudyShot[];
  /** Blocs narratifs après le duo (La solution, La preuve). */
  readonly blocksAfterDuo: readonly CaseStudyBlock[];
  /** Chiffres clés du bandeau « scope ». */
  readonly scope: readonly CaseStudyScope[];
  /** Citation centrale (corps + signataire). */
  readonly quote: {
    readonly pre: string;
    readonly accent: string;
    readonly post: string;
    readonly who: string;
  };
  /** Bloc « sous le capot » (tech). */
  readonly tech: {
    readonly stepLabel: string;
    readonly titlePre: string;
    readonly titleAccent: string;
    readonly titlePost?: string;
    readonly intro: string;
    readonly items: readonly string[];
  };
  /** Lien vers le projet suivant. */
  readonly next: CaseStudyNext;
  /** Bande CTA finale. */
  readonly cta: {
    readonly kicker: string;
    readonly title: string;
    readonly lead: string;
    readonly primaryLabel: string;
    readonly primaryHref: string;
    readonly secondaryLabel: string;
    readonly secondaryHref: string;
  };
}

/**
 * Page « étude de cas » Asili (`/client-project`) — template réutilisable.
 *
 * Restitue la maquette `AsiliNewDesign/client-project.html` (étude ZenFirst
 * Vision) : hero (retour Projets, étiquettes, méta Rôle/Stack/Secteur/Marchés)
 * → capture pleine largeur → corps narratif labellisé (Le problème / La clarté
 * / La solution / La preuve) → duo de captures → bandeau de chiffres clés →
 * citation → bloc tech « sous le capot » → lien projet suivant (Musaium) →
 * bande CTA (`asili-cta-band`).
 *
 * Le contenu (réalisations authored par l'utilisateur) est repris verbatim de
 * la maquette et fourni en `$localize` (IDs `@@caseStudy*`) ; la traduction EN
 * vit dans les XLF. La page est pilotée par un modèle `CaseStudy` typé : même
 * si une seule étude existe aujourd'hui, la structure est prête à en accueillir
 * d'autres sans dupliquer le template.
 *
 * Standalone, OnPush, SSR-safe : la révélation au scroll passe par `appReveal`
 * (browser-only, fail-open) ; aucun accès `window`/`document` au rendu. Le fond
 * constellation est global (Lot 0, `<app-asili-background>`) : la page ne
 * recrée aucun canvas.
 */
@Component({
  selector: "app-client-project",
  standalone: true,
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RevealOnScrollDirective,
    AsiliCtaBandComponent,
  ],
  templateUrl: "./client-project.component.html",
  styleUrl: "./client-project.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientProjectComponent {
  /**
   * Étude de cas affichée — ZenFirst Vision, reprise verbatim de la maquette
   * `AsiliNewDesign/client-project.html` (réalisation authored par
   * l'utilisateur : titres, descriptions, chiffres et citation tels quels).
   */
  protected readonly study: CaseStudy = {
    back: {
      label: $localize`:@@caseStudyBack:Projets`,
      href: "/projets",
    },
    tags: [
      { label: $localize`:@@caseStudyTag1:Étude de cas` },
      { label: $localize`:@@caseStudyTag2:2025 — 2026` },
    ],
    kicker: $localize`:@@caseStudyKicker:ZenFirst Vision`,
    titlePre: $localize`:@@caseStudyTitlePre:Piloter la rentabilité,`,
    titleAccent: $localize`:@@caseStudyTitleAccent:sans s'y perdre`,
    titlePost: $localize`:@@caseStudyTitlePost:.`,
    lead: $localize`:@@caseStudyLead:Une plateforme de comptabilité intelligente pour la France et le Québec. Un cahier des charges vertigineux — conformité fiscale, sécurité, volumétrie — ramené à une interface que des dirigeants non-comptables comprennent en un coup d'œil.`,
    meta: [
      {
        key: $localize`:@@caseStudyMeta1Key:Rôle`,
        value: $localize`:@@caseStudyMeta1Value:Conception & développement`,
      },
      {
        key: $localize`:@@caseStudyMeta2Key:Stack`,
        value: $localize`:@@caseStudyMeta2Value:React 19 · NestJS · PostgreSQL`,
      },
      {
        key: $localize`:@@caseStudyMeta3Key:Secteur`,
        value: $localize`:@@caseStudyMeta3Value:FinTech · Comptabilité`,
      },
      {
        key: $localize`:@@caseStudyMeta4Key:Marchés`,
        value: $localize`:@@caseStudyMeta4Value:France & Québec`,
      },
    ],
    cover: {
      caption: $localize`:@@caseStudyCoverCaption:capture — tableau de bord ZenFirst Vision`,
    },
    blocksBeforeDuo: [
      {
        stepLabel: $localize`:@@caseStudyProblemLabel:Le problème`,
        titlePre: $localize`:@@caseStudyProblemTitlePre:La comptabilité dit `,
        titleAccent: $localize`:@@caseStudyProblemTitleAccent:quoi`,
        titlePost: $localize`:@@caseStudyProblemTitlePost:. Rarement pourquoi.`,
        paragraphs: [
          {
            pre: $localize`:@@caseStudyProblemP1Pre:Les outils comptables produisent des chiffres exacts — et laissent souvent le dirigeant seul face à leur sens. Où part la marge ? Quel poste dérive ? Que décider ce mois-ci ? Entre l'expert-comptable et le tableur, il manquait une vue qui `,
            strong: $localize`:@@caseStudyProblemP1Strong:relie la donnée à la décision`,
            post: $localize`:@@caseStudyProblemP1Post:.`,
          },
          {
            pre: $localize`:@@caseStudyProblemP2:Le défi technique était à la hauteur de l'ambition : couvrir deux référentiels fiscaux (France et Québec), absorber une volumétrie importante, et tenir un niveau de conformité et de sécurité sans compromis — tout en restant lisible pour un utilisateur non-comptable.`,
          },
        ],
      },
      {
        stepLabel: $localize`:@@caseStudyClarityLabel:La clarté`,
        titlePre: $localize`:@@caseStudyClarityTitle:D'abord cadrer, ensuite coder.`,
        paragraphs: [
          {
            pre: $localize`:@@caseStudyClarityP1:Avant la moindre ligne de code, nous avons cartographié les usages réels : quelles décisions l'outil doit-il éclairer, pour qui, à quel moment. Cette étape a tranché des dizaines de questions de structure en amont — et évité de bâtir des fonctionnalités que personne n'aurait utilisées.`,
          },
        ],
        bullets: [
          $localize`:@@caseStudyClarityBullet1:Modélisation du domaine en Domain-Driven Design — le métier pilote l'architecture, pas l'inverse.`,
          $localize`:@@caseStudyClarityBullet2:Séparation nette des deux référentiels fiscaux, pour faire évoluer l'un sans casser l'autre.`,
          $localize`:@@caseStudyClarityBullet3:Priorisation des écrans par valeur de décision, pas par facilité technique.`,
        ],
      },
    ],
    duo: [
      { caption: $localize`:@@caseStudyDuo1Caption:capture — vue rentabilité` },
      {
        caption: $localize`:@@caseStudyDuo2Caption:capture — rapprochement FEC`,
      },
    ],
    blocksAfterDuo: [
      {
        stepLabel: $localize`:@@caseStudySolutionLabel:La solution`,
        titlePre: $localize`:@@caseStudySolutionTitlePre:Une interface qui `,
        titleAccent: $localize`:@@caseStudySolutionTitleAccent:traduit`,
        titlePost: $localize`:@@caseStudySolutionTitlePost: la finance.`,
        paragraphs: [
          {
            pre: $localize`:@@caseStudySolutionP1:Le cœur du produit : transformer des écritures comptables en signaux lisibles. Des indicateurs de rentabilité en temps réel, des alertes quand un poste dérive, des projections claires. La complexité reste sous le capot ; en surface, on décide.`,
          },
          {
            pre: $localize`:@@caseStudySolutionP2Pre:Côté ingénierie, l'exigence était totale — parce que la confiance, en finance, ne se négocie pas : `,
            strong: $localize`:@@caseStudySolutionP2Strong:Clean Architecture, tests automatisés sur les règles métier critiques, CI/CD complet, durcissement sécurité`,
            post: $localize`:@@caseStudySolutionP2Post:. Un socle fait pour durer et évoluer.`,
          },
        ],
      },
      {
        stepLabel: $localize`:@@caseStudyProofLabel:La preuve`,
        titlePre: $localize`:@@caseStudyProofTitle:Conforme, sécurisé, à l'échelle.`,
        paragraphs: [
          {
            pre: $localize`:@@caseStudyProofP1:La rigueur ne se voit pas à l'écran — elle se mesure dans ce que le produit garantit. Conformité aux référentiels fiscaux, traçabilité des données, robustesse face à la montée en charge : autant de fondations invisibles qui rendent l'outil digne de confiance.`,
          },
        ],
      },
    ],
    scope: [
      {
        n: $localize`:@@caseStudyScope1N:455`,
        label: $localize`:@@caseStudyScope1Label:tables de données structurées`,
      },
      {
        n: $localize`:@@caseStudyScope2N:2`,
        label: $localize`:@@caseStudyScope2Label:référentiels fiscaux : France & Québec`,
      },
      {
        n: $localize`:@@caseStudyScope3N:100%`,
        label: $localize`:@@caseStudyScope3Label:conformité DGFiP · FEC · ANC · RGPD`,
      },
      {
        n: $localize`:@@caseStudyScope4N:OWASP`,
        label: $localize`:@@caseStudyScope4Label:durcissement sécurité de bout en bout`,
      },
    ],
    quote: {
      pre: $localize`:@@caseStudyQuotePre:« La performance d'un outil financier, c'est `,
      accent: $localize`:@@caseStudyQuoteAccent:la confiance`,
      post: $localize`:@@caseStudyQuotePost: qu'il inspire. Et la confiance se construit dans l'invisible : la rigueur, la conformité, la clarté. »`,
      who: $localize`:@@caseStudyQuoteWho:— Tim Moyence · approche de conception`,
    },
    tech: {
      stepLabel: $localize`:@@caseStudyTechLabel:Sous le capot`,
      titlePre: $localize`:@@caseStudyTechTitlePre:L'ingénierie, au service de la `,
      titleAccent: $localize`:@@caseStudyTechTitleAccent:confiance`,
      titlePost: $localize`:@@caseStudyTechTitlePost:.`,
      intro: $localize`:@@caseStudyTechIntro:Un socle moderne et éprouvé, choisi pour la robustesse et la maintenabilité dans la durée — pas pour la mode.`,
      items: [
        "React 19",
        "NestJS",
        "TypeScript",
        "PostgreSQL",
        $localize`:@@caseStudyTechItemDDD:Domain-Driven Design`,
        $localize`:@@caseStudyTechItemClean:Clean Architecture`,
        "TDD",
        "CI/CD",
        "Docker",
        "OWASP",
      ],
    },
    next: {
      kicker: $localize`:@@caseStudyNextKicker:Projet suivant`,
      label: $localize`:@@caseStudyNextLabel:Musaium — médiation IA`,
      href: "/projets",
    },
    cta: {
      kicker: $localize`:@@caseStudyCtaKicker:Un projet ambitieux ?`,
      title: $localize`:@@caseStudyCtaTitle:Les cahiers des charges complexes sont mon terrain de jeu.`,
      lead: $localize`:@@caseStudyCtaLead:Si votre projet a de la profondeur — métier, conformité, échelle — parlons-en. Je commence toujours par clarifier.`,
      primaryLabel: $localize`:@@caseStudyCtaPrimary:Démarrer la conversation`,
      primaryHref: "/contact",
      secondaryLabel: $localize`:@@caseStudyCtaSecondary:Voir tous les projets`,
      secondaryHref: "/projets",
    },
  };
}
