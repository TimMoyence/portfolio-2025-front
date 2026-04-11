/** Donnees completes d'une page toolkit privee. */
export interface ToolkitPageData {
  /** Recapitulatif du profil */
  recap: {
    firstName: string;
    aiLevel: string | null;
    sector: string | null;
    budgetTier: string | null;
  };
  /** Tableau recapitulatif des outils presentes */
  cheatsheet: CheatsheetEntry[];
  /** Prompts prets a copier */
  prompts: PromptEntry[];
  /** Workflows automatises a mettre en place */
  workflows: WorkflowEntry[];
  /** Templates reutilisables */
  templates: TemplateEntry[];
  /** Prompt Gamma personnalise genere a partir du secteur */
  generatedPrompt: string | null;
}

/** Entree du tableau recapitulatif des outils. */
export interface CheatsheetEntry {
  tool: string;
  category: string;
  price: string;
  url: string;
  tip: string;
  decision: string;
  alreadyUsed: boolean;
}

/** Prompt pret a copier avec contexte d'utilisation. */
export interface PromptEntry {
  category: string;
  title: string;
  level: string;
  prompt: string;
  tool: string;
}

/** Etape d'un workflow automatise. */
export interface WorkflowStep {
  step: number;
  action: string;
  tool: string;
  detail: string;
}

/** Workflow automatise avec etapes. */
export interface WorkflowEntry {
  title: string;
  description: string;
  setupTime: string;
  monthlyCost: string;
  steps: WorkflowStep[];
  tools: string[];
}

/** Template reutilisable pour un cas d'usage. */
export interface TemplateEntry {
  name: string;
  platform: string;
  url: string;
  description: string;
  minBudget: string;
}
