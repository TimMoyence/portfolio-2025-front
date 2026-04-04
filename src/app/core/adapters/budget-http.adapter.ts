import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import type { Observable } from "rxjs";
import { getApiBaseUrl } from "../http/api-config";
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
import type { BudgetPort } from "../ports/budget.port";

/**
 * Adaptateur HTTP pour le port budget.
 * Communique avec les endpoints `/budget/*` du backend NestJS.
 */
@Injectable()
export class BudgetHttpAdapter implements BudgetPort {
  private readonly baseUrl = getApiBaseUrl();

  constructor(private readonly http: HttpClient) {}

  /** Recupere les groupes de budget du user connecte. */
  getGroups(): Observable<BudgetGroup[]> {
    return this.http.get<BudgetGroup[]>(`${this.baseUrl}/budget/groups`);
  }

  /** Cree un nouveau groupe de budget. */
  createGroup(name: string): Observable<BudgetGroup> {
    return this.http.post<BudgetGroup>(`${this.baseUrl}/budget/groups`, {
      name,
    });
  }

  /** Cree une entree de budget. */
  createEntry(payload: CreateBudgetEntryPayload): Observable<BudgetEntryModel> {
    return this.http.post<BudgetEntryModel>(
      `${this.baseUrl}/budget/entries`,
      payload,
    );
  }

  /** Recupere les entrees filtrees. */
  getEntries(
    groupId: string,
    params?: { month?: number; year?: number; category?: string },
  ): Observable<BudgetEntryModel[]> {
    let httpParams = new HttpParams().set("groupId", groupId);
    if (params?.month) httpParams = httpParams.set("month", params.month);
    if (params?.year) httpParams = httpParams.set("year", params.year);
    if (params?.category)
      httpParams = httpParams.set("category", params.category);
    return this.http.get<BudgetEntryModel[]>(`${this.baseUrl}/budget/entries`, {
      params: httpParams,
    });
  }

  /** Recupere le resume mensuel. */
  getSummary(
    groupId: string,
    month: number,
    year: number,
  ): Observable<BudgetSummary> {
    const params = new HttpParams()
      .set("groupId", groupId)
      .set("month", month)
      .set("year", year);
    return this.http.get<BudgetSummary>(`${this.baseUrl}/budget/summary`, {
      params,
    });
  }

  /** Importe des entrees depuis un CSV. */
  importEntries(
    payload: ImportBudgetEntriesPayload,
  ): Observable<BudgetEntryModel[]> {
    return this.http.post<BudgetEntryModel[]>(
      `${this.baseUrl}/budget/entries/import`,
      payload,
    );
  }

  /** Cree une categorie personnalisee. */
  createCategory(
    payload: CreateBudgetCategoryPayload,
  ): Observable<BudgetCategoryModel> {
    return this.http.post<BudgetCategoryModel>(
      `${this.baseUrl}/budget/categories`,
      payload,
    );
  }

  /** Recupere les categories (defaut + custom du groupe). */
  getCategories(groupId: string): Observable<BudgetCategoryModel[]> {
    const params = new HttpParams().set("groupId", groupId);
    return this.http.get<BudgetCategoryModel[]>(
      `${this.baseUrl}/budget/categories`,
      { params },
    );
  }

  /** Met a jour la categorie d'une entree. */
  updateEntry(
    entryId: string,
    categoryId: string | null,
  ): Observable<BudgetEntryModel> {
    return this.http.patch<BudgetEntryModel>(
      `${this.baseUrl}/budget/entries/${entryId}`,
      { categoryId },
    );
  }

  /** Partage le budget avec un autre utilisateur. */
  shareBudget(
    payload: ShareBudgetPayload,
  ): Observable<{ shared: true; userId: string }> {
    return this.http.post<{ shared: true; userId: string }>(
      `${this.baseUrl}/budget/share`,
      payload,
    );
  }

  /** Met a jour une categorie (ex: budgetLimit). */
  updateCategory(
    categoryId: string,
    payload: Partial<{ budgetLimit: number }>,
  ): Observable<BudgetCategoryModel> {
    return this.http.patch<BudgetCategoryModel>(
      `${this.baseUrl}/budget/categories/${categoryId}`,
      payload,
    );
  }

  /** Exporte le budget en PDF. */
  exportPdf(groupId: string, month: number, year: number): Observable<Blob> {
    const params = new HttpParams()
      .set("groupId", groupId)
      .set("month", month)
      .set("year", year);
    return this.http.get(`${this.baseUrl}/budget/export/pdf`, {
      params,
      responseType: "blob",
    });
  }

  /** Recupere les entrees recurrentes d'un groupe. */
  getRecurringEntries(groupId: string): Observable<RecurringEntryModel[]> {
    const params = new HttpParams().set("groupId", groupId);
    return this.http.get<RecurringEntryModel[]>(
      `${this.baseUrl}/budget/recurring-entries`,
      { params },
    );
  }

  /** Cree une entree recurrente. */
  createRecurringEntry(
    payload: CreateRecurringEntryPayload,
  ): Observable<RecurringEntryModel> {
    return this.http.post<RecurringEntryModel>(
      `${this.baseUrl}/budget/recurring-entries`,
      payload,
    );
  }

  /** Supprime une entree recurrente. */
  deleteRecurringEntry(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/budget/recurring-entries/${id}`,
    );
  }

  /** Met a jour une entree recurrente. */
  updateRecurringEntry(
    id: string,
    payload: UpdateRecurringEntryPayload,
  ): Observable<RecurringEntryModel> {
    return this.http.patch<RecurringEntryModel>(
      `${this.baseUrl}/budget/recurring-entries/${id}`,
      payload,
    );
  }
}
