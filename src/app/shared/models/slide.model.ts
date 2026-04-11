export interface SlideTable {
  headers: string[];
  rows: string[][];
}

export interface PromptTemplate {
  label: string;
  placeholder: string;
  template: string;
}

export type SlideLayout =
  | "hero"
  | "split"
  | "stats"
  | "grid"
  | "comparison"
  | "quote"
  | "demo"
  | "cta";

export interface SlideStat {
  value: string;
  label: string;
  source?: string;
}

export interface SlideGridItem {
  title: string;
  description: string;
  image?: string;
  badge?: string;
}

/** Mode d'affichage du moteur de présentation. */
export type PresentationMode = "scroll" | "present" | "overview";

/** Acte narratif regroupant des slides dans une présentation */
export interface Act {
  id: string;
  label: string;
}

export interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  bullets?: string[];
  table?: SlideTable;
  image?: string;
  imageUrl?: string;
  imageAlt?: string;
  notes?: string;
  promptTemplate?: PromptTemplate;
  layout?: SlideLayout;
  stats?: SlideStat[];
  gridItems?: SlideGridItem[];
  quote?: string;
  quoteAuthor?: string;
  lottie?: string;
  /** Identifiant de l'acte narratif (string simple, ou Act typé via PresentationSlide) */
  act?: string | Act;
  /** Notes pour le présentateur (non affichées au public, distinctes de `notes`) */
  speakerNotes?: string;
  /** Contrôle la visibilité de la slide selon le mode d'affichage. Par défaut 'both'. */
  visibility?: "both" | "presentOnly" | "scrollOnly";
}

// ── Interactions mode Present (présentateur clique, audience regarde l'écran) ──

/** Sondage à main levée — le présentateur clique pour compter les votes */
export interface PollInteraction {
  type: "poll";
  question: string;
  options: string[];
  /** Autorise la sélection de plusieurs options (défaut: false) */
  multiSelect?: boolean;
}

/** Compte à rebours — pause dramatique avant de continuer */
export interface CountdownInteraction {
  type: "countdown";
  label: string;
  durationSeconds: number;
}

export type PresentInteraction = PollInteraction | CountdownInteraction;

// ── Interactions mode Scroll (le lecteur interagit seul, à son rythme) ──

/** Question ouverte introspective */
export interface ReflectionInteraction {
  type: "reflection";
  question: string;
  placeholder: string;
  rows?: number;
}

/** Checklist interactive — "lesquels utilisez-vous deja ?" */
export interface ChecklistInteraction {
  type: "checklist";
  question: string;
  items: string[];
  /** Sous-titre explicatif affiché sous la question */
  hint?: string;
  /** Champ du profil d'interaction a alimenter avec les items coches */
  profileField?: string;
}

/** Échelle d'auto-évaluation (slider ou radio) */
export interface SelfRatingInteraction {
  type: "self-rating";
  question: string;
  min: number;
  max: number;
  labels: { min: string; max: string };
  /** Sous-titre explicatif affiché sous la question */
  hint?: string;
  /** Champ du profil d'interaction a alimenter avec la valeur selectionnee */
  profileField?: string;
}

export type ScrollInteraction =
  | ReflectionInteraction
  | ChecklistInteraction
  | SelfRatingInteraction;

/** Interactions par mode, servies par le backend et attachées à chaque slide */
export interface SlideInteractions {
  present?: PresentInteraction[];
  scroll?: ScrollInteraction[];
}

/** Slide enrichie avec acte typé et support fragments pour le moteur de présentation */
export interface PresentationSlide extends Slide {
  act: Act;
  /** Nombre d'éléments révélés progressivement (0 = tout visible d'un coup) */
  fragmentCount: number;
  /** Interactions par mode — present (présentateur) et scroll (lecteur) */
  interactions?: SlideInteractions;
}
