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
  /** Source(s) vérifiable(s) affichée(s) en mode scroll uniquement. */
  sources?: { label: string; url: string }[];
  /** Note éditoriale de l'auteur, visible en mode scroll uniquement. */
  authorNote?: string;
  /** Contrôle la visibilité de la slide selon le mode d'affichage. Par défaut 'both'. */
  visibility?: "both" | "presentOnly" | "scrollOnly";
}

/** Slide enrichie avec acte typé et support fragments pour le moteur de présentation */
export interface PresentationSlide extends Slide {
  act: Act;
  /** Nombre d'éléments révélés progressivement (0 = tout visible d'un coup) */
  fragmentCount: number;
}
