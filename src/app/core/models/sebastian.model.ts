/** Categorie de consommation Sebastian. */
export type SebastianCategory = "alcohol" | "coffee";

/** Unite de mesure par categorie. */
export type SebastianUnit = "standard_drink" | "cup";

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
}

/** Payload pour creer un objectif. */
export interface CreateGoalPayload {
  category: SebastianCategory;
  targetQuantity: number;
  period: SebastianPeriod;
}
