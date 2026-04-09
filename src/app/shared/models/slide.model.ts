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
  image?: string;
  notes?: string;
  promptTemplate?: PromptTemplate;
}
