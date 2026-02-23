import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsSummary } from '../../models/analytics.models';

@Component({
  selector: 'app-analytics-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-detail.html',
  styleUrl: './analytics-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsDetailComponent implements OnInit, OnDestroy {
  summary: AnalyticsSummary | null = null;
  apiName = '';
  loading = true;
  errorMessage = '';

  // Chart bar data derived from summary
  latencyBars: { label: string; value: number; maxValue: number; color: string }[] = [];
  
  private loadSub?: Subscription;
  private paramSub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly analyticsService: AnalyticsService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to route parameters to catch both initial load and route changes
    this.paramSub = this.route.paramMap.subscribe(params => {
      const name = params.get('apiName');
      console.log('Raw route param:', name);
      console.log('All route params:', params.keys.map(k => ({ [k]: params.get(k) })));
      
      if (name && name !== 'undefined' && name.trim()) {
        this.apiName = decodeURIComponent(name.trim());
        console.log('Decoded apiName:', this.apiName);
        this.cdr.markForCheck();
        this.loadData();
      } else {
        this.errorMessage = 'No valid API name provided. Please go back and select an API.';
        this.loading = false;
        console.error('Invalid apiName:', name);
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
    this.loadSub?.unsubscribe();
  }

  loadData(): void {
    if (!this.apiName || this.apiName === 'undefined') {
      console.error('Cannot load data: apiName is', this.apiName);
      this.errorMessage = 'API name is not set';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.summary = null;
    this.cdr.markForCheck();

    console.log('Loading data for API:', this.apiName);

    this.loadSub = this.analyticsService.getSummaryByApi(this.apiName).subscribe({
      next: (data) => {
        console.log('Raw summary from backend:', data);
        
        // Map 'path' field to 'apiName' if it exists
        const mappedData = {
          ...data,
          apiName: data.apiName || (data as any).path || this.apiName
        };
        
        console.log('Mapped summary:', mappedData);
        this.summary = mappedData;
        this.buildLatencyBars(mappedData);
        this.loading = false;
        this.errorMessage = '';
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load summary:', err);
        this.errorMessage = `Could not load analytics for: ${this.apiName}. ${err.message || err.statusText || 'Http failure response'}`;
        this.summary = null;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  buildLatencyBars(s: AnalyticsSummary): void {
    const max = Math.max(s.avgLatencyMs, s.p95LatencyMs, s.p99LatencyMs, 1);
    this.latencyBars = [
      { label: 'Avg Latency',  value: s.avgLatencyMs,  maxValue: max, color: '#667eea' },
      { label: 'P95 Latency',  value: s.p95LatencyMs,  maxValue: max, color: '#f59e0b' },
      { label: 'P99 Latency',  value: s.p99LatencyMs,  maxValue: max, color: '#ef4444' },
    ];
  }

  getBarWidth(value: number, max: number): string {
    return `${Math.min((value / max) * 100, 100)}%`;
  }

  getHealthStatus(s: AnalyticsSummary): { label: string; cssClass: string; icon: string } {
    if (s.errorRate > 10 || s.p95LatencyMs > 1000) {
      return { label: 'Critical', cssClass: 'status-critical', icon: '🔴' };
    }
    if (s.errorRate > 5 || s.p95LatencyMs > 500) {
      return { label: 'Warning',  cssClass: 'status-warning',  icon: '🟡' };
    }
    return { label: 'Healthy', cssClass: 'status-healthy', icon: '🟢' };
  }

  getRecommendations(s: AnalyticsSummary): string[] {
    const tips: string[] = [];
    if (s.p95LatencyMs > 800)  tips.push('⚡ P95 latency is high — consider adding Redis caching to reduce DB hits.');
    if (s.errorRate > 5)       tips.push('🛡️ Error rate exceeds 5% — review logs and consider adding rate limiting.');
    if (s.totalRequests > 1000) tips.push('📈 High traffic detected — consider horizontal scaling or load balancing.');
    if (s.avgLatencyMs > 500)  tips.push('🔍 Average latency is elevated — profile slow queries and add DB indexes.');
    if (tips.length === 0)     tips.push('✅ All metrics look healthy. Keep monitoring for changes.');
    return tips;
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}