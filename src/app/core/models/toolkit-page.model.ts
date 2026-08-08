export interface ToolkitPageData {
  recap: {
    firstName: string;
    aiLevel: string | null;
    sector: string | null;
    budgetTier: string | null;
  };
  cheatsheet: CheatsheetEntry[];
  prompts: PromptEntry[];
  workflows: WorkflowEntry[];
  templates: TemplateEntry[];
  generatedPrompt: string | null;
}

interface CheatsheetEntry {
  tool: string;
  category: string;
  price: string;
  url: string;
  tip: string;
  decision: string;
  alreadyUsed: boolean;
}

interface PromptEntry {
  category: string;
  title: string;
  level: string;
  prompt: string;
  tool: string;
  description?: string;
  example?: string;
  tip?: string;
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
  monthlyCost: string;
  steps: WorkflowStep[];
  tools: string[];
}

interface TemplateEntry {
  name: string;
  platform: string;
  url: string;
  description: string;
  minBudget: string;
}
