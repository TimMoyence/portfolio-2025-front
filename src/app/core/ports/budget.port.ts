import { InjectionToken } from "@angular/core";
import type { Observable } from "rxjs";
import type {
  BudgetCategoryModel,
  BudgetEntryModel,
  BudgetGroup,
  BudgetSummary,
  CreateBudgetCategoryPayload,
  CreateBudgetEntryPayload,
  ImportBudgetEntriesPayload,
  ShareBudgetPayload,
} from "../models/budget.model";

/** Port d'acces aux donnees du budget partage. */
export interface BudgetPort {
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
  shareBudget(
    payload: ShareBudgetPayload,
  ): Observable<{ shared: true; userId: string }>;
}

export const BUDGET_PORT = new InjectionToken<BudgetPort>("BUDGET_PORT");
