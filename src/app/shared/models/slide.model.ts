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
}
