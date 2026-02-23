export interface AnalyticsSummary {
    apiName: string;
    totalRequests: number;
    errorRate: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    lastUpdated?: string;
  }