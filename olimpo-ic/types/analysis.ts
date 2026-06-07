export interface AnalysisConfig {
  kiq1_termos: string[];
  kiq1_geo: string;
  kiq1_timeframe: string;
  kiq2_termos: string[];
  kiq2_geo: string;
  kiq2_timeframe: string;
  region_termo: string;
  region_geo: string;
}

export interface TimelinePoint {
  date: string;
  [key: string]: number | string;
}

export interface AnalysisResult {
  summary: {
    kiq1_top_media: string;
    kiq1_top_growth: string;
    kiq2_peak_month: string;
    region_top_city: string;
  };
  kiq1_timeline: TimelinePoint[];
  kiq1_medias: Record<string, number>;
  kiq1_crescimento_pct: Record<string, number>;
  kiq2_sazonal: Record<string, number>;
  kiq2_anual: Record<string, number>;
  kiq2_heatmap: Record<string, Record<string, number>>;
  regioes: Record<string, number>;
  insights_report: string;
  is_demo: boolean;
}

export interface InsightItem {
  id: string;
  type: 'warning' | 'danger' | 'success' | 'info';
  emoji: string;
  title: string;
  message: string;
}

export type SSEEvent =
  | { type: 'progress'; pct: number; message: string }
  | { type: 'done'; result: AnalysisResult }
  | { type: 'error'; message: string };
