import type {
  SebastianBadgeStatus,
  SebastianEntry,
  SebastianGoal,
  SebastianHealthScore,
  SebastianPeriodReport,
  SebastianStats,
  SebastianTrendData,
} from "../../app/core/models/sebastian.model";
import type { SebastianPort } from "../../app/core/ports/sebastian.port";

/**
 * Construit un objet SebastianEntry avec des valeurs par defaut.
 * Accepte des surcharges partielles pour les cas de test specifiques.
 */
export function buildSebastianEntry(
  overrides?: Partial<SebastianEntry>,
): SebastianEntry {
  return {
    id: "entry-1",
    userId: "user-1",
    category: "coffee",
    quantity: 1,
    unit: "cup",
    date: "2026-04-04",
    notes: null,
    createdAt: "2026-04-04T08:00:00.000Z",
    ...overrides,
  };
}

/**
 * Construit un objet SebastianGoal avec des valeurs par defaut.
 * Accepte des surcharges partielles pour les cas de test specifiques.
 */
export function buildSebastianGoal(
  overrides?: Partial<SebastianGoal>,
): SebastianGoal {
  return {
    id: "goal-1",
    userId: "user-1",
    category: "coffee",
    targetQuantity: 3,
    period: "daily",
    isActive: true,
    createdAt: "2026-04-01T00:00:00.000Z",
    ...overrides,
  };
}

/**
 * Construit un objet SebastianStats avec des valeurs par defaut.
 * Accepte des surcharges partielles pour les cas de test specifiques.
 */
export function buildSebastianStats(
  overrides?: Partial<SebastianStats>,
): SebastianStats {
  return {
    period: "week",
    byCategory: [
      {
        category: "coffee",
        total: 14,
        average: 2,
        trend: -10,
      },
      {
        category: "alcohol",
        total: 4,
        average: 0.57,
        trend: 5,
      },
    ],
    ...overrides,
  };
}

/**
 * Construit un objet SebastianTrendData avec des valeurs par defaut.
 * Accepte des surcharges partielles pour les cas de test specifiques.
 */
export function buildSebastianTrendData(
  overrides?: Partial<SebastianTrendData>,
): SebastianTrendData {
  return {
    period: "7d",
    dataPoints: [
      { date: "2026-03-30", alcohol: 1, coffee: 2 },
      { date: "2026-03-31", alcohol: 0, coffee: 3 },
    ],
    objectives: { alcohol: 2, coffee: 3 },
    summary: { avgAlcohol: 0.5, avgCoffee: 2.5 },
    ...overrides,
  };
}

/**
 * Construit un objet SebastianHealthScore avec des valeurs par defaut.
 * Accepte des surcharges partielles pour les cas de test specifiques.
 */
export function buildSebastianHealthScore(
  overrides?: Partial<SebastianHealthScore>,
): SebastianHealthScore {
  return {
    score: 72,
    phase: 2,
    breakdown: { goalAdherence: 60, trendBonus: 8, streakBonus: 4 },
    streaks: { alcohol: 3, coffee: 5 },
    message: "Bonne progression, continuez !",
    ...overrides,
  };
}

/**
 * Construit un objet SebastianBadgeStatus avec des valeurs par defaut.
 * Accepte des surcharges partielles pour les cas de test specifiques.
 */
export function buildSebastianBadgeStatus(
  overrides?: Partial<SebastianBadgeStatus>,
): SebastianBadgeStatus {
  return {
    key: "first-entry",
    name: "Premiere entree",
    description: "Enregistrer sa premiere consommation",
    category: "onboarding",
    unlocked: true,
    unlockedAt: "2026-04-01T10:00:00.000Z",
    ...overrides,
  };
}

/**
 * Construit un objet SebastianPeriodReport avec des valeurs par defaut.
 * Accepte des surcharges partielles pour les cas de test specifiques.
 */
export function buildSebastianPeriodReport(
  overrides?: Partial<SebastianPeriodReport>,
): SebastianPeriodReport {
  return {
    period: "week",
    startDate: "2026-03-30",
    endDate: "2026-04-05",
    totals: { alcohol: 4, coffee: 14 },
    dailyAvg: { alcohol: 0.57, coffee: 2 },
    best: { date: "2026-04-01", score: 90 },
    worst: { date: "2026-04-03", score: 45 },
    comparison: { alcoholDelta: -10, coffeeDelta: 5 },
    distribution: [{ dayOfWeek: 1, alcohol: 1, coffee: 2 }],
    heatmap: [{ date: "2026-03-30", alcohol: 1, coffee: 2, combined: 3 }],
    ...overrides,
  };
}

/**
 * Cree un stub complet du port Sebastian avec des spies Jasmine.
 * Chaque methode est un spy independant, non configure par defaut.
 */
export function createSebastianPortStub(): Record<
  keyof SebastianPort,
  jasmine.Spy
> {
  return {
    addEntry: jasmine.createSpy("addEntry"),
    getEntries: jasmine.createSpy("getEntries"),
    deleteEntry: jasmine.createSpy("deleteEntry"),
    getStats: jasmine.createSpy("getStats"),
    setGoal: jasmine.createSpy("setGoal"),
    getGoals: jasmine.createSpy("getGoals"),
    deleteGoal: jasmine.createSpy("deleteGoal"),
    getTrends: jasmine.createSpy("getTrends"),
    getHealthScore: jasmine.createSpy("getHealthScore"),
    getBadges: jasmine.createSpy("getBadges"),
    getPeriodReport: jasmine.createSpy("getPeriodReport"),
  };
}
