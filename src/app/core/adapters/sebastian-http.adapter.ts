import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config.token';
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
import type { SebastianPort } from '../ports/sebastian.port';

@Injectable()
export class SebastianHttpAdapter implements SebastianPort {
  private readonly baseUrl = inject(APP_CONFIG).external.sebastianUrl;
  private readonly http = inject(HttpClient);

  addEntry(payload: CreateEntryPayload): Observable<SebastianEntry> {
    return this.http.post<SebastianEntry>(`${this.baseUrl}/entries`, payload);
  }

  getEntries(params?: {
    from?: string;
    to?: string;
    category?: SebastianCategory;
  }): Observable<SebastianEntry[]> {
    let httpParams = new HttpParams();
    if (params?.from) httpParams = httpParams.set('from', params.from);
    if (params?.to) httpParams = httpParams.set('to', params.to);
    if (params?.category) httpParams = httpParams.set('category', params.category);
    return this.http.get<SebastianEntry[]>(`${this.baseUrl}/entries`, {
      params: httpParams,
    });
  }

  deleteEntry(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/entries/${id}`);
  }

  getStats(period: SebastianStatsPeriod): Observable<SebastianStats> {
    const params = new HttpParams().set('period', period);
    return this.http.get<SebastianStats>(`${this.baseUrl}/stats`, { params });
  }

  setGoal(payload: CreateGoalPayload): Observable<SebastianGoal> {
    return this.http.post<SebastianGoal>(`${this.baseUrl}/goals`, payload);
  }

  getGoals(): Observable<SebastianGoal[]> {
    return this.http.get<SebastianGoal[]>(`${this.baseUrl}/goals`);
  }

  deleteGoal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/goals/${id}`);
  }

  getTrends(period: SebastianTrendPeriod): Observable<SebastianTrendData> {
    return this.http.get<SebastianTrendData>(`${this.baseUrl}/stats/trends`, {
      params: { period },
    });
  }

  getHealthScore(): Observable<SebastianHealthScore> {
    return this.http.get<SebastianHealthScore>(`${this.baseUrl}/stats/health-score`);
  }

  getBadges(): Observable<SebastianBadgeStatus[]> {
    return this.http.get<SebastianBadgeStatus[]>(`${this.baseUrl}/badges`);
  }

  getPeriodReport(
    period: SebastianReportPeriod,
    startDate: string,
  ): Observable<SebastianPeriodReport> {
    return this.http.get<SebastianPeriodReport>(`${this.baseUrl}/stats/report`, {
      params: { period, startDate },
    });
  }

  getBac(): Observable<SebastianBacResult> {
    return this.http.get<SebastianBacResult>(`${this.baseUrl}/bac`);
  }

  getProfile(): Observable<SebastianProfile> {
    return this.http.get<SebastianProfile>(`${this.baseUrl}/profile`);
  }

  setProfile(payload: SebastianProfile): Observable<SebastianProfile> {
    return this.http.post<SebastianProfile>(`${this.baseUrl}/profile`, payload);
  }
}
