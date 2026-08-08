export type SebastianCategory = 'alcohol' | 'coffee';

type SebastianUnit = 'standard_drink' | 'cup';

export type SebastianDrinkType =
  | 'beer'
  | 'wine'
  | 'champagne'
  | 'coffee'
  | 'cocktail'
  | 'spiritueux'
  | 'cidre';

export type SebastianPeriod = 'daily' | 'weekly' | 'monthly';

export type SebastianStatsPeriod = 'week' | 'month' | 'year';

export interface SebastianEntry {
  id: string;
  userId: string;
  category: SebastianCategory;
  quantity: number;
  unit: SebastianUnit;
  date: string;
  notes: string | null;
  createdAt: string;
  drinkType: SebastianDrinkType | null;
  alcoholDegree: number | null;
  volumeCl: number | null;
  consumedAt: string | null;
}

export interface SebastianGoal {
  id: string;
  userId: string;
  category: SebastianCategory;
  targetQuantity: number;
  period: SebastianPeriod;
  isActive: boolean;
  createdAt: string;
}

interface SebastianCategoryStat {
  category: SebastianCategory;
  total: number;
  average: number;
  trend: number;
}

export interface SebastianStats {
  byCategory: SebastianCategoryStat[];
  period: SebastianStatsPeriod;
}

export interface CreateEntryPayload {
  category: SebastianCategory;
  quantity: number;
  date: string;
  notes?: string;
  drinkType?: SebastianDrinkType;
  alcoholDegree?: number;
  volumeCl?: number;
  consumedAt?: string;
}

export interface SebastianBacDataPoint {
  time: string;
  bac: number;
}

export interface SebastianBacResult {
  currentBac: number;
  curve: SebastianBacDataPoint[];
  estimatedSoberAt: string | null;
  legalLimit: number;
}

export interface SebastianProfile {
  weightKg: number;
  widmarkR: number;
}

export interface CreateGoalPayload {
  category: SebastianCategory;
  targetQuantity: number;
  period: SebastianPeriod;
}

export type SebastianTrendPeriod = '7d' | '30d';

export type SebastianReportPeriod = 'week' | 'month' | 'quarter';

interface SebastianTrendDataPoint {
  date: string;
  alcohol: number;
  coffee: number;
}

interface SebastianTrendObjectives {
  alcohol: number;
  coffee: number;
}

interface SebastianTrendSummary {
  avgAlcohol: number;
  avgCoffee: number;
}

export interface SebastianTrendData {
  period: SebastianTrendPeriod;
  dataPoints: SebastianTrendDataPoint[];
  objectives: SebastianTrendObjectives;
  summary: SebastianTrendSummary;
}

interface SebastianScoreBreakdown {
  goalAdherence: number;
  trendBonus?: number;
  streakBonus?: number;
}

interface SebastianStreaks {
  alcohol: number;
  coffee: number;
}

export interface SebastianHealthScore {
  score: number;
  phase: 1 | 2 | 3;
  breakdown: SebastianScoreBreakdown;
  streaks: SebastianStreaks;
  message: string;
}

export interface SebastianBadgeStatus {
  key: string;
  name: string;
  description: string;
  category: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface SebastianDayDistribution {
  dayOfWeek: number;
  alcohol: number;
  coffee: number;
}

export interface SebastianHeatmapPoint {
  date: string;
  alcohol: number;
  coffee: number;
  combined: number;
}

export interface SebastianPeriodReport {
  period: SebastianReportPeriod;
  startDate: string;
  endDate: string;
  totals: { alcohol: number; coffee: number };
  dailyAvg: { alcohol: number; coffee: number };
  best: { date: string; score: number };
  worst: { date: string; score: number };
  comparison: { alcoholDelta: number; coffeeDelta: number };
  distribution: SebastianDayDistribution[];
  heatmap: SebastianHeatmapPoint[];
}
