/** Type de budget : fixe ou variable. */
export type BudgetType = "FIXED" | "VARIABLE";

/** Groupe de budget partage entre utilisateurs. */
export interface BudgetGroup {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

/** Categorie de budget (defaut ou custom). */
export interface BudgetCategoryModel {
  id: string;
  groupId: string | null;
  name: string;
  color: string;
  icon: string;
  budgetType: BudgetType;
  budgetLimit: number;
  displayOrder: number;
}

/** Entree (transaction) de budget. */
export interface BudgetEntryModel {
  id: string;
  groupId: string;
  createdByUserId: string;
  categoryId: string | null;
  date: string;
  description: string;
  amount: number;
  type: BudgetType;
  state: string;
  createdAt: string;
}

/** Resume mensuel du budget. */
export interface BudgetSummary {
  totalExpenses: number;
  totalIncoming: number;
  byCategory: BudgetCategorySummary[];
}

/** Ligne de resume par categorie. */
export interface BudgetCategorySummary {
  categoryId: string | null;
  categoryName: string;
  total: number;
  budgetLimit: number;
  remaining: number;
}

/** Payload pour creer une entree. */
export interface CreateBudgetEntryPayload {
  groupId: string;
  categoryId?: string;
  date: string;
  description: string;
  amount: number;
  type: BudgetType;
  state?: string;
}

/** Payload pour importer des entrees CSV. */
export interface ImportBudgetEntriesPayload {
  groupId: string;
  csvContent: string;
}

/** Payload pour creer une categorie. */
export interface CreateBudgetCategoryPayload {
  groupId: string;
  name: string;
  color?: string;
  icon?: string;
  budgetType: BudgetType;
  budgetLimit?: number;
}

/** Payload pour partager un budget. */
export interface ShareBudgetPayload {
  groupId: string;
  targetEmail: string;
}
