import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import type { Observable } from "rxjs";
import { APP_CONFIG } from "../config/app-config.token";
import type {
  CreateEntryPayload,
  CreateGoalPayload,
  SebastianBacResult,
  SebastianBadgeStatus,
  SebastianCategory,
  SebastianEntry,
  SebastianGoal,
  SebastianHealthScore,
  SebastianPeriodReport,
  SebastianProfile,
  SebastianReportPeriod,
  SebastianStats,
  SebastianStatsPeriod,
  SebastianTrendData,
  SebastianTrendPeriod,
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

  /** Recupere les donnees de tendance pour une periode. */
  getTrends(period: SebastianTrendPeriod): Observable<SebastianTrendData> {
    return this.http.get<SebastianTrendData>(`${this.baseUrl}/stats/trends`, {
      params: { period },
    });
  }

  /** Recupere le score de sante. */
  getHealthScore(): Observable<SebastianHealthScore> {
    return this.http.get<SebastianHealthScore>(
      `${this.baseUrl}/stats/health-score`,
    );
  }

  /** Recupere les badges et leur statut. */
  getBadges(): Observable<SebastianBadgeStatus[]> {
    return this.http.get<SebastianBadgeStatus[]>(`${this.baseUrl}/badges`);
  }

  /** Recupere un rapport de periode. */
  getPeriodReport(
    period: SebastianReportPeriod,
    startDate: string,
  ): Observable<SebastianPeriodReport> {
    return this.http.get<SebastianPeriodReport>(
      `${this.baseUrl}/stats/report`,
      { params: { period, startDate } },
    );
  }

  /** Recupere le taux d'alcoolemie actuel. */
  getBac(): Observable<SebastianBacResult> {
    return this.http.get<SebastianBacResult>(`${this.baseUrl}/bac`);
  }

  /** Recupere le profil BAC. */
  getProfile(): Observable<SebastianProfile> {
    return this.http.get<SebastianProfile>(`${this.baseUrl}/profile`);
  }

  /** Definit le profil BAC. */
  setProfile(payload: SebastianProfile): Observable<SebastianProfile> {
    return this.http.post<SebastianProfile>(`${this.baseUrl}/profile`, payload);
  }
}
