import type {
  SebastianEntry,
  SebastianGoal,
  SebastianStats,
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
  };
}
