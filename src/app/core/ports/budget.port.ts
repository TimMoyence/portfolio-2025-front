import { InjectionToken } from "@angular/core";
import type { Observable } from "rxjs";
import type {
  BudgetCategoryModel,
  BudgetEntryModel,
  BudgetGoalWithProgress,
  BudgetGroup,
  BudgetMember,
  BudgetMemberContribution,
  BudgetSummary,
  CreateBudgetCategoryPayload,
  CreateBudgetEntryPayload,
  CreateBudgetGoalPayload,
  CreateRecurringEntryPayload,
  ImportBudgetEntriesPayload,
  RecurringEntryModel,
  ShareBudgetPayload,
  UpdateBudgetGoalPayload,
  UpdateRecurringEntryPayload,
  UpsertMyBudgetContributionPayload,
} from "../models/budget.model";

/** Port d'acces aux donnees du budget partage. */
export interface BudgetPort {
  /** Recupere les groupes de budget du user connecte. */
  getGroups(): Observable<BudgetGroup[]>;
  createGroup(name: string): Observable<BudgetGroup>;
  createEntry(payload: CreateBudgetEntryPayload): Observable<BudgetEntryModel>;
  getEntries(
    groupId: string,
    params?: { month?: number; year?: number; category?: string },
  ): Observable<BudgetEntryModel[]>;
  getSummary(
    groupId: string,
    month: number,
    year: number,
  ): Observable<BudgetSummary>;
  importEntries(
    payload: ImportBudgetEntriesPayload,
  ): Observable<BudgetEntryModel[]>;
  createCategory(
    payload: CreateBudgetCategoryPayload,
  ): Observable<BudgetCategoryModel>;
  getCategories(groupId: string): Observable<BudgetCategoryModel[]>;
  /** Met a jour la categorie d'une entree. */
  updateEntry(
    entryId: string,
    categoryId: string | null,
  ): Observable<BudgetEntryModel>;
  shareBudget(
    payload: ShareBudgetPayload,
  ): Observable<{ shared: true; userId: string }>;
  /** Supprime une entree de budget. */
  deleteEntry(entryId: string): Observable<void>;
  /** Met a jour une categorie (ex: budgetLimit). */
  updateCategory(
    categoryId: string,
    payload: Partial<{ budgetLimit: number }>,
  ): Observable<BudgetCategoryModel>;
  /** Exporte le budget en PDF. */
  exportPdf(groupId: string, month: number, year: number): Observable<Blob>;
  /** Recupere les entrees recurrentes d'un groupe. */
  getRecurringEntries(groupId: string): Observable<RecurringEntryModel[]>;
  /** Cree une entree recurrente. */
  createRecurringEntry(
    payload: CreateRecurringEntryPayload,
  ): Observable<RecurringEntryModel>;
  /** Supprime une entree recurrente. */
  deleteRecurringEntry(id: string): Observable<void>;
  /** Met a jour une entree recurrente. */
  updateRecurringEntry(
    id: string,
    payload: UpdateRecurringEntryPayload,
  ): Observable<RecurringEntryModel>;
  /** Liste les membres enrichis d'un groupe budget. */
  getMembers(groupId: string): Observable<BudgetMember[]>;
  /** Retire un membre du groupe (owner uniquement). */
  removeMember(groupId: string, userId: string): Observable<void>;
  /** Recupere les contributions du groupe pour une periode. */
  getContributions(
    groupId: string,
    month: number,
    year: number,
  ): Observable<BudgetMemberContribution[]>;
  /** Upsert ma contribution mensuelle (le userId est extrait du JWT cote backend). */
  upsertMyContribution(
    payload: UpsertMyBudgetContributionPayload,
  ): Observable<BudgetMemberContribution>;
  /** Liste les objectifs d'un groupe avec progression actuelle. */
  getGoals(
    groupId: string,
    month?: number,
    year?: number,
  ): Observable<BudgetGoalWithProgress[]>;
  /** Cree un nouvel objectif de budget. */
  createGoal(
    payload: CreateBudgetGoalPayload,
  ): Observable<BudgetGoalWithProgress>;
  /** Met a jour un objectif. */
  updateGoal(
    id: string,
    payload: UpdateBudgetGoalPayload,
  ): Observable<BudgetGoalWithProgress>;
  /** Supprime un objectif. */
  deleteGoal(id: string): Observable<void>;
  /** Liste les couples (month, year) ou des entrees existent dans le groupe. */
  getEntriesMonths(
    groupId: string,
  ): Observable<Array<{ month: number; year: number }>>;
}

export const BUDGET_PORT = new InjectionToken<BudgetPort>("BUDGET_PORT");
