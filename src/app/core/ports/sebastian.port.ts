import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
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
} from '../models/sebastian.model';

export interface SebastianPort {
  addEntry(payload: CreateEntryPayload): Observable<SebastianEntry>;

  getEntries(params?: {
    from?: string;
    to?: string;
    category?: SebastianCategory;
  }): Observable<SebastianEntry[]>;

  deleteEntry(id: string): Observable<void>;

  getStats(period: SebastianStatsPeriod): Observable<SebastianStats>;

  setGoal(payload: CreateGoalPayload): Observable<SebastianGoal>;

  getGoals(): Observable<SebastianGoal[]>;

  deleteGoal(id: string): Observable<void>;

  getTrends(period: SebastianTrendPeriod): Observable<SebastianTrendData>;

  getHealthScore(): Observable<SebastianHealthScore>;

  getBadges(): Observable<SebastianBadgeStatus[]>;

  getPeriodReport(
    period: SebastianReportPeriod,
    startDate: string,
  ): Observable<SebastianPeriodReport>;

  getBac(): Observable<SebastianBacResult>;

  getProfile(): Observable<SebastianProfile>;

  setProfile(payload: SebastianProfile): Observable<SebastianProfile>;
}

export const SEBASTIAN_PORT = new InjectionToken<SebastianPort>('SEBASTIAN_PORT');
