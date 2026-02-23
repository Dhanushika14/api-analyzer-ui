import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AnalyticsSummary } from '../models/analytics.models';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAllSummaries(): Observable<AnalyticsSummary[]> {
    return this.http.get<AnalyticsSummary[]>(`${this.apiUrl}/api/analytics/summaries`);
  }

  getSummaryByApi(apiName: string): Observable<AnalyticsSummary> {
    // Send apiName as a query parameter instead of path parameter
    console.log('Fetching summary for:', apiName);
    return this.http.get<AnalyticsSummary>(`${this.apiUrl}/api/analytics/summaries`, {
      params: { path: apiName }
    });
  }
}