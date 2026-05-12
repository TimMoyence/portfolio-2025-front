import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import type { Observable } from "rxjs";
import { getApiBaseUrl } from "../http/api-config";
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
import type {
  BudgetPort,
  InvitationPreview,
  PendingInvitation,
  ShareBudgetResponse,
} from "../ports/budget.port";

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

  /** Supprime une entree de budget. */
  deleteEntry(entryId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/budget/entries/${entryId}`);
  }

  /**
   * Partage un budget. Retourne le statut :
   * - `shared` : email cible avait un compte, ajout immediat au groupe.
   * - `already-member` : email cible deja membre (retour silencieux pour eviter
   *   l'enumeration).
   * - `invited` : compte inexistant, invitation magic-link creee + email envoye.
   */
  shareBudget(payload: ShareBudgetPayload): Observable<ShareBudgetResponse> {
    return this.http.post<ShareBudgetResponse>(
      `${this.baseUrl}/budget/share`,
      payload,
    );
  }

  /** Liste les invitations en attente (owner uniquement). */
  listPendingInvitations(
    groupId: string,
  ): Observable<{ invitations: PendingInvitation[] }> {
    return this.http.get<{ invitations: PendingInvitation[] }>(
      `${this.baseUrl}/budget/groups/${groupId}/invitations`,
    );
  }

  /**
   * Preview public d'une invitation a partir du token clair. 404 indistinct
   * pour token inconnu/expire/consomme (anti-enumeration cote backend).
   */
  previewInvitation(token: string): Observable<InvitationPreview> {
    return this.http.get<InvitationPreview>(
      `${this.baseUrl}/auth/invitations/by-token/${encodeURIComponent(token)}`,
    );
  }

  /**
   * Met a jour une categorie. `groupId` (optionnel) est propage au
   * backend pour declencher l'auto-clone d'une categorie par defaut
   * (group_id IS NULL) au lieu de prendre un 403.
   */
  updateCategory(
    categoryId: string,
    payload: Partial<{ budgetLimit: number; groupId: string }>,
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

  /** Liste les membres enrichis d'un groupe budget. */
  getMembers(groupId: string): Observable<BudgetMember[]> {
    return this.http.get<BudgetMember[]>(
      `${this.baseUrl}/budget/groups/${groupId}/members`,
    );
  }

  /** Retire un membre du groupe (owner uniquement). */
  removeMember(groupId: string, userId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/budget/groups/${groupId}/members/${userId}`,
    );
  }

  /** Recupere les contributions pour une periode. */
  getContributions(
    groupId: string,
    month: number,
    year: number,
  ): Observable<BudgetMemberContribution[]> {
    const params = new HttpParams()
      .set("groupId", groupId)
      .set("month", month)
      .set("year", year);
    return this.http.get<BudgetMemberContribution[]>(
      `${this.baseUrl}/budget/contributions`,
      { params },
    );
  }

  /** Upsert ma contribution mensuelle. */
  upsertMyContribution(
    payload: UpsertMyBudgetContributionPayload,
  ): Observable<BudgetMemberContribution> {
    return this.http.put<BudgetMemberContribution>(
      `${this.baseUrl}/budget/contributions`,
      payload,
    );
  }

  /** Liste les objectifs avec progression actuelle. */
  getGoals(
    groupId: string,
    month?: number,
    year?: number,
  ): Observable<BudgetGoalWithProgress[]> {
    let params = new HttpParams().set("groupId", groupId);
    if (month != null) params = params.set("month", month);
    if (year != null) params = params.set("year", year);
    return this.http.get<BudgetGoalWithProgress[]>(
      `${this.baseUrl}/budget/goals`,
      { params },
    );
  }

  /** Cree un objectif. */
  createGoal(
    payload: CreateBudgetGoalPayload,
  ): Observable<BudgetGoalWithProgress> {
    return this.http.post<BudgetGoalWithProgress>(
      `${this.baseUrl}/budget/goals`,
      payload,
    );
  }

  /** Met a jour un objectif. */
  updateGoal(
    id: string,
    payload: UpdateBudgetGoalPayload,
  ): Observable<BudgetGoalWithProgress> {
    return this.http.patch<BudgetGoalWithProgress>(
      `${this.baseUrl}/budget/goals/${id}`,
      payload,
    );
  }

  /** Supprime un objectif. */
  deleteGoal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/budget/goals/${id}`);
  }

  /** Liste les couples (month, year) ou des entrees existent. */
  getEntriesMonths(
    groupId: string,
  ): Observable<Array<{ month: number; year: number }>> {
    const params = new HttpParams().set("groupId", groupId);
    return this.http.get<Array<{ month: number; year: number }>>(
      `${this.baseUrl}/budget/entries/months`,
      { params },
    );
  }
}
