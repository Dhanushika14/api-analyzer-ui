import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { interval, Subscription, finalize } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { AnalyticsService } from '../../services/analytics.service';
import { AuthService } from '../../services/auth.service';
import { AnalyticsSummary } from '../../models/analytics.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  summaries: AnalyticsSummary[] = [];
  loading = true;
  errorMessage = '';
  lastRefreshed = new Date();
  private refreshSub?: Subscription;
  private initialLoadSub?: Subscription;

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Initial load
    this.loadData();
    
    // Auto-refresh every 10 seconds starting AFTER initial load
    this.refreshSub = interval(10000).pipe(
      switchMap(() => this.analyticsService.getAllSummaries()),
      tap(data => {
        // Map 'path' field to 'apiName' for consistency
        const processedData = (data || []).map((item: any) => {
          const apiName = item.path || item.apiName || item.name || 'Unknown';
          return {
            ...item,
            apiName: apiName
          };
        });
        this.summaries = processedData;
        this.lastRefreshed = new Date();
        this.cdr.markForCheck();
      }),
      finalize(() => this.cdr.markForCheck())
    ).subscribe({
      error: (err) => {
        console.error('Auto-refresh error:', err);
        this.errorMessage = 'Failed to refresh analytics';
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.initialLoadSub?.unsubscribe();
    this.refreshSub?.unsubscribe();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();
  
    this.initialLoadSub = this.analyticsService.getAllSummaries().pipe(
      tap(data => {
        console.log('Raw backend response:', data);
        
        // Backend returns 'path' field, not 'apiName'
        // Map the 'path' field to 'apiName'
        const processedData = (data || []).map((item: any) => {
          const apiName = item.path || item.apiName || item.name || 'Unknown';
          console.log(`Processing item - path: "${item.path}" -> apiName: "${apiName}"`);
          return {
            ...item,
            apiName: apiName  // Map 'path' to 'apiName' for the UI
          };
        });
        
        console.log('Processed summaries with apiName:', processedData);
        this.summaries = processedData;
        this.loading = false;
        this.lastRefreshed = new Date();
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      error: (err) => {
        console.error('Failed to load analytics:', err);
        this.errorMessage = `Failed to load analytics: ${err.message || err.statusText || 'Unknown error'}`;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  viewDetail(apiName: string): void {
    if (!apiName) {
      console.error('Cannot navigate: apiName is empty', apiName);
      return;
    }
    const encoded = encodeURIComponent(apiName);
    console.log('Navigating to API detail:', { original: apiName, encoded });
    this.router.navigate(['/analytics', encoded]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getStatusColor(errorRate: number): string {
    if (errorRate > 10) return 'status-red';
    if (errorRate > 5) return 'status-yellow';
    return 'status-green';
  }

  getLatencyStatus(p95: number): string {
    if (p95 > 1000) return 'status-red';
    if (p95 > 500) return 'status-yellow';
    return 'status-green';
  }
}
