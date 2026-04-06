import { InjectionToken } from "@angular/core";
import type { Observable } from "rxjs";
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

/** Port d'acces aux donnees du majordome Sebastian. */
export interface SebastianPort {
  /** Ajoute une entree de consommation. */
  addEntry(payload: CreateEntryPayload): Observable<SebastianEntry>;

  /** Recupere les entrees, avec filtres optionnels. */
  getEntries(params?: {
    from?: string;
    to?: string;
    category?: SebastianCategory;
  }): Observable<SebastianEntry[]>;

  /** Supprime une entree par son identifiant. */
  deleteEntry(id: string): Observable<void>;

  /** Recupere les statistiques agregees pour une periode. */
  getStats(period: SebastianStatsPeriod): Observable<SebastianStats>;

  /** Definit un objectif de consommation. */
  setGoal(payload: CreateGoalPayload): Observable<SebastianGoal>;

  /** Recupere tous les objectifs actifs. */
  getGoals(): Observable<SebastianGoal[]>;

  /** Supprime un objectif par son identifiant. */
  deleteGoal(id: string): Observable<void>;

  /** Recupere les donnees de tendance pour une periode. */
  getTrends(period: SebastianTrendPeriod): Observable<SebastianTrendData>;

  /** Recupere le score de sante. */
  getHealthScore(): Observable<SebastianHealthScore>;

  /** Recupere les badges et leur statut. */
  getBadges(): Observable<SebastianBadgeStatus[]>;

  /** Recupere un rapport de periode. */
  getPeriodReport(
    period: SebastianReportPeriod,
    startDate: string,
  ): Observable<SebastianPeriodReport>;

  /** Recupere le taux d'alcoolemie actuel. */
  getBac(): Observable<SebastianBacResult>;

  /** Recupere le profil BAC. */
  getProfile(): Observable<SebastianProfile>;

  /** Definit le profil BAC. */
  setProfile(payload: SebastianProfile): Observable<SebastianProfile>;
}

export const SEBASTIAN_PORT = new InjectionToken<SebastianPort>(
  "SEBASTIAN_PORT",
);
