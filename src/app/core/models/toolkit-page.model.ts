export interface ToolkitPageData {
  recap: {
    firstName: string;
  };
  cheatsheet: CheatsheetEntry[];
  prompts: PromptEntry[];
  workflows: WorkflowEntry[];
  templates: TemplateEntry[];
}

interface CheatsheetEntry {
  tool: string;
  category: string;
  price: string;
  url: string;
  tip: string;
  decision: string;
}

interface PromptEntry {
  category: string;
  title: string;
  level: 'debutant' | 'intermediaire' | 'avance';
  prompt: string;
  tool: string;
  description: string;
  example: string;
  tip: string;
}

interface WorkflowStep {
  step: number;
  action: string;
  tool: string;
  detail: string;
}

interface WorkflowEntry {
  title: string;
  description: string;
  setupTime: string;
  monthlyCost: number;
  steps: WorkflowStep[];
  tools: string[];
}

interface TemplateEntry {
  name: string;
  platform: string;
  url: string;
  description: string;
  minBudget: number;
}
