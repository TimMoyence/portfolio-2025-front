import { InjectionToken } from "@angular/core";
import type { Observable } from "rxjs";
import type {
  BudgetCategoryModel,
  BudgetEntryModel,
  BudgetGroup,
  BudgetSummary,
  CreateBudgetCategoryPayload,
  CreateBudgetEntryPayload,
  CreateRecurringEntryPayload,
  ImportBudgetEntriesPayload,
  RecurringEntryModel,
  ShareBudgetPayload,
  UpdateRecurringEntryPayload,
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
}

export const BUDGET_PORT = new InjectionToken<BudgetPort>("BUDGET_PORT");
