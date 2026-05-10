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

/** Frequence d'une entree recurrente. */
export type Frequency = "MONTHLY" | "WEEKLY" | "BIWEEKLY";

/** Entree recurrente de budget. */
export interface RecurringEntryModel {
  id: string;
  groupId: string;
  categoryId: string | null;
  description: string;
  amount: number;
  type: BudgetType;
  frequency: Frequency;
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Payload pour creer une entree recurrente. */
export interface CreateRecurringEntryPayload {
  groupId: string;
  categoryId?: string;
  description: string;
  amount: number;
  type: BudgetType;
  frequency: Frequency;
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate: string;
  endDate?: string;
}

/** Payload pour mettre a jour une entree recurrente. */
export interface UpdateRecurringEntryPayload {
  isActive?: boolean;
  description?: string;
  amount?: number;
  frequency?: Frequency;
  dayOfWeek?: number | null;
}

/** Vue lecture d'un membre d'un groupe budget enrichi avec ses infos user. */
export interface BudgetMember {
  userId: string;
  email: string;
  displayName: string;
  isOwner: boolean;
  joinedAt: string;
}

/** Contribution mensuelle d'un membre a un budget partage. */
export interface BudgetMemberContribution {
  id: string;
  groupId: string;
  userId: string;
  month: number;
  year: number;
  monthlySalary: number;
  createdAt: string;
  updatedAt: string;
}

/** Type d'objectif de budget. */
export type BudgetGoalKind = "SAVINGS" | "SPENDING_LIMIT" | "CATEGORY_LIMIT";

/** Objectif de budget (epargne, plafond, plafond categorie). */
export interface BudgetGoal {
  id: string;
  groupId: string;
  createdByUserId: string;
  name: string;
  kind: BudgetGoalKind;
  targetAmount: number;
  categoryId: string | null;
  deadline: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Goal enrichi de la progression actuelle calculee depuis les entries. */
export interface BudgetGoalWithProgress extends BudgetGoal {
  currentAmount: number;
  progressPercent: number;
}

/** Payload pour creer un objectif de budget. */
export interface CreateBudgetGoalPayload {
  groupId: string;
  name: string;
  kind: BudgetGoalKind;
  targetAmount: number;
  categoryId?: string | null;
  deadline?: string | null;
}

/** Payload pour mettre a jour un objectif de budget. */
export interface UpdateBudgetGoalPayload {
  name?: string;
  kind?: BudgetGoalKind;
  targetAmount?: number;
  categoryId?: string | null;
  deadline?: string | null;
  isActive?: boolean;
}

/** Payload pour upsert ma contribution mensuelle. */
export interface UpsertMyBudgetContributionPayload {
  groupId: string;
  month: number;
  year: number;
  monthlySalary: number;
}
