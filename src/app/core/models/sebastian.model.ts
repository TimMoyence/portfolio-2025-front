/** Categorie de consommation Sebastian. */
export type SebastianCategory = "alcohol" | "coffee";

/** Unite de mesure par categorie. */
export type SebastianUnit = "standard_drink" | "cup";

/** Type de boisson pour le suivi v2. */
export type SebastianDrinkType =
  | "beer"
  | "wine"
  | "champagne"
  | "coffee"
  | "cocktail"
  | "spiritueux"
  | "cidre";

/** Periode pour les objectifs. */
export type SebastianPeriod = "daily" | "weekly" | "monthly";

/** Periode pour les statistiques agregees. */
export type SebastianStatsPeriod = "week" | "month" | "year";

/** Entree de consommation. */
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

/** Objectif de consommation. */
export interface SebastianGoal {
  id: string;
  userId: string;
  category: SebastianCategory;
  targetQuantity: number;
  period: SebastianPeriod;
  isActive: boolean;
  createdAt: string;
}

/** Statistique par categorie. */
export interface SebastianCategoryStat {
  category: SebastianCategory;
  total: number;
  average: number;
  /** Pourcentage de variation par rapport a la periode precedente. */
  trend: number;
}

/** Resultat des statistiques agregees. */
export interface SebastianStats {
  byCategory: SebastianCategoryStat[];
  period: SebastianStatsPeriod;
}

/** Payload pour creer une entree. */
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

/** Point de la courbe BAC. */
export interface SebastianBacDataPoint {
  time: string;
  bac: number;
}

/** Resultat du calcul BAC. */
export interface SebastianBacResult {
  currentBac: number;
  curve: SebastianBacDataPoint[];
  estimatedSoberAt: string | null;
  legalLimit: number;
}

/** Profil utilisateur pour le calcul BAC. */
export interface SebastianProfile {
  weightKg: number;
  widmarkR: number;
}

/** Payload pour creer un objectif. */
export interface CreateGoalPayload {
  category: SebastianCategory;
  targetQuantity: number;
  period: SebastianPeriod;
}

/** Periode pour les tendances. */
export type SebastianTrendPeriod = "7d" | "30d";

/** Periode pour les rapports. */
export type SebastianReportPeriod = "week" | "month" | "quarter";

/** Point de donnee pour les courbes de tendance. */
export interface SebastianTrendDataPoint {
  date: string;
  alcohol: number;
  coffee: number;
}

/** Objectifs journaliers derives. */
export interface SebastianTrendObjectives {
  alcohol: number;
  coffee: number;
}

/** Resume des tendances. */
export interface SebastianTrendSummary {
  avgAlcohol: number;
  avgCoffee: number;
}

/** Donnees de tendance pour les courbes. */
export interface SebastianTrendData {
  period: SebastianTrendPeriod;
  dataPoints: SebastianTrendDataPoint[];
  objectives: SebastianTrendObjectives;
  summary: SebastianTrendSummary;
}

/** Decomposition du score de sante. */
export interface SebastianScoreBreakdown {
  goalAdherence: number;
  trendBonus?: number;
  streakBonus?: number;
}

/** Streaks par categorie. */
export interface SebastianStreaks {
  alcohol: number;
  coffee: number;
}

/** Score de sante. */
export interface SebastianHealthScore {
  score: number;
  phase: 1 | 2 | 3;
  breakdown: SebastianScoreBreakdown;
  streaks: SebastianStreaks;
  message: string;
}

/** Statut d'un badge. */
export interface SebastianBadgeStatus {
  key: string;
  name: string;
  description: string;
  category: string;
  unlocked: boolean;
  unlockedAt?: string;
}

/** Distribution par jour de semaine. */
export interface SebastianDayDistribution {
  dayOfWeek: number;
  alcohol: number;
  coffee: number;
}

/** Point du heatmap. */
export interface SebastianHeatmapPoint {
  date: string;
  alcohol: number;
  coffee: number;
  combined: number;
}

/** Rapport de periode. */
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
