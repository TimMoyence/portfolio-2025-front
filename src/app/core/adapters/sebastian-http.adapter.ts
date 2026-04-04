import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import type { Observable } from "rxjs";
import { APP_CONFIG } from "../config/app-config.token";
import type {
  CreateEntryPayload,
  CreateGoalPayload,
  SebastianCategory,
  SebastianEntry,
  SebastianGoal,
  SebastianStats,
  SebastianStatsPeriod,
} from "../models/sebastian.model";
import type { SebastianPort } from "../ports/sebastian.port";

/**
 * Adaptateur HTTP pour le port Sebastian.
 * Communique avec les endpoints `/sebastian/*` du backend NestJS.
 * Utilise l'URL dediee `external.sebastianUrl` de la configuration.
 */
@Injectable()
export class SebastianHttpAdapter implements SebastianPort {
  private readonly baseUrl = inject(APP_CONFIG).external.sebastianUrl;
  private readonly http = inject(HttpClient);

  /** Ajoute une entree de consommation. */
  addEntry(payload: CreateEntryPayload): Observable<SebastianEntry> {
    return this.http.post<SebastianEntry>(`${this.baseUrl}/entries`, payload);
  }

  /** Recupere les entrees, avec filtres optionnels. */
  getEntries(params?: {
    from?: string;
    to?: string;
    category?: SebastianCategory;
  }): Observable<SebastianEntry[]> {
    let httpParams = new HttpParams();
    if (params?.from) httpParams = httpParams.set("from", params.from);
    if (params?.to) httpParams = httpParams.set("to", params.to);
    if (params?.category)
      httpParams = httpParams.set("category", params.category);
    return this.http.get<SebastianEntry[]>(`${this.baseUrl}/entries`, {
      params: httpParams,
    });
  }

  /** Supprime une entree par son identifiant. */
  deleteEntry(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/entries/${id}`);
  }

  /** Recupere les statistiques agregees pour une periode. */
  getStats(period: SebastianStatsPeriod): Observable<SebastianStats> {
    const params = new HttpParams().set("period", period);
    return this.http.get<SebastianStats>(`${this.baseUrl}/stats`, { params });
  }

  /** Definit un objectif de consommation. */
  setGoal(payload: CreateGoalPayload): Observable<SebastianGoal> {
    return this.http.post<SebastianGoal>(`${this.baseUrl}/goals`, payload);
  }

  /** Recupere tous les objectifs actifs. */
  getGoals(): Observable<SebastianGoal[]> {
    return this.http.get<SebastianGoal[]>(`${this.baseUrl}/goals`);
  }

  /** Supprime un objectif par son identifiant. */
  deleteGoal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/goals/${id}`);
  }
}
