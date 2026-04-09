export interface SlideTable {
  headers: string[];
  rows: string[][];
}

export interface PromptTemplate {
  label: string;
  placeholder: string;
  template: string;
}

export interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  bullets?: string[];
  table?: SlideTable;
  visual?: "icon" | "image";
  visualRef?: string;
  emoji?: string;
  accentClass?: string;
  notes?: string;
  promptTemplate?: PromptTemplate;
}
