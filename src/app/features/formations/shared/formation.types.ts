import type { PresentationSlide } from "../../../shared/models/slide.model";

/**
 * Niveaux de difficulte d'une formation, consommes par le schema Course
 * et utilises pour filtrer le hub. Valeurs alignees sur les conventions
 * schema.org `educationalLevel`.
 */
export type FormationLevel = "beginner" | "intermediate" | "advanced";

/**
 * Categories fonctionnelles. Sert pour le filtrage dans le hub et la
 * coloration des OG images generees. Etendre prudemment pour eviter
 * l'inflation de palette.
 */
export type FormationCategory =
  | "ia"
  | "seo"
  | "automation"
  | "marketing"
  | "dev";

/**
 * Statut de publication : controle l'indexation SEO et l'apparition dans
 * le hub. `draft` sert a preparer une formation sans la publier.
 */
export type FormationStatus = "draft" | "published" | "archived";

/**
 * Chaîne localisee minimale (fr/en). On reste strict pour imposer la
 * presence d'une traduction explicite par locale et eviter les fallbacks
 * silencieux qui cassent l'AEO multilangue.
 */
export interface I18nString {
  fr: string;
  en: string;
}

/**
 * Metadonnees d'identification et SEO d'une formation. La description
 * doit respecter 134-167 mots (contrainte AEO : longueur extraction-ready
 * pour ChatGPT/Perplexity/Google AI Overviews).
 */
export interface FormationMetadata {
  /** Titre complet affiche en `<h1>` et `<title>` */
  title: I18nString;
  /** Description 134-167 mots, sert meta description + TL;DR AEO */
  description: I18nString;
  /** Pitch court utilise dans la carte du hub */
  tagline: I18nString;
  /** Duree ISO 8601 (ex: "PT30M") pour Course.timeRequired */
  duration: string;
  /** Niveau schema.org */
  level: FormationLevel;
  /** Categorie fonctionnelle pour filtrage et palette */
  category: FormationCategory;
  /** Mots-cles SEO. Le 1er element est la cle canonique */
  tags: string[];
  /** Slug de l'icone (reutilise SvgIconComponent) */
  iconSlug: string;
  /** URL absolue vers l'image hero (1200x630 recommandee pour OG) */
  heroImage: string;
  /** Alt text hero, indispensable a l'accessibilite */
  heroImageAlt: I18nString;
  /** Date de publication initiale ISO 8601 */
  publishDate: string;
  /** Date de derniere modification ISO 8601 — pilote freshness */
  lastModified: string;
  /** Statut de publication */
  status: FormationStatus;
}

/**
 * Configuration d'une interaction quiz optionnelle servie dans le
 * scrollytelling pour personnaliser le toolkit livre. Une formation
 * peut ne pas avoir de quiz si la personnalisation est assuree via les
 * interactions `self-rating` ou `checklist` existantes dans les slides.
 */
export interface QuizQuestion {
  id: string;
  question: I18nString;
  kind: "single-choice" | "multi-choice" | "free-text";
  options?: Array<{ value: string; label: I18nString }>;
  /** Champ du profil d'interaction alimente par la reponse */
  profileField: string;
}

export interface QuizConfig {
  /** Cle utilisee pour tracer les evenements analytiques */
  id: string;
  questions: QuizQuestion[];
}

/**
 * Configuration du lead magnet associe a une formation. `enabled: false`
 * permet d'exposer une formation purement consultative sans capture.
 */
export interface FormationLeadMagnet {
  enabled: boolean;
  /** Identifiant du template PDF (cf. ToolkitHtmlRenderer back) */
  pdfTemplateId: string;
  /** Identifiant de la sequence drip email (cf. DripMailer back) */
  emailDripId: string;
  /** Axes de personnalisation consommes par ToolkitContentAssembler */
  customizationAxes: ReadonlyArray<"sector" | "aiLevel" | "budget">;
}

/**
 * Une question / reponse de la FAQ de formation. Restituee en JSON-LD
 * FAQPage et en composant visuel sur la page `faq` annexe.
 */
export interface FormationFaqEntry {
  question: I18nString;
  /** Reponse de 50-100 mots (AEO-friendly extraction) */
  answer: I18nString;
}

/**
 * Metadonnees purement SEO : outcomes pedagogiques, prerequis, FAQ.
 * Injectes automatiquement dans le schema Course et la page FAQ.
 */
export interface FormationSeo {
  /** Mots-cles additionnels (les tags principaux sont dans metadata) */
  keywords: string[];
  /** Prerequis schema.org `coursePrerequisites` */
  prerequisites: I18nString[];
  /** Objectifs pedagogiques, cle du champ `teaches` schema.org */
  teaches: I18nString[];
  /** Type de ressource pedagogique schema.org */
  learningResourceType: "Course" | "Workshop" | "Tutorial";
  /** FAQ dediee — min 5 entrees recommandees pour maximiser AEO */
  faq: FormationFaqEntry[];
}

/**
 * Call-to-action mis en avant sur la formation (fin d'acte, header, etc.).
 * `trackingId` sert au batch d'evenements analytiques.
 */
export interface FormationCta {
  labelKey: string;
  href: string;
  trackingId: string;
}

export interface FormationConversion {
  primary: FormationCta;
  secondary?: FormationCta;
}

export interface FormationAnalyticsConfig {
  /** Prefixe des evenements (`formation_ia_view_slide`, etc.) */
  eventPrefix: string;
  trackProgress: boolean;
  trackInteractions: boolean;
}

/**
 * Configuration complete d'une formation. Source unique de verite
 * importee dans `formations.registry.ts`. Un nouveau fichier
 * `{slug}.config.ts` suffit pour creer une formation — la route
 * `formations/:slug` et ses pages annexes sont generees automatiquement.
 */
export interface FormationConfig {
  /** Version du schema config — bumper lors de breaking changes */
  readonly configVersion: 1;
  /** Slug utilise dans l'URL `formations/<slug>` — unique globalement */
  readonly slug: string;
  metadata: FormationMetadata;
  /** Slides typees par `PresentationSlide` du shared module */
  slides: PresentationSlide[];
  quiz?: QuizConfig;
  leadMagnet: FormationLeadMagnet;
  seo: FormationSeo;
  conversion: FormationConversion;
  analytics: FormationAnalyticsConfig;
}

/**
 * Regex ISO 8601 duration stricte. Accepte `PT30M`, `PT1H`, `PT1H30M`,
 * `PT45S` — rejette `PT30Mblah`, `P30M` ou `PT`. Au moins un composant
 * (H/M/S) est requis.
 */
const ISO8601_DURATION = /^PT(?:\d+H)?(?:\d+M)?(?:\d+S)?$/;
const ISO8601_DURATION_NONEMPTY = /^PT(?:\d+H|\d+M|\d+S)(?:\d+H|\d+M|\d+S)*$/;

/**
 * Garde-fou runtime : valide les invariants d'une FormationConfig avant
 * son enregistrement dans la registry. Releve les incoherences qui ne
 * sont pas capturees par le systeme de types (longueurs minimales, tags
 * non vides, durations ISO valides, coherence publishDate <= lastModified,
 * URLs absolues). Throw un `TypeError` avec un message diagnostic qui
 * precise le slug fautif.
 */
export const assertValidFormationConfig = (config: FormationConfig): void => {
  const fail = (reason: string): never => {
    throw new TypeError(
      `[FormationConfig:${config.slug}] invalid configuration — ${reason}`,
    );
  };

  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(config.slug)) {
    fail("slug must be kebab-case (alpha-numeric with optional dashes)");
  }
  if (config.slides.length === 0) {
    fail("slides must not be empty");
  }
  if (
    !ISO8601_DURATION.test(config.metadata.duration) ||
    !ISO8601_DURATION_NONEMPTY.test(config.metadata.duration)
  ) {
    fail(
      `metadata.duration "${config.metadata.duration}" must be ISO 8601 (e.g. PT30M)`,
    );
  }
  if (config.metadata.tags.length === 0) {
    fail("metadata.tags must contain at least the primary keyword");
  }
  if (!/^https?:\/\//.test(config.metadata.heroImage)) {
    fail("metadata.heroImage must be an absolute http(s) URL");
  }
  const publishDate = Date.parse(config.metadata.publishDate);
  const lastModified = Date.parse(config.metadata.lastModified);
  if (Number.isNaN(publishDate)) {
    fail(
      `metadata.publishDate "${config.metadata.publishDate}" is not a valid ISO 8601 date`,
    );
  }
  if (Number.isNaN(lastModified)) {
    fail(
      `metadata.lastModified "${config.metadata.lastModified}" is not a valid ISO 8601 date`,
    );
  }
  if (publishDate > lastModified) {
    fail("metadata.publishDate must be <= metadata.lastModified");
  }
  if (config.seo.faq.length < 5) {
    fail(
      `seo.faq currently has ${config.seo.faq.length} entries — require >= 5 for AEO FAQPage signals`,
    );
  }
  if (config.seo.teaches.length === 0) {
    fail("seo.teaches must declare at least one learning outcome");
  }
  if (config.leadMagnet.enabled) {
    if (!config.leadMagnet.pdfTemplateId) {
      fail("leadMagnet.pdfTemplateId must be set when leadMagnet.enabled");
    }
    if (!config.leadMagnet.emailDripId) {
      fail("leadMagnet.emailDripId must be set when leadMagnet.enabled");
    }
    if (config.leadMagnet.customizationAxes.length === 0) {
      fail(
        "leadMagnet.customizationAxes must declare at least one axis when leadMagnet.enabled",
      );
    }
  }
};
